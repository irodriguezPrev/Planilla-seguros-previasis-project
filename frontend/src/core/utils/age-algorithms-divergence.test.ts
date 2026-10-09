import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AffiliateRow } from '@/core/interfaces/affiliation.interfaces';
import { calculateActuarialAge, isMinor } from './age.utils';
import {
  applyMinorDocument,
  formatAffiliateDocumentForPdf,
  requiresMinorDocumentChoice,
} from './minor-document.utils';

/**
 * Divergencia entre los tres algoritmos de edad del frontend.
 *
 *   calculateActuarialAge  age.utils.ts        cronológico + redondeo de 6 meses   sin umbral
 *   isMinor                age.utils.ts        cronológico puro, corte por fecha  18
 *   getChronologicalAge    minor-document.utils.ts  cronológico, solo YYYY-MM-DD  13
 *
 * Estos tests fijan el comportamiento ACTUAL de las tres reglas. No son un
 * juicio sobre si el negocio debería unificarlas: si se decide unificarlas,
 * estos casos son la red de seguridad que hay que actualizar.
 */

function fila(overrides: Partial<AffiliateRow> = {}): AffiliateRow {
  return {
    id: 'afiliado-1',
    affiliateCode: 1,
    firstNames: 'Ana',
    lastNames: 'Ruiz',
    fullName: 'Ana Ruiz',
    documentType: 'V',
    documentNumber: 'V12345678',
    usesOwnDocument: true,
    birthDate: '2013-10-01',
    relationship: 'Hijo/a',
    sex: 'M',
    weightKg: '30',
    heightCm: '120',
    requestedPlan: 'Previasís',
    coverageLimit: 10000,
    fee: 240,
    ...overrides,
  };
}

describe('divergencia de edad', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1)); // 1 de octubre de 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('un adolescente de 16 años es menor para isMinor pero no para minor-document', () => {
    const nacimiento = '2010-10-01'; // 16 años exactos
    expect(isMinor(nacimiento)).toBe(true);
    // DIVERGENCIA: el umbral de minor-document es 13, no 18.
    expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(false);
  });

  it('a los 13 años las dos reglas coinciden', () => {
    const nacimiento = '2013-10-01';
    expect(isMinor(nacimiento)).toBe(true);
    expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(true);
  });

  it('el redondeo actuarial puede convertir a un menor de edad en adulto para el plan', () => {
    const nacimiento = '2008-10-02'; // 17 años cronológicos, cumple en 1 día
    // El plan usa la edad actuarial: 18, se trata como adulto.
    expect(calculateActuarialAge(nacimiento)).toBe(18);
    // Pero las otras dos reglas lo siguen tratando como menor de edad.
    expect(isMinor(nacimiento)).toBe(true);
    expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(false);
  });

  it('un mismoAFFiliate puede ver planes de adulto y documento de menor a la vez', () => {
    // Nace en agosto de 2008: a 1 de octubre de 2026 tiene 18 años
    // cronológicos, cumple en unos 10 meses.
    const nacimiento = '2008-08-15';
    expect(calculateActuarialAge(nacimiento)).toBe(18);
    expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(false);
    expect(isMinor(nacimiento)).toBe(false);
  });

  it('a los 80 años el plan sigue siendo elegible y no hay caso de menor', () => {
    // Nace el 2/10: mañana cumple 80, hoy tiene 79 cronológicos y el redondeo
    // actuarial ya lo deja en 80, todavía dentro del rango tarifario 61-80.
    const nacimiento = '1946-10-02';
    expect(calculateActuarialAge(nacimiento)).toBe(80);
    expect(isMinor(nacimiento)).toBe(false);
    expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(false);
  });

  it('el día exacto del cumpleaños de los 80 la edad actuarial sube a 81', () => {
    // DIVERGENCIA: con la referencia a medianoche el próximo cumpleaños de
    // hoy cuenta como "faltan 0 meses" y la regla sube un entero, así que la
    // edad que usa el plan ese día es 81 (fuera del rango 61-80). Con
    // `new Date()` —con hora, como en la aplicación— el cumpleaños de hoy ya
    // pasó y no salta: el caso solo aparece con fechas parseadas.
    const nacimiento = '1946-10-01';
    expect(calculateActuarialAge(nacimiento)).toBe(81);
    expect(isMinor(nacimiento)).toBe(false);
    expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(false);
  });

  describe('formato DD/MM/YYYY aceptado por una regla y rechazado por otra', () => {
    // DIVERGENCIA: getChronologicalAge solo reconoce YYYY-MM-DD, así que una
    // fecha en formato venezolano devuelve null y la regla de menor se salta
    // en silencio, sin error ni aviso.
    const nacimiento = '02/10/2008';

    it('calculateActuarialAge sí interpreta el formato', () => {
      expect(calculateActuarialAge(nacimiento)).toBe(18);
    });

    it('isMinor también lo interpreta', () => {
      // Cumple los 18 mañana, así que sigue siendo menor.
      expect(isMinor(nacimiento)).toBe(true);
    });

    it('la regla de documento de menor no lo interpreta', () => {
      expect(requiresMinorDocumentChoice(fila({ birthDate: nacimiento }))).toBe(false);
    });

    it('un menor real en DD/MM/YYYY no recibe documento de menor', () => {
      // 10 años, pero en formato que getChronologicalAge no reconoce.
      const affiliate = fila({
        birthDate: '10/05/2016',
        documentType: 'V',
        documentNumber: '',
        usesOwnDocument: false,
      });
      expect(requiresMinorDocumentChoice(affiliate)).toBe(false);
      // applyMinorDocument deja la fila intacta: no se asigna el tipo 'M'.
      expect(applyMinorDocument(affiliate, 'V12345678')).toEqual(affiliate);
    });

    it('el mismo menor en YYYY-MM-DD sí recibe documento de menor', () => {
      const affiliate = fila({
        birthDate: '2016-05-10',
        documentType: 'V',
        documentNumber: '',
        usesOwnDocument: false,
      });
      expect(requiresMinorDocumentChoice(affiliate)).toBe(true);
      const resultado = applyMinorDocument(affiliate, 'V12345678');
      expect(resultado.documentType).toBe('M');
      expect(resultado.documentNumber).toBe('12345678');
      expect(resultado.usesOwnDocument).toBe(false);
    });
  });
});

describe('minor-document: formato de documento para PDF', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('un adulto se formatea como tipo-número', () => {
    const affiliate = fila({ documentType: 'V', documentNumber: '12345678' });
    expect(formatAffiliateDocumentForPdf(affiliate, [affiliate])).toBe('V-12345678');
  });

  it('un menor sin gemelos omite el número de secuencia', () => {
    // El sufijo son los dos últimos dígitos del AÑO de nacimiento (2016 -> 16).
    const affiliate = fila({ documentType: 'M', documentNumber: '12345678', birthDate: '2016-05-10' });
    expect(formatAffiliateDocumentForPdf(affiliate, [affiliate])).toBe('M-1234567816');
  });

  it('los menores con la misma fecha de nacimiento se numeran por posición', () => {
    const primero = fila({ id: 'a', documentType: 'M', documentNumber: '12345678', birthDate: '2016-05-10' });
    const segundo = fila({ id: 'b', documentType: 'M', documentNumber: '87654321', birthDate: '2016-05-10' });
    const otros = [primero, segundo];
    expect(formatAffiliateDocumentForPdf(primero, otros)).toBe('M-12345678161');
    expect(formatAffiliateDocumentForPdf(segundo, otros)).toBe('M-87654321162');
  });

  it('los menores con fechas de nacimiento distintas no se numeran', () => {
    const uno = fila({ id: 'a', documentType: 'M', documentNumber: '12345678', birthDate: '2016-05-10' });
    const otro = fila({ id: 'b', documentType: 'M', documentNumber: '87654321', birthDate: '2016-06-11' });
    expect(formatAffiliateDocumentForPdf(uno, [uno, otro])).toBe('M-1234567816');
    expect(formatAffiliateDocumentForPdf(otro, [uno, otro])).toBe('M-8765432116');
  });
});
