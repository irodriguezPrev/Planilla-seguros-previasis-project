'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/core/components/ui/Button';
import { Card } from '@/core/components/ui/Card';
import { AffiliationFormState } from '@/core/interfaces/affiliation.interfaces';
import { PdfGeneratorService } from '@/core/services/pdf-generator.service';
import { Download, Printer, Share2, X, FileText } from 'lucide-react';

type PdfPreviewMode = 'draft' | 'final';

interface PdfPreviewModalProps {
  isOpen: boolean;
  mode: PdfPreviewMode;
  onClose: () => void;
  onBack?: () => void;
  onApprove?: () => void;
  formData: AffiliationFormState;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  mode,
  onClose,
  onBack,
  onApprove,
  formData,
}) => {
   const isDraft = mode === 'draft';
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const isGenerating = !pdfUrl;
const t = useTranslations('pdfPreview');
  const tValidation = useTranslations('validation');

  useEffect(() => {
    let cancelled = false;
    setPdfUrl(null);

    if (isOpen) {
      void PdfGeneratorService.getPdfBlobUrl(formData, { mode })
        .then((url) => {
          if (!cancelled) setPdfUrl(url);
        })
        .catch((err) => {
          console.error('Error generando URL del PDF:', err);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [formData, isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getFileName = () => {
    const documentId = formData.policyholder.documentNumber || 'Doc';
    const date = new Date().toISOString().slice(0, 10);
    return isDraft
      ? `Borrador_Solicitud_Afiliacion_Previasis_${documentId}_${date}.pdf`
      : `Solicitud_Afiliacion_Previasis_Firmada_${documentId}_${date}.pdf`;
  };

  const handleDownload = () => {
    void PdfGeneratorService.downloadPdf(formData, getFileName(), { mode });
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  const handleShare = async () => {
    if (isDraft) return;

    setIsSharing(true);
    const fileName = getFileName();
    const shareText = t('shareText');

    try {
      const doc = await PdfGeneratorService.generateApplicationPdf(formData, { mode: 'final' });
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const canShareFile =
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] });

      if (canShareFile) {
        await navigator.share({
          title: shareText,
          text: shareText,
          files: [pdfFile],
        });
        return;
      }

      await PdfGeneratorService.downloadPdf(formData, fileName, { mode: 'final' });
      window.open(
        `https://wa.me/?text=${encodeURIComponent(t('whatsappText', { shareText }))}`,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Error compartiendo el PDF:', error);
      alert(tValidation('pdfShareError'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="pdf-preview-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '0.5rem',
      }}
    >
      <Card
        className="pdf-preview-dialog"
        style={{
          width: '96vw',
          maxWidth: 'none',
          height: '96vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >

        <div
          className="pdf-preview-header"
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div className="pdf-preview-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isDraft ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isDraft ? '#d97706' : 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {isDraft ? t('draftTitle') : t('finalTitle')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isDraft ? t('draftSubtitle') : t('finalSubtitle')}
              </p>
            </div>
            <span
              className="pill-badge"
              style={{
                fontSize: '0.6875rem',
                backgroundColor: isDraft ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isDraft ? '#d97706' : 'var(--status-success)',
                borderColor: isDraft ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
              }}
            >
              <FileText size={12} />
               {isDraft ? t('draftBadge') : t('finalBadge')}
            </span>
          </div>


          <div className="pdf-preview-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

            {!isDraft && (
              <Button
                className="pdf-preview-action"
                variant="secondary"
                size="sm"
                onClick={handleShare}
                isLoading={isSharing}
                disabled={isGenerating}
                leftIcon={<Share2 size={16} />}
              >
                {t('share')}
              </Button>
            )}

            {isDraft ? (
              <>

                {onBack && (
                  <Button
                    className="pdf-preview-action"
                    variant="secondary"
                    size="sm"
                    onClick={onBack}
                    disabled={isGenerating}
                  >
                    {t('backCorrect')}
                  </Button>
                )}
                {onApprove && (
                  <Button
                    className="pdf-preview-action pdf-preview-action-primary"
                    variant="primary"
                    size="sm"
                    onClick={onApprove}
                    disabled={isGenerating}
                  >
                    {t('approveContinue')}
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="pdf-preview-action pdf-preview-action-primary"
                variant="primary"
                size="sm"
                onClick={handleDownload}
                disabled={isGenerating}
                leftIcon={<Download size={16} />}
                >
                  {t('downloadSigned')}
                </Button>
            )}

            <button
              type="button"
              className="pdf-preview-close"
              onClick={isDraft && onBack ? onBack : onClose}
              aria-label={isDraft ? t('closeDraft') : t('closeFinal')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.375rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>


        <div className="pdf-preview-viewer" style={{ flex: 1, minHeight: 0, backgroundColor: '#334155', position: 'relative' }}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={t('pdfTitle')}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#ffffff',
              }}
            >
              {t('pdfLoading')}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PdfPreviewModal;
