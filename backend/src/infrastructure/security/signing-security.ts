import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { SigningError } from "../../domain/signing/signing.errors";

export const createSigningToken = (): string =>
  randomBytes(32).toString("base64url");

export const hashSigningToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const normalizeDocument = (value: string): string =>
  value.trim().toUpperCase().replace(/\s+/g, "");

export const getLastFour = (value: string): string =>
  normalizeDocument(value).replace(/[^A-Z0-9]/g, "").slice(-4);

export const createDocumentChallenge = (documentNumber: string) => {
  const lastFour = getLastFour(documentNumber);
  if (lastFour.length < 4) {
    throw new SigningError(
      400,
      "INVALID_SIGNER_DOCUMENT",
      "El documento del firmante debe tener al menos cuatro caracteres.",
    );
  }
  const salt = randomBytes(24).toString("hex");
  return { salt, hash: scryptSync(lastFour, salt, 32).toString("hex") };
};

export const verifyDocumentChallenge = (
  value: string,
  salt: string,
  expectedHash: string,
): boolean => {
  const normalized = getLastFour(value);
  if (normalized.length !== 4) return false;
  const actual = scryptSync(normalized, salt, 32);
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const maskDocument = (documentNumber: string): string => {
  const normalized = normalizeDocument(documentNumber);
  if (normalized.length <= 4) return `****${normalized}`;
  return `${normalized.slice(0, 1)}${"*".repeat(
    Math.min(8, normalized.length - 3),
  )}${normalized.slice(-2)}`;
};

export const venezuelaDate = (): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
};
