'use client';

import React from 'react';
import Link from 'next/link';
import { PreviasisLogo } from '@/core/components/common/PreviasisLogo';
import {
  Server,
  Layers,
  Zap,
  ShieldCheck,
  Code,
  ArrowRight,
  Database,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { envConfig } from '@/core/config/env.config';

export default function InfoDiagnosticsPage() {
  const features = [
    {
      title: 'Cliente HTTP Estandarizado',
      description: 'Adaptado al formato de respuesta `{ message, data }` del backend con inyección automática de tokens JWT.',
      icon: Database,
      tag: 'API Layer',
    },
    {
      title: 'Tiempo Real con Socket.IO',
      description: 'Contexto y hook reactivo compatible con la autenticación vía handshake JWT implementada en Express.',
      icon: Radio,
      tag: 'Realtime',
    },
    {
      title: 'Gestión de Sesión & Autenticación',
      description: 'Estado global de autenticación con persistencia local y sincronización de ciclo de vida de usuario.',
      icon: ShieldCheck,
      tag: 'Seguridad',
    },
    {
      title: 'Arquitectura Modular Next.js',
      description: 'Estructura con App Router, subgrupos de rutas, diseño en componentes y tipado estricto.',
      icon: Layers,
      tag: 'TypeScript',
    },
  ];

  const backendModules = [
    { name: 'Usuarios & Asesores', route: '/api/users', status: 'Activo' },
    { name: 'Credenciales & Autenticación', route: '/api/credential', status: 'Sincronizado' },
    { name: 'Health Check / Estado del Servidor', route: '/api/health', status: 'Activo' },
    { name: 'Documentación Swagger', route: '/swagger/#', status: 'Online' },
    { name: 'Eventos Socket.IO', route: 'Realtime Broadcast', status: 'Listo' },
  ];

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <PreviasisLogo size={48} />
        <span className="pill-badge" style={{ marginTop: '0.5rem' }}>
          <Zap size={14} /> Panel Técnico y Diagnóstico del Sistema
        </span>

        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
          Servicios y Conectividad de Previasis
        </h1>

        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Métricas de integración de la plataforma con los servicios de backend y tiempo real.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <Link href="/">
            <button type="button" className="btn-pill btn-pill-primary">
              Ir a Solicitud de Afiliación <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/dashboard">
            <button type="button" className="btn-pill btn-pill-secondary">
              Panel Administrativo
            </button>
          </Link>
        </div>
      </div>

      {/* Grid de Características */}
      <div className="grid grid-cols-2 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--previasis-green-light)',
                    color: 'var(--previasis-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </div>
                <span className="pill-badge">{feat.tag}</span>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>{feat.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Checklist de Endpoints */}
      <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              Servicios de Backend Conectados
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Servidor objetivo configurado en <code style={{ fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--previasis-green)' }}>{envConfig.apiUrl}</code>
            </p>
          </div>
          <span className="pill-badge">Puerto: 3004 / 3000</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {backendModules.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} color="var(--previasis-green)" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{item.name}</span>
                <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.route}</code>
              </div>
              <span className="pill-badge">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
