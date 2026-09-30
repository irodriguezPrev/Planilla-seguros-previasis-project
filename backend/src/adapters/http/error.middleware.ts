import { ErrorRequestHandler } from "express";
import { SigningError } from "../../domain/signing/signing.errors";

const databaseErrorCodes = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "08001",
  "08006",
  "28P01",
  "3D000",
  "42P01",
  "53300",
  "57P01",
]);

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof SigningError) {
    response
      .status(error.status)
      .json({ error: error.code, message: error.message });
    return;
  }

  console.error(error);
  const errorCode = error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
  const databaseUnavailable = databaseErrorCodes.has(errorCode)
    || (error instanceof Error
      && /DATABASE_URL|previasis\./.test(error.message));

  response.status(databaseUnavailable ? 503 : 500).json({
    error: databaseUnavailable ? "DATABASE_NOT_READY" : "INTERNAL_ERROR",
    message: databaseUnavailable
      ? "La base de datos de firma no está configurada o no tiene el esquema aplicado."
      : "Internal server error",
  });
};
