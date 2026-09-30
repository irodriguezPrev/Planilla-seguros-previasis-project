import { AffiliateRow } from '@/core/interfaces/affiliation.interfaces';
import { calculateActuarialAge } from '@/core/utils/age.utils';

/** Edad a partir de la cual el plan disponible es Abuelos. */
export const ABUELOS_MIN_AGE = 61;

export const ABUELOS_COVERAGE_LIMIT = 3000;
export const PREVIASIS_COVERAGE_LIMIT = 10000;

export type AgeBasedPlan = Pick<AffiliateRow, 'requestedPlan' | 'coverageLimit'>;

/**
 * Resuelve el plan y la cobertura que corresponden a una fecha de nacimiento.
 * A partir de ABUELOS_MIN_AGE solo aplica el plan Abuelos y, si la edad baja de ese
 * límite, se vuelve al plan Previasís con la cobertura por defecto.
 * En cualquier otro caso conserva el plan y la cobertura actuales.
 */
export const resolveAgeBasedPlan = (
  current: AgeBasedPlan,
  birthDate: string,
): AgeBasedPlan => {
  const age = calculateActuarialAge(birthDate);

  if (age !== null && age >= ABUELOS_MIN_AGE) {
    return { requestedPlan: 'Abuelos', coverageLimit: ABUELOS_COVERAGE_LIMIT };
  }

  if (current.requestedPlan === 'Abuelos') {
    return { requestedPlan: 'Previasís', coverageLimit: PREVIASIS_COVERAGE_LIMIT };
  }

  return { requestedPlan: current.requestedPlan, coverageLimit: current.coverageLimit };
};

/** Aplica el plan por edad sobre una fila de afiliados. */
export const applyAgeBasedPlan = (
  affiliate: AffiliateRow,
  birthDate: string,
): AffiliateRow => ({
  ...affiliate,
  birthDate,
  ...resolveAgeBasedPlan(affiliate, birthDate),
});