import { describe, expect, it } from 'vitest';

import {
  ZONES,
  ZONE_MAPPING,
  getZoneFromState,
  getZoneLabel,
} from '@/core/config/zone-config';

describe('ZONE_MAPPING', () => {
  // Subconjuntos tipados: indexar con un `string` suelto pasaría un estado
  // inexistente por alto en cuanto el mapa deje de ser `Record<string, Zone>`.
  const ZONA_1 = ['Lara', 'Yaracuy', 'Portuguesa', 'Zulia'] as const;
  const ZONA_2 = ['Carabobo', 'Distrito Capital', 'Miranda', 'Falcón'] as const;

  it('clasifica los estados de la Zona 1', () => {
    for (const state of ZONA_1) {
      expect(ZONE_MAPPING[state]).toBe('Zona 1');
    }
  });

  it('clasifica los estados de la Zona 2', () => {
    for (const state of ZONA_2) {
      expect(ZONE_MAPPING[state]).toBe('Zona 2');
    }
  });

  it('cubre los 24 estados y nada más', () => {
    expect(Object.keys(ZONE_MAPPING)).toHaveLength(24);
  });
});

describe('ZONES', () => {
  it('expone las dos zonas disponibles', () => {
    expect(ZONES).toEqual(['Zona 1', 'Zona 2']);
  });
});

describe('getZoneFromState', () => {
  it('resuelve un estado mapeado', () => {
    expect(getZoneFromState('Lara')).toBe('Zona 1');
    expect(getZoneFromState('Zulia')).toBe('Zona 1');
    expect(getZoneFromState('Miranda')).toBe('Zona 2');
    expect(getZoneFromState('Falcón')).toBe('Zona 2');
  });

  it('usa el fallback Zona 2 con estados desconocidos', () => {
    expect(getZoneFromState('Bolívar')).toBe('Zona 2');
    expect(getZoneFromState('Amazonas')).toBe('Zona 2');
    expect(getZoneFromState('estado inventado')).toBe('Zona 2');
    // 'Caracas' dejó de existir como clave: hoy es 'Distrito Capital'. El
    // nombre viejo no debe romper nada, cae al fallback.
    expect(getZoneFromState('Caracas')).toBe('Zona 2');
  });

  it('usa el fallback Zona 2 con valores vacíos', () => {
    expect(getZoneFromState('')).toBe('Zona 2');
  });
});

describe('getZoneLabel', () => {
  it('devuelve la zona sin transformar', () => {
    expect(getZoneLabel('Zona 1')).toBe('Zona 1');
    expect(getZoneLabel('Zona 2')).toBe('Zona 2');
  });
});
