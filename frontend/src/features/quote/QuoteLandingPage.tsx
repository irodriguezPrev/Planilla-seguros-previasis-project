'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Activity, ArrowRight, BadgeCheck, CalendarRange, Layers, ShieldCheck } from 'lucide-react';

import { getAgeRange, type PlanName } from '@/core/config/tariff-data';
import { ZONE_MAPPING, getZoneFromState, type Zone } from '@/core/config/zone-config';
import './quote.css';

import { QuoteForm } from './components/QuoteForm';
import { QuoteResults } from './components/QuoteResults';
import { QuoteRail } from './components/QuoteRail';
import { DEFAULT_QUOTE_CURRENCY } from './config/currency.config';
import { getPublicCoverages, getPublicPlansForAgeRange } from './config/quote-plans.config';
import { toAffiliationPrefill } from './config/plan-affiliation.config';
import { calculateQuote, isValidRate } from './utils/quote.utils';
import { formatQuoteRate } from './utils/quote-format.utils';
import { fetchQuoteRate } from './services/quote-rate.service';
import { sendQuoteLead } from './services/quote-lead.service';
import type { QuoteCurrency, QuoteRateInfo } from './interfaces';

/** Selección congelada al pulsar "Calcular": los precios salen de aquí. */
interface CalcInputs {
  age: number;
  state: string;
  zone: Zone;
  plan: PlanName;
  coverage: number;
}

/** Huella estable de la selección (array → orden fijo de campos). */
const signatureOf = (value: {
  age: number | null;
  state: string;
  zone: Zone | null;
  plan: PlanName | null;
  coverage: number | null;
}): string =>
  JSON.stringify([value.age, value.state, value.zone, value.plan, value.coverage]);

/**
 * Landing pública con el cotizador individual.
 *
 * Toda la lógica de precios vive en `../utils`, `../config` y `../services`;
 * este componente solo orquesta estado de interfaz. El catálogo completo y el
 * FAQ están en `./PlansCatalogPage` (`/planes`). Se despega del proyecto
 * eliminando la carpeta `src/features/quote/` y las rutas `app/landing` y
 * `app/planes`.
 */
export const QuoteLandingPage: React.FC = () => {
  const t = useTranslations('quote');
  const locale = useLocale();

  const [ageInput, setAgeInput] = useState('');
  const [stateName, setStateName] = useState('');
  const [plan, setPlan] = useState<PlanName | null>(null);
  const [coverage, setCoverage] = useState<number | null>(null);
  const [currency, setCurrency] = useState<QuoteCurrency>(DEFAULT_QUOTE_CURRENCY);
  const [rate, setRate] = useState<QuoteRateInfo | null>(null);
  const [rateStatus, setRateStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [calcInputs, setCalcInputs] = useState<CalcInputs | null>(null);

  /* Tasa de cambio: pedida una sola vez al montar. ------------------------ */
  useEffect(() => {
    let alive = true;
    void fetchQuoteRate().then((info) => {
      if (!alive) return;
      setRate(info);
      setRateStatus(info ? 'ready' : 'error');
    });
    return () => {
      alive = false;
    };
  }, []);

  /* Derivados ------------------------------------------------------------- */
  const age = useMemo(() => {
    const trimmed = ageInput.trim();
    if (!/^\d{1,3}$/.test(trimmed)) return null;
    const value = Number(trimmed);
    return Number.isInteger(value) && value >= 0 && value <= 80 ? value : null;
  }, [ageInput]);

  // La zona tarifaria no es una decisión del usuario: se deriva del estado
  // mediante `ZONE_MAPPING` y solo cambia si cambia el estado.
  const zone = useMemo(() => (stateName ? getZoneFromState(stateName) : null), [stateName]);

  const ageRange = age !== null ? getAgeRange(age) : null;
  const ageError = ageInput.trim() !== '' && age === null;

  const plans = useMemo(() => getPublicPlansForAgeRange(ageRange), [ageRange]);
  const availablePlans = plans.filter((item) => item.available);

  // Si la edad invalida el plan elegido, se vuelve al primero disponible.
  const effectivePlan =
    plan && availablePlans.some((item) => item.id === plan)
      ? plan
      : (availablePlans[0]?.id ?? null);

  const coverages = useMemo(
    () => (effectivePlan ? getPublicCoverages(effectivePlan, ageRange) : []),
    [effectivePlan, ageRange]
  );
  const effectiveCoverage =
    coverage !== null && coverages.includes(coverage) ? coverage : (coverages[0] ?? null);

  const currentSignature = signatureOf({
    age,
    state: stateName,
    zone,
    plan: effectivePlan,
    coverage: effectiveCoverage,
  });
  const calcSignature = calcInputs ? signatureOf(calcInputs) : null;
  const hasResult = calcInputs !== null;
  const stale = hasResult && calcSignature !== currentSignature;

  const rateUsd = rate?.rate ?? null;
  const rateReady = isValidRate(rateUsd);

  // Sin tasa válida no se puede cotizar en Bolívares: preferimos bloquear el
  // cálculo a publicar un precio derivado de una taus inventada.
  const canCalculate =
    age !== null &&
    ageRange !== null &&
    stateName !== '' &&
    zone !== null &&
    effectivePlan !== null &&
    effectiveCoverage !== null &&
    (currency !== 'Bs' || rateReady);

  /* Resultado: se recalcula solo si cambia moneda o tasa, nunca por teclear. */
  const result = useMemo(() => {
    if (!calcInputs) return null;
    return calculateQuote({
      age: calcInputs.age,
      state: calcInputs.state,
      zone: calcInputs.zone,
      plan: calcInputs.plan,
      coverage: calcInputs.coverage,
      currency,
      rate: rateUsd,
    });
  }, [calcInputs, currency, rateUsd]);

  /* Acciones -------------------------------------------------------------- */
  const handleStateChange = (value: string) => {
    // Con cambiar el estado basta: la zona se deriva sola.
    setStateName(value);
  };

  const handleCalculate = () => {
    if (age === null || zone === null || effectivePlan === null || effectiveCoverage === null) {
      return;
    }
    setCalcInputs({
      age,
      state: stateName,
      zone,
      plan: effectivePlan,
      coverage: effectiveCoverage,
    });
  };

  const ctaHref = useMemo(() => {
    if (!result?.valid) return null;
    const prefill = toAffiliationPrefill(result.plan, result.coverage, result.age);
    if (!prefill) return null;
    const params = new URLSearchParams({
      requestedPlan: prefill.requestedPlan,
      coverageLimit: String(prefill.coverageLimit),
      birthDate: prefill.birthDate,
    });
    return `/afiliacion?${params.toString()}`;
  }, [result]);

  const handleCtaClick = () => {
    if (!result?.valid || !ctaHref) return;
    const prefill = toAffiliationPrefill(result.plan, result.coverage, result.age);
    if (!prefill) return;
    void sendQuoteLead({
      requestedPlan: prefill.requestedPlan,
      coverageLimit: prefill.coverageLimit,
      birthDate: prefill.birthDate,
      age: result.age,
      state: result.state,
      zone: result.zone,
      currency: result.currency,
      term: 'Contado',
      amount: result.annual,
    });
  };

  const zoneUnmapped = stateName !== '' && !(stateName in ZONE_MAPPING);

  /* Render ---------------------------------------------------------------- */
  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <section className="q-hero">
        <div className="container">
          <span className="q-hero-eyebrow">
            <BadgeCheck size={14} />
            {t('hero.eyebrow')}
          </span>
          <h1 className="q-hero-title">
            {t('hero.title')} <em>{t('hero.titleHighlight')}</em>
          </h1>
          <p className="q-hero-sub">{t('hero.subtitle')}</p>
          <div className="q-hero-badges">
            <span className="q-hero-badge">
              <Activity size={14} />
              {t('hero.badges.rate')}
              {rate ? `: ${formatQuoteRate(rate.rate, locale)} Bs/USD` : ''}
            </span>
            <span className="q-hero-badge">
              <Layers size={14} />
              {t('hero.badges.plans')}
            </span>
            <span className="q-hero-badge">
              <CalendarRange size={14} />
              {t('hero.badges.age')}
            </span>
            <span className="q-hero-badge">
              <ShieldCheck size={14} />
              {t('hero.badges.free')}
            </span>
          </div>
        </div>
      </section>

      {/* Calculadora ------------------------------------------------------- */}
      <div className="container" id="cotizar" style={{ position: 'relative' }}>
        <div className="q-layout">
          <div className="q-main">
            <QuoteForm
              ageInput={ageInput}
              onAgeChange={setAgeInput}
              ageError={ageError}
              stateName={stateName}
              onStateChange={handleStateChange}
              zone={zone}
              zoneUnmapped={zoneUnmapped}
              ageRange={ageRange}
              plans={plans}
              effectivePlan={effectivePlan}
              onPlanChange={setPlan}
              coverages={coverages}
              coverage={effectiveCoverage}
              onCoverageChange={setCoverage}
              canCalculate={canCalculate}
              onCalculate={handleCalculate}
              hasResult={hasResult}
              stale={stale}
            />

            <QuoteResults
              result={result}
              currency={currency}
              onCurrencyChange={setCurrency}
              rate={rate}
              rateStatus={rateStatus}
            />
          </div>

          <QuoteRail
            result={result}
            age={calcInputs?.age ?? age}
            stateName={calcInputs?.state ?? stateName}
            zone={calcInputs?.zone ?? zone}
            ctaHref={ctaHref}
            onCtaClick={handleCtaClick}
          />
        </div>
      </div>

      {/* CTA final --------------------------------------------------------- */}
      <section className="q-section q-section--last" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="q-cta">
            <h2 className="q-cta-title">{t('cta.title')}</h2>
            <p className="q-cta-sub">{t('cta.subtitle')}</p>
            <Link
              className="btn-pill btn-pill-primary"
              href={ctaHref ?? '/afiliacion'}
              onClick={handleCtaClick}
            >
              {t('cta.button')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

QuoteLandingPage.displayName = 'QuoteLandingPage';

export default QuoteLandingPage;
