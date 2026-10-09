'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, BadgeCheck, CalendarRange, Layers } from 'lucide-react';

import { ZONE_MAPPING, getZoneFromState, type Zone } from '@/core/config/zone-config';
import './quote.css';

import { QuoteCatalog } from './components/QuoteCatalog';
import { StateZoneFilter } from './components/StateZoneFilter';
import { getPublicPlanCatalog } from './config/quote-plans.config';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

/**
 * Página de planes (`/planes`): catálogo completo, FAQ y acceso al cotizador.
 *
 * El cotizador vive en `/landing`; aquí no se calcula ningún precio concreto,
 * solo se publica el mínimo por cobertura según la zona elegida. Igual que allí,
 * la zona no se selecciona: se deriva del estado.
 */
export const PlansCatalogPage: React.FC = () => {
  const t = useTranslations('quote');

  const [stateName, setStateName] = useState('');
  const zone = useMemo<Zone | null>(
    () => (stateName ? getZoneFromState(stateName) : null),
    [stateName]
  );
  const zoneUnmapped = stateName !== '' && !(stateName in ZONE_MAPPING);

  const catalogPlans = useMemo(() => getPublicPlanCatalog(), []);

  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <section className="q-hero">
        <div className="container">
          <span className="q-hero-eyebrow">
            <BadgeCheck size={14} />
            {t('catalog.heroEyebrow')}
          </span>
          <h1 className="q-hero-title">{t('catalog.heroTitle')}</h1>
          <p className="q-hero-sub">{t('catalog.heroSub')}</p>
          <div className="q-hero-badges">
            <span className="q-hero-badge">
              <Layers size={14} />
              {t('hero.badges.plans')}
            </span>
            <span className="q-hero-badge">
              <CalendarRange size={14} />
              {t('hero.badges.age')}
            </span>
          </div>
        </div>
      </section>

      {/* Filtro + catálogo -------------------------------------------------- */}
      <div className="q-page-body">
        <div className="container">
          <StateZoneFilter
            stateName={stateName}
            onStateChange={setStateName}
            zone={zone}
            zoneUnmapped={zoneUnmapped}
          />

          <div className="q-plans-body">
            <QuoteCatalog plans={catalogPlans} zone={zone} />
          </div>
        </div>
      </div>

      {/* FAQ --------------------------------------------------------------- */}
      <section className="q-section">
        <div className="container">
          <div className="q-section-head">
            <span className="q-section-kicker">{t('faq.kicker')}</span>
            <h2 className="q-section-title">{t('faq.title')}</h2>
          </div>
          <div className="q-faq">
            {FAQ_KEYS.map((key) => (
              <article className="previasis-card q-faq-item" key={key}>
                <h3 className="q-faq-q">{t(`faq.${key}`)}</h3>
                <p className="q-faq-a">{t(`faq.a${key.slice(1)}`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA al cotizador --------------------------------------------------- */}
      <section className="q-section q-section--last" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="q-cta">
            <h2 className="q-cta-title">{t('cta.quoteTitle')}</h2>
            <p className="q-cta-sub">{t('cta.quoteSubtitle')}</p>
            <Link className="btn-pill btn-pill-primary" href="/landing">
              {t('cta.quoteButton')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

PlansCatalogPage.displayName = 'PlansCatalogPage';

export default PlansCatalogPage;
