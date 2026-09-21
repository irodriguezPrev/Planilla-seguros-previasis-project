import { HealthQuestionItem } from '@/core/config/health-questions.config';
import {
  AfiliadoRow,
  AfeccionMedicaDetalle,
  DeclaracionSaludSection,
} from '@/core/interfaces/affiliation.interfaces';

export type HealthAnswer = 'SÍ' | 'NO';
export type HealthCompletionStatus = 'pending' | 'incomplete' | 'complete';
export type HealthDetailMode = NonNullable<HealthQuestionItem['detailMode']>;

export const getHealthDetailMode = (question: HealthQuestionItem): HealthDetailMode =>
  question.detailMode || 'clinical';

export const getAffiliateAnswers = (
  salud: DeclaracionSaludSection,
  question: HealthQuestionItem,
  afiliados: AfiliadoRow[],
): Partial<Record<number, HealthAnswer>> => {
  const savedQuestion = salud.preguntas[question.id];
  if (!savedQuestion) return {};

  if (savedQuestion.respuestasAfiliados) {
    return savedQuestion.respuestasAfiliados;
  }

  if (savedQuestion.respuesta === 'NO') {
    return Object.fromEntries(
      afiliados.map((afiliado) => [afiliado.codigoAfiliado, 'NO' as const]),
    );
  }

  const selectedCodes = savedQuestion.codigosAfiliados || [];
  if (selectedCodes.length === 0) return {};

  return Object.fromEntries(
    afiliados.map((afiliado) => [
      afiliado.codigoAfiliado,
      selectedCodes.includes(afiliado.codigoAfiliado) ? 'SÍ' as const : 'NO' as const,
    ]),
  );
};

export const isClinicalDetailComplete = (detail: AfeccionMedicaDetalle): boolean =>
  Boolean(
    detail.padecimiento.trim() &&
    detail.fechaDiagnostico.trim() &&
    detail.tratamientoPracticado.trim() &&
    detail.fechaUltimoChequeo.trim() &&
    detail.institucionHospitalaria.trim(),
  );

export const getAffiliateQuestionStatus = (
  salud: DeclaracionSaludSection,
  question: HealthQuestionItem,
  afiliado: AfiliadoRow,
  afiliados: AfiliadoRow[],
): HealthCompletionStatus => {
  const answer = getAffiliateAnswers(salud, question, afiliados)[afiliado.codigoAfiliado];
  if (!answer) return 'pending';
  if (answer === 'NO') return 'complete';

  const mode = getHealthDetailMode(question);
  if (mode === 'sport') {
    const detail = salud.detallesDeportivos?.find(
      (item) => item.codigoAfiliado === afiliado.codigoAfiliado,
    );
    return detail?.deporte.trim() && detail.frecuencia.trim() && detail.nivel
      ? 'complete'
      : 'incomplete';
  }

  if (mode === 'beneficiary') {
    const details = salud.detallesAclaracion?.[question.id]?.filter(
      (item) => item.codigoAfiliado === afiliado.codigoAfiliado,
    ) || [];
    return details.length > 0 && details.every((detail) => detail.campo1.trim() && detail.campo2.trim())
      ? 'complete'
      : 'incomplete';
  }

  if (mode === 'extra') {
    return salud.preguntas[question.id]?.detallesExtraPorAfiliado?.[afiliado.codigoAfiliado]?.trim()
      ? 'complete'
      : 'incomplete';
  }

  const clinicalDetails = salud.afeccionesDetalles.filter(
    (item) =>
      item.preguntaId === question.id &&
      Number(item.codigoAfiliado) === afiliado.codigoAfiliado,
  );
  return clinicalDetails.length > 0 && clinicalDetails.every(isClinicalDetailComplete)
    ? 'complete'
    : 'incomplete';
};

export const getQuestionStatus = (
  salud: DeclaracionSaludSection,
  question: HealthQuestionItem,
  afiliados: AfiliadoRow[],
): HealthCompletionStatus => {
  if (question.requiresBeneficiarySelection === false) {
    const savedQuestion = salud.preguntas[question.id];
    if (!savedQuestion) return 'pending';
    if (savedQuestion.respuesta === 'NO') return 'complete';

    const antecedent = savedQuestion.detalleAntecedente;
    return antecedent?.campo1.trim() && antecedent.campo2.trim()
      ? 'complete'
      : 'incomplete';
  }

  const statuses = afiliados.map((afiliado) =>
    getAffiliateQuestionStatus(salud, question, afiliado, afiliados),
  );
  if (statuses.every((status) => status === 'complete')) return 'complete';
  if (statuses.every((status) => status === 'pending')) return 'pending';
  return 'incomplete';
};
