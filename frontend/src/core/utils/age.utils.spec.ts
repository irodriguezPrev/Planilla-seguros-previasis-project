import { describe, expect, it } from 'vitest';

import { birthDateYearsAgo } from '@/test/date-helpers';
import { calculateActuarialAge, isMinor } from '@/core/utils/age.utils';

describe('calculateActuarialAge', () => {
  it('calcula la edad exacta en el cumpleaños', () => {
    // 2024-05-10 = 34 años cumplidos. El próximo cumpleaños está a 0
    // meses (<= 6), así que la regla de redondeo lo lleva a 35.
    expect(calculateActuarialAge('1990-05-10', '2024-05-10')).toBe(35);
  });

  it('no redondea el día después del cumpleaños', () => {
    expect(calculateActuarialAge('1990-05-10', '2024-05-11')).toBe(34);
  });

  it('acepta el formato DD/MM/YYYY', () => {
    expect(calculateActuarialAge('10/05/1990', '2024-05-10')).toBe(35);
  });

  it('acepta objetos Date', () => {
    expect(
      calculateActuarialAge(new Date(1999, 11, 31), new Date(2024, 11, 31)),
    ).toBe(26);
  });

  it('redondea hacia arriba cuando faltan 6 meses o menos', () => {
    // 15/06 -> 01/12 = 169 días ≈ 5.6 meses
    expect(calculateActuarialAge('1990-12-01', '2024-06-15')).toBe(34);
  });

  it('no redondea cuando faltan más de 6 meses', () => {
    // 01/05 -> 01/12 = 214 días ≈ 7.0 meses
    expect(calculateActuarialAge('1990-12-01', '2024-05-01')).toBe(33);
  });

  it('usa la fecha actual como referencia por defecto', () => {
    expect(calculateActuarialAge(birthDateYearsAgo(30))).toBe(30);
  });

  it('devuelve null con una fecha de nacimiento imposible', () => {
    expect(calculateActuarialAge('1990-02-31', '2024-01-01')).toBeNull();
  });

  it('devuelve null con una fecha de nacimiento mal formada', () => {
    expect(calculateActuarialAge('no-es-fecha', '2024-01-01')).toBeNull();
    expect(calculateActuarialAge('', '2024-01-01')).toBeNull();
  });

  it('devuelve null con una referencia inválida', () => {
    expect(calculateActuarialAge('1990-05-10', '31/02/2024')).toBeNull();
    expect(calculateActuarialAge('1990-05-10', 'no-es-fecha')).toBeNull();
  });

  it('devuelve null cuando la fecha de nacimiento es futura', () => {
    expect(calculateActuarialAge('2030-01-01', '2024-01-01')).toBeNull();
  });
});

describe('isMinor', () => {
  it('es menor cuando aún no cumple el umbral', () => {
    expect(isMinor(birthDateYearsAgo(17))).toBe(true);
  });

  it('deja de ser menor el día del cumpleaños', () => {
    expect(isMinor(birthDateYearsAgo(18))).toBe(false);
  });

  it('no es menor con más edad que el umbral', () => {
    expect(isMinor(birthDateYearsAgo(20))).toBe(false);
  });

  it('respeta un umbral personalizado', () => {
    expect(isMinor(birthDateYearsAgo(20), 21)).toBe(true);
    expect(isMinor(birthDateYearsAgo(25), 21)).toBe(false);
  });

  it('devuelve false con una fecha inválida', () => {
    // Comportamiento actual: una fecha ilegible no se considera menor.
    expect(isMinor('no-es-fecha')).toBe(false);
    expect(isMinor('')).toBe(false);
    expect(isMinor('1990-02-31')).toBe(false);
  });
});
