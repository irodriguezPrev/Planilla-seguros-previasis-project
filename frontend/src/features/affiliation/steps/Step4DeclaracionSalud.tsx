'use client';

import React, { useState } from 'react';
import {
  AfiliadoRow,
  AfeccionMedicaDetalle,
  DeclaracionSaludSection,
  DetalleDeportivo,
} from '@/core/interfaces/affiliation.interfaces';
import {
  HEALTH_QUESTIONS,
  HealthQuestionItem,
} from '@/core/config/health-questions.config';
import {
  getAffiliateAnswers,
  getAffiliateQuestionStatus,
  getHealthDetailMode,
  getQuestionStatus,
  HealthAnswer,
  HealthCompletionStatus,
  isQuestionApplicableToAffiliate,
} from '@/core/utils/health-progress.utils';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  HeartPulse,
  ListChecks,
  PlusCircle,
  Stethoscope,
  Trash2,
  Users,
} from 'lucide-react';

interface Step4Props {
  salud: DeclaracionSaludSection;
  afiliados: AfiliadoRow[];
  onChangeSalud: (salud: DeclaracionSaludSection) => void;
  onComplete: () => void;
}

const makeId = () => Math.random().toString(36).substring(2, 10);

const statusMeta: Record<HealthCompletionStatus, { label: string; color: string; background: string }> = {
  pending: { label: 'Pendiente', color: '#64748b', background: '#f1f5f9' },
  incomplete: { label: 'Faltan detalles', color: '#b45309', background: '#fff7ed' },
  complete: { label: 'Completada', color: '#008b47', background: '#ecfdf5' },
};

const getSuggestedConditions = (question: HealthQuestionItem): string[] =>
  question.description
    .replace(/\betc\.?$/i, '')
    .split(',')
    .map((condition) => condition.trim().replace(/[.?]+$/, ''))
    .filter((condition) => condition.length > 2 && condition.length < 65);

export const Step4DeclaracionSalud: React.FC<Step4Props> = ({
  salud,
  afiliados,
  onChangeSalud,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [otherConditions, setOtherConditions] = useState<Record<string, string>>({});

  const question = HEALTH_QUESTIONS[currentQuestionIndex];
  const questionState = salud.preguntas[question.id];
  const detailMode = getHealthDetailMode(question);
  const applicableAffiliates = afiliados.filter((afiliado) =>
    isQuestionApplicableToAffiliate(question, afiliado),
  );
  const affiliateAnswers = getAffiliateAnswers(salud, question, afiliados);
  const yesAffiliates = applicableAffiliates.filter(
    (afiliado) => affiliateAnswers[afiliado.codigoAfiliado] === 'SÍ',
  );
  const questionStatus = getQuestionStatus(salud, question, afiliados);
  const completedQuestions = HEALTH_QUESTIONS.filter(
    (item) => getQuestionStatus(salud, item, afiliados) === 'complete',
  ).length;
  const incompleteQuestions = HEALTH_QUESTIONS.filter(
    (item) => getQuestionStatus(salud, item, afiliados) === 'incomplete',
  ).length;
  const progressPercent = Math.round((completedQuestions / HEALTH_QUESTIONS.length) * 100);

  const syncQuestionSummary = (
    current: DeclaracionSaludSection['preguntas'][number],
    answers: Partial<Record<number, HealthAnswer>>,
    extraByAffiliate = current.detallesExtraPorAfiliado,
  ) => {
    const applicableCodes = new Set(applicableAffiliates.map((afiliado) => afiliado.codigoAfiliado));
    const applicableAnswers = Object.fromEntries(
      Object.entries(answers).filter(([code]) => applicableCodes.has(Number(code))),
    );
    const applicableExtraDetails = Object.fromEntries(
      Object.entries(extraByAffiliate || {}).filter(([code]) => applicableCodes.has(Number(code))),
    );
    const yesCodes = applicableAffiliates
      .filter((afiliado) => answers[afiliado.codigoAfiliado] === 'SÍ')
      .map((afiliado) => afiliado.codigoAfiliado);
    const extraSummary = Object.entries(applicableExtraDetails)
      .filter(([, value]) => value?.trim())
      .map(([code, value]) => `#${code}: ${value}`)
      .join(' | ');

    return {
      ...current,
      respuesta: yesCodes.length > 0 ? 'SÍ' as const : 'NO' as const,
      codigosAfiliados: yesCodes,
      respuestasAfiliados: applicableAnswers,
      detallesExtraPorAfiliado: applicableExtraDetails,
      detallesExtra: extraSummary || undefined,
    };
  };

  const setAffiliateAnswer = (
    currentQuestion: HealthQuestionItem,
    codigoAfiliado: number,
    answer: HealthAnswer,
  ) => {
    const current = salud.preguntas[currentQuestion.id] || { respuesta: 'NO' as const };
    const answers = {
      ...getAffiliateAnswers(salud, currentQuestion, afiliados),
      [codigoAfiliado]: answer,
    };
    const mode = getHealthDetailMode(currentQuestion);
    let detallesDeportivos = [...(salud.detallesDeportivos || [])];
    let detallesAclaracion = { ...(salud.detallesAclaracion || {}) };
    let afeccionesDetalles = [...salud.afeccionesDetalles];
    const extraByAffiliate = { ...(current.detallesExtraPorAfiliado || {}) };

    if (answer === 'NO') {
      if (mode === 'sport') {
        detallesDeportivos = detallesDeportivos.filter(
          (detail) => detail.codigoAfiliado !== codigoAfiliado,
        );
      }
      if (mode === 'beneficiary') {
        detallesAclaracion[currentQuestion.id] = (detallesAclaracion[currentQuestion.id] || [])
          .filter((detail) => detail.codigoAfiliado !== codigoAfiliado);
      }
      if (mode === 'clinical') {
        afeccionesDetalles = afeccionesDetalles.filter(
          (detail) => !(
            detail.preguntaId === currentQuestion.id &&
            Number(detail.codigoAfiliado) === codigoAfiliado
          ),
        );
      }
      delete extraByAffiliate[codigoAfiliado];
    }

    if (answer === 'SÍ' && mode === 'sport' && !detallesDeportivos.some(
      (detail) => detail.codigoAfiliado === codigoAfiliado,
    )) {
      detallesDeportivos.push({ id: makeId(), codigoAfiliado, deporte: '', frecuencia: '', nivel: '' });
    }

    if (answer === 'SÍ' && mode === 'beneficiary' && !(detallesAclaracion[currentQuestion.id] || []).some(
      (detail) => detail.codigoAfiliado === codigoAfiliado,
    )) {
      detallesAclaracion[currentQuestion.id] = [
        ...(detallesAclaracion[currentQuestion.id] || []),
        { id: makeId(), codigoAfiliado, campo1: '', campo2: '' },
      ];
    }

    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [currentQuestion.id]: syncQuestionSummary(current, answers, extraByAffiliate),
      },
      detallesDeportivos,
      detallesAclaracion,
      afeccionesDetalles,
    });
  };

  const answerNoForEveryone = (currentQuestion: HealthQuestionItem) => {
    const applicable = afiliados.filter((afiliado) =>
      isQuestionApplicableToAffiliate(currentQuestion, afiliado),
    );
    const current = salud.preguntas[currentQuestion.id] || { respuesta: 'NO' as const };
    const answers = Object.fromEntries(
      applicable.map((afiliado) => [afiliado.codigoAfiliado, 'NO' as const]),
    );
    const affiliateCodes = new Set(applicable.map((afiliado) => afiliado.codigoAfiliado));

    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [currentQuestion.id]: syncQuestionSummary(current, answers, {}),
      },
      detallesDeportivos: getHealthDetailMode(currentQuestion) === 'sport'
        ? (salud.detallesDeportivos || []).filter((detail) => !affiliateCodes.has(detail.codigoAfiliado))
        : salud.detallesDeportivos,
      detallesAclaracion: getHealthDetailMode(currentQuestion) === 'beneficiary'
        ? { ...(salud.detallesAclaracion || {}), [currentQuestion.id]: [] }
        : salud.detallesAclaracion,
      afeccionesDetalles: salud.afeccionesDetalles.filter(
        (detail) => detail.preguntaId !== currentQuestion.id,
      ),
    });
  };

  const setGlobalAnswer = (currentQuestion: HealthQuestionItem, answer: HealthAnswer) => {
    const current = salud.preguntas[currentQuestion.id] || { respuesta: 'NO' as const };
    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [currentQuestion.id]: {
          ...current,
          respuesta: answer,
          detalleAntecedente: answer === 'SÍ'
            ? current.detalleAntecedente || { campo1: '', campo2: '' }
            : undefined,
        },
      },
    });
  };

  const addSportDetail = (codigoAfiliado: number) => {
    onChangeSalud({
      ...salud,
      detallesDeportivos: [
        ...(salud.detallesDeportivos || []),
        { id: makeId(), codigoAfiliado, deporte: '', frecuencia: '', nivel: '' },
      ],
    });
  };

  const updateSportDetail = (
    codigoAfiliado: number,
    sportIndex: number,
    fields: Partial<DetalleDeportivo>,
  ) => {
    let matchingIndex = -1;
    const details = (salud.detallesDeportivos || []).map((detail) => {
      if (detail.codigoAfiliado !== codigoAfiliado) return detail;
      matchingIndex += 1;
      return matchingIndex === sportIndex ? { ...detail, ...fields } : detail;
    });
    onChangeSalud({ ...salud, detallesDeportivos: details });
  };

  const removeSportDetail = (codigoAfiliado: number, sportIndex: number) => {
    let matchingIndex = -1;
    const details = (salud.detallesDeportivos || []).filter((detail) => {
      if (detail.codigoAfiliado !== codigoAfiliado) return true;
      matchingIndex += 1;
      return matchingIndex !== sportIndex;
    });
    onChangeSalud({ ...salud, detallesDeportivos: details });
  };

  const updateExtraDetail = (codigoAfiliado: number, value: string) => {
    const current = salud.preguntas[question.id] || { respuesta: 'SÍ' as const };
    const answers = getAffiliateAnswers(salud, question, afiliados);
    const extraByAffiliate = {
      ...(current.detallesExtraPorAfiliado || {}),
      [codigoAfiliado]: value,
    };
    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [question.id]: syncQuestionSummary(current, answers, extraByAffiliate),
      },
    });
  };

  const updateAntecedent = (field: 'campo1' | 'campo2', value: string) => {
    const current = salud.preguntas[question.id] || { respuesta: 'SÍ' as const };
    onChangeSalud({
      ...salud,
      preguntas: {
        ...salud.preguntas,
        [question.id]: {
          ...current,
          detalleAntecedente: {
            ...(current.detalleAntecedente || { campo1: '', campo2: '' }),
            [field]: value,
          },
        },
      },
    });
  };

  const addBeneficiaryDetail = (codigoAfiliado: number) => {
    const details = salud.detallesAclaracion || {};
    onChangeSalud({
      ...salud,
      detallesAclaracion: {
        ...details,
        [question.id]: [
          ...(details[question.id] || []),
          { id: makeId(), codigoAfiliado, campo1: '', campo2: '' },
        ],
      },
    });
  };

  const updateBeneficiaryDetail = (
    detailId: string | undefined,
    fallbackIndex: number,
    field: 'campo1' | 'campo2',
    value: string,
  ) => {
    const details = salud.detallesAclaracion || {};
    const updated = [...(details[question.id] || [])];
    const index = detailId ? updated.findIndex((detail) => detail.id === detailId) : fallbackIndex;
    if (index < 0) return;
    updated[index] = { ...updated[index], [field]: value };
    onChangeSalud({
      ...salud,
      detallesAclaracion: { ...details, [question.id]: updated },
    });
  };

  const removeBeneficiaryDetail = (detailId: string | undefined, fallbackIndex: number) => {
    const details = salud.detallesAclaracion || {};
    const updated = (details[question.id] || []).filter(
      (detail, index) => detailId ? detail.id !== detailId : index !== fallbackIndex,
    );
    onChangeSalud({
      ...salud,
      detallesAclaracion: { ...details, [question.id]: updated },
    });
  };

  const toggleBeneficiaryDetailOption = (codigoAfiliado: number, option: string) => {
    const detailsByQuestion = salud.detallesAclaracion || {};
    const currentDetails = [...(detailsByQuestion[question.id] || [])];
    const normalizedOption = option.trim().toLocaleLowerCase('es-VE');
    const hasOption = currentDetails.some(
      (detail) =>
        detail.codigoAfiliado === codigoAfiliado &&
        detail.campo1.trim().toLocaleLowerCase('es-VE') === normalizedOption,
    );

    let updatedDetails;
    if (hasOption) {
      updatedDetails = currentDetails.filter(
        (detail) => !(
          detail.codigoAfiliado === codigoAfiliado &&
          detail.campo1.trim().toLocaleLowerCase('es-VE') === normalizedOption
        ),
      );
    } else {
      const emptyDetailIndex = currentDetails.findIndex(
        (detail) =>
          detail.codigoAfiliado === codigoAfiliado &&
          !detail.campo1.trim() &&
          !detail.campo2.trim(),
      );
      if (emptyDetailIndex >= 0) {
        updatedDetails = currentDetails.map((detail, index) =>
          index === emptyDetailIndex ? { ...detail, campo1: option } : detail,
        );
      } else {
        updatedDetails = [
          ...currentDetails,
          { id: makeId(), codigoAfiliado, campo1: option, campo2: '' },
        ];
      }
    }

    onChangeSalud({
      ...salud,
      detallesAclaracion: {
        ...detailsByQuestion,
        [question.id]: updatedDetails,
      },
    });
  };

  const addClinicalConditions = (codigoAfiliado: number, rawValue: string) => {
    const names = rawValue
      .split(/[,;\n]+/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const existingNames = new Set(
      salud.afeccionesDetalles
        .filter((detail) =>
          detail.preguntaId === question.id &&
          Number(detail.codigoAfiliado) === codigoAfiliado,
        )
        .map((detail) => detail.padecimiento.trim().toLocaleLowerCase()),
    );
    const newDetails: AfeccionMedicaDetalle[] = names
      .filter((name) => !existingNames.has(name.toLocaleLowerCase()))
      .map((padecimiento) => ({
        id: makeId(),
        preguntaId: question.id,
        codigoAfiliado,
        padecimiento,
        fechaDiagnostico: '',
        tratamientoPracticado: '',
        fechaUltimoChequeo: '',
        institucionHospitalaria: '',
      }));

    if (newDetails.length > 0) {
      onChangeSalud({
        ...salud,
        afeccionesDetalles: [...salud.afeccionesDetalles, ...newDetails],
      });
    }
  };

  const updateClinicalDetail = (id: string, fields: Partial<AfeccionMedicaDetalle>) => {
    onChangeSalud({
      ...salud,
      afeccionesDetalles: salud.afeccionesDetalles.map((detail) =>
        detail.id === id ? { ...detail, ...fields } : detail,
      ),
    });
  };

  const removeClinicalDetail = (id: string) => {
    onChangeSalud({
      ...salud,
      afeccionesDetalles: salud.afeccionesDetalles.filter((detail) => detail.id !== id),
    });
  };

  const toggleClinicalCondition = (codigoAfiliado: number, condition: string) => {
    const normalizedCondition = condition.trim().toLocaleLowerCase('es-VE');
    const matchingDetails = salud.afeccionesDetalles.filter(
      (detail) =>
        detail.preguntaId === question.id &&
        Number(detail.codigoAfiliado) === codigoAfiliado &&
        detail.padecimiento.trim().toLocaleLowerCase('es-VE') === normalizedCondition,
    );

    if (matchingDetails.length > 0) {
      const matchingIds = new Set(matchingDetails.map((detail) => detail.id));
      onChangeSalud({
        ...salud,
        afeccionesDetalles: salud.afeccionesDetalles.filter((detail) => !matchingIds.has(detail.id)),
      });
      return;
    }

    addClinicalConditions(codigoAfiliado, condition);
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    document.getElementById('health-question-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToNextPending = () => {
    const nextOffset = Array.from({ length: HEALTH_QUESTIONS.length }, (_, offset) =>
      (currentQuestionIndex + offset + 1) % HEALTH_QUESTIONS.length,
    ).find((index) => getQuestionStatus(salud, HEALTH_QUESTIONS[index], afiliados) !== 'complete');
    goToQuestion(nextOffset ?? Math.min(currentQuestionIndex + 1, HEALTH_QUESTIONS.length - 1));
  };

  const renderStatusIcon = (status: HealthCompletionStatus, size = 16) => {
    if (status === 'complete') return <CheckCircle2 size={size} />;
    if (status === 'incomplete') return <Clock3 size={size} />;
    return <Circle size={size} />;
  };

  const renderClinicalDetails = (afiliado: AfiliadoRow) => {
    const key = `${question.id}-${afiliado.codigoAfiliado}`;
    const value = otherConditions[key] || '';
    const details = salud.afeccionesDetalles.filter(
      (detail) =>
        detail.preguntaId === question.id &&
        Number(detail.codigoAfiliado) === afiliado.codigoAfiliado,
    );
    const suggestions = getSuggestedConditions(question);

    return (
      <div className="health-detail-panel" key={afiliado.id}>
        <div className="health-detail-heading">
          <div>
            <span>Detalles clínicos de</span>
            <strong>{afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}</strong>
          </div>
          <span className="pill-badge">Código #{afiliado.codigoAfiliado}</span>
        </div>

        <div>
          <p className="previasis-label" style={{ marginBottom: '0.5rem' }}>Seleccione un padecimiento frecuente</p>
          <div className="health-condition-chips">
            {suggestions.map((condition) => {
              const alreadyAdded = details.some(
                (detail) => detail.padecimiento.toLocaleLowerCase() === condition.toLocaleLowerCase(),
              );
              return (
                <button
                  key={condition}
                  type="button"
                  className={`health-condition-chip ${alreadyAdded ? 'selected' : ''}`}
                  onClick={() => toggleClinicalCondition(afiliado.codigoAfiliado, condition)}
                  aria-pressed={alreadyAdded}
                  title={alreadyAdded ? `Quitar ${condition}` : `Agregar ${condition}`}
                >
                  {alreadyAdded && <Check size={13} />} {condition}
                </button>
              );
            })}
          </div>
        </div>

        <div className="health-other-condition-row">
          <div className="previasis-input-group">
            <label className="previasis-label">Otro padecimiento</label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Ej: Arritmia, soplo cardíaco"
              value={value}
              onChange={(event) => setOtherConditions({ ...otherConditions, [key]: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addClinicalConditions(afiliado.codigoAfiliado, value);
                  setOtherConditions({ ...otherConditions, [key]: '' });
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn-pill btn-pill-outline"
            disabled={!value.trim()}
            onClick={() => {
              addClinicalConditions(afiliado.codigoAfiliado, value);
              setOtherConditions({ ...otherConditions, [key]: '' });
            }}
          >
            <PlusCircle size={15} /> Agregar
          </button>
        </div>
        <p className="health-helper-text">Puede separar varias condiciones usando comas.</p>

        {details.length === 0 && (
          <div className="health-inline-warning">
            <AlertCircle size={16} /> Agregue al menos un padecimiento para completar esta respuesta.
          </div>
        )}

        {details.map((detail, index) => (
          <div className="health-clinical-card" key={detail.id}>
            <div className="health-detail-heading">
              <strong>Padecimiento #{index + 1}: {detail.padecimiento}</strong>
              <button type="button" className="health-delete-button" onClick={() => removeClinicalDetail(detail.id)}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
            <div className="health-clinical-grid">
              <div className="previasis-input-group">
                <label className="previasis-label">Tipo de padecimiento *</label>
                <input className="previasis-input" value={detail.padecimiento} onChange={(event) => updateClinicalDetail(detail.id, { padecimiento: event.target.value })} />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Fecha de diagnóstico (MM/AAAA) *</label>
                <input className="previasis-input" placeholder="05/2021" value={detail.fechaDiagnostico} onChange={(event) => updateClinicalDetail(detail.id, { fechaDiagnostico: event.target.value })} />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Tratamiento o intervención *</label>
                <input className="previasis-input" placeholder="Tratamiento farmacológico o quirúrgico" value={detail.tratamientoPracticado} onChange={(event) => updateClinicalDetail(detail.id, { tratamientoPracticado: event.target.value })} />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Último chequeo médico (opcional)</label>
                <input type="date" className="previasis-input" value={detail.fechaUltimoChequeo} onChange={(event) => updateClinicalDetail(detail.id, { fechaUltimoChequeo: event.target.value })} />
              </div>
              <div className="previasis-input-group health-clinical-wide">
                <label className="previasis-label">Institución hospitalaria (opcional)</label>
                <input className="previasis-input" placeholder="Nombre de clínica u hospital" value={detail.institucionHospitalaria} onChange={(event) => updateClinicalDetail(detail.id, { institucionHospitalaria: event.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSportDetails = (afiliado: AfiliadoRow) => {
    const details = (salud.detallesDeportivos || []).filter(
      (item) => item.codigoAfiliado === afiliado.codigoAfiliado,
    );
    return (
      <div className="health-detail-panel" key={afiliado.id}>
        <div className="health-detail-heading">
          <strong>{afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}</strong>
          <button type="button" className="btn-pill btn-pill-outline" onClick={() => addSportDetail(afiliado.codigoAfiliado)}>
            <PlusCircle size={14} /> Agregar otro deporte
          </button>
        </div>
        {details.length === 0 && (
          <div className="health-not-applicable">Agregue al menos un deporte para completar esta respuesta.</div>
        )}
        {details.map((detail, index) => (
          <div className="health-sport-entry" key={detail.id || `${afiliado.id}-${index}`}>
            <div className="health-sport-entry-heading">
              <span>Deporte #{index + 1}</span>
              <button type="button" className="health-delete-button" onClick={() => removeSportDetail(afiliado.codigoAfiliado, index)}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
            <div className="health-special-detail-grid health-special-detail-grid-3">
              <div className="previasis-input-group">
                <label className="previasis-label">Deporte *</label>
                <input className="previasis-input" value={detail.deporte} placeholder="Natación" onChange={(event) => updateSportDetail(afiliado.codigoAfiliado, index, { deporte: event.target.value })} />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Frecuencia *</label>
                <input className="previasis-input" value={detail.frecuencia} placeholder="3 veces por semana" onChange={(event) => updateSportDetail(afiliado.codigoAfiliado, index, { frecuencia: event.target.value })} />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Nivel *</label>
                <select className="previasis-input" value={detail.nivel} onChange={(event) => updateSportDetail(afiliado.codigoAfiliado, index, { nivel: event.target.value as DetalleDeportivo['nivel'] })}>
                  <option value="">Seleccionar</option>
                  <option value="Amateur">Amateur</option>
                  <option value="Profesional">Profesional</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBeneficiaryDetails = (afiliado: AfiliadoRow) => {
    const allDetails = salud.detallesAclaracion?.[question.id] || [];
    const details = allDetails
      .map((detail, index) => ({ detail, originalIndex: index }))
      .filter(({ detail }) => detail.codigoAfiliado === afiliado.codigoAfiliado);
    return (
      <div className="health-detail-panel" key={afiliado.id}>
        <div className="health-detail-heading">
          <strong>{afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}</strong>
          <button type="button" className="btn-pill btn-pill-outline" onClick={() => addBeneficiaryDetail(afiliado.codigoAfiliado)}>
            <PlusCircle size={14} /> Agregar otro detalle
          </button>
        </div>
        {question.beneficiaryDetailOptions?.campo1 && (
          <div>
            <p className="previasis-label" style={{ marginBottom: '0.5rem' }}>Seleccione un tipo de evento frecuente</p>
            <div className="health-condition-chips">
              {question.beneficiaryDetailOptions.campo1.map((option) => {
                const isSelected = details.some(
                  ({ detail }) => detail.campo1.trim().toLocaleLowerCase('es-VE') === option.toLocaleLowerCase('es-VE'),
                );
                return (
                  <button
                    key={option}
                    type="button"
                    className={`health-condition-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleBeneficiaryDetailOption(afiliado.codigoAfiliado, option)}
                    aria-pressed={isSelected}
                    title={isSelected ? `Quitar ${option}` : `Agregar ${option}`}
                  >
                    {isSelected && <Check size={13} />} {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {details.map(({ detail, originalIndex }, localIndex) => (
          <div className="health-beneficiary-detail" key={detail.id || `${detail.codigoAfiliado}-${originalIndex}`}>
            <span className="health-detail-number">#{localIndex + 1}</span>
            <div className="previasis-input-group">
              <label className="previasis-label">{question.beneficiaryDetailLabels?.campo1} *</label>
              <input className="previasis-input" placeholder={question.beneficiaryDetailPlaceholders?.campo1} value={detail.campo1} onChange={(event) => updateBeneficiaryDetail(detail.id, originalIndex, 'campo1', event.target.value)} />
            </div>
            <div className="previasis-input-group">
              <label className="previasis-label">{question.beneficiaryDetailLabels?.campo2} *</label>
              <input className="previasis-input" placeholder={question.beneficiaryDetailPlaceholders?.campo2} value={detail.campo2} onChange={(event) => updateBeneficiaryDetail(detail.id, originalIndex, 'campo2', event.target.value)} />
            </div>
            {details.length > 1 && (
              <button type="button" className="health-delete-icon" title="Eliminar detalle" onClick={() => removeBeneficiaryDetail(detail.id, originalIndex)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderExtraDetail = (afiliado: AfiliadoRow) => {
    const legacyValue = yesAffiliates.length === 1 ? questionState?.detallesExtra || '' : '';
    const value = questionState?.detallesExtraPorAfiliado?.[afiliado.codigoAfiliado] ?? legacyValue;
    return (
      <div className="health-detail-panel" key={afiliado.id}>
        <div className="health-detail-heading">
          <strong>{afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}</strong>
          <span className="pill-badge">Información requerida</span>
        </div>
        <div className="previasis-input-group">
          <label className="previasis-label">{question.extraInputLabel || 'Especifique el detalle'} *</label>
          <textarea className="previasis-input" rows={3} placeholder={question.extraInputPlaceholder} value={value} onChange={(event) => updateExtraDetail(afiliado.codigoAfiliado, event.target.value)} />
        </div>
      </div>
    );
  };

  const renderDetailsForAffiliate = (afiliado: AfiliadoRow) => {
    if (detailMode === 'sport') return renderSportDetails(afiliado);
    if (detailMode === 'beneficiary') return renderBeneficiaryDetails(afiliado);
    if (detailMode === 'extra') return renderExtraDetail(afiliado);
    return renderClinicalDetails(afiliado);
  };

  return (
    <div className="health-assistant">
      <div className="previasis-card health-assistant-summary">
        <div className="health-assistant-header">
          <div className="health-title-block">
            <div className="health-title-icon"><HeartPulse size={22} /></div>
            <div>
              <h3>Declaración de Salud</h3>
              <p>Responda por cada integrante y complete únicamente los detalles necesarios.</p>
            </div>
          </div>
          <div className="health-progress-copy">
            <strong>{completedQuestions} de {HEALTH_QUESTIONS.length}</strong>
            <span>preguntas completadas</span>
          </div>
        </div>

        <div className="health-progress-track"><div style={{ width: `${progressPercent}%` }} /></div>

        <div className="health-member-progress-list">
          {afiliados.map((afiliado) => {
            const applicableQuestions = HEALTH_QUESTIONS.filter(
              (item) => item.requiresBeneficiarySelection !== false &&
                isQuestionApplicableToAffiliate(item, afiliado),
            );
            const completeCount = applicableQuestions.filter(
              (item) => getAffiliateQuestionStatus(salud, item, afiliado, afiliados) === 'complete',
            ).length;
            return (
              <div className="health-member-progress" key={afiliado.id}>
                <div className="health-member-avatar">{afiliado.codigoAfiliado}</div>
                <div>
                  <strong>{afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}</strong>
                  <span>{completeCount}/{applicableQuestions.length} respuestas listas</span>
                </div>
                {completeCount === applicableQuestions.length && <CheckCircle2 size={20} />}
              </div>
            );
          })}
        </div>

        <div className="health-status-legend">
          <span><Circle size={13} /> Pendiente</span>
          <span className="incomplete"><Clock3 size={13} /> Sí, faltan detalles</span>
          <span className="complete"><CheckCircle2 size={13} /> Completada</span>
          {incompleteQuestions > 0 && <strong>{incompleteQuestions} con información pendiente</strong>}
        </div>
      </div>

      <div className="health-workspace">
        <aside className="previasis-card health-question-navigator">
          <div className="health-navigator-title">
            <ListChecks size={19} />
            <div><strong>Las 26 preguntas</strong><span>Seleccione cualquiera para editarla</span></div>
          </div>
          <div className="health-question-list">
            {HEALTH_QUESTIONS.map((item, index) => {
              const status = getQuestionStatus(salud, item, afiliados);
              const meta = statusMeta[status];
              return (
                <button type="button" key={item.id} className={`health-question-nav-item ${index === currentQuestionIndex ? 'active' : ''}`} onClick={() => goToQuestion(index)}>
                  <span className="health-question-number">{item.id}</span>
                  <span className="health-question-nav-copy">
                    <strong>{item.title}</strong>
                    {item.requiresBeneficiarySelection === false ? (
                      <small style={{ color: meta.color }}>{renderStatusIcon(status, 12)} {meta.label}</small>
                    ) : (
                      <span className="health-affiliate-dots">
                        {afiliados.filter((afiliado) =>
                          isQuestionApplicableToAffiliate(item, afiliado),
                        ).map((afiliado) => {
                          const affiliateStatus = getAffiliateQuestionStatus(salud, item, afiliado, afiliados);
                          return (
                            <i key={afiliado.id} title={`${afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}: ${statusMeta[affiliateStatus].label}`} data-status={affiliateStatus}>
                              {afiliado.codigoAfiliado}
                            </i>
                          );
                        })}
                      </span>
                    )}
                  </span>
                  <span className="health-question-status-icon" style={{ color: meta.color, backgroundColor: meta.background }}>{renderStatusIcon(status)}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section id="health-question-editor" className="previasis-card health-question-editor">
          <div className="health-editor-heading">
            <div className="health-question-badge">{question.id}</div>
            <div>
              <span>Pregunta {currentQuestionIndex + 1} de {HEALTH_QUESTIONS.length}</span>
              <h4>{question.title}</h4>
              <p>{question.description}</p>
            </div>
            <div className="health-editor-status" style={{ color: statusMeta[questionStatus].color, backgroundColor: statusMeta[questionStatus].background }}>
              {renderStatusIcon(questionStatus)} {statusMeta[questionStatus].label}
            </div>
          </div>

          {question.requiresBeneficiarySelection === false ? (
            <div className="health-global-answer">
              <p className="previasis-label">Seleccione una respuesta general *</p>
              <div className="health-answer-buttons">
                <button type="button" className={questionState?.respuesta === 'NO' ? 'selected no' : ''} onClick={() => setGlobalAnswer(question, 'NO')}>NO</button>
                <button type="button" className={questionState?.respuesta === 'SÍ' ? 'selected yes' : ''} onClick={() => setGlobalAnswer(question, 'SÍ')}>SÍ</button>
              </div>
              {questionState?.respuesta === 'SÍ' && question.antecedentFields && (
                <div className="health-special-detail-grid">
                  <div className="previasis-input-group">
                    <label className="previasis-label">{question.antecedentFields.campo1Label} *</label>
                    <input className="previasis-input" placeholder={question.antecedentFields.campo1Placeholder} value={questionState.detalleAntecedente?.campo1 || ''} onChange={(event) => updateAntecedent('campo1', event.target.value)} />
                  </div>
                  <div className="previasis-input-group">
                    <label className="previasis-label">{question.antecedentFields.campo2Label} *</label>
                    <input className="previasis-input" placeholder={question.antecedentFields.campo2Placeholder} value={questionState.detalleAntecedente?.campo2 || ''} onChange={(event) => updateAntecedent('campo2', event.target.value)} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {question.applicableSex && (
                <div className="health-applicability-note">
                  Esta pregunta aplica únicamente a integrantes de sexo {question.applicableSex === 'F' ? 'femenino' : 'masculino'}.
                </div>
              )}
              <div className="health-answer-toolbar">
                <div><Users size={18} /><span>Responda por cada integrante</span></div>
                {applicableAffiliates.length > 0 && (
                  <button type="button" className="btn-pill btn-pill-secondary" onClick={() => answerNoForEveryone(question)}>
                    Ningún integrante aplicable presenta esta condición
                  </button>
                )}
              </div>

              <div className="health-affiliate-answer-list">
                {applicableAffiliates.length === 0 && (
                  <div className="health-not-applicable">No hay integrantes a quienes aplique esta pregunta.</div>
                )}
                {applicableAffiliates.map((afiliado) => {
                  const answer = affiliateAnswers[afiliado.codigoAfiliado];
                  const status = getAffiliateQuestionStatus(salud, question, afiliado, afiliados);
                  return (
                    <div className="health-affiliate-answer" key={afiliado.id}>
                      <div className="health-affiliate-name">
                        <span>{afiliado.codigoAfiliado}</span>
                        <div><strong>{afiliado.nombreCompleto || `Afiliado #${afiliado.codigoAfiliado}`}</strong><small>{afiliado.parentesco}</small></div>
                      </div>
                      <div className="health-answer-buttons">
                        <button type="button" className={answer === 'NO' ? 'selected no' : ''} onClick={() => setAffiliateAnswer(question, afiliado.codigoAfiliado, 'NO')}>NO</button>
                        <button type="button" className={answer === 'SÍ' ? 'selected yes' : ''} onClick={() => setAffiliateAnswer(question, afiliado.codigoAfiliado, 'SÍ')}>SÍ</button>
                      </div>
                      <span className="health-affiliate-answer-status" style={{ color: statusMeta[status].color }}>{renderStatusIcon(status, 15)} {statusMeta[status].label}</span>
                    </div>
                  );
                })}
              </div>

              {yesAffiliates.length > 0 && (
                <div className="health-positive-details">
                  <div className="health-positive-details-title">
                    <Stethoscope size={19} />
                    <div><strong>Detalles de respuestas afirmativas</strong><span>Cada padecimiento o respuesta se registra de forma independiente.</span></div>
                  </div>
                  {yesAffiliates.map(renderDetailsForAffiliate)}
                </div>
              )}
            </>
          )}

          {questionStatus !== 'complete' && (
            <div className="health-inline-warning"><AlertCircle size={16} /> Complete las respuestas y detalles requeridos para obtener el check verde.</div>
          )}

          <div className="health-editor-navigation">
            <button type="button" className="btn-pill btn-pill-outline" disabled={currentQuestionIndex === 0} onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}>
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              type="button"
              className="btn-pill btn-pill-primary"
              onClick={completedQuestions === HEALTH_QUESTIONS.length ? onComplete : goToNextPending}
            >
              {completedQuestions === HEALTH_QUESTIONS.length ? 'Cuestionario completado' : 'Ir a la siguiente pendiente'}
              {completedQuestions === HEALTH_QUESTIONS.length ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Step4DeclaracionSalud;
