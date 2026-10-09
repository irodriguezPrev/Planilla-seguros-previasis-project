import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import { X509Certificate } from 'node:crypto';

import type { QuoteRateInfo } from '../interfaces';
import { BCV_RATE_TTL_MS, BCV_RATE_TIMEOUT_MS } from '../config/bcv-rate.config';
import { parseBcvRate } from './bcv-rate.parser';

/**
 * Cliente del Banco Central de Venezuela. **Solo servidor**: este módulo nunca
 * debe importarse desde un componente cliente (usa `node:https`).
 *
 * ## Por qué existe este archivo
 *
 * Tres obstáculos impiden pedir la tasa desde el navegador:
 *
 * 1. **Sin cabecera CORS** → el fetch del navegador es rechazado.
 * 2. **Cadena de certificados rota**: el servidor presenta como intermedio
 *    `Sectigo RSA Domain Validation Secure Server CA`, pero el certificado
 *    hoja está emitido por `Sectigo Public Server Authentication CA DV R36`.
 * 3. **Una reescritura de Next.js no puede inyectar un `ca` personalizado.**
 *
 * Por eso la tasa se solicita desde una Route Handler (`app/api/quote-rate`).
 *
 * ## La solución usada
 *
 * En vez de degradar la seguridad con `rejectUnauthorized: false`, se
 * descarga el issuer correcto desde un canal fiable (HTTP plano, sin TLS) y se
 * añade al almacén de CAs junto a las raíces del sistema. La verificación
 * sigue siendo estricta: un certificado firmado por cualquier otra CA sigue
 * siendo rechazado.
 *
 * El issuer es válido hasta 2036; el certificado hoja vence el 20/11/2026 y
 * su renovación podría exigir actualizar `BCV_ISSUER_URL`.
 */
const BCV_URL = 'https://bcv.org.ve/';
const BCV_ISSUER_URL = 'http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt';

/** Máxima antigüedad de una tasa cacheada que aún se pueda reusar tras un fallo. */
const MAX_STALE_MS = 24 * 60 * 60 * 1000;
/** Tras fallar, cuánto tarda el issuer en volver a intentarse. */
const ISSUER_RETRY_MS = 30 * 60 * 1000;

let issuerPem: string | null = null;
let issuerInFlight: Promise<string | null> | null = null;
let issuerFailedAt = 0;

let cachedRate: QuoteRateInfo | null = null;
let cachedAt = 0;

/* -------------------------------------------------------------------------- */
/* HTTP básico                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * GET con timeout, redirecciones y CA opcional.
 *
 * Devuelve **bytes crudos**: el issuer llega en DER binario y pasar por UTF-8
 * lo corrompería, así que la conversión a texto se hace fuera.
 */
function requestBuffer(url: string, ca?: string[], redirectDepth = 0): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (redirectDepth > 3) {
      reject(new Error('Demasiadas redirecciones'));
      return;
    }

    const transport = url.startsWith('https:') ? https : http;
    const req = transport.get(
      url,
      { timeout: BCV_RATE_TIMEOUT_MS, ...(ca ? { ca } : {}) },
      (res) => {
        // `statusCode` vive en la respuesta; `location` en las cabeceras.
        const statusCode = res.statusCode ?? 0;
        const location = res.headers.location;

        if (statusCode >= 300 && statusCode < 400 && location) {
          res.resume();
          resolve(requestBuffer(new URL(location, url).toString(), ca, redirectDepth + 1));
          return;
        }

        if (statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );

    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Tiempo de espera agotado')));
  });
}

async function requestText(url: string, ca?: string[]): Promise<string> {
  return (await requestBuffer(url, ca)).toString('utf8');
}

/* -------------------------------------------------------------------------- */
/* Issuer de Sectigo                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Descarga el issuer y lo convierte de DER a PEM.
 *
 * El servidor responde con certificado DER binario; `X509Certificate` lo
 * entiende directamente y `.toString()` devuelve el PEM que espera `ca`.
 */
async function getIssuerPem(): Promise<string | null> {
  if (issuerPem) return issuerPem;
  if (issuerInFlight) return issuerInFlight;
  if (issuerFailedAt && Date.now() - issuerFailedAt < ISSUER_RETRY_MS) return null;

  issuerInFlight = (async () => {
    try {
      const der = await requestBuffer(BCV_ISSUER_URL);
      issuerPem = new X509Certificate(der).toString();
      return issuerPem;
    } catch {
      issuerFailedAt = Date.now();
      return null;
    } finally {
      issuerInFlight = null;
    }
  })();

  return issuerInFlight;
}

/* -------------------------------------------------------------------------- */
/* API pública                                                                 */
/* -------------------------------------------------------------------------- */

/** Descarta la tasa cacheada. Solo para pruebas. */
export function resetBcvRateCache(): void {
  cachedRate = null;
  cachedAt = 0;
}

/**
 * Obtiene y parsea la tasa Bs/USD del BCV.
 *
 * Devuelve `null` cuando no hay ningún valor defendible. Ante un fallo se
 * reutiliza la última tasa buena solo si tiene menos de 24 h; pasado ese
 * plazo se prefiere no cotizar a publicar una cifra caducada.
 */
export async function fetchBcvRate(): Promise<QuoteRateInfo | null> {
  if (cachedRate && Date.now() - cachedAt < BCV_RATE_TTL_MS) return cachedRate;

  try {
    const issuer = await getIssuerPem();
    // `ca` reemplaza el almacén por defecto, así que hay que re-incluir las
    // raíces del sistema; si no, se rompería la verificación de todo lo demás.
    // `ca` sustituye el almacén por defecto: hay que re-incluir las raíces
    // del sistema, o Node no encontraría la raíz que emitió el intermediate.
    const ca = issuer ? [...tls.rootCertificates, issuer] : undefined;
    const html = await requestText(BCV_URL, ca);
    const parsed = parseBcvRate(html);

    if (parsed) {
      cachedRate = parsed;
      cachedAt = Date.now();
    }

    return parsed;
  } catch {
    const isUsable = cachedRate !== null && Date.now() - cachedAt < MAX_STALE_MS;
    return isUsable ? cachedRate : null;
  }
}
