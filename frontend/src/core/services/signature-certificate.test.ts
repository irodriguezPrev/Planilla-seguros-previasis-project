import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { deserializeAffiliationDraft } from '@/core/utils/affiliation-draft.mapper';
import { appendSignatureCertificate } from './signature-certificate';

describe('signature certificate', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it('does not certify an unsigned form', () => {
    const doc = new jsPDF();
    appendSignatureCertificate(doc, deserializeAffiliationDraft({}));
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('preserves recorded IDs after loading and generating multiple PDFs', () => {
    vi.stubGlobal('window', { location: { origin: 'https://previasis.example' } });
    const source = {
      policyholder: { firstNames: 'Ana', lastNames: 'Perez', email: 'ana@example.com' },
      signatures: {
        policyholderSignatureBase64: 'data:image/png;base64,invalid',
        policyholderEvidence: {
          id: 'AABBCCDDEEFF00112233445566778899',
          signedAt: '2026-10-07T12:00:00.000Z',
          authentication: 'link',
          device: 'Test browser',
          ip: '192.0.2.1',
        },
      },
    };
    for (let i = 0; i < 2; i++) {
      const doc = new jsPDF();
      appendSignatureCertificate(doc, deserializeAffiliationDraft(source));
      expect(doc.getNumberOfPages()).toBe(2);
      const pdf = doc.output();
      expect(pdf).toContain(source.signatures.policyholderEvidence.id);
      expect(pdf).toContain('https://previasis.example/documento/' + source.signatures.policyholderEvidence.id);
      expect(pdf).toContain('2026-10-07 12:00:00 UTC');
      expect(pdf).toContain('192.0.2.1');
      expect(pdf).toContain('No registrado');
      expect(pdf).not.toContain('Razón');
    }
  });
});
