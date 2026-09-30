'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PreviasisLogo } from '@/core/components/common/PreviasisLogo';
import { useAuth } from '@/core/hooks/useAuth';
import { LogIn, Key, User, AlertCircle, ShieldCheck, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          boxShadow: '0 20px 45px rgba(7, 62, 35, 0.08)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-card)',
        }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <PreviasisLogo size={46} showText={true} />

          <div style={{ marginTop: '0.5rem' }}>
            <span className="pill-badge">
              <ShieldCheck size={13} /> Portal de Asesores & Afiliaciones
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--previasis-dark-green)', marginTop: '0.5rem' }}>
              Iniciar Sesión
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Ingrese con sus credenciales de usuario autorizado
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--status-error)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="previasis-input-group">
            <label className="previasis-label">
              <User size={15} color="var(--previasis-green)" />
              Usuario / Nombre <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Nombre de usuario o CI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              <Lock size={15} color="var(--previasis-green)" />
              Contraseña <span className="previasis-label-required">*</span>
            </label>
            <input
              type="password"
              className="previasis-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-pill btn-pill-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.9375rem',
              marginTop: '0.5rem',
            }}
          >
            <LogIn size={18} />
            {loading ? 'Validando...' : 'Entrar al Sistema'}
          </button>
        </form>

        {/* Footer info institucional */}
        <div style={{ textAlign: 'center', fontSize: '0.78125rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-card)', paddingTop: '1.25rem', lineHeight: 1.5 }}>
          Acceso restringido para asesores y personal autorizado. Las cuentas son creadas y gestionadas por los <strong>Administradores del Sistema</strong>.
        </div>
      </div>
    </div>
  );
}
