'use client';

import React from 'react';
import {
  DeclaracionSaludSection,
  AfeccionMedicaDetalle,
  AfiliadoRow,
  DetalleDeportivo,
} from '@/core/interfaces/affiliation.interfaces';
import { HEALTH_QUESTIONS } from '@/core/config/health-questions.config';
import { HeartPulse, PlusCircle, Trash2 } from 'lucide-react';

interface Step4Props {
  salud: DeclaracionSaludSection;
  afiliados: AfiliadoRow[];
  onChangeSalud: (salud: DeclaracionSaludSection) => void;
}

export const Step4DeclaracionSalud: React.FC<Step4Props> = ({
  salud,
  afiliados,
  onChangeSalud,
}) => {
  const setRespuestaPregunta = (id: number, respuesta: 'SÍ' | 'NO') => {
    const current = salud.preguntas[id] || { respuesta: 'NO' };
    const updatedPreguntas = {
      ...salud.preguntas,
      [id]: {
        ...current,
        respuesta,
        codigosAfiliados: respuesta === 'NO' ? [] : current.codigosAfiliados || [],
      },
    };

    let updatedAfecciones = [...salud.afeccionesDetalles];
    if (respuesta === 'SÍ' && updatedAfecciones.length === 0) {
      updatedAfecciones.push({
        id: Math.random().toString(36).substring(2, 9),
        codigoAfiliado: 1,
        padecimiento: HEALTH_QUESTIONS.find((q) => q.id === id)?.title || '',
        fechaDiagnostico: '',
        tratamientoPracticado: '',
        fechaUltimoChequeo: '',
        institucionHospitalaria: '',
      });
    }

    onChangeSalud({
      ...salud,
      preguntas: updatedPreguntas,
      detallesDeportivos: id === 17 && respuesta === 'NO' ? [] : salud.detallesDeportivos,
      afeccionesDetalles: updatedAfecciones,
    });
  };

  const setBeneficiariosPregunta = (id: number, event: React.ChangeEvent<HTMLSelectElement>) => {
    const codigosAfiliados = Array.from(event.target.selectedOptions, (option) => Number(option.value));
    const current = salud.preguntas[id] || { respuesta: 'SÍ' as const };
    const detallesDeportivos = id === 17
      ? codigosAfiliados.map((codigo) => (
        salud.detallesDeportivos?.find((detalle) => detalle.codigoAfiliado === codigo) || {
          codigoAfiliado: codigo,
          deporte: '',
          frecuencia: '',
          nivel: '' as const,
        }
      ))
      : salud.detallesDeportivos;

    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [id]: { ...current, codigosAfiliados },
      },
      detallesDeportivos,
    });
  };

  const updateDetalleDeportivo = (codigoAfiliado: number, fields: Partial<DetalleDeportivo>) => {
    const detallesDeportivos = (salud.detallesDeportivos || []).map((detalle) =>
      detalle.codigoAfiliado === codigoAfiliado ? { ...detalle, ...fields } : detalle,
    );
    onChangeSalud({ ...salud, detallesDeportivos });
  };

  const setDetallesExtra = (id: number, extra: string) => {
    const current = salud.preguntas[id] || { respuesta: 'NO' };
    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [id]: { ...current, detallesExtra: extra },
      },
    });
  };

  const addAfeccionDetalle = () => {
    const nueva: AfeccionMedicaDetalle = {
      id: Math.random().toString(36).substring(2, 9),
      codigoAfiliado: 1,
      padecimiento: '',
      fechaDiagnostico: '',
      tratamientoPracticado: '',
      fechaUltimoChequeo: '',
      institucionHospitalaria: '',
    };
    onChangeSalud({
      ...salud,
      afeccionesDetalles: [...salud.afeccionesDetalles, nueva],
    });
  };

  const updateAfeccionDetalle = (index: number, fields: Partial<AfeccionMedicaDetalle>) => {
    const updated = [...salud.afeccionesDetalles];
    updated[index] = { ...updated[index], ...fields };
    onChangeSalud({ ...salud, afeccionesDetalles: updated });
  };

  const removeAfeccionDetalle = (index: number) => {
    const filtered = salud.afeccionesDetalles.filter((_, i) => i !== index);
    onChangeSalud({ ...salud, afeccionesDetalles: filtered });
  };

  const hasAnyYes = Object.values(salud.preguntas).some((p) => p.respuesta === 'SÍ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="previasis-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--previasis-green-light)',
                color: 'var(--previasis-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HeartPulse size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Declaración de Salud
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Cuestionario oficial Sudeaseg de 24 preguntas médicas
              </p>
            </div>
          </div>

          <span
            className="pill-badge"
            style={{
              backgroundColor: hasAnyYes ? 'rgba(245, 158, 11, 0.15)' : 'var(--previasis-green-light)',
              color: hasAnyYes ? 'var(--status-warning)' : 'var(--previasis-green)',
              borderColor: hasAnyYes ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 139, 71, 0.2)',
            }}
          >
            {hasAnyYes ? 'Condiciones Declaradas (SÍ)' : 'Sin Afecciones Declaradas (NO)'}
          </span>
        </div>

        {/* 24 Preguntas Médicas con botones táctiles grandes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {HEALTH_QUESTIONS.map((q) => {
            const currentResp = salud.preguntas[q.id]?.respuesta || 'NO';
            const extraVal = salud.preguntas[q.id]?.detallesExtra || '';
            const codigosAfiliados = salud.preguntas[q.id]?.codigosAfiliados || [];
            const isYes = currentResp === 'SÍ';

            return (
              <div
                key={q.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isYes ? 'rgba(0, 139, 71, 0.05)' : '#ffffff',
                  border: '1px solid',
                  borderColor: isYes ? 'var(--previasis-green)' : 'var(--border-card)',
                  boxShadow: isYes ? '0 4px 12px var(--previasis-green-glow)' : 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'var(--transition)',
                }}
              >
                <div className="health-question-header">
                  <div className="health-question-copy">
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: isYes ? 'var(--previasis-green)' : '#f1f5f9',
                        color: isYes ? '#ffffff' : 'var(--previasis-dark-green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: '0.1rem',
                      }}
                    >
                      {q.id}
                    </span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--previasis-dark-green)' }}>
                        {q.title}
                      </p>
                      <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                        {q.description}
                      </p>
                    </div>
                  </div>

                  {/* Botones Grandes Táctiles SÍ / NO */}
                  <div className="health-question-actions">
                    {isYes && (
                      <div className="health-beneficiary-picker">
                        <select
                          className="previasis-input"
                          multiple
                          aria-label={`Agregar beneficiario a ${q.title}`}
                          value={codigosAfiliados.map(String)}
                          onChange={(e) => setBeneficiariosPregunta(q.id, e)}
                          style={{ minHeight: '76px', padding: '0.35rem 0.5rem' }}
                        >
                          {afiliados.map((afiliado) => (
                            <option key={afiliado.id} value={afiliado.codigoAfiliado}>
                              #{afiliado.codigoAfiliado} {afiliado.nombreCompleto || `Persona ${afiliado.codigoAfiliado}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="pill-switch health-answer-switch">
                    <button
                      type="button"
                      onClick={() => setRespuestaPregunta(q.id, 'NO')}
                      className={`pill-switch-btn ${!isYes ? 'active' : ''}`}
                      style={{
                        backgroundColor: !isYes ? '#E5E7EB' : 'transparent',
                        color: !isYes ? '#1F2937' : 'var(--text-muted)',
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.8125rem',
                      }}
                    >
                      NO
                    </button>
                    <button
                      type="button"
                      onClick={() => setRespuestaPregunta(q.id, 'SÍ')}
                      className={`pill-switch-btn ${isYes ? 'active' : ''}`}
                      style={{
                        backgroundColor: isYes ? 'var(--previasis-green)' : 'transparent',
                        color: isYes ? '#ffffff' : 'var(--text-muted)',
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.8125rem',
                      }}
                    >
                      SÍ
                    </button>
                    </div>
                  </div>

                  {isYes && codigosAfiliados.length > 0 && (
                    <div className="health-selected-beneficiaries">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Beneficiarios:</span>
                      {codigosAfiliados.map((codigo) => (
                        <span key={codigo} className="pill-badge" style={{ fontSize: '0.6875rem' }}>
                          #{codigo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input extra si aplica */}
                {isYes && q.id === 17 && codigosAfiliados.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      marginLeft: '2.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>
                      Detalle deportivo por beneficiario
                    </p>
                    {salud.detallesDeportivos?.map((detalle) => (
                      <div
                        className="health-sport-detail-grid"
                        key={detalle.codigoAfiliado}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(110px, 0.7fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(140px, 0.8fr)',
                          gap: '0.625rem',
                          alignItems: 'end',
                          padding: '0.75rem',
                          border: '1px solid var(--border-card)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Beneficiario</span>
                          <strong style={{ fontSize: '0.8125rem', color: 'var(--previasis-dark-green)' }}>
                            #{detalle.codigoAfiliado}
                          </strong>
                        </div>
                        <div className="previasis-input-group">
                          <label className="previasis-label">Deporte *</label>
                          <input
                            type="text"
                            className="previasis-input"
                            placeholder="Natación"
                            value={detalle.deporte}
                            onChange={(e) => updateDetalleDeportivo(detalle.codigoAfiliado, { deporte: e.target.value })}
                            required
                          />
                        </div>
                        <div className="previasis-input-group">
                          <label className="previasis-label">Frecuencia *</label>
                          <input
                            type="text"
                            className="previasis-input"
                            placeholder="3 veces por semana"
                            value={detalle.frecuencia}
                            onChange={(e) => updateDetalleDeportivo(detalle.codigoAfiliado, { frecuencia: e.target.value })}
                            required
                          />
                        </div>
                        <div className="previasis-input-group">
                          <label className="previasis-label">Nivel *</label>
                          <select
                            className="previasis-input"
                            value={detalle.nivel}
                            onChange={(e) => updateDetalleDeportivo(detalle.codigoAfiliado, { nivel: e.target.value as DetalleDeportivo['nivel'] })}
                            required
                          >
                            <option value="">Seleccionar</option>
                            <option value="Amateur">Amateur</option>
                            <option value="Profesional">Profesional</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isYes && q.id !== 17 && q.hasExtraInput && (
                  <div style={{ marginTop: '0.25rem', animation: 'fadeIn 0.2s ease-in-out' }}>
                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        {q.extraInputLabel || 'Especificación requerida'} <span className="previasis-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="previasis-input"
                        placeholder={q.extraInputPlaceholder}
                        value={extraVal}
                        onChange={(e) => setDetallesExtra(q.id, e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SUB-FORMULARIO CLÍNICO OBLIGATORIO CUANDO HAY 'SÍ' */}
        {hasAnyYes && (
          <div
            style={{
              marginTop: '2rem',
              borderTop: '2px dashed var(--previasis-green)',
              paddingTop: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HeartPulse size={20} />
                  Detalle Clínico de Afecciones Declaradas (Sudeaseg)
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Complete los datos clínicos de cada diagnóstico para el análisis médico de la compañía
                </p>
              </div>

              <button
                type="button"
                onClick={addAfeccionDetalle}
                className="btn-pill btn-pill-outline"
                style={{ fontSize: '0.8125rem' }}
              >
                <PlusCircle size={14} /> + Añadir Afección
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {salud.afeccionesDetalles.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    border: '1px solid rgba(0, 139, 71, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--previasis-dark-green)' }}>
                      Registro Clínico #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAfeccionDetalle(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--status-error)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        Código de Afiliado <span className="previasis-label-required">*</span>
                      </label>
                      <select
                        className="previasis-input"
                        value={item.codigoAfiliado}
                        onChange={(e) => updateAfeccionDetalle(index, { codigoAfiliado: Number(e.target.value) })}
                      >
                        {afiliados.map((a) => (
                          <option key={a.id} value={a.codigoAfiliado}>
                            #{a.codigoAfiliado} - {a.nombreCompleto || 'Persona ' + a.codigoAfiliado}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        Tipo de Padecimiento / Diagnóstico <span className="previasis-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="previasis-input"
                        placeholder="Ej: Hipertensión arterial"
                        value={item.padecimiento}
                        onChange={(e) => updateAfeccionDetalle(index, { padecimiento: e.target.value })}
                        required
                      />
                    </div>

                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        Fecha de Diagnóstico (MM/AAAA) <span className="previasis-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="previasis-input"
                        placeholder="05/2021"
                        value={item.fechaDiagnostico}
                        onChange={(e) => updateAfeccionDetalle(index, { fechaDiagnostico: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        Tratamiento o Intervención Quirúrgica <span className="previasis-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="previasis-input"
                        placeholder="Tratamiento farmacológico o quirúrgico"
                        value={item.tratamientoPracticado}
                        onChange={(e) => updateAfeccionDetalle(index, { tratamientoPracticado: e.target.value })}
                        required
                      />
                    </div>

                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        Fecha Último Chequeo Médico <span className="previasis-label-required">*</span>
                      </label>
                      <input
                        type="date"
                        className="previasis-input"
                        value={item.fechaUltimoChequeo}
                        onChange={(e) => updateAfeccionDetalle(index, { fechaUltimoChequeo: e.target.value })}
                        required
                      />
                    </div>

                    <div className="previasis-input-group">
                      <label className="previasis-label">
                        Institución Hospitalaria Atendida <span className="previasis-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="previasis-input"
                        placeholder="Nombre de clínica u hospital"
                        value={item.institucionHospitalaria}
                        onChange={(e) => updateAfeccionDetalle(index, { institucionHospitalaria: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4DeclaracionSalud;
