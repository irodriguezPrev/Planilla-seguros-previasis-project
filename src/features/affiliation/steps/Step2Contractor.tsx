'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/core/components/ui/Card';
import { Input } from '@/core/components/ui/Input';
import { Badge } from '@/core/components/ui/Badge';
import {
  ContractorSection,
  NaturalPersonData,
  LegalEntityData,
  DocumentType,
  TaxIdType,
  MaritalStatus,
  Sex,
  LegalEconomicActivity,
} from '@/core/interfaces/affiliation.interfaces';

interface Step2Props {
  contractor: ContractorSection;
  onContractorChange: (contractor: ContractorSection) => void;
}

export const Step2Contractor: React.FC<Step2Props> = ({
  contractor,
  onContractorChange,
}) => {
  const t = useTranslations('step2');
  const updateContractor = (fields: Partial<ContractorSection>) => {
    onContractorChange({ ...contractor, ...fields, personType: 'Natural' });
  };

  const updateNaturalPerson = (fields: Partial<NaturalPersonData>) => {
    onContractorChange({
      ...contractor,
      personType: 'Natural',
      naturalPerson: { ...contractor.naturalPerson, ...fields },
    });
  };

  const updateLegalEntity = (fields: Partial<LegalEntityData>) => {
    onContractorChange({
      ...contractor,
      legalEntity: { ...contractor.legalEntity, ...fields },
    });
  };

  const updateLegalRepresentative = (fields: Partial<NaturalPersonData>) => {
    onContractorChange({
      ...contractor,
      legalEntity: {
        ...contractor.legalEntity,
        legalRepresentative: {
          ...contractor.legalEntity.legalRepresentative,
          ...fields,
        },
      },
    });
  };

  const naturalPerson = contractor.naturalPerson;
  const legalEntity = contractor.legalEntity;
  const legalRepresentative = legalEntity.legalRepresentative;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <Badge variant="info">{t('section3')}</Badge>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {t('contractorData')}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {t('contractorDesc')}
          </p>
        </div>


        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <input
            type="checkbox"
            id="differentContractor"
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            checked={contractor.isDifferent}
            onChange={(e) => updateContractor({ isDifferent: e.target.checked })}
          />
          <label htmlFor="differentContractor" style={{ fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
            {t('differentContractor')}
          </label>
        </div>

        {!contractor.isDifferent ? (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px dashed var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {t('sameAsHolder')}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {t('sameAsHolderDesc')}
            </p>
          </div>
        ) : (

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {(
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">{t('idCard')} *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="input-field"
                        style={{ width: '80px', flex: '0 0 auto' }}
                        value={naturalPerson.documentType}
                        onChange={(e) => updateNaturalPerson({ documentType: e.target.value as DocumentType })}
                      >
                        <option value="V">{t('idPrefix')}</option>
                        <option value="E">{t('idPrefixE')}</option>
                        <option value="P">{t('idPrefixP')}</option>
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={t('idPlaceholder')}
                        value={naturalPerson.documentNumber}
                        onChange={(e) => updateNaturalPerson({ documentNumber: e.target.value.replace(/\D/g, '') })}
                        required
                      />
                    </div>
                  </div>
                  <Input
                    label={t('firstName')}
                    value={naturalPerson.firstNames}
                    onChange={(e) => updateNaturalPerson({ firstNames: e.target.value })}
                    required
                  />
                  <Input
                    label={t('lastName')}
                    value={naturalPerson.lastNames}
                    onChange={(e) => updateNaturalPerson({ lastNames: e.target.value })}
                    required
                  />



                </div>



                <div className="grid grid-cols-4 gap-4">
                  <div className="input-group">
                      <label className="input-label">{t('rif')} *</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          className="input-field"
                          style={{ width: '80px', flex: '0 0 auto' }}
                          value={naturalPerson.taxIdType}
                    onChange={(e) => updateNaturalPerson({ taxIdType: e.target.value as TaxIdType })}
                      >
                        <option value="V">{t('idPrefix')}</option>
                        <option value="E">{t('idPrefixE')}</option>
                        <option value="J">{t('rifPrefixJ')}</option>
                        <option value="G">{t('rifPrefixG')}</option>
                        </select>
                        <input
                          type="text"
                          className="input-field"
                          placeholder={t('rifPlaceholder')}
                          value={naturalPerson.taxId}
                          onChange={(e) => updateNaturalPerson({ taxId: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  <Input
                    label={t('nationality')}
                    value={naturalPerson.nationality}
                    onChange={(e) => updateNaturalPerson({ nationality: e.target.value })}
                    required
                  />
                  <div className="input-group">
                    <label className="input-label">{t('civilStatus')} *</label>
                    <select
                      className="input-field"
                      value={naturalPerson.maritalStatus}
                      onChange={(e) => updateNaturalPerson({ maritalStatus: e.target.value as MaritalStatus })}
                    >
                      <option value="Soltero(a)">{t('single')}</option>
                      <option value="Casado(a)">{t('married')}</option>
                      <option value="Divorciado(a)">{t('divorced')}</option>
                      <option value="Viudo(a)">{t('widowed')}</option>
                      <option value="Concubinato">{t('cohabiting')}</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('gender')} *</label>
                    <select
                      className="input-field"
                      value={naturalPerson.sex}
                      onChange={(e) => updateNaturalPerson({ sex: e.target.value as Sex })}
                    >
                      <option value="M">{t('maleOption')}</option>
                      <option value="F">{t('femaleOption')}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label={t('birthDate')}
                    type="date"
                    value={naturalPerson.birthDate}
                    onChange={(e) => updateNaturalPerson({ birthDate: e.target.value })}
                    required
                  />
                  <Input
                    label={t('profession')}
                    value={naturalPerson.profession}
                    onChange={(e) => updateNaturalPerson({ profession: e.target.value })}
                    required
                  />
                  <Input
                    label={t('occupation')}
                    value={naturalPerson.occupation}
                    onChange={(e) => updateNaturalPerson({ occupation: e.target.value })}
                    required
                  />
                  <Input
                    label={t('annualIncome')}
                    value={naturalPerson.annualIncomeBs}
                    onChange={(e) => updateNaturalPerson({ annualIncomeBs: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label={t('birthPlace')}
                    value={naturalPerson.birthPlace}
                    onChange={(e) => updateNaturalPerson({ birthPlace: e.target.value })}
                    required
                  />
                  <Input
                    label={t('localPhone')}
                    value={naturalPerson.homePhone}
                    onChange={(e) => updateNaturalPerson({ homePhone: e.target.value })}
                    required
                  />
                  <Input
                    label={t('mobilePhone')}
                    value={naturalPerson.mobilePhone}
                    onChange={(e) => updateNaturalPerson({ mobilePhone: e.target.value })}
                    required
                  />
                  <Input
                    label={t('email')}
                    type="email"
                    value={naturalPerson.email}
                    onChange={(e) => updateNaturalPerson({ email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">{t('homeAddress')} *</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={naturalPerson.homeAddress}
                      onChange={(e) => updateNaturalPerson({ homeAddress: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('officeAddress')} *</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={naturalPerson.officeAddress}
                      onChange={(e) => updateNaturalPerson({ officeAddress: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('paymentAddress')} *</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={naturalPerson.billingAddress}
                      onChange={(e) => updateNaturalPerson({ billingAddress: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}


            {contractor.personType === 'Juridica' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {t('companyData')}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('businessName')}
                    placeholder={t('businessNamePlaceholder')}
                    value={legalEntity.legalName}
                    onChange={(e) => updateLegalEntity({ legalName: e.target.value })}
                    required
                  />
                  <div className="input-group">
                    <label className="input-label">{t('businessRif')} *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="input-field"
                        style={{ width: '80px', flex: '0 0 auto' }}
                        value={legalEntity.taxIdType}
                        onChange={(e) => updateLegalEntity({ taxIdType: e.target.value as 'J' | 'G' })}
                      >
                        <option value="J">J-</option>
                        <option value="G">G-</option>
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={t('legalRifPlaceholder')}
                        value={legalEntity.taxId}
                        onChange={(e) => updateLegalEntity({ taxId: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label={t('registryNumber')}
                    placeholder={t('registryNumberPlaceholder')}
                    value={legalEntity.commercialRegistryNumber}
                    onChange={(e) => updateLegalEntity({ commercialRegistryNumber: e.target.value })}
                    required
                  />
                  <Input
                    label={t('registryVolume')}
                    placeholder={t('registryVolumePlaceholder')}
                    value={legalEntity.volumeNumber}
                    onChange={(e) => updateLegalEntity({ volumeNumber: e.target.value })}
                    required
                  />
                  <Input
                    label={t('registrationDate')}
                    type="date"
                    value={legalEntity.registrationDate}
                    onChange={(e) => updateLegalEntity({ registrationDate: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="input-label">{t('economicActivity')} *</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {(['Profesional', 'Comercial', 'Industrial'] as LegalEconomicActivity[]).map((act) => {
                        const labelKey = act === 'Profesional' ? 'professional' : act === 'Comercial' ? 'commercial' : 'industrial';
                        return (
                          <label key={act} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="legalEconomicActivity"
                              value={act}
                              checked={legalEntity.economicActivity === act}
                              onChange={() => updateLegalEntity({ economicActivity: act })}
                            />
                            <span>{t(labelKey)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <Input
                    label={t('productsServices')}
                    placeholder={t('productsServicesPlaceholder')}
                    value={legalEntity.productsServices}
                    onChange={(e) => updateLegalEntity({ productsServices: e.target.value })}
                    required
                  />

                  {legalEntity.economicActivity === 'Comercial' && (
                    <Input
                      label={t('businessSector')}
                      placeholder={t('businessSectorPlaceholder')}
                      value={legalEntity.businessSector || ''}
                      onChange={(e) => updateLegalEntity({ businessSector: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('fiscalAddress')} *</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder={t('fiscalAddressPlaceholder')}
                    value={legalEntity.taxAddress}
                    onChange={(e) => updateLegalEntity({ taxAddress: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label={t('lastYearProfit')}
                    placeholder={t('productivityPlaceholder')}
                    value={legalEntity.previousFiscalYearProfit}
                    onChange={(e) => updateLegalEntity({ previousFiscalYearProfit: e.target.value })}
                    required
                  />
                  <Input
                    label={t('netWorth')}
                    placeholder={t('productivityPlaceholder')}
                    value={legalEntity.netWorth}
                    onChange={(e) => updateLegalEntity({ netWorth: e.target.value })}
                    required
                  />
                  <Input
                    label={t('companyPhone')}
                    placeholder={t('companyPhonePlaceholder')}
                    value={legalEntity.phone}
                    onChange={(e) => updateLegalEntity({ phone: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4>{t('representativeData')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="input-group">
                      <label className="input-label">{t('representativeDoc')} *</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          className="input-field"
                          style={{ width: '80px', flex: '0 0 auto' }}
                          value={legalRepresentative.documentType}
                          onChange={(e) => updateLegalRepresentative({ documentType: e.target.value as DocumentType })}
                        >
                          <option value="V">{t('idPrefix')}</option>
                          <option value="E">{t('idPrefixE')}</option>
                          <option value="P">{t('idPrefixP')}</option>
                        </select>
                        <input
                          type="text"
                          className="input-field"
                          placeholder={t('representativeDocPlaceholder')}
                          value={legalRepresentative.documentNumber}
                          onChange={(e) => updateLegalRepresentative({ documentNumber: e.target.value.replace(/\D/g, '') })}
                          required
                        />
                      </div>
                    </div>
                    <Input
                      label={t('representativeName')}
                      value={legalRepresentative.firstNames}
                      onChange={(e) => updateLegalRepresentative({ firstNames: e.target.value })}
                      required
                    />
                    <Input
                      label={t('representativeLastName')}
                      value={legalRepresentative.lastNames}
                      onChange={(e) => updateLegalRepresentative({ lastNames: e.target.value })}
                      required
                    />
                  </div>

                  <div className="previasis-input-group step1-field-wide">
                    <label className="previasis-label">
                      {t('pepDescription')} <span className="previasis-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="previasis-input"
                      placeholder={t('pepDescriptionPlaceholder')}
                      value={legalRepresentative.politicallyExposedDescription || ''}
                      onChange={(e) => updateLegalRepresentative({ politicallyExposedDescription: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="input-group">
                      <label className="input-label">{t('representativeRif')} *</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          className="input-field"
                          style={{ width: '80px', flex: '0 0 auto' }}
                          value={legalRepresentative.taxIdType}
                          onChange={(e) => updateLegalRepresentative({ taxIdType: e.target.value as TaxIdType })}
                        >
                          <option value="V">{t('idPrefix')}</option>
                          <option value="E">{t('idPrefixE')}</option>
                          <option value="J">{t('rifPrefixJ')}</option>
                          <option value="G">{t('rifPrefixG')}</option>
                        </select>
                        <input
                          type="text"
                          className="input-field"
                          placeholder={t('representativeRifPlaceholder')}
                          value={legalRepresentative.taxId}
                          onChange={(e) => updateLegalRepresentative({ taxId: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Input
                      label={t('nationality')}
                      value={legalRepresentative.nationality}
                      onChange={(e) => updateLegalRepresentative({ nationality: e.target.value })}
                      required
                    />
                    <div className="input-group">
                      <label className="input-label">{t('civilStatus')} *</label>
                      <select
                        className="input-field"
                        value={legalRepresentative.maritalStatus}
                        onChange={(e) => updateLegalRepresentative({ maritalStatus: e.target.value as MaritalStatus })}
                      >
                        <option value="Soltero(a)">{t('single')}</option>
                        <option value="Casado(a)">{t('married')}</option>
                        <option value="Divorciado(a)">{t('divorced')}</option>
                        <option value="Viudo(a)">{t('widowed')}</option>
                        <option value="Concubinato">{t('cohabiting')}</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">{t('gender')} *</label>
                      <select
                        className="input-field"
                        value={legalRepresentative.sex}
                        onChange={(e) => updateLegalRepresentative({ sex: e.target.value as Sex })}
                      >
                        <option value="M">{t('maleOption')}</option>
                        <option value="F">{t('femaleOption')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      label={t('birthDate')}
                      type="date"
                      value={legalRepresentative.birthDate}
                      onChange={(e) => updateLegalRepresentative({ birthDate: e.target.value })}
                      required
                    />
                    <Input
                      label={t('representativeProfession')}
                      value={legalRepresentative.profession}
                      onChange={(e) => updateLegalRepresentative({ profession: e.target.value })}
                      required
                    />
                    <Input
                      label={t('representativeOccupation')}
                      value={legalRepresentative.occupation}
                      onChange={(e) => updateLegalRepresentative({ occupation: e.target.value })}
                      required
                    />
                    <Input
                      label={t('annualIncome')}
                      value={legalRepresentative.annualIncomeBs}
                      onChange={(e) => updateLegalRepresentative({ annualIncomeBs: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      label={t('birthPlace')}
                      value={legalRepresentative.birthPlace}
                      onChange={(e) => updateLegalRepresentative({ birthPlace: e.target.value })}
                      required
                    />
                    <Input
                      label={t('localPhone')}
                      value={legalRepresentative.homePhone}
                      onChange={(e) => updateLegalRepresentative({ homePhone: e.target.value })}
                      required
                    />
                    <Input
                      label={t('mobilePhone')}
                      value={legalRepresentative.mobilePhone}
                      onChange={(e) => updateLegalRepresentative({ mobilePhone: e.target.value })}
                      required
                    />
                    <Input
                      label={t('representativeEmail')}
                      type="email"
                      value={legalRepresentative.email}
                      onChange={(e) => updateLegalRepresentative({ email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{t('homeAddress')} *</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={legalRepresentative.homeAddress}
                      onChange={(e) => updateLegalRepresentative({ homeAddress: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Step2Contractor;
