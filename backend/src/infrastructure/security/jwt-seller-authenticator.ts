import jwt from "jsonwebtoken";
import type { SellerAuthenticator } from "../../application/ports/seller-authenticator";
import { signingConfig } from "../../config/signing.config";
import { SigningError } from "../../domain/signing/signing.errors";

export class JwtSellerAuthenticator implements SellerAuthenticator {
  authenticate(authorization: string | undefined): string {
    if (!authorization?.startsWith("Bearer ")) {
      throw new SigningError(
        401,
        "AUTH_REQUIRED",
        "Debe iniciar sesión para enviar una solicitud de firma.",
      );
    }
    if (!signingConfig.jwtSecret) {
      throw new SigningError(
        503,
        "AUTH_NOT_CONFIGURED",
        "La autenticación del backend no está configurada.",
      );
    }

    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(authorization.slice(7), signingConfig.jwtSecret);
    } catch {
      throw new SigningError(
        401,
        "INVALID_SESSION",
        "La sesión del vendedor no es válida o expiró.",
      );
    }

    const claims = typeof payload === "string" ? {} : payload;
    const sellerId = claims.user_id ?? claims.id ?? claims.email ?? claims.name;
    if (!sellerId) {
      throw new SigningError(
        401,
        "INVALID_SESSION",
        "No se pudo identificar al vendedor autenticado.",
      );
    }
    return String(sellerId).slice(0, 120);
  }
}
