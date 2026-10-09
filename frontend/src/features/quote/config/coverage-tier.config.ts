import type { PlanName } from '@/core/config/tariff-data';

import type { CoverageTier } from '../interfaces';

/* --------------------------------------------------------------------------
 * Nivel de cobertura (Bronce → Diamante)
 *
 * Cada cobertura lleva un nivel para poder mostrarlo con su color en el
 * cotizador. El nivel es la posición **dentro del plan**, no el nombre del
 * plan de afiliación:
 *
 *   Previasís: 10.000 Bronce · 15.000 Plata · 25.000 Oro · 40.000 Diamante
 *   Abuelos:    3.000 Bronce ·  5.000 Plata · 10.000 Oro
 *
 * `Abuelos` solo tiene tres coberturas, así que no llega a Diamante. Que el
 * mismo importe tenga nivel distinto según el plan (Previasís $10.000 es
 * Bronce, Abuelos $10.000 es Oro) es correcto: lo que se compara es el nivel
 * dentro de un mismo plan, y el nivel nunca se mezcla con el nombre del plan
 * que se envía a la afiliación.
 * -------------------------------------------------------------------------- */

/** Niveles en orden ascendente, para ordenar o limitar listas. */
export const COVERAGE_TIERS: readonly CoverageTier[] = ['Bronce', 'Plata', 'Oro', 'Diamante'];

const COVERAGE_TIER_BY_PLAN: Record<PlanName, Partial<Record<number, CoverageTier>>> = {
  'Previasís': {
    10000: 'Bronce',
    15000: 'Plata',
    25000: 'Oro',
    40000: 'Diamante',
  },
  'Abuelos': {
    3000: 'Bronce',
    5000: 'Plata',
    10000: 'Oro',
  },
  '24/7': {},
};

/**
 * Nivel de una cobertura dentro de su plan, o `null` si esa combinación no
 * existe. `null` obliga a la interfaz a degradar sin inventar un nivel.
 */
export function getCoverageTier(plan: PlanName, coverage: number): CoverageTier | null {
  return COVERAGE_TIER_BY_PLAN[plan]?.[coverage] ?? null;
}