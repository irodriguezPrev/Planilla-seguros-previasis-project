import { describe, expect, it } from 'vitest';
import {
  TARIFFS,
  formatCoverage,
  getAgeRange,
  getAnnualPriceFromTariff,
  getAvailableCoverages,
  getAvailablePlans,
  getMonthlyPriceFromTariff,
  getPlanTiers,
  getPriceForFrequency,
  getTariff,
  hasMonthlyPrice,
  isAgeInRange,
  parseCoverageLimit,
  roundInstallmentAmount,
  roundMoney,
} from './tariff-data';

const ZONA_1 = 'Zona 1' as const;
const ZONA_2 = 'Zona 2' as const;

// Edad representativa dentro de cada rango de la tabla.
const EDAD_JOVEN = 30;
const EDAD_ABUELO = 65;

/** Edad representativa para un rango, para poder ejercitar cada fila de la tabla. */
function edadDeRango(rango: string): number {
  switch (rango) {
    case '0-20':
      return 10;
    case '21-40':
      return 30;
    case '41-60':
      return 50;
    case '61-80':
      return 70;
    case '0-60':
      return 30;
    default:
      throw new Error(`rango no contemplado en el test: ${rango}`);
  }
}

describe('isAgeInRange', () => {
  it('incluye ambos extremos del rango', () => {
    expect(isAgeInRange(20, '0-20')).toBe(true);
    expect(isAgeInRange(0, '0-20')).toBe(true);
    expect(isAgeInRange(21, '0-20')).toBe(false);
    expect(isAgeInRange(60, '41-60')).toBe(true);
    expect(isAgeInRange(61, '41-60')).toBe(false);
  });

  it('reconoce el rango 0-60 del plan 24/7', () => {
    expect(isAgeInRange(0, '0-60')).toBe(true);
    expect(isAgeInRange(60, '0-60')).toBe(true);
    expect(isAgeInRange(61, '0-60')).toBe(false);
  });

  it('devuelve false para un rango inexistente en vez de lanzar', () => {
    expect(isAgeInRange(30, 'rango-inexistente' as never)).toBe(false);
  });
});

describe('getAgeRange', () => {
  it.each([
    [0, '0-20'],
    [20, '0-20'],
    [21, '21-40'],
    [40, '21-40'],
    [41, '41-60'],
    [60, '41-60'],
    [61, '61-80'],
    [80, '61-80'],
  ] as [number, string][])('devuelve %s -> %s', (age, expected) => {
    expect(getAgeRange(age)).toBe(expected);
  });

  it('devuelve null fuera del rango 0-80', () => {
    expect(getAgeRange(-1)).toBeNull();
    expect(getAgeRange(81)).toBeNull();
    expect(getAgeRange(200)).toBeNull();
  });

  it('nunca devuelve 0-60, que es exclusivo de las tarifas 24/7', () => {
    for (let age = 0; age <= 80; age += 1) {
      expect(getAgeRange(age)).not.toBe('0-60');
    }
  });
});

describe('getTariff', () => {
  it('devuelve la tarifa anual exacta de la tabla para Zona 2', () => {
    expect(getTariff('Previasís', 40000, 50, ZONA_2, 'anual')).toBe(790);
  });

  it('devuelve la tarifa mensual exacta de la tabla para Zona 1', () => {
    expect(getTariff('Previasís', 40000, 50, ZONA_1, 'mensual')).toBe(51);
  });

  it('Zona 2 es siempre más cara que Zona 1', () => {
    for (const entry of TARIFFS) {
      const age = edadDeRango(entry.rango_edad);
      for (const frequency of ['anual', 'mensual'] as const) {
        const z1 = getTariff(entry.plan, entry.cobertura, age, ZONA_1, frequency);
        const z2 = getTariff(entry.plan, entry.cobertura, age, ZONA_2, frequency);
        if (z1 === null) {
          expect(z2).toBeNull();
          continue;
        }
        expect(z2).toBeGreaterThan(z1);
      }
    }
  });

  it('devuelve null cuando la edad queda fuera del rango de la tarifa', () => {
    // Abuelos solo aplica de 61 a 80.
    expect(getTariff('Abuelos', 3000, 30, ZONA_1, 'anual')).toBeNull();
    // 24/7 solo aplica hasta los 60.
    expect(getTariff('24/7', 2000, 65, ZONA_1, 'anual')).toBeNull();
  });

  it('devuelve null cuando la cobertura no existe para ese plan', () => {
    expect(getTariff('Previasís', 3000, 30, ZONA_1, 'anual')).toBeNull();
    expect(getTariff('Abuelos', 40000, 65, ZONA_1, 'anual')).toBeNull();
  });

  it('devuelve null para el plan 24/7 con frecuencia mensual', () => {
    // Ninguna entrada 24/7 define tarifa mensual; el precio mensual se deriva
    // del anual en getPriceForFrequency, no se lee de la tabla.
    for (const cobertura of [2000, 3000, 5000, 10000]) {
      expect(getTariff('24/7', cobertura, EDAD_JOVEN, ZONA_1, 'mensual')).toBeNull();
    }
  });

  it('trata cualquier valor de zona distinto de "Zona 1" como Zona 2', () => {
    const esperado = getTariff('Previasís', 10000, 30, ZONA_2, 'anual');
    expect(getTariff('Previasís', 10000, 30, 'zona 1' as never, 'anual')).toBe(esperado);
    expect(getTariff('Previasís', 10000, 30, '' as never, 'anual')).toBe(esperado);
  });

  it('cada fila de la tabla resuelve a su propio precio', () => {
    // Detecta filas huérfanas, typos en plan/cobertura o solapamientos: si una
    // entrada queda oculta por otra anterior, la assertion falla.
    for (const entry of TARIFFS) {
      const age = edadDeRango(entry.rango_edad);
      expect(isAgeInRange(age, entry.rango_edad)).toBe(true);
      expect(getTariff(entry.plan, entry.cobertura, age, ZONA_1, 'anual')).toBe(
        entry.zona_1.anual,
      );
      expect(getTariff(entry.plan, entry.cobertura, age, ZONA_2, 'anual')).toBe(
        entry.zona_2.anual,
      );
      if (entry.zona_1.mensual === null) {
        expect(entry.zona_2.mensual).toBeNull();
        expect(getTariff(entry.plan, entry.cobertura, age, ZONA_1, 'mensual')).toBeNull();
      } else {
        expect(getTariff(entry.plan, entry.cobertura, age, ZONA_1, 'mensual')).toBe(
          entry.zona_1.mensual,
        );
        expect(getTariff(entry.plan, entry.cobertura, age, ZONA_2, 'mensual')).toBe(
          entry.zona_2.mensual,
        );
      }
    }
  });

  it('no hay dos filas con el mismo plan, cobertura y rango de edad', () => {
    const seen = new Set<string>();
    for (const entry of TARIFFS) {
      const key = `${entry.plan}|${entry.cobertura}|${entry.rango_edad}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe('getPriceForFrequency', () => {
  it('deriva cada período de la cuota anual y redondea al entero más cercano', () => {
    // Previasís 10000 / 21-40 / Zona 1: anual 243.
    expect(getPriceForFrequency('Previasís', 10000, EDAD_JOVEN, ZONA_1, 'Mensual')).toBe(20);
    expect(getPriceForFrequency('Previasís', 10000, EDAD_JOVEN, ZONA_1, 'Trimestral')).toBe(61);
    expect(getPriceForFrequency('Previasís', 10000, EDAD_JOVEN, ZONA_1, 'Semestral')).toBe(122);
    expect(getPriceForFrequency('Previasís', 10000, EDAD_JOVEN, ZONA_1, 'Anual')).toBe(243);
  });

  it('aplica el mismo redondeo a las cuotas derivadas del plan 24/7', () => {
    // 24/7 2000 Zona 1: anual 31, sin mensual.
    expect(getPriceForFrequency('24/7', 2000, EDAD_JOVEN, ZONA_1, 'Mensual')).toBe(3);
    expect(getPriceForFrequency('24/7', 2000, EDAD_JOVEN, ZONA_1, 'Trimestral')).toBe(8);
    expect(getPriceForFrequency('24/7', 2000, EDAD_JOVEN, ZONA_1, 'Semestral')).toBe(16);
  });

  it('conserva el anual exacto para 24/7', () => {
    for (const cobertura of [2000, 3000, 5000, 10000]) {
      const anualTabla = getTariff('24/7', cobertura, EDAD_JOVEN, ZONA_1, 'anual');
      expect(getPriceForFrequency('24/7', cobertura, EDAD_JOVEN, ZONA_1, 'Anual')).toBe(
        anualTabla,
      );
    }
  });

  it('devuelve null fuera del rango de edad 0-80', () => {
    expect(getPriceForFrequency('Previasís', 10000, -1, ZONA_1, 'Anual')).toBeNull();
    expect(getPriceForFrequency('Previasís', 10000, 81, ZONA_1, 'Anual')).toBeNull();
  });

  it('devuelve null si la combinación plan/cobertura/edad no existe', () => {
    expect(getPriceForFrequency('Abuelos', 3000, EDAD_JOVEN, ZONA_1, 'Anual')).toBeNull();
    expect(getPriceForFrequency('24/7', 2000, EDAD_ABUELO, ZONA_1, 'Anual')).toBeNull();
    expect(getPriceForFrequency('Previasís', 3000, EDAD_JOVEN, ZONA_1, 'Anual')).toBeNull();
  });

  it('cobra la tarifa anual publicada para cada plan, edad y zona', () => {
    for (const entry of TARIFFS) {
      const age = edadDeRango(entry.rango_edad);
      expect(getPriceForFrequency(entry.plan, entry.cobertura, age, ZONA_1, 'Anual')).toBe(entry.zona_1.anual);
      expect(getPriceForFrequency(entry.plan, entry.cobertura, age, ZONA_2, 'Anual')).toBe(entry.zona_2.anual);
    }
  });
});

describe('roundInstallmentAmount', () => {
  it('redondea hacia abajo cuando la parte decimal es menor que .50', () => {
    expect(roundInstallmentAmount(19.49)).toBe(19);
  });

  it('redondea hacia arriba desde .50', () => {
    expect(roundInstallmentAmount(19.5)).toBe(20);
    expect(roundInstallmentAmount(19.51)).toBe(20);
  });
});

describe('roundMoney', () => {
  it('redondea a dos decimales', () => {
    expect(roundMoney(2.5833333)).toBe(2.58);
    expect(roundMoney(2.585)).toBe(2.59);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('absorbe el error de punto flotante de sumas y productos', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(1.1 * 3).not.toBe(3.3);
    expect(roundMoney(1.1 * 3)).toBe(3.3);
  });

  it('mantiene el valor cuando la división por 12 y el producto son exactos', () => {
    expect(roundMoney(31 / 12)).toBe(2.58);
    expect(roundMoney((31 / 12) * 12)).toBe(31);
    expect(roundMoney((55 / 12) * 12)).toBe(55);
  });

  it('no altera un valor ya redondeado', () => {
    expect(roundMoney(20)).toBe(20);
    expect(roundMoney(420)).toBe(420);
  });
});

describe('getPlanTiers', () => {
  it('ofrece los cuatro niveles de Previasís hasta los 60 años', () => {
    expect(getPlanTiers(60)).toEqual([
      { tier: 'Bronce', plan: 'Previasís', coverage: 10000 },
      { tier: 'Plata', plan: 'Previasís', coverage: 15000 },
      { tier: 'Oro', plan: 'Previasís', coverage: 25000 },
      { tier: 'Diamante', plan: 'Previasís', coverage: 40000 },
    ]);
  });

  it('ofrece los tres niveles de Abuelos de 61 a 80 años', () => {
    expect(getPlanTiers(61)).toEqual([
      { tier: 'Bronce', plan: 'Abuelos', coverage: 3000 },
      { tier: 'Plata', plan: 'Abuelos', coverage: 5000 },
      { tier: 'Oro', plan: 'Abuelos', coverage: 10000 },
    ]);
  });

  it('no incluye el plan 24/7 en los niveles comerciales', () => {
    for (let age = 0; age <= 80; age += 1) {
      for (const tier of getPlanTiers(age)) {
        expect(tier.plan).not.toBe('24/7');
      }
    }
  });

  it('devuelve lista vacía fuera del rango de 0 a 80 años', () => {
    expect(getPlanTiers(-1)).toEqual([]);
    expect(getPlanTiers(81)).toEqual([]);
    expect(getPlanTiers(120)).toEqual([]);
  });

  it('los niveles están ordenados de menor a mayor cobertura', () => {
    for (const age of [0, 30, 60, 61, 80]) {
      const coverages = getPlanTiers(age).map((t) => t.coverage);
      expect(coverages).toEqual([...coverages].sort((a, b) => a - b));
    }
  });
});

describe('getAvailableCoverages', () => {
  it('devuelve las coberturas de Previasís ordenadas de menor a mayor', () => {
    expect(getAvailableCoverages('Previasís', EDAD_JOVEN)).toEqual([10000, 15000, 25000, 40000]);
  });

  it('devuelve las coberturas de Abuelos para mayores de 60', () => {
    expect(getAvailableCoverages('Abuelos', EDAD_ABUELO)).toEqual([3000, 5000, 10000]);
  });

  it('devuelve las coberturas de 24/7 sin duplicados', () => {
    expect(getAvailableCoverages('24/7', EDAD_JOVEN)).toEqual([2000, 3000, 5000, 10000]);
  });

  it('devuelve lista vacía si el plan no aplica a esa edad', () => {
    expect(getAvailableCoverages('Abuelos', EDAD_JOVEN)).toEqual([]);
    expect(getAvailableCoverages('24/7', EDAD_ABUELO)).toEqual([]);
  });
});

describe('getAvailablePlans', () => {
  it('ofrece Previasís y 24/7 hasta los 60 años', () => {
    expect(getAvailablePlans(EDAD_JOVEN).sort()).toEqual(['24/7', 'Previasís']);
  });

  it('ofrece solo Abuelos de 61 a 80 años', () => {
    expect(getAvailablePlans(EDAD_ABUELO)).toEqual(['Abuelos']);
  });

  it('no ofrece planes por encima de 80 años', () => {
    expect(getAvailablePlans(81)).toEqual([]);
  });
});

describe('hasMonthlyPrice', () => {
  it('es falso solo para 24/7', () => {
    expect(hasMonthlyPrice('24/7')).toBe(false);
    expect(hasMonthlyPrice('Previasís')).toBe(true);
    expect(hasMonthlyPrice('Abuelos')).toBe(true);
  });
});

describe('parseCoverageLimit', () => {
  it('interpreta el punto como separador de miles', () => {
    expect(parseCoverageLimit('10.000')).toBe(10000);
    expect(parseCoverageLimit('$3,000')).toBe(3000);
    expect(parseCoverageLimit('10000')).toBe(10000);
  });

  // BUG CONOCIDO: replace(/[$,.]/g, '') elimina los puntos sin distinguir
  // separador de miles de separador decimal, así que un decimal con coma se
  // convierte mal. Se documenta el comportamiento actual a propósito.
  it('BUG: interpreta mal un decimal con coma', () => {
    expect(parseCoverageLimit('1,5')).toBe(15);
    expect(parseCoverageLimit('1.5')).toBe(15);
  });
});

describe('formatCoverage', () => {
  it('formatea con separador de miles venezolano', () => {
    // Depende de los datos ICU del runtime. Node incluye full-icu por defecto
    // desde v13, así que es estable en local y en CI.
    expect(formatCoverage(10000)).toBe('$10.000');
    expect(formatCoverage(3000)).toBe('$3.000');
    expect(formatCoverage(40000)).toBe('$40.000');
  });

  it('es compatible con lo que devuelve parseCoverageLimit', () => {
    expect(parseCoverageLimit(formatCoverage(10000).replace('$', ''))).toBe(10000);
  });
});

describe('getMonthlyPriceFromTariff / getAnnualPriceFromTariff', () => {
  it('delegan en getTariff con la frecuencia correcta', () => {
    expect(getAnnualPriceFromTariff('Previasís', 40000, 50, ZONA_1)).toBe(617);
    expect(getMonthlyPriceFromTariff('Previasís', 40000, 50, ZONA_1)).toBe(51);
    expect(getMonthlyPriceFromTariff('24/7', 2000, EDAD_JOVEN, ZONA_1)).toBeNull();
  });
});
