import type { VenezuelaState } from './venezuela-locations.config';

export type Zone = 'Zona 1' | 'Zona 2';

/**
 * Tarifa por estado. Mapa exhaustivo de los 24 estados: TypeScript exige que
 * todos estén declarados, así que un estado nuevo sin zona asignada rompe la
 * compilación en vez de resolverse por defecto.
 * Zona 1: Lara, Portuguesa, Yaracuy y Zulia. Todo lo demás: Zona 2.
 */
export const ZONE_MAPPING: Record<VenezuelaState, Zone> = {
  Amazonas: 'Zona 2',
  'Anzoátegui': 'Zona 2',
  Apure: 'Zona 2',
  Aragua: 'Zona 2',
  Barinas: 'Zona 2',
  'Bolívar': 'Zona 2',
  Carabobo: 'Zona 2',
  Cojedes: 'Zona 2',
  'Delta Amacuro': 'Zona 2',
  'Distrito Capital': 'Zona 2',
  'Falcón': 'Zona 2',
  'Guárico': 'Zona 2',
  'La Guaira': 'Zona 2',
  Lara: 'Zona 1',
  'Mérida': 'Zona 2',
  Miranda: 'Zona 2',
  Monagas: 'Zona 2',
  'Nueva Esparta': 'Zona 2',
  Portuguesa: 'Zona 1',
  Sucre: 'Zona 2',
  'Táchira': 'Zona 2',
  Trujillo: 'Zona 2',
  Yaracuy: 'Zona 1',
  Zulia: 'Zona 1',
};

export const ZONES: Zone[] = ['Zona 1', 'Zona 2'];

export function getZoneFromState(state?: string): Zone {
  if (!state) return 'Zona 2';
  return ZONE_MAPPING[state as VenezuelaState] ?? 'Zona 2';
}

export function getZoneLabel(zone: Zone): string {
  return zone;
}
