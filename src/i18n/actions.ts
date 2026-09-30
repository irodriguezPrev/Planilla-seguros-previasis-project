'use server';

import { cookies } from 'next/headers';
import { locales, defaultLocale } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';
import { revalidatePath } from 'next/cache';

export const setUserLocale = async (locale: string): Promise<void> => {
  const validLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  const cookieStore = await cookies();
  cookieStore.set('locale', validLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/');
};
