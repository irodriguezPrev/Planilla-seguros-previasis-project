import type { SignatureEvidence } from '@/core/interfaces/affiliation.interfaces';

export function captureSignatureEvidence(previous?: SignatureEvidence | null): SignatureEvidence {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return {
    id: previous?.id ?? Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase(),
    signedAt: new Date().toISOString(),
    device: navigator.userAgent,
    authentication: 'local',
  };
}
