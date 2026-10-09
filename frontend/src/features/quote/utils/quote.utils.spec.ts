import { describe, expect, it } from 'vitest';

import { TARIFFS } from '@/core/config/tariff-data';
import type { QuoteCurrency, QuoteSelection, QuoteTerm } from '../interfaces';
import {
  QUOTE_TERMS,
  buildInstallments,
  calculateQuote,
  convertToBolivars,
  getInstallment,
  isValidRate,
} from './quote.utils';

/** Tasa real del BCV el 06/10/2026. */
const RATE = 872.3927;

const base: QuoteSelection = {
  age: 15,
  state: 'Lara',
  zone: 'Zona 1',
  plan: 'Previasís',
  coverage: 10000,
  currency: 'USD',
  rate: null,
};

function selection(overrides: Partial<QuoteSelection> = {}): QuoteSelection {
  return { ...base, ...overrides };
}

function allTerms(): QuoteTerm[] {
  return QUOTE_TERMS.map((t) => t.id);
}

describe('QUOTE_TERMS', () => {
  it('expone las cinco modalidades en el orden esperado', () => {
    expect(allTerms()).toEqual(['Contado', 'Mensual', 'Trimestral', 'Semestral', 'Anual']);
  });

  it('cada modalidad cubre exactamente 12 meses al año', () => {
    for (const { months, payments } of QUOTE_TERMS) {
      expect(months * payments).toBe(12);
    }
  });
});

describe('isValidRate', () => {
  it('acepta tasas dentro del rango de sanidad', () => {
    expect(isValidRate(1)).toBe(true);
    expect(isValidRate(RATE)).toBe(true);
    expect(isValidRate(10_000)).toBe(true);
  });

  it('rechaza el resto', () => {
    for (const bad of [null, undefined, 0, 0.99, 10_001, NaN, Infinity, -5] as const) {
      expect(isValidRate(bad as number)).toBe(false);
    }
  });
});

describe('convertToBolivars', () => {
  it('redondea al entero más próximo porque no se muestran decimales', () => {
    expect(convertToBolivars(17, RATE)).toBe(14_831); // 14830.6759
    expect(convertToBolivars(1, 0.5)).toBe(1); // 0.5 → Math.round hacia arriba
    expect(convertToBolivars(1, 0.4)).toBe(0);
  });
});

describe('buildInstallments', () => {
  it('deriva todas las modalidades del mismo primitivo mensual', () => {
    const items = buildInstallments(17, 'USD', null);

    expect(items).toHaveLength(5);
    expect(items.map((i) => i.amount)).toEqual([204, 17, 51, 102, 204]);
    expect(items.map((i) => i.payments)).toEqual([1, 12, 4, 2, 1]);
    expect(items.map((i) => i.months)).toEqual([12, 1, 3, 6, 12]);
  });

  it('hace que las cinco modalidades sumen exactamente lo mismo al año', () => {
    for (const monthly of [17, 20, 24, 35, 51, 70, 90]) {
      for (const currency of ['USD', 'Bs'] as QuoteCurrency[]) {
        const items = buildInstallments(monthly, currency, RATE);
        const totals = new Set(items.map((i) => i.total));

        expect(totals.size).toBe(1);
        expect([...totals][0]).toBe(currency === 'USD' ? monthly * 12 : convertToBolivars(monthly, RATE) * 12);
      }
    }
  });

  it('mantiene amount * payments === total sin excepción', () => {
    for (const { months, payments } of QUOTE_TERMS) {
      const [item] = buildInstallments(51, 'USD', null).filter(
        (i) => i.months === months && i.payments === payments
      );
      expect(item.amount * item.payments).toBe(item.total);
    }
  });

  it('no produce decimales con ninguna entrada', () => {
    for (const monthly of [1, 17, 51, 90, 12_345]) {
      for (const item of buildInstallments(monthly, 'Bs', RATE)) {
        expect(Number.isInteger(item.amount)).toBe(true);
        expect(Number.isInteger(item.total)).toBe(true);
      }
    }
  });

  it('convierte el mensual UNA sola vez y deriva el resto', () => {
    // Si se convirtiera cada fila por separado, mensual*12 ya no coincidiría
    // con el total: 17*872.3927 = 14830.6759 → 14831*12 = 177972.
    const items = buildInstallments(17, 'Bs', RATE);
    const contado = items.find((i) => i.term === 'Contado');
    const mensual = items.find((i) => i.term === 'Mensual');

    expect(mensual?.amount).toBe(14_831);
    expect(contado?.amount).toBe(177_972);
    expect(new Set(items.map((i) => i.total))).toEqual(new Set([177_972]));
  });
});

describe('calculateQuote — resultado válido', () => {
  it('cotiza Previasís 10.000, Zona 1, 15 años en USD', () => {
    const result = calculateQuote(selection());

    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.ageRange).toBe('0-20');
    expect(result.monthly).toBe(17);
    expect(result.annual).toBe(204);
    expect(result.installments.map((i) => i.amount)).toEqual([204, 17, 51, 102, 204]);
  });

  it('usa la tarifa de Zona 2 cuando corresponde', () => {
    const result = calculateQuote(selection({ zone: 'Zona 2', state: 'Miranda' }));

    expect(result.valid).toBe(true);
    expect(result.monthly).toBe(22); // no 17
    expect(result.annual).toBe(264);
  });

  it('cotiza el plan Abuelos solo a partir de los 61 años', () => {
    const result = calculateQuote(
      selection({ age: 65, plan: 'Abuelos', coverage: 3000, zone: 'Zona 1' })
    );

    expect(result.valid).toBe(true);
    expect(result.ageRange).toBe('61-80');
    expect(result.monthly).toBe(35);
    expect(result.annual).toBe(420);
  });

  it('convierte a Bolívares con la tasa indicada', () => {
    const result = calculateQuote(selection({ currency: 'Bs', rate: RATE }));

    expect(result.valid).toBe(true);
    expect(result.monthly).toBe(14_831);
    expect(result.annual).toBe(177_972);
    expect(result.installments.every((i) => i.currency === 'Bs')).toBe(true);
    expect(result.installments.map((i) => i.amount)).toEqual([177_972, 14_831, 44_493, 88_986, 177_972]);
  });

  it('devuelve las cinco modalidades con la moneda correcta', () => {
    const result = calculateQuote(selection({ currency: 'Bs', rate: RATE }));

    expect(result.installments.map((i) => i.term)).toEqual(allTerms());
    expect(result.installments.map((i) => i.currency)).toEqual(Array(5).fill('Bs'));
  });
});

describe('calculateQuote — invariantes sobre toda la tarifa', () => {
  const cases = TARIFFS.filter(
    (t) => t.plan !== '24/7' && t.zona_1.mensual !== null && t.zona_2.mensual !== null
  );

  /** Edad representativa de cada rango, para poder recorrer toda la tarifa. */
  const AGE_BY_RANGE: Record<string, number> = {
    '0-20': 15,
    '21-40': 30,
    '41-60': 50,
    '61-80': 65,
  };

  it('cubre todas las combinaciones públicas de la tarifa', () => {
    // Previasís: 3 rangos × 4 coberturas = 12. Abuelos: 1 rango × 3 = 3.
    expect(cases).toHaveLength(15);
    expect(cases.some((c) => c.plan === '24/7')).toBe(false);
  });

  it('nunca produce decimales ni totales incoherentes', () => {
    for (const entry of cases) {
      for (const zone of ['Zona 1', 'Zona 2'] as const) {
        const label = `${entry.plan} ${entry.cobertura} ${entry.rango_edad} ${zone}`;
        const result = calculateQuote(
          selection({
            age: AGE_BY_RANGE[entry.rango_edad],
            plan: entry.plan,
            coverage: entry.cobertura,
            zone,
            currency: 'Bs',
            rate: RATE,
          })
        );

        expect(result.valid, label).toBe(true);
        expect(result.installments, label).toHaveLength(5);

        const totals = new Set(result.installments.map((i) => i.total));
        expect(totals.size, `totales divergentes en ${label}`).toBe(1);
        expect([...totals][0], label).toBe(result.annual);

        for (const item of result.installments) {
          expect(Number.isInteger(item.amount), label).toBe(true);
          expect(Number.isInteger(item.total), label).toBe(true);
          expect(item.amount * item.payments, label).toBe(item.total);
        }
      }
    }
  });

  it('Contado y Anual siempre coinciden (ambos cubren 12 meses de un pago)', () => {
    for (const entry of cases) {
      const result = calculateQuote(
        selection({
          age: AGE_BY_RANGE[entry.rango_edad],
          plan: entry.plan,
          coverage: entry.cobertura,
        })
      );
      expect(getInstallment(result, 'Contado')?.amount).toBe(
        getInstallment(result, 'Anual')?.amount
      );
    }
  });
});

describe('calculateQuote — inválidos', () => {
  it('rechaza edades fuera del rango tarifario', () => {
    for (const age of [-1, 81, 999]) {
      const result = calculateQuote(selection({ age }));
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('age-out-of-range');
    }
  });

  it('acepta los límites 0 y 80', () => {
    expect(calculateQuote(selection({ age: 0 })).valid).toBe(true);
    expect(calculateQuote(selection({ age: 80, plan: 'Abuelos', coverage: 3000 })).valid).toBe(true);
  });

  it('rechaza el plan 24/7, excluido del cotizador público', () => {
    const result = calculateQuote(selection({ plan: '24/7', coverage: 3000 }));
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unavailable-plan');
  });

  it('rechaza un plan sin tarifa para la edad', () => {
    const result = calculateQuote(selection({ age: 30, plan: 'Abuelos', coverage: 3000 }));
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unavailable-coverage');
  });

  it('rechaza una cobertura inexistente para el plan', () => {
    const result = calculateQuote(selection({ coverage: 3000 }));
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unavailable-coverage');
  });

  it('rechaza cotizar en Bolívares sin tasa utilizable', () => {
    for (const rate of [null, 0, 20_000, NaN] as const) {
      const result = calculateQuote(selection({ currency: 'Bs', rate: rate as number | null }));
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid-rate');
    }
  });

  it('un resultado inválido no expone importes', () => {
    const result = calculateQuote(selection({ age: 99 }));
    expect(result.monthly).toBe(0);
    expect(result.annual).toBe(0);
    expect(result.installments).toEqual([]);
  });
});

describe('getInstallment', () => {
  it('recupera la modalidad solicitada', () => {
    const result = calculateQuote(selection());
    expect(getInstallment(result, 'Trimestral')?.amount).toBe(51);
    expect(getInstallment(result, 'Inexistente' as QuoteTerm)).toBeUndefined();
  });
});
