import type { QuoteTerm } from '../interfaces';

/**
 * Claves de i18n de las modalidades de pago para la rejilla de resultados.
 *
 * Los sufijos de traducción viven aquí y no en el componente para que el
 * contrato entre la modalidad y su etiqueta se revise en un solo sitio: si se
 * añade o renombra una modalidad en `QUOTE_TERMS`, este mapa es lo único que
 * tocar.
 */

/** Sufijo i18n de cada modalidad, ej. `Contado` → `results.termContado`. */
export const TERM_KEY: Record<QuoteTerm, string> = {
  Contado: 'termContado',
  Mensual: 'termMensual',
  Trimestral: 'termTrimestral',
  Semestral: 'termSemestral',
  Anual: 'termAnual',
};

export const TERM_DESC_KEY: Record<QuoteTerm, string> = {
  Contado: 'termContadoDesc',
  Mensual: 'termMensualDesc',
  Trimestral: 'termTrimestralDesc',
  Semestral: 'termSemestralDesc',
  Anual: 'termAnualDesc',
};