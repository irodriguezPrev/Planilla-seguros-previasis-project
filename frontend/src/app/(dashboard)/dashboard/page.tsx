'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/core/hooks/useAuth';
import { useSocket } from '@/core/hooks/useSocket';
import { apiClient } from '@/core/services/api.client';
import {
  Users,
  Activity,
  Radio,
  Server,
  Zap,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  Award,
  ArrowRight,
} from 'lucide-react';
import { envConfig } from '@/core/config/env.config';

export default function DashboardOverviewPage() {
  const { user, isAuthenticated } = useAuth();
  const { isConnected, socketId, emit } = useSocket();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleTestEndpoint = async (endpoint: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.get(endpoint);
      setTestResult({
        success: true,
        endpoint,
        data: res,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        endpoint,
        data: err,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
            Panel de Control Comercial
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Bienvenido {user?.name ? <strong>{user.name}</strong> : 'al sistema de gestión de Previasis Medicina Prepagada'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span
            className="pill-badge"
            style={{
              backgroundColor: isAuthenticated ? 'var(--previasis-green-light)' : 'rgba(245, 158, 11, 0.1)',
              color: isAuthenticated ? 'var(--previasis-green)' : 'var(--status-warning)',
            }}
          >
            {isAuthenticated ? 'Sesión de Asesor Activa' : 'Modo Consulta'}
          </span>
          <span
            className="pill-badge"
            style={{
              backgroundColor: isConnected ? 'var(--previasis-green-light)' : 'rgba(100, 116, 139, 0.1)',
              color: isConnected ? 'var(--previasis-green)' : 'var(--text-muted)',
            }}
          >
            Socket: {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Quick Action Card to New Affiliation */}
      <div
        className="previasis-card"
        style={{
          background: 'var(--grad-hero)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileCheck2 size={24} color="#84CC16" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Nueva Solicitud de Afiliación Digital
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Emisión de contratos y generación de planilla autorizada por Sudeaseg
            </p>
          </div>
        </div>

        <Link href="/">
          <button type="button" className="btn-pill btn-pill-primary" style={{ backgroundColor: 'var(--previasis-green)' }}>
            Iniciar Solicitud <ArrowRight size={16} />
          </button>
        </Link>
      </div>

      {/* Metrics & Status Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="previasis-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                API BACKEND PREVIASIS
              </p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--previasis-dark-green)' }}>
                {envConfig.apiUrl}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--previasis-green-light)', color: 'var(--previasis-green)' }}>
              <Server size={20} />
            </div>
          </div>
        </div>

        <div className="previasis-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                SOCKET ID CONECTADO
              </p>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', fontFamily: 'monospace', color: 'var(--previasis-dark-green)' }}>
                {socketId || 'No conectado'}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--previasis-green-light)', color: 'var(--previasis-green)' }}>
              <Radio size={20} />
            </div>
          </div>
        </div>

        <div className="previasis-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ROL DE USUARIO
              </p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--previasis-dark-green)' }}>
                {user?.role || 'Asesor Comercial'}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'var(--previasis-green-light)', color: 'var(--previasis-green)' }}>
              <Users size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive API Tester */}
      <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>
            Verificación de Servicios y Endpoints
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Ejecuta llamadas reales a los endpoints del servidor para verificar respuestas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-pill btn-pill-secondary"
            onClick={() => handleTestEndpoint('/users')}
            disabled={testing}
          >
            GET /api/users
          </button>

          <button
            type="button"
            className="btn-pill btn-pill-secondary"
            onClick={() => handleTestEndpoint('/health')}
            disabled={testing}
          >
            GET /api/health
          </button>
        </div>

        {testResult && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {testResult.success ? (
                <CheckCircle size={16} color="var(--previasis-green)" />
              ) : (
                <AlertCircle size={16} color="var(--status-error)" />
              )}
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Respuesta de: {testResult.endpoint}
              </span>
            </div>
            <pre
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                backgroundColor: '#ffffff',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                border: '1px solid var(--border-card)',
                color: testResult.success ? '#073E23' : '#ef4444',
              }}
            >
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
