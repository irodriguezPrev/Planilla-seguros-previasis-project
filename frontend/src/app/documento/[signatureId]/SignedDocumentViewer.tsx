'use client';

import { useEffect, useState } from 'react';
import { envConfig } from '@/core/config/env.config';
import { deserializeAffiliationDraft } from '@/core/utils/affiliation-draft.mapper';
import { PdfGeneratorService } from '@/core/services/pdf-generator.service';

export function SignedDocumentViewer({ signatureId }: { signatureId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let blobUrl: string | null = null;
    setUrl(null);
    setError('');
    async function load() {
      try {
        const response = await fetch(
          envConfig.backendUrl.replace(/\/$/, '') + '/api/signing-requests/documents/' + encodeURIComponent(signatureId),
          { signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' },
        );
        if (!response.ok) throw new Error(response.status === 404
          ? 'El documento no está disponible o el enlace no es válido.'
          : 'No pudimos cargar el documento. Intente nuevamente.');
        const body = await response.json();
        blobUrl = await PdfGeneratorService.getPdfBlobUrl(deserializeAffiliationDraft(body.formData), { mode: 'final' });
        if (controller.signal.aborted) URL.revokeObjectURL(blobUrl);
        else setUrl(blobUrl);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No pudimos cargar el documento.');
      }
    }
    void load();
    return () => {
      controller.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [signatureId]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
      <h1>Documento firmado</h1>
      <p>PREVIASIS · Consulta de solo lectura</p>
      {error ? <p role="alert">{error}</p> : !url ? <p role="status">Preparando documento…</p> : (
        <>
          <a className="btn-pill btn-pill-primary" href={url} download="Solicitud_Previasis_Firmada.pdf">Descargar PDF</a>
          <iframe title="Documento firmado" src={url} style={{ width: '100%', height: '80vh', border: 0, marginTop: '1rem' }} />
        </>
      )}
    </main>
  );
}
