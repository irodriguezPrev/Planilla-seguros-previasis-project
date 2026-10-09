/**
 * Superficie pública del módulo de cotización.
 *
 * Todo lo que el resto de la aplicación puede tocar vive aquí; lo que no se
 * re-exporta es interno a propósito:
 *
 * - `services/bcv-rate.fetch.ts` **no** se exporta: usa `node:https` y solo
 *   corre en el servidor. Re-exportarlo desde la raíz del módulo haría que
 *   cualquier import desde un componente cliente empaquetara código de Node
 *   y rompiera el build. Ese módulo se importa únicamente desde
 *   `src/app/api/quote-rate/route.ts`.
 *
 * Para desmontar el cotizador basta con borrar `src/features/quote/`, las
 * rutas `/landing` y `/planes`, la ruta `/api/quote-rate` y las entradas del
 * Navbar: no hay imports hacia `features/affiliation` ni ediciones en
 * `globals.css`.
 */

/* Componentes raíz: una por página. */
export { QuoteLandingPage } from './QuoteLandingPage';
export { PlansCatalogPage } from './PlansCatalogPage';

/* Tipos compartidos. */
export type {
  QuoteTerm,
  QuoteCurrency,
  QuoteTermDefinition,
  QuoteInstallment,
  QuoteInvalidReason,
  QuoteSelection,
  QuoteResult,
  QuoteRateInfo,
  QuoteMessages,
  QuotePlanGradientClass,
  QuotePlanInfo,
  CoverageTier,
  AffiliationPrefill,
} from './interfaces';

/* Reglas de negocio del cotizador. */
export {
  QUOTE_TERMS,
  isValidRate,
  convertToBolivars,
  buildInstallments,
  calculateQuote,
  getInstallment,
} from './utils/quote.utils';

/* Catálogo público de planes. */
export {
  PUBLIC_PLANS,
  getPublicPlansForAgeRange,
  getPublicCoverages,
  getPublicPlanCatalog,
  getDefaultPlanSelection,
} from './config/quote-plans.config';

/* Puente hacia el formulario de afiliación. */
export {
  toAffiliationPrefill,
  ageToBirthDate,
} from './config/plan-affiliation.config';

/* Niveles de cobertura (Bronce → Diamante). */
export {
  COVERAGE_TIERS,
  getCoverageTier,
} from './config/coverage-tier.config';

/* Moneda y tasa de cambio (configuración). */
export {
  DEFAULT_QUOTE_CURRENCY,
  QUOTE_CURRENCIES,
  USD_BCV_FALLBACK_RATE,
} from './config/currency.config';

/* Formateo sin decimales ni dependencia de `Intl` en rutas de dinero. */
export {
  CURRENCY_SYMBOL,
  CURRENCY_SUFFIX,
  formatQuoteAmount,
  formatQuoteCoverage,
  formatQuoteRate,
  formatAgeRange,
} from './utils/quote-format.utils';

/* Cliente de la tasa (habla con `/api/quote-rate`, nunca con el BCV). */
export { fetchQuoteRate, resetQuoteRateCache } from './services/quote-rate.service';

/* Punto de extensión para capturar leads. */
export { sendQuoteLead, type QuoteLeadPayload } from './services/quote-lead.service';
