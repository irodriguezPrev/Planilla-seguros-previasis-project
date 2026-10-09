import { describe, expect, it } from 'vitest';

import { calculateActuarialAge } from '@/core/utils/age.utils';
import type { PlanName } from '@/core/config/tariff-data';
import {
  PUBLIC_PLANS,
  getDefaultPlanSelection,
  getPublicCoverages,
  getPublicPlanCatalog,
  getPublicPlansForAgeRange,
} from './quote-plans.config';
import {
  AFFILIATION_PLAN_BY_COVERAGE,
  ageToBirthDate,
  toAffiliationPrefill,
} from './plan-affiliation.config';
import {
  COVERAGE_TIERS,
  getCoverageTier,
} from './coverage-tier.config';
import type { CoverageTier } from '../interfaces';

describe('PUBLIC_PLANS', () => {
  it('excluye el plan 24/7', () => {
    expect(PUBLIC_PLANS).toEqual(['Previasís', 'Abuelos']);
    expect(PUBLIC_PLANS).not.toContain('24/7');
  });
});

describe('getPublicPlansForAgeRange', () => {
  it('ofrece Previasís a menores de 61 y no Abuelos', () => {
    const plans = getPublicPlansForAgeRange('0-20');
    const byId = Object.fromEntries(plans.map((p) => [p.id, p]));

    expect(byId['Previasís'].available).toBe(true);
    expect(byId['Previasís'].coverages).toEqual([10000, 15000, 25000, 40000]);
    expect(byId['Abuelos'].available).toBe(false);
    expect(byId['Abuelos'].coverages).toEqual([]);
  });

  it('ofrece Abuelos desde los 61 y no Previasís', () => {
    const plans = getPublicPlansForAgeRange('61-80');
    const byId = Object.fromEntries(plans.map((p) => [p.id, p]));

    expect(byId['Abuelos'].available).toBe(true);
    expect(byId['Abuelos'].coverages).toEqual([3000, 5000, 10000]);
    expect(byId['Previasís'].available).toBe(false);
  });

  it('siempre expone ambos planes aunque ninguno esté disponible', () => {
    const ids = getPublicPlansForAgeRange('0-60').map((p) => p.id);
    expect(ids).toEqual(['Previasís', 'Abuelos']);
    expect(getPublicPlansForAgeRange('0-60').every((p) => !p.available)).toBe(true);
  });

  it('no hay rangos en los que convivan los dos planes', () => {
    for (const range of ['0-20', '21-40', '41-60', '61-80'] as const) {
      const available = getPublicPlansForAgeRange(range).filter((p) => p.available);
      expect(available.length, range).toBe(1);
    }
  });

  it('marca todo como no disponible sin rango de edad', () => {
    expect(getPublicPlansForAgeRange(null).every((p) => !p.available)).toBe(true);
  });

  it('nunca incluye el plan 24/7', () => {
    for (const range of ['0-20', '21-40', '41-60', '61-80', '0-60', null] as const) {
      expect(getPublicPlansForAgeRange(range).map((p) => p.id)).not.toContain('24/7' as PlanName);
    }
  });
});

describe('getPublicCoverages', () => {
  it('devuelve las coberturas ordenadas ascendentemente', () => {
    expect(getPublicCoverages('Previasís', '41-60')).toEqual([10000, 15000, 25000, 40000]);
    expect(getPublicCoverages('Abuelos', '61-80')).toEqual([3000, 5000, 10000]);
  });

  it('devuelve vacío cuando el plan no tiene tarifa en ese rango', () => {
    expect(getPublicCoverages('Previasís', '61-80')).toEqual([]);
    expect(getPublicCoverages('Abuelos', '0-20')).toEqual([]);
  });

  it('devuelve vacío para el plan excluido y sin rango', () => {
    expect(getPublicCoverages('24/7', '0-20')).toEqual([]);
    expect(getPublicCoverages('Previasís', null)).toEqual([]);
  });
});

describe('getDefaultPlanSelection', () => {
  it('elige la cobertura más baja del plan disponible', () => {
    expect(getDefaultPlanSelection('0-20')).toEqual({ plan: 'Previasís', coverage: 10000 });
    expect(getDefaultPlanSelection('61-80')).toEqual({ plan: 'Abuelos', coverage: 3000 });
  });

  it('devuelve null sin rango de edad', () => {
    expect(getDefaultPlanSelection(null)).toEqual({ plan: null, coverage: null });
  });
});

describe('ageToBirthDate', () => {
  it('devuelve una fecha YYYY-MM-DD no futura', () => {
    const birthDate = ageToBirthDate(35);
    expect(birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(birthDate).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('hace round-trip exacto con la edad actuarial', () => {
    // El formulario recalcula la edad con calculateActuarialAge: la fecha
    // derivada debe devolver exactamente la edad que introdujo el visitante.
    for (const age of [0, 1, 18, 35, 61, 80]) {
      expect(calculateActuarialAge(ageToBirthDate(age)), `edad ${age}`).toBe(age);
    }
  });

  it('resta la edad al año corriente', () => {
    expect(ageToBirthDate(30).slice(0, 4)).toBe(String(new Date().getFullYear() - 30));
  });
});

describe('toAffiliationPrefill', () => {
  it('mapea las cuatro coberturas de Previasís', () => {
    expect(toAffiliationPrefill('Previasís', 10000, 30)).toMatchObject({
      requestedPlan: 'Previasís',
      coverageLimit: 10000,
    });
    expect(toAffiliationPrefill('Previasís', 15000, 30)).toMatchObject({
      requestedPlan: 'Previasís',
      coverageLimit: 15000,
    });
    expect(toAffiliationPrefill('Previasís', 25000, 30)).toMatchObject({
      requestedPlan: 'Previasís',
      coverageLimit: 25000,
    });
    expect(toAffiliationPrefill('Previasís', 40000, 30)).toMatchObject({
      requestedPlan: 'Previasís',
      coverageLimit: 40000,
    });
  });

  it('mapea las tres coberturas de Abuelos', () => {
    for (const coverage of [3000, 5000, 10000] as const) {
      expect(toAffiliationPrefill('Abuelos', coverage, 65)).toMatchObject({
        requestedPlan: 'Abuelos',
        coverageLimit: coverage,
      });
    }
  });

  it('incluye la fecha de nacimiento derivada de la edad', () => {
    const prefill = toAffiliationPrefill('Previasís', 25000, 44);
    expect(prefill?.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(calculateActuarialAge(prefill!.birthDate)).toBe(44);
  });

  it('rechaza combinaciones que no existen en el formulario', () => {
    expect(toAffiliationPrefill('24/7', 3000, 30)).toBeNull();
    expect(toAffiliationPrefill('Previasís', 3000, 30)).toBeNull();
    expect(toAffiliationPrefill('Abuelos', 25000, 65)).toBeNull();
  });
});

describe('getCoverageTier', () => {
  it('recorre los cuatro niveles de Previasís en orden de cobertura', () => {
    expect(getCoverageTier('Previasís', 10000)).toBe('Bronce');
    expect(getCoverageTier('Previasís', 15000)).toBe('Plata');
    expect(getCoverageTier('Previasís', 25000)).toBe('Oro');
    expect(getCoverageTier('Previasís', 40000)).toBe('Diamante');
  });

  it('recorre tres niveles en Abuelos, que no llega a Diamante', () => {
    expect(getCoverageTier('Abuelos', 3000)).toBe('Bronce');
    expect(getCoverageTier('Abuelos', 5000)).toBe('Plata');
    expect(getCoverageTier('Abuelos', 10000)).toBe('Oro');
    expect(getCoverageTier('Abuelos', 40000)).toBeNull();
  });

  it('los niveles dentro de un plan crecen con la cobertura', () => {
    for (const plan of getPublicPlanCatalog()) {
      const order = plan.coverages
        .map((coverage) => getCoverageTier(plan.id, coverage))
        .filter((tier): tier is CoverageTier => tier !== null)
        .map((tier) => COVERAGE_TIERS.indexOf(tier));

      expect(order.length).toBeGreaterThan(1);
      // Cada cobertura mayor ocupa un nivel estrictamente superior: dos
      // coberturas distintas nunca comparten nivel dentro del mismo plan.
      expect(order).toEqual([...order].sort((a, b) => a - b));
      expect(new Set(order).size).toBe(order.length);
    }
  });

  it('devuelve null cuando la combinación no existe', () => {
    expect(getCoverageTier('Previasís', 3000)).toBeNull();
    expect(getCoverageTier('Abuelos', 25000)).toBeNull();
    expect(getCoverageTier('24/7', 3000)).toBeNull();
    expect(getCoverageTier('Previasís', 0)).toBeNull();
  });

  it('todo par plan+cobertura enviado al formulario tiene nivel en el cotizador', () => {
    // Mantiene sincronizadas las dos tablas: si una gana una cobertura que la
    // otra no conoce, el cotizador mandaría a la afiliación una combinación
    // sin nivel (o que Paso 3 no puede tarifar).
    for (const [plan, coverages] of Object.entries(AFFILIATION_PLAN_BY_COVERAGE)) {
      for (const [coverage, requestedPlan] of Object.entries(coverages)) {
        const label = `${plan} ${coverage}`;

        // El par viaja a la afiliación con el nombre del plan, no con el tier.
        expect(requestedPlan, label).toBe(plan);
        expect(getCoverageTier(plan as PlanName, Number(coverage)), label).not.toBeNull();
      }
    }
  });
});
