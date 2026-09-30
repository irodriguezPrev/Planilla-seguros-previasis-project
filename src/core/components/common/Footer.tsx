'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PreviasisLogo } from './PreviasisLogo';
import { MapPin } from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const tSidebar = useTranslations('sidebar');

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-card)',
        backgroundColor: '#ffffff',
        padding: '2.5rem 0',
        marginTop: 'auto',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <PreviasisLogo size={32} />
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
            <MapPin size={14} color="var(--previasis-green)" />
            {t('headOffice')} {t('address')}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            R.I.F. J-412048970 • Sudeaseg MP-000015 • Providencia Administrativa Nº SAA-09-1585
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-body)', fontWeight: 600 }}>
          <Link href="/" style={{ color: 'var(--previasis-green)' }}>
            {t('affiliationLink')}
          </Link>
          <Link href="/dashboard">{tSidebar('dashboard')}</Link>
          <a
            href="http://localhost:3004/swagger/#"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('apiDocs')}
        </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
