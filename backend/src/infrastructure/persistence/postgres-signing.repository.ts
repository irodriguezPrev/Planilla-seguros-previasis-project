import type { PoolClient } from "pg"
import { getPostgresPool } from "./postgres.pool"
import {
  SIGNING_DEFAULT_TTL_HOURS,
  SIGNING_MAX_FORM_BYTES,
  SIGNING_MAX_SIGNATURE_BYTES,
  SIGNING_MAX_TTL_HOURS,
  cleanFormForSigning,
  getSigners,
} from "../../domain/signing/signing.rules"
import type {
  SignDocumentPayload,
  SignerRole,
  SigningFormData,
  SigningMode,
  SigningStatus,
} from "../../domain/signing/signing"
import { SigningError as SigningHttpError } from "../../domain/signing/signing.errors"
import {
  createDocumentChallenge,
  createSigningToken,
  hashSigningToken,
  maskDocument,
  normalizeDocument,
  verifyDocumentChallenge,
  venezuelaDate,
} from "../security/signing-security"

interface RequestMetadata {
  ip: string | null
  userAgent: string | null
}

interface SellerRow {
  id_vendedor: string
  nombre_apellido: string
  num_credencial: string
  tipo_doc: string
  ci_rif_pasaporte: string
}

interface SigningAccessRow {
  id_solicitud_firma: string
  id_expediente: string
  rol_firmante: SignerRole
  nombre_firmante: string
  documento_mascara: string
  modo_acceso: SigningMode
  secciones_editables: string[]
  estado: SigningStatus
  expires_at: Date
  intentos_fallidos: number
  max_intentos: number
  challenge_salt: string
  challenge_sha256: string
  expediente_estado: string
  form_data: SigningFormData
}

interface SigningRow extends Omit<SigningAccessRow, "documento_mascara" | "modo_acceso" | "secciones_editables" | "nombre_firmante" | "expediente_estado"> {
  id_prospecto: string
}

export type OperationResult<T> =
  | { ok: false; status: number; code: string; message: string }
  | { ok: true; data: T }

const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await getPostgresPool().connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

const formString = (value: unknown): string => typeof value === "string" ? value.trim() : ""
const failure = <T>(status: number, code: string, message: string): OperationResult<T> => ({
  ok: false,
  status,
  code,
  message,
})

export const createSigningRequests = async (
  sellerExternalId: string,
  rawFormData: unknown,
  origin: string,
  metadata: RequestMetadata,
) => {
  const payloadSize = Buffer.byteLength(JSON.stringify(rawFormData), "utf8")
  if (payloadSize > SIGNING_MAX_FORM_BYTES) {
    throw new SigningHttpError(413, "FORM_TOO_LARGE", "La solicitud excede el tamaño permitido.")
  }

  const formData = cleanFormForSigning(rawFormData)
  const holder = formData.policyholder ?? {}
  const holderDocument = normalizeDocument(formString(holder.documentNumber))
  const holderName = `${formString(holder.firstNames)} ${formString(holder.lastNames)}`.trim()
  if (!holderName || !holderDocument) {
    throw new SigningHttpError(400, "INVALID_HOLDER", "Faltan el nombre o documento del titular.")
  }

  const ttlValue = Number(process.env.SIGNING_LINK_TTL_HOURS ?? SIGNING_DEFAULT_TTL_HOURS)
  const ttlHours = Math.min(SIGNING_MAX_TTL_HOURS, Math.max(1, Number.isFinite(ttlValue) ? ttlValue : SIGNING_DEFAULT_TTL_HOURS))
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)

  return withTransaction(async (client) => {
    const sellerResult = await client.query<SellerRow>(
      `SELECT v.id_vendedor, i.nombre_apellido, i.num_credencial,
              i.tipo_doc, i.ci_rif_pasaporte
         FROM previasis.vendedor v
         JOIN previasis.intermediario i ON i.id_intermediario = v.id_intermediario
        WHERE v.usuario_external_id = $1 AND v.activo = TRUE`,
      [sellerExternalId],
    )
    const seller = sellerResult.rows[0] ?? null

    if (!seller) {
      throw new SigningHttpError(
        403,
        "SELLER_PROFILE_REQUIRED",
        "El usuario autenticado no tiene un perfil de vendedor activo.",
      )
    }

    if (seller) {
      formData.broker = {
        ...(formData.broker ?? {}),
        fullName: seller.nombre_apellido,
        credentialNumber: seller.num_credencial,
        documentType: seller.tipo_doc,
        identityOrTaxNumber: seller.ci_rif_pasaporte,
        sellerId: seller.id_vendedor,
        lockedByReferral: true,
      }
    }

    const broker = formData.broker ?? {}
    if (!formString(broker.fullName) || !formString(broker.credentialNumber) || !formString(broker.identityOrTaxNumber)) {
      throw new SigningHttpError(400, "BROKER_REQUIRED", "Complete los datos del asesor antes de enviar la solicitud al cliente.")
    }

    const prospectResult = await client.query<{ id_prospecto: string }>(
      `INSERT INTO previasis.prospecto_cliente (
         id_vendedor, tipo_doc, num_doc, nombres, apellidos, email,
         telefono_movil, estado, origen, vendedor_external_id
       ) VALUES ($1, $2::previasis.tipo_documento, $3, $4, $5, $6, $7,
                 'ENVIADO_A_FIRMA', 'FORMULARIO_ASISTIDO', $8)
       ON CONFLICT (tipo_doc, num_doc) DO UPDATE SET
         id_vendedor = COALESCE(EXCLUDED.id_vendedor, prospecto_cliente.id_vendedor),
         nombres = EXCLUDED.nombres,
         apellidos = EXCLUDED.apellidos,
         email = EXCLUDED.email,
         telefono_movil = EXCLUDED.telefono_movil,
         estado = 'ENVIADO_A_FIRMA',
         vendedor_external_id = EXCLUDED.vendedor_external_id
       RETURNING id_prospecto`,
      [
        seller?.id_vendedor ?? null,
        holder.documentType,
        holderDocument,
        formString(holder.firstNames),
        formString(holder.lastNames),
        formString(holder.email) || null,
        formString(holder.mobilePhone) || null,
        sellerExternalId,
      ],
    )
    const prospectId = prospectResult.rows[0].id_prospecto

    const expedienteResult = await client.query<{ id_expediente: string }>(
      `INSERT INTO previasis.expediente_afiliacion (
         id_vendedor, id_prospecto, estado, llenado_asistido,
         vendedor_external_id, enviado_a_firma_at
       ) VALUES ($1, $2, 'PENDIENTE_FIRMA', TRUE, $3, NOW())
       RETURNING id_expediente`,
      [seller?.id_vendedor ?? null, prospectId, sellerExternalId],
    )
    const expedienteId = expedienteResult.rows[0].id_expediente

    const revisionResult = await client.query<{ id_revision: string }>(
      `INSERT INTO previasis.expediente_revision (
         id_expediente, numero_revision, schema_version, form_data,
         creado_por, motivo
       ) VALUES ($1, 1, 1, $2::jsonb, 'VENDEDOR', 'ENVIADO_A_FIRMA')
       RETURNING id_revision`,
      [expedienteId, JSON.stringify(formData)],
    )
    const revisionId = revisionResult.rows[0].id_revision
    await client.query(
      `UPDATE previasis.expediente_afiliacion
          SET current_revision_id = $2,
              numero_expediente = 'EXP-' || UPPER(LEFT(REPLACE($1::text, '-', ''), 12))
        WHERE id_expediente = $1`,
      [expedienteId, revisionId],
    )

    const requests: Array<{ role: SignerRole; signerName: string; url: string }> = []
    for (const signer of getSigners(formData)) {
      if (!signer.name || !normalizeDocument(signer.documentNumber)) {
        throw new SigningHttpError(400, "INVALID_SIGNER", "Faltan el nombre o documento de un firmante.")
      }
      const token = createSigningToken()
      const challenge = createDocumentChallenge(signer.documentNumber)
      const signatureRequest = await client.query<{ id_solicitud_firma: string }>(
        `INSERT INTO previasis.solicitud_firma_remota (
           id_expediente, id_revision, token_sha256, challenge_salt,
           challenge_sha256, rol_firmante, nombre_firmante,
           documento_mascara, expires_at, created_by_external_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id_solicitud_firma`,
        [
          expedienteId,
          revisionId,
          hashSigningToken(token),
          challenge.salt,
          challenge.hash,
          signer.role,
          signer.name,
          maskDocument(signer.documentNumber),
          expiresAt,
          sellerExternalId,
        ],
      )
      await client.query(
        `INSERT INTO previasis.evento_expediente (
           id_expediente, id_solicitud_firma, tipo, actor,
           actor_external_id, ip, user_agent, metadata
         ) VALUES ($1, $2, 'ENLACE_FIRMA_CREADO', 'VENDEDOR', $3, $4, $5, $6::jsonb)`,
        [
          expedienteId,
          signatureRequest.rows[0].id_solicitud_firma,
          sellerExternalId,
          metadata.ip,
          metadata.userAgent,
          JSON.stringify({ role: signer.role, expiresAt: expiresAt.toISOString() }),
        ],
      )
      requests.push({ role: signer.role, signerName: signer.name, url: `${origin}/firma/${token}` })
    }

    return { expedienteId, expiresAt: expiresAt.toISOString(), requests }
  })
}

export const getMyReferral = async (sellerExternalId: string) => {
  const result = await getPostgresPool().query<{
    codigo_referido: string
    nombre_apellido: string
    num_credencial: string
  }>(
    `SELECT v.codigo_referido, i.nombre_apellido, i.num_credencial
       FROM previasis.vendedor v
       JOIN previasis.intermediario i ON i.id_intermediario = v.id_intermediario
      WHERE v.usuario_external_id = $1 AND v.activo = TRUE`,
    [sellerExternalId],
  )
  const referral = result.rows[0]
  if (!referral) {
    throw new SigningHttpError(404, "SELLER_PROFILE_NOT_FOUND", "El usuario todavía no tiene un perfil de vendedor activo.")
  }
  return referral
}

export const getReferralByCode = async (code: string, metadata: RequestMetadata, referer: string | null) => {
  const pool = getPostgresPool()
  const result = await pool.query<{
    id_vendedor: string
    codigo_referido: string
    nombre_apellido: string
    num_credencial: string
    tipo_doc: "V" | "E" | "J" | "P"
    ci_rif_pasaporte: string
  }>(
    `SELECT v.id_vendedor, v.codigo_referido, i.nombre_apellido,
            i.num_credencial, i.tipo_doc, i.ci_rif_pasaporte
       FROM previasis.vendedor v
       JOIN previasis.intermediario i ON i.id_intermediario = v.id_intermediario
      WHERE v.codigo_referido = $1 AND v.activo = TRUE`,
    [code],
  )
  const referral = result.rows[0]
  if (!referral) {
    throw new SigningHttpError(404, "REFERRAL_NOT_FOUND", "El enlace de referido no existe o está inactivo.")
  }
  await pool.query(
    `INSERT INTO previasis.visita_enlace_referido (id_vendedor, ip, user_agent, referer)
     VALUES ($1, $2, $3, $4)`,
    [referral.id_vendedor, metadata.ip, metadata.userAgent, referer?.slice(0, 2000) ?? null],
  )
  return referral
}

export const accessSigningRequest = async (
  token: string,
  lastFour: string,
  metadata: RequestMetadata,
): Promise<OperationResult<{
  ok: true
  role: SignerRole
  signerName: string
  documentMask: string
  mode: SigningMode
  editableSections: string[]
  status: SigningStatus
  expedienteStatus: string
  expiresAt: string
  formData: SigningFormData
}>> => withTransaction(async (client) => {
  const query = await client.query<SigningAccessRow>(
    `SELECT sf.id_solicitud_firma, sf.id_expediente, sf.rol_firmante,
            sf.nombre_firmante, sf.documento_mascara, sf.modo_acceso,
            sf.secciones_editables, sf.estado, sf.expires_at,
            sf.intentos_fallidos, sf.max_intentos, sf.challenge_salt,
            sf.challenge_sha256, e.estado AS expediente_estado, r.form_data
       FROM previasis.solicitud_firma_remota sf
       JOIN previasis.expediente_afiliacion e ON e.id_expediente = sf.id_expediente
       JOIN previasis.expediente_revision r ON r.id_revision = e.current_revision_id
      WHERE sf.token_sha256 = $1
      FOR UPDATE OF sf`,
    [hashSigningToken(token)],
  )
  const signingRequest = query.rows[0]
  if (!signingRequest) return failure(404, "LINK_NOT_FOUND", "El enlace de firma no existe.")
  if (signingRequest.estado === "REVOCADO") return failure(410, "LINK_REVOKED", "Este enlace fue revocado.")

  if (signingRequest.estado === "EXPIRADO" || signingRequest.expires_at.getTime() <= Date.now()) {
    if (signingRequest.estado === "PENDIENTE") {
      await client.query("UPDATE previasis.solicitud_firma_remota SET estado = 'EXPIRADO' WHERE id_solicitud_firma = $1", [signingRequest.id_solicitud_firma])
      await client.query(
        `INSERT INTO previasis.evento_expediente (id_expediente, id_solicitud_firma, tipo, actor, ip, user_agent)
         VALUES ($1, $2, 'ENLACE_FIRMA_EXPIRADO', 'SISTEMA', $3, $4)`,
        [signingRequest.id_expediente, signingRequest.id_solicitud_firma, metadata.ip, metadata.userAgent],
      )
    }
    return failure(410, "LINK_EXPIRED", "Este enlace de firma venció.")
  }

  if (signingRequest.intentos_fallidos >= signingRequest.max_intentos) {
    await client.query(
      `UPDATE previasis.solicitud_firma_remota
          SET estado = 'REVOCADO', revoked_at = COALESCE(revoked_at, NOW())
        WHERE id_solicitud_firma = $1`,
      [signingRequest.id_solicitud_firma],
    )
    return failure(429, "TOO_MANY_ATTEMPTS", "El enlace fue bloqueado por seguridad.")
  }

  if (!verifyDocumentChallenge(lastFour, signingRequest.challenge_salt, signingRequest.challenge_sha256)) {
    const attempts = signingRequest.intentos_fallidos + 1
    const blocked = attempts >= signingRequest.max_intentos
    await client.query(
      `UPDATE previasis.solicitud_firma_remota
          SET intentos_fallidos = $2,
              estado = CASE WHEN $3 THEN 'REVOCADO' ELSE estado END,
              revoked_at = CASE WHEN $3 THEN NOW() ELSE revoked_at END
        WHERE id_solicitud_firma = $1`,
      [signingRequest.id_solicitud_firma, attempts, blocked],
    )
    await client.query(
      `INSERT INTO previasis.evento_expediente (
         id_expediente, id_solicitud_firma, tipo, actor, ip, user_agent, metadata
       ) VALUES ($1, $2, 'ACCESO_FIRMA_RECHAZADO', 'CLIENTE', $3, $4, $5::jsonb)`,
      [signingRequest.id_expediente, signingRequest.id_solicitud_firma, metadata.ip, metadata.userAgent, JSON.stringify({ attempts, blocked })],
    )
    return failure(
      blocked ? 429 : 403,
      blocked ? "TOO_MANY_ATTEMPTS" : "INVALID_CHALLENGE",
      blocked ? "El enlace fue bloqueado por seguridad." : "Los datos ingresados no coinciden con el documento del firmante.",
    )
  }

  await client.query(
    `UPDATE previasis.solicitud_firma_remota
        SET first_access_at = COALESCE(first_access_at, NOW()), last_access_at = NOW()
      WHERE id_solicitud_firma = $1`,
    [signingRequest.id_solicitud_firma],
  )
  await client.query(
    `INSERT INTO previasis.evento_expediente (id_expediente, id_solicitud_firma, tipo, actor, ip, user_agent)
     VALUES ($1, $2, 'EXPEDIENTE_VISUALIZADO', 'CLIENTE', $3, $4)`,
    [signingRequest.id_expediente, signingRequest.id_solicitud_firma, metadata.ip, metadata.userAgent],
  )

  return { ok: true, data: {
    ok: true,
    role: signingRequest.rol_firmante,
    signerName: signingRequest.nombre_firmante,
    documentMask: signingRequest.documento_mascara,
    mode: signingRequest.modo_acceso,
    editableSections: signingRequest.secciones_editables,
    status: signingRequest.estado,
    expedienteStatus: signingRequest.expediente_estado,
    expiresAt: signingRequest.expires_at.toISOString(),
    formData: signingRequest.form_data,
  } }
})

export const signDocument = async (
  token: string,
  body: SignDocumentPayload,
  metadata: RequestMetadata,
): Promise<OperationResult<{
  ok: true
  status: string
  formData: SigningFormData
  signedAt: string
}>> => {
  const signature = body.signatureDataUrl ?? ""
  const place = body.place?.trim() ?? ""
  if (!body.lastFour) throw new SigningHttpError(400, "CHALLENGE_REQUIRED", "Debe confirmar los últimos cuatro caracteres del documento.")
  if (signature.length > SIGNING_MAX_SIGNATURE_BYTES || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signature)) {
    throw new SigningHttpError(400, "INVALID_SIGNATURE", "Dibuje una firma válida antes de continuar.")
  }
  if (!place || place.length > 180) throw new SigningHttpError(400, "INVALID_PLACE", "Indique un lugar de suscripción válido.")

  const signatureDate = venezuelaDate()
  const signedAt = new Date().toISOString()
  return withTransaction(async (client) => {
    const query = await client.query<SigningRow>(
      `SELECT sf.id_solicitud_firma, sf.id_expediente, e.id_prospecto,
              sf.rol_firmante, sf.estado, sf.expires_at,
              sf.intentos_fallidos, sf.max_intentos,
              sf.challenge_salt, sf.challenge_sha256, r.form_data
         FROM previasis.solicitud_firma_remota sf
         JOIN previasis.expediente_afiliacion e ON e.id_expediente = sf.id_expediente
         JOIN previasis.expediente_revision r ON r.id_revision = e.current_revision_id
        WHERE sf.token_sha256 = $1
        FOR UPDATE OF sf, e`,
      [hashSigningToken(token)],
    )
    const signingRequest = query.rows[0]
    if (!signingRequest) return failure(404, "LINK_NOT_FOUND", "El enlace de firma no existe.")
    if (signingRequest.estado === "FIRMADO") return failure(409, "ALREADY_SIGNED", "Este documento ya fue firmado con este enlace.")
    if (signingRequest.estado === "REVOCADO") return failure(410, "LINK_REVOKED", "Este enlace fue revocado.")
    if (signingRequest.estado === "EXPIRADO" || signingRequest.expires_at.getTime() <= Date.now()) {
      await client.query("UPDATE previasis.solicitud_firma_remota SET estado = 'EXPIRADO' WHERE id_solicitud_firma = $1", [signingRequest.id_solicitud_firma])
      return failure(410, "LINK_EXPIRED", "Este enlace de firma venció.")
    }

    if (!verifyDocumentChallenge(body.lastFour!, signingRequest.challenge_salt, signingRequest.challenge_sha256)) {
      const attempts = signingRequest.intentos_fallidos + 1
      const blocked = attempts >= signingRequest.max_intentos
      await client.query(
        `UPDATE previasis.solicitud_firma_remota
            SET intentos_fallidos = $2,
                estado = CASE WHEN $3 THEN 'REVOCADO' ELSE estado END,
                revoked_at = CASE WHEN $3 THEN NOW() ELSE revoked_at END
          WHERE id_solicitud_firma = $1`,
        [signingRequest.id_solicitud_firma, attempts, blocked],
      )
      await client.query(
        `INSERT INTO previasis.evento_expediente (id_expediente, id_solicitud_firma, tipo, actor, ip, user_agent)
         VALUES ($1, $2, 'FIRMA_RECHAZADA_CHALLENGE', 'CLIENTE', $3, $4)`,
        [signingRequest.id_expediente, signingRequest.id_solicitud_firma, metadata.ip, metadata.userAgent],
      )
      return failure(
        blocked ? 429 : 403,
        blocked ? "TOO_MANY_ATTEMPTS" : "INVALID_CHALLENGE",
        blocked ? "El enlace fue bloqueado por seguridad." : "Los datos ingresados no coinciden con el documento del firmante.",
      )
    }

    const formData = structuredClone(signingRequest.form_data)
    const signatures = formData.signatures ?? {}
    formData.signatures = signatures
    const contractorIsDifferent = Boolean(formData.contractor?.isDifferent)
    if (signingRequest.rol_firmante === "TITULAR") {
      if (!body.acceptsPolicyholderDeclaration) return failure(400, "DECLARATION_REQUIRED", "Debe aceptar la declaración del titular.")
      if (!contractorIsDifferent && !body.acceptsContractorSourceOfFunds) return failure(400, "FUNDS_REQUIRED", "Debe aceptar la declaración de origen de fondos.")
      signatures.policyholderSignatureBase64 = signature
      signatures.acceptsPolicyholderDeclaration = true
      if (!contractorIsDifferent) signatures.acceptsContractorSourceOfFunds = true
    } else {
      if (!body.acceptsContractorSourceOfFunds) return failure(400, "FUNDS_REQUIRED", "Debe aceptar la declaración de origen de fondos.")
      signatures.contractorSignatureBase64 = signature
      signatures.acceptsContractorSourceOfFunds = true
    }
    signatures.place = place
    signatures.date = signatureDate

    const nextRevision = await client.query<{ next_revision: number }>(
      `SELECT COALESCE(MAX(numero_revision), 0) + 1 AS next_revision
         FROM previasis.expediente_revision WHERE id_expediente = $1`,
      [signingRequest.id_expediente],
    )
    const revision = await client.query<{ id_revision: string }>(
      `INSERT INTO previasis.expediente_revision (
         id_expediente, numero_revision, schema_version, form_data, creado_por, motivo
       ) VALUES ($1, $2, 1, $3::jsonb, 'CLIENTE', $4) RETURNING id_revision`,
      [signingRequest.id_expediente, nextRevision.rows[0].next_revision, JSON.stringify(formData), `FIRMA_${signingRequest.rol_firmante}`],
    )
    const signedRevisionId = revision.rows[0].id_revision
    await client.query(
      `INSERT INTO previasis.firma_electronica (
         id_solicitud_firma, id_revision_firmada, firma_data_url,
         acepta_declaracion_titular, acepta_origen_fondos, lugar, fecha, ip, user_agent
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9)`,
      [
        signingRequest.id_solicitud_firma,
        signedRevisionId,
        signature,
        Boolean(body.acceptsPolicyholderDeclaration),
        Boolean(body.acceptsContractorSourceOfFunds),
        place,
        signatureDate,
        metadata.ip,
        metadata.userAgent,
      ],
    )
    await client.query(
      `UPDATE previasis.solicitud_firma_remota
          SET estado = 'FIRMADO', signed_at = NOW(), last_access_at = NOW()
        WHERE id_solicitud_firma = $1`,
      [signingRequest.id_solicitud_firma],
    )

    const isComplete = Boolean(
      signatures.policyholderSignatureBase64 &&
      signatures.acceptsPolicyholderDeclaration &&
      signatures.acceptsContractorSourceOfFunds &&
      (!contractorIsDifferent || signatures.contractorSignatureBase64),
    )
    const expedienteStatus = isComplete ? "FIRMADO" : "PARCIALMENTE_FIRMADO"
    await client.query(
      `UPDATE previasis.expediente_afiliacion
          SET current_revision_id = $2, estado = $3::varchar,
            firmado_at = CASE WHEN $3::varchar = 'FIRMADO' THEN NOW() ELSE firmado_at END
        WHERE id_expediente = $1`,
      [signingRequest.id_expediente, signedRevisionId, expedienteStatus],
    )
    if (isComplete) {
      await client.query("UPDATE previasis.prospecto_cliente SET estado = 'FIRMADO' WHERE id_prospecto = $1", [signingRequest.id_prospecto])
    }
    await client.query(
      `INSERT INTO previasis.evento_expediente (
         id_expediente, id_solicitud_firma, tipo, actor, ip, user_agent, metadata
       ) VALUES ($1, $2, 'DOCUMENTO_FIRMADO', 'CLIENTE', $3, $4, $5::jsonb)`,
      [
        signingRequest.id_expediente,
        signingRequest.id_solicitud_firma,
        metadata.ip,
        metadata.userAgent,
        JSON.stringify({ role: signingRequest.rol_firmante, revisionId: signedRevisionId }),
      ],
    )

    return { ok: true, data: { ok: true, status: expedienteStatus, formData, signedAt } }
  })
}
