'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { TARIFFS, type AgeRange, type PlanName } from '@/core/config/tariff-data';
import { getCoverageTier } from '../config/coverage-tier.config';
import { formatQuoteAmount, formatQuoteCoverage } from '../utils/quote-format.utils';
import type { QuoteCatalogProps } from './components.interfaces';

/**
 * Sección informativa con todos los planes y sus coberturas.
 *
 * El precio mostrado es el mínimo del plan en todas las edades para la zona
 * seleccionada, por eso se etiqueta como "desde": nunca se presenta una cifra
 * que no se pueda justificar con la tarifa.
 */
export const QuoteCatalog: React.FC<QuoteCatalogProps> = ({ plans, zone }) => {
  const t = useTranslations('quote');
  const locale = useLocale();
  const zoneLabel = zone ?? 'Zona 1';

  /** Precio mensual mínimo de una cobertura en todas las edades de un plan. */
  const minimumMonthly = (plan: PlanName, coverage: number): number | null => {
    const prices = TARIFFS.filter(
      (entry) => entry.plan === plan && entry.cobertura === coverage
    ).map((entry) => (zoneLabel === 'Zona 2' ? entry.zona_2.mensual : entry.zona_1.mensual));

    const values = prices.filter((value): value is number => typeof value === 'number');
    return values.length > 0 ? Math.min(...values) : null;
  };

  const ageSpan = (ranges: AgeRange[]): string => {
    if (ranges.length === 0) return '';
    if (ranges.length === 1) return ranges[0];
    return `${ranges[0].split('-')[0]}-${ranges[ranges.length - 1].split('-')[1]}`;
  };

  /** Nivel de la cobertura con su clase de color, o `null` si no tiene. */
  const tierOf = (plan: PlanName, coverage: number) => {
    const tier = getCoverageTier(plan, coverage);
    return tier ? { key: tier.toLowerCase(), label: t(`form.tier${tier}`) } : null;
  };

  return (
    <>
      <div className="q-section-head">
        <span className="q-section-kicker">{t('form.planLabel')}</span>
        <h2 className="q-section-title">{t('catalog.title')}</h2>
        <p className="q-section-sub">
          {t('catalog.subtitle')} · {t('summary.zone')}: {zoneLabel}
        </p>
      </div>

      <div className="q-catalog">
        {plans.map((plan) => (
          <article className="previasis-card q-catalog-card" key={plan.id}>
            <header className={`plan-gradient-card q-catalog-band ${plan.gradientClass}`}>
              <h3 className="q-catalog-name">{plan.id}</h3>
              <p className="q-catalog-ages">
                {t('catalog.ages', { range: ageSpan(plan.ageRanges) })}
              </p>
            </header>

            {plan.coverages.length === 0 ? (
              <p className="q-catalog-empty">{t('catalog.unavailable')}</p>
            ) : (
              <ul className="q-catalog-list">
                {plan.coverages.map((coverage) => {
                  const monthly = minimumMonthly(plan.id, coverage);
                  const tier = tierOf(plan.id, coverage);
                  return (
                    <li className="q-catalog-item" key={coverage}>
                      <span className="q-catalog-coverage">
                        {tier && (
                          <span className={`q-catalog-tier q-tier--${tier.key}`}>
                            {tier.label}
                          </span>
                        )}
                        {formatQuoteCoverage(coverage, locale)}
                      </span>
                      {monthly === null ? (
                        <span className="q-catalog-from">{t('catalog.empty')}</span>
                      ) : (
                        <span className="q-catalog-from">
                          {t('catalog.from')}{' '}
                          <strong>
                            {formatQuoteAmount(monthly, 'USD', locale)}
                            {t('catalog.perMonth')}
                          </strong>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        ))}
      </div>
    </>
  );
};
