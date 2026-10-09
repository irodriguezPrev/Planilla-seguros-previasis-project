import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AffiliateRow } from '@/core/interfaces/affiliation.interfaces';
import { getPlanTiers } from '@/core/config/tariff-data';
import {
  ABUELOS_COVERAGE_LIMIT,
  ABUELOS_MIN_AGE,
  PREVIASIS_COVERAGE_LIMIT,
  applyAgeBasedPlan,
  resolveAgeBasedPlan,
} from './affiliate-plan.utils';

/** Fecha de nacimiento que produce exactamente `edad` años a la referencia fijada. */
function nacimientoConEdad(edad: number, referencia = new Date(2026, 9, 1)): string {
  // Nace UN DÍA ANTES del día de referencia: con la referencia a medianoche,
  // la regla actuarial histórica redondea hacia arriba el mismo día del
  // cumpleaños ("faltan 0 meses"), así que nacer justo el día de la referencia
  // devolvería `edad + 1`. Naciendo el día anterior, la referencia cae el día
  // después del cumpleaños y la edad resultante es exactamente `edad`.
  const nacimiento = new Date(
    referencia.getFullYear() - edad,
    referencia.getMonth(),
    referencia.getDate() - 1,
  );
  const anio = nacimiento.getFullYear();
  const mes = String(nacimiento.getMonth() + 1).padStart(2, '0');
  const dia = String(nacimiento.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function fila(overrides: Partial<AffiliateRow> = {}): AffiliateRow {
  return {
    id: 'afiliado-1',
    affiliateCode: 1,
    firstNames: 'María',
    lastNames: 'Pérez',
    fullName: 'María Pérez',
    documentType: 'V',
    documentNumber: 'V12345678',
    usesOwnDocument: true,
    birthDate: '1990-01-15',
    relationship: 'Titular',
    sex: 'F',
    weightKg: '60',
    heightCm: '165',
    requestedPlan: 'Previasís',
    coverageLimit: 10000,
    fee: 240,
    ...overrides,
  };
}

/**
 * resolveAgeBasedPlan llama a calculateActuarialAge sin fecha de referencia, así
 * que usa new Date(). Sin fijar el reloj estos tests empezarían a fallar solos
 * al pasar el tiempo.
 */
describe('resolveAgeBasedPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1)); // 1 de octubre de 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fuerza el plan Abuelos a partir de los 61 años', () => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 40000 },
      nacimientoConEdad(ABUELOS_MIN_AGE),
    );
    expect(resultado).toEqual({
      requestedPlan: 'Abuelos',
      coverageLimit: ABUELOS_COVERAGE_LIMIT,
    });
  });

  it('fuerza Abuelos por encima de los 61 años', () => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 10000 },
      nacimientoConEdad(75),
    );
    expect(resultado).toEqual({
      requestedPlan: 'Abuelos',
      coverageLimit: ABUELOS_COVERAGE_LIMIT,
    });
  });

  it('mantiene el plan Previasís justo por debajo del umbral', () => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 25000 },
      nacimientoConEdad(ABUELOS_MIN_AGE - 1),
    );
    expect(resultado).toEqual({
      requestedPlan: 'Previasís',
      coverageLimit: 25000,
    });
  });

  it('conserva una cobertura no por defecto si la edad no obliga a cambiar de plan', () => {
    // El usuario eligió 40000; resolver por edad no debe rebajarlo a 10000.
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 40000 },
      nacimientoConEdad(30),
    );
    expect(resultado.coverageLimit).toBe(40000);
  });

  it('vuelve a Previasís con la cobertura por defecto cuando la edad baja de 61', () => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Abuelos', coverageLimit: ABUELOS_COVERAGE_LIMIT },
      nacimientoConEdad(30),
    );
    expect(resultado).toEqual({
      requestedPlan: 'Previasís',
      coverageLimit: PREVIASIS_COVERAGE_LIMIT,
    });
  });

  it('conserva el plan 24/7 cuando la edad no obliga a cambiar', () => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: '24/7', coverageLimit: 5000 },
      nacimientoConEdad(40),
    );
    expect(resultado).toEqual({ requestedPlan: '24/7', coverageLimit: 5000 });
  });

  it('cambia a Abuelos aunque el plan actual sea 24/7', () => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: '24/7', coverageLimit: 5000 },
      nacimientoConEdad(70),
    );
    expect(resultado).toEqual({
      requestedPlan: 'Abuelos',
      coverageLimit: ABUELOS_COVERAGE_LIMIT,
    });
  });

  it.each([
    ['cadena vacía', ''],
    ['texto no numérico', 'no-es-fecha'],
    ['nacimiento futuro', '2030-01-01'],
    ['mes inexistente', '1990-13-01'],
  ])('degrada Abuelos a Previasís si la edad no se puede calcular (%s)', (_d, birthDate) => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Abuelos', coverageLimit: ABUELOS_COVERAGE_LIMIT },
      birthDate,
    );
    // Sin señal de error ni validación: una fecha con typo saca al usuario de
    // Abuelos y le asigna la cobertura por defecto de Previasís.
    expect(resultado).toEqual({
      requestedPlan: 'Previasís',
      coverageLimit: PREVIASIS_COVERAGE_LIMIT,
    });
  });

  it.each([
    ['cadena vacía', ''],
    ['texto no numérico', 'no-es-fecha'],
    ['nacimiento futuro', '2030-01-01'],
  ])('conserva intacto un plan no Abuelos si la edad no se puede calcular (%s)', (_d, birthDate) => {
    const resultado = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 25000 },
      birthDate,
    );
    expect(resultado).toEqual({
      requestedPlan: 'Previasís',
      coverageLimit: 25000,
    });
  });
});

describe('applyAgeBasedPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sobrescribe la fecha de nacimiento y el plan', () => {
    const resultado = applyAgeBasedPlan(fila(), nacimientoConEdad(70));
    expect(resultado.birthDate).toBe(nacimientoConEdad(70));
    expect(resultado.requestedPlan).toBe('Abuelos');
    expect(resultado.coverageLimit).toBe(ABUELOS_COVERAGE_LIMIT);
  });

  it('conserva el resto de campos de la fila', () => {
    const original = fila();
    const resultado = applyAgeBasedPlan(original, nacimientoConEdad(70));
    expect(resultado).toMatchObject({
      id: original.id,
      affiliateCode: original.affiliateCode,
      firstNames: original.firstNames,
      lastNames: original.lastNames,
      documentType: original.documentType,
      documentNumber: original.documentNumber,
      relationship: original.relationship,
      sex: original.sex,
      weightKg: original.weightKg,
      heightCm: original.heightCm,
    });
  });

  it('no muta la fila original', () => {
    const original = fila();
    const copia = { ...original };
    applyAgeBasedPlan(original, nacimientoConEdad(70));
    expect(original).toEqual(copia);
  });
});

/**
 * El umbral de 61 años aparece en dos módulos independientes. Si divergen, un
 * usuario vería un plan del que no puede contratar.
 */
describe('coherencia del umbral de 61 años entre módulos', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([0, 20, 40, 60])('a los %i años ambos módulos ofrecen Previasís', (edad) => {
    const plan = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 10000 },
      nacimientoConEdad(edad),
    );
    expect(plan.requestedPlan).toBe('Previasís');
    expect(getPlanTiers(edad).map((t) => t.plan)).toEqual(['Previasís', 'Previasís', 'Previasís', 'Previasís']);
  });

  it.each([61, 70, 80])('a los %i años ambos módulos ofrecen Abuelos', (edad) => {
    const plan = resolveAgeBasedPlan(
      { requestedPlan: 'Previasís', coverageLimit: 10000 },
      nacimientoConEdad(edad),
    );
    expect(plan.requestedPlan).toBe('Abuelos');
    expect(getPlanTiers(edad).map((t) => t.plan)).toEqual(['Abuelos', 'Abuelos', 'Abuelos']);
  });

  it('la cobertura por defecto de Abuelos es una cobertura que existe en la tabla', () => {
    expect(getPlanTiers(70).map((t) => t.coverage)).toContain(ABUELOS_COVERAGE_LIMIT);
  });

  it('la cobertura por defecto de Previasís es una cobertura que existe en la tabla', () => {
    expect(getPlanTiers(30).map((t) => t.coverage)).toContain(PREVIASIS_COVERAGE_LIMIT);
  });
});
