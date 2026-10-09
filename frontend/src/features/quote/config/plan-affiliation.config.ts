import type { RequestedPlan } from '@/core/interfaces/affiliation.interfaces';
import type { PlanName } from '@/core/config/tariff-data';

import type { AffiliationPrefill } from '../interfaces';

/* --------------------------------------------------------------------------
 * Puente hacia el formulario de afiliación
 *
 * El formulario (Step3AffiliatesPlan) identifica cada opción por el par
 * `requestedPlan` + `coverageLimit`:
 *
 *   requestedPlan  el plan tal cual lo nombra la afiliación
 *                  ('Previasís' | 'Abuelos' | '24/7')
 *   coverageLimit  la cobertura en número (10000), no el texto '$10.000'
 *
 * El nivel (Bronce/Plata/…) ya no viaja dentro del nombre del plan: vive en
 * la cobertura. La tabla fija qué pares plan+cobertura existen y sirve a la
 * vez de validación del prefill. Solo traduce datos; no importa nada del
 * módulo de afiliación.
 * -------------------------------------------------------------------------- */

export const AFFILIATION_PLAN_BY_COVERAGE: Record<PlanName, Record<number, RequestedPlan>> = {
  'Previasís': {
    10000: 'Previasís',
    15000: 'Previasís',
    25000: 'Previasís',
    40000: 'Previasís',
  },
  'Abuelos': {
    3000: 'Abuelos',
    5000: 'Abuelos',
    10000: 'Abuelos',
  },
  '24/7': {},
};

/**
 * Convierte una selección de cotización en los parámetros que pre-cargan el
 * formulario de afiliación. Devuelve `null` si la combinación no existe.
 */
export function toAffiliationPrefill(
  plan: PlanName,
  coverage: number,
  age: number
): AffiliationPrefill | null {
  const requestedPlan = AFFILIATION_PLAN_BY_COVERAGE[plan]?.[coverage];
  if (!requestedPlan) return null;

  return {
    requestedPlan,
    coverageLimit: coverage,
    birthDate: ageToBirthDate(age),
  };
}

/**
 * Deriva una fecha de nacimiento aproximada a partir de la edad ingresada.
 * El formulario recalcula la edad actuarial con `calculateActuarialAge()` y el
 * usuario puede corregirla, así que la aproximación no es definitiva.
 */
export function ageToBirthDate(age: number): string {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}