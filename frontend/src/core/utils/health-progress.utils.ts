import { HealthQuestionItem } from '@/core/config/health-questions.config';
import {
  AffiliateRow,
  MedicalConditionDetail,
  HealthDeclarationSection,
} from '@/core/interfaces/affiliation.interfaces';

export type HealthAnswer = 'SÍ' | 'NO';
export type HealthCompletionStatus = 'pending' | 'incomplete' | 'complete';
export type HealthDetailMode = NonNullable<HealthQuestionItem['detailMode']>;

export const getHealthDetailMode = (question: HealthQuestionItem): HealthDetailMode =>
  question.detailMode || 'clinical';

export const isQuestionApplicableToAffiliate = (
  question: HealthQuestionItem,
  affiliate: AffiliateRow,
): boolean => !question.applicableSex || affiliate.sex === question.applicableSex;

export const getAffiliateAnswers = (
  healthDeclaration: HealthDeclarationSection,
  question: HealthQuestionItem,
  affiliates: AffiliateRow[],
): Partial<Record<number, HealthAnswer>> => {
  const savedQuestion = healthDeclaration.questions[question.id];
  if (!savedQuestion) return {};

  if (savedQuestion.affiliateAnswers) {
    return savedQuestion.affiliateAnswers;
  }

  if (savedQuestion.answer === 'NO') {
    return Object.fromEntries(
      affiliates.map((affiliate) => [affiliate.affiliateCode, 'NO' as const]),
    );
  }

  const selectedCodes = savedQuestion.affiliateCodes || [];
  if (selectedCodes.length === 0) return {};

  return Object.fromEntries(
    affiliates.map((affiliate) => [
      affiliate.affiliateCode,
      selectedCodes.includes(affiliate.affiliateCode) ? 'SÍ' as const : 'NO' as const,
    ]),
  );
};

export const isClinicalDetailComplete = (detail: MedicalConditionDetail): boolean =>
  Boolean(
    detail.condition.trim() &&
    detail.diagnosisDate.trim() &&
    detail.treatment.trim(),
  );

export const getAffiliateQuestionStatus = (
  healthDeclaration: HealthDeclarationSection,
  question: HealthQuestionItem,
  affiliate: AffiliateRow,
  affiliates: AffiliateRow[],
): HealthCompletionStatus => {
  if (!isQuestionApplicableToAffiliate(question, affiliate)) return 'complete';

  const answer = getAffiliateAnswers(healthDeclaration, question, affiliates)[affiliate.affiliateCode];
  if (!answer) return 'pending';
  if (answer === 'NO') return 'complete';

  const mode = getHealthDetailMode(question);
  if (mode === 'sport') {
    const details = healthDeclaration.sportDetails?.filter(
      (item) => item.affiliateCode === affiliate.affiliateCode,
    ) || [];
    return details.length > 0 && details.every(
      (detail) => detail.sport.trim() && detail.frequency.trim() && detail.level,
    )
      ? 'complete'
      : 'incomplete';
  }

  if (mode === 'beneficiary') {
    const details = healthDeclaration.clarificationDetails?.[question.id]?.filter(
      (item) => item.affiliateCode === affiliate.affiliateCode,
    ) || [];
    return details.length > 0 && details.every((detail) => detail.field1.trim() && detail.field2.trim())
      ? 'complete'
      : 'incomplete';
  }

  if (mode === 'extra') {
    return healthDeclaration.questions[question.id]?.extraDetailsByAffiliate?.[affiliate.affiliateCode]?.trim()
      ? 'complete'
      : 'incomplete';
  }

  const clinicalDetails = healthDeclaration.medicalConditionDetails.filter(
    (item) =>
      item.questionId === question.id &&
      Number(item.affiliateCode) === affiliate.affiliateCode,
  );
  return clinicalDetails.length > 0 && clinicalDetails.every(isClinicalDetailComplete)
    ? 'complete'
    : 'incomplete';
};

export const getQuestionStatus = (
  healthDeclaration: HealthDeclarationSection,
  question: HealthQuestionItem,
  affiliates: AffiliateRow[],
): HealthCompletionStatus => {
  if (question.requiresBeneficiarySelection === false) {
    const savedQuestion = healthDeclaration.questions[question.id];
    if (!savedQuestion) return 'pending';
    if (savedQuestion.answer === 'NO') return 'complete';

    const antecedent = savedQuestion.antecedentDetail;
    const field1Complete = question.antecedentFields?.field1Required === false || antecedent?.field1.trim();
    return field1Complete && antecedent?.field2.trim()
      ? 'complete'
      : 'incomplete';
  }

  const applicableAffiliates = affiliates.filter((affiliate) =>
    isQuestionApplicableToAffiliate(question, affiliate),
  );
  if (applicableAffiliates.length === 0) return 'complete';

  const statuses = applicableAffiliates.map((affiliate) =>
    getAffiliateQuestionStatus(healthDeclaration, question, affiliate, affiliates),
  );
  if (statuses.every((status) => status === 'complete')) return 'complete';
  if (statuses.every((status) => status === 'pending')) return 'pending';
  return 'incomplete';
};
