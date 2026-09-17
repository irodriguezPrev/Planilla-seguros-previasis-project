'use client';

import React, { useState } from 'react';
import {
  DeclaracionSaludSection,
  AfeccionMedicaDetalle,
  AfiliadoRow,
  DetalleDeportivo,
  DetalleAclaracion,
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
    const questionConfig = HEALTH_QUESTIONS.find((q) => q.id === id);
    const isBeneficiaryDetailOnly =
      questionConfig?.beneficiaryDetail === true && id !== 17;
    const shouldSelectBeneficiary = questionConfig?.requiresBeneficiarySelection !== false;
    const shouldCreateClinicalDetail = questionConfig?.requiresClinicalDetail !== false;

    const codigosAfiliadosIniciales =
      respuesta === 'SÍ'
        ? (current.codigosAfiliados && current.codigosAfiliados.length > 0
            ? current.codigosAfiliados
            : shouldSelectBeneficiary && !isBeneficiaryDetailOnly ? [afiliados[0]?.codigoAfiliado || 1] : [])
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
    if (respuesta === 'SÍ' && shouldCreateClinicalDetail && updatedAfecciones.length === 0) {
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

    let detallesAclaracion = salud.detallesAclaracion;
    if (isBeneficiaryDetailOnly && respuesta === 'NO') {
      detallesAclaracion = { ...(salud.detallesAclaracion || {}) };
      delete detallesAclaracion[id];
    }

    onChangeSalud({
      ...salud,
      preguntas: updatedPreguntas,
      detallesDeportivos: id === 17 && respuesta === 'NO' ? [] : salud.detallesDeportivos,
      detallesAclaracion,
      afeccionesDetalles: updatedAfecciones,
    });
  };

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

    const questionConfig = HEALTH_QUESTIONS.find((q) => q.id === id);
    const isBeneficiaryDetailQuestion =
      questionConfig?.beneficiaryDetail === true && id !== 17;

    let updatedDetallesAclaracion = salud.detallesAclaracion;

    if (isBeneficiaryDetailQuestion) {
      const existing = salud.detallesAclaracion?.[id] || [];
      updatedDetallesAclaracion = {
        ...(salud.detallesAclaracion || {}),
        [id]: updatedCodigos.map(
          (codigo) =>
            existing.find((d) => d.codigoAfiliado === codigo) || {
              codigoAfiliado: codigo,
              campo1: '',
              campo2: '',
            }
        ),
      };
    }

    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [id]: { ...current, codigosAfiliados: updatedCodigos },
      },
      detallesDeportivos,
      detallesAclaracion: updatedDetallesAclaracion,
    });
  };

  const updateDetalleDeportivo = (codigoAfiliado: number, fields: Partial<DetalleDeportivo>) => {
    const detallesDeportivos = (salud.detallesDeportivos || []).map((detalle) =>
      detalle.codigoAfiliado === codigoAfiliado ? { ...detalle, ...fields } : detalle,
    );
    onChangeSalud({ ...salud, detallesDeportivos });
  };

  const updateDetalleAclaracion = (
    preguntaId: number,
    codigoAfiliado: number,
    field: 'campo1' | 'campo2',
    value: string
  ) => {
    const detalles = salud.detallesAclaracion || {};
    const entries = detalles[preguntaId] || [];
    const updatedEntries = entries.map((d: DetalleAclaracion) =>
      d.codigoAfiliado === codigoAfiliado ? { ...d, [field]: value } : d
    );
    onChangeSalud({
      ...salud,
      detallesAclaracion: { ...detalles, [preguntaId]: updatedEntries },
    });
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

  const setDetalleAntecedente = (id: number, field: 'campo1' | 'campo2', value: string) => {
    const current = salud.preguntas[id] || { respuesta: 'NO' };
    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [id]: {
          ...current,
          detalleAntecedente: {
            ...(current.detalleAntecedente || { campo1: '', campo2: '' }),
            [field]: value,
          },
        },
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
  const hasAnyClinicalYes = HEALTH_QUESTIONS.some(
    (question) => question.requiresClinicalDetail !== false && salud.preguntas[question.id]?.respuesta === 'SÍ',
  );

  // Valores de la pregunta actual
  const q = currentQuestion;
  const currentResp = salud.preguntas[q.id]?.respuesta || 'NO';
  const extraVal = salud.preguntas[q.id]?.detallesExtra || '';
  const codigosAfiliados = salud.preguntas[q.id]?.codigosAfiliados || [];
  const isYes = currentResp === 'SÍ';
  const requiresBeneficiarySelection = q.requiresBeneficiarySelection !== false;
  const hasNoBeneficiary = isYes && requiresBeneficiarySelection && codigosAfiliados.length === 0;

  // Validación de Detalles Deportivos (Pregunta 17)
  const isDeporteIncomplete = isYes && q.id === 17 && codigosAfiliados.length > 0 && (
    (salud.detallesDeportivos || []).length === 0 ||
    salud.detallesDeportivos?.some(
      (d) => !d.deporte.trim() || !d.frecuencia.trim() || !d.nivel
    )
  );

  // Validación per-question: campos de aclaración vacíos (Q5, Q19, Q21)
  const isDetalleAclaracionIncomplete =
    isYes &&
    q.beneficiaryDetail &&
    q.id !== 17 &&
    codigosAfiliados.length > 0 &&
    (
      (salud.detallesAclaracion?.[q.id] || []).length === 0 ||
      (salud.detallesAclaracion?.[q.id] || []).some(
        (d) => !d.campo1.trim() || !d.campo2.trim()
      )
    );

  // Validación all-questions: cualquier pregunta beneficiaryDetail (excl. Q17) incompleta
  const incompleteBeneficiaryDetailTitles = HEALTH_QUESTIONS
    .filter((qItem) => qItem.beneficiaryDetail && qItem.id !== 17)
    .filter((qItem) => {
      const pregunta = salud.preguntas[qItem.id];
      if (!pregunta || pregunta.respuesta !== 'SÍ') return false;
      const codigos = pregunta.codigosAfiliados || [];
      if (codigos.length === 0) return true;
      const detalles = salud.detallesAclaracion?.[qItem.id] || [];
      if (detalles.length === 0) return true;
      return detalles.some((d) => !d.campo1.trim() || !d.campo2.trim());
    })
    .map((qItem) => qItem.title);

  const isBeneficiaryDetailIncomplete = incompleteBeneficiaryDetailTitles.length > 0;

  const isNextDisabled =
    hasNoBeneficiary ||
    isDeporteIncomplete ||
    isDetalleAclaracionIncomplete;

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
          {isYes && requiresBeneficiarySelection && (
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

          {isYes && q.antecedentFields && (
            <div className="grid grid-cols-2 gap-4" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
              <div className="previasis-input-group">
                <label className="previasis-label">{q.antecedentFields.campo1Label}</label>
                <input
                  type="text"
                  className="previasis-input"
                  placeholder={q.antecedentFields.campo1Placeholder}
                  value={salud.preguntas[q.id]?.detalleAntecedente?.campo1 || ''}
                  onChange={(e) => setDetalleAntecedente(q.id, 'campo1', e.target.value)}
                />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">{q.antecedentFields.campo2Label}</label>
                <input
                  type="text"
                  className="previasis-input"
                  placeholder={q.antecedentFields.campo2Placeholder}
                  value={salud.preguntas[q.id]?.detalleAntecedente?.campo2 || ''}
                  onChange={(e) => setDetalleAntecedente(q.id, 'campo2', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DETALLE DEPORTIVO (Pregunta 17) CON VALIDACIONES */}
          {isYes && q.id === 17 && codigosAfiliados.length > 0 && (
            <div
              style={{
                marginTop: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>
                Detalle deportivo por beneficiario
              </p>
              {salud.detallesDeportivos?.map((detalle) => {
                const isDeporteEmpty = !detalle.deporte.trim();
                const isFrecuenciaEmpty = !detalle.frecuencia.trim();
                const isNivelEmpty = !detalle.nivel;

                return (
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
                        style={{
                          borderColor: isDeporteEmpty ? 'var(--status-error)' : undefined,
                        }}
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
                        style={{
                          borderColor: isFrecuenciaEmpty ? 'var(--status-error)' : undefined,
                        }}
                      />
                    </div>

                    <div className="previasis-input-group">
                      <label className="previasis-label">Nivel *</label>
                      <select
                        className="previasis-input"
                        value={detalle.nivel}
                        onChange={(e) => updateDetalleDeportivo(detalle.codigoAfiliado, { nivel: e.target.value as DetalleDeportivo['nivel'] })}
                        required
                        style={{
                          borderColor: isNivelEmpty ? 'var(--status-error)' : undefined,
                        }}
                      >
                        <option value="">Seleccionar</option>
                        <option value="Amateur">Amateur</option>
                        <option value="Profesional">Profesional</option>
                      </select>
                    </div>
                  </div>
                );
              })}

              {isDeporteIncomplete && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--status-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={14} /> Debe completar los campos de deporte, frecuencia y nivel para cada beneficiario.
                </span>
              )}
            </div>
            )}

            {/* DETALLE POR BENEFICIARIO GENÉRICO (Q5, Q19, Q21) */}
            {isYes && q.beneficiaryDetail && q.id !== 17 && codigosAfiliados.length > 0 && (
              <div
                style={{
                  marginTop: '0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--previasis-dark-green)' }}>
                  Detalle por beneficiario
                </p>
                {salud.detallesAclaracion?.[q.id]?.map((detalle) => {
                  const isCampo1Empty = !detalle.campo1.trim();
                  const isCampo2Empty = !detalle.campo2.trim();
                  return (
                    <div
                      key={detalle.codigoAfiliado}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(100px, 0.8fr) 1fr 1fr',
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
                        <label className="previasis-label">{q.beneficiaryDetailLabels?.campo1} *</label>
                        <input
                          type="text"
                          className="previasis-input"
                          placeholder={q.beneficiaryDetailPlaceholders?.campo1}
                          value={detalle.campo1}
                          onChange={(e) => updateDetalleAclaracion(q.id, detalle.codigoAfiliado, 'campo1', e.target.value)}
                          required
                          style={{
                            borderColor: isCampo1Empty ? 'var(--status-error)' : undefined,
                          }}
                        />
                      </div>
                      <div className="previasis-input-group">
                        <label className="previasis-label">{q.beneficiaryDetailLabels?.campo2} *</label>
                        <input
                          type="text"
                          className="previasis-input"
                          placeholder={q.beneficiaryDetailPlaceholders?.campo2}
                          value={detalle.campo2}
                          onChange={(e) => updateDetalleAclaracion(q.id, detalle.codigoAfiliado, 'campo2', e.target.value)}
                          required
                          style={{
                            borderColor: isCampo2Empty ? 'var(--status-error)' : undefined,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {isDetalleAclaracionIncomplete && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--status-error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle size={14} /> Debe completar ambos campos para cada beneficiario.
                  </span>
                )}
              </div>
            )}

            {/* Input Extra si la pregunta lo requiere */}
            {isYes && !q.beneficiaryDetail && q.hasExtraInput && (
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

        {/* Banner genérico: bloqueado por preguntas de beneficiario incompletas en otras preguntas */}
        {isBeneficiaryDetailIncomplete && !isDetalleAclaracionIncomplete && !hasNoBeneficiary && !isDeporteIncomplete && (
          <div style={{ marginTop: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--status-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={14} /> Complete los detalles de beneficiarios para: {incompleteBeneficiaryDetailTitles.join(', ')}
            </span>
          </div>
        )}

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
              backgroundColor: isNextDisabled ? '#cbd5e1' : 'var(--previasis-green)',
              color: '#fff',
              cursor: isNextDisabled ? 'not-allowed' : 'pointer',
            }}
            disabled={isNextDisabled}
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
          >
            {currentQuestionIndex === totalQuestions - 1 ? (
              <>Fin del Cuestionario <CheckCircle size={16} /></>
            ) : (
              <>Siguiente Pregunta <ChevronRight size={16} /></>
            )}
          </button>
        </div>

        {/* SUB-FORMULARIO CLÍNICO OBLIGATORIO SI HAY CONDICIONES 'SÍ' */}
        {hasAnyClinicalYes && (
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
                  Detalle Clínico de Afecciones Declaradas
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