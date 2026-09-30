import type { DemoSellerRepository } from "../ports/demo-seller.repository";
import type { SigningRepository } from "../ports/signing.repository";
import type { SignDocumentPayload } from "../../domain/signing/signing";
import type { RequestMetadata } from "../../domain/signing/signing.contracts";

export class CreateSigningRequestUseCase {
  constructor(private readonly repository: SigningRepository) {}

  execute(
    sellerExternalId: string,
    formData: unknown,
    origin: string,
    metadata: RequestMetadata,
  ) {
    return this.repository.createSigningRequests(
      sellerExternalId,
      formData,
      origin,
      metadata,
    );
  }
}

export class AccessSigningRequestUseCase {
  constructor(private readonly repository: SigningRepository) {}

  execute(token: string, lastFour: string, metadata: RequestMetadata) {
    return this.repository.accessSigningRequest(token, lastFour, metadata);
  }
}

export class SignDocumentUseCase {
  constructor(private readonly repository: SigningRepository) {}

  execute(
    token: string,
    payload: SignDocumentPayload,
    metadata: RequestMetadata,
  ) {
    return this.repository.signDocument(token, payload, metadata);
  }
}

export class GetSellerReferralUseCase {
  constructor(private readonly repository: SigningRepository) {}

  execute(sellerExternalId: string) {
    return this.repository.getMyReferral(sellerExternalId);
  }
}

export class GetReferralProfileUseCase {
  constructor(private readonly repository: SigningRepository) {}

  execute(code: string, metadata: RequestMetadata, referer: string | null) {
    return this.repository.getReferralByCode(code, metadata, referer);
  }
}

export class CheckSigningDatabaseUseCase {
  constructor(private readonly repository: SigningRepository) {}

  execute() {
    return this.repository.health();
  }
}

export class PrepareDemoSellerUseCase {
  constructor(private readonly repository: DemoSellerRepository) {}

  execute() {
    return this.repository.ensureProfile();
  }
}
