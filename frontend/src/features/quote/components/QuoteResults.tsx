'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

import { QUOTE_CURRENCIES } from '../config/currency.config';
import { TERM_KEY, TERM_DESC_KEY } from '../config/quote-terms.config';
import { formatQuoteAmount, formatQuoteRate } from '../utils/quote-format.utils';
import type { QuoteResultsProps } from './components.interfaces';

/**
 * Rejilla de las cinco modalidades de pago más la barra de total anual.
 * Recibe el resultado ya calculado: este componente no decide nada.
 */
export const QuoteResults: React.FC<QuoteResultsProps> = ({
  result,
  currency,
  onCurrencyChange,
  rate,
  rateStatus,
}) => {
  const t = useTranslations('quote');
  const locale = useLocale();

  const rateMissing = !rate || !Number.isFinite(rate.rate);
  const blockedForBs = currency === 'Bs' && rateMissing;

  const renderRate = () => {
    if (rateStatus === 'loading') return <span className="q-rate">{t('currency.loading')}</span>;
    if (rateMissing) {
      return (
        <span className="q-rate q-rate--warning">
          {t('currency.rateUnavailable')} {t('currency.rateUnavailableHint')}
        </span>
      );
    }
    return (
      <span className="q-rate">
        {t('currency.rateLabel')}: <strong>{formatQuoteRate(rate!.rate, locale)}</strong> Bs/USD
        {rate!.date ? ` · ${rate!.date}` : ''}
        {rate!.source === 'fallback' ? ` · ${t('currency.rateFallback')}` : ''}
      </span>
    );
  };

  return (
    <section className="previasis-card q-step" aria-live="polite">
      <div className="q-currency-bar">
        <div>
          <h2 className="q-results-title">{t('results.title')}</h2>
          <div style={{ marginTop: '0.35rem' }}>{renderRate()}</div>
        </div>

        <div className="pill-switch" role="group" aria-label={t('currency.label')}>
          {QUOTE_CURRENCIES.map((value) => (
            <button
              key={value}
              type="button"
              className={`pill-switch-btn${currency === value ? ' active' : ''}`}
              aria-pressed={currency === value}
              onClick={() => onCurrencyChange(value)}
            >
              {value === 'USD' ? t('currency.usd') : t('currency.bs')}
            </button>
          ))}
        </div>
      </div>

      {!result && (
        <p className="q-empty-note">
          <strong>{t('results.empty')}</strong>
          <br />
          {t('results.emptyHint')}
        </p>
      )}

      {result && !result.valid && (
        <p className="q-empty-note" style={{ borderColor: '#fcd34d', background: '#fef3c7' }}>
          <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
          {blockedForBs
            ? t('currency.rateUnavailableHint')
            : result.reason === 'age-out-of-range'
              ? t('form.ageError')
              : result.reason === 'invalid-rate'
                ? t('currency.rateUnavailable')
                : t('form.noPlansBody')}
        </p>
      )}

      {result?.valid && (
        <>
          <div className="q-results-grid">
            {result.installments.map((item) => (
              <article
                key={item.term}
                className={`q-result-card${item.term === 'Contado' ? ' q-result-card--contado' : ''}`}
              >
                <span className="q-result-term">{t(`results.${TERM_KEY[item.term]}`)}</span>
                <strong className="q-result-amount">
                  {formatQuoteAmount(item.amount, result.currency, locale)}
                </strong>
                <span className="q-result-meta">
                  {t(`results.${TERM_DESC_KEY[item.term]}`)}
                  {' · '}
                  {t('results.monthsCovered', { count: item.months })}
                </span>
                <span className="q-result-total">
                  {t('results.totalPerPayment', {
                    amount: formatQuoteAmount(item.total, result.currency, locale),
                  })}
                </span>
              </article>
            ))}
          </div>

          <div className="q-year-bar">
            <div>
              <span className="q-year-bar-label">{t('results.yearLabel')}</span>
              <strong className="q-year-bar-value">
                {t('results.yearValue', {
                  amount: formatQuoteAmount(result.annual, result.currency, locale),
                })}
              </strong>
            </div>
            <p className="q-year-bar-note">{t('results.yearNote')}</p>
          </div>

          <p className="q-disclaimer">{t('results.disclaimer')}</p>
        </>
      )}
    </section>
  );
};
