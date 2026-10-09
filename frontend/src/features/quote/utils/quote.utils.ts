import type { AgeRange } from '@/core/config/tariff-data';
import { getAgeRange, getTariff } from '@/core/config/tariff-data';
import type {
  QuoteInstallment,
  QuoteResult,
  QuoteSelection,
  QuoteTerm,
  QuoteTermDefinition,
} from '../interfaces';
import { PUBLIC_PLANS } from '../config/quote-plans.config';
import { BCV_RATE_MAX, BCV_RATE_MIN } from '../config/bcv-rate.config';

/**
 * Las cinco modalidades de pago.
 *
 * `months` fija el importe de cada pago (`mensual * months`) y `payments`
 * fija el total anual (`mensual * 12` para todas). Por construcción las cinco
 * suman exactamente lo mismo al año y ninguna produce decimales: todos los
 * campos son productos de enteros.
 */
export const QUOTE_TERMS: readonly QuoteTermDefinition[] = [
  { id: 'Contado', months: 12, payments: 1 },
  { id: 'Mensual', months: 1, payments: 12 },
  { id: 'Trimestral', months: 3, payments: 4 },
  { id: 'Semestral', months: 6, payments: 2 },
  { id: 'Anual', months: 12, payments: 1 },
] as const;

/** Total de meses que acumula un año completo de pagos. */
const MONTHS_PER_YEAR = 12;

/** `true` si la tasa es utilizable para convertir a Bolívares. */
export function isValidRate(rate: number | null | undefined): rate is number {
  return typeof rate === 'number'
    && Number.isFinite(rate)
    && rate >= BCV_RATE_MIN
    && rate <= BCV_RATE_MAX;
}

/**
 * Convierte un importe en USD a Bolívares. Redondea al entero más próximo,
 * porque la cotización no muestra decimales en ninguna moneda.
 */
export function convertToBolivars(amountUsd: number, rate: number): number {
  return Math.round(amountUsd * rate);
}

/**
 * Construye las cinco modalidades a partir del primitivo mensual.
 *
 * La conversión de moneda ocurre UNA sola vez sobre el mensual y de ahí
 * se derivan todas las filas. Si se convirtiera cada fila por separado,
 * `mensual * 12` dejaría de coincidir con el total por redondeo.
 */
export function buildInstallments(
  monthly: number,
  currency: QuoteSelection['currency'],
  rate: number | null
): QuoteInstallment[] {
  const monthlyOut = currency === 'USD' ? monthly : convertToBolivars(monthly, rate ?? 0);

  return QUOTE_TERMS.map(({ id, months, payments }) => ({
    term: id,
    amount: monthlyOut * months,
    payments,
    months,
    total: monthlyOut * MONTHS_PER_YEAR,
    currency,
  }));
}

/**
 * Calcula la cotización individual a partir de edad, estado/zona, plan y
 * cobertura. Función pura: misma entrada, mismo resultado.
 */
export function calculateQuote(selection: QuoteSelection): QuoteResult {
  const { age, state, zone, plan, coverage, currency, rate } = selection;

  const base = {
    age,
    state,
    zone,
    plan,
    coverage,
    currency,
    ageRange: null as AgeRange | null,
    monthly: 0,
    annual: 0,
    installments: [] as QuoteInstallment[],
  };

  const invalid = (reason: QuoteResult['reason']): QuoteResult => ({
    ...base,
    valid: false,
    reason,
  });

  const ageRange = getAgeRange(age);
  if (!ageRange) return invalid('age-out-of-range');
  base.ageRange = ageRange;

  if (!PUBLIC_PLANS.includes(plan)) return invalid('unavailable-plan');

  // La tarifa se busca por EDAD (número), no por rango: `getTariff` compara
  // el rango de la entrada contra los límites del rango.
  const available = getTariff(plan, coverage, age, zone, 'mensual');
  if (available === null) {
    // La tarifa puede existir pero no tener precio mensual, o no existir.
    const annualOnly = getTariff(plan, coverage, age, zone, 'anual');
    return annualOnly === null ? invalid('unavailable-coverage') : invalid('no-price');
  }

  if (currency === 'Bs' && !isValidRate(rate)) return invalid('invalid-rate');

  // Redondeo defensivo: la tarifa actual es entera, pero nunca se admite
  // un primitivo fraccionario porque arruinaría la coherencia anual.
  const monthlyUsd = Math.round(available);
  const installments = buildInstallments(monthlyUsd, currency, rate);
  const mensual = installments.find((item) => item.term === 'Mensual');

  if (!mensual) return invalid('no-price');

  // `monthly` y `annual` se derivan de las propias cuotas en vez de
  // recalcularse, para que la moneda coincida siempre con la mostrada.
  base.monthly = mensual.amount;
  base.annual = mensual.total;
  base.installments = installments;

  return {
    ...base,
    valid: true,
    reason: null,
  };
}

/** Recupera una modalidad concreta de un resultado. */
export function getInstallment(
  result: QuoteResult,
  term: QuoteTerm
): QuoteInstallment | undefined {
  return result.installments.find((item) => item.term === term);
}
