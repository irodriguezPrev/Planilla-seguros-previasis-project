import { describe, expect, it } from 'vitest';
import {
  completeCurrencyInput,
  formatCurrencyInput,
  formatDate,
  formatErrorMessage,
  isValidMonthYear,
  isValidPastMonthYear,
  monthInputValueToMonthYear,
  monthYearToInputValue,
  parseMonthYear,
} from './format.utils';

describe('formatCurrencyInput', () => {
  it.each([
    ['', ''],
    ['texto', ''],
    ['1234', '1.234'],
    ['001234', '1.234'],
    ['1234,5', '1.234,5'],
    ['1234,567', '1.234,56'],
    ['1.234,56', '1.234,56'],
    ['1234.56', '1.234,56'],
    ['1.234', '1.234'],
    ['12.345.67', '12.345,67'],
    ['Bs. 1.234,56', '1.234,56'],
    [',5', '0,5'],
    ['.', '0,'],
  ])('formatea %j como %j', (value, expected) => {
    expect(formatCurrencyInput(value)).toBe(expected);
  });
});

describe('completeCurrencyInput', () => {
  it.each([
    ['', ''],
    ['1234', '1.234,00'],
    ['1234,5', '1.234,50'],
    ['1234,56', '1.234,56'],
    ['1234,567', '1.234,56'],
  ])('completa los decimales de %j como %j', (value, expected) => {
    expect(completeCurrencyInput(value)).toBe(expected);
  });
});

describe('monthYearToInputValue', () => {
  it.each([
    ['2021-05', '2021-05'],
    ['05/2021', '2021-05'],
    [' 05/2021 ', '2021-05'],
    ['2021-05-15', '2021-05'],
    ['2021-13', ''],
    ['13/2021', ''],
    ['texto', ''],
    ['', ''],
    [undefined, ''],
  ])('convierte %j al valor mensual %j', (value, expected) => {
    expect(monthYearToInputValue(value)).toBe(expected);
  });
});

describe('monthInputValueToMonthYear', () => {
  it.each([
    ['2021-05', '05/2021'],
    ['1999-12', '12/1999'],
    ['2021-13', ''],
    ['05/2021', ''],
    ['', ''],
  ])('convierte %j al formato de planilla %j', (value, expected) => {
    expect(monthInputValueToMonthYear(value)).toBe(expected);
  });
});

/**
 * Fechas de diagnóstico del Step 4. El campo es de granularidad mensual (`MM/AAAA`), pero
 * la planilla ya tiene borradores guardados en `DD/MM/AAAA` y `AAAA-MM-DD`, así que el
 * parser acepta los mismos formatos que `formatPdfDate` del PDF.
 */
describe('parseMonthYear', () => {
  it.each([
    ['05/2021', { year: 2021, month: 5 }],
    ['12/1999', { year: 1999, month: 12 }],
    ['2021-05', { year: 2021, month: 5 }],
    ['2021-05-15', { year: 2021, month: 5 }],
    ['15/05/2021', { year: 2021, month: 5 }],
    ['  05/2021  ', { year: 2021, month: 5 }],
  ])('interpreta %s', (value, expected) => {
    expect(parseMonthYear(value)).toEqual(expected);
  });

  it.each([
    ['13/2021'],
    ['00/2021'],
    ['2021-13'],
    ['2021-00'],
    ['5/21'],
    ['2021'],
    ['abc'],
    [''],
    ['   '],
  ])('rechaza el formato %s', (value) => {
    expect(parseMonthYear(value)).toBeNull();
  });

  it.each([[undefined], [null], ['']])('devuelve null para %s', (value) => {
    expect(parseMonthYear(value as string | undefined)).toBeNull();
  });
});

describe('isValidMonthYear', () => {
  it('acepta los formatos de fecha de diagnóstico soportados', () => {
    expect(isValidMonthYear('05/2021')).toBe(true);
    expect(isValidMonthYear('2021-05')).toBe(true);
    expect(isValidMonthYear('2021-05-15')).toBe(true);
    expect(isValidMonthYear('15/05/2021')).toBe(true);
  });

  it('rechaza valores vacíos o con formato inválido', () => {
    expect(isValidMonthYear('')).toBe(false);
    expect(isValidMonthYear(undefined)).toBe(false);
    expect(isValidMonthYear('13/2021')).toBe(false);
  });
});

describe('isValidPastMonthYear', () => {
  // Mes de referencia fijo para que los casos no dependan del día en que se ejecuta.
  const now = new Date(2026, 4, 15); // mayo de 2026

  it('acepta el mes en curso: no es una fecha futura', () => {
    expect(isValidPastMonthYear('05/2026', now)).toBe(true);
    expect(isValidPastMonthYear('2026-05', now)).toBe(true);
    expect(isValidPastMonthYear('15/05/2026', now)).toBe(true);
    expect(isValidPastMonthYear('2026-05-31', now)).toBe(true);
  });

  it('acepta meses y años anteriores', () => {
    expect(isValidPastMonthYear('04/2026', now)).toBe(true);
    expect(isValidPastMonthYear('12/2025', now)).toBe(true);
    expect(isValidPastMonthYear('05/1990', now)).toBe(true);
  });

  it('rechaza el mes siguiente y los años posteriores', () => {
    expect(isValidPastMonthYear('06/2026', now)).toBe(false);
    expect(isValidPastMonthYear('2026-06', now)).toBe(false);
    expect(isValidPastMonthYear('01/2027', now)).toBe(false);
    expect(isValidPastMonthYear('05/2030', now)).toBe(false);
  });

  it('funciona en diciembre sin desbordar al año siguiente', () => {
    const december = new Date(2026, 11, 1);
    expect(isValidPastMonthYear('12/2026', december)).toBe(true);
    expect(isValidPastMonthYear('01/2027', december)).toBe(false);
  });

  it('rechaza formatos inválidos aunque parezcan fechas pasadas', () => {
    expect(isValidPastMonthYear('13/2020', now)).toBe(false);
    expect(isValidPastMonthYear('2020-13', now)).toBe(false);
    expect(isValidPastMonthYear('2020', now)).toBe(false);
    expect(isValidPastMonthYear('hace 3 años', now)).toBe(false);
  });

  it('rechaza valores vacíos: la obligatoriedad la resuelve el campo requerido', () => {
    expect(isValidPastMonthYear('', now)).toBe(false);
    expect(isValidPastMonthYear(undefined, now)).toBe(false);
  });

  it('usa el mes en curso cuando no se pasa una fecha de referencia', () => {
    expect(isValidPastMonthYear('05/2021')).toBe(true);
  });
});

describe('formatDate', () => {
  const date = new Date('2026-05-10T12:00:00.000Z');

  it('devuelve un guion para valores ausentes o fechas inválidas', () => {
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('fecha inválida')).toBe('-');
  });

  it('formatea objetos Date con la configuración regional en español por defecto', () => {
    const formatted = formatDate(date);

    expect(formatted).not.toBe('-');
    expect(formatted).toContain('2026');
    expect(formatted).toMatch(/10.*05|05.*10/);
  });

  it('formatea cadenas de fecha con la configuración regional en inglés', () => {
    const formatted = formatDate(date.toISOString(), 'en');

    expect(formatted).not.toBe('-');
    expect(formatted).toContain('2026');
    expect(formatted).toMatch(/05.*10/);
  });
});

describe('formatErrorMessage', () => {
  it('conserva los mensajes que ya son cadenas', () => {
    expect(formatErrorMessage('Error conocido')).toBe('Error conocido');
  });

  it('extrae y convierte la propiedad message de objetos de error', () => {
    expect(formatErrorMessage(new Error('Falló la solicitud'))).toBe('Falló la solicitud');
    expect(formatErrorMessage({ message: 404 })).toBe('404');
  });

  it('usa el mensaje genérico del idioma solicitado para otros valores', () => {
    expect(formatErrorMessage(null)).toBe('Ha ocurrido un error inesperado');
    expect(formatErrorMessage(42, 'en')).toBe('An unexpected error occurred');
  });
});
