import type { QuoteRateInfo } from '../interfaces';
import { BCV_RATE_TTL_MS } from '../config/bcv-rate.config';
import { getFallbackRate } from './bcv-rate.parser';

/**
 * Cliente de la tasa de cambio.
 *
 * El widget nunca habla con el BCV directamente: el navegador no puede
 * (CORS) y el certificado de ese sitio tiene la cadena rota. Habla con la
 * ruta interna `/api/quote-rate`, que encapsula ambos problemas.
 *
 * Puerto desacoplable: para llevar el cotizador a otro sitio basta con
 * reemplazar esta función; el resto del módulo solo conoce su firma.
 */

interface CachedRate {
  info: QuoteRateInfo;
  fetchedAt: number;
}

let cached: CachedRate | null = null;
let inFlight: Promise<QuoteRateInfo | null> | null = null;

/** Restablece el estado de caché. Solo para pruebas. */
export function resetQuoteRateCache(): void {
  cached = null;
  inFlight = null;
}

export async function fetchQuoteRate(force = false): Promise<QuoteRateInfo | null> {
  const now = Date.now();

  if (!force && cached && now - cached.fetchedAt < BCV_RATE_TTL_MS) {
    return cached.info;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch('/api/quote-rate', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = (await response.json()) as { rate?: number; date?: string; source?: string };

      if (typeof payload.rate !== 'number' || !Number.isFinite(payload.rate)) {
        throw new Error('Tasa inválida');
      }

      const info: QuoteRateInfo = {
        rate: payload.rate,
        date: typeof payload.date === 'string' ? payload.date : '',
        source: payload.source === 'fallback' ? 'fallback' : 'BCV',
      };

      cached = { info, fetchedAt: Date.now() };
      return info;
    } catch {
      // Sin tasa en vivo se recurre a la configurada. Si tampoco existe,
      // se devuelve null y la moneda en Bolívares queda deshabilitada:
      // preferimos no cotizar a cotizar mal.
      return getFallbackRate();
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
