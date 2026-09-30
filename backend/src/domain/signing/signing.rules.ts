import type { SigningFormData, SignerDescriptor } from "./signing"

export const SIGNING_DEFAULT_TTL_HOURS = 72
export const SIGNING_MAX_TTL_HOURS = 168
export const SIGNING_MAX_FORM_BYTES = 4_000_000
export const SIGNING_MAX_SIGNATURE_BYTES = 2_000_000
export const SIGNING_MAX_LINK_TOKEN_LENGTH = 100

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

export const cleanFormForSigning = (value: unknown): SigningFormData => {
  const formData = structuredClone(asRecord(value)) as SigningFormData
  formData.signatures = {
    ...asRecord(formData.signatures),
    policyholderSignatureBase64: null,
    contractorSignatureBase64: null,
    acceptsPolicyholderDeclaration: false,
    acceptsContractorSourceOfFunds: false,
  }
  formData.attachedDocuments = (Array.isArray(formData.attachedDocuments)
    ? formData.attachedDocuments
    : []).map((document) => ({
      ...asRecord(document),
      previewUrl: "",
    }))
  return formData
}

const personName = (person: Record<string, unknown>): string =>
  `${String(person.firstNames ?? "")} ${String(person.lastNames ?? "")}`.trim()

const signer = (
  role: SignerDescriptor["role"],
  person: Record<string, unknown>,
  fallbackName = "",
  fallbackDocument = "",
): SignerDescriptor => ({
  role,
  name: personName(person) || fallbackName,
  documentNumber: String(person.documentNumber ?? fallbackDocument),
})

export const getSigners = (formData: SigningFormData): SignerDescriptor[] => {
  const holder = asRecord(formData.policyholder)
  const holderSigner = signer("TITULAR", holder)
  const contractor = asRecord(formData.contractor)
  if (!contractor.isDifferent) return [holderSigner]

  if (contractor.personType === "Natural") {
    return [holderSigner, signer("CONTRATANTE", asRecord(contractor.naturalPerson))]
  }

  const company = asRecord(contractor.legalEntity)
  return [holderSigner, signer(
    "CONTRATANTE",
    asRecord(company.legalRepresentative),
    String(company.legalName ?? ""),
    String(company.taxId ?? ""),
  )]
}
