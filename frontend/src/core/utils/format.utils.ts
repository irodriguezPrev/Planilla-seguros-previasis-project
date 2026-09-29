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

export function isValidMonthYear(value: string | undefined): boolean {
  const normalized = value?.trim() || '';
  return /^(0[1-9]|1[0-2])\/\d{4}$/.test(normalized) ||
    /^\d{4}-(0[1-9]|1[0-2])$/.test(normalized);
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
