import type { AgeRange, PlanName } from '@/core/config/tariff-data';
import { TARIFFS } from '@/core/config/tariff-data';

import type { QuotePlanGradientClass, QuotePlanInfo } from '../interfaces';

/**
 * Catálogo público de planes.
 *
 * `24/7` queda fuera deliberadamente: además de ser una decisión de negocio,
 * es inalcanzable — su rango de edad es `0-60`, un valor que `getAgeRange()`
 * jamás devuelve (devuelve `0-20`, `21-40`, `41-60` o `61-80`).
 */
export const PUBLIC_PLANS: readonly PlanName[] = ['Previasís', 'Abuelos'] as const;

/** Mapa plan → clase de gradiente del design system existente. */
const GRADIENT_BY_PLAN: Record<PlanName, QuotePlanGradientClass> = {
  'Previasís': 'plan-previasis',
  'Abuelos': 'plan-abuelos',
  '24/7': 'plan-previasis',
};

function ageRangesForPlan(plan: PlanName): AgeRange[] {
  return [...new Set(TARIFFS.filter((t) => t.plan === plan).map((t) => t.rango_edad))];
}

/**
 * Coberturas de un plan para un rango de edad concreto.
 *
 * El cotizador trabaja por RANGO (`'0-20'`, `'61-80'`, …) y no por edad suelta,
 * así que el filtro es una igualdad directa contra `rango_edad`. Con una edad
 * representativa en su lugar, un rango que ninguna tarifa declara (`'0-60'`)
 * devolvería coberturas de mentira en vez de quedarse vacío.
 */
function coveragesForAgeRange(plan: PlanName, ageRange: AgeRange): number[] {
  const coverages = TARIFFS.filter(
    (t) => t.plan === plan && t.rango_edad === ageRange,
  ).map((t) => t.cobertura);
  return [...new Set(coverages)].sort((a, b) => a - b);
}

/**
 * Planes públicos que tienen tarifa para el rango de edad indicado.
 * Para cualquier edad válida devuelve al menos un plan: los rangos de
 * `Previasís` (0-20 / 21-40 / 41-60) y de `Abuelos` (61-80) no se solapan.
 */
export function getPublicPlansForAgeRange(ageRange: AgeRange | null): QuotePlanInfo[] {
  if (!ageRange) {
    return PUBLIC_PLANS.map((id) => ({
      id,
      gradientClass: GRADIENT_BY_PLAN[id],
      ageRanges: ageRangesForPlan(id),
      coverages: [],
      available: false,
    }));
  }

  return PUBLIC_PLANS.map((id) => {
    const coverages = coveragesForAgeRange(id, ageRange);
    return {
      id,
      gradientClass: GRADIENT_BY_PLAN[id],
      ageRanges: ageRangesForPlan(id),
      coverages,
      available: coverages.length > 0,
    };
  });
}

/** Coberturas públicas de un plan para un rango de edad. */
export function getPublicCoverages(plan: PlanName, ageRange: AgeRange | null): number[] {
  if (!ageRange) return [];
  if (!PUBLIC_PLANS.includes(plan)) return [];
  return coveragesForAgeRange(plan, ageRange);
}

/**
 * Catálogo completo para la sección informativa: todas las coberturas del
 * plan en cualquier rango de edad, sin filtrar por la edad del visitante.
 */
export function getPublicPlanCatalog(): QuotePlanInfo[] {
  return PUBLIC_PLANS.map((id) => ({
    id,
    gradientClass: GRADIENT_BY_PLAN[id],
    ageRanges: ageRangesForPlan(id),
    coverages: [
      ...new Set(TARIFFS.filter((entry) => entry.plan === id).map((entry) => entry.cobertura)),
    ].sort((a, b) => a - b),
    available: true,
  }));
}

/** Selecciona la primera combinación plan/cobertura válida para la edad. */
export function getDefaultPlanSelection(ageRange: AgeRange | null): {
  plan: PlanName | null;
  coverage: number | null;
} {
  const plans = getPublicPlansForAgeRange(ageRange).filter((p) => p.available);
  if (plans.length === 0) return { plan: null, coverage: null };
  const plan = plans[0];
  return { plan: plan.id, coverage: plan.coverages[0] ?? null };
}