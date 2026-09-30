import type {
  CreateSigningRequestsResult,
  OperationResult,
  ReferralProfile,
  RequestMetadata,
  SellerReferral,
  SignedDocumentData,
  SigningAccessData,
} from "../../domain/signing/signing.contracts";
import type { SignDocumentPayload } from "../../domain/signing/signing";

export interface SigningRepository {
  createSigningRequests(
    sellerExternalId: string,
    rawFormData: unknown,
    origin: string,
    metadata: RequestMetadata,
  ): Promise<CreateSigningRequestsResult>;
  getMyReferral(sellerExternalId: string): Promise<SellerReferral>;
  getReferralByCode(
    code: string,
    metadata: RequestMetadata,
    referer: string | null,
  ): Promise<ReferralProfile>;
  accessSigningRequest(
    token: string,
    lastFour: string,
    metadata: RequestMetadata,
  ): Promise<OperationResult<SigningAccessData>>;
  signDocument(
    token: string,
    body: SignDocumentPayload,
    metadata: RequestMetadata,
  ): Promise<OperationResult<SignedDocumentData>>;
  health(): Promise<void>;
}
