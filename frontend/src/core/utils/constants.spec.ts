import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_SIZE,
  MEDICATION_TIME_UNITS,
  USER_ROLES,
  getMedicationTimeUnitLabel,
} from '@/core/utils/constants';

describe('USER_ROLES', () => {
  it('expone los roles con sus valores', () => {
    expect(USER_ROLES).toEqual({
      ADMIN: 'admin',
      USER: 'user',
      PLAYER: 'player',
      REFEREE: 'referee',
    });
    expect(DEFAULT_PAGE_SIZE).toBe(10);
  });
});

describe('getMedicationTimeUnitLabel', () => {
  it('devuelve el singular por defecto', () => {
    expect(getMedicationTimeUnitLabel('minuto')).toBe('Minuto');
    expect(getMedicationTimeUnitLabel('hora')).toBe('Hora');
    expect(getMedicationTimeUnitLabel('dia')).toBe('Día');
    expect(getMedicationTimeUnitLabel('semana')).toBe('Semana');
  });

  it('pluraliza cuando la cantidad es mayor que1', () => {
    expect(getMedicationTimeUnitLabel('minuto', 2)).toBe('Minutos');
    expect(getMedicationTimeUnitLabel('hora', 3)).toBe('Horas');
    expect(getMedicationTimeUnitLabel('dia', 5)).toBe('Días');
    expect(getMedicationTimeUnitLabel('semana', 2)).toBe('Semanas');
    expect(getMedicationTimeUnitLabel('mes', 2)).toBe('Meses');
  });

  it('usa el singular con cantidades no mayores que1', () => {
    expect(getMedicationTimeUnitLabel('hora', 1)).toBe('Hora');
    expect(getMedicationTimeUnitLabel('hora', 0)).toBe('Hora');
    expect(getMedicationTimeUnitLabel('hora', -3)).toBe('Hora');
  });

  it('ignora mayúsculas y espacios alrededor de la unidad', () => {
    expect(getMedicationTimeUnitLabel('  HORA ')).toBe('Hora');
    expect(getMedicationTimeUnitLabel('Hora', 2)).toBe('Horas');
  });

  it('en modo pdf usa las etiquetas en minúscula', () => {
    expect(getMedicationTimeUnitLabel('hora', 1, 'pdf')).toBe('hora');
    expect(getMedicationTimeUnitLabel('hora', 2, 'pdf')).toBe('horas');
    expect(getMedicationTimeUnitLabel('dia', 1, 'pdf')).toBe('día');
    expect(getMedicationTimeUnitLabel('dia', 4, 'pdf')).toBe('días');
  });

  it('devuelve la unidad original si no está en el catálogo', () => {
    expect(getMedicationTimeUnitLabel('quincena')).toBe('quincena');
    expect(getMedicationTimeUnitLabel('quincena', 3)).toBe('quincena');
  });

  it('devuelve vacío con unidades nulas o indefinidas', () => {
    expect(getMedicationTimeUnitLabel('')).toBe('');
    expect(getMedicationTimeUnitLabel(undefined as unknown as string)).toBe('');
    expect(getMedicationTimeUnitLabel(null as unknown as string)).toBe('');
  });

  it('cada unidad del catálogo tiene las cuatro etiquetas', () => {
    for (const [key, unit] of Object.entries(MEDICATION_TIME_UNITS)) {
      expect(getMedicationTimeUnitLabel(key, 1)).toBe(unit.singular);
      expect(getMedicationTimeUnitLabel(key, 2)).toBe(unit.plural);
      expect(getMedicationTimeUnitLabel(key, 1, 'pdf')).toBe(unit.pdfSingular);
      expect(getMedicationTimeUnitLabel(key, 2, 'pdf')).toBe(unit.pdfPlural);
    }
  });
});
