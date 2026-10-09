import { describe, expect, it } from 'vitest';

import {
  formatAgeRange,
  formatQuoteAmount,
  formatQuoteCoverage,
  formatQuoteRate,
} from './quote-format.utils';

describe('formatQuoteAmount', () => {
  it('prefija la moneda correspondiente', () => {
    expect(formatQuoteAmount(17, 'USD')).toBe('$17');
    expect(formatQuoteAmount(17, 'Bs')).toBe('Bs 17');
  });

  it('agrupa los miles en español', () => {
    expect(formatQuoteAmount(14_831, 'Bs')).toBe('Bs 14.831');
    expect(formatQuoteAmount(177_972, 'Bs')).toBe('Bs 177.972');
    expect(formatQuoteAmount(1_020, 'USD')).toBe('$1.020');
  });

  it('agrupa los miles en inglés', () => {
    expect(formatQuoteAmount(177_972, 'Bs', 'en')).toBe('Bs 177,972');
    expect(formatQuoteAmount(1_020, 'USD', 'en')).toBe('$1,020');
  });

  it('nunca muestra decimales', () => {
    expect(formatQuoteAmount(17.9, 'USD')).toBe('$18');
    expect(formatQuoteAmount(17.4, 'USD')).toBe('$17');
    expect(formatQuoteAmount(0.4, 'USD')).toBe('$0');
    expect(formatQuoteAmount(14_830.6759, 'Bs')).toBe('Bs 14.831');
  });

  it('es estable para entradas no numéricas', () => {
    expect(formatQuoteAmount(Number.NaN, 'USD')).toBe('$0');
    expect(formatQuoteAmount(Number.POSITIVE_INFINITY, 'USD')).toBe('$0');
  });

  it('muestra el cero', () => {
    expect(formatQuoteAmount(0, 'USD')).toBe('$0');
    expect(formatQuoteAmount(0, 'Bs')).toBe('Bs 0');
  });
});

describe('formatQuoteCoverage', () => {
  it('usa el mismo formato que el formulario en español', () => {
    expect(formatQuoteCoverage(3000)).toBe('$3.000');
    expect(formatQuoteCoverage(10_000)).toBe('$10.000');
    expect(formatQuoteCoverage(25_000)).toBe('$25.000');
    expect(formatQuoteCoverage(40_000)).toBe('$40.000');
  });

  it('usa la convención inglesa en inglés', () => {
    expect(formatQuoteCoverage(25_000, 'en')).toBe('$25,000');
  });
});

describe('formatQuoteRate', () => {
  it('muestra la tasa sin redondear de forma agresiva', () => {
    expect(formatQuoteRate(872.3927)).toBe('872,3927');
    expect(formatQuoteRate(1)).toBe('1,00');
  });

  it('muestra un guion largo cuando no hay tasa', () => {
    expect(formatQuoteRate(Number.NaN)).toBe('—');
  });
});

describe('formatAgeRange', () => {
  it('lee el rango como un tramo', () => {
    expect(formatAgeRange('21-40')).toBe('21 a 40 años');
    expect(formatAgeRange('0-20')).toBe('0 a 20 años');
  });

  it('muestra un guion largo sin rango', () => {
    expect(formatAgeRange(null)).toBe('—');
  });
});
