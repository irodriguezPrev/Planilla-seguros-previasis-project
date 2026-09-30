'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/core/services/user.service';
import { UserInterface } from '@/core/interfaces/user.interfaces';
import { formatDate } from '@/core/utils/format.utils';
import {
  Users,
  UserPlus,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Key,
  UserCheck,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'asesor',
    status: true,
    password: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await UserService.getAll();
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios desde el backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await UserService.create(formData);
      setShowModal(false);
      setFormData({ name: '', role: 'asesor', status: true, password: '' });
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (id?: number) => {
    if (!id) return;
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    try {
      await UserService.softDelete(id);
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar usuario');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
            Gestión de Asesores y Usuarios
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Panel de administración exclusivo para dar de alta y gestionar accesos al sistema
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-pill btn-pill-secondary"
            onClick={loadUsers}
          >
            <RefreshCw size={14} /> Refrescar
          </button>
          <button
            type="button"
            className="btn-pill btn-pill-primary"
            onClick={() => setShowModal(true)}
          >
            <UserPlus size={14} /> Crear Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--status-error)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="previasis-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cargando lista de usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>
              No hay usuarios registrados
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Cree un nuevo usuario desde el botón superior para habilitar el acceso.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)', backgroundColor: '#f8fafc', color: 'var(--previasis-dark-green)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>ID</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Nombre del Asesor</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Rol</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Fecha de Alta</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.user_id || i}
                  style={{
                    borderBottom: '1px solid var(--border-card)',
                    transition: 'var(--transition)',
                  }}
                >
                  <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'monospace', fontWeight: 600 }}>{u.user_id || '-'}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>{u.name}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span
                      className="pill-badge"
                      style={{
                        backgroundColor: u.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'var(--previasis-green-light)',
                        color: u.role === 'admin' ? 'var(--status-warning)' : 'var(--previasis-green)',
                      }}
                    >
                      {u.role === 'admin' ? 'Administrador' : u.role === 'supervisor' ? 'Supervisor' : 'Asesor Comercial'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span
                      className="pill-badge"
                      style={{
                        backgroundColor: u.status ? 'var(--previasis-green-light)' : 'rgba(239, 68, 68, 0.1)',
                        color: u.status ? 'var(--previasis-green)' : 'var(--status-error)',
                      }}
                    >
                      {u.status ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.user_id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--status-error)',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                      }}
                      title="Desactivar usuario"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Creación de Usuario */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="previasis-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={22} color="var(--previasis-green)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Crear Nuevo Usuario / Asesor
              </h3>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="previasis-input-group">
                <label className="previasis-label">
                  Nombre Completo / Usuario <span className="previasis-label-required">*</span>
                </label>
                <input
                  type="text"
                  className="previasis-input"
                  placeholder="Ej: Carlos Mendoza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="previasis-input-group">
                <label className="previasis-label">
                  Rol del Usuario <span className="previasis-label-required">*</span>
                </label>
                <select
                  className="previasis-input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="asesor">Asesor Comercial (Emisión y Afiliaciones)</option>
                  <option value="supervisor">Supervisor de Ventas</option>
                  <option value="auditor">Auditor Médico / Sudeaseg</option>
                  <option value="admin">Administrador del Sistema</option>
                </select>
              </div>

              <div className="previasis-input-group">
                <label className="previasis-label">
                  Contraseña de Acceso <span className="previasis-label-required">*</span>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-pill btn-pill-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-pill btn-pill-primary"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
