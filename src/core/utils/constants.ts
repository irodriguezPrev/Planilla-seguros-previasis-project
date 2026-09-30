export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PLAYER: 'player',
  REFEREE: 'referee',
} as const;

export const DEFAULT_PAGE_SIZE = 10;

// Identifica la fila de afiliados que representa al titular y la vincula con el Step 1.
export const AFFILIATION_POLICYHOLDER_ROW_ID = 'policyholder_row';

export const MEDICATION_TIME_UNITS = {
  minuto: {
    singular: 'Minuto',
    plural: 'Minutos',
    pdfSingular: 'minuto',
    pdfPlural: 'minutos',
  },
  hora: {
    singular: 'Hora',
    plural: 'Horas',
    pdfSingular: 'hora',
    pdfPlural: 'horas',
  },
  dia: {
    singular: 'Día',
    plural: 'Días',
    pdfSingular: 'día',
    pdfPlural: 'días',
  },
  semana: {
    singular: 'Semana',
    plural: 'Semanas',
    pdfSingular: 'semana',
    pdfPlural: 'semanas',
  },
  mes: {
    singular: 'Mes',
    plural: 'Meses',
    pdfSingular: 'mes',
    pdfPlural: 'meses',
  },
} as const;

export const getMedicationTimeUnitLabel = (
  unit: string,
  quantity: number = 1,
  mode: 'display' | 'pdf' = 'display',
): string => {
  const normalizedUnit = String(unit ?? '').trim().toLowerCase();
  const unitConfig = MEDICATION_TIME_UNITS[
    normalizedUnit as keyof typeof MEDICATION_TIME_UNITS
  ];

  if (!unitConfig) {
    return String(unit ?? '');
  }

  if (mode === 'pdf') {
    return quantity > 1 ? unitConfig.pdfPlural : unitConfig.pdfSingular;
  }

  return quantity > 1 ? unitConfig.plural : unitConfig.singular;
};
