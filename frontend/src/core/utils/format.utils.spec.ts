import { describe, expect, it } from 'vitest';

import {
  completeCurrencyInput,
  formatCurrencyInput,
  formatDate,
  formatErrorMessage,
  isValidMonthYear,
  monthInputValueToMonthYear,
  monthYearToInputValue,
} from '@/core/utils/format.utils';

describe('formatCurrencyInput', () => {
  it('devuelve vacío sin dígitos', () => {
    expect(formatCurrencyInput('')).toBe('');
    expect(formatCurrencyInput('abc')).toBe('');
  });

  it('deja un cero cuando solo hay símbolos de separador', () => {
    // Comportamiento actual: al quedar solo ',' y '.', la parte entera
    // vacía se rellena con '0' y la decimal queda en blanco.
    expect(formatCurrencyInput('$,.')).toBe('0,');
  });

  it('agrupa el millar con punto', () => {
    expect(formatCurrencyInput('1234')).toBe('1.234');
    expect(formatCurrencyInput('1234567')).toBe('1.234.567');
  });

  it('interpreta un punto con hasta 2 decimales como separador decimal', () => {
    expect(formatCurrencyInput('1234.56')).toBe('1.234,56');
    expect(formatCurrencyInput('1234.5')).toBe('1.234,5');
  });

  it('interpreta un punto con 3 o más decimales como separador de millares', () => {
    expect(formatCurrencyInput('1234.567')).toBe('1.234.567');
  });

  it('usa la coma como separador decimal y recorta a 2 decimales', () => {
    expect(formatCurrencyInput('1234,5')).toBe('1.234,5');
    expect(formatCurrencyInput('1234,5678')).toBe('1.234,56');
  });

  it('descarta letras y símbolos', () => {
    expect(formatCurrencyInput('USD 1234,50')).toBe('1.234,50');
    expect(formatCurrencyInput('12a3b4')).toBe('1.234');
  });

  it('elimina ceros a la izquierda', () => {
    expect(formatCurrencyInput('007')).toBe('7');
    expect(formatCurrencyInput('0')).toBe('0');
  });
});

describe('completeCurrencyInput', () => {
  it('devuelve vacío si no hay nada que completar', () => {
    expect(completeCurrencyInput('')).toBe('');
    expect(completeCurrencyInput('abc')).toBe('');
  });

  it('rellena los decimales hasta dos dígitos', () => {
    expect(completeCurrencyInput('1234')).toBe('1.234,00');
    expect(completeCurrencyInput('1234,5')).toBe('1.234,50');
  });

  it('conserva los decimales ya escritos', () => {
    expect(completeCurrencyInput('1234,56')).toBe('1.234,56');
  });
});

describe('monthYearToInputValue', () => {
  it('normaliza MM/AAAA a AAAA-MM', () => {
    expect(monthYearToInputValue('03/2024')).toBe('2024-03');
    expect(monthYearToInputValue('12/1999')).toBe('1999-12');
  });

  it('deja intacto un valor ya en formato de input', () => {
    expect(monthYearToInputValue('2024-03')).toBe('2024-03');
    expect(monthYearToInputValue('  2024-03  ')).toBe('2024-03');
  });

  it('recorta una fecha completa a AAAA-MM', () => {
    expect(monthYearToInputValue('2024-03-15')).toBe('2024-03');
  });

  it('devuelve vacío con valores inválidos', () => {
    expect(monthYearToInputValue(undefined)).toBe('');
    expect(monthYearToInputValue('')).toBe('');
    expect(monthYearToInputValue('   ')).toBe('');
    expect(monthYearToInputValue('2024-13')).toBe('');
    expect(monthYearToInputValue('13/2024')).toBe('');
    expect(monthYearToInputValue('marzo 2024')).toBe('');
  });
});

describe('monthInputValueToMonthYear', () => {
  it('convierte AAAA-MM a MM/AAAA', () => {
    expect(monthInputValueToMonthYear('2024-03')).toBe('03/2024');
  });

  it('devuelve vacío con valores que no son de input', () => {
    expect(monthInputValueToMonthYear('03/2024')).toBe('');
    expect(monthInputValueToMonthYear('2024-13')).toBe('');
    expect(monthInputValueToMonthYear('')).toBe('');
  });
});

describe('isValidMonthYear', () => {
  it('acepta ambos formatos, con o sin espacios', () => {
    expect(isValidMonthYear('03/2024')).toBe(true);
    expect(isValidMonthYear('2024-03')).toBe(true);
    expect(isValidMonthYear('  03/2024  ')).toBe(true);
  });

  it('rechaza meses fuera de rango y valores vacíos', () => {
    expect(isValidMonthYear('13/2024')).toBe(false);
    expect(isValidMonthYear('2024-00')).toBe(false);
    expect(isValidMonthYear('2024-13')).toBe(false);
    expect(isValidMonthYear('')).toBe(false);
    expect(isValidMonthYear(undefined)).toBe(false);
    expect(isValidMonthYear('marzo')).toBe(false);
  });
});

describe('formatDate', () => {
  const date = new Date(2024, 0, 15, 14, 30);

  it('usa la locale por defecto (es), con el día primero', () => {
    expect(formatDate(date)).toMatch(/^15\/01\/2024,/);
  });

  it('usa el orden mes/día con la locale en', () => {
    expect(formatDate(date, 'en')).toMatch(/^01\/15\/2024,/);
  });

  it('acepta strings de fecha parseables', () => {
    expect(formatDate('2024-01-15T14:30:00')).toMatch(/^15\/01\/2024,/);
  });

  it('devuelve guión cuando no hay fecha o es inválida', () => {
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('')).toBe('-');
    expect(formatDate('no-es-fecha')).toBe('-');
    expect(formatDate(new Date('no-es-fecha'))).toBe('-');
  });
});

describe('formatErrorMessage', () => {
  it('devuelve el string tal cual', () => {
    expect(formatErrorMessage('Algo salió mal')).toBe('Algo salió mal');
  });

  it('extrae el message de un Error', () => {
    expect(formatErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('extrae el message de cualquier objeto que lo traiga', () => {
    expect(formatErrorMessage({ message: 'custom' })).toBe('custom');
    expect(formatErrorMessage({ message: 42 })).toBe('42');
  });

  it('usa un mensaje genérico por locale cuando no hay message', () => {
    expect(formatErrorMessage(null)).toBe('Ha ocurrido un error inesperado');
    expect(formatErrorMessage(undefined)).toBe('Ha ocurrido un error inesperado');
    expect(formatErrorMessage(42)).toBe('Ha ocurrido un error inesperado');
    expect(formatErrorMessage({ sin: 'message' })).toBe(
      'Ha ocurrido un error inesperado',
    );
    expect(formatErrorMessage(null, 'en')).toBe('An unexpected error occurred');
  });
});
