'use client';

import React, { useEffect, useState } from 'react';
import { useSocketContext } from '@/features/context/SocketContext';
import { envConfig } from '@/core/config/env.config';
import { Activity, Radio } from 'lucide-react';

export const StatusIndicator: React.FC = () => {
  const { isConnected } = useSocketContext();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${envConfig.apiUrl}/health`, { method: 'GET' }).catch(() => null);
        if (res && res.status < 500) {
          setBackendOnline(true);
        } else {
          const resRoot = await fetch(envConfig.backendUrl, { method: 'GET' }).catch(() => null);
          setBackendOnline(!!resRoot);
        }
      } catch {
        setBackendOnline(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      {/* Backend API Status */}
      <span
        className="pill-badge"
        style={{
          backgroundColor: backendOnline ? 'rgba(0, 139, 71, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: backendOnline ? 'var(--previasis-green)' : 'var(--status-error)',
          borderColor: backendOnline ? 'rgba(0, 139, 71, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          fontSize: '0.6875rem',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: backendOnline ? 'var(--previasis-green)' : 'var(--status-error)',
            display: 'inline-block',
          }}
        />
        API: {backendOnline ? 'Online' : backendOnline === false ? 'Offline' : '...'}
      </span>

      {/* Socket.IO Status */}
      <span
        className="pill-badge"
        style={{
          backgroundColor: isConnected ? 'rgba(0, 139, 71, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          color: isConnected ? 'var(--previasis-green)' : 'var(--text-muted)',
          borderColor: isConnected ? 'rgba(0, 139, 71, 0.2)' : 'rgba(100, 116, 139, 0.2)',
          fontSize: '0.6875rem',
        }}
      >
        <Radio size={11} />
        {isConnected ? 'Socket Activo' : 'Socket'}
      </span>
    </div>
  );
};

export default StatusIndicator;
