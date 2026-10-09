import { NextResponse } from 'next/server';

import { fetchBcvRate } from '@/features/quote/services/bcv-rate.fetch';
import { getFallbackRate } from '@/features/quote/services/bcv-rate.parser';
import { BCV_RATE_TTL_MS } from '@/features/quote/config/bcv-rate.config';

/**
 * `GET /api/quote-rate` — tasa Bs/USD del Banco Central de Venezuela.
 *
 * Existe porque el navegador no puede pedirla directamente: el BCV no envía
 * cabeceras CORS y su cadena TLS es inválida (ver `bcv-rate.fetch.ts` para el
 * detalle y la solución). Esta ruta solo orquesta: descarga, parsea, aplica el
 * respaldo configurado y devuelve JSON.
 *
 * Respuestas:
 * - `200 { rate, date, source }` — tasa en vivo, o la de respaldo si está
 *   configurada `NEXT_PUBLIC_BCV_FALLBACK_RATE`.
 * - `503 { rate: null }` — sin ningún valor defendible; el cliente deshabilita
 *   los Bolívares en lugar de mostrar un precio inventado.
 */
export const dynamic = 'force-dynamic';

const CACHE_SECONDS = Math.max(1, Math.floor(BCV_RATE_TTL_MS / 1000));

export async function GET(): Promise<NextResponse> {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
  };

  const info = (await fetchBcvRate()) ?? getFallbackRate();

  if (!info) {
    return NextResponse.json({ rate: null, error: 'rate-unavailable' }, { status: 503, headers });
  }

  return NextResponse.json(info, { headers });
}
