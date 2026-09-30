import type { SigningRepository } from "../../application/ports/signing.repository";
import type { SignDocumentPayload } from "../../domain/signing/signing";
import type { RequestMetadata } from "../../domain/signing/signing.contracts";
import {
  accessSigningRequest,
  createSigningRequests,
  getMyReferral,
  getReferralByCode,
  signDocument,
} from "./postgres-signing.repository";
import { getPostgresPool } from "./postgres.pool";

export class PostgresSigningRepository implements SigningRepository {
  createSigningRequests(
    sellerExternalId: string,
    rawFormData: unknown,
    origin: string,
    metadata: RequestMetadata,
  ) {
    return createSigningRequests(
      sellerExternalId,
      rawFormData,
      origin,
      metadata,
    );
  }

  getMyReferral(sellerExternalId: string) {
    return getMyReferral(sellerExternalId);
  }

  getReferralByCode(
    code: string,
    metadata: RequestMetadata,
    referer: string | null,
  ) {
    return getReferralByCode(code, metadata, referer);
  }

  accessSigningRequest(
    token: string,
    lastFour: string,
    metadata: RequestMetadata,
  ) {
    return accessSigningRequest(token, lastFour, metadata);
  }

  signDocument(
    token: string,
    body: SignDocumentPayload,
    metadata: RequestMetadata,
  ) {
    return signDocument(token, body, metadata);
  }

  async health(): Promise<void> {
    await getPostgresPool().query("SELECT 1");
  }
}
