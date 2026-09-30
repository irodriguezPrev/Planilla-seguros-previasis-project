import type { Request } from "express";
import { isIP } from "net";
import { signingConfig } from "../../config/signing.config";
import { SigningError } from "../../domain/signing/signing.errors";

export const getRequestIp = (request: Request): string | null => {
  const forwarded = request.headers["x-forwarded-for"];
  const candidate = (
    Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]
  )?.trim() || request.ip;
  return candidate && isIP(candidate) ? candidate : null;
};

export const getRequestUserAgent = (request: Request): string | null =>
  request.get("user-agent")?.slice(0, 2000) ?? null;

const parseHttpOrigin = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
};

export const resolvePublicAppOrigin = (request: Request): string => {
  const configuredOrigin = parseHttpOrigin(signingConfig.publicAppUrl);
  if (configuredOrigin) return configuredOrigin;

  if (signingConfig.publicAppUrl) {
    throw new SigningError(
      503,
      "INVALID_PUBLIC_APP_URL",
      "PUBLIC_APP_URL debe ser una URL HTTP o HTTPS válida.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new SigningError(
      503,
      "PUBLIC_APP_URL_REQUIRED",
      "Configure PUBLIC_APP_URL con el dominio público del formulario.",
    );
  }

  const requestOrigin = parseHttpOrigin(request.get("origin"));
  if (requestOrigin) return requestOrigin;

  const forwardedHost = request.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  if (
    forwardedHost &&
    (forwardedProtocol === "http" || forwardedProtocol === "https")
  ) {
    const origin = parseHttpOrigin(
      `${forwardedProtocol}://${forwardedHost}`,
    );
    if (origin) return origin;
  }

  const refererOrigin = parseHttpOrigin(request.get("referer"));
  if (refererOrigin) return refererOrigin;

  throw new SigningError(
    503,
    "PUBLIC_APP_URL_REQUIRED",
    "No fue posible determinar la URL pública del formulario. Configure PUBLIC_APP_URL.",
  );
};
