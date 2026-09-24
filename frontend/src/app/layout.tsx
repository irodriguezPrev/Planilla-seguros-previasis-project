import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getUserLocale, loadMessages } from '@/i18n/server';
import { AppProviders } from '@/features/context/AppProviders';
import { Navbar } from '@/core/components/common/Navbar';
import { Footer } from '@/core/components/common/Footer';
import '@/styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);
  const layoutMessages = messages.layout as { title: string; description: string };

  return {
    title: layoutMessages.title,
    description: layoutMessages.description,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);

  return (
    <html lang={locale}>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppProviders>
            <Navbar />
              <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
              </main>
            <Footer />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
