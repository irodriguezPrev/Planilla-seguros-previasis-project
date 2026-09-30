import type {
  SignerRole,
  SigningFormData,
  SigningMode,
  SigningStatus,
} from "./signing";

export interface RequestMetadata {
  ip: string | null;
  userAgent: string | null;
}

export interface CreateSigningRequestsResult {
  expedienteId: string;
  expiresAt: string;
  requests: Array<{ role: SignerRole; signerName: string; url: string }>;
}

export interface SellerReferral {
  codigo_referido: string;
  nombre_apellido: string;
  num_credencial: string;
}

export interface ReferralProfile extends SellerReferral {
  id_vendedor: string;
  tipo_doc: "V" | "E" | "J" | "P";
  ci_rif_pasaporte: string;
}

export interface SigningAccessData {
  ok: true;
  role: SignerRole;
  signerName: string;
  documentMask: string;
  mode: SigningMode;
  editableSections: string[];
  status: SigningStatus;
  expedienteStatus: string;
  expiresAt: string;
  formData: SigningFormData;
}

export interface SignedDocumentData {
  ok: true;
  status: string;
  formData: SigningFormData;
  signedAt: string;
}

export type OperationResult<T> =
  | { ok: false; status: number; code: string; message: string }
  | { ok: true; data: T };
