import { describe, expect, it } from 'vitest';

import {
  isValidEmail,
  isValidVenezuelanMobilePhone,
  normalizePhoneNumber,
} from '@/core/utils/contact-validation.utils';

describe('normalizePhoneNumber', () => {
  it('elimina todo lo que no sea dígito', () => {
    expect(normalizePhoneNumber('+58 (0412) 123-4567')).toBe('5804121234567');
    expect(normalizePhoneNumber('0412 123 4567')).toBe('04121234567');
    expect(normalizePhoneNumber('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('acepta emails con dominio y TLD', () => {
    expect(isValidEmail('usuario@previasis.com')).toBe(true);
    expect(isValidEmail('a.b+tag@sub.dominio.com.ve')).toBe(true);
    expect(isValidEmail('  usuario@previasis.com  ')).toBe(true);
  });

  it('rechaza formatos incompletos', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('usuario')).toBe(false);
    expect(isValidEmail('@previasis.com')).toBe(false);
    expect(isValidEmail('usuario@previasis')).toBe(false);
    expect(isValidEmail('usuario previasis@previasis.com')).toBe(false);
    expect(isValidEmail('usuario@dominio .com')).toBe(false);
  });
});

describe('isValidVenezuelanMobilePhone', () => {
  it('acepta el prefijo local 04XX', () => {
    expect(isValidVenezuelanMobilePhone('04121234567')).toBe(true);
    expect(isValidVenezuelanMobilePhone('04141234567')).toBe(true);
    expect(isValidVenezuelanMobilePhone('04161234567')).toBe(true);
    expect(isValidVenezuelanMobilePhone('04241234567')).toBe(true);
    expect(isValidVenezuelanMobilePhone('04261234567')).toBe(true);
  });

  it('acepta el formato internacional 584XX sin el 0 interno', () => {
    expect(isValidVenezuelanMobilePhone('584121234567')).toBe(true);
  });

  it('ignora espacios, guiones y símbolos', () => {
    expect(isValidVenezuelanMobilePhone('0412-123-4567')).toBe(true);
    expect(isValidVenezuelanMobilePhone('+58 412 123 4567')).toBe(true);
  });

  it('rechaza operadores inexistentes y números incompletos', () => {
    expect(isValidVenezuelanMobilePhone('04111234567')).toBe(false);
    expect(isValidVenezuelanMobilePhone('0412123456')).toBe(false);
    expect(isValidVenezuelanMobilePhone('02121234567')).toBe(false);
    expect(isValidVenezuelanMobilePhone('12345')).toBe(false);
    expect(isValidVenezuelanMobilePhone('')).toBe(false);
  });

  it('rechaza el internacional mal formado con 0 interno', () => {
    // Comportamiento actual: "+58 0412..." se normaliza a 580412... que no
    // cumple el patrón 584XX. Solo se acepta sin el 0 del prefijo local.
    expect(isValidVenezuelanMobilePhone('+58 0412 123 4567')).toBe(false);
  });
});
