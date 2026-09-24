import {
  PaymentFrequency,
  PaymentCurrency,
  PaymentMethod,
} from '@/core/interfaces/affiliation.interfaces';

export const PAYMENT_FREQUENCIES_BY_CURRENCY: Record<PaymentCurrency, PaymentFrequency[]> = {
  Bolívares: ['Mensual', 'Trimestral'],
  Dólares: ['Mensual', 'Trimestral', 'Semestral', 'Anual'],
};

export const PAYMENT_METHODS_BY_CURRENCY: Record<PaymentCurrency, PaymentMethod[]> = {
  Bolívares: ['Domiciliación de Pago', 'Pago en Oficina', 'Otro'],
  Dólares: ['Domiciliación de Pago', 'Pago en Oficina', 'Pagos en Divisas', 'Zelle', 'Otro'],
};

export const PAYMENT_FREQUENCY_TRANSLATION_KEYS = {
  Mensual: 'frequency.monthly',
  Trimestral: 'frequency.quarterly',
  Semestral: 'frequency.semiannual',
  Anual: 'frequency.annual',
} as const satisfies Record<PaymentFrequency, string>;

export const PAYMENT_METHOD_TRANSLATION_KEYS = {
  'Domiciliación de Pago': 'method.directDebit',
  'Pago en Oficina': 'method.office',
  'Pagos en Divisas': 'method.foreignCurrency',
  Zelle: 'method.zelle',
  Otro: 'method.other',
} as const satisfies Record<PaymentMethod, string>;

export const PAYMENT_CURRENCY_TRANSLATION_KEYS = {
  Bolívares: 'currency.bolivars',
  Dólares: 'currency.dollars',
} as const satisfies Record<PaymentCurrency, string>;
