import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateActuarialAge, isMinor } from './age.utils';

/**
 * Edad actuarial: edad cronológica redondeada hacia arriba cuando el próximo
 * cumpleaños está a seis meses o menos. La redondeo se mide con aritmética de
 * meses calendario (no 365.25 días), por eso los casos de fin de mes y años
 * bisiestos son casos de borde reales y no acad heating.
 */
describe('calculateActuarialAge', () => {
  it.each([
    // Frontera de los 6 meses: el día exacto redondea hacia arriba.
    ['1997-11-15', '2026-05-15', 29],
    ['1997-11-15', '2026-05-16', 29],
    // Un día después de la frontera ya no redondea.
    ['1997-11-15', '2026-05-14', 28],
    ['1997-11-15', '2026-04-01', 28],
    ['1997-11-15', '2026-09-30', 29],
    // El día del cumpleaños no debe saltar todavía al siguiente entero.
    ['1997-11-15', '2026-11-14', 29],
    ['1997-11-15', '2026-11-15', 29],
    ['1997-11-15', '2026-11-16', 29],
    ['1997-11-15', '2026-12-01', 29],
    // Independencia de la hora del día: la regla opera sobre fechas, no horas.
    ['1997-11-15', new Date(2026, 4, 16, 0, 0, 0, 0), 29],
    ['1997-11-15', new Date(2026, 4, 16, 23, 59, 59, 999), 29],
  ] as [string | Date, string | Date, number | null][])(
    'nacimiento %s con referencia %s da %s',
    (birthDate, reference, expected) => {
      expect(calculateActuarialAge(birthDate, reference)).toBe(expected);
    },
  );

  it('usa cronología pura cuando faltan más de seis meses para el cumpleaños', () => {
    // Cumpleaños en diciembre y referencia en mayo: más de 6 meses restantes.
    expect(calculateActuarialAge('2000-12-15', '2026-05-15')).toBe(25);
  });

  it('redondea cuando faltan exactamente seis meses en meses calendario', () => {
    expect(calculateActuarialAge('2000-12-15', '2026-06-15')).toBe(26);
  });

  it('recorta el día al añadir meses en meses cortos (31/01 + 6 meses)', () => {
    // addMonths(31 jul, 6) cae en 31 ene, día válido; el cumpleaños cae ese mismo día.
    expect(calculateActuarialAge('1996-01-31', '1996-07-31')).toBe(1);
  });

  it('no rompe la regla cuando el cumpleaños es el 28 de febrero', () => {
    expect(calculateActuarialAge('1999-02-28', '2026-08-28')).toBe(28);
  });

  it('acepta el formato DD/MM/YYYY igual que YYYY-MM-DD', () => {
    expect(calculateActuarialAge('15/11/1997', '2026-05-15')).toBe(29);
  });

  it('tolera espacios alrededor de la fecha', () => {
    expect(calculateActuarialAge('  1997-11-15  ', '2026-05-15')).toBe(29);
  });

  it('acepta objetos Date como fecha de nacimiento', () => {
    expect(calculateActuarialAge(new Date(1997, 10, 15), '2026-05-15')).toBe(29);
  });

  describe('entradas inválidas', () => {
    it.each([
      ['texto arbitrario', 'not-a-date'],
      ['cadena vacía', ''],
      ['formato no soportado', '15-11-1997'],
      ['mes fuera de rango', '1997-13-01'],
      ['día fuera de rango', '1997-01-32'],
      ['31 de febrero en YYYY-MM-DD', '1997-02-31'],
      ['29 de febrero en año no bisiesto (YYYY-MM-DD)', '2001-02-29'],
      ['29 de febrero en año no bisiesto (DD/MM/YYYY)', '29/02/2001'],
      ['31 de febrero en DD/MM/YYYY', '31/02/1997'],
    ])('devuelve null para %s (%s)', (_descripcion, value) => {
      expect(calculateActuarialAge(value, '2026-01-01')).toBeNull();
    });

    it('devuelve null cuando el nacimiento es futuro respecto a la referencia', () => {
      expect(calculateActuarialAge('2030-01-01', '2026-01-01')).toBeNull();
    });

    it('devuelve null cuando la fecha de referencia es inválida', () => {
      expect(calculateActuarialAge('1997-11-15', 'basura')).toBeNull();
    });
  });

  it('acepta como válido el 29 de febrero de un año bisiesto', () => {
    expect(calculateActuarialAge('2000-02-29', '2026-08-15')).toBe(26);
    expect(calculateActuarialAge('2000-02-29', '2027-08-15')).toBe(27);
  });

  it('no redondea el 29 de febrero el mismo día de cumpleaños en año bisiesto', () => {
    expect(calculateActuarialAge('2000-02-29', '2024-02-29')).toBe(24);
  });
});

/**
 * isMinor usa un algoritmo distinto al de calculateActuarialAge: cronológico
 * puro con corte por fecha, sin redondeo actuarial.
 *
 * DIVERGENCIA CONOCIDA: minor-document.utils.ts aplica su propio umbral (13)
 * con un tercer algoritmo. Ver tariff-and-age.test.ts para los casos concretos
 * en que las tres reglas no coinciden.
 */
describe('isMinor', () => {
  beforeEach(() => {
    // isMinor no acepta fecha de referencia: hay que fijar el reloj.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1)); // 1 de octubre de 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve false el día exacto en que se cumple la edad', () => {
    expect(isMinor('2008-10-01')).toBe(false);
  });

  it('devuelve true un día antes de cumplir los 18', () => {
    expect(isMinor('2008-10-02')).toBe(true);
  });

  it('devuelve false un día después de cumplir los 18', () => {
    expect(isMinor('2008-09-30')).toBe(false);
  });

  it('devuelve false para un adulto con fecha inválida en vez de lanzar', () => {
    expect(isMinor('no-es-una-fecha')).toBe(false);
    expect(isMinor('')).toBe(false);
  });

  it('respeta un umbral distinto al de 18', () => {
    // Corte en 2024-10-01: un nacido el 02/10/2024 todavía no cumple 2 años.
    expect(isMinor('2024-10-02', 2)).toBe(true);
    expect(isMinor('2024-10-01', 2)).toBe(false);
  });

  // DIVERGENCIA CONOCIDA: esta persona tiene 17 años cronológicos y cumple en
  // menos de seis meses. calculateActuarialAge redondea a 18 (y por tanto la
  // regla de plan la trata como adulta), mientras isMinor la sigue
  // considerando menor. En un mismo formulario el Step 3 puede ofrecer planes
  // de adulto y minor-document aplicar el documento de menor a la vez.
  it('no aplica el redondeo actuarial de seis meses', () => {
    expect(calculateActuarialAge('2008-10-02', '2026-10-01')).toBe(18);
    expect(isMinor('2008-10-02')).toBe(true);
  });
});
