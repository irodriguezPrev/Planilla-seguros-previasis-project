import { defaultLocale } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

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
