import type { QuoteCurrency } from '../interfaces';

/** Símbolo de la moneda para precios, ej. `$25.000`. */
export const CURRENCY_SYMBOL: Record<QuoteCurrency, string> = {
  USD: '$',
  Bs: 'Bs',
};

/** Sufijo de la moneda para labels tipo "17 USD". */
export const CURRENCY_SUFFIX: Record<QuoteCurrency, string> = {
  USD: 'USD',
  Bs: 'Bs',
};

/**
 * Formatea un importe para mostrarlo en pantalla.
 *
 * Regla dura: **nunca se muestran decimales**, en ninguna moneda ni idioma.
 * `maximumFractionDigits: 0` redondea y `minimumFractionDigits: 0` evita que
 * `Intl` agregue `.00`.
 */
export function formatQuoteAmount(
  amount: number,
  currency: QuoteCurrency,
  locale: string = 'es'
): string {
  const integer = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(integer);

  const symbol = CURRENCY_SYMBOL[currency];
  return currency === 'USD' ? `${symbol}${formatted}` : `${symbol} ${formatted}`;
}

/** Formatea una cobertura con el mismo criterio que el formulario (`$25.000`). */
export function formatQuoteCoverage(coverage: number, locale: string = 'es'): string {
  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(coverage);

  return `${CURRENCY_SYMBOL.USD}${formatted}`;
}

/** Formatea la tasa de cambio, que sí admite decimales porque no es un precio. */
export function formatQuoteRate(rate: number, locale: string = 'es'): string {
  if (!Number.isFinite(rate)) return '—';
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate);
}

function intlLocale(locale: string): string {
  return locale === 'en' ? 'en-US' : 'es-VE';
}

/** Rango de edad legible, ej. `21-40 años`. */
export function formatAgeRange(ageRange: string | null): string {
  if (!ageRange) return '—';
  return `${ageRange.replace('-', ' a ')} años`;
}