'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SignaturePad } from '../SignaturePad';
import {
  DeclarationsSignaturesSection,
  BrokerSection,
  DocumentType,
  TaxIdType,
  NaturalPersonData,
  ContractorSection,
} from '@/core/interfaces/affiliation.interfaces';
import { ShieldCheck, FileCheck, Award } from 'lucide-react';

function getCurrentLocalDate(): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Step6Props {
  signatures: DeclarationsSignaturesSection;
  broker: BrokerSection;
  policyholder: NaturalPersonData;
  contractor: ContractorSection;
  suggestedPlace: string;
  onSignaturesChange: (signatures: DeclarationsSignaturesSection) => void;
  onBrokerChange: (broker: BrokerSection) => void;
}

export const Step6SignaturesAndDeclarations: React.FC<Step6Props> = ({
  signatures,
  broker,
  policyholder,
  contractor,
  suggestedPlace,
  onSignaturesChange,
  onBrokerChange,
}) => {
  const t = useTranslations('step6');
  const today = getCurrentLocalDate();
  useEffect(() => {
    const shouldSetPlace = !(signatures.place || '').trim() && Boolean(suggestedPlace);
    const shouldSetDate = signatures.date !== today;
    if (shouldSetPlace || shouldSetDate) {
      onSignaturesChange({
        ...signatures,
        place: shouldSetPlace ? suggestedPlace : signatures.place,
        date: today,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatures.place, signatures.date, suggestedPlace, today]);

  const updateSignatures = (fields: Partial<DeclarationsSignaturesSection>) => {
    onSignaturesChange({ ...signatures, ...fields });
  };

  const updateBroker = (fields: Partial<BrokerSection>) => {
    onBrokerChange({ ...broker, ...fields });
  };

  const policyholderFullName = `${policyholder.firstNames} ${policyholder.lastNames}`.trim() || t('policyholderFallback');
  const contractorFullName = contractor.isDifferent
    ? contractor.personType === 'Natural'
      ? `${contractor.naturalPerson.firstNames} ${contractor.naturalPerson.lastNames}`.trim() || t('contractorFallback')
      : contractor.legalEntity.legalName || t('companyFallback')
    : policyholderFullName;

  const contractorDocumentNumber = contractor.isDifferent
    ? contractor.personType === 'Natural'
      ? `${contractor.naturalPerson.documentType}-${contractor.naturalPerson.documentNumber}`
      : `${contractor.legalEntity.taxIdType}-${contractor.legalEntity.taxId}`
    : `${policyholder.documentType}-${policyholder.documentNumber}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div className="grid grid-cols-2 gap-6">

        <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                {t('legalTerms')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('sudeasegReference')}
              </p>
            </div>
          </div>


          <div
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-card)',
              fontSize: '0.8125rem',
              color: 'var(--text-body)',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <p>
              <strong>{t('declaration1Title')}</strong> {t('declaration1Body', {
                name: policyholderFullName,
                document: `${policyholder.documentType}-${policyholder.documentNumber}`,
              })}
            </p>

            <p>
              <strong>{t('declaration2Title')}</strong> {t('declaration2Body', {
                name: contractorFullName,
                document: contractorDocumentNumber,
              })}
            </p>

            <p>
              <strong>{t('declaration3Title')}</strong> {t('declaration3Body')}
            </p>
          </div>


          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--previasis-dark-green)' }}>
              <input
                type="checkbox"
                style={{ marginTop: '0.15rem', accentColor: 'var(--previasis-green)' }}
                checked={signatures.acceptsPolicyholderDeclaration}
                onChange={(e) => updateSignatures({ acceptsPolicyholderDeclaration: e.target.checked })}
                required
              />
              <span>{t('acceptTerms')} *</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--previasis-dark-green)' }}>
              <input
                type="checkbox"
                style={{ marginTop: '0.15rem', accentColor: 'var(--previasis-green)' }}
                checked={signatures.acceptsContractorSourceOfFunds}
                onChange={(e) => updateSignatures({ acceptsContractorSourceOfFunds: e.target.checked })}
                required
              />
              <span>{t('certifyFunds')} *</span>
            </label>
          </div>
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
              <FileCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                {t('electronicSignature')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('signatureInstruction')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="previasis-input-group">
              <label className="previasis-label">
                {t('subscriptionPlace')} <span className="previasis-label-required">*</span>
              </label>
              <input
                type="text"
                className="previasis-input"
                value={signatures.place || suggestedPlace}
                onChange={(e) => updateSignatures({ place: e.target.value })}
                required
              />
            </div>
            <div className="previasis-input-group">
              <label className="previasis-label">
                {t('subscriptionDate')} <span className="previasis-label-required">*</span>
              </label>
              <input
                type="date"
                className="previasis-input"
                value={today}
                readOnly
                required
              />
            </div>
          </div>


          <SignaturePad
            label={t('policyholderSignature', { name: policyholderFullName })}
            initialSignature={signatures.policyholderSignatureBase64}
            onSave={(b64) => updateSignatures({ policyholderSignatureBase64: b64 })}
            required
          />


          {contractor.isDifferent && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>
              <SignaturePad
                label={t('contractorSignature', { name: contractorFullName })}
                initialSignature={signatures.contractorSignatureBase64}
                onSave={(b64) => updateSignatures({ contractorSignatureBase64: b64 })}
                required
              />
            </div>
          )}
        </div>
      </div>


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
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              {t('brokerTitle')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('brokerSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('brokerName')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('brokerNamePlaceholder')}
              value={broker.fullName}
              onChange={(e) => updateBroker({ fullName: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('credentialNumber')} <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('credentialPlaceholder')}
              value={broker.credentialNumber}
              onChange={(e) => updateBroker({ credentialNumber: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              {t('brokerDocument')} <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={broker.documentType}
                onChange={(e) => updateBroker({
                  documentType: e.target.value as DocumentType | TaxIdType,
                })}
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
                <option value="J">J-</option>
                <option value="P">P-</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder="12345678"
                value={broker.identityOrTaxNumber}
                onChange={(e) => updateBroker({ identityOrTaxNumber: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step6SignaturesAndDeclarations;
