export type PdfTableCell = {
  label: string;
  value: string;
  x: number;
  w: number;
};

export type NaturalPersonRowValues = Record<
  | 'firstNames'
  | 'lastNames'
  | 'documentType'
  | 'documentNumber'
  | 'taxIdType'
  | 'taxId'
  | 'nationality'
  | 'maritalStatus'
  | 'sex'
  | 'birthDate'
  | 'birthPlace'
  | 'profession'
  | 'occupation'
  | 'annualIncomeBs'
  | 'politicallyExposed'
  | 'activityClassification'
  | 'homeAddress'
  | 'officeAddress'
  | 'billingAddress'
  | 'homePhone'
  | 'mobilePhone'
  | 'email',
  string
> & {
  politicallyExposedDescription?: string;
  company?: string;
  businessSector?: string;
};

export interface LegalEntityRowValues {
  razonSocial: string;
  rif: string;
  registroMercantil: string;
  volumenTomo: string;
  fechaRegistro: string;
  actividadEconomica: string;
  sector: string;
  telefono: string;
  telefonoMovil: string;
  correoElectronico: string;
  utilidadEjercicioAnterior: string;
  patrimonioNeto: string;
  productosServicios: string;
  direccionFiscal: string;
}

export type PdfGenerationMode = 'draft' | 'final';

export interface PdfGenerationOptions {
  mode?: PdfGenerationMode;
}
