import type { QuoteCurrency } from '../interfaces';

/** USD es la moneda por defecto del cotizador. */
export const DEFAULT_QUOTE_CURRENCY: QuoteCurrency = 'USD';

export const QUOTE_CURRENCIES: QuoteCurrency[] = ['USD', 'Bs'];

/**
 * Tasa de respaldo opcional. Si no hay tasa en vivo ni esta variable, la
 * moneda en Bolívares queda deshabilitada en vez de publicar un precio
 * inventado. Así nunca se muestra un número que no podamos justificar.
 */
const fallbackFromEnv = process.env.NEXT_PUBLIC_BCV_FALLBACK_RATE;

export const USD_BCV_FALLBACK_RATE: number | null = (() => {
  if (!fallbackFromEnv) return null;
  const parsed = Number(fallbackFromEnv);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
})();
