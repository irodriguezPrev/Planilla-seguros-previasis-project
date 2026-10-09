import type { AgeRange, PlanName } from '@/core/config/tariff-data';
import type { Zone } from '@/core/config/zone-config';
import type { RequestedPlan } from '@/core/interfaces/affiliation.interfaces';

/**
 * Modalidades de pago que expone la cotización pública.
 *
 * Regla de negocio (única fuente de verdad):
 *   el precio MENSUAL es el primitivo y todo lo demás se deriva como
 *   `mensual * meses_del_periodo`. Nunca se redondea en el camino, de modo
 *   que todas las modalidades suman exactamente lo mismo al año.
 */
export type QuoteTerm = 'Contado' | 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';

export type QuoteCurrency = 'USD' | 'Bs';

export interface QuoteTermDefinition {
  id: QuoteTerm;
  /** Duración del período en meses (define el importe de cada pago). */
  months: number;
  /** Cantidad de pagos realizados en un año (define el total anual). */
  payments: number;
}

export interface QuoteInstallment {
  term: QuoteTerm;
  /** Importe de cada pago, entero en la moneda de salida. */
  amount: number;
  /** Pagos al año. */
  payments: number;
  /** Meses que cubre cada pago. */
  months: number;
  /** amount * payments. Idéntico para todas las modalidades. */
  total: number;
  currency: QuoteCurrency;
}

export type QuoteInvalidReason =
  | 'age-out-of-range'
  | 'unavailable-plan'
  | 'unavailable-coverage'
  | 'no-price'
  | 'invalid-rate';

export interface QuoteSelection {
  age: number;
  state: string;
  zone: Zone;
  plan: PlanName;
  coverage: number;
  currency: QuoteCurrency;
  /** Tasa Bs/USD. Ignorada cuando la moneda es USD. */
  rate: number | null;
}

export interface QuoteResult {
  valid: boolean;
  reason: QuoteInvalidReason | null;
  age: number;
  ageRange: AgeRange | null;
  plan: PlanName;
  coverage: number;
  state: string;
  zone: Zone;
  currency: QuoteCurrency;
  /**
   * Primitiva del cálculo: precio mensual ya convertido a la moneda de
   * salida. Siempre entero. De este número derivan todas las modalidades.
   */
  monthly: number;
  /** monthly * 12 — el total que pagan las cinco modalidades. */
  annual: number;
  installments: QuoteInstallment[];
}

export interface QuoteRateInfo {
  /** Tasa Bs/USD. */
  rate: number;
  /** Fecha de valor reportada por la fuente. */
  date: string;
  source: 'BCV' | 'fallback';
}

/**
 * Forma de `messages.quote` que consumen las páginas públicas para su
 * metadata y el JSON-LD (`/landing` y `/planes`).
 */
export interface QuoteMessages {
  meta: {
    title: string;
    description: string;
    planesTitle: string;
    planesDescription: string;
  };
}

/* --------------------------------------------------------------------------
 * Catálogo público de planes
 *
 * El catálogo (`24/7` excluido) y sus mapas viven en
 * `config/quote-plans.config.ts`; aquí solo se declaran los contratos.
 * -------------------------------------------------------------------------- */

/** Clase de gradiente reutilizada del design system existente. */
export type QuotePlanGradientClass = 'plan-previasis' | 'plan-abuelos';

export interface QuotePlanInfo {
  id: PlanName;
  gradientClass: QuotePlanGradientClass;
  /** Rangos de edad para los que este plan tiene tarifa. */
  ageRanges: AgeRange[];
  /** Coberturas vigentes para el rango consultado. */
  coverages: number[];
  /** `true` cuando hay al menos una cobertura disponible. */
  available: boolean;
}

/** Nivel visual de una cobertura dentro de su plan (Bronce → Diamante). */
export type CoverageTier = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

/** Parámetros que pre-cargan el paso 3 del formulario de afiliación. */
export interface AffiliationPrefill {
  requestedPlan: RequestedPlan;
  /** Cobertura en número (p. ej. 10000), como la espera el paso 3. */
  coverageLimit: number;
  /** Formato `YYYY-MM-DD` que espera el paso 3 del formulario. */
  birthDate: string;
}
