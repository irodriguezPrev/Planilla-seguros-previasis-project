/**
 * Interfaces oficiales para la Solicitud de Afiliación Digital
 * Previasis Medicina Prepagada S.A. (R.I.F. J-412048970, Sudeaseg MP-000015)
 * Providencia Administrativa Nº SAA-09-1585 del 4 de marzo de 2026
 */

export type TipoOperacion = 'Emisión' | 'Inclusión';
export type TipoContrato = 'Individual' | 'Colectivo';
export type TipoDocumento = 'V' | 'E' | 'P';
export type TipoRif = 'V' | 'E' | 'J' | 'G';
export type EstadoCivil = 'Soltero(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viudo(a)' | 'Concubinato';
export type Sexo = 'F' | 'M';
export type ClasificacionActividad = 'Independiente' | 'Dependiente' | 'Societaria';
export type TipoPersonaContratante = 'Natural' | 'Juridica';
export type ActividadEconomicaJuridica = 'Profesional' | 'Comercial' | 'Industrial';
export type PlanSolicitado = 'Previasis' | 'Abuelos' | 'Previasis 24/7' | 'Plan Bronce' | 'Plan Plata' | 'Plan Oro' | 'Plan Diamante';
export type FrecuenciaPago = 'Anual' | 'Semestral' | 'Trimestral' | 'Mensual';
export type MonedaPago = 'Bolívares' | 'Dólares';
export type ModalidadPago = 'Domiciliación de Pago' | 'Pago en Oficina' | 'Otro';
export type Parentesco = 'Titular' | 'Cónyuge' | 'Hijo/a' | 'Padre/Madre' | 'Hermano/a' | 'Otro';

export interface UploadedFileItem {
  id: string;
  name: string;
  type: string;
  sizeMb: number;
  previewUrl: string;
  docCategory: 'Cédula de Identidad' | 'R.I.F. Digital' | 'Informe / Soporte Médico' | 'Otro';
}

export interface HeaderSection {
  tipoOperacion: TipoOperacion;
  tipoContrato: TipoContrato;
  numSolicitud?: string;
  fechaSolicitud: string;
}

export interface PersonaNaturalData {
  nombres: string;
  apellidos: string;
  tipoDoc: TipoDocumento;
  numDoc: string;
  tipoRif: TipoRif;
  numRif: string;
  nacionalidad: string;
  estadoCivil: EstadoCivil;
  sexo: Sexo;
  lugarNacimiento: string;
  fechaNacimiento: string;
  profesion: string;
  ocupacion: string;
  ramoComercial?: string;
  ingresoAnualBs: string;
  pep: 'SÍ' | 'NO';
  pepDescripcion?: string;
  clasificacionActividad: ClasificacionActividad;
  direccionHabitacion: string;
  direccionOficina: string;
  direccionCobro: string;
  telefonoHabitacion: string;
  telefonoMovil: string;
  email: string;
}

export interface PersonaJuridicaData {
  razonSocial: string;
  tipoRif: 'J' | 'G';
  numRif: string;
  numRegistroMercantil: string;
  numTomo: string;
  fechaRegistro: string;
  actividadEconomica: ActividadEconomicaJuridica;
  ramoComercial?: string;
  productosServicios: string;
  direccionFiscal: string;
  telefono: string;
  utilidadEjercicioAnterior: string;
  patrimonioNeto: string;
  representanteLegal: PersonaNaturalData;
}

export interface contractorSection {
  esDiferente: boolean;
  tipoPersona: TipoPersonaContratante;
  personaNatural: PersonaNaturalData;
  personaJuridica: PersonaJuridicaData;
}

export interface AfiliadoRow {
  id: string;
  codigoAfiliado: number;
  nombreCompleto: string;
  tipoDoc: TipoDocumento;
  numDoc: string;
  fechaNacimiento: string;
  parentesco: Parentesco;
  sexo: Sexo;
  pesoKg: string;
  estaturaCm: string;
  planSolicitado: string;
  limiteCobertura: string;
  cuota: number;
}

export interface AfeccionMedicaDetalle {
  id: string;
  codigoAfiliado: number | string;
  padecimiento: string;
  fechaDiagnostico: string;
  tratamientoPracticado: string;
  fechaUltimoChequeo: string;
  institucionHospitalaria: string;
}

export interface PreguntaSalud {
  id: number;
  texto: string;
  categoria?: string;
  respuesta: 'SÍ' | 'NO';
  detallesExtra?: string;
}

export interface DetalleDeportivo {
  codigoAfiliado: number;
  deporte: string;
  frecuencia: string;
  nivel: 'Amateur' | 'Profesional' | '';
}

export interface DeclaracionSaludSection {
  preguntas: Record<number, {
    respuesta: 'SÍ' | 'NO';
    detallesExtra?: string;
    codigosAfiliados?: number[];
  }>;
  detallesDeportivos?: DetalleDeportivo[];
  afeccionesDetalles: AfeccionMedicaDetalle[];
}

export interface ContratoExistente {
  tiene: 'SÍ' | 'NO';
  numContrato?: string;
  nombreCompania?: string;
  limiteCobertura?: string;
  fechaVigencia?: string;
}

export interface NegativaPrevia {
  tiene: 'SÍ' | 'NO';
  tipoSeguro?: string;
  nombreCompania?: string;
  limiteCobertura?: string;
  fechaRechazo?: string;
}

export interface FormaDePagoSection {
  otrosContratos: ContratoExistente;
  negativaPrevia: NegativaPrevia;
  frecuenciaPago: FrecuenciaPago;
  moneda: MonedaPago;
  modalidadPago: ModalidadPago;
  especifiqueOtroPago?: string;
}

export interface DeclaracionesFirmasSection {
  lugar: string;
  fecha: string;
  firmaTitularBase64: string | null;
  firmaContratanteBase64: string | null;
  aceptaDeclaracionTitular: boolean;
  aceptaOrigenFondosContratante: boolean;
}

export interface IntermediarioSection {
  nombreApellido: string;
  numCredencial: string;
  tipoDoc: TipoDocumento | TipoRif;
  ciRifPasaporte: string;
}

export interface SolicitudAfiliacionFormState {
  header: HeaderSection;
  titular: PersonaNaturalData;
  contratante: contractorSection;
  afiliados: AfiliadoRow[];
  salud: DeclaracionSaludSection;
  pago: FormaDePagoSection;
  firmas: DeclaracionesFirmasSection;
  intermediario: IntermediarioSection;
  documentosAdjuntos?: UploadedFileItem[];
}
