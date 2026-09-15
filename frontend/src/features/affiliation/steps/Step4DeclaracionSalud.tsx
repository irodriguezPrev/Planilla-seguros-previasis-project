'use client';

import React, { useState } from 'react';
import {
  DeclaracionSaludSection,
  AfeccionMedicaDetalle,
  AfiliadoRow,
  DetalleDeportivo,
} from '@/core/interfaces/affiliation.interfaces';
import { HEALTH_QUESTIONS } from '@/core/config/health-questions.config';
import { HeartPulse, PlusCircle, Trash2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, UserCheck } from 'lucide-react';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = HEALTH_QUESTIONS[currentQuestionIndex];
  const totalQuestions = HEALTH_QUESTIONS.length;

  const setRespuestaPregunta = (id: number, respuesta: 'SÍ' | 'NO') => {
    const current = salud.preguntas[id] || { respuesta: 'NO' };
    const codigosAfiliadosIniciales =
      respuesta === 'SÍ'
        ? (current.codigosAfiliados && current.codigosAfiliados.length > 0
            ? current.codigosAfiliados
            : [afiliados[0]?.codigoAfiliado || 1])
        : [];

    const updatedPreguntas = {
      ...salud.preguntas,
      [id]: {
        ...current,
        respuesta,
        codigosAfiliados: codigosAfiliadosIniciales,
      },
    };

    let updatedAfecciones = [...salud.afeccionesDetalles];
    if (respuesta === 'SÍ' && updatedAfecciones.length === 0) {
      updatedAfecciones.push({
        id: Math.random().toString(36).substring(2, 9),
        codigoAfiliado: afiliados[0]?.codigoAfiliado || 1,
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

  // Manejador para alternar checkboxes individualmente
  const toggleBeneficiarioCheckbox = (id: number, codigoAfiliado: number) => {
    const current = salud.preguntas[id] || { respuesta: 'SÍ' as const, codigosAfiliados: [] };
    const actualCodigos = current.codigosAfiliados || [];

    const exists = actualCodigos.includes(codigoAfiliado);
    const updatedCodigos = exists
      ? actualCodigos.filter((code) => code !== codigoAfiliado)
      : [...actualCodigos, codigoAfiliado];

    const detallesDeportivos = id === 17
      ? updatedCodigos.map((codigo) => (
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
        [id]: { ...current, codigosAfiliados: updatedCodigos },
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
      codigoAfiliado: afiliados[0]?.codigoAfiliado || 1,
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

  // Valores de la pregunta actual
  const q = currentQuestion;
  const currentResp = salud.preguntas[q.id]?.respuesta || 'NO';
  const extraVal = salud.preguntas[q.id]?.detallesExtra || '';
  const codigosAfiliados = salud.preguntas[q.id]?.codigosAfiliados || [];
  const isYes = currentResp === 'SÍ';
  const hasNoBeneficiary = isYes && codigosAfiliados.length === 0;

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
                Pregunta {currentQuestionIndex + 1} de {totalQuestions}
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

        {/* Barra de Progreso */}
        <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              backgroundColor: 'var(--previasis-green)',
              height: '100%',
              transition: 'width 0.3s ease-in-out',
            }}
          />
        </div>

        {/* Tarjeta de Pregunta Activa */}
        <div
          key={q.id}
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isYes ? 'rgba(0, 139, 71, 0.05)' : '#ffffff',
            border: '1px solid',
            borderColor: hasNoBeneficiary ? 'var(--status-error)' : isYes ? 'var(--previasis-green)' : 'var(--border-card)',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div className="health-question-header" style={{ alignItems: 'flex-start' }}>
            <div className="health-question-copy">
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isYes ? 'var(--previasis-green)' : '#f1f5f9',
                  color: isYes ? '#ffffff' : 'var(--previasis-dark-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {q.id}
              </span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--previasis-dark-green)' }}>
                  {q.title}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.5 }}>
                  {q.description}
                </p>
              </div>
            </div>

            {/* Switch SÍ / NO */}
            <div className="pill-switch health-answer-switch">
              <button
                type="button"
                onClick={() => setRespuestaPregunta(q.id, 'NO')}
                className={`pill-switch-btn ${!isYes ? 'active' : ''}`}
                style={{
                  backgroundColor: !isYes ? '#E5E7EB' : 'transparent',
                  color: !isYes ? '#1F2937' : 'var(--text-muted)',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.875rem',
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
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.875rem',
                }}
              >
                SÍ
              </button>
            </div>
          </div>

          {/* Lista de Checkboxes si la respuesta es "SÍ" */}
          {isYes && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '1.25rem',
                backgroundColor: '#ffffff',
                border: '1px solid',
                borderColor: hasNoBeneficiary ? 'var(--status-error)' : 'rgba(0, 139, 71, 0.2)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--previasis-green)" />
                <label className="previasis-label" style={{ fontWeight: 700, margin: 0 }}>
                  Seleccione el/los beneficiario(s) afectado(s): <span className="previasis-label-required">*</span>
                </label>
              </div>

              {/* Grid de Checkboxes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '0.625rem',
                  marginTop: '0.25rem',
                }}
              >
                {afiliados.map((afiliado) => {
                  const isChecked = codigosAfiliados.includes(afiliado.codigoAfiliado);
                  return (
                    <label
                      key={afiliado.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--previasis-green)' : '#e2e8f0',
                        backgroundColor: isChecked ? 'rgba(0, 139, 71, 0.06)' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBeneficiarioCheckbox(q.id, afiliado.codigoAfiliado)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--previasis-green)',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: isChecked ? 700 : 500, color: 'var(--previasis-dark-green)' }}>
                        #{afiliado.codigoAfiliado} {afiliado.nombreCompleto || `Persona ${afiliado.codigoAfiliado}`}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Mensaje de Error / Alerta de Validación */}
              {hasNoBeneficiary && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--status-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginTop: '0.25rem',
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={14} /> Debe seleccionar al menos un beneficiario para poder continuar.
                </span>
              )}
            </div>
          )}

          {/* Input Extra si la pregunta lo requiere */}
          {isYes && q.id !== 17 && q.hasExtraInput && (
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
          )}
        </div>

        {/* Botones de Navegación Step-by-Step */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-pill btn-pill-outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            style={{ opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>

          <button
            type="button"
            className="btn-pill"
            style={{
              backgroundColor: hasNoBeneficiary ? '#cbd5e1' : 'var(--previasis-green)',
              color: '#fff',
              cursor: hasNoBeneficiary ? 'not-allowed' : 'pointer',
            }}
            disabled={hasNoBeneficiary}
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
          >
            {currentQuestionIndex === totalQuestions - 1 ? (
              <>Finalizar Cuestionario <CheckCircle size={16} /></>
            ) : (
              <>Siguiente <ChevronRight size={16} /></>
            )}
          </button>
        </div>

        {/* SUB-FORMULARIO CLÍNICO OBLIGATORIO SI HAY CONDICIONES 'SÍ' */}
        {hasAnyYes && (
          <div
            style={{
              marginTop: '2.5rem',
              borderTop: '2px dashed var(--previasis-green)',
              paddingTop: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
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