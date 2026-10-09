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

type SavedQuestion = HealthDeclarationSection['questions'][number];

const makeQuestion = (
  overrides: Partial<HealthQuestionItem> = {},
): HealthQuestionItem => ({
  id: 1,
  title: 'Pregunta de ejemplo',
  description: 'Descripción de la pregunta',
  ...overrides,
});

const makeAffiliate = (overrides: Partial<AffiliateRow> = {}): AffiliateRow => ({
  id: 'af-1',
  affiliateCode: 1,
  firstNames: 'Ana',
  lastNames: 'Pérez',
  fullName: 'Ana Pérez',
  documentType: 'V',
  documentNumber: '12345678',
  usesOwnDocument: true,
  birthDate: '1990-01-01',
  relationship: 'Hijo/a',
  sex: 'F',
  weightKg: '60',
  heightCm: '165',
  requestedPlan: 'Previasís',
  coverageLimit: 10000,
  fee: 0,
  ...overrides,
});

const makeDetail = (
  overrides: Partial<MedicalConditionDetail> = {},
): MedicalConditionDetail => ({
  id: 'd1',
  questionId: 1,
  affiliateCode: 1,
  condition: 'Asma',
  diagnosisDate: '03/2021',
  treatment: '',
  lastCheckupDate: '',
  hospital: '',
  ...overrides,
});

const declaration = (
  overrides: Partial<HealthDeclarationSection> = {},
): HealthDeclarationSection => ({
  questions: {},
  medicalConditionDetails: [],
  ...overrides,
});

const withSavedQuestion = (
  saved: SavedQuestion,
  overrides: Partial<HealthDeclarationSection> = {},
): HealthDeclarationSection => declaration({ questions: { 1: saved }, ...overrides });

const answeredYes = {
  answer: 'SÍ' as const,
  affiliateAnswers: { 1: 'SÍ' as const },
};

describe('getHealthDetailMode', () => {
  it('usa clinical cuando la pregunta no define modo', () => {
    expect(getHealthDetailMode(makeQuestion())).toBe('clinical');
  });

  it('devuelve el modo declarado por la pregunta', () => {
    expect(getHealthDetailMode(makeQuestion({ detailMode: 'sport' }))).toBe('sport');
    expect(getHealthDetailMode(makeQuestion({ detailMode: 'extra' }))).toBe('extra');
  });
});

describe('isQuestionApplicableToAffiliate', () => {
  it('aplica a todos cuando la pregunta no restringe el sexo', () => {
    expect(isQuestionApplicableToAffiliate(makeQuestion(), makeAffiliate({ sex: 'M' }))).toBe(true);
    expect(isQuestionApplicableToAffiliate(makeQuestion(), makeAffiliate({ sex: 'F' }))).toBe(true);
  });

  it('respeta el sexo requerido por la pregunta', () => {
    const onlyFemale = makeQuestion({ applicableSex: 'F' });

    expect(isQuestionApplicableToAffiliate(onlyFemale, makeAffiliate({ sex: 'F' }))).toBe(true);
    expect(isQuestionApplicableToAffiliate(onlyFemale, makeAffiliate({ sex: 'M' }))).toBe(false);
  });
});

describe('getAffiliateAnswers', () => {
  const affiliates = [makeAffiliate({ affiliateCode: 1 }), makeAffiliate({ affiliateCode: 2 })];
  const question = makeQuestion();

  it('devuelve vacío si la pregunta no fue respondida', () => {
    expect(getAffiliateAnswers(declaration(), question, affiliates)).toEqual({});
  });

  it('devuelve las respuestas por afiliado si existen', () => {
    const saved = withSavedQuestion({
      answer: 'SÍ',
      affiliateAnswers: { 1: 'SÍ', 2: 'NO' },
    });

    expect(getAffiliateAnswers(saved, question, affiliates)).toEqual({ 1: 'SÍ', 2: 'NO' });
  });

  it('propaga el NO a todos los afiliados', () => {
    const saved = withSavedQuestion({ answer: 'NO' });

    expect(getAffiliateAnswers(saved, question, affiliates)).toEqual({ 1: 'NO', 2: 'NO' });
  });

  it('marca solo los códigos seleccionados como SÍ', () => {
    const saved = withSavedQuestion({ answer: 'SÍ', affiliateCodes: [2] });

    expect(getAffiliateAnswers(saved, question, affiliates)).toEqual({ 1: 'NO', 2: 'SÍ' });
  });

  it('devuelve vacío si respondió SÍ sin seleccionar afiliados', () => {
    const saved = withSavedQuestion({ answer: 'SÍ', affiliateCodes: [] });

    expect(getAffiliateAnswers(saved, question, affiliates)).toEqual({});
  });
});

describe('isClinicalDetailComplete', () => {
  it('en nivel simple no exige tratamiento', () => {
    expect(isClinicalDetailComplete(makeDetail(), makeQuestion())).toBe(true);
    expect(
      isClinicalDetailComplete(
        makeDetail({ treatment: '' }),
        makeQuestion({ clinicalDetailLevel: 'simple' }),
      ),
    ).toBe(true);
  });

  it('en nivel simple exige una fecha MM/AAAA válida', () => {
    expect(isClinicalDetailComplete(makeDetail({ diagnosisDate: '2024-03' }), makeQuestion())).toBe(true);
    expect(isClinicalDetailComplete(makeDetail({ diagnosisDate: '2024' }), makeQuestion())).toBe(false);
    expect(isClinicalDetailComplete(makeDetail({ diagnosisDate: '' }), makeQuestion())).toBe(false);
  });

  it('en nivel detailed exige condición, fecha y tratamiento', () => {
    const detailed = makeQuestion({ clinicalDetailLevel: 'detailed' });

    expect(
      isClinicalDetailComplete(
        makeDetail({ diagnosisDate: '03/2021', treatment: 'Losartán' }),
        detailed,
      ),
    ).toBe(true);
    expect(isClinicalDetailComplete(makeDetail({ treatment: '' }), detailed)).toBe(false);
    expect(isClinicalDetailComplete(makeDetail({ diagnosisDate: '' }), detailed)).toBe(false);
  });

  it('exige la condición en cualquier nivel', () => {
    expect(isClinicalDetailComplete(makeDetail({ condition: '   ' }), makeQuestion())).toBe(false);
  });
});

describe('getAffiliateQuestionStatus', () => {
  const affiliate = makeAffiliate();

  it('marca complete si la pregunta no aplica al afiliado', () => {
    const question = makeQuestion({ applicableSex: 'M' });

    expect(getAffiliateQuestionStatus(declaration(), question, affiliate, [affiliate])).toBe('complete');
  });

  it('marca pending si nadie respondió', () => {
    expect(
      getAffiliateQuestionStatus(declaration(), makeQuestion(), affiliate, [affiliate]),
    ).toBe('pending');
  });

  it('marca complete si respondió NO', () => {
    const saved = withSavedQuestion({ answer: 'NO' });

    expect(getAffiliateQuestionStatus(saved, makeQuestion(), affiliate, [affiliate])).toBe('complete');
  });

  it('evalúa el detalle clínico cuando respondió SÍ', () => {
    const question = makeQuestion();
    const complete = withSavedQuestion(answeredYes, {
      medicalConditionDetails: [makeDetail()],
    });
    const incomplete = withSavedQuestion(answeredYes, {
      medicalConditionDetails: [makeDetail({ diagnosisDate: 'sin fecha' })],
    });
    const withoutDetails = withSavedQuestion(answeredYes);

    expect(getAffiliateQuestionStatus(complete, question, affiliate, [affiliate])).toBe('complete');
    expect(getAffiliateQuestionStatus(incomplete, question, affiliate, [affiliate])).toBe('incomplete');
    expect(getAffiliateQuestionStatus(withoutDetails, question, affiliate, [affiliate])).toBe('incomplete');
  });

  it('ignora los detalles clínicos de otros afiliados u otras preguntas', () => {
    const saved = withSavedQuestion(answeredYes, {
      medicalConditionDetails: [
        makeDetail({ questionId: 99 }),
        makeDetail({ affiliateCode: 99 }),
      ],
    });

    expect(getAffiliateQuestionStatus(saved, makeQuestion(), affiliate, [affiliate])).toBe('incomplete');
  });

  describe('modo sport', () => {
    const question = makeQuestion({ detailMode: 'sport' });

    it('es complete cuando cada deporte tiene datos completos', () => {
      const saved = withSavedQuestion(answeredYes, {
        sportDetails: [
          { affiliateCode: 1, sport: 'Fútbol', frequency: '3', level: 'Amateur' },
        ],
      });

      expect(getAffiliateQuestionStatus(saved, question, affiliate, [affiliate])).toBe('complete');
    });

    it('es incomplete sin detalles o con datos vacíos', () => {
      const noDetails = withSavedQuestion(answeredYes);
      const emptyLevel = withSavedQuestion(answeredYes, {
        sportDetails: [
          { affiliateCode: 1, sport: 'Fútbol', frequency: '3', level: '' },
        ],
      });

      expect(getAffiliateQuestionStatus(noDetails, question, affiliate, [affiliate])).toBe('incomplete');
      expect(getAffiliateQuestionStatus(emptyLevel, question, affiliate, [affiliate])).toBe('incomplete');
    });
  });

  describe('modo beneficiary', () => {
    it('exige fecha MM/AAAA en preguntas del resumen clínico (id5)', () => {
      const question = makeQuestion({
        id: 5,
        detailMode: 'beneficiary',
        includeInClinicalSummary: true,
      });
      const detail = {
        affiliateCode: 1,
        field1: 'Várices',
        field2: '03/2021',
        field2Number: '',
        field2Unit: '',
      };
      const valid = declaration({
        questions: { 5: answeredYes },
        clarificationDetails: { 5: [detail] },
      });
      const invalid = declaration({
        questions: { 5: answeredYes },
        clarificationDetails: { 5: [{ ...detail, field2: '2021' }] },
      });

      expect(getAffiliateQuestionStatus(valid, question, affiliate, [affiliate])).toBe('complete');
      expect(getAffiliateQuestionStatus(invalid, question, affiliate, [affiliate])).toBe('incomplete');
    });

    it('exige dosis y unidad en la pregunta de medicación (id21)', () => {
      const question = makeQuestion({ id: 21, detailMode: 'beneficiary' });
      const detail = {
        affiliateCode: 1,
        field1: 'Losartán',
        field2: '50mg',
        field2Number: '1',
        field2Unit: 'vez al día',
      };
      const valid = declaration({
        questions: { 21: answeredYes },
        clarificationDetails: { 21: [detail] },
      });
      const withoutUnit = declaration({
        questions: { 21: answeredYes },
        clarificationDetails: { 21: [{ ...detail, field2Unit: '' }] },
      });
      const withoutNumber = declaration({
        questions: { 21: answeredYes },
        clarificationDetails: { 21: [{ ...detail, field2Number: '' }] },
      });
      const noDetails = declaration({ questions: { 21: answeredYes } });

      expect(getAffiliateQuestionStatus(valid, question, affiliate, [affiliate])).toBe('complete');
      expect(getAffiliateQuestionStatus(withoutUnit, question, affiliate, [affiliate])).toBe('incomplete');
      expect(getAffiliateQuestionStatus(withoutNumber, question, affiliate, [affiliate])).toBe('incomplete');
      expect(getAffiliateQuestionStatus(noDetails, question, affiliate, [affiliate])).toBe('incomplete');
    });
  });

  describe('modo extra', () => {
    const question = makeQuestion({ detailMode: 'extra' });

    it('es complete con texto no vacío para el afiliado', () => {
      const saved = declaration({
        questions: { 1: { ...answeredYes, extraDetailsByAffiliate: { 1: 'Detalle escrito' } } },
      });

      expect(getAffiliateQuestionStatus(saved, question, affiliate, [affiliate])).toBe('complete');
    });

    it('es incomplete con texto vacío o sin texto', () => {
      const blank = declaration({
        questions: { 1: { ...answeredYes, extraDetailsByAffiliate: { 1: '   ' } } },
      });

      expect(getAffiliateQuestionStatus(blank, question, affiliate, [affiliate])).toBe('incomplete');
      expect(
        getAffiliateQuestionStatus(withSavedQuestion(answeredYes), question, affiliate, [affiliate]),
      ).toBe('incomplete');
    });
  });
});

describe('getQuestionStatus', () => {
  const affiliates = [makeAffiliate({ affiliateCode: 1 }), makeAffiliate({ affiliateCode: 2, sex: 'M' })];

  describe('cuando no requiere selección de beneficiario', () => {
    const question = makeQuestion({
      requiresBeneficiarySelection: false,
      antecedentFields: {
        field1Label: 'Detalle',
        field2Label: 'Fecha',
        field3Label: 'Límite de Cobertura',
        field4Label: 'Vigencia',
      },
    });

    it('marca pending si la pregunta no está guardada', () => {
      expect(getQuestionStatus(declaration(), question, affiliates)).toBe('pending');
    });

    it('marca complete si respondió NO', () => {
      const saved = withSavedQuestion({ answer: 'NO' });

      expect(getQuestionStatus(saved, question, affiliates)).toBe('complete');
    });

    it('marca complete si el antecedente tiene ambos campos', () => {
      const saved = withSavedQuestion({
        answer: 'SÍ',
        antecedentDetail: { field1: 'Alergia', field2: '03/2020' },
      });

      expect(getQuestionStatus(saved, question, affiliates)).toBe('complete');
    });

    it('marca incomplete si falta el segundo campo', () => {
      const saved = withSavedQuestion({
        answer: 'SÍ',
        antecedentDetail: { field1: 'Alergia', field2: '' },
      });

      expect(getQuestionStatus(saved, question, affiliates)).toBe('incomplete');
    });

    it('marca incomplete si respondió SÍ sin antecedente', () => {
      const saved = withSavedQuestion({ answer: 'SÍ' });

      expect(getQuestionStatus(saved, question, affiliates)).toBe('incomplete');
    });

    it('ignora el primer campo cuando está marcado como opcional', () => {
      const optionalField = makeQuestion({
        requiresBeneficiarySelection: false,
        antecedentFields: {
          field1Label: 'Detalle',
          field2Label: 'Fecha',
          field3Label: 'Límite de Cobertura',
          field4Label: 'Vigencia',
          field1Required: false,
        },
      });
      const saved = withSavedQuestion({
        answer: 'SÍ',
        antecedentDetail: { field1: '', field2: '03/2020' },
      });

      expect(getQuestionStatus(saved, optionalField, affiliates)).toBe('complete');
    });
  });

  describe('agregando el estado de cada afiliado', () => {
    it('es complete si ninguna pregunta aplica a los afiliados', () => {
      const onlyFemale = makeQuestion({ applicableSex: 'F' });
      const onlyMales = [makeAffiliate({ sex: 'M' }), makeAffiliate({ affiliateCode: 2, sex: 'M' })];

      expect(getQuestionStatus(declaration(), onlyFemale, onlyMales)).toBe('complete');
    });

    it('es complete si todos respondieron NO', () => {
      const saved = withSavedQuestion({ answer: 'NO' });

      expect(getQuestionStatus(saved, makeQuestion(), affiliates)).toBe('complete');
    });

    it('es pending si nadie respondió', () => {
      expect(getQuestionStatus(declaration(), makeQuestion(), affiliates)).toBe('pending');
    });

    it('es incomplete si solo un afiliado completó la pregunta', () => {
      const saved = declaration({
        questions: { 1: answeredYes },
        medicalConditionDetails: [makeDetail()],
      });

      expect(getQuestionStatus(saved, makeQuestion(), affiliates)).toBe('incomplete');
    });

    it('es complete si todos los afiliados applicable tienen respuesta completa', () => {
      const saved = withSavedQuestion({
        answer: 'SÍ',
        affiliateAnswers: { 1: 'SÍ', 2: 'SÍ' },
      }, {
        medicalConditionDetails: [
          makeDetail({ affiliateCode: 1 }),
          makeDetail({ id: 'd2', affiliateCode: 2 }),
        ],
      });

      expect(getQuestionStatus(saved, makeQuestion(), affiliates)).toBe('complete');
    });
  });
});
