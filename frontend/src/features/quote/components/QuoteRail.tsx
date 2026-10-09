'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

import { formatQuoteAmount, formatQuoteCoverage } from '../utils/quote-format.utils';
import type { QuoteRailProps } from './components.interfaces';

/**
 * Columna derecha pegajosa: resumen de la selección + precio + CTA.
 * En pantallas ≤900px el CSS la convierte en barra inferior fija.
 */
export const QuoteRail: React.FC<QuoteRailProps> = ({
  result,
  age,
  stateName,
  zone,
  ctaHref,
  onCtaClick,
}) => {
  const t = useTranslations('quote');
  const locale = useLocale();
  const ready = ctaHref !== null && Boolean(result?.valid);

  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: 'plan', label: t('summary.plan'), value: result?.plan ?? '—' },
    {
      key: 'coverage',
      label: t('summary.coverage'),
      value: result ? formatQuoteCoverage(result.coverage, locale) : '—',
    },
    { key: 'age', label: t('summary.age'), value: age !== null ? String(age) : '—' },
    { key: 'state', label: t('summary.state'), value: stateName || '—' },
    { key: 'zone', label: t('summary.zone'), value: zone ?? '—' },
  ];

  return (
    <aside className="q-rail" aria-label={t('summary.title')}>
      <div className="previasis-card q-rail-card">
        <h2 className="q-rail-title">{t('summary.title')}</h2>

        {!result && <p className="q-rail-empty">{t('summary.empty')}</p>}

        {result && (
          <>
            {rows.map((row) => (
              <div className="q-rail-row" key={row.key}>
                <span className="q-rail-key">{row.label}</span>
                <span className="q-rail-val">{row.value}</span>
              </div>
            ))}

            <div className="q-rail-total">
              <span className="q-rail-total-label">{t('summary.total')}</span>
              <strong className="q-rail-total-value">
                {ready
                  ? formatQuoteAmount(result.annual, result.currency, locale)
                  : '—'}
              </strong>
            </div>
          </>
        )}

        {ctaHref ? (
          <Link
            className="btn-pill btn-pill-primary q-rail-cta"
            href={ctaHref}
            onClick={onCtaClick}
          >
            {t('summary.cta')}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button type="button" className="btn-pill btn-pill-primary q-rail-cta" disabled>
            {t('summary.cta')}
            <ArrowRight size={16} />
          </button>
        )}

        <p className="q-rail-note">{t('summary.note')}</p>
      </div>
    </aside>
  );
};
