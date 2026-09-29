export type Zone = 'Zona 1' | 'Zona 2';

export const ZONE_MAPPING: Record<string, Zone> = {
  'Lara': 'Zona 1',
  'Yaracuy': 'Zona 1',
  'Portuguesa': 'Zona 1',
  'Zulia': 'Zona 1',
  'Carabobo': 'Zona 2',
  'Caracas': 'Zona 2',
  'Miranda': 'Zona 2',
  'Falcón': 'Zona 2',
};

export const ZONES: Zone[] = ['Zona 1', 'Zona 2'];

export function getZoneFromState(state: string): Zone {
  if (!state) return 'Zona 2';
  return ZONE_MAPPING[state] ?? 'Zona 2';
}

export function getZoneLabel(zone: Zone): string {
  return zone;
}