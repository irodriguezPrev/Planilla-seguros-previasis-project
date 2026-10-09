'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Calculator, Layers, ShieldCheck, User } from 'lucide-react';

import { VENEZUELA_STATES } from '@/core/config/venezuela-locations.config';
import type { AgeRange, PlanName } from '@/core/config/tariff-data';
import { getCoverageTier } from '../config/coverage-tier.config';
import type { CoverageTier } from '../interfaces';
import { formatQuoteCoverage } from '../utils/quote-format.utils';
import { ZoneReadonly } from './ZoneReadonly';
import type { QuoteFormProps } from './components.interfaces';

/**
 * Pasos 1 y 2 del cotizador: datos del titular y selección plan/cobertura.
 * El componente no calcula nada: solo emite cambios al contenedor.
 */
export const QuoteForm: React.FC<QuoteFormProps> = ({
  ageInput,
  onAgeChange,
  ageError,
  stateName,
  onStateChange,
  zone,
  zoneUnmapped,
  ageRange,
  plans,
  effectivePlan,
  onPlanChange,
  coverages,
  coverage,
  onCoverageChange,
  canCalculate,
  onCalculate,
  hasResult,
  stale,
}) => {
  const t = useTranslations('quote');
  const locale = useLocale();
  const availablePlans = plans.filter((plan) => plan.available);

  /**
   * Tramo completo que cubre un plan: `0-20,21-40,41-60` se muestra como
   * `0-60`. Los rangos vienen ordenados ascendentemente desde la tarifa.
   */
  const planAgeSpan = (ranges: string[]): string => {
    if (ranges.length === 0) return '';
    if (ranges.length === 1) return ranges[0];
    return `${ranges[0].split('-')[0]}-${ranges[ranges.length - 1].split('-')[1]}`;
  };

  /** "21 a 40" en español, "21-40" en inglés. */
  const ageRangeLabel = ageRange ? (locale === 'en' ? ageRange : ageRange.replace('-', ' a ')) : '';

  /**
   * Nivel de una cobertura: su clase de color y su nombre. `null` cuando el
   * plan no tiene nivel para ese importe, y entonces el chip se muestra sin
   * etiqueta en lugar de inventar una.
   */
  const tierOf = (value: number): { key: CoverageTier; label: string } | null => {
    if (!effectivePlan) return null;
    const tier = getCoverageTier(effectivePlan, value);
    return tier ? { key: tier, label: t(`form.tier${tier}`) } : null;
  };

  return (
    <>
      {/* Paso 1 ---------------------------------------------------------------- */}
      <section className="previasis-card q-step">
        <header className="q-step-head">
          <span className="q-step-index" aria-hidden="true">
            <User size={15} />
          </span>
          <div>
            <h2 className="q-step-title">{t('form.step1Title')}</h2>
            <p className="q-step-hint">{t('form.step1Hint')}</p>
          </div>
        </header>

        <div className="q-field-grid">
          <div>
            <label className="q-field-label" htmlFor="q-age">
              {t('form.ageLabel')}
            </label>
            <input
              id="q-age"
              className="q-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('form.agePlaceholder')}
              value={ageInput}
              onChange={(event) => onAgeChange(event.target.value)}
              aria-invalid={ageError}
              aria-describedby="q-age-note"
              style={{ marginTop: '0.375rem' }}
            />
            {ageError ? (
              <p className="q-field-error" style={{ marginTop: '0.375rem' }}>
                {t('form.ageError')}
              </p>
            ) : (
              <p className="q-field-note" id="q-age-note" style={{ marginTop: '0.375rem' }}>
                {t('form.ageNote')}
              </p>
            )}
          </div>

          <div>
            <label className="q-field-label" htmlFor="q-state">
              {t('form.stateLabel')}
            </label>
            <select
              id="q-state"
              className="q-select"
              value={stateName}
              onChange={(event) => onStateChange(event.target.value)}
              style={{ marginTop: '0.375rem' }}
            >
              <option value="">{t('form.statePlaceholder')}</option>
              {VENEZUELA_STATES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* La zona no se elige: sale de la tabla de zonas según el
              estado, así que aquí solo se informa. */}
          <ZoneReadonly zone={zone} zoneUnmapped={zoneUnmapped} />
        </div>
      </section>

      {/* Paso 2 ---------------------------------------------------------------- */}
      <section className="previasis-card q-step">
        <header className="q-step-head">
          <span className="q-step-index" aria-hidden="true">
            <ShieldCheck size={15} />
          </span>
          <div>
            <h2 className="q-step-title">{t('form.step2Title')}</h2>
            <p className="q-step-hint">{t('form.step2Hint')}</p>
          </div>
        </header>

        {availablePlans.length === 0 ? (
          <p className="q-empty-note">
            <strong>{t('form.noPlansTitle')}</strong>
            <br />
            {t('form.noPlansBody')}
          </p>
        ) : (
          <>
            <div className="q-plan-grid" role="radiogroup" aria-label={t('form.planLabel')}>
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={effectivePlan === plan.id}
                  className={`plan-gradient-card q-plan-card ${plan.gradientClass}${
                    effectivePlan === plan.id ? ' selected' : ''
                  }`}
                  disabled={!plan.available}
                  onClick={() => onPlanChange(plan.id)}
                >
                  <span className="q-plan-card-ages">
                    {t('catalog.ages', { range: planAgeSpan(plan.ageRanges) })}
                  </span>
                  <h3 className="q-plan-card-name">{plan.id}</h3>
                  {!plan.available && (
                    <span className="q-plan-card-ages">{t('form.planUnavailable')}</span>
                  )}
                </button>
              ))}
            </div>

            <Link className="q-see-plans" href="/planes">
              {t('form.seePlans')}
              <ArrowRight size={14} />
            </Link>

            <p className="q-field-label" style={{ marginTop: '1.35rem' }}>
              <Layers size={13} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
              {t('form.coverageLabel')}
            </p>
            <div className="q-coverage-row" role="radiogroup" aria-label={t('form.coverageLabel')}>
              {coverages.map((value) => {
                const tier = tierOf(value);
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={coverage === value}
                    aria-label={
                      tier ? `${tier.label} · ${formatQuoteCoverage(value, locale)}` : undefined
                    }
                    className={
                      `q-coverage-chip${tier ? ` q-tier--${tier.key.toLowerCase()}` : ''}` +
                      `${coverage === value ? ' selected' : ''}`
                    }
                    onClick={() => onCoverageChange(value)}
                  >
                    {tier && <span className="q-coverage-tier">{tier.label}</span>}
                    <span className="q-coverage-amount">
                      {formatQuoteCoverage(value, locale)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="q-field-note" style={{ marginTop: '0.65rem' }}>
              {t('form.coverageNote')}
              {ageRange ? ` · ${t('catalog.ages', { range: ageRangeLabel })}` : ''}
            </p>
          </>
        )}
      </section>

      {/* Acción ---------------------------------------------------------------- */}
      <div className="q-actions">
        <button
          type="button"
          className="btn-pill btn-pill-primary"
          disabled={!canCalculate}
          onClick={onCalculate}
        >
          <Calculator size={16} />
          {hasResult ? t('form.recalculate') : t('form.calculate')}
        </button>
        {!hasResult && <span className="q-calc-hint">{t('form.calculateHint')}</span>}
        {stale && (
          <span className="q-stale" role="status">
            {t('results.stale')} —{' '}
            <button type="button" onClick={onCalculate}>
              {t('results.staleAction')}
            </button>
          </span>
        )}
      </div>
    </>
  );
};
