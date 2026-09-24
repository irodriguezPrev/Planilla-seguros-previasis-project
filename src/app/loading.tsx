import { Spinner } from '@/core/components/ui/Spinner';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: '1rem',
      }}
    >
      <Spinner size="lg" color="var(--accent-primary)" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargando contenido...</p>
    </div>
  );
}
