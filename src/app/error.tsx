'use client';

import { useEffect } from 'react';
import { Button } from '@/core/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Error Boundary:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        padding: '2rem',
        gap: '1.25rem',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--status-error-bg)',
          color: 'var(--status-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Ocurrió un error inesperado</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.875rem' }}>
        {error.message || 'No se pudo cargar la vista solicitada.'}
      </p>
      <Button variant="primary" onClick={() => reset()} leftIcon={<RefreshCw size={16} />}>
        Reintentar
      </Button>
    </div>
  );
}
