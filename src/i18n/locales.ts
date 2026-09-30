export type Locale = 'es' | 'en';

export const locales: Locale[] = ['es', 'en'];

export const defaultLocale: Locale = 'es';

export const localeLabels: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
};
