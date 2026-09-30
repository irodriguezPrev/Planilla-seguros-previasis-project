import React from 'react';
import { Sidebar } from '@/core/components/common/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          padding: '2rem',
          backgroundColor: 'var(--bg-primary)',
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
