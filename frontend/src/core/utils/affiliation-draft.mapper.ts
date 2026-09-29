import {
  AffiliateRow,
  AffiliationFormState,
  BrokerSection,
  ContractorSection,
  DeclarationsSignaturesSection,
  HeaderSection,
  HealthDeclarationSection,
  LegalEntityData,
  NaturalPersonData,
  PaymentSection,
  RequestedPlan,
} from '@/core/interfaces/affiliation.interfaces';
import { parseCoverageLimit } from '@/core/config/tariff-data';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {};

const deserializeHeader = (value: unknown): HeaderSection => {
  const source = asRecord(value);
  return {
    operationType: (source.operationType ?? 'Emisión') as HeaderSection['operationType'],
    contractType: (source.contractType ?? 'Individual') as HeaderSection['contractType'],
    applicationNumber: source.applicationNumber as string | undefined,
    applicationDate: String(source.applicationDate ?? ''),
  };
};

const deserializeNaturalPerson = (value: unknown): NaturalPersonData => {
  const source = asRecord(value);
  return {
    firstNames: String(source.firstNames ?? ''),
    lastNames: String(source.lastNames ?? ''),
    documentType: (source.documentType ?? 'V') as NaturalPersonData['documentType'],
    documentNumber: String(source.documentNumber ?? ''),
    taxIdType: (source.taxIdType ?? 'V') as NaturalPersonData['taxIdType'],
    taxId: String(source.taxId ?? ''),
    nationality: String(source.nationality ?? ''),
    maritalStatus: (source.maritalStatus ?? 'Soltero(a)') as NaturalPersonData['maritalStatus'],
    sex: (source.sex ?? 'M') as NaturalPersonData['sex'],
    birthPlace: String(source.birthPlace ?? ''),
    birthDate: String(source.birthDate ?? ''),
    profession: String(source.profession ?? ''),
    occupation: String(source.occupation ?? ''),
    businessSector: source.businessSector as string | undefined,
    annualIncomeBs: String(source.annualIncomeBs ?? ''),
    politicallyExposed: (source.politicallyExposed ?? 'NO') as NaturalPersonData['politicallyExposed'],
    politicallyExposedDescription: source.politicallyExposedDescription as string | undefined,
    activityClassification: (source.activityClassification ?? 'Dependiente') as NaturalPersonData['activityClassification'],
    company: source.company as string | undefined,
    residenceState: source.residenceState as string | undefined,
    residenceCity: source.residenceCity as string | undefined,
    homeAddress: String(source.homeAddress ?? ''),
    officeAddress: String(source.officeAddress ?? ''),
    billingAddress: String(source.billingAddress ?? ''),
    homePhone: String(source.homePhone ?? ''),
    mobilePhone: String(source.mobilePhone ?? ''),
    email: String(source.email ?? ''),
  };
};

const deserializeLegalEntity = (value: unknown): LegalEntityData => {
  const source = asRecord(value);
  return {
    legalName: String(source.legalName ?? ''),
    taxIdType: (source.taxIdType ?? 'J') as LegalEntityData['taxIdType'],
    taxId: String(source.taxId ?? ''),
    commercialRegistryNumber: String(source.commercialRegistryNumber ?? ''),
    volumeNumber: String(source.volumeNumber ?? ''),
    registrationDate: String(source.registrationDate ?? ''),
    economicActivity: (source.economicActivity ?? 'Comercial') as LegalEntityData['economicActivity'],
    businessSector: source.businessSector as string | undefined,
    productsServices: String(source.productsServices ?? ''),
    taxAddress: String(source.taxAddress ?? ''),
    phone: String(source.phone ?? ''),
    previousFiscalYearProfit: String(source.previousFiscalYearProfit ?? ''),
    netWorth: String(source.netWorth ?? ''),
    legalRepresentative: deserializeNaturalPerson(source.legalRepresentative),
  };
};

const deserializeContractor = (value: unknown): ContractorSection => {
  const source = asRecord(value);
  return {
    isDifferent: Boolean(source.isDifferent),
    personType: (source.personType ?? 'Natural') as ContractorSection['personType'],
    naturalPerson: deserializeNaturalPerson(source.naturalPerson),
    legalEntity: deserializeLegalEntity(source.legalEntity),
  };
};

const deserializePayment = (value: unknown): PaymentSection => {
  const source = asRecord(value);
  return {
    paymentFrequency: (source.paymentFrequency ?? 'Trimestral') as PaymentSection['paymentFrequency'],
    currency: (source.currency ?? 'Dólares') as PaymentSection['currency'],
    method: (source.method ?? 'Pago en Oficina') as PaymentSection['method'],
    otherPaymentDetails: source.otherPaymentDetails as string | undefined,
  };
};

const deserializeSignatures = (value: unknown): DeclarationsSignaturesSection => {
  const source = asRecord(value);
  return {
    place: String(source.place ?? ''),
    date: String(source.date ?? ''),
    policyholderSignatureBase64: (source.policyholderSignatureBase64 as string | null | undefined) ?? null,
    contractorSignatureBase64: (source.contractorSignatureBase64 as string | null | undefined) ?? null,
    acceptsPolicyholderDeclaration: Boolean(source.acceptsPolicyholderDeclaration),
    acceptsContractorSourceOfFunds: Boolean(source.acceptsContractorSourceOfFunds),
  };
};

const deserializeBroker = (value: unknown): BrokerSection => {
  const source = asRecord(value);
  return {
    fullName: String(source.fullName ?? ''),
    credentialNumber: String(source.credentialNumber ?? ''),
    documentType: (source.documentType ?? 'V') as BrokerSection['documentType'],
    identityOrTaxNumber: String(source.identityOrTaxNumber ?? ''),
    referralCode: source.referralCode ? String(source.referralCode) : undefined,
    sellerId: source.sellerId ? String(source.sellerId) : undefined,
    lockedByReferral: Boolean(source.lockedByReferral),
  };
};

const splitLegacyAffiliateName = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstNames: parts[0] ?? '', lastNames: '' };
  const splitIndex = Math.ceil(parts.length / 2);
  return {
    firstNames: parts.slice(0, splitIndex).join(' '),
    lastNames: parts.slice(splitIndex).join(' '),
  };
};

const deserializeAffiliate = (value: unknown): AffiliateRow => {
  const source = asRecord(value);
  const legacyFullName = String(source.fullName ?? '');
  const legacyNameParts = splitLegacyAffiliateName(legacyFullName);
  const firstNames = String(source.firstNames ?? legacyNameParts.firstNames);
  const lastNames = String(source.lastNames ?? legacyNameParts.lastNames);
  const legacyPlan = String(source.requestedPlan ?? '');
  const requestedPlan: RequestedPlan = legacyPlan === 'Abuelos' ||
    legacyPlan.startsWith('Plan Abuelos')
    ? 'Abuelos'
    : legacyPlan === '24/7' || legacyPlan.includes('24/7')
      ? '24/7'
      : 'Previasís';
  const rawCoverage = source.coverageLimit;
  const coverageLimit =
    typeof rawCoverage === 'number' && rawCoverage > 0
      ? rawCoverage
      : parseCoverageLimit(String(rawCoverage ?? '') || '0');
  return {
    id: String(source.id ?? ''),
    affiliateCode: Number(source.affiliateCode ?? 0),
    firstNames,
    lastNames,
    fullName: [firstNames, lastNames].filter(Boolean).join(' ') || legacyFullName,
    documentType: (source.documentType ?? 'V') as AffiliateRow['documentType'],
    documentNumber: String(source.documentNumber ?? ''),
    usesOwnDocument: Boolean(source.usesOwnDocument),
    birthDate: String(source.birthDate ?? ''),
    relationship: (source.relationship ?? 'Otro') as AffiliateRow['relationship'],
    sex: (source.sex ?? 'M') as AffiliateRow['sex'],
    weightKg: String(source.weightKg ?? ''),
    heightCm: String(source.heightCm ?? ''),
    requestedPlan,
    coverageLimit,
    fee: Number(source.fee ?? 0),
  };
};

const deserializeHealthDeclaration = (value: unknown): HealthDeclarationSection => {
  const source = asRecord(value);
  const rawQuestions = asRecord(source.questions);
  const questions = Object.fromEntries(
    Object.entries(rawQuestions).map(([questionId, rawQuestion]) => {
      const question = asRecord(rawQuestion);
      const rawAntecedent = asRecord(question.antecedentDetail);
      const legacyAntecedent = Object.keys(rawAntecedent).length > 0
        ? [{
            field1: String(rawAntecedent.field1 ?? ''),
            field2: String(rawAntecedent.field2 ?? ''),
            field3: String(rawAntecedent.field3 ?? ''),
            field4: String(rawAntecedent.field4 ?? ''),
          }]
        : [];
      const rawAntecedentList = Array.isArray(question.antecedentDetails)
        ? question.antecedentDetails
        : [];
      const antecedentList = [
        ...rawAntecedentList.map((value) => {
          const detail = asRecord(value);
          return {
            field1: String(detail.field1 ?? ''),
            field2: String(detail.field2 ?? ''),
            field3: String(detail.field3 ?? ''),
            field4: String(detail.field4 ?? ''),
          };
        }),
        ...legacyAntecedent,
      ];
      const hasAntecedents = antecedentList.length > 0;
      const firstAntecedent = antecedentList[0];
      return [questionId, {
        answer: (question.answer ?? 'NO') as 'SÍ' | 'NO',
        extraDetails: question.extraDetails as string | undefined,
        affiliateAnswers: question.affiliateAnswers as HealthDeclarationSection['questions'][number]['affiliateAnswers'],
        extraDetailsByAffiliate: question.extraDetailsByAffiliate as HealthDeclarationSection['questions'][number]['extraDetailsByAffiliate'],
        affiliateCodes: question.affiliateCodes as number[] | undefined,
        antecedentDetail: hasAntecedents ? firstAntecedent : undefined,
        antecedentDetails: hasAntecedents ? antecedentList : undefined,
      }];
    }),
  ) as HealthDeclarationSection['questions'];

  const sportDetails = (Array.isArray(source.sportDetails) ? source.sportDetails : [])
    .map((value) => {
      const detail = asRecord(value);
      return {
        id: detail.id as string | undefined,
        affiliateCode: Number(detail.affiliateCode ?? 0),
        sport: String(detail.sport ?? ''),
        frequency: String(detail.frequency ?? '').replace(/\D/g, ''),
        level: (detail.level ?? '') as 'Amateur' | 'Profesional' | '',
      };
    });

  const rawClarificationDetails = asRecord(source.clarificationDetails);
  const clarificationDetails = Object.fromEntries(
    Object.entries(rawClarificationDetails).map(([questionId, values]) => [
      questionId,
      (Array.isArray(values) ? values : []).map((value) => {
        const detail = asRecord(value);
        return {
          id: detail.id as string | undefined,
          affiliateCode: Number(detail.affiliateCode ?? 0),
          field1: String(detail.field1 ?? ''),
          field2: String(detail.field2 ?? ''),
          field2Number: String(detail.field2Number ?? ''),
          field2Unit: String(detail.field2Unit ?? ''),
        };
      }),
    ]),
  );

  const medicalConditionDetails = (
    Array.isArray(source.medicalConditionDetails) ? source.medicalConditionDetails : []
  ).map((value) => {
    const detail = asRecord(value);
    return {
      id: String(detail.id ?? ''),
      questionId: Number(detail.questionId) || undefined,
      affiliateCode: detail.affiliateCode as number | string,
      condition: String(detail.condition ?? ''),
      diagnosisDate: String(detail.diagnosisDate ?? ''),
      treatment: String(detail.treatment ?? ''),
      lastCheckupDate: String(detail.lastCheckupDate ?? ''),
      hospital: String(detail.hospital ?? ''),
    };
  });

  return { questions, sportDetails, clarificationDetails, medicalConditionDetails };
};

export const deserializeAffiliationDraft = (value: unknown): AffiliationFormState => {
  const source = asRecord(value);
  return {
    header: deserializeHeader(source.header),
    policyholder: deserializeNaturalPerson(source.policyholder),
    contractor: deserializeContractor(source.contractor),
    affiliates: (Array.isArray(source.affiliates) ? source.affiliates : []).map(deserializeAffiliate),
    healthDeclaration: deserializeHealthDeclaration(source.healthDeclaration),
    payment: deserializePayment(source.payment),
    signatures: deserializeSignatures(source.signatures),
    broker: deserializeBroker(source.broker),
    attachedDocuments: source.attachedDocuments as AffiliationFormState['attachedDocuments'],
  };
};

export const serializeAffiliationDraft = (
  state: AffiliationFormState,
): UnknownRecord => ({ ...state });
