'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PaymentSection,
  PaymentFrequency,
  PaymentCurrency,
  PaymentMethod,
} from '@/core/interfaces/affiliation.interfaces';
import { Calendar, Layers, Repeat, Gift, CreditCard } from 'lucide-react';
import {
  PAYMENT_CURRENCY_TRANSLATION_KEYS,
  PAYMENT_FREQUENCY_TRANSLATION_KEYS,
  PAYMENT_FREQUENCIES_BY_CURRENCY,
  PAYMENT_METHOD_TRANSLATION_KEYS,
  PAYMENT_METHODS_BY_CURRENCY,
} from '@/core/config/payment-options.config';

interface Step5Props {
  payment: PaymentSection;
  onPaymentChange: (payment: PaymentSection) => void;
}

export const Step5PaymentAndOthers: React.FC<Step5Props> = ({ payment, onPaymentChange }) => {
  const t = useTranslations('step5');
  const tPayment = useTranslations('paymentOptions');
  const frequencyIconMap: Record<PaymentFrequency, React.ElementType> = {
    Mensual: Calendar,
    Trimestral: Layers,
    Semestral: Repeat,
    Anual: Gift,
  };

  const availableFrequencies = PAYMENT_FREQUENCIES_BY_CURRENCY[payment.currency];

  useEffect(() => {
    const validFrequencies = PAYMENT_FREQUENCIES_BY_CURRENCY[payment.currency];
    if (!validFrequencies.includes(payment.paymentFrequency)) {
      onPaymentChange({ ...payment, paymentFrequency: validFrequencies[0] });
    }
    const validMethods = PAYMENT_METHODS_BY_CURRENCY[payment.currency];
    if (!validMethods.includes(payment.method)) {
      onPaymentChange({ ...payment, method: validMethods[0], otherPaymentDetails: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment.currency]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div className="previasis-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--previasis-green-light)',
              color: 'var(--previasis-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              {t('frequencyHeading')}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {t('frequencySubtitle')}
            </p>
          </div>
        </div>
            <div className="grid grid-cols-12 gap-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('currencyLabel')} <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Bolívares', 'Dólares'] as PaymentCurrency[]).map((mon) => (
                <button
                  key={mon}
                  type="button"
                  onClick={() => onPaymentChange({ ...payment, currency: mon })}
                  className={`pill-switch-btn ${payment.currency === mon ? 'active' : ''}`}
                >
                  {tPayment(PAYMENT_CURRENCY_TRANSLATION_KEYS[mon])}
                </button>
              ))}
            </div>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('methodLabel')} <span className="previasis-label-required">*</span>
            </label>
             <select
               className="previasis-input"
               value={payment.method}
               onChange={(e) => onPaymentChange({ ...payment, method: e.target.value as PaymentMethod })}
             >
                {PAYMENT_METHODS_BY_CURRENCY[payment.currency].map((method) => (
                 <option key={method} value={method}>
                   {tPayment(PAYMENT_METHOD_TRANSLATION_KEYS[method])}
                 </option>
               ))}
             </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
          {availableFrequencies.map((frequency) => {
            const Icon = frequencyIconMap[frequency];
            const isSelected = payment.paymentFrequency === frequency;

            return (
              <button
                key={frequency}
                type="button"
                onClick={() => onPaymentChange({ ...payment, paymentFrequency: frequency })}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid',
                  borderColor: isSelected ? 'var(--previasis-green)' : 'var(--border-card)',
                  backgroundColor: isSelected ? 'var(--previasis-green-light)' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: isSelected ? '0 4px 14px var(--previasis-green-glow)' : 'var(--shadow-subtle)',
                }}
              >
                <Icon size={22} color={isSelected ? 'var(--previasis-green)' : 'var(--text-muted)'} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: isSelected ? 'var(--previasis-dark-green)' : 'var(--text-body)',
                  }}
                 >
                  {tPayment(PAYMENT_FREQUENCY_TRANSLATION_KEYS[frequency])}
                </span>
              </button>
            );
          })}
        </div>
        

        {payment.method === 'Otro' && (
          <div className="previasis-input-group" style={{ marginTop: '1rem' }}>
            <label className="previasis-label">
              {t('otherLabel')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('otherPlaceholder')}
              value={payment.otherPaymentDetails || ''}
              onChange={(e) => onPaymentChange({ ...payment, otherPaymentDetails: e.target.value })}
              required
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5PaymentAndOthers;
