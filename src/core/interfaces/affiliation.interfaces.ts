export type OperationType = 'Emisión' | 'Inclusión';
export type ContractType = 'Individual' | 'Colectivo';
export type DocumentType = 'V' | 'E' | 'P' | 'M';
export type TaxIdType = 'V' | 'E' | 'J' | 'G';
export type MaritalStatus = 'Soltero(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viudo(a)' | 'Concubinato';
export type Sex = 'F' | 'M';
export type ActivityClassification = 'Independiente' | 'Dependiente' | 'Societaria';
export type ContractorPersonType = 'Natural' | 'Juridica';
export type LegalEconomicActivity = 'Profesional' | 'Comercial' | 'Industrial';
export type RequestedPlan = 'Previasis' | 'Abuelos' | 'Previasis 24/7' | 'Plan Bronce' | 'Plan Plata' | 'Plan Oro' | 'Plan Diamante';
export type PaymentFrequency = 'Anual' | 'Semestral' | 'Trimestral' | 'Mensual';
export type PaymentCurrency = 'Bolívares' | 'Dólares';
export type PaymentMethod = 'Domiciliación de Pago' | 'Pago en Oficina' | 'Pagos en Divisas' | 'Zelle' | 'Otro';
export type Relationship = 'Titular' | 'Cónyuge' | 'Hijo/a' | 'Padre/Madre' | 'Hermano/a' | 'Otro';

export interface UploadedFileItem {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
  previewUrl: string;
  docCategory: 'Cédula de Identidad' | 'R.I.F. Digital' | 'Informe / Soporte Médico' | 'Otro';
}

export interface HeaderSection {
  operationType: OperationType;
  contractType: ContractType;
  applicationNumber?: string;
  applicationDate: string;
}

export interface NaturalPersonData {
  firstNames: string;
  lastNames: string;
  documentType: DocumentType;
  documentNumber: string;
  taxIdType: TaxIdType;
  taxId: string;
  nationality: string;
  maritalStatus: MaritalStatus;
  sex: Sex;
  birthPlace: string;
  birthDate: string;
  profession: string;
  occupation: string;
  businessSector?: string;
  annualIncomeBs: string;
  politicallyExposed: 'SÍ' | 'NO';
  politicallyExposedDescription?: string;
  activityClassification: ActivityClassification;
  company?: string;
  residenceState?: string;
  residenceCity?: string;
  homeAddress: string;
  officeAddress: string;
  billingAddress: string;
  homePhone: string;
  mobilePhone: string;
  email: string;
}

export interface LegalEntityData {
  legalName: string;
  taxIdType: 'J' | 'G';
  taxId: string;
  commercialRegistryNumber: string;
  volumeNumber: string;
  registrationDate: string;
  economicActivity: LegalEconomicActivity;
  businessSector?: string;
  productsServices: string;
  taxAddress: string;
  phone: string;
  previousFiscalYearProfit: string;
  netWorth: string;
  legalRepresentative: NaturalPersonData;
}

export interface ContractorSection {
  isDifferent: boolean;
  personType: ContractorPersonType;
  naturalPerson: NaturalPersonData;
  legalEntity: LegalEntityData;
}

export interface AffiliateRow {
  id: string;
  affiliateCode: number;
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  usesOwnDocument?: boolean;
  birthDate: string;
  relationship: Relationship;
  sex: Sex;
  weightKg: string;
  heightCm: string;
  requestedPlan: string;
  coverageLimit: string;
  fee: number;
}

export interface MedicalConditionDetail {
  id: string;
  questionId?: number;
  affiliateCode: number | string;
  condition: string;
  diagnosisDate: string;
  treatment: string;
  lastCheckupDate: string;
  hospital: string;
}

export interface HealthQuestion {
  id: number;
  text: string;
  category?: string;
  answer: 'SÍ' | 'NO';
  extraDetails?: string;
  antecedentDetail?: AntecedentDetail;
}

export interface SportDetail {
  id?: string;
  affiliateCode: number;
  sport: string;
  frequency: string;
  level: 'Amateur' | 'Profesional' | '';
}

export interface ClarificationDetail {
  id?: string;
  affiliateCode: number;
  field1: string;
  field2: string;
}

export interface AntecedentDetail {
  field1: string;
  field2: string;
}

export interface HealthDeclarationSection {
  questions: Record<number, {
    answer: 'SÍ' | 'NO';
    extraDetails?: string;
    affiliateAnswers?: Partial<Record<number, 'SÍ' | 'NO'>>;
    extraDetailsByAffiliate?: Partial<Record<number, string>>;
    affiliateCodes?: number[];
    antecedentDetail?: AntecedentDetail;
  }>;
  sportDetails?: SportDetail[];
  clarificationDetails?: Record<number, ClarificationDetail[]>;
  medicalConditionDetails: MedicalConditionDetail[];
}

export interface PaymentSection {
  paymentFrequency: PaymentFrequency;
  currency: PaymentCurrency;
  method: PaymentMethod;
  otherPaymentDetails?: string;
}

export interface DeclarationsSignaturesSection {
  place: string;
  date: string;
  policyholderSignatureBase64: string | null;
  contractorSignatureBase64: string | null;
  acceptsPolicyholderDeclaration: boolean;
  acceptsContractorSourceOfFunds: boolean;
}

export interface BrokerSection {
  fullName: string;
  credentialNumber: string;
  documentType: DocumentType | TaxIdType;
  identityOrTaxNumber: string;
}

export interface AffiliationFormState {
  header: HeaderSection;
  policyholder: NaturalPersonData;
  contractor: ContractorSection;
  affiliates: AffiliateRow[];
  healthDeclaration: HealthDeclarationSection;
  payment: PaymentSection;
  signatures: DeclarationsSignaturesSection;
  broker: BrokerSection;
  attachedDocuments?: UploadedFileItem[];
}
