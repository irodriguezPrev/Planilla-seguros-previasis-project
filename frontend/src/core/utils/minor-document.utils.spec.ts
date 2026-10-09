import { describe, expect, it } from 'vitest';

import type { AffiliateRow } from '@/core/interfaces/affiliation.interfaces';
import {
  applyMinorDocument,
  formatAffiliateDocumentForPdf,
  isMinorWithoutIdentityCard,
  requiresMinorDocumentChoice,
} from '@/core/utils/minor-document.utils';
import { birthDateYearsAgo } from '@/test/date-helpers';

const makeAffiliate = (overrides: Partial<AffiliateRow> = {}): AffiliateRow => ({
  id: 'af-1',
  affiliateCode: 1,
  firstNames: 'Ana',
  lastNames: 'Pérez',
  fullName: 'Ana Pérez',
  documentType: 'V',
  documentNumber: '12345678',
  usesOwnDocument: true,
  birthDate: '2010-01-01',
  relationship: 'Hijo/a',
  sex: 'F',
  weightKg: '30',
  heightCm: '140',
  requestedPlan: 'Previasís',
  coverageLimit: 10000,
  fee: 0,
  ...overrides,
});

describe('requiresMinorDocumentChoice', () => {
  it('aplica hasta los 13 años inclusive', () => {
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: birthDateYearsAgo(10) }))).toBe(true);
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: birthDateYearsAgo(13) }))).toBe(true);
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: birthDateYearsAgo(14) }))).toBe(false);
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: birthDateYearsAgo(20) }))).toBe(false);
  });

  it('no aplica con una fecha de nacimiento mal formada', () => {
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: '10/01/2015' }))).toBe(false);
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: '' }))).toBe(false);
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: 'sin fecha' }))).toBe(false);
  });

  it('solo valida la forma AAAA-MM-DD, no el calendario', () => {
    // Comportamiento actual: 2015-02-31 pasa la expresión regular y la
    // edad se calcula solo con año/mes/día, así que se toma como válida.
    expect(requiresMinorDocumentChoice(makeAffiliate({ birthDate: '2015-02-31' }))).toBe(true);
  });
});

describe('isMinorWithoutIdentityCard', () => {
  it('es true solo si es menor y no usa documento propio', () => {
    expect(
      isMinorWithoutIdentityCard(
        makeAffiliate({ birthDate: birthDateYearsAgo(10), usesOwnDocument: false }),
      ),
    ).toBe(true);
    expect(
      isMinorWithoutIdentityCard(
        makeAffiliate({ birthDate: birthDateYearsAgo(10), usesOwnDocument: true }),
      ),
    ).toBe(false);
    expect(
      isMinorWithoutIdentityCard(
        makeAffiliate({ birthDate: birthDateYearsAgo(20), usesOwnDocument: false }),
      ),
    ).toBe(false);
  });
});

describe('applyMinorDocument', () => {
  const policyholderDocument = 'V-12.345.678';

  it('asigna el documento del titular cuando el menor no tiene documento', () => {
    const minor = makeAffiliate({
      birthDate: birthDateYearsAgo(10),
      documentType: 'V',
      documentNumber: '',
      usesOwnDocument: false,
    });

    expect(applyMinorDocument(minor, policyholderDocument)).toEqual({
      ...minor,
      documentType: 'M',
      documentNumber: '12345678',
      usesOwnDocument: false,
    });
  });

  it('conserva el documento propio si el menor ya tiene número distinto de M', () => {
    const minor = makeAffiliate({
      birthDate: birthDateYearsAgo(10),
      documentType: 'V',
      documentNumber: '99887766',
      usesOwnDocument: false,
    });

    expect(applyMinorDocument(minor, policyholderDocument)).toEqual({
      ...minor,
      usesOwnDocument: true,
    });
  });

  it('respeta la elección de documento propio del menor', () => {
    const minor = makeAffiliate({
      birthDate: birthDateYearsAgo(10),
      documentType: 'E',
      documentNumber: '1234567',
      usesOwnDocument: true,
    });

    const result = applyMinorDocument(minor, policyholderDocument);

    expect(result.usesOwnDocument).toBe(true);
    expect(result.documentType).toBe('E');
    expect(result.documentNumber).toBe('1234567');
  });

  it('resetea el documento tipo M de un menor que ya no aplica', () => {
    const adult = makeAffiliate({
      birthDate: birthDateYearsAgo(20),
      documentType: 'M',
      documentNumber: '1234567815',
      usesOwnDocument: false,
    });

    expect(applyMinorDocument(adult, policyholderDocument)).toEqual({
      ...adult,
      documentType: 'V',
      documentNumber: '',
      usesOwnDocument: false,
    });
  });

  it('devuelve la misma referencia si no hay nada que cambiar', () => {
    const adult = makeAffiliate({ birthDate: birthDateYearsAgo(20), documentType: 'V' });

    expect(applyMinorDocument(adult, policyholderDocument)).toBe(adult);
  });
});

describe('formatAffiliateDocumentForPdf', () => {
  it('formatea los documentos que no son tipo M como TIPO-número', () => {
    expect(
      formatAffiliateDocumentForPdf(
        makeAffiliate({ documentType: 'V', documentNumber: '12345678' }),
        [],
      ),
    ).toBe('V-12345678');
  });

  it('agrega el año de nacimiento a los documentos tipo M', () => {
    const affiliate = makeAffiliate({
      documentType: 'M',
      documentNumber: '123',
      birthDate: '2015-04-10',
    });

    expect(formatAffiliateDocumentForPdf(affiliate, [affiliate])).toBe('M-12315');
  });

  it('acepta la fecha de nacimiento en formato DD/MM/YYYY', () => {
    const affiliate = makeAffiliate({
      documentType: 'M',
      documentNumber: '123',
      birthDate: '10/04/2015',
    });

    expect(formatAffiliateDocumentForPdf(affiliate, [affiliate])).toBe('M-12315');
  });

  it('sin año de nacimiento no agrega sufijo', () => {
    const affiliate = makeAffiliate({
      documentType: 'M',
      documentNumber: '123',
      birthDate: '',
    });

    expect(formatAffiliateDocumentForPdf(affiliate, [affiliate])).toBe('M-123');
  });

  it('numera a los hermanos con la misma fecha de nacimiento', () => {
    const first = makeAffiliate({
      id: 'a',
      documentType: 'M',
      documentNumber: '123',
      birthDate: '2015-04-10',
    });
    const second = makeAffiliate({
      id: 'b',
      documentType: 'M',
      documentNumber: '456',
      birthDate: '2015-04-10',
    });

    expect(formatAffiliateDocumentForPdf(first, [first, second])).toBe('M-123151');
    expect(formatAffiliateDocumentForPdf(second, [first, second])).toBe('M-456152');
  });

  it('no numera si la fecha de nacimiento no coincide con otros tipo M', () => {
    const affiliate = makeAffiliate({
      documentType: 'M',
      documentNumber: '123',
      birthDate: '2015-04-10',
    });
    const other = makeAffiliate({
      id: 'b',
      documentType: 'M',
      documentNumber: '456',
      birthDate: '2016-04-10',
    });

    expect(formatAffiliateDocumentForPdf(affiliate, [affiliate, other])).toBe('M-12315');
  });
});
