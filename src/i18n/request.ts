import { getRequestConfig } from 'next-intl/server';
import { getUserLocale, loadMessages } from '@/i18n/server';

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
  };
});
