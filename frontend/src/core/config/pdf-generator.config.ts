import type {
  LegalEntityRowValues,
  NaturalPersonRowValues,
} from '@/core/interfaces/pdf-generator.interfaces';

export const PDF_NOT_APPLICABLE = 'N/A';

// Conserva la estructura completa del cuadro jurídico cuando no corresponde.
export const LEGAL_ENTITY_NA_VALUES: LegalEntityRowValues = {
  razonSocial: PDF_NOT_APPLICABLE,
  rif: PDF_NOT_APPLICABLE,
  registroMercantil: PDF_NOT_APPLICABLE,
  volumenTomo: PDF_NOT_APPLICABLE,
  fechaRegistro: PDF_NOT_APPLICABLE,
  actividadEconomica: PDF_NOT_APPLICABLE,
  sector: PDF_NOT_APPLICABLE,
  telefono: PDF_NOT_APPLICABLE,
  telefonoMovil: PDF_NOT_APPLICABLE,
  correoElectronico: PDF_NOT_APPLICABLE,
  utilidadEjercicioAnterior: PDF_NOT_APPLICABLE,
  patrimonioNeto: PDF_NOT_APPLICABLE,
  productosServicios: PDF_NOT_APPLICABLE,
  direccionFiscal: PDF_NOT_APPLICABLE,
};

// Conserva la estructura completa del cuadro de persona natural cuando no corresponde.
export const NATURAL_PERSON_NA_VALUES: NaturalPersonRowValues = {
  firstNames: PDF_NOT_APPLICABLE,
  lastNames: '',
  documentType: PDF_NOT_APPLICABLE,
  documentNumber: '',
  taxIdType: PDF_NOT_APPLICABLE,
  taxId: '',
  nationality: PDF_NOT_APPLICABLE,
  maritalStatus: PDF_NOT_APPLICABLE,
  sex: PDF_NOT_APPLICABLE,
  birthDate: PDF_NOT_APPLICABLE,
  birthPlace: PDF_NOT_APPLICABLE,
  profession: PDF_NOT_APPLICABLE,
  occupation: PDF_NOT_APPLICABLE,
  annualIncomeBs: PDF_NOT_APPLICABLE,
  politicallyExposed: PDF_NOT_APPLICABLE,
  politicallyExposedDescription: '',
  activityClassification: PDF_NOT_APPLICABLE,
  company: '',
  businessSector: '',
  homeAddress: PDF_NOT_APPLICABLE,
  officeAddress: PDF_NOT_APPLICABLE,
  billingAddress: PDF_NOT_APPLICABLE,
  homePhone: PDF_NOT_APPLICABLE,
  mobilePhone: PDF_NOT_APPLICABLE,
  email: PDF_NOT_APPLICABLE,
};
