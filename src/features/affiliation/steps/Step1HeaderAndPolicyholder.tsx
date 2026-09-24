'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  HeaderSection,
  NaturalPersonData,
  OperationType,
  ContractType,
  DocumentType,
  TaxIdType,
  MaritalStatus,
  ActivityClassification,
} from '@/core/interfaces/affiliation.interfaces';
import { getCitiesByState, VENEZUELA_STATES } from '@/core/config/venezuela-locations.config';
import {
  isValidEmail,
  isValidVenezuelanMobilePhone,
  normalizePhoneNumber,
} from '@/core/utils/contact-validation.utils';
import { User, Shield, MapPin, Phone, Mail } from 'lucide-react';

interface Step1Props {
  header: HeaderSection;
  policyholder: NaturalPersonData;
  onChangeHeader: (header: HeaderSection) => void;
  onPolicyholderChange: (policyholder: NaturalPersonData) => void;
}

export const Step1HeaderAndPolicyholder: React.FC<Step1Props> = ({
  header,
  policyholder,
  onChangeHeader,
  onPolicyholderChange,
}) => {
  const t = useTranslations('step1');
  const tValidation = useTranslations('validation');
  const updateHeader = (fields: Partial<HeaderSection>) => {
    onChangeHeader({ ...header, ...fields });
  };

  const updatePolicyholder = (fields: Partial<NaturalPersonData>) => {
    onPolicyholderChange({ ...policyholder, ...fields });
  };

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const normalizedOccupation = (policyholder.occupation || '').trim().toLocaleLowerCase();
  const isMerchant = normalizedOccupation.includes('comerciante') || normalizedOccupation.includes('merchant');
  const availableCities = getCitiesByState(policyholder.residenceState);

  const handleEmailBlur = (email: string) => {
    setEmailError(email && !isValidEmail(email) ? tValidation('invalidEmail') : '');
  };

  const handleEmailChange = (email: string) => {
    updatePolicyholder({ email });
    if (!email || isValidEmail(email)) setEmailError('');
  };

  const handlePhoneBlur = (phone: string) => {
    setPhoneError(
      phone && !isValidVenezuelanMobilePhone(phone)
        ? tValidation('invalidVenezuelanMobile')
        : '',
    );
  };

  const handlePhoneChange = (phone: string) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    updatePolicyholder({ mobilePhone: normalizedPhone });
    if (!normalizedPhone || isValidVenezuelanMobilePhone(normalizedPhone)) setPhoneError('');
  };

  return (
    <div className="step1-layout">

      <div className="previasis-card step1-card" style={{ borderLeft: '4px solid var(--previasis-green)' }}>
        <div className="step1-section-header">
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
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                {t('emissionControl')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('sudeasegRef')}

              </p>
            </div>
          </div>
          <span className="pill-badge">{t('section1')}</span>
        </div>

        <div className="step1-control-grid">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="previasis-label">
              {t('operationType')} <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Emisión', 'Inclusión'] as OperationType[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => updateHeader({ operationType: op })}
                  className={`pill-switch-btn ${header.operationType === op ? 'active' : ''}`}
                >
                  {t(op === 'Emisión' ? 'emission' : 'inclusion')}
                </button>
              ))}
            </div>
          </div>


          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="previasis-label">
              {t('contractType')} <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Individual', 'Colectivo'] as ContractType[]).map((co) => (
                <button
                  key={co}
                  type="button"
                  onClick={() => updateHeader({ contractType: co })}
                  className={`pill-switch-btn ${header.contractType === co ? 'active' : ''}`}
                >
                  {t(co === 'Individual' ? 'individual' : 'collective')}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="step1-form-grid step1-identity-grid">

          <div className="previasis-input-group">
            <label className="previasis-label">{t('requestNumber')}</label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('requestNumberPlaceholder')}
              value={header.applicationNumber || ''}
              onChange={(e) => updateHeader({ applicationNumber: e.target.value })}
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('requestDate')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="date"
              className="previasis-input"
              value={header.applicationDate}
              onChange={(e) => updateHeader({ applicationDate: e.target.value })}
              required
            />
          </div>
        </div>
      </div>


      <div className="previasis-card step1-card">
        <div className="step1-section-header step1-section-header-large">
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
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                {t('policyholderData')}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {t('policyholderDescription')}
              </p>
            </div>
          </div>
          <span className="pill-badge">{t('section2')}</span>
        </div>


        <div className="step1-form-grid step1-form-grid-3">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('idCard')} <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={policyholder.documentType}
                onChange={(e) => updatePolicyholder({ documentType: e.target.value as DocumentType })}
              >
                <option value="V">{t('idPrefix')}</option>
                <option value="E">{t('idPrefixE')}</option>
                <option value="P">{t('idPrefixP')}</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder="12345678"
                value={policyholder.documentNumber}
                onChange={(e) => updatePolicyholder({ documentNumber: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>
          </div>
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('firstName')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('firstNamePlaceholder')}
              value={policyholder.firstNames}
              onChange={(e) => updatePolicyholder({ firstNames: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('lastName')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('lastNamePlaceholder')}
              value={policyholder.lastNames}
              onChange={(e) => updatePolicyholder({ lastNames: e.target.value })}
              required
            />
          </div>

        </div>


        <div className="step1-form-grid step1-form-grid-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('rif')} <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={policyholder.taxIdType}
                onChange={(e) => updatePolicyholder({ taxIdType: e.target.value as TaxIdType })}
              >
                <option value="V">{t('idPrefix')}</option>
                <option value="E">{t('idPrefixE')}</option>
                <option value="J">{t('rifPrefixJ')}</option>
                <option value="G">{t('rifPrefixG')}</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder={t('rifPlaceholder')}
                value={policyholder.taxId}
                onChange={(e) => updatePolicyholder({ taxId: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('nationality')} <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={policyholder.nationality}
              onChange={(e) => updatePolicyholder({ nationality: e.target.value })}
            >
              <option value="Venezolana">{t('venezuelan')}</option>
              <option value="Extranjera">{t('foreign')}</option>
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('civilStatus')} <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={policyholder.maritalStatus}
              onChange={(e) => updatePolicyholder({ maritalStatus: e.target.value as MaritalStatus })}
            >
              <option value="Soltero(a)">{t('single')}</option>
              <option value="Casado(a)">{t('married')}</option>
              <option value="Divorciado(a)">{t('divorced')}</option>
              <option value="Viudo(a)">{t('widowed')}</option>
              <option value="Concubinato">{t('cohabiting')}</option>
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('gender')} <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch" style={{ width: '100%' }}>
              <button
                type="button"
                style={{ flex: 1 }}
                onClick={() => updatePolicyholder({ sex: 'M' })}
                className={`pill-switch-btn ${policyholder.sex === 'M' ? 'active' : ''}`}
              >
                {t('male')}
              </button>
              <button
                type="button"
                style={{ flex: 1 }}
                onClick={() => updatePolicyholder({ sex: 'F' })}
                className={`pill-switch-btn ${policyholder.sex === 'F' ? 'active' : ''}`}
              >
                {t('female')}
              </button>
            </div>
          </div>
        </div>


        <div className="step1-form-grid step1-form-grid-2">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('state')} <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={policyholder.residenceState || ''}
              onChange={(e) => updatePolicyholder({
                residenceState: e.target.value,
                residenceCity: '',
              })}
              required
            >
              <option value="">{t('selectState')}</option>
              {VENEZUELA_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('city')} <span className="previasis-label-required">*</span>
            </label>
            <select
              key={policyholder.residenceState || 'sin-estado'}
              className="previasis-input"
              value={policyholder.residenceCity || ''}
              onChange={(e) => updatePolicyholder({ residenceCity: e.target.value })}
              disabled={!policyholder.residenceState}
              required
            >
              <option value="">
                {t(policyholder.residenceState ? 'selectCity' : 'selectStateFirst')}
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>


        <div className="step1-form-grid step1-form-grid-2">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('birthPlace')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('birthPlacePlaceholder')}
              value={policyholder.birthPlace}
              onChange={(e) => updatePolicyholder({ birthPlace: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('birthDate')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="date"
              className="previasis-input"
              value={policyholder.birthDate}
              onChange={(e) => updatePolicyholder({ birthDate: e.target.value })}
              required
            />
          </div>
        </div>


        <div className="step1-form-grid step1-form-grid-3">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('profession')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('professionPlaceholder')}
              value={policyholder.profession}
              onChange={(e) => updatePolicyholder({ profession: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('occupation')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('occupationPlaceholder')}
              value={policyholder.occupation}
              onChange={(e) => updatePolicyholder({ occupation: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('annualIncome')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('annualIncomePlaceholder')}
              value={policyholder.annualIncomeBs}
              onChange={(e) => updatePolicyholder({ annualIncomeBs: e.target.value })}
              required
            />
          </div>
        </div>

        {isMerchant && (
          <div className="step1-form-grid step1-form-grid-1">
            <div className="previasis-input-group">
              <label className="previasis-label">
                {t('economicSector')} <span className="previasis-label-required">*</span>
              </label>
              <input
                type="text"
                className="previasis-input"
                placeholder={t('economicSectorPlaceholder')}
                value={policyholder.businessSector || ''}
                onChange={(e) => updatePolicyholder({ businessSector: e.target.value })}
                required
              />
            </div>
          </div>
        )}


        <div className="step1-context-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="previasis-label">
              {t('activityClassification')} <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Independiente', 'Dependiente', 'Societaria'] as ActivityClassification[]).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => updatePolicyholder({ activityClassification: act })}
                  className={`pill-switch-btn ${policyholder.activityClassification === act ? 'active' : ''}`}
                >
                  {t(act === 'Dependiente' ? 'dependent' : act === 'Independiente' ? 'independent' : 'corporate')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="previasis-label">
                {t('pep')} <span className="previasis-label-required">*</span>
              </label>
              <div className="pill-switch">
                <button
                  type="button"
                  onClick={() => updatePolicyholder({ politicallyExposed: 'NO' })}
                  className={`pill-switch-btn ${policyholder.politicallyExposed === 'NO' ? 'active' : ''}`}
                >
                  {t('pepNo')}
                </button>
                <button
                  type="button"
                  onClick={() => updatePolicyholder({ politicallyExposed: 'SÍ' })}
                  className={`pill-switch-btn ${policyholder.politicallyExposed === 'SÍ' ? 'active' : ''}`}
                >
                  {t('pepYes')}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('pepHint')}
            </p>
          </div>
        </div>

        {policyholder.activityClassification === 'Dependiente' && (
          <div className="previasis-input-group step1-field-wide">
            <label className="previasis-label">
              {t('companyWhereWork')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('companyWhereWorkPlaceholder')}
              value={policyholder.company || ''}
              onChange={(e) => updatePolicyholder({ company: e.target.value })}
              required
            />
          </div>
        )}

        {policyholder.politicallyExposed === 'SÍ' && (
          <div className="previasis-input-group step1-field-wide">
            <label className="previasis-label">
              {t('pepDescription')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('pepDescriptionPlaceholder')}
              value={policyholder.politicallyExposedDescription || ''}
              onChange={(e) => updatePolicyholder({ politicallyExposedDescription: e.target.value })}
              required
            />
          </div>
        )}


        <div className="step1-address-group">
          <div className="step1-form-grid step1-form-grid-3">
             <div className="previasis-input-group">
            <label className="previasis-label">
              <MapPin size={16} color="var(--previasis-green)" />
              {t('residenceAddress')} <span className="previasis-label-required">*</span>
            </label>
            <input
              className="previasis-input"
              type="text"
              placeholder={t('residenceAddressPlaceholder')}
              value={policyholder.homeAddress}
              onChange={(e) => updatePolicyholder({ homeAddress: e.target.value })}
              required
            />
          </div>
            <div className="previasis-input-group">
              <label className="previasis-label">{t('officeAddress')}</label>
              <input
                type="text"
                className="previasis-input"
                placeholder={t('officeAddressPlaceholder')}
                value={policyholder.officeAddress}
                onChange={(e) => updatePolicyholder({ officeAddress: e.target.value })}
              />
            </div>

            <div className="previasis-input-group">
              <label className="previasis-label">
                {t('paymentAddress')} <span className="previasis-label-required">*</span>
              </label>
              <input
                type="text"
                className="previasis-input"
                placeholder={t('paymentAddressPlaceholder')}
                value={policyholder.billingAddress}
                onChange={(e) => updatePolicyholder({ billingAddress: e.target.value })}
                required
              />
            </div>
          </div>
        </div>


        <div className="step1-form-grid step1-form-grid-3 step1-contact-grid">
          <div className="previasis-input-group">
            <label className="previasis-label">
              <Phone size={16} color="var(--previasis-green)" />
              {t('localPhone')}
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('localPhonePlaceholder')}
              value={policyholder.homePhone}
              onChange={(e) => updatePolicyholder({ homePhone: e.target.value })}
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              <Phone size={16} color="var(--previasis-green)" />
              {t('mobilePhone')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="tel"
              className={`previasis-input ${phoneError ? 'input-error' : ''}`}
              placeholder={t('mobilePhonePlaceholder')}
              value={policyholder.mobilePhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={(e) => handlePhoneBlur(e.target.value)}
              required
            />
            {phoneError && <span className="input-error-message">{phoneError}</span>}
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              <Mail size={16} color="var(--previasis-green)" />
              {t('email')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="email"
              className={`previasis-input ${emailError ? 'input-error' : ''}`}
              placeholder={t('emailPlaceholder')}
              value={policyholder.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={(e) => handleEmailBlur(e.target.value)}
              required
            />
            {emailError && <span className="input-error-message">{emailError}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1HeaderAndPolicyholder;
