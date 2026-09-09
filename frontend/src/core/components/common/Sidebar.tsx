'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Award,
  Activity,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  { label: 'Nueva Afiliación', href: '/', icon: FileCheck2 },
  { label: 'Panel de Control', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Asesores & Usuarios', href: '/dashboard/users', icon: Users },
  { label: 'Diagnóstico & API', href: '/info', icon: Activity },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '260px',
        borderRight: '1px solid var(--border-card)',
        backgroundColor: '#ffffff',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minHeight: 'calc(100vh - 70px)',
      }}
    >
      <div style={{ padding: '0 0.75rem 1rem 0.75rem', borderBottom: '1px solid var(--border-card)', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
          Módulos Comerciales
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-body)',
                backgroundColor: isActive ? 'var(--previasis-green)' : 'transparent',
                boxShadow: isActive ? '0 4px 12px var(--previasis-green-glow)' : 'none',
                transition: 'var(--transition)',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sudeaseg ID box in Sidebar bottom */}
      <div
        style={{
          marginTop: 'auto',
          padding: '1rem',
          backgroundColor: 'var(--previasis-green-light)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(0, 139, 71, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--previasis-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Supervisado Sudeaseg
        </span>
        <p style={{ fontSize: '0.75rem', color: 'var(--previasis-dark-green)', fontWeight: 600 }}>
          Providencia Nº SAA-09-1585
        </p>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          R.I.F. J-412048970 • MP-000015
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
