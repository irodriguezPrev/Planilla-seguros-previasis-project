'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AffiliateRow,
  PaymentFrequency,
  RequestedPlan,
  Relationship,
} from '@/core/interfaces/affiliation.interfaces';
import { calculateActuarialAge as calculateAge } from '@/core/utils/age.utils';
import { applyMinorDocument } from '@/core/utils/minor-document.utils';
import { PAYMENT_FREQUENCY_TRANSLATION_KEYS } from '@/core/config/payment-options.config';
import { ContextualTooltip } from '@/components/common/ContextualTooltip';
import { UserPlus, Trash2, Users, Award, Check, Flame, Pencil } from 'lucide-react';

const billingPeriods: Array<{
  id: PaymentFrequency;
  months: number;
}> = [
  { id: 'Mensual', months: 1 },
  { id: 'Trimestral', months: 3 },
  { id: 'Semestral', months: 6 },
  { id: 'Anual', months: 12 },
];

type PlanOption = {
  id: RequestedPlan;
  name: string;
  classStyle: string;
  features: string[];
  defaultCoverage: string;
  monthlyPrices: Partial<Record<'0-20' | '21-40' | '41-60' | '61-80', number>>;
};

const planOptions: PlanOption[] = [
  {
    id: 'Plan Bronce',
    name: 'Plan Bronce',
    classStyle: 'plan-bronce',
    features: ['Consulta general', 'Farmacia básica', 'Emergencias 24/7'],
    defaultCoverage: '$10.000',
    monthlyPrices: { '0-20': 15, '21-40': 18, '41-60': 21 },
  },
  {
    id: 'Plan Plata',
    name: 'Plan Plata',
    classStyle: 'plan-plata',
    features: ['Especialistas', 'Hospitalización', 'Cirugías electivas'],
    defaultCoverage: '$15.000',
    monthlyPrices: { '0-20': 18, '21-40': 21, '41-60': 25 },
  },
  {
    id: 'Plan Oro',
    name: 'Plan Oro',
    classStyle: 'plan-oro',
    features: ['Cobertura total', 'Atención VIP', 'Red de clínicas premium'],
    defaultCoverage: '$25.000',
    monthlyPrices: { '0-20': 27, '21-40': 32, '41-60': 37 },
  },
  {
    id: 'Plan Diamante',
    name: 'Plan Diamante',
    classStyle: 'plan-diamante',
    features: ['Cobertura superior', 'Atención preferencial', 'Red de clínicas premium'],
    defaultCoverage: '$40.000',
    monthlyPrices: { '0-20': 36, '21-40': 42, '41-60': 50 },
  },
  {
    id: 'Abuelos',
    name: 'Plan Abuelos - Bronce',
    classStyle: 'plan-bronce',
    features: ['Personas de 61 a 80 años', 'Telemedicina 24 horas', 'Atención domiciliaria'],
    defaultCoverage: '$3.000',
    monthlyPrices: { '61-80': 35 },
  },
  {
    id: 'Abuelos',
    name: 'Plan Abuelos - Plata',
    classStyle: 'plan-plata',
    features: ['Personas de 61 a 80 años', 'Cobertura ampliada', 'Atención domiciliaria'],
    defaultCoverage: '$5.000',
    monthlyPrices: { '61-80': 50 },
  },
  {
    id: 'Abuelos',
    name: 'Plan Abuelos - Oro',
    classStyle: 'plan-oro',
    features: ['Personas de 61 a 80 años', 'Cobertura máxima', 'Atención domiciliaria'],
    defaultCoverage: '$10.000',
    monthlyPrices: { '61-80': 70 },
  },
];

function getMinimumBirthDate(): string {
  const maximumDate = new Date();
  maximumDate.setFullYear(maximumDate.getFullYear() - 80);
  const month = String(maximumDate.getMonth() + 1).padStart(2, '0');
  const day = String(maximumDate.getDate()).padStart(2, '0');
  return `${maximumDate.getFullYear()}-${month}-${day}`;
}

function getAgeRange(age: number | null): '0-20' | '21-40' | '41-60' | '61-80' | null {
  if (age === null || age < 0) return null;
  if (age <= 20) return '0-20';
  if (age <= 40) return '21-40';
  if (age <= 60) return '41-60';
  if (age <= 80) return '61-80';
  return null;
}

function getMonthlyPrice(plan: PlanOption | undefined, age: number | null): number | null {
  const range = getAgeRange(age);
  return range && plan?.monthlyPrices[range] !== undefined
    ? plan.monthlyPrices[range] ?? null
    : null;
}

function getAffiliateFee(affiliate: AffiliateRow): number {
  const age = calculateAge(affiliate.birthDate);
  const plan = planOptions.find(
    (p) => p.id === affiliate.requestedPlan && p.defaultCoverage === affiliate.coverageLimit
  );
  return getMonthlyPrice(plan, age) || 0;
}

interface Step3Props {
  affiliates: AffiliateRow[];
  onAffiliatesChange: (affiliates: AffiliateRow[]) => void;
  paymentFrequency: PaymentFrequency;
  onPaymentFrequencyChange: (frequency: PaymentFrequency) => void;
  policyholderFullName?: string;
  policyholderDocument?: string;
}

export const Step3AffiliatesPlan: React.FC<Step3Props> = ({
  affiliates,
  onAffiliatesChange,
  paymentFrequency,
  onPaymentFrequencyChange,
  policyholderDocument = '',
}) => {
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0);
  const memberNameInputRef = useRef<HTMLInputElement | null>(null);
  const tValidation = useTranslations('validation');
  const t = useTranslations('step3');
  const tPayment = useTranslations('paymentOptions');
  const getRelationshipLabel = (relationship: Relationship) => t(
    relationship === 'Titular'
      ? 'holder'
      : relationship === 'Cónyuge'
        ? 'spouse'
        : relationship === 'Hijo/a'
          ? 'child'
          : relationship === 'Padre/Madre'
            ? 'parent'
            : relationship === 'Hermano/a'
              ? 'sibling'
              : 'other',
  );

  const selectMember = (index: number) => {
    setSelectedMemberIndex(index);
  };

  const editMember = (index: number) => {
    setSelectedMemberIndex(index);

    window.requestAnimationFrame(() => {
      memberNameInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      window.setTimeout(() => {
        memberNameInputRef.current?.focus({ preventScroll: true });
      }, 500);
    });
  };

  const normalizeAffiliates = (items: AffiliateRow[]) =>
    items.map((item, index) => {
      const calculatedFee = getAffiliateFee(item);
      return {
        ...item,
        affiliateCode: index + 1,
        fee: calculatedFee,
      };
    });

  useEffect(() => {
    const updated = affiliates.map((affiliate) => applyMinorDocument(affiliate, policyholderDocument));
    const documentsChanged = updated.some((affiliate, index) => (
      affiliate.documentType !== affiliates[index].documentType ||
      affiliate.documentNumber !== affiliates[index].documentNumber
    ));

    if (documentsChanged) {
      onAffiliatesChange(normalizeAffiliates(updated));
    }
  // The remaining affiliate changes are normalized by updateAffiliate.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyholderDocument]);

  const addAffiliate = () => {
    const newAffiliate: AffiliateRow = {
      id: Math.random().toString(36).substring(2, 9),
      affiliateCode: 0,
      fullName: '',
      documentType: 'V',
      documentNumber: '',
      birthDate: '',
      relationship: 'Hijo/a',
      sex: 'M',
      weightKg: '',
      heightCm: '',
      requestedPlan: 'Plan Oro',
      coverageLimit: '$25.000',
      fee: 0,
    };
    const updated = normalizeAffiliates([...affiliates, newAffiliate]);
    onAffiliatesChange(updated);
    editMember(updated.length - 1);
  };

  const updateAffiliate = (index: number, fields: Partial<AffiliateRow>) => {
    const updated = [...affiliates];
    const currentAffiliate = updated[index];
    let nextAffiliate = { ...currentAffiliate, ...fields };

    if (fields.documentType !== undefined) {
      const selectsAutomaticDocument = fields.documentType === 'M';
      nextAffiliate = {
        ...nextAffiliate,
        documentNumber: currentAffiliate.documentType === 'M' && !selectsAutomaticDocument
          ? ''
          : nextAffiliate.documentNumber,
        usesOwnDocument: !selectsAutomaticDocument,
      };
    } else if (fields.documentNumber !== undefined && currentAffiliate.documentType === 'M') {
      nextAffiliate = {
        ...nextAffiliate,
        documentType: 'V',
        usesOwnDocument: true,
      };
    }

    updated[index] = applyMinorDocument(
      nextAffiliate,
      policyholderDocument,
    );
    onAffiliatesChange(normalizeAffiliates(updated));
  };

  const currentMember = affiliates[selectedMemberIndex] || affiliates[0];
  const currentAge = calculateAge(currentMember?.birthDate || '');
  const currentRange = getAgeRange(currentAge);
  const availablePlans = currentRange === '61-80'
    ? planOptions.filter((plan) => plan.id === 'Abuelos')
    : planOptions.filter((plan) => plan.id !== 'Abuelos');

  const selectPlan = (plan: PlanOption) => {
    const monthlyPrice = getMonthlyPrice(plan, currentAge) || 0;
    updateAffiliate(selectedMemberIndex, {
      requestedPlan: plan.id,
      coverageLimit: plan.defaultCoverage,
      fee: monthlyPrice,
    });
  };

  const validateBirthDate = (birthDate: string) => {
    const age = calculateAge(birthDate);

    if (age === null || age > 80) {
      alert(tValidation('ageLimit80Beneficiary'));
      return;
    }

    const range = getAgeRange(age);
    const currentPlan = planOptions.find(
      (plan) => plan.id === currentMember?.requestedPlan && plan.defaultCoverage === currentMember?.coverageLimit,
    );

    if (range === '61-80') {
      updateAffiliate(selectedMemberIndex, {
        requestedPlan: 'Abuelos',
        coverageLimit: '$3.000',
      });
      return;
    }

    if (currentPlan?.id === 'Abuelos') {
      updateAffiliate(selectedMemberIndex, {
        requestedPlan: 'Plan Bronce',
        coverageLimit: '$10.000',
      });
    } else {
      updateAffiliate(selectedMemberIndex, { birthDate });
    }
  };

  const removeAffiliate = (index: number) => {
    if (affiliates.length <= 1) {
      alert(tValidation('atLeastOnePerson'));
      return;
    }
    const filtered = normalizeAffiliates(affiliates.filter((_, i) => i !== index));
    onAffiliatesChange(filtered);
    if (selectedMemberIndex >= filtered.length) {
      setSelectedMemberIndex(filtered.length - 1);
    }
  };

  const groupSubtotal = affiliates.reduce((sum, item) => sum + getAffiliateFee(item), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div className="grid grid-cols-2 gap-6">

        <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="family-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                {t('familyGroup')}
              </h3>
            </div>

            <button
              type="button"
              onClick={addAffiliate}
              className="btn-pill btn-pill-outline"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
            >
              <UserPlus size={14} /> + {t('addAffiliate')}
            </button>
          </div>


          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {affiliates.map((af, idx) => {
              const isSelected = idx === selectedMemberIndex;
              const affiliateFee = getAffiliateFee(af);

              return (
                <div
                  key={af.id}
                  className="family-member-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => selectMember(idx)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectMember(idx);
                    }
                  }}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--previasis-green)' : 'var(--border-card)',
                    backgroundColor: isSelected ? 'var(--previasis-green-light)' : '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    boxShadow: isSelected ? '0 4px 12px var(--previasis-green-glow)' : 'none',
                  }}
                >
                  <div className="family-member-main" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--previasis-green)' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : 'var(--text-body)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {af.affiliateCode}
                    </div>
                    <div>
                      <div className="family-member-name-row">
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--previasis-dark-green)' }}>
                          {af.fullName || t('personPlaceholder', { number: af.affiliateCode })}
                        </p>
                        <button
                          type="button"
                          className="family-member-edit-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            editMember(idx);
                          }}
                            aria-label={`${t('editMemberAria')}: ${af.fullName || t('personPlaceholder', { number: af.affiliateCode })}`}
                            title={t('editData')}
                        >
                          <Pencil size={12} /> {t('editMember')}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {getRelationshipLabel(af.relationship)} • {af.requestedPlan} ({af.coverageLimit})
                        {' · '}
                        {calculateAge(af.birthDate) === null
                          ? t('agePending')
                          : t('yearsOld', { age: calculateAge(af.birthDate) ?? 0 })}
                      </p>
                      <p style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--previasis-green)', marginTop: '2px' }}>
                        {t('monthlyRate')}: ${affiliateFee} {t('perMonth')}
                      </p>
                    </div>
                  </div>

                  <div className="family-member-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {idx === 0 ? (
                      <span className="pill-badge" style={{ fontSize: '0.6875rem' }}>
                        {t('holderBadge')}
                      </span>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {t('memberCode')} #{af.affiliateCode}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAffiliate(idx);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--status-error)',
                            cursor: 'pointer',
                            padding: '0.375rem',
                          }}
                          title={t('removeMember')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <section className="billing-preview" aria-labelledby="billing-preview-title">
            <div className="billing-preview-heading">
              <span className="billing-preview-eyebrow">{t('subtotal')}</span>
              <h4 id="billing-preview-title">
                ${groupSubtotal * (billingPeriods.find((period) => period.id === paymentFrequency)?.months || 1)}
              </h4>
              {paymentFrequency !== 'Mensual' && (
                <p>
                  {t('payment')} {tPayment(PAYMENT_FREQUENCY_TRANSLATION_KEYS[paymentFrequency])} · {t('equivalentTo')} ${groupSubtotal} {t('perMonth')}
                </p>
              )}
            </div>

            <div className="billing-periods">
              {billingPeriods.map((period) => {
                const isSelected = paymentFrequency === period.id;
                return (
                  <button
                    key={period.id}
                    type="button"
                    className={`billing-period ${isSelected ? 'selected' : ''}`}
                    onClick={() => onPaymentFrequencyChange(period.id)}
                    aria-pressed={isSelected}
                  >
                    {period.id === 'Trimestral' && (
                      <span className="billing-popular-badge">
                        <Flame size={13} fill="currentColor" /> {t('mostRequested')}
                      </span>
                    )}
                    <span className="billing-period-name">{tPayment(PAYMENT_FREQUENCY_TRANSLATION_KEYS[period.id])}</span>
                    <strong>${groupSubtotal * period.months}</strong>
                    <small>{t('monthCount', { count: period.months })}</small>
                    {isSelected && <Check className="billing-period-check" size={16} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>


        <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
              <Award size={20} />
            </div>
            <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              {t('planSelection')}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {t('for')} <strong>{currentMember?.fullName || t('personPlaceholder', { number: currentMember?.affiliateCode || 1 })}</strong>
            </p>
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {currentAge === null
              ? t('enterBirthDate')
              : currentRange === '61-80'
                ? t('abuelosPlan')
                : currentRange === null
                  ? t('ageOutOfRange')
                  : t('ageRangeF', { range: currentRange })}
          </p>

          <div className={`grid ${availablePlans.length > 4 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            {availablePlans.map((plan) => {
              const isPlanSelected = currentMember?.requestedPlan === plan.id
                && currentMember?.coverageLimit === plan.defaultCoverage;
              const monthlyPrice = getMonthlyPrice(plan, currentAge);

              return (
                <button
                  type="button"
                  key={`${plan.id}-${plan.defaultCoverage}`}
                  onClick={() => selectPlan(plan)}
                  className={`plan-gradient-card ${plan.classStyle} ${isPlanSelected ? 'selected' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px', textAlign: 'left' }}
                  aria-pressed={isPlanSelected}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <Award size={18} />
                      {isPlanSelected && (
                        <span style={{ backgroundColor: '#ffffff', color: '#073E23', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.9375rem', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      {plan.name}
                    </h4>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>
                        {plan.defaultCoverage} {t('annualCoverage')}
                      </p>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.6875rem', opacity: 0.9 }}>{t('monthlyFee')}</p>
                    <strong style={{ fontSize: '1.25rem' }}>
                      {monthlyPrice === null ? t('consult') : `$${monthlyPrice}`}
                    </strong>

                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>


      <div className="previasis-card">
        <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--previasis-dark-green)', marginBottom: '1.25rem' }}>
          {t('memberData')} {currentMember?.fullName || t('personPlaceholder', { number: currentMember?.affiliateCode || 1 })}
        </h4>

        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('fullName')} <span className="previasis-label-required">*</span>
            </label>
            <input
              ref={memberNameInputRef}
              type="text"
              className="previasis-input"
               placeholder={t('fullNamePlaceholder')}
              value={currentMember?.fullName}
              onChange={(e) => updateAffiliate(selectedMemberIndex, { fullName: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group contextual-tooltip-host">
            <div className="previasis-label">
              <label htmlFor="affiliate-document-number">
                {t('idCard')} <span className="previasis-label-required">*</span>
              </label>
              <ContextualTooltip text={t('minorDocumentHint')} label={t('showFieldHelp')} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={currentMember?.documentType}
                onChange={(e) => updateAffiliate(selectedMemberIndex, {
                  documentType: e.target.value as AffiliateRow['documentType'],
                })}
              >
                <option value="M">M-</option>
                <option value="V">{t('idPrefix')}</option>
                <option value="E">{t('idPrefixE')}</option>
                <option value="P">{t('idPrefixP')}</option>
              </select>
              <input
                id="affiliate-document-number"
                type="text"
                className="previasis-input"
                placeholder={t('idPlaceholder')}
                value={currentMember?.documentNumber}
                onChange={(e) => updateAffiliate(selectedMemberIndex, {
                  documentNumber: e.target.value.replace(/\D/g, ''),
                })}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1rem' }}>
          <div className="previasis-input-group contextual-tooltip-host">
            <div className="previasis-label">
              <label htmlFor="affiliate-birth-date">
                {t('birthDate')} <span className="previasis-label-required">*</span>
              </label>
              <ContextualTooltip text={t('actuarialAgeHint')} label={t('showFieldHelp')} />
            </div>
            <input
              id="affiliate-birth-date"
              type="date"
              className="previasis-input"
              min={getMinimumBirthDate()}
              max={new Date().toISOString().slice(0, 10)}
              value={currentMember?.birthDate}
              onChange={(e) => updateAffiliate(selectedMemberIndex, { birthDate: e.target.value })}
              onBlur={() => validateBirthDate(currentMember?.birthDate)}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('relationship')} <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={currentMember?.relationship}
              onChange={(e) => updateAffiliate(selectedMemberIndex, { relationship: e.target.value as Relationship })}
            >
               <option value="Titular">{t('holder')}</option>
               <option value="Cónyuge">{t('spouse')}</option>
               <option value="Hijo/a">{t('child')}</option>
               <option value="Padre/Madre">{t('parent')}</option>
               <option value="Hermano/a">{t('sibling')}</option>
               <option value="Otro">{t('other')}</option>
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('gender')} <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              <button
                type="button"
                onClick={() => updateAffiliate(selectedMemberIndex, { sex: 'M' })}
                className={`pill-switch-btn ${currentMember?.sex === 'M' ? 'active' : ''}`}
              >
                {t('male')}
              </button>
              <button
                type="button"
                onClick={() => updateAffiliate(selectedMemberIndex, { sex: 'F' })}
                className={`pill-switch-btn ${currentMember?.sex === 'F' ? 'active' : ''}`}
              >
                {t('female')}
              </button>
            </div>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('coverageLimit')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              readOnly
              value={currentMember?.coverageLimit}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('weight')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('weightPlaceholder')}
              value={currentMember?.weightKg}
              onChange={(e) => updateAffiliate(selectedMemberIndex, { weightKg: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('height')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('heightPlaceholder')}
              value={currentMember?.heightCm}
              onChange={(e) => updateAffiliate(selectedMemberIndex, { heightCm: e.target.value })}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3AffiliatesPlan;
