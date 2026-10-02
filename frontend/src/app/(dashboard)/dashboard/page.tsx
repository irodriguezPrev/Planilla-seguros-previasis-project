'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/core/hooks/useAuth';
import { useSocket } from '@/core/hooks/useSocket';
import { useTranslations } from 'next-intl';
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
  Copy,
  Link2,
  Share2,
} from 'lucide-react';
import { envConfig } from '@/core/config/env.config';
import { getMyReferral, MyReferralResponse } from '@/core/services/signing-request.service';
import { SigningRequestsPanel } from '@/features/dashboard/SigningRequestsPanel';

export default function DashboardOverviewPage() {
  const { user, isAuthenticated } = useAuth();
  const { isConnected, socketId, emit } = useSocket();
  const t = useTranslations('dashboard');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [referral, setReferral] = useState<MyReferralResponse | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setReferralLoading(true);
    setReferralError(null);
    void getMyReferral()
      .then(setReferral)
      .catch((error) => setReferralError(error instanceof Error ? error.message : t('referralError')))
      .finally(() => setReferralLoading(false));
  }, [isAuthenticated, t]);

  const handleShareReferral = async () => {
    if (!referral) return;
    const text = t('referralShareText', { name: referral.sellerName });
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: t('referralTitle'), text, url: referral.referralUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referral.referralUrl);
        alert(t('referralCopied'));
      } else {
        window.prompt(t('referralCopyPrompt'), referral.referralUrl);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      window.prompt(t('referralCopyPrompt'), referral.referralUrl);
    }
  };

  const handleCopyReferral = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.referralUrl);
      alert(t('referralCopied'));
    } catch {
      window.prompt(t('referralCopyPrompt'), referral.referralUrl);
    }
  };

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
            {t('title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            {t('welcome')} {user?.name ? <strong>{user.name}</strong> : t('welcomeDefault')}.
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
            {isAuthenticated ? t('activeSession') : t('viewMode')}
          </span>
          <span
            className="pill-badge"
            style={{
              backgroundColor: isConnected ? 'var(--previasis-green-light)' : 'rgba(100, 116, 139, 0.1)',
              color: isConnected ? 'var(--previasis-green)' : 'var(--text-muted)',
            }}
          >
            Socket: {isConnected ? t('socketOnline') : t('socketOffline')}
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
              {t('newAffiliationTitle')}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              {t('newAffiliationSubtitle')}
            </p>
          </div>
        </div>

        <Link href="/">
          <button type="button" className="btn-pill btn-pill-primary" style={{ backgroundColor: 'var(--previasis-green)' }}>
            {t('startRequest')} <ArrowRight size={16} />
          </button>
        </Link>
      </div>

      <div className="previasis-card seller-referral-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '50%', backgroundColor: 'var(--previasis-green-light)', color: 'var(--previasis-green)' }}>
            <Link2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              {t('referralTitle')}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {t('referralSubtitle')}
            </p>
          </div>
        </div>

        {referralLoading && <p style={{ color: 'var(--text-muted)' }}>{t('referralLoading')}</p>}

        {!referralLoading && referral && (
          <>
            <div className="seller-referral-url">
              <input
                className="previasis-input"
                value={referral.referralUrl}
                readOnly
                aria-label={t('referralTitle')}
              />
              <button type="button" className="btn-pill btn-pill-secondary" onClick={handleCopyReferral}>
                <Copy size={15} /> {t('copyReferral')}
              </button>
              <button type="button" className="btn-pill btn-pill-primary" onClick={handleShareReferral}>
                <Share2 size={15} /> {t('shareReferral')}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('referralAdvisor', {
                name: referral.sellerName,
                credential: referral.credentialNumber,
              })}
            </p>
          </>
        )}

        {!referralLoading && referralError && (
          <div className="client-signing-error" role="status">
            {referralError}
          </div>
        )}
      </div>

      <SigningRequestsPanel enabled={isAuthenticated} />

      {/* Metrics & Status Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="previasis-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('apiBackend')}
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
                {t('socketIdLabel')}
              </p>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', fontFamily: 'monospace', color: 'var(--previasis-dark-green)' }}>
                {socketId || t('notConnected')}
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
                {t('roleLabel')}
              </p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--previasis-dark-green)' }}>
                {user?.role || t('defaultRole')}
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
            {t('serviceCheck')}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('serviceCheckDesc')}
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
                {t('responseFrom', { endpoint: testResult.endpoint })}
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
