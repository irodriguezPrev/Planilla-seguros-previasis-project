import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { SellerAuthenticator } from "../../application/ports/seller-authenticator";
import {
  AccessSigningRequestUseCase,
  CheckSigningDatabaseUseCase,
  CreateSigningRequestUseCase,
  GetReferralProfileUseCase,
  GetSellerReferralUseCase,
  SignDocumentUseCase,
} from "../../application/signing/signing.use-cases";
import type { OperationResult } from "../../domain/signing/signing.contracts";
import { SIGNING_MAX_LINK_TOKEN_LENGTH } from "../../domain/signing/signing.rules";
import { SigningError } from "../../domain/signing/signing.errors";
import {
  getRequestIp,
  getRequestUserAgent,
  resolvePublicAppOrigin,
} from "./signing-request.helpers";

const createRequestSchema = z.object({
  formData: z.record(z.unknown()),
});

const accessSchema = z.object({
  lastFour: z.string().regex(/^[A-Za-z0-9]{4}$/),
});

const signSchema = z.object({
  lastFour: z.string().regex(/^[A-Za-z0-9]{4}$/),
  signatureDataUrl: z.string().min(1),
  place: z.string().trim().min(1).max(180),
  acceptsPolicyholderDeclaration: z.boolean().optional(),
  acceptsContractorSourceOfFunds: z.boolean().optional(),
});

const requestMetadata = (request: Request) => ({
  ip: getRequestIp(request),
  userAgent: getRequestUserAgent(request),
});

const validToken = (token: string | undefined): string => {
  if (
    !token ||
    token.length < 32 ||
    token.length > SIGNING_MAX_LINK_TOKEN_LENGTH
  ) {
    throw new SigningError(
      404,
      "LINK_NOT_FOUND",
      "El enlace de firma no es válido.",
    );
  }
  return token;
};

const sendOperationResult = <T>(
  result: OperationResult<T>,
  response: Response,
): void => {
  if (result.ok === false) {
    response
      .status(result.status)
      .json({ error: result.code, message: result.message });
    return;
  }
  response.json(result.data);
};

interface SigningControllerDependencies {
  sellerAuthenticator: SellerAuthenticator;
  createSigningRequest: CreateSigningRequestUseCase;
  accessSigningRequest: AccessSigningRequestUseCase;
  signDocument: SignDocumentUseCase;
  getSellerReferral: GetSellerReferralUseCase;
  getReferralProfile: GetReferralProfileUseCase;
  checkDatabase: CheckSigningDatabaseUseCase;
}

export class SigningController {
  constructor(private readonly dependencies: SigningControllerDependencies) {}

  create = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = createRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new SigningError(
          400,
          "INVALID_FORM",
          "Debe enviar los datos de la solicitud.",
        );
      }
      const sellerExternalId = this.dependencies.sellerAuthenticator.authenticate(
        request.get("authorization"),
      );
      const result = await this.dependencies.createSigningRequest.execute(
        sellerExternalId,
        parsed.data.formData,
        resolvePublicAppOrigin(request),
        requestMetadata(request),
      );
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  access = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = accessSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new SigningError(
          400,
          "CHALLENGE_REQUIRED",
          "Ingrese los últimos cuatro caracteres del documento.",
        );
      }
      const result = await this.dependencies.accessSigningRequest.execute(
        validToken(request.params.token),
        parsed.data.lastFour.toUpperCase(),
        requestMetadata(request),
      );
      sendOperationResult(result, response);
    } catch (error) {
      next(error);
    }
  };

  sign = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = signSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new SigningError(
          400,
          "INVALID_SIGNATURE_REQUEST",
          "Los datos requeridos para firmar no son válidos.",
        );
      }
      const result = await this.dependencies.signDocument.execute(
        validToken(request.params.token),
        parsed.data,
        requestMetadata(request),
      );
      sendOperationResult(result, response);
    } catch (error) {
      next(error);
    }
  };

  myReferral = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const sellerExternalId = this.dependencies.sellerAuthenticator.authenticate(
        request.get("authorization"),
      );
      const referral = await this.dependencies.getSellerReferral.execute(
        sellerExternalId,
      );
      const origin = resolvePublicAppOrigin(request);
      response.set("Cache-Control", "no-store").json({
        referralUrl: `${origin}/afiliacion?ref=${encodeURIComponent(
          referral.codigo_referido,
        )}`,
        referralCode: referral.codigo_referido,
        sellerName: referral.nombre_apellido,
        credentialNumber: referral.num_credencial,
      });
    } catch (error) {
      next(error);
    }
  };

  referralProfile = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const code = request.params.code;
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(code)) {
        throw new SigningError(
          404,
          "REFERRAL_NOT_FOUND",
          "El enlace de referido no es válido.",
        );
      }
      const referral = await this.dependencies.getReferralProfile.execute(
        code,
        requestMetadata(request),
        request.get("referer") ?? null,
      );
      response.set("Cache-Control", "no-store").json({
        broker: {
          fullName: referral.nombre_apellido,
          credentialNumber: referral.num_credencial,
          documentType: referral.tipo_doc,
          identityOrTaxNumber: referral.ci_rif_pasaporte,
          referralCode: referral.codigo_referido,
          sellerId: referral.id_vendedor,
          lockedByReferral: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  databaseHealth = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      await this.dependencies.checkDatabase.execute();
      response.json({ status: "ok", database: "available" });
    } catch {
      response
        .status(503)
        .json({ status: "error", database: "unavailable" });
    }
  };
}
