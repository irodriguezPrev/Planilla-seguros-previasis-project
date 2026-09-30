'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/actions';
import { locales } from '@/i18n/locales';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const locale = useLocale();
  const t = useTranslations('languageSwitcher');

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    void setUserLocale(newLocale);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <Globe size={14} color="var(--text-muted)" />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {t('label')}:
      </span>
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleLocaleChange(loc)}
          aria-label={loc === locale ? `${t('label')} ${loc} (${t('current')})` : `${t('label')} ${loc}`}
          aria-pressed={loc === locale}
          style={{
            fontSize: '0.7rem',
            fontWeight: loc === locale ? 700 : 500,
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: loc === locale ? 'var(--previasis-green)' : 'var(--border-card)',
            backgroundColor: loc === locale ? 'var(--previasis-green-light)' : 'transparent',
            color: loc === locale ? 'var(--previasis-green)' : 'var(--text-body)',
            cursor: 'pointer',
            transition: 'var(--transition)',
            minWidth: '36px',
          }}
        >
          {t(loc as 'es' | 'en')}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
