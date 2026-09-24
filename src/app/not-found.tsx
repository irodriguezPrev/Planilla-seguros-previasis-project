'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/core/components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('notFound');
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
        {t('title')}
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('heading')}</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.875rem' }}>
        {t('message')}
      </p>
      <Link href="/">
        <Button variant="primary" leftIcon={<Home size={16} />}>
          {t('backHome')}
        </Button>
      </Link>
    </div>
  );
}
