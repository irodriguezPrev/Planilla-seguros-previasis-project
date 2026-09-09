import Link from 'next/link';
import { Button } from '@/core/components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
        gap: '1.25rem',
      }}
    >
      <h1
        style={{
          fontSize: '5rem',
          fontWeight: 800,
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Página no encontrada</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.875rem' }}>
        La ruta a la que intentas acceder no existe en la estructura actual del frontend.
      </p>
      <Link href="/">
        <Button variant="primary" leftIcon={<Home size={16} />}>
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
}
