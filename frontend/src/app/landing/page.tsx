import type { Metadata } from 'next';

import { getUserLocale, loadMessages } from '@/i18n/server';
import type { QuoteMessages } from '@/features/quote/interfaces';
import { QuoteLandingPage } from '@/features/quote/QuoteLandingPage';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);
  const quote = messages.quote as QuoteMessages;

  return {
    title: quote.meta.title,
    description: quote.meta.description,
    alternates: { canonical: '/landing' },
    openGraph: {
      title: quote.meta.title,
      description: quote.meta.description,
      url: '/landing',
      type: 'website',
    },
  };
}

/**
 * El cotizador se publica como `WebApplication`, no como `Product`: aquí no
 * se lista el catálogo, se calcula un precio. El `Product` con su
 * `AggregateOffer` vive en `/planes`, que es donde se muestran las coberturas.
 */
async function buildApplicationSchema() {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);
  const quote = messages.quote as QuoteMessages;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: quote.meta.title,
    description: quote.meta.description,
    url: '/landing',
    inLanguage: ['es', 'en'],
    provider: { '@type': 'Organization', name: 'Previasis' },
  };
}

export default async function LandingPage() {
  const schema = await buildApplicationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <QuoteLandingPage />
    </>
  );
}
