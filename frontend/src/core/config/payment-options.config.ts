import {
  FrecuenciaPago,
  MonedaPago,
  ModalidadPago,
} from '@/core/interfaces/affiliation.interfaces';

export const FRECUENCIA_BY_MONEDA: Record<MonedaPago, FrecuenciaPago[]> = {
  Bolívares: ['Mensual', 'Trimestral'],
  Dólares: ['Mensual', 'Trimestral', 'Semestral', 'Anual'],
};

export const MODALIDAD_PAGO_BY_MONEDA: Record<MonedaPago, ModalidadPago[]> = {
  Bolívares: ['Domiciliación de Pago', 'Pago en Oficina', 'Otro'],
  Dólares: ['Domiciliación de Pago', 'Pago en Oficina', 'Pagos en Divisas', 'Zelle', 'Otro'],
};

export const labelFrecuenciaPago: Record<FrecuenciaPago, string> = {
  Mensual: 'Mensual',
  Trimestral: 'Trimestral',
  Semestral: 'Semestral',
  Anual: 'Anual',
};

export const labelModalidadPago: Record<ModalidadPago, string> = {
  'Domiciliación de Pago': 'Domiciliación Bancaria / Cargo Automático',
  'Pago en Oficina': 'Pago Directo en Oficina Previasis',
  'Pagos en Divisas': 'Pago en Divisas',
  Zelle: 'Zelle',
  Otro: 'Otro (Transferencia / Zelle / Pago Móvil)',
};
