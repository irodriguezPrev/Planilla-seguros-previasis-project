'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/core/hooks/useAuth';
import { PreviasisLogo } from './PreviasisLogo';
import { StatusIndicator } from './StatusIndicator';
import { LogOut, User as UserIcon, LayoutDashboard, FileCheck2, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getLinkClass = (path: string) => {
    const isActive = path === '/' ? pathname === '/' : pathname?.startsWith(path);
    return `navbar-nav-link ${isActive ? 'navbar-nav-link--active' : ''}`;
  };
  return (
    <>
      <style>{`
        .navbar-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-card);
          box-shadow: var(--shadow-subtle);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          padding: 0 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .navbar-nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-full);
          transition: var(--transition);
          text-decoration: none;
          white-space: nowrap;
        }
        .navbar-nav-link--active {
          font-weight: 700;
          color: var(--previasis-green);
          background-color: var(--previasis-green-light);
        }
        .navbar-nav-link:not(.navbar-nav-link--active) {
          color: var(--text-body);
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .navbar-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-card);
          background: transparent;
          cursor: pointer;
          color: var(--text-body);
        }
        .navbar-status-desktop {
          display: flex;
        }
        .navbar-auth-desktop {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Mobile drawer */
        .navbar-mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 99;
        }
        .navbar-mobile-overlay.open {
          display: block;
        }
        .navbar-mobile-drawer {
          position: fixed;
          top: 0;
          right: -100%;
          width: 280px;
          max-width: 85vw;
          height: 100vh;
          background: #ffffff;
          z-index: 100;
          transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: -8px 0 30px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .navbar-mobile-drawer.open {
          right: 0;
        }
        .navbar-mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-card);
        }
        .navbar-mobile-drawer-close {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-card);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-body);
        }
        .navbar-mobile-drawer-body {
          display: flex;
          flex-direction: column;
          padding: 1rem;
          gap: 0.5rem;
          flex: 1;
        }
        .navbar-mobile-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition);
        }
        .navbar-mobile-link--active {
          color: var(--previasis-green);
          background-color: var(--previasis-green-light);
        }
        .navbar-mobile-link:not(.navbar-mobile-link--active) {
          color: var(--text-body);
        }
        .navbar-mobile-status {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-card);
        }
        .navbar-mobile-auth {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-card);
        }

        @media (max-width: 768px) {
          .navbar-inner {
            height: 56px;
            padding: 0 1rem;
          }
          .navbar-nav {
            display: none;
          }
          .navbar-status-desktop {
            display: none;
          }
          .navbar-auth-desktop {
            display: none;
          }
          .navbar-hamburger {
            display: flex;
          }
        }
      `}</style>

        <header className="navbar-header">
          <div className="navbar-inner">
            {/* Brand Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <PreviasisLogo size={32} textColor="var(--previasis-dark-green)" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="navbar-nav">
              <Link
                href="/"
                className={`navbar-nav-link`}
              >
                <FileCheck2 size={16} />
                <span>Afiliación</span>
              </Link>

            
            
            </nav>

            {/* Desktop Right Actions */}
            <div className="navbar-right">
              <div className="navbar-status-desktop">
                <StatusIndicator />
              </div>

              <div className="navbar-auth-desktop">
                {isAuthenticated ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.85rem',
                        backgroundColor: 'var(--previasis-green-light)',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(0, 139, 71, 0.2)',
                      }}
                    >
                      <UserIcon size={15} color="var(--previasis-green)" />
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--previasis-dark-green)' }}>
                        {user?.name || 'Asesor'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={logout}
                      className="btn-pill btn-pill-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                      title="Cerrar sesión"
                    >
                      <LogOut size={14} /> Salir
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <button
                      type="button"
                      className="btn-pill btn-pill-primary"
                      style={{ padding: '0.45rem 1.35rem', fontSize: '0.8125rem' }}
                    >
                      Ingresar
                    </button>
                  </Link>
                )}
              </div>

              {/* Mobile Hamburger */}
              <button
                type="button"
                className="navbar-hamburger"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
      </header>
      {/* Mobile Overlay */}
      <div
        className={`navbar-mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
            <div className={`navbar-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="navbar-mobile-drawer-header">
          <PreviasisLogo size={28} textColor="var(--previasis-dark-green)" />
          <button
            type="button"
            className="navbar-mobile-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <div className="navbar-mobile-drawer-body">
          <Link
            href="/"
            className={`navbar-mobile-link`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileCheck2 size={20} />
            Afiliación
          </Link>

          <Link
            href="/dashboard"
            className={`navbar-mobile-link`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
        </div>

        {/* Mobile Status */}
        <div className="navbar-mobile-status">
          <StatusIndicator />
        </div>

        {/* Mobile Auth */}
        <div className="navbar-mobile-auth">
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.85rem',
                  backgroundColor: 'var(--previasis-green-light)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0, 139, 71, 0.2)',
                }}
              >
                <UserIcon size={16} color="var(--previasis-green)" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--previasis-dark-green)' }}>
                  {user?.name || 'Asesor'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="btn-pill btn-pill-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <button
                type="button"
                className="btn-pill btn-pill-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem' }}
              >
                Ingresar
              </button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;

