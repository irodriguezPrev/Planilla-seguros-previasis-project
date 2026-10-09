import { describe, expect, it } from 'vitest';
import type { HealthQuestionItem } from '@/core/config/health-questions.config';
import type {
  AffiliateRow,
  HealthDeclarationSection,
  MedicalConditionDetail,
} from '@/core/interfaces/affiliation.interfaces';
import {
  getAffiliateAnswers,
  getAffiliateQuestionStatus,
  getHealthDetailMode,
  getQuestionStatus,
  isClinicalDetailComplete,
  isQuestionApplicableToAffiliate,
} from '@/core/utils/health-progress.utils';

const makeQuestion = (overrides: Partial<HealthQuestionItem> = {}): HealthQuestionItem => ({
  id: 1,
  title: 'Pregunta de salud',
  description: 'Descripción',
  ...overrides,
});

const makeAffiliate = (
  affiliateCode: number,
  overrides: Partial<AffiliateRow> = {},
): AffiliateRow => ({
  id: `affiliate-${affiliateCode}`,
  affiliateCode,
  firstNames: 'Ana',
  lastNames: 'Pérez',
  fullName: 'Ana Pérez',
  documentType: 'V',
  documentNumber: `1234567${affiliateCode}`,
  birthDate: '1990-01-01',
  relationship: 'Titular',
  sex: 'F',
  weightKg: '60',
  heightCm: '165',
  requestedPlan: 'Previasís',
  coverageLimit: 10_000,
  fee: 0,
  ...overrides,
});

const makeHealthDeclaration = (
  overrides: Partial<HealthDeclarationSection> = {},
): HealthDeclarationSection => ({
  questions: {},
  sportDetails: [],
  clarificationDetails: {},
  medicalConditionDetails: [],
  ...overrides,
});

const makeClinicalDetail = (
  overrides: Partial<MedicalConditionDetail> = {},
): MedicalConditionDetail => ({
  id: 'condition-1',
  questionId: 1,
  affiliateCode: 1,
  condition: 'Asma',
  diagnosisDate: '05/2021',
  treatment: '',
  lastCheckupDate: '',
  hospital: '',
  ...overrides,
});

const affiliates = [makeAffiliate(1), makeAffiliate(2, { sex: 'M' })];

describe('health question helpers', () => {
  it('uses clinical mode by default and respects an explicit mode', () => {
    expect(getHealthDetailMode(makeQuestion())).toBe('clinical');
    expect(getHealthDetailMode(makeQuestion({ detailMode: 'sport' }))).toBe('sport');
  });

  it('applies unrestricted questions and filters sex-specific questions', () => {
    expect(isQuestionApplicableToAffiliate(makeQuestion(), affiliates[0])).toBe(true);
    expect(isQuestionApplicableToAffiliate(makeQuestion({ applicableSex: 'F' }), affiliates[0])).toBe(true);
    expect(isQuestionApplicableToAffiliate(makeQuestion({ applicableSex: 'F' }), affiliates[1])).toBe(false);
  });
});

describe('getAffiliateAnswers', () => {
  const question = makeQuestion({ id: 4 });

  it('returns no answers when the question has not been saved', () => {
    expect(getAffiliateAnswers(makeHealthDeclaration(), question, affiliates)).toEqual({});
  });

  it('returns current per-affiliate answers unchanged', () => {
    const affiliateAnswers = { 1: 'SÍ', 2: 'NO' } as const;
    const health = makeHealthDeclaration({
      questions: { 4: { answer: 'SÍ', affiliateAnswers } },
    });

    expect(getAffiliateAnswers(health, question, affiliates)).toBe(affiliateAnswers);
  });

  it('expands a legacy NO answer to every affiliate', () => {
    const health = makeHealthDeclaration({ questions: { 4: { answer: 'NO' } } });

    expect(getAffiliateAnswers(health, question, affiliates)).toEqual({ 1: 'NO', 2: 'NO' });
  });

  it('returns no inferred answers when a legacy YES has no selected codes', () => {
    const health = makeHealthDeclaration({ questions: { 4: { answer: 'SÍ' } } });

    expect(getAffiliateAnswers(health, question, affiliates)).toEqual({});
  });

  it('converts legacy selected codes into YES and NO answers', () => {
    const health = makeHealthDeclaration({
      questions: { 4: { answer: 'SÍ', affiliateCodes: [2] } },
    });

    expect(getAffiliateAnswers(health, question, affiliates)).toEqual({ 1: 'NO', 2: 'SÍ' });
  });
});

describe('isClinicalDetailComplete', () => {
  it('requires a condition and a valid past diagnosis date', () => {
    expect(isClinicalDetailComplete(makeClinicalDetail({ condition: ' ' }), makeQuestion())).toBe(false);
    expect(isClinicalDetailComplete(makeClinicalDetail({ diagnosisDate: '13/2021' }), makeQuestion())).toBe(false);
    expect(isClinicalDetailComplete(makeClinicalDetail(), makeQuestion())).toBe(true);
  });

  it('requires treatment only for detailed clinical questions', () => {
    const detailedQuestion = makeQuestion({ clinicalDetailLevel: 'detailed' });

    expect(isClinicalDetailComplete(makeClinicalDetail(), detailedQuestion)).toBe(false);
    expect(isClinicalDetailComplete(
      makeClinicalDetail({ treatment: 'Tratamiento médico' }),
      detailedQuestion,
    )).toBe(true);
  });

  it('requires a hernia subtype for the grouped Hernias condition', () => {
    const digestiveQuestion = makeQuestion({ id: 7, clinicalDetailLevel: 'detailed' });
    const herniaDetail = makeClinicalDetail({
      questionId: 7,
      condition: 'Hernias',
      treatment: 'Cirugía',
    });

    expect(isClinicalDetailComplete(herniaDetail, digestiveQuestion)).toBe(false);
    expect(isClinicalDetailComplete({
      ...herniaDetail,
      conditionSubtype: 'inguinal',
    }, digestiveQuestion)).toBe(true);
  });
});

describe('getAffiliateQuestionStatus', () => {
  const affiliate = affiliates[0];

  it('handles non-applicable, pending and explicit NO answers', () => {
    const femaleOnly = makeQuestion({ id: 14, applicableSex: 'F' });
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration(), femaleOnly, affiliates[1], affiliates,
    )).toBe('complete');

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration(), makeQuestion(), affiliate, affiliates,
    )).toBe('pending');

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({ questions: { 1: { answer: 'NO' } } }),
      makeQuestion(), affiliate, affiliates,
    )).toBe('complete');
  });

  it('validates every field of sport details belonging to the affiliate', () => {
    const question = makeQuestion({ id: 17, detailMode: 'sport' });
    const questions = { 17: { answer: 'SÍ' as const, affiliateAnswers: { 1: 'SÍ' as const } } };

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({ questions, sportDetails: undefined }), question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        sportDetails: [{ affiliateCode: 1, sport: ' ', frequency: '2', level: 'Amateur' }],
      }),
      question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        sportDetails: [
          { affiliateCode: 1, sport: 'Natación', frequency: '2', level: 'Amateur' },
          { affiliateCode: 2, sport: '', frequency: '', level: '' },
        ],
      }),
      question, affiliate, affiliates,
    )).toBe('complete');
  });

  it('validates clinical-summary beneficiary details and diagnosis dates', () => {
    const question = makeQuestion({
      id: 5,
      detailMode: 'beneficiary',
      includeInClinicalSummary: true,
    });
    const questions = { 5: { answer: 'SÍ' as const, affiliateAnswers: { 1: 'SÍ' as const } } };

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        clarificationDetails: {
          5: [{ affiliateCode: 1, field1: 'ACV', field2: 'fecha inválida' }],
        },
      }),
      question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        clarificationDetails: {
          5: [
            { affiliateCode: 1, field1: 'ACV', field2: '03/2021' },
            { affiliateCode: 2, field1: '', field2: '' },
          ],
        },
      }),
      question, affiliate, affiliates,
    )).toBe('complete');
  });

  it('validates standard beneficiary fields', () => {
    const question = makeQuestion({ id: 19, detailMode: 'beneficiary' });
    const questions = { 19: { answer: 'SÍ' as const, affiliateAnswers: { 1: 'SÍ' as const } } };

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({ questions }), question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        clarificationDetails: { 19: [{ affiliateCode: 1, field1: 'Cirugía', field2: ' ' }] },
      }),
      question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        clarificationDetails: { 19: [{ affiliateCode: 1, field1: 'Cirugía', field2: '2018' }] },
      }),
      question, affiliate, affiliates,
    )).toBe('complete');
  });

  it('requires quantity and time unit for medication details', () => {
    const question = makeQuestion({ id: 21, detailMode: 'beneficiary' });
    const questions = { 21: { answer: 'SÍ' as const, affiliateAnswers: { 1: 'SÍ' as const } } };

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        clarificationDetails: {
          21: [{
            affiliateCode: 1,
            field1: 'Losartán',
            field2: '50 mg',
            field2Number: '',
            field2Unit: 'día',
          }],
        },
      }),
      question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        clarificationDetails: {
          21: [{
            affiliateCode: 1,
            field1: 'Losartán',
            field2: '50 mg',
            field2Number: '1',
            field2Unit: 'día',
          }],
        },
      }),
      question, affiliate, affiliates,
    )).toBe('complete');
  });

  it('validates per-affiliate extra details', () => {
    const question = makeQuestion({ id: 20, detailMode: 'extra' });
    const questions = { 20: { answer: 'SÍ' as const, affiliateAnswers: { 1: 'SÍ' as const } } };

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({ questions }), question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions: {
          20: {
            ...questions[20],
            extraDetailsByAffiliate: { 1: 'Consumo ocasional' },
          },
        },
      }),
      question, affiliate, affiliates,
    )).toBe('complete');
  });

  it('validates only matching clinical details and accepts string affiliate codes', () => {
    const question = makeQuestion({ id: 6 });
    const questions = { 6: { answer: 'SÍ' as const, affiliateAnswers: { 1: 'SÍ' as const } } };

    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({ questions }), question, affiliate, affiliates,
    )).toBe('incomplete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        medicalConditionDetails: [
          makeClinicalDetail({ questionId: 6, affiliateCode: '1' }),
          makeClinicalDetail({ questionId: 6, affiliateCode: 2, condition: ' ' }),
          makeClinicalDetail({ questionId: 8, affiliateCode: 1, condition: ' ' }),
        ],
      }),
      question, affiliate, affiliates,
    )).toBe('complete');
    expect(getAffiliateQuestionStatus(
      makeHealthDeclaration({
        questions,
        medicalConditionDetails: [makeClinicalDetail({ questionId: 6, diagnosisDate: '' })],
      }),
      question, affiliate, affiliates,
    )).toBe('incomplete');
  });
});

describe('getQuestionStatus', () => {
  it('handles unanswered, negative, missing and complete antecedent questions', () => {
    const question = makeQuestion({
      id: 25,
      requiresBeneficiarySelection: false,
      antecedentFields: {
        field1Label: 'Contrato',
        field2Label: 'Compañía',
        field3Label: 'Cobertura',
        field4Label: 'Vigencia',
      },
    });

    expect(getQuestionStatus(makeHealthDeclaration(), question, affiliates)).toBe('pending');
    expect(getQuestionStatus(
      makeHealthDeclaration({ questions: { 25: { answer: 'NO' } } }), question, affiliates,
    )).toBe('complete');
    expect(getQuestionStatus(
      makeHealthDeclaration({ questions: { 25: { answer: 'SÍ' } } }), question, affiliates,
    )).toBe('incomplete');
    expect(getQuestionStatus(
      makeHealthDeclaration({
        questions: {
          25: { answer: 'SÍ', antecedentDetail: { field1: ' ', field2: 'Compañía' } },
        },
      }),
      question, affiliates,
    )).toBe('incomplete');
    expect(getQuestionStatus(
      makeHealthDeclaration({
        questions: {
          25: { answer: 'SÍ', antecedentDetails: [{ field1: '123', field2: 'Compañía' }] },
        },
      }),
      question, affiliates,
    )).toBe('complete');
  });

  it('supports optional first antecedent fields but still requires the company', () => {
    const question = makeQuestion({
      id: 25,
      requiresBeneficiarySelection: false,
      antecedentFields: {
        field1Label: 'Contrato',
        field2Label: 'Compañía',
        field3Label: 'Cobertura',
        field4Label: 'Vigencia',
        field1Required: false,
      },
    });

    expect(getQuestionStatus(
      makeHealthDeclaration({
        questions: { 25: { answer: 'SÍ', antecedentDetails: [{ field1: '', field2: 'Compañía' }] } },
      }),
      question, affiliates,
    )).toBe('complete');
    expect(getQuestionStatus(
      makeHealthDeclaration({
        questions: { 25: { answer: 'SÍ', antecedentDetails: [{ field1: '', field2: '' }] } },
      }),
      question, affiliates,
    )).toBe('incomplete');
  });

  it('completes sex-specific questions when there are no applicable affiliates', () => {
    const question = makeQuestion({ id: 14, applicableSex: 'F' });

    expect(getQuestionStatus(makeHealthDeclaration(), question, [affiliates[1]])).toBe('complete');
  });

  it('aggregates complete, pending and mixed affiliate states', () => {
    const question = makeQuestion({ id: 3 });

    expect(getQuestionStatus(
      makeHealthDeclaration({ questions: { 3: { answer: 'NO' } } }), question, affiliates,
    )).toBe('complete');
    expect(getQuestionStatus(makeHealthDeclaration(), question, affiliates)).toBe('pending');
    expect(getQuestionStatus(
      makeHealthDeclaration({
        questions: { 3: { answer: 'SÍ', affiliateAnswers: { 1: 'NO' } } },
      }),
      question, affiliates,
    )).toBe('incomplete');
  });
});
