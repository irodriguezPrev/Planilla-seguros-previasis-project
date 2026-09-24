import { cookies } from 'next/headers';
import { defaultLocale, locales } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

export type { Locale };

export const getUserLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return defaultLocale;
};

export const getLocaleLabel = (locale: Locale): string => {
  const labels: Record<Locale, string> = {
    es: 'ES',
    en: 'EN',
  };
  return labels[locale] || 'ES';
};

export const loadMessages = async (locale: Locale): Promise<Record<string, any>> => {
  if (locale === 'es') {
    return import('@/messages/es.json').then((mod) => mod.default);
  }
  if (locale === 'en') {
    return import('@/messages/en.json').then((mod) => mod.default);
  }
  return import('@/messages/es.json').then((mod) => mod.default);
};
