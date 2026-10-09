import type { Metadata } from 'next';

import { getUserLocale, loadMessages } from '@/i18n/server';
import { TARIFFS } from '@/core/config/tariff-data';
import type { QuoteMessages } from '@/features/quote/interfaces';
import { PlansCatalogPage } from '@/features/quote/PlansCatalogPage';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getUserLocale();
  const messages = await loadMessages(locale);
  const quote = messages.quote as QuoteMessages;

  return {
    title: quote.meta.planesTitle,
    description: quote.meta.planesDescription,
    alternates: { canonical: '/planes' },
    openGraph: {
      title: quote.meta.planesTitle,
      description: quote.meta.planesDescription,
      url: '/planes',
      type: 'website',
    },
  };
}

/**
 * Catálogo publicado como `Product`: es la página que lista todas las
 * coberturas con su precio. El precio mínimo se calcula desde la tarifa y no
 * se escribe a mano, así que si cambia `tariff-data.ts` el JSON-LD se ajusta.
 */
function buildProductSchema() {
  const publicEntries = TARIFFS.filter(
    (entry) => entry.plan !== '24/7' && typeof entry.zona_1.mensual === 'number'
  );
  const prices = publicEntries.map((entry) => entry.zona_1.mensual as number);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Planes de salud Previasis',
    brand: { '@type': 'Organization', name: 'Previasis' },
    category: 'Medicina prepagada',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: Math.min(...prices),
      offerCount: prices.length,
      availability: 'https://schema.org/InStock',
      url: '/planes',
    },
  };
}

export default function PlansPage() {
  const schema = buildProductSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PlansCatalogPage />
    </>
  );
}
