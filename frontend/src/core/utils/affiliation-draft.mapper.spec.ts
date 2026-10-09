import { describe, expect, it } from 'vitest';

import type { AffiliationFormState } from '@/core/interfaces/affiliation.interfaces';
import {
  deserializeAffiliationDraft,
  serializeAffiliationDraft,
} from '@/core/utils/affiliation-draft.mapper';

const naturalPerson = {
  firstNames: 'María',
  lastNames: 'González',
  documentType: 'V' as const,
  documentNumber: '10000000',
  taxIdType: 'V' as const,
  taxId: '10000000',
  nationality: 'Venezolana',
  maritalStatus: 'Soltero(a)' as const,
  sex: 'F' as const,
  birthPlace: 'Caracas',
  birthDate: '1990-01-01',
  profession: 'Ingeniera',
  occupation: 'Desarrolladora',
  annualIncomeBs: '12000',
  politicallyExposed: 'NO' as const,
  activityClassification: 'Dependiente' as const,
  homeAddress: 'Calle 1, Edificio A',
  officeAddress: 'Oficina 2',
  billingAddress: 'Calle 1, Edificio A',
  homePhone: '02121234567',
  mobilePhone: '04121234567',
  email: 'maria@previasis.com',
};

const makeState = (): AffiliationFormState => ({
  header: {
    operationType: 'Emisión',
    contractType: 'Individual',
    applicationNumber: 'APP-0001',
    applicationDate: '2024-05-10',
  },
  policyholder: naturalPerson,
  contractor: {
    isDifferent: false,
    personType: 'Natural',
    naturalPerson,
    legalEntity: {
      legalName: 'Empresa C.A.',
      taxIdType: 'J',
      taxId: 'J-12345678-9',
      commercialRegistryNumber: '3011234567',
      volumeNumber: '45',
      registrationDate: '2020-01-15',
      economicActivity: 'Comercial',
      productsServices: 'Servicios',
      taxAddress: 'Av. Principal',
      phone: '02121234567',
      mobilePhone: '04121234567',
      email: 'contacto@empresaca.com',
      previousFiscalYearProfit: '1000',
      netWorth: '5000',
      legalRepresentative: naturalPerson,
    },
  },
  affiliates: [
    {
      id: 'af-1',
      affiliateCode: 1,
      firstNames: 'Ana',
      lastNames: 'Pérez',
      fullName: 'Ana Pérez',
      documentType: 'V',
      documentNumber: '12345678',
      usesOwnDocument: true,
      birthDate: '2015-04-10',
      relationship: 'Hijo/a',
      sex: 'F',
      weightKg: '30',
      heightCm: '140',
      requestedPlan: 'Previasís',
      coverageLimit: 10000,
      fee: 10,
    },
  ],
  healthDeclaration: {
    questions: {
      1: { answer: 'NO' },
      5: { answer: 'SÍ', affiliateCodes: [1] },
      21: {
        answer: 'SÍ',
        affiliateAnswers: { 1: 'SÍ' },
        antecedentDetail: { field1: 'Losartán', field2: '50mg', field3: '', field4: '' },
        antecedentDetails: [
          { field1: 'Losartán', field2: '50mg', field3: '', field4: '' },
        ],
      },
    },
    sportDetails: [
      { id: 's1', affiliateCode: 1, sport: 'Fútbol', frequency: '3', level: 'Amateur' },
    ],
    clarificationDetails: {
      21: [
        {
          id: 'c1',
          affiliateCode: 1,
          field1: 'Losartán',
          field2: '50mg',
          field2Number: '1',
          field2Unit: 'vez al día',
        },
      ],
    },
    medicalConditionDetails: [
      {
        id: 'm1',
        questionId: 4,
        affiliateCode: 1,
        condition: 'Hipertensión',
        diagnosisDate: '03/2021',
        treatment: 'Enalapril',
        lastCheckupDate: '01/2024',
        hospital: 'Clínica',
      },
    ],
  },
  payment: {
    paymentFrequency: 'Mensual',
    currency: 'Bolívares',
    method: 'Zelle',
    otherPaymentDetails: 'Cuenta XXX',
  },
  signatures: {
    place: 'Caracas',
    date: '2024-05-10',
    policyholderSignatureBase64: 'data:image/png;base64,AAA',
    contractorSignatureBase64: null,
    acceptsPolicyholderDeclaration: true,
    acceptsContractorSourceOfFunds: false,
  },
  broker: {
    fullName: 'Broker Ejemplo',
    credentialNumber: 'C-001',
    documentType: 'V',
    identityOrTaxNumber: '99887766',
    referralCode: 'REF1',
    sellerId: 'S-01',
    lockedByReferral: true,
  },
  attachedDocuments: [
    {
      id: 'f1',
      name: 'cedula.png',
      type: 'image/png',
      sizeMb: 1.2,
      previewUrl: 'blob:preview-1',
      docCategory: 'Cédula de Identidad',
    },
  ],
});

describe('deserializeAffiliationDraft', () => {
  it('aplica todos los valores por defecto con un objeto vacío', () => {
    const state = deserializeAffiliationDraft({});

    expect(state.header).toEqual({
      operationType: 'Emisión',
      contractType: 'Individual',
      applicationNumber: undefined,
      applicationDate: '',
    });
    expect(state.policyholder.documentType).toBe('V');
    expect(state.policyholder.sex).toBe('M');
    expect(state.policyholder.politicallyExposed).toBe('NO');
    expect(state.contractor.isDifferent).toBe(false);
    expect(state.contractor.personType).toBe('Natural');
    expect(state.contractor.legalEntity.taxIdType).toBe('J');
    expect(state.affiliates).toEqual([]);
    expect(state.healthDeclaration).toEqual({
      questions: {},
      sportDetails: [],
      clarificationDetails: {},
      medicalConditionDetails: [],
    });
    expect(state.payment).toEqual({
      paymentFrequency: 'Trimestral',
      currency: 'Dólares',
      method: 'Pago en Oficina',
      otherPaymentDetails: undefined,
    });
    expect(state.signatures.policyholderSignatureBase64).toBeNull();
    expect(state.signatures.contractorSignatureBase64).toBeNull();
    expect(state.signatures.acceptsPolicyholderDeclaration).toBe(false);
    expect(state.broker.lockedByReferral).toBe(false);
    expect(state.attachedDocuments).toBeUndefined();
  });

  it('tolera entradas que no son objetos', () => {
    const fromNull = deserializeAffiliationDraft(null);
    const fromString = deserializeAffiliationDraft('no-es-objeto');
    const fromArray = deserializeAffiliationDraft(['array']);

    expect(fromNull.header).toEqual(fromString.header);
    expect(fromArray.affiliates).toEqual([]);
    expect(fromArray.healthDeclaration.questions).toEqual({});
  });

  it('completa los campos faltantes del encabezado', () => {
    const state = deserializeAffiliationDraft({ header: { operationType: 'Inclusión' } });

    expect(state.header.operationType).toBe('Inclusión');
    expect(state.header.contractType).toBe('Individual');
    expect(state.header.applicationDate).toBe('');
  });

  it('separa el nombre legado de los afiliados en nombres y apellidos', () => {
    const state = deserializeAffiliationDraft({
      affiliates: [{ fullName: 'Juan Carlos Pérez López' }],
    });

    expect(state.affiliates[0].firstNames).toBe('Juan Carlos');
    expect(state.affiliates[0].lastNames).toBe('Pérez López');
    expect(state.affiliates[0].fullName).toBe('Juan Carlos Pérez López');
  });

  it('usa nombres explícitos cuando coexisten con el nombre legado', () => {
    const state = deserializeAffiliationDraft({
      affiliates: [{ fullName: 'Nombre Legacy', firstNames: 'Ana', lastNames: 'Pérez' }],
    });

    expect(state.affiliates[0].firstNames).toBe('Ana');
    expect(state.affiliates[0].lastNames).toBe('Pérez');
    expect(state.affiliates[0].fullName).toBe('Ana Pérez');
  });

  it('reconstruye el nombre de un afiliado con un solo dato legado', () => {
    const state = deserializeAffiliationDraft({ affiliates: [{ fullName: 'Fulano' }] });

    expect(state.affiliates[0].firstNames).toBe('Fulano');
    expect(state.affiliates[0].lastNames).toBe('');
    expect(state.affiliates[0].fullName).toBe('Fulano');
  });

  it('ignora afiliados cuando el campo no es un arreglo', () => {
    const state = deserializeAffiliationDraft({ affiliates: 'no-array' });

    expect(state.affiliates).toEqual([]);
  });

  it('usa NO como respuesta por defecto de las preguntas guardadas', () => {
    const state = deserializeAffiliationDraft({
      healthDeclaration: { questions: { 1: { extraDetails: 'algo' } } },
    });

    expect(state.healthDeclaration.questions[1].answer).toBe('NO');
  });

  it('descarta un antecedente vacío y completa los campos presentes', () => {
    const empty = deserializeAffiliationDraft({
      healthDeclaration: { questions: { 1: { answer: 'SÍ', antecedentDetail: {} } } },
    });
    const partial = deserializeAffiliationDraft({
      healthDeclaration: { questions: { 1: { answer: 'SÍ', antecedentDetail: { field1: 'x' } } } },
    });

    expect(empty.healthDeclaration.questions[1].antecedentDetail).toBeUndefined();
    // El borrador completa los cuatro campos: los antecedentes actuales tienen
    // cuatro detalle aunque el guardado solo traiga uno.
    expect(partial.healthDeclaration.questions[1].antecedentDetail).toEqual({
      field1: 'x',
      field2: '',
      field3: '',
      field4: '',
    });
  });

  it('limpia la frecuencia de deporte de todo lo que no sea dígito', () => {
    const state = deserializeAffiliationDraft({
      healthDeclaration: { sportDetails: [{ affiliateCode: 1, frequency: '12 veces' }] },
    });

    expect(state.healthDeclaration.sportDetails).toEqual([
      {
        id: undefined,
        affiliateCode: 1,
        sport: '',
        frequency: '12',
        level: '',
      },
    ]);
  });

  it('coacciona el questionId de los detalles médicos', () => {
    const state = deserializeAffiliationDraft({
      healthDeclaration: {
        medicalConditionDetails: [
          { questionId: '5', affiliateCode: 1 },
          { questionId: 'abc', affiliateCode: 2 },
          { affiliateCode: 3 },
        ],
      },
    });

    const [coerced, invalid, missing] = state.healthDeclaration.medicalConditionDetails;

    expect(coerced.questionId).toBe(5);
    expect(invalid.questionId).toBeUndefined();
    expect(missing.questionId).toBeUndefined();
  });
});

describe('serializeAffiliationDraft', () => {
  it('devuelve una copia superficial del estado', () => {
    const state = makeState();
    const serialized = serializeAffiliationDraft(state);

    expect(serialized).toEqual(state);
    expect(serialized).not.toBe(state);
    expect(serialized.header).toBe(state.header);
  });

  it('sobrevive un ciclo serialize -> deserialize sin perder datos', () => {
    const state = makeState();
    const restored = deserializeAffiliationDraft(serializeAffiliationDraft(state));

    // El deserializador materializa algunos campos opcionales con `undefined`
    // o `null`; el ciclo debe preservar todos los datos presentes en el estado.
    expect(restored).toMatchObject(state);
  });
});
