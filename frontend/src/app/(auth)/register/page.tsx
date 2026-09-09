'use client';

import React from 'react';
import Link from 'next/link';
import { PreviasisLogo } from '@/core/components/common/PreviasisLogo';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 140px)',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        className="previasis-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.5rem',
          boxShadow: '0 20px 45px rgba(7, 62, 35, 0.08)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-card)',
        }}
      >
        <PreviasisLogo size={46} showText={true} />

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--status-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '0.5rem',
          }}
        >
          <Lock size={26} />
        </div>

        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
            Registro Público Deshabilitado
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Por políticas de seguridad y cumplimiento de la <strong>Superintendencia de la Actividad Aseguradora (Sudeaseg)</strong>, las cuentas de asesores comerciales solo pueden ser dadas de alta por los <strong>Administradores</strong> desde el Panel de Control.
          </p>
        </div>

        <Link href="/login" style={{ width: '100%' }}>
          <button
            type="button"
            className="btn-pill btn-pill-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Volver a Iniciar Sesión
          </button>
        </Link>
      </div>
    </div>
  );
}
