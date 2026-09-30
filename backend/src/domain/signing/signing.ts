export type SignerRole = "TITULAR" | "CONTRATANTE"
export type SigningMode = "SOLO_FIRMA" | "EDITAR_Y_FIRMAR"
export type SigningStatus = "PENDIENTE" | "FIRMADO" | "EXPIRADO" | "REVOCADO"

export interface SigningPerson {
  firstNames?: string
  lastNames?: string
  documentNumber?: string
}

export interface SigningFormData {
  [key: string]: unknown
  policyholder?: SigningPerson & Record<string, unknown>
  contractor?: {
    isDifferent?: boolean
    personType?: string
    naturalPerson?: SigningPerson & Record<string, unknown>
    legalEntity?: {
      legalName?: string
      taxId?: string
      legalRepresentative?: SigningPerson & Record<string, unknown>
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  broker?: Record<string, unknown>
  signatures?: Record<string, unknown>
  attachedDocuments?: Array<Record<string, unknown>>
}

export interface SignerDescriptor {
  role: SignerRole
  name: string
  documentNumber: string
}

export interface CreateSigningRequestPayload {
  formData: unknown
}

export interface SignDocumentPayload {
  lastFour?: string
  signatureDataUrl?: string
  place?: string
  acceptsPolicyholderDeclaration?: boolean
  acceptsContractorSourceOfFunds?: boolean
}

export interface ApiError {
  error: string
  message: string
}
