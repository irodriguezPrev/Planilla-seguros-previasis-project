import { defaultLocale } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

export function formatCurrencyInput(value: string): string {
  const sanitized = value.replace(/[^\d.,]/g, '');
  const commaIndex = sanitized.lastIndexOf(',');
  const dotIndex = sanitized.lastIndexOf('.');
  const dotFractionLength = dotIndex >= 0
    ? sanitized.slice(dotIndex + 1).replace(/\D/g, '').length
    : 0;
  const hasDecimalSeparator = commaIndex >= 0 || (dotIndex >= 0 && dotFractionLength <= 2);
  const separatorIndex = commaIndex >= 0 ? commaIndex : hasDecimalSeparator ? dotIndex : -1;
  const integerPart = (separatorIndex >= 0 ? sanitized.slice(0, separatorIndex) : sanitized)
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '');
  const decimalPart = separatorIndex >= 0
    ? sanitized.slice(separatorIndex + 1).replace(/\D/g, '').slice(0, 2)
    : '';
  const groupedInteger = (integerPart || (sanitized ? '0' : ''))
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (!groupedInteger) return '';
  return hasDecimalSeparator ? `${groupedInteger},${decimalPart}` : groupedInteger;
}

export function completeCurrencyInput(value: string): string {
  const formatted = formatCurrencyInput(value);
  if (!formatted) return '';
  const [integerPart, decimalPart = ''] = formatted.split(',');
  return `${integerPart},${decimalPart.padEnd(2, '0')}`;
}

export function monthYearToInputValue(value: string | undefined): string {
  const normalized = value?.trim() || '';
  const inputValueMatch = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (inputValueMatch) return normalized;

  const monthYearMatch = normalized.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    return `${year}-${month}`;
  }

  const fullDateMatch = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/);
  return fullDateMatch ? `${fullDateMatch[1]}-${fullDateMatch[2]}` : '';
}

export function monthInputValueToMonthYear(value: string): string {
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return '';

  const [, year, month] = match;
  return `${month}/${year}`;
}

export interface MonthYear {
  year: number;
  month: number;
}

/**
 * Extrae año y mes de los formatos de fecha que admite la planilla: `MM/AAAA`,
 * `AAAA-MM`, `AAAA-MM-DD` y `DD/MM/AAAA`. Devuelve `null` si el formato no es válido.
 *
 * Aceptar los mismos formatos que `formatPdfDate` evita invalidar borradores ya guardados
 * con día completo (`DD/MM/AAAA`) o con ISO completo (`AAAA-MM-DD`).
 */
export function parseMonthYear(value: string | undefined): MonthYear | null {
  const normalized = value?.trim() || '';

  const monthYearMatch = normalized.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if (monthYearMatch) return { month: Number(monthYearMatch[1]), year: Number(monthYearMatch[2]) };

  const inputMonthMatch = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (inputMonthMatch) return { year: Number(inputMonthMatch[1]), month: Number(inputMonthMatch[2]) };

  const isoDateMatch = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/);
  if (isoDateMatch) return { year: Number(isoDateMatch[1]), month: Number(isoDateMatch[2]) };

  const dayMonthYearMatch = normalized.match(/^\d{2}\/(0[1-9]|1[0-2])\/(\d{4})$/);
  if (dayMonthYearMatch) return { month: Number(dayMonthYearMatch[1]), year: Number(dayMonthYearMatch[2]) };

  return null;
}

export function isValidMonthYear(value: string | undefined): boolean {
  return parseMonthYear(value) !== null;
}

/**
 * `true` solo si la fecha tiene formato válido **y** su mes no es posterior al mes en curso.
 *
 * El mes en curso es válido; el mes siguiente ya cuenta como futuro. La comparación usa
 * aritmética de mes (`year * 12 + month`) en lugar de `Date` para no sufrir off-by-one
 * por zona horaria, igual que `calculateActuarialAge`.
 */
export function isValidPastMonthYear(
  value: string | undefined,
  now: Date = new Date(),
): boolean {
  const parsed = parseMonthYear(value);
  if (!parsed) return false;

  return parsed.year * 12 + parsed.month <= now.getFullYear() * 12 + (now.getMonth() + 1);
}

export function formatDate(date: string | Date | undefined, locale: Locale = defaultLocale): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  const intlLocale = locale === 'es' ? 'es-VE' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatErrorMessage(error: unknown, locale: Locale = defaultLocale): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  const messages: Record<Locale, Record<string, string>> = {
    es: {
      error: 'Ha ocurrido un error inesperado',
    },
    en: {
      error: 'An unexpected error occurred',
    },
  };
  return messages[locale].error;
}
