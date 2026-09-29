import type { Zone } from './zone-config';

export type PlanName = 'Previasís' | 'Abuelos' | '24/7';
export type AgeRange = '0-20' | '21-40' | '41-60' | '61-80' | '0-60';
export type Frequency = 'anual' | 'mensual';

export interface TariffZonePrice {
  anual: number;
  mensual: number | null;
}

export interface TariffEntry {
  plan: PlanName;
  cobertura: number;
  rango_edad: AgeRange;
  zona_1: TariffZonePrice;
  zona_2: TariffZonePrice;
}

export const TARIFFS: TariffEntry[] = [
  {
    plan: 'Previasís',
    cobertura: 10000,
    rango_edad: '0-20',
    zona_1: { anual: 206, mensual: 17 },
    zona_2: { anual: 264, mensual: 22 },
  },
  {
    plan: 'Previasís',
    cobertura: 10000,
    rango_edad: '21-40',
    zona_1: { anual: 243, mensual: 20 },
    zona_2: { anual: 311, mensual: 26 },
  },
  {
    plan: 'Previasís',
    cobertura: 10000,
    rango_edad: '41-60',
    zona_1: { anual: 284, mensual: 24 },
    zona_2: { anual: 364, mensual: 30 },
  },
  {
    plan: 'Previasís',
    cobertura: 15000,
    rango_edad: '0-20',
    zona_1: { anual: 242, mensual: 20 },
    zona_2: { anual: 310, mensual: 26 },
  },
  {
    plan: 'Previasís',
    cobertura: 15000,
    rango_edad: '21-40',
    zona_1: { anual: 286, mensual: 24 },
    zona_2: { anual: 366, mensual: 31 },
  },
  {
    plan: 'Previasís',
    cobertura: 15000,
    rango_edad: '41-60',
    zona_1: { anual: 334, mensual: 28 },
    zona_2: { anual: 428, mensual: 36 },
  },
  {
    plan: 'Previasís',
    cobertura: 25000,
    rango_edad: '0-20',
    zona_1: { anual: 344, mensual: 29 },
    zona_2: { anual: 440, mensual: 37 },
  },
  {
    plan: 'Previasís',
    cobertura: 25000,
    rango_edad: '21-40',
    zona_1: { anual: 406, mensual: 34 },
    zona_2: { anual: 520, mensual: 43 },
  },
  {
    plan: 'Previasís',
    cobertura: 25000,
    rango_edad: '41-60',
    zona_1: { anual: 474, mensual: 40 },
    zona_2: { anual: 607, mensual: 51 },
  },
  {
    plan: 'Previasís',
    cobertura: 40000,
    rango_edad: '0-20',
    zona_1: { anual: 448, mensual: 37 },
    zona_2: { anual: 573, mensual: 48 },
  },
  {
    plan: 'Previasís',
    cobertura: 40000,
    rango_edad: '21-40',
    zona_1: { anual: 528, mensual: 44 },
    zona_2: { anual: 676, mensual: 56 },
  },
  {
    plan: 'Previasís',
    cobertura: 40000,
    rango_edad: '41-60',
    zona_1: { anual: 617, mensual: 51 },
    zona_2: { anual: 790, mensual: 66 },
  },
  {
    plan: 'Abuelos',
    cobertura: 3000,
    rango_edad: '61-80',
    zona_1: { anual: 420, mensual: 35 },
    zona_2: { anual: 538, mensual: 45 },
  },
  {
    plan: 'Abuelos',
    cobertura: 5000,
    rango_edad: '61-80',
    zona_1: { anual: 602, mensual: 50 },
    zona_2: { anual: 771, mensual: 64 },
  },
  {
    plan: 'Abuelos',
    cobertura: 10000,
    rango_edad: '61-80',
    zona_1: { anual: 844, mensual: 70 },
    zona_2: { anual: 1080, mensual: 90 },
  },
  {
    plan: '24/7',
    cobertura: 2000,
    rango_edad: '0-60',
    zona_1: { anual: 31, mensual: null },
    zona_2: { anual: 40, mensual: null },
  },
  {
    plan: '24/7',
    cobertura: 3000,
    rango_edad: '0-60',
    zona_1: { anual: 35, mensual: null },
    zona_2: { anual: 45, mensual: null },
  },
  {
    plan: '24/7',
    cobertura: 5000,
    rango_edad: '0-60',
    zona_1: { anual: 42, mensual: null },
    zona_2: { anual: 54, mensual: null },
  },
  {
    plan: '24/7',
    cobertura: 10000,
    rango_edad: '0-60',
    zona_1: { anual: 55, mensual: null },
    zona_2: { anual: 70, mensual: null },
  },
];

export function getAgeRange(age: number): AgeRange | null {
  if (age < 0 || age > 80) return null;
  if (age <= 20) return '0-20';
  if (age <= 40) return '21-40';
  if (age <= 60) return '41-60';
  return '61-80';
}

export function getTariff(
  plan: PlanName,
  cobertura: number,
  ageRange: AgeRange,
  zone: Zone,
  frequency: Frequency
): number | null {
  const entry = TARIFFS.find(
    (t) =>
      t.plan === plan &&
      t.cobertura === cobertura &&
      t.rango_edad === ageRange
  );
  if (!entry) return null;

  const zonePrice = zone === 'Zona 1' ? entry.zona_1 : entry.zona_2;
  return zonePrice[frequency] ?? null;
}

export function getAvailableCoverages(plan: PlanName, ageRange: AgeRange): number[] {
  const coverages = TARIFFS.filter(
    (t) => t.plan === plan && t.rango_edad === ageRange
  ).map((t) => t.cobertura);
  return [...new Set(coverages)].sort((a, b) => a - b);
}

export function getAvailablePlans(age: number): PlanName[] {
  const ageRange = getAgeRange(age);
  if (!ageRange) return [];

  const plans = TARIFFS.filter((t) => t.rango_edad === ageRange).map((t) => t.plan);
  return [...new Set(plans)];
}

export function getPlansForAgeRange(ageRange: AgeRange): PlanName[] {
  const plans = TARIFFS.filter((t) => t.rango_edad === ageRange).map((t) => t.plan);
  return [...new Set(plans)];
}

export function formatCoverage(cobertura: number): string {
  return `$${cobertura.toLocaleString('es-VE')}`;
}

export function parseCoverageLimit(limit: string): number {
  return Number(limit.replace(/[$,.]/g, ''));
}

export function getMonthlyPriceFromTariff(
  plan: PlanName,
  cobertura: number,
  age: number,
  zone: Zone
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;
  return getTariff(plan, cobertura, ageRange, zone, 'mensual');
}

export function getAnnualPriceFromTariff(
  plan: PlanName,
  cobertura: number,
  age: number,
  zone: Zone
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;
  return getTariff(plan, cobertura, ageRange, zone, 'anual');
}

export function getPriceForFrequency(
  plan: PlanName,
  cobertura: number,
  age: number,
  zone: Zone,
  frequency: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual'
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;

  const annualPrice = getTariff(plan, cobertura, ageRange, zone, 'anual');
  const monthlyPrice = getTariff(plan, cobertura, ageRange, zone, 'mensual');

  if (annualPrice === null && monthlyPrice === null) return null;

  switch (frequency) {
    case 'Anual':
      return annualPrice;
    case 'Mensual':
      return monthlyPrice;
    case 'Trimestral':
      return monthlyPrice !== null ? monthlyPrice * 3 : annualPrice !== null ? annualPrice / 4 : null;
    case 'Semestral':
      return monthlyPrice !== null ? monthlyPrice * 6 : annualPrice !== null ? annualPrice / 2 : null;
    default:
      return null;
  }
}

export function hasMonthlyPrice(plan: PlanName): boolean {
  return plan !== '24/7';
}