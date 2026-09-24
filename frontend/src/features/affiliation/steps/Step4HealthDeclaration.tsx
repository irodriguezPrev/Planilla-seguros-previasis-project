'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ContextualTooltip } from '@/components/common/ContextualTooltip';
import {
  AffiliateRow,
  MedicalConditionDetail,
  HealthDeclarationSection,
  SportDetail,
} from '@/core/interfaces/affiliation.interfaces';
import {
  getHealthQuestions,
  HEALTH_QUESTION_FILLING_GROUPS,
  HealthQuestionItem,
  ResolvedHealthQuestionItem,
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
  healthDeclaration: HealthDeclarationSection;
  affiliates: AffiliateRow[];
  onHealthChange: (healthDeclaration: HealthDeclarationSection) => void;
  onComplete: () => void;
}

const makeId = () => Math.random().toString(36).substring(2, 10);

const statusMeta: Record<HealthCompletionStatus, { labelKey: string; color: string; background: string }> = {
  pending: { labelKey: 'pending', color: '#64748b', background: '#f1f5f9' },
  incomplete: { labelKey: 'incomplete', color: '#b45309', background: '#fff7ed' },
  complete: { labelKey: 'complete', color: '#008b47', background: '#ecfdf5' },
};

const capitalizeCondition = (value: string): string => {
  const trimmed = value.trim();
  return trimmed ? `${trimmed.charAt(0).toLocaleUpperCase('es-VE')}${trimmed.slice(1)}` : '';
};

const capitalizeConditionText = (value: string): string =>
  value.replace(/(^|[,;\n]\s*)([a-záéíóúüñ])/giu, (_match, separator: string, letter: string) =>
    `${separator}${letter.toLocaleUpperCase('es-VE')}`,
  );

const getSuggestedConditions = (question: ResolvedHealthQuestionItem): string[] =>
  question.description
    .replace(/\betc\.?$/i, '')
    .split(',')
    .map((condition) => capitalizeCondition(condition.replace(/[.?]+$/, '')))
    .filter((condition) => condition.length > 2 && condition.length < 65);

export const Step4HealthDeclaration: React.FC<Step4Props> = ({
  healthDeclaration,
  affiliates,
  onHealthChange,
  onComplete,
}) => {
  const t = useTranslations('health');
  const tHealthQuestions = useTranslations('healthQuestions');
  const tHealthGroups = useTranslations('healthGroups');
  const HEALTH_QUESTIONS = getHealthQuestions(tHealthQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [otherConditions, setOtherConditions] = useState<Record<string, string>>({});
  const [expandedGroupAnswers, setExpandedGroupAnswers] = useState<Record<string, boolean>>({});
  const getAffiliateName = (affiliate: AffiliateRow) =>
    affiliate.fullName || t('affiliateNumber', { code: affiliate.affiliateCode });

  const currentGroup = HEALTH_QUESTION_FILLING_GROUPS[currentQuestionIndex];
  const groupQuestions = currentGroup.questionIds.map(
    (id) => HEALTH_QUESTIONS.find((item) => item.id === id)!,
  );
  const groupApplicableAffiliates = affiliates.filter((affiliate) =>
    groupQuestions.some((item) =>
      item.requiresBeneficiarySelection !== false && isQuestionApplicableToAffiliate(item, affiliate),
    ),
  );
  const question = groupQuestions.find((item) => item.id === currentQuestionId) || groupQuestions[0];
  const questionState = healthDeclaration.questions[question.id];
  const applicableAffiliates = affiliates.filter((affiliate) =>
    isQuestionApplicableToAffiliate(question, affiliate),
  );
  const affiliateAnswers = getAffiliateAnswers(healthDeclaration, question, affiliates);
  const yesAffiliates = applicableAffiliates.filter(
    (affiliate) => affiliateAnswers[affiliate.affiliateCode] === 'SÍ',
  );
  const questionStatus = getQuestionStatus(healthDeclaration, question, affiliates);
  const getGroupStatus = (questionIds: number[]): HealthCompletionStatus => {
    const statuses = questionIds.map((id) => getQuestionStatus(
      healthDeclaration,
      HEALTH_QUESTIONS.find((item) => item.id === id)!,
      affiliates,
    ));
    if (statuses.every((status) => status === 'complete')) return 'complete';
    if (statuses.every((status) => status === 'pending')) return 'pending';
    return 'incomplete';
  };
  const completedQuestions = HEALTH_QUESTION_FILLING_GROUPS.filter(
    (group) => getGroupStatus(group.questionIds) === 'complete',
  ).length;
  const incompleteQuestions = HEALTH_QUESTION_FILLING_GROUPS.filter(
    (group) => getGroupStatus(group.questionIds) === 'incomplete',
  ).length;
  const progressPercent = Math.round((completedQuestions / HEALTH_QUESTION_FILLING_GROUPS.length) * 100);

  const syncQuestionSummary = (
    current: HealthDeclarationSection['questions'][number],
    answers: Partial<Record<number, HealthAnswer>>,
    extraByAffiliate = current.extraDetailsByAffiliate,
    targetQuestion = question,
  ) => {
    const targetAffiliates = affiliates.filter((affiliate) =>
      isQuestionApplicableToAffiliate(targetQuestion, affiliate),
    );
    const applicableCodes = new Set(targetAffiliates.map((affiliate) => affiliate.affiliateCode));
    const applicableAnswers = Object.fromEntries(
      Object.entries(answers).filter(([code]) => applicableCodes.has(Number(code))),
    );
    const applicableExtraDetails = Object.fromEntries(
      Object.entries(extraByAffiliate || {}).filter(([code]) => applicableCodes.has(Number(code))),
    );
    const yesCodes = targetAffiliates
      .filter((affiliate) => answers[affiliate.affiliateCode] === 'SÍ')
      .map((affiliate) => affiliate.affiliateCode);
    const extraSummary = Object.entries(applicableExtraDetails)
      .filter(([, value]) => value?.trim())
      .map(([code, value]) => `#${code}: ${value}`)
      .join(' | ');

    return {
      ...current,
      answer: yesCodes.length > 0 ? 'SÍ' as const : 'NO' as const,
      affiliateCodes: yesCodes,
      affiliateAnswers: applicableAnswers,
      extraDetailsByAffiliate: applicableExtraDetails,
      extraDetails: extraSummary || undefined,
    };
  };

  const setAffiliateAnswer = (
    currentQuestion: HealthQuestionItem,
    affiliateCode: number,
    answer: HealthAnswer,
  ) => {
    const current = healthDeclaration.questions[currentQuestion.id] || { answer: 'NO' as const };
    const answers = {
      ...getAffiliateAnswers(healthDeclaration, currentQuestion, affiliates),
      [affiliateCode]: answer,
    };
    const mode = getHealthDetailMode(currentQuestion);
    let sportDetails = [...(healthDeclaration.sportDetails || [])];
    let clarificationDetails = { ...(healthDeclaration.clarificationDetails || {}) };
    let conditionDetails = [...healthDeclaration.medicalConditionDetails];
    const extraByAffiliate = { ...(current.extraDetailsByAffiliate || {}) };

    if (answer === 'NO') {
      if (mode === 'sport') {
        sportDetails = sportDetails.filter(
          (detail) => detail.affiliateCode !== affiliateCode,
        );
      }
      if (mode === 'beneficiary') {
        clarificationDetails[currentQuestion.id] = (clarificationDetails[currentQuestion.id] || [])
          .filter((detail) => detail.affiliateCode !== affiliateCode);
      }
      if (mode === 'clinical') {
        conditionDetails = conditionDetails.filter(
          (detail) => !(
            detail.questionId === currentQuestion.id &&
            Number(detail.affiliateCode) === affiliateCode
          ),
        );
      }
      delete extraByAffiliate[affiliateCode];
    }

    if (answer === 'SÍ' && mode === 'sport' && !sportDetails.some(
      (detail) => detail.affiliateCode === affiliateCode,
    )) {
      sportDetails.push({ id: makeId(), affiliateCode, sport: '', frequency: '', level: '' });
    }

    if (answer === 'SÍ' && mode === 'beneficiary' && !(clarificationDetails[currentQuestion.id] || []).some(
      (detail) => detail.affiliateCode === affiliateCode,
    )) {
      clarificationDetails[currentQuestion.id] = [
        ...(clarificationDetails[currentQuestion.id] || []),
        { id: makeId(), affiliateCode, field1: '', field2: '' },
      ];
    }

    onHealthChange({
      ...healthDeclaration,
      questions: {
        ...healthDeclaration.questions,
        [currentQuestion.id]: syncQuestionSummary(current, answers, extraByAffiliate, currentQuestion),
      },
      sportDetails,
      clarificationDetails,
      medicalConditionDetails: conditionDetails,
    });
  };

  const answerNoForEveryone = (currentQuestion: HealthQuestionItem) => {
    const applicable = affiliates.filter((affiliate) =>
      isQuestionApplicableToAffiliate(currentQuestion, affiliate),
    );
    const current = healthDeclaration.questions[currentQuestion.id] || { answer: 'NO' as const };
    const answers = Object.fromEntries(
      applicable.map((affiliate) => [affiliate.affiliateCode, 'NO' as const]),
    );
    const affiliateCodes = new Set(applicable.map((affiliate) => affiliate.affiliateCode));

    onHealthChange({
      ...healthDeclaration,
      questions: {
        ...healthDeclaration.questions,
        [currentQuestion.id]: syncQuestionSummary(current, answers, {}, currentQuestion),
      },
      sportDetails: getHealthDetailMode(currentQuestion) === 'sport'
        ? (healthDeclaration.sportDetails || []).filter((detail) => !affiliateCodes.has(detail.affiliateCode))
        : healthDeclaration.sportDetails,
      clarificationDetails: getHealthDetailMode(currentQuestion) === 'beneficiary'
        ? { ...(healthDeclaration.clarificationDetails || {}), [currentQuestion.id]: [] }
        : healthDeclaration.clarificationDetails,
      medicalConditionDetails: healthDeclaration.medicalConditionDetails.filter(
        (detail) => detail.questionId !== currentQuestion.id,
      ),
    });
  };

  const answerNoForCurrentGroup = () => {
    const groupQuestionIds = new Set(currentGroup.questionIds);
    const questions = { ...healthDeclaration.questions };
    const clarificationDetails = { ...(healthDeclaration.clarificationDetails || {}) };

    groupQuestions.forEach((item) => {
      if (item.requiresBeneficiarySelection === false) {
        questions[item.id] = { ...questions[item.id], answer: 'NO', antecedentDetail: undefined };
      } else {
        const applicable = affiliates.filter((affiliate) => isQuestionApplicableToAffiliate(item, affiliate));
        questions[item.id] = {
          ...questions[item.id],
          answer: 'NO',
          affiliateCodes: [],
          affiliateAnswers: Object.fromEntries(
            applicable.map((affiliate) => [affiliate.affiliateCode, 'NO' as const]),
          ),
          extraDetails: undefined,
          extraDetailsByAffiliate: {},
        };
      }
      clarificationDetails[item.id] = [];
    });

    setExpandedGroupAnswers((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== currentGroup.id && !key.startsWith(`${currentGroup.id}-`)),
    ));

    onHealthChange({
      ...healthDeclaration,
      questions,
      clarificationDetails,
      medicalConditionDetails: healthDeclaration.medicalConditionDetails.filter(
        (detail) => detail.questionId === undefined || !groupQuestionIds.has(detail.questionId),
      ),
      sportDetails: groupQuestionIds.has(17) ? [] : healthDeclaration.sportDetails,
    });
  };

  const answerNoForAffiliateGroup = (affiliateCode: number) => {
    const groupQuestionIds = new Set(currentGroup.questionIds);
    const questions = { ...healthDeclaration.questions };
    const clarificationDetails = { ...(healthDeclaration.clarificationDetails || {}) };

    groupQuestions.forEach((item) => {
      const affiliate = affiliates.find((candidate) => candidate.affiliateCode === affiliateCode);
      if (!affiliate || !isQuestionApplicableToAffiliate(item, affiliate)) return;
      const current = healthDeclaration.questions[item.id] || { answer: 'NO' as const };
      const answers = getAffiliateAnswers(healthDeclaration, item, affiliates);
      questions[item.id] = syncQuestionSummary(
        current,
        { ...answers, [affiliateCode]: 'NO' },
        Object.fromEntries(
          Object.entries(current.extraDetailsByAffiliate || {}).filter(([code]) => Number(code) !== affiliateCode),
        ),
        item,
      );
      clarificationDetails[item.id] = (clarificationDetails[item.id] || []).filter(
        (detail) => detail.affiliateCode !== affiliateCode,
      );
    });

    setExpandedGroupAnswers((current) => ({
      ...current,
      [`${currentGroup.id}-${affiliateCode}`]: false,
    }));
    onHealthChange({
      ...healthDeclaration,
      questions,
      clarificationDetails,
      medicalConditionDetails: healthDeclaration.medicalConditionDetails.filter(
        (detail) => !(
          detail.questionId !== undefined &&
          groupQuestionIds.has(detail.questionId) &&
          Number(detail.affiliateCode) === affiliateCode
        ),
      ),
      sportDetails: groupQuestionIds.has(17)
        ? (healthDeclaration.sportDetails || []).filter((detail) => detail.affiliateCode !== affiliateCode)
        : healthDeclaration.sportDetails,
    });
  };

  const activateQuickOption = (
    targetQuestion: HealthQuestionItem,
    affiliateCode: number,
    option?: string,
  ) => {
    const current = healthDeclaration.questions[targetQuestion.id] || { answer: 'NO' as const };
    const answers = {
      ...getAffiliateAnswers(healthDeclaration, targetQuestion, affiliates),
      [affiliateCode]: 'SÍ' as const,
    };
    const mode = getHealthDetailMode(targetQuestion);
    const questions = { ...healthDeclaration.questions };
    let medicalConditionDetails = [...healthDeclaration.medicalConditionDetails];
    const clarificationDetails = { ...(healthDeclaration.clarificationDetails || {}) };
    const normalizedOption = option?.trim().toLocaleLowerCase('es-VE');
    const existingClinicalMatch = mode === 'clinical' && normalizedOption
      ? medicalConditionDetails.some((detail) =>
          detail.questionId === targetQuestion.id &&
          Number(detail.affiliateCode) === affiliateCode &&
          detail.condition.trim().toLocaleLowerCase('es-VE') === normalizedOption
        )
      : false;
    const existingBeneficiaryDetails = clarificationDetails[targetQuestion.id] || [];
    const existingBeneficiaryMatch = mode === 'beneficiary' && existingBeneficiaryDetails.some((detail) =>
      detail.affiliateCode === affiliateCode &&
      (!normalizedOption || detail.field1.trim().toLocaleLowerCase('es-VE') === normalizedOption)
    );
    const existingExtraMatch = mode === 'extra' &&
      getAffiliateAnswers(healthDeclaration, targetQuestion, affiliates)[affiliateCode] === 'SÍ';
    const isSelected = existingClinicalMatch || existingBeneficiaryMatch || existingExtraMatch;

    if (isSelected) {
      let hasRemainingDetail = false;
      let extraDetailsByAffiliate = { ...(current.extraDetailsByAffiliate || {}) };

      if (mode === 'clinical') {
        medicalConditionDetails = medicalConditionDetails.filter((detail) => !(
          detail.questionId === targetQuestion.id &&
          Number(detail.affiliateCode) === affiliateCode &&
          detail.condition.trim().toLocaleLowerCase('es-VE') === normalizedOption
        ));
        hasRemainingDetail = medicalConditionDetails.some((detail) =>
          detail.questionId === targetQuestion.id && Number(detail.affiliateCode) === affiliateCode,
        );
      } else if (mode === 'beneficiary') {
        clarificationDetails[targetQuestion.id] = existingBeneficiaryDetails.filter((detail) => !(
          detail.affiliateCode === affiliateCode &&
          (!normalizedOption || detail.field1.trim().toLocaleLowerCase('es-VE') === normalizedOption)
        ));
        hasRemainingDetail = clarificationDetails[targetQuestion.id].some(
          (detail) => detail.affiliateCode === affiliateCode,
        );
      } else {
        delete extraDetailsByAffiliate[affiliateCode];
      }

      questions[targetQuestion.id] = syncQuestionSummary(
        current,
        { ...getAffiliateAnswers(healthDeclaration, targetQuestion, affiliates), [affiliateCode]: hasRemainingDetail ? 'SÍ' : 'NO' },
        extraDetailsByAffiliate,
        targetQuestion,
      );

      const anotherPositiveQuestion = groupQuestions.find((item) =>
        item.id !== targetQuestion.id &&
        getAffiliateAnswers(healthDeclaration, item, affiliates)[affiliateCode] === 'SÍ',
      );
      if (!hasRemainingDetail && !anotherPositiveQuestion) {
        setExpandedGroupAnswers((expanded) => ({
          ...expanded,
          [`${currentGroup.id}-${affiliateCode}`]: false,
        }));
      }

      setCurrentQuestionId(
        hasRemainingDetail ? targetQuestion.id : anotherPositiveQuestion?.id || targetQuestion.id,
      );
      onHealthChange({
        ...healthDeclaration,
        questions,
        medicalConditionDetails,
        clarificationDetails,
      });
      return;
    }

    if (mode === 'clinical' && option) {
      medicalConditionDetails.push({
        id: makeId(),
        questionId: targetQuestion.id,
        affiliateCode,
        condition: option,
        diagnosisDate: '',
        treatment: '',
        lastCheckupDate: '',
        hospital: '',
      });
    }

    if (mode === 'beneficiary') {
      const existing = clarificationDetails[targetQuestion.id] || [];
      if (!existing.some((detail) =>
        detail.affiliateCode === affiliateCode &&
        (!normalizedOption || detail.field1.trim().toLocaleLowerCase('es-VE') === normalizedOption)
      )) {
        clarificationDetails[targetQuestion.id] = [
          ...existing,
          { id: makeId(), affiliateCode, field1: option || '', field2: '' },
        ];
      }
    }

    groupQuestions.forEach((item) => {
      if (
        item.id === targetQuestion.id ||
        item.requiresBeneficiarySelection === false ||
        !isQuestionApplicableToAffiliate(item, affiliates.find((affiliate) => affiliate.affiliateCode === affiliateCode)!)
      ) return;
      const itemCurrent = healthDeclaration.questions[item.id] || { answer: 'NO' as const };
      const itemAnswers = getAffiliateAnswers(healthDeclaration, item, affiliates);
      if (!itemAnswers[affiliateCode]) {
        questions[item.id] = syncQuestionSummary(
          itemCurrent,
          { ...itemAnswers, [affiliateCode]: 'NO' },
          itemCurrent.extraDetailsByAffiliate,
          item,
        );
      }
    });

    questions[targetQuestion.id] = syncQuestionSummary(
      current,
      answers,
      current.extraDetailsByAffiliate,
      targetQuestion,
    );

    setCurrentQuestionId(targetQuestion.id);
    onHealthChange({
      ...healthDeclaration,
      questions,
      medicalConditionDetails,
      clarificationDetails,
    });
  };

  const activateGlobalQuickOption = (targetQuestion: HealthQuestionItem) => {
    const questions = { ...healthDeclaration.questions };
    const wasSelected = questions[targetQuestion.id]?.answer === 'SÍ';
    groupQuestions.forEach((item) => {
      const current = questions[item.id];
      if (item.id === targetQuestion.id) {
        questions[item.id] = {
          ...current,
          answer: wasSelected ? 'NO' : 'SÍ',
          antecedentDetail: wasSelected
            ? undefined
            : current?.antecedentDetail || { field1: '', field2: '' },
        };
      } else if (!current?.answer) {
        questions[item.id] = { answer: 'NO' };
      }
    });
    const anotherPositiveQuestion = groupQuestions.find((item) =>
      item.id !== targetQuestion.id && questions[item.id]?.answer === 'SÍ',
    );
    if (wasSelected && !anotherPositiveQuestion) {
      setExpandedGroupAnswers((current) => ({ ...current, [currentGroup.id]: false }));
    }
    setCurrentQuestionId(wasSelected ? anotherPositiveQuestion?.id || targetQuestion.id : targetQuestion.id);
    onHealthChange({ ...healthDeclaration, questions });
  };

  const setGlobalAnswer = (currentQuestion: HealthQuestionItem, answer: HealthAnswer) => {
    const current = healthDeclaration.questions[currentQuestion.id] || { answer: 'NO' as const };
    onHealthChange({
      ...healthDeclaration,
      questions: {
        ...healthDeclaration.questions,
        [currentQuestion.id]: {
          ...current,
          answer,
          antecedentDetail: answer === 'SÍ'
            ? current.antecedentDetail || { field1: '', field2: '' }
            : undefined,
        },
      },
    });
  };

  const addSportDetail = (affiliateCode: number) => {
    onHealthChange({
      ...healthDeclaration,
      sportDetails: [
        ...(healthDeclaration.sportDetails || []),
        { id: makeId(), affiliateCode, sport: '', frequency: '', level: '' },
      ],
    });
  };

  const updateSportDetail = (
    affiliateCode: number,
    sportIndex: number,
    fields: Partial<SportDetail>,
  ) => {
    let matchingIndex = -1;
    const details = (healthDeclaration.sportDetails || []).map((detail) => {
      if (detail.affiliateCode !== affiliateCode) return detail;
      matchingIndex += 1;
      return matchingIndex === sportIndex ? { ...detail, ...fields } : detail;
    });
    onHealthChange({ ...healthDeclaration, sportDetails: details });
  };

  const removeSportDetail = (affiliateCode: number, sportIndex: number) => {
    let matchingIndex = -1;
    const details = (healthDeclaration.sportDetails || []).filter((detail) => {
      if (detail.affiliateCode !== affiliateCode) return true;
      matchingIndex += 1;
      return matchingIndex !== sportIndex;
    });
    onHealthChange({ ...healthDeclaration, sportDetails: details });
  };

  const updateExtraDetail = (currentQuestion: HealthQuestionItem, affiliateCode: number, value: string) => {
    const current = healthDeclaration.questions[currentQuestion.id] || { answer: 'SÍ' as const };
    const answers = getAffiliateAnswers(healthDeclaration, currentQuestion, affiliates);
    const extraByAffiliate = {
      ...(current.extraDetailsByAffiliate || {}),
      [affiliateCode]: value,
    };
    onHealthChange({
      ...healthDeclaration,
      questions: {
        ...healthDeclaration.questions,
        [currentQuestion.id]: syncQuestionSummary(current, answers, extraByAffiliate, currentQuestion),
      },
    });
  };

  const updateAntecedent = (field: 'field1' | 'field2', value: string) => {
    const current = healthDeclaration.questions[question.id] || { answer: 'SÍ' as const };
    onHealthChange({
      ...healthDeclaration,
      questions: {
        ...healthDeclaration.questions,
        [question.id]: {
          ...current,
          antecedentDetail: {
            ...(current.antecedentDetail || { field1: '', field2: '' }),
            [field]: value,
          },
        },
      },
    });
  };

  const addBeneficiaryDetail = (currentQuestion: HealthQuestionItem, affiliateCode: number) => {
    const details = healthDeclaration.clarificationDetails || {};
    onHealthChange({
      ...healthDeclaration,
      clarificationDetails: {
        ...details,
        [currentQuestion.id]: [
          ...(details[currentQuestion.id] || []),
          { id: makeId(), affiliateCode, field1: '', field2: '' },
        ],
      },
    });
  };

  const updateBeneficiaryDetail = (
    currentQuestion: HealthQuestionItem,
    detailId: string | undefined,
    fallbackIndex: number,
    field: 'field1' | 'field2',
    value: string,
  ) => {
    const details = healthDeclaration.clarificationDetails || {};
    const updated = [...(details[currentQuestion.id] || [])];
    const index = detailId ? updated.findIndex((detail) => detail.id === detailId) : fallbackIndex;
    if (index < 0) return;
    updated[index] = { ...updated[index], [field]: value };
    onHealthChange({
      ...healthDeclaration,
      clarificationDetails: { ...details, [currentQuestion.id]: updated },
    });
  };

  const removeBeneficiaryDetail = (currentQuestion: HealthQuestionItem, detailId: string | undefined, fallbackIndex: number) => {
    const details = healthDeclaration.clarificationDetails || {};
    const updated = (details[currentQuestion.id] || []).filter(
      (detail, index) => detailId ? detail.id !== detailId : index !== fallbackIndex,
    );
    onHealthChange({
      ...healthDeclaration,
      clarificationDetails: { ...details, [currentQuestion.id]: updated },
    });
  };

  const toggleBeneficiaryDetailOption = (currentQuestion: HealthQuestionItem, affiliateCode: number, option: string) => {
    const detailsByQuestion = healthDeclaration.clarificationDetails || {};
    const currentDetails = [...(detailsByQuestion[currentQuestion.id] || [])];
    const normalizedOption = option.trim().toLocaleLowerCase('es-VE');
    const hasOption = currentDetails.some(
      (detail) =>
        detail.affiliateCode === affiliateCode &&
        detail.field1.trim().toLocaleLowerCase('es-VE') === normalizedOption,
    );

    let updatedDetails;
    if (hasOption) {
      updatedDetails = currentDetails.filter(
        (detail) => !(
          detail.affiliateCode === affiliateCode &&
          detail.field1.trim().toLocaleLowerCase('es-VE') === normalizedOption
        ),
      );
    } else {
      const emptyDetailIndex = currentDetails.findIndex(
        (detail) =>
          detail.affiliateCode === affiliateCode &&
          !detail.field1.trim() &&
          !detail.field2.trim(),
      );
      if (emptyDetailIndex >= 0) {
        updatedDetails = currentDetails.map((detail, index) =>
          index === emptyDetailIndex ? { ...detail, field1: option } : detail,
        );
      } else {
        updatedDetails = [
          ...currentDetails,
          { id: makeId(), affiliateCode, field1: option, field2: '' },
        ];
      }
    }

    onHealthChange({
      ...healthDeclaration,
      clarificationDetails: {
        ...detailsByQuestion,
        [currentQuestion.id]: updatedDetails,
      },
    });
  };

  const addClinicalConditions = (
    affiliateCode: number,
    rawValue: string,
    currentQuestion: HealthQuestionItem = question,
  ) => {
    const names = rawValue
      .split(/[,;\n]+/)
      .map(capitalizeCondition)
      .filter(Boolean);
    if (names.length === 0) return;

    const existingNames = new Set(
      healthDeclaration.medicalConditionDetails
        .filter((detail) =>
          detail.questionId === currentQuestion.id &&
          Number(detail.affiliateCode) === affiliateCode,
        )
        .map((detail) => detail.condition.trim().toLocaleLowerCase()),
    );
    const newDetails: MedicalConditionDetail[] = names
      .filter((name) => !existingNames.has(name.toLocaleLowerCase()))
      .map((conditionName) => ({
        id: makeId(),
        questionId: currentQuestion.id,
        affiliateCode,
        condition: conditionName,
        diagnosisDate: '',
        treatment: '',
        lastCheckupDate: '',
        hospital: '',
      }));

    if (newDetails.length > 0) {
      onHealthChange({
        ...healthDeclaration,
        medicalConditionDetails: [...healthDeclaration.medicalConditionDetails, ...newDetails],
      });
    }
  };

  const addGroupedClinicalConditions = (affiliateCode: number, rawValue: string) => {
    const targetQuestion = getHealthDetailMode(question) === 'clinical'
      ? question
      : groupQuestions.find((item) => getHealthDetailMode(item) === 'clinical');
    if (!targetQuestion) return;

    const names = rawValue
      .split(/[,;\n]+/)
      .map(capitalizeCondition)
      .filter(Boolean);
    if (names.length === 0) return;

    const existingNames = new Set(
      healthDeclaration.medicalConditionDetails
        .filter((detail) =>
          detail.questionId === targetQuestion.id &&
          Number(detail.affiliateCode) === affiliateCode,
        )
        .map((detail) => detail.condition.trim().toLocaleLowerCase('es-VE')),
    );
    const newDetails: MedicalConditionDetail[] = names
      .filter((name) => !existingNames.has(name.toLocaleLowerCase('es-VE')))
      .map((conditionName) => ({
        id: makeId(),
        questionId: targetQuestion.id,
        affiliateCode,
        condition: conditionName,
        diagnosisDate: '',
        treatment: '',
        lastCheckupDate: '',
        hospital: '',
      }));
    if (newDetails.length === 0) return;

    const questions = { ...healthDeclaration.questions };
    const targetCurrent = questions[targetQuestion.id] || { answer: 'NO' as const };
    questions[targetQuestion.id] = syncQuestionSummary(
      targetCurrent,
      {
        ...getAffiliateAnswers(healthDeclaration, targetQuestion, affiliates),
        [affiliateCode]: 'SÍ',
      },
      targetCurrent.extraDetailsByAffiliate,
      targetQuestion,
    );

    const affiliate = affiliates.find((item) => item.affiliateCode === affiliateCode);
    groupQuestions.forEach((item) => {
      if (
        item.id === targetQuestion.id ||
        item.requiresBeneficiarySelection === false ||
        !affiliate ||
        !isQuestionApplicableToAffiliate(item, affiliate)
      ) return;
      const itemAnswers = getAffiliateAnswers(healthDeclaration, item, affiliates);
      if (!itemAnswers[affiliateCode]) {
        const itemCurrent = questions[item.id] || { answer: 'NO' as const };
        questions[item.id] = syncQuestionSummary(
          itemCurrent,
          { ...itemAnswers, [affiliateCode]: 'NO' },
          itemCurrent.extraDetailsByAffiliate,
          item,
        );
      }
    });

    setCurrentQuestionId(targetQuestion.id);
    onHealthChange({
      ...healthDeclaration,
      questions,
      medicalConditionDetails: [...healthDeclaration.medicalConditionDetails, ...newDetails],
    });
  };

  const updateClinicalDetail = (id: string, fields: Partial<MedicalConditionDetail>) => {
    onHealthChange({
      ...healthDeclaration,
      medicalConditionDetails: healthDeclaration.medicalConditionDetails.map((detail) =>
        detail.id === id ? { ...detail, ...fields } : detail,
      ),
    });
  };

  const removeClinicalDetail = (id: string) => {
    onHealthChange({
      ...healthDeclaration,
      medicalConditionDetails: healthDeclaration.medicalConditionDetails.filter((detail) => detail.id !== id),
    });
  };

  const toggleClinicalCondition = (currentQuestion: HealthQuestionItem, affiliateCode: number, condition: string) => {
    const normalizedCondition = condition.trim().toLocaleLowerCase('es-VE');
    const matchingDetails = healthDeclaration.medicalConditionDetails.filter(
      (detail) =>
        detail.questionId === currentQuestion.id &&
        Number(detail.affiliateCode) === affiliateCode &&
        detail.condition.trim().toLocaleLowerCase('es-VE') === normalizedCondition,
    );

    if (matchingDetails.length > 0) {
      const matchingIds = new Set(matchingDetails.map((detail) => detail.id));
      onHealthChange({
        ...healthDeclaration,
        medicalConditionDetails: healthDeclaration.medicalConditionDetails.filter((detail) => !matchingIds.has(detail.id)),
      });
      return;
    }

    addClinicalConditions(affiliateCode, condition, currentQuestion);
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setCurrentQuestionId(null);
    document.getElementById('health-question-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToNextPending = () => {
    const pendingQuestionInGroup = groupQuestions.find(
      (item) => getQuestionStatus(healthDeclaration, item, affiliates) !== 'complete',
    );
    if (pendingQuestionInGroup && pendingQuestionInGroup.id !== question.id) {
      setCurrentQuestionId(pendingQuestionInGroup.id);
      document.getElementById('health-question-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const nextOffset = Array.from({ length: HEALTH_QUESTION_FILLING_GROUPS.length }, (_, offset) =>
      (currentQuestionIndex + offset + 1) % HEALTH_QUESTION_FILLING_GROUPS.length,
    ).find((index) => getGroupStatus(HEALTH_QUESTION_FILLING_GROUPS[index].questionIds) !== 'complete');
    goToQuestion(nextOffset ?? Math.min(currentQuestionIndex + 1, HEALTH_QUESTION_FILLING_GROUPS.length - 1));
  };

  const renderStatusIcon = (status: HealthCompletionStatus, size = 16) => {
    if (status === 'complete') return <CheckCircle2 size={size} />;
    if (status === 'incomplete') return <Clock3 size={size} />;
    return <Circle size={size} />;
  };

  const renderOtherConditionInput = (affiliate: AffiliateRow, grouped = false) => {
    const key = `${question.id}-${affiliate.affiliateCode}`;
    const value = otherConditions[key] || '';
    return (
      <div className="health-other-condition-block">
        <div className="health-other-condition-row">
          <div className="previasis-input-group">
            <label className="previasis-label">{t('otherCondition')}</label>
            <input
              type="text"
              className="previasis-input"
              placeholder={t('otherConditionPlaceholder')}
              value={value}
              onChange={(event) => setOtherConditions({
                ...otherConditions,
                [key]: capitalizeConditionText(event.target.value),
              })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (grouped) addGroupedClinicalConditions(affiliate.affiliateCode, value);
                  else addClinicalConditions(affiliate.affiliateCode, value);
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
              if (grouped) addGroupedClinicalConditions(affiliate.affiliateCode, value);
              else addClinicalConditions(affiliate.affiliateCode, value);
              setOtherConditions({ ...otherConditions, [key]: '' });
            }}
          >
            <PlusCircle size={15} /> {t('add')}
          </button>
        </div>
        <p className="health-helper-text">{t('separateWithCommas')}</p>
      </div>
    );
  };

  const renderClinicalDetails = (
    affiliate: AffiliateRow,
    showQuickOptions = true,
    currentQuestion: HealthQuestionItem = question,
  ) => {
    const details = healthDeclaration.medicalConditionDetails.filter(
      (detail) =>
        detail.questionId === currentQuestion.id &&
        Number(detail.affiliateCode) === affiliate.affiliateCode,
    );
    const suggestions = getSuggestedConditions(currentQuestion);

    return (
      <div className="health-detail-panel" key={`${affiliate.id}-${currentQuestion.id}`}>
        <div className="health-detail-heading">
          <div>
            <span>{t('clinicalDetailsOf')}</span>
            <strong>{getAffiliateName(affiliate)}</strong>
          </div>
          <span className="pill-badge">{t('codeHash', { code: affiliate.affiliateCode })}</span>
        </div>

        {showQuickOptions && (
          <div>
            <p className="previasis-label" style={{ marginBottom: '0.5rem' }}>{t('selectCondition')}</p>
            <div className="health-condition-chips">
              {suggestions.map((condition) => {
                const alreadyAdded = details.some(
                  (detail) => detail.condition.toLocaleLowerCase() === condition.toLocaleLowerCase(),
                );
                return (
                  <button
                    key={condition}
                    type="button"
                    className={`health-condition-chip ${alreadyAdded ? 'selected' : ''}`}
                    onClick={() => toggleClinicalCondition(currentQuestion, affiliate.affiliateCode, condition)}
                    aria-pressed={alreadyAdded}
                    title={alreadyAdded ? t('removeCondition', { condition }) : t('addCondition', { condition })}
                  >
                    {alreadyAdded && <Check size={13} />} {condition}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showQuickOptions && renderOtherConditionInput(affiliate)}

        {details.length === 0 && (
          <div className="health-inline-warning">
            <AlertCircle size={16} /> {t('addAtLeastOneCondition')}
          </div>
        )}

        {details.map((detail, index) => (
          <div className="health-clinical-card" key={detail.id}>
            <div className="health-detail-heading">
              <strong>{t('conditionNumber', { number: index + 1, condition: detail.condition })}</strong>
              <button type="button" className="health-delete-button" onClick={() => removeClinicalDetail(detail.id)}>
                <Trash2 size={14} /> {t('remove')}
              </button>
            </div>
            <div className="health-clinical-grid">
              <div className="previasis-input-group">
                <label className="previasis-label">{t('clinicalType')}</label>
                <input className="previasis-input" value={detail.condition} onChange={(event) => updateClinicalDetail(detail.id, { condition: event.target.value })} required />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">{t('clinicalDate')}</label>
                <input className="previasis-input" placeholder={t('clinicalDatePlaceholder')} value={detail.diagnosisDate} onChange={(event) => updateClinicalDetail(detail.id, { diagnosisDate: event.target.value })} required />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">{t('clinicalTreatment')}</label>
                <input className="previasis-input" placeholder={t('clinicalTreatmentPlaceholder')} value={detail.treatment} onChange={(event) => updateClinicalDetail(detail.id, { treatment: event.target.value })} required />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">{t('clinicalLastCheck')}</label>
                <input type="date" className="previasis-input" value={detail.lastCheckupDate} onChange={(event) => updateClinicalDetail(detail.id, { lastCheckupDate: event.target.value })} />
              </div>
              <div className="previasis-input-group health-clinical-wide">
                <label className="previasis-label">{t('clinicalInstitution')}</label>
                <input className="previasis-input" placeholder={t('clinicalInstitutionPlaceholder')} value={detail.hospital} onChange={(event) => updateClinicalDetail(detail.id, { hospital: event.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSportDetails = (affiliate: AffiliateRow) => {
    const details = (healthDeclaration.sportDetails || []).filter(
      (item) => item.affiliateCode === affiliate.affiliateCode,
    );
    return (
      <div className="health-detail-panel" key={affiliate.id}>
        <div className="health-detail-heading">
          <strong>{getAffiliateName(affiliate)}</strong>
          <button type="button" className="btn-pill btn-pill-outline" onClick={() => addSportDetail(affiliate.affiliateCode)}>
            <PlusCircle size={14} /> {t('addAnotherSport')}
          </button>
        </div>
        {details.length === 0 && (
          <div className="health-not-applicable">{t('addAtLeastOneSport')}</div>

        )}
        {details.map((detail, index) => (
          <div className="health-sport-entry" key={detail.id || `${affiliate.id}-${index}`}>
            <div className="health-sport-entry-heading">
              <span>{t('sport')} #{index + 1}</span>
              <button type="button" className="health-delete-button" onClick={() => removeSportDetail(affiliate.affiliateCode, index)}>
                <Trash2 size={14} /> {t('remove')}
              </button>
            </div>
            <div className="health-special-detail-grid health-special-detail-grid-3">
              <div className="previasis-input-group">
                <label className="previasis-label">{t('sport')}</label>
                <input className="previasis-input" value={detail.sport} placeholder={t('sportPlaceholder')} onChange={(event) => updateSportDetail(affiliate.affiliateCode, index, { sport: event.target.value })} required />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">{t('frequency')}</label>
                <input className="previasis-input" value={detail.frequency} placeholder={t('frequencyPlaceholder')} onChange={(event) => updateSportDetail(affiliate.affiliateCode, index, { frequency: event.target.value })} required />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">{t('level')}</label>
                <select className="previasis-input" value={detail.level} onChange={(event) => updateSportDetail(affiliate.affiliateCode, index, { level: event.target.value as SportDetail['level'] })} required>
                  <option value="">{t('select')}</option>
                  <option value="Amateur">{t('amateur')}</option>
                  <option value="Profesional">{t('professional')}</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBeneficiaryDetails = (
    affiliate: AffiliateRow,
    showQuickOptions = true,
    currentQuestion: HealthQuestionItem = question,
  ) => {
    const allDetails = healthDeclaration.clarificationDetails?.[currentQuestion.id] || [];
    const details = allDetails
      .map((detail, index) => ({ detail, originalIndex: index }))
      .filter(({ detail }) => detail.affiliateCode === affiliate.affiliateCode);
    return (
      <div className="health-detail-panel" key={`${affiliate.id}-${currentQuestion.id}`}>
        <div className="health-detail-heading">
          <strong>{getAffiliateName(affiliate)}</strong>
          <button type="button" className="btn-pill btn-pill-outline" onClick={() => addBeneficiaryDetail(currentQuestion, affiliate.affiliateCode)}>
            <PlusCircle size={14} /> {t('addAnotherDetail')}
          </button>
        </div>
        {showQuickOptions && currentQuestion.beneficiaryDetailOptions?.field1 && (
          <div>
            <p className="previasis-label" style={{ marginBottom: '0.5rem' }}>{t('selectEventType')}</p>
            <div className="health-condition-chips">
              {currentQuestion.beneficiaryDetailOptions.field1.map((option) => {
                const isSelected = details.some(
                  ({ detail }) => detail.field1.trim().toLocaleLowerCase('es-VE') === option.toLocaleLowerCase('es-VE'),
                );
                return (
                  <button
                    key={option}
                    type="button"
                    className={`health-condition-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleBeneficiaryDetailOption(currentQuestion, affiliate.affiliateCode, option)}
                    aria-pressed={isSelected}
                    title={isSelected ? t('removeDetail') : t('addCondition', { condition: option })}
                  >
                    {isSelected && <Check size={13} />} {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {details.map(({ detail, originalIndex }, localIndex) => (
          <div className="health-beneficiary-detail" key={detail.id || `${detail.affiliateCode}-${originalIndex}`}>
            <span className="health-detail-number">#{localIndex + 1}</span>
            <div className="previasis-input-group">
              <label className="previasis-label">{currentQuestion.beneficiaryDetailLabels?.field1} *</label>
              <input className="previasis-input" placeholder={currentQuestion.beneficiaryDetailPlaceholders?.field1} value={detail.field1} onChange={(event) => updateBeneficiaryDetail(currentQuestion, detail.id, originalIndex, 'field1', event.target.value)} required />
            </div>
            <div className="previasis-input-group">
              <label className="previasis-label">{currentQuestion.beneficiaryDetailLabels?.field2} *</label>
              <input className="previasis-input" placeholder={currentQuestion.beneficiaryDetailPlaceholders?.field2} value={detail.field2} onChange={(event) => updateBeneficiaryDetail(currentQuestion, detail.id, originalIndex, 'field2', event.target.value)} required />
            </div>
            {details.length > 1 && (
              <button type="button" className="health-delete-icon" title={t('removeDetail')} onClick={() => removeBeneficiaryDetail(currentQuestion, detail.id, originalIndex)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderExtraDetail = (affiliate: AffiliateRow, currentQuestion: HealthQuestionItem = question) => {
    const currentQuestionState = healthDeclaration.questions[currentQuestion.id];
    const currentYesAffiliates = affiliates.filter((item) =>
      getAffiliateAnswers(healthDeclaration, currentQuestion, affiliates)[item.affiliateCode] === 'SÍ',
    );
    const legacyValue = currentYesAffiliates.length === 1 ? currentQuestionState?.extraDetails || '' : '';
    const value = currentQuestionState?.extraDetailsByAffiliate?.[affiliate.affiliateCode] ?? legacyValue;
    return (
      <div className="health-detail-panel" key={`${affiliate.id}-${currentQuestion.id}`}>
        <div className="health-detail-heading">
          <strong>{getAffiliateName(affiliate)}</strong>
          <span className="pill-badge">{t('requiredInfo')}</span>
        </div>
        <div className="previasis-input-group">
          <label className="previasis-label">{currentQuestion.extraInputLabel || t('extraInputFallback')} *</label>
          <textarea className="previasis-input" rows={3} placeholder={currentQuestion.extraInputPlaceholder} value={value} onChange={(event) => updateExtraDetail(currentQuestion, affiliate.affiliateCode, event.target.value)} required />
        </div>
      </div>
    );
  };

  const renderDetailsForAffiliate = (
    affiliate: AffiliateRow,
    showQuickOptions = true,
    currentQuestion: HealthQuestionItem = question,
  ) => {
    const currentDetailMode = getHealthDetailMode(currentQuestion);
    if (currentDetailMode === 'sport') return renderSportDetails(affiliate);
    if (currentDetailMode === 'beneficiary') return renderBeneficiaryDetails(affiliate, showQuickOptions, currentQuestion);
    if (currentDetailMode === 'extra') return renderExtraDetail(affiliate, currentQuestion);
    return renderClinicalDetails(affiliate, showQuickOptions, currentQuestion);
  };

  const getGroupedAffiliateAnswer = (affiliate: AffiliateRow): HealthAnswer | undefined => {
    const answers = groupQuestions
      .filter((item) => item.requiresBeneficiarySelection !== false && isQuestionApplicableToAffiliate(item, affiliate))
      .map((item) => getAffiliateAnswers(healthDeclaration, item, affiliates)[affiliate.affiliateCode]);
    if (answers.some((answer) => answer === 'SÍ')) return 'SÍ';
    if (answers.length > 0 && answers.every((answer) => answer === 'NO')) return 'NO';
    return undefined;
  };

  const getGroupedAffiliateStatus = (
    affiliate: AffiliateRow,
    expanded: boolean,
  ): HealthCompletionStatus => {
    const statuses = groupQuestions
      .filter((item) => item.requiresBeneficiarySelection !== false && isQuestionApplicableToAffiliate(item, affiliate))
      .map((item) => getAffiliateQuestionStatus(healthDeclaration, item, affiliate, affiliates));
    if (expanded && getGroupedAffiliateAnswer(affiliate) !== 'SÍ') return 'incomplete';
    if (statuses.length > 0 && statuses.every((status) => status === 'complete')) return 'complete';
    if (statuses.length === 0 || statuses.every((status) => status === 'pending')) return 'pending';
    return 'incomplete';
  };

  const renderGroupedQuickOptions = (affiliate: AffiliateRow) => groupQuestions
    .filter((item) => item.requiresBeneficiarySelection !== false && isQuestionApplicableToAffiliate(item, affiliate))
    .map((item) => {
      const mode = getHealthDetailMode(item);
      const quickOptions = mode === 'clinical'
        ? getSuggestedConditions(item)
        : item.beneficiaryDetailOptions?.field1 || [item.title];
      return (
        <div className="health-group-option-category" key={item.id}>
          <small>{item.title}</small>
          <div className="health-condition-chips">
            {quickOptions.map((option) => {
              const selected = mode === 'clinical'
                ? healthDeclaration.medicalConditionDetails.some((detail) =>
                    detail.questionId === item.id &&
                    Number(detail.affiliateCode) === affiliate.affiliateCode &&
                    detail.condition.trim().toLocaleLowerCase('es-VE') === option.trim().toLocaleLowerCase('es-VE')
                  )
                : mode === 'beneficiary'
                  ? (healthDeclaration.clarificationDetails?.[item.id] || []).some((detail) =>
                      detail.affiliateCode === affiliate.affiliateCode &&
                      (!item.beneficiaryDetailOptions?.field1 || detail.field1.trim().toLocaleLowerCase('es-VE') === option.trim().toLocaleLowerCase('es-VE'))
                    )
                  : getAffiliateAnswers(healthDeclaration, item, affiliates)[affiliate.affiliateCode] === 'SÍ';
              return (
                <button
                  type="button"
                  className={`health-condition-chip ${selected ? 'selected' : ''}`}
                  key={option}
                  onClick={() => activateQuickOption(
                    item,
                    affiliate.affiliateCode,
                    mode === 'clinical' || item.beneficiaryDetailOptions?.field1 ? option : undefined,
                  )}
                >
                  {selected && <Check size={13} />} {option}
                </button>
              );
            })}
          </div>
        </div>
      );
    });

  return (
    <div className="health-assistant">
      <div className="previasis-card health-assistant-summary">
        <div className="health-assistant-header">
          <div className="health-title-block">
            <div className="health-title-icon"><HeartPulse size={22} /></div>
            <div>
              <h3>{t('title')}</h3>
              <p>{t('subtitle')}</p>
            </div>
          </div>
          <div className="health-progress-copy">
            <span>{t('completedOf', { completed: completedQuestions, total: HEALTH_QUESTION_FILLING_GROUPS.length })}</span>
          </div>
        </div>

        <div className="health-progress-track"><div style={{ width: `${progressPercent}%` }} /></div>

        <div className="health-member-progress-list">
          {affiliates.map((affiliate) => {
            const applicableQuestions = HEALTH_QUESTION_FILLING_GROUPS.filter(
              (group) => group.questionIds.some((questionId) => {
                const item = HEALTH_QUESTIONS.find((candidate) => candidate.id === questionId)!;
                return item.requiresBeneficiarySelection !== false &&
                  isQuestionApplicableToAffiliate(item, affiliate);
              }),
            );
            const completeCount = applicableQuestions.filter((group) =>
              group.questionIds
                .map((questionId) => HEALTH_QUESTIONS.find((item) => item.id === questionId)!)
                .filter((item) => item.requiresBeneficiarySelection !== false && isQuestionApplicableToAffiliate(item, affiliate))
                .every((item) => getAffiliateQuestionStatus(
                  healthDeclaration,
                  item,
                  affiliate,
                  affiliates,
                ) === 'complete'),
            ).length;
            return (
              <div className="health-member-progress" key={affiliate.id}>
                <div className="health-member-avatar">{affiliate.affiliateCode}</div>
                <div>
                  <strong>{getAffiliateName(affiliate)}</strong>
                  <span>{t('answersOf', { complete: completeCount, total: applicableQuestions.length })}</span>
                </div>
                {completeCount === applicableQuestions.length && <CheckCircle2 size={20} />}
              </div>
            );
          })}
        </div>

        <div className="health-status-legend">
          <span><Circle size={13} /> {t('pending')}</span>
          <span className="incomplete"><Clock3 size={13} /> {t('incomplete')}</span>
          <span className="complete"><CheckCircle2 size={13} /> {t('complete')}</span>
          {incompleteQuestions > 0 && <strong>{t('withPending', { count: incompleteQuestions })}</strong>}
        </div>
      </div>

      <div className="health-workspace">
        
        <aside className="previasis-card health-question-navigator">
          <div className="health-navigator-title">
            <ListChecks size={19} />
            <div><strong>{t('questionCount')}</strong><span>{t('selectToEdit')}</span></div>
          </div>
          <div className="health-question-list">
            {HEALTH_QUESTION_FILLING_GROUPS.map((item, index) => {
              const status = getGroupStatus(item.questionIds);
              const meta = statusMeta[status];
              return (
                <button type="button" key={item.id} className={`health-question-nav-item ${index === currentQuestionIndex ? 'active' : ''}`} onClick={() => goToQuestion(index)}>
                  <span className="health-question-number">{index + 1}</span>
                  <span className="health-question-nav-copy">
                    <strong>{tHealthGroups(`${item.id}.title`)}</strong>
                    <small style={{ color: meta.color }}>{renderStatusIcon(status, 12)} {t(meta.labelKey)}</small>
                  </span>
                  <span className="health-question-status-icon" style={{ color: meta.color, backgroundColor: meta.background }}>{renderStatusIcon(status)}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section id="health-question-editor" className="previasis-card health-question-editor">
          <div className="health-editor-heading">
            <div className="health-question-badge">{currentQuestionIndex + 1}</div>
            <div className="contextual-tooltip-host">
              <span>{t('questionOf', { current: currentQuestionIndex + 1, total: HEALTH_QUESTION_FILLING_GROUPS.length })}</span>
              <h4>
                {tHealthGroups(`${currentGroup.id}.title`)}
                {groupQuestions.length > 1 && (
                  <ContextualTooltip
                    text={t('combinedQuestionHint')}
                    label={t('showCombinedQuestionHelp')}
                  />
                )}
              </h4>
              <p>{tHealthGroups(`${currentGroup.id}.prompt`)}</p>
            </div>
            <div className="health-editor-status" style={{ color: statusMeta[getGroupStatus(currentGroup.questionIds)].color, backgroundColor: statusMeta[getGroupStatus(currentGroup.questionIds)].background }}>
              {renderStatusIcon(getGroupStatus(currentGroup.questionIds))} {t(statusMeta[getGroupStatus(currentGroup.questionIds)].labelKey)}
            </div>
          </div>

          {groupQuestions.length > 1 ? (
            groupQuestions.every((item) => item.requiresBeneficiarySelection === false) ? (
              <div className="health-global-answer">
                <p className="previasis-label">{t('selectGlobal')}</p>
                <div className="health-answer-buttons">
                  <button type="button" className={groupQuestions.every((item) => healthDeclaration.questions[item.id]?.answer === 'NO') && !expandedGroupAnswers[currentGroup.id] ? 'selected no' : ''} onClick={answerNoForCurrentGroup}>{t('no')}</button>
                  <button
                    type="button"
                    className={groupQuestions.some((item) => healthDeclaration.questions[item.id]?.answer === 'SÍ') || expandedGroupAnswers[currentGroup.id] ? 'selected yes' : ''}
                    onClick={() => setExpandedGroupAnswers((current) => ({ ...current, [currentGroup.id]: true }))}
                  >{t('yes')}</button>
                </div>
                {(groupQuestions.some((item) => healthDeclaration.questions[item.id]?.answer === 'SÍ') || expandedGroupAnswers[currentGroup.id]) && (
                  <div className="health-positive-details">
                    <div className="health-positive-details-title">
                      <Stethoscope size={19} />
                      <div><strong>{t('globalPositiveTitle')}</strong><span>{t('globalPositiveSub')}</span></div>
                    </div>
                    <div className="health-group-global-options">
                      {groupQuestions.map((item) => (
                        <button type="button" className={`health-condition-chip ${healthDeclaration.questions[item.id]?.answer === 'SÍ' ? 'selected' : ''}`} key={item.id} onClick={() => activateGlobalQuickOption(item)}>
                          {healthDeclaration.questions[item.id]?.answer === 'SÍ' && <Check size={13} />} {item.title}
                        </button>
                      ))}
                    </div>
                    {questionState?.answer === 'SÍ' && question.antecedentFields && (
                      <div className="health-special-detail-grid">
                        <div className="previasis-input-group">
                          <label className="previasis-label">{question.antecedentFields.field1Label}{question.antecedentFields.field1Required === false ? ` (${t('optional')})` : ' *'}</label>
                          <input className="previasis-input" placeholder={question.antecedentFields.field1Placeholder} value={questionState.antecedentDetail?.field1 || ''} onChange={(event) => updateAntecedent('field1', event.target.value)} required={question.antecedentFields.field1Required !== false} />
                        </div>
                        <div className="previasis-input-group">
                          <label className="previasis-label">{question.antecedentFields.field2Label} *</label>
                          <input className="previasis-input" placeholder={question.antecedentFields.field2Placeholder} value={questionState.antecedentDetail?.field2 || ''} onChange={(event) => updateAntecedent('field2', event.target.value)} required />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="health-answer-toolbar">
                  <div><Users size={18} /><span>{t('groupRespondsFor')}</span></div>
                  <button type="button" className="btn-pill btn-pill-secondary health-group-none-button" onClick={answerNoForCurrentGroup}>{t('noneApplies')}</button>
                </div>
                <div className="health-affiliate-answer-list">
                  {groupApplicableAffiliates.map((affiliate) => {
                    const answer = getGroupedAffiliateAnswer(affiliate);
                    const expandedKey = `${currentGroup.id}-${affiliate.affiliateCode}`;
                    const affiliateStatus = getGroupedAffiliateStatus(
                      affiliate,
                      Boolean(expandedGroupAnswers[expandedKey]),
                    );
                    return (
                      <div className={`health-affiliate-answer ${!answer && !expandedGroupAnswers[expandedKey] ? 'field-required-invalid' : ''}`} key={affiliate.id}>
                        <div className="health-affiliate-name">
                          <span>{affiliate.affiliateCode}</span>
                          <div><strong>{getAffiliateName(affiliate)}</strong><small>{affiliate.relationship}</small></div>
                        </div>
                        <div className="health-answer-buttons">
                          <button type="button" className={answer === 'NO' && !expandedGroupAnswers[expandedKey] ? 'selected no' : ''} onClick={() => answerNoForAffiliateGroup(affiliate.affiliateCode)}>{t('no')}</button>
                          <button type="button" className={answer === 'SÍ' || expandedGroupAnswers[expandedKey] ? 'selected yes' : ''} onClick={() => setExpandedGroupAnswers((current) => ({ ...current, [expandedKey]: true }))}>{t('yes')}</button>
                        </div>
                        <span className="health-affiliate-answer-status" style={{ color: statusMeta[affiliateStatus].color }}>
                          {renderStatusIcon(affiliateStatus, 15)} {t(statusMeta[affiliateStatus].labelKey)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {groupApplicableAffiliates.some((affiliate) => getGroupedAffiliateAnswer(affiliate) === 'SÍ' || expandedGroupAnswers[`${currentGroup.id}-${affiliate.affiliateCode}`]) && (
                  <div className="health-positive-details">
                    <div className="health-positive-details-title">
                      <Stethoscope size={19} />
                      <div><strong>{t('positiveTitle')}</strong><span>{t('groupPositiveSub')}</span></div>
                    </div>
                    {groupApplicableAffiliates.filter((affiliate) => getGroupedAffiliateAnswer(affiliate) === 'SÍ' || expandedGroupAnswers[`${currentGroup.id}-${affiliate.affiliateCode}`]).map((affiliate) => (
                      <React.Fragment key={affiliate.id}>
                        <div className="health-group-member-options">
                          <div className="health-group-member-name"><span>{affiliate.affiliateCode}</span><strong>{getAffiliateName(affiliate)}</strong></div>
                          {renderGroupedQuickOptions(affiliate)}
                          {groupQuestions.some((item) => getHealthDetailMode(item) === 'clinical') && renderOtherConditionInput(affiliate, true)}
                        </div>
                        {groupQuestions
                          .filter((item) => getAffiliateAnswers(
                            healthDeclaration,
                            item,
                            affiliates,
                          )[affiliate.affiliateCode] === 'SÍ')
                          .map((item) => renderDetailsForAffiliate(affiliate, false, item))}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </>
            )
          ) : question.requiresBeneficiarySelection === false ? (
            <div className={`health-global-answer ${!questionState?.answer ? 'field-required-invalid' : ''}`}>
              <p className="previasis-label">{t('selectGlobal')}</p>
              <div className="health-answer-buttons">
                <button type="button" className={questionState?.answer === 'NO' ? 'selected no' : ''} onClick={() => setGlobalAnswer(question, 'NO')}>{t('no')}</button>
                <button type="button" className={questionState?.answer === 'SÍ' ? 'selected yes' : ''} onClick={() => setGlobalAnswer(question, 'SÍ')}>{t('yes')}</button>
              </div>
              {questionState?.answer === 'SÍ' && question.antecedentFields && (
                <div className="health-special-detail-grid">
                  <div className="previasis-input-group">
                    <label className="previasis-label">{question.antecedentFields.field1Label}{question.antecedentFields.field1Required === false ? ` (${t('optional')})` : ' *'}</label>
                    <input className="previasis-input" placeholder={question.antecedentFields.field1Placeholder} value={questionState.antecedentDetail?.field1 || ''} onChange={(event) => updateAntecedent('field1', event.target.value)} required={question.antecedentFields.field1Required !== false} />
                  </div>
                  <div className="previasis-input-group">
                    <label className="previasis-label">{question.antecedentFields.field2Label} *</label>
                    <input className="previasis-input" placeholder={question.antecedentFields.field2Placeholder} value={questionState.antecedentDetail?.field2 || ''} onChange={(event) => updateAntecedent('field2', event.target.value)} required />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {question.applicableSex && (
                <div className="health-applicability-note">
                  {t(question.applicableSex === 'F' ? 'appliesFeminine' : 'appliesMasculine')}
                </div>
              )}
              <div className="health-answer-toolbar">
                <div><Users size={18} /><span>{t('respondsFor')}</span></div>
                {applicableAffiliates.length > 0 && (
                  <button type="button" className="btn-pill btn-pill-secondary health-group-none-button" onClick={() => answerNoForEveryone(question)}>
                    {t('noneApplies')}
                  </button>
                )}
              </div>

              <div className="health-affiliate-answer-list">
                {applicableAffiliates.length === 0 && (
                  <div className="health-not-applicable">{t('notApplicable')}</div>
                )}
                {applicableAffiliates.map((affiliate) => {
                  const answer = affiliateAnswers[affiliate.affiliateCode];
                  const status = getAffiliateQuestionStatus(
                    healthDeclaration,
                    question,
                    affiliate,
                    affiliates,
                  );
                  return (
                    <div className={`health-affiliate-answer ${!answer ? 'field-required-invalid' : ''}`} key={affiliate.id}>
                      <div className="health-affiliate-name">
                        <span>{affiliate.affiliateCode}</span>
                        <div><strong>{getAffiliateName(affiliate)}</strong><small>{affiliate.relationship}</small></div>
                      </div>
                      <div className="health-answer-buttons">
                        <button type="button" className={answer === 'NO' ? 'selected no' : ''} onClick={() => setAffiliateAnswer(question, affiliate.affiliateCode, 'NO')}>{t('no')}</button>
                        <button type="button" className={answer === 'SÍ' ? 'selected yes' : ''} onClick={() => setAffiliateAnswer(question, affiliate.affiliateCode, 'SÍ')}>{t('yes')}</button>
                      </div>
                      <span className="health-affiliate-answer-status" style={{ color: statusMeta[status].color }}>{renderStatusIcon(status, 15)} {t(statusMeta[status].labelKey)}</span>
                    </div>
                  );
                })}
              </div>

              {yesAffiliates.length > 0 && (
                <div className="health-positive-details">
                  <div className="health-positive-details-title">
                    <Stethoscope size={19} />
                    <div><strong>{t('positiveTitle')}</strong><span>{t('positiveSub')}</span></div>
                  </div>
                  {yesAffiliates.map((affiliate) => renderDetailsForAffiliate(affiliate))}
                </div>
              )}
            </>
          )}

          {(groupQuestions.length > 1 ? getGroupStatus(currentGroup.questionIds) : questionStatus) !== 'complete' && (
            <div className="health-inline-warning"><AlertCircle size={16} /> {t('pleaseComplete')}</div>
          )}

          <div className="health-editor-navigation">
            <button type="button" className="btn-pill btn-pill-outline" disabled={currentQuestionIndex === 0} onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}>
              <ChevronLeft size={16} /> {t('back')}
            </button>
            <button
              type="button"
              className="btn-pill btn-pill-primary"
              onClick={completedQuestions === HEALTH_QUESTION_FILLING_GROUPS.length ? onComplete : goToNextPending}
            >
              {completedQuestions === HEALTH_QUESTION_FILLING_GROUPS.length ? t('completed') : t('nextPending')}
              {completedQuestions === HEALTH_QUESTION_FILLING_GROUPS.length ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Step4HealthDeclaration;
