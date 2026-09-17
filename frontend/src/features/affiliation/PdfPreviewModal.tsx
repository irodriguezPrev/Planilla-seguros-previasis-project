'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/Button';
import { Card } from '@/core/components/ui/Card';
import { SolicitudAfiliacionFormState } from '@/core/interfaces/affiliation.interfaces';
import { PdfGeneratorService } from '@/core/services/pdf-generator.service';
import { Download, Printer, X, FileText, CheckCircle } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SolicitudAfiliacionFormState;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  formData,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  //Obtiene la info del pdf, y el pdf ya esta llenado
  useEffect(() => {
    let cancelled = false;

    if (isOpen) {
      void PdfGeneratorService.getPdfBlobUrl(formData)
        .then((url) => {
          if (!cancelled) setPdfUrl(url);
        })
        .catch((err) => {
          console.error('Error generando URL del PDF:', err);
        });
    } else {
      setPdfUrl(null);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const handleDownload = () => {
    void PdfGeneratorService.downloadPdf(formData);
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                Vista Previa de Solicitud de Afiliación
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Providencia Nº SAA-09-1585 • PREVIASIS Medicina Prepagada S.A.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer size={16} />}>
              Imprimir
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download size={16} />}>
              Descargar PDF Oficial
            </Button>
            <button
              onClick={onClose}
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

        {/* PDF Viewer Frame */}
        <div style={{ flex: 1, backgroundColor: '#334155', position: 'relative' }}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Vista Previa de Solicitud de Afiliación"
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
              Cargando documento PDF...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PdfPreviewModal;
