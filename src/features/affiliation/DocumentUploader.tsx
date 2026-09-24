'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, FileText, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export interface UploadedFileItem {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
  previewUrl: string;
  docCategory: 'Cédula de Identidad' | 'R.I.F. Digital' | 'Informe / Soporte Médico' | 'Otro';
}

interface DocumentUploaderProps {
  documents: UploadedFileItem[];
  onAddDocument: (doc: UploadedFileItem) => void;
  onRemoveDocument: (id: string) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onAddDocument,
  onRemoveDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<UploadedFileItem['docCategory']>('Cédula de Identidad');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const sizeMb = file.size / (1024 * 1024);

    if (sizeMb > 5) {
      setErrorMsg('El archivo seleccionado supera el límite de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newDoc: UploadedFileItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        sizeMb: parseFloat(sizeMb.toFixed(2)),
        previewUrl: reader.result as string,
        docCategory: selectedCategory,
      };
      onAddDocument(newDoc);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Category selector & Action Button */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--previasis-green-light)',
            color: 'var(--previasis-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Camera size={24} />
        </div>

        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>
            Carga de Documentos y Soportes (Foto o PDF)
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Adjunte C.I., RIF o informes médicos para validación inmediata (Máx. 5MB)
          </p>
        </div>

        {/* Tipo de Documento */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['Cédula de Identidad', 'R.I.F. Digital', 'Informe / Soporte Médico', 'Otro'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`pill-switch-btn ${selectedCategory === cat ? 'active' : ''}`}
              style={{
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--previasis-green)' : 'var(--border-card)',
                backgroundColor: selectedCategory === cat ? 'var(--previasis-green)' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-body)',
                padding: '0.4rem 0.875rem',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="document-file-input"
        />

        {/* Green Pill Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-pill btn-pill-primary"
          style={{ padding: '0.75rem 1.75rem', fontSize: '0.9375rem' }}
        >
          <Camera size={18} /> Tomar Foto o Subir PDF ({selectedCategory})
        </button>

        {errorMsg && (
          <p style={{ color: 'var(--status-error)', fontSize: '0.8125rem', fontWeight: 600 }}>
            {errorMsg}
          </p>
        )}
      </div>

      {/* Uploaded Documents Grid / Thumbnails */}
      {documents.length > 0 && (
        <div>
          <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--previasis-dark-green)', marginBottom: '0.75rem' }}>
            Documentos Adjuntos ({documents.length})
          </h5>

          <div className="grid grid-cols-3 gap-4">
            {documents.map((doc) => {
              const isImage = doc.type.startsWith('image/');

              return (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    boxShadow: 'var(--shadow-subtle)',
                    position: 'relative',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      height: '100px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isImage ? (
                      <img
                        src={doc.previewUrl}
                        alt={doc.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileText size={36} color="var(--previasis-green)" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <span className="pill-badge" style={{ fontSize: '0.6875rem', marginBottom: '0.25rem' }}>
                      {doc.docCategory}
                    </span>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.name}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {doc.sizeMb} MB
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onRemoveDocument(doc.id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                    title="Eliminar y volver a tomar foto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
