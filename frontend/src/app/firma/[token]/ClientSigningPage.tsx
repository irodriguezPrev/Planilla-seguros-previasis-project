'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/core/components/ui/Button';
import { AffiliationFormState } from '@/core/interfaces/affiliation.interfaces';
import { PdfGeneratorService } from '@/core/services/pdf-generator.service';
import {
  RemoteSigningError,
  SigningAccessResponse,
  accessRemoteSigningRequest,
  signRemoteDocument,
} from '@/core/services/signing-request.service';
import { deserializeAffiliationDraft } from '@/core/utils/affiliation-draft.mapper';
import { SignaturePad } from '@/features/affiliation/SignaturePad';

interface ClientSigningPageProps {
  token: string;
}

const suggestedPlace = (formData: AffiliationFormState) =>
  [formData.policyholder.residenceCity, formData.policyholder.residenceState]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');

export function ClientSigningPage({ token }: ClientSigningPageProps) {
  const t = useTranslations('clientSigning');
  const [access, setAccess] = useState<SigningAccessResponse | null>(null);
  const [formData, setFormData] = useState<AffiliationFormState | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [acceptsHolder, setAcceptsHolder] = useState(false);
  const [acceptsFunds, setAcceptsFunds] = useState(false);
  const [place, setPlace] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const contractorIsDifferent = Boolean(formData?.contractor.isDifferent);
  const requiresHolderDeclaration = access?.role === 'TITULAR';
  const requiresFundsDeclaration = access?.role === 'CONTRATANTE' || (
    access?.role === 'TITULAR' && !contractorIsDifferent
  );

  const canSign = useMemo(() => Boolean(
    signature &&
    place.trim() &&
    (!requiresHolderDeclaration || acceptsHolder) &&
    (!requiresFundsDeclaration || acceptsFunds),
  ), [
    acceptsFunds,
    acceptsHolder,
    place,
    requiresFundsDeclaration,
    requiresHolderDeclaration,
    signature,
  ]);

  useEffect(() => {
    if (!formData) return;
    let active = true;
    let generatedUrl: string | null = null;
    void PdfGeneratorService.getPdfBlobUrl(formData, {
      mode: completed || access?.status === 'FIRMADO' ? 'final' : 'draft',
    }).then((url) => {
      generatedUrl = url;
      if (active) setPdfUrl(url);
    }).catch(() => {
      if (active) setError(t('pdfError'));
    });
    return () => {
      active = false;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [access?.status, completed, formData, t]);

  const loadSigningRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccess(null);
    setFormData(null);
    setPdfUrl(null);
    try {
      const response = await accessRemoteSigningRequest(token);
      const normalizedForm = deserializeAffiliationDraft(response.formData);
      setAccess(response);
      setFormData(normalizedForm);
      setPlace(normalizedForm.signatures.place || suggestedPlace(normalizedForm));
      setCompleted(response.status === 'FIRMADO');
      setValidationAttempted(false);
    } catch (requestError) {
      setError(requestError instanceof RemoteSigningError ? requestError.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    void loadSigningRequest();
  }, [loadSigningRequest]);

  const handleSign = async () => {
    setValidationAttempted(true);
    setError(null);
    if (!signature || !canSign) return;
    setSigning(true);
    try {
      const response = await signRemoteDocument(token, {
        signatureDataUrl: signature,
        place: place.trim(),
        acceptsPolicyholderDeclaration: requiresHolderDeclaration && acceptsHolder,
        acceptsContractorSourceOfFunds: requiresFundsDeclaration && acceptsFunds,
      });
      setFormData(deserializeAffiliationDraft(response.formData));
      setCompleted(true);
      setAccess((previous) => previous ? { ...previous, status: 'FIRMADO' } : previous);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(requestError instanceof RemoteSigningError ? requestError.message : t('genericError'));
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = () => {
    if (!formData) return;
    const documentNumber = formData.policyholder.documentNumber || 'documento';
    void PdfGeneratorService.downloadPdf(
      formData,
      `Solicitud_Afiliacion_Previasis_${documentNumber}.pdf`,
      { mode: completed ? 'final' : 'draft' },
    );
  };

  if (!access || !formData) {
    return (
      <div className="client-signing-page">
        <section className="client-signing-access previasis-card">
          <div className="client-signing-icon"><FileText size={28} /></div>
          <span className="client-signing-eyebrow">PREVIASIS</span>
          <h1>{loading ? t('loadingTitle') : t('loadErrorTitle')}</h1>
          <p>{loading ? t('loadingSubtitle') : t('loadErrorSubtitle')}</p>
          {error && <div className="client-signing-error" role="alert">{error}</div>}
          {!loading && (
            <Button onClick={() => void loadSigningRequest()}>
              {t('retry')}
            </Button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="client-signing-page">
      <div className="client-signing-shell">
        <header className={`client-signing-header ${completed ? 'is-complete' : ''}`}>
          <div className="client-signing-icon">
            {completed ? <CheckCircle2 size={28} /> : <FileText size={28} />}
          </div>
          <div>
            <span className="client-signing-eyebrow">PREVIASIS · {t(`roles.${access.role}`)}</span>
            <h1>{completed ? t('signedTitle') : t('reviewTitle')}</h1>
            <p>
              {completed
                ? t('signedSubtitle')
                : t('signerSummary', { name: access.signerName, document: access.documentMask })}
            </p>
          </div>
        </header>

        {error && <div className="client-signing-error" role="alert">{error}</div>}

        <div className={`client-signing-grid ${completed ? 'is-complete' : ''}`}>
          <section className="client-signing-preview previasis-card">
            <div className="client-signing-section-title">
              <FileText size={18} />
              <strong>{t('documentTitle')}</strong>
            </div>
            {pdfUrl ? (
              <iframe src={pdfUrl} title={t('documentTitle')} />
            ) : (
              <div className="client-signing-pdf-loading">{t('pdfLoading')}</div>
            )}
          </section>

          {!completed && (
            <section className={`client-signing-form previasis-card ${validationAttempted ? 'show-validation-errors' : ''}`}>
              <h2>{t('confirmTitle')}</h2>
              <p className="client-signing-muted">{t('confirmSubtitle')}</p>

              {validationAttempted && !canSign && (
                <div className="client-signing-validation-summary" role="alert">
                  <AlertCircle size={18} />
                  <span>{t('requiredFields')}</span>
                </div>
              )}

              {requiresHolderDeclaration && (
                <label className="client-signing-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptsHolder}
                    onChange={(event) => setAcceptsHolder(event.target.checked)}
                    required
                  />
                  <span className="client-signing-checkbox-copy">
                    <span>{t('acceptHolder')}</span>
                    {validationAttempted && !acceptsHolder && (
                      <span className="client-signing-field-error">{t('declarationRequired')}</span>
                    )}
                  </span>
                </label>
              )}

              {requiresFundsDeclaration && (
                <label className="client-signing-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptsFunds}
                    onChange={(event) => setAcceptsFunds(event.target.checked)}
                    required
                  />
                  <span className="client-signing-checkbox-copy">
                    <span>{t('acceptFunds')}</span>
                    {validationAttempted && !acceptsFunds && (
                      <span className="client-signing-field-error">{t('declarationRequired')}</span>
                    )}
                  </span>
                </label>
              )}

              <div className="previasis-input-group">
                <label className="previasis-label" htmlFor="signing-place">{t('place')}</label>
                <input
                  id="signing-place"
                  className="previasis-input"
                  value={place}
                  maxLength={180}
                  onChange={(event) => setPlace(event.target.value)}
                  required
                />
              </div>

              <SignaturePad
                label={t('signatureLabel')}
                sublabel={t('signatureHint')}
                onSave={setSignature}
                required
              />

              <p className="client-signing-legal-note">
                <ShieldCheck size={17} /> {t('legalNotice')}
              </p>
              <Button onClick={handleSign} isLoading={signing}>
                {t('signDocument')}
              </Button>
            </section>
          )}
        </div>

        {completed && (
          <div className="client-signing-complete-actions">
            <Button onClick={handleDownload}>{t('downloadSigned')}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
