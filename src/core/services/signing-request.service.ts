import { AffiliationFormState, BrokerSection } from '@/core/interfaces/affiliation.interfaces';
import { envConfig } from '@/core/config/env.config';
import { storage } from '@/core/utils/storage.utils';

export type RemoteSignerRole = 'TITULAR' | 'CONTRATANTE';

export interface SigningRequestLink {
  role: RemoteSignerRole;
  signerName: string;
  url: string;
}

export interface CreateSigningRequestResponse {
  expedienteId: string;
  expiresAt: string;
  requests: SigningRequestLink[];
}

export interface SigningAccessResponse {
  ok: true;
  role: RemoteSignerRole;
  signerName: string;
  documentMask: string;
  mode: 'SOLO_FIRMA' | 'EDITAR_Y_FIRMAR';
  editableSections: string[];
  status: 'PENDIENTE' | 'FIRMADO';
  expedienteStatus: string;
  expiresAt: string;
  formData: AffiliationFormState;
}

export interface SignDocumentPayload {
  lastFour: string;
  signatureDataUrl: string;
  place: string;
  acceptsPolicyholderDeclaration: boolean;
  acceptsContractorSourceOfFunds: boolean;
}

export interface SignDocumentResponse {
  ok: true;
  status: 'FIRMADO' | 'PARCIALMENTE_FIRMADO';
  formData: AffiliationFormState;
  signedAt: string;
}

export interface ReferralProfileResponse {
  broker: BrokerSection;
}

export interface MyReferralResponse {
  referralUrl: string;
  referralCode: string;
  sellerName: string;
  credentialNumber: string;
}

export class RemoteSigningError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new RemoteSigningError(
      String(body.message ?? 'No fue posible completar la solicitud.'),
      response.status,
      typeof body.error === 'string' ? body.error : undefined,
    );
  }
  return body as T;
};

const signingApiBase = `${envConfig.backendUrl.replace(/\/$/, '')}/api`;

export const createRemoteSigningRequest = async (
  formData: AffiliationFormState,
): Promise<CreateSigningRequestResponse> => {
  const token = storage.getToken();
  return requestJson<CreateSigningRequestResponse>(`${signingApiBase}/signing-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ formData }),
  });
};

export const accessRemoteSigningRequest = (
  token: string,
  lastFour: string,
): Promise<SigningAccessResponse> => requestJson(`${signingApiBase}/signing-requests/${encodeURIComponent(token)}/access`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lastFour }),
});

export const signRemoteDocument = (
  token: string,
  payload: SignDocumentPayload,
): Promise<SignDocumentResponse> => requestJson(`${signingApiBase}/signing-requests/${encodeURIComponent(token)}/sign`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

export const getReferralProfile = (code: string): Promise<ReferralProfileResponse> =>
  requestJson(`${signingApiBase}/referrals/${encodeURIComponent(code)}`, { cache: 'no-store' });

export const getMyReferral = (): Promise<MyReferralResponse> => {
  const token = storage.getToken();
  return requestJson(`${signingApiBase}/referrals/me`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};
