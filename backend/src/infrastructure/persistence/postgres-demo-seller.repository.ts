import { demoAuthConfig } from "../../config/demo-auth.config"
import { getPostgresPool } from "./postgres.pool"

export const ensureDemoSellerProfile = async (): Promise<void> => {
  const client = await getPostgresPool().connect()
  try {
    await client.query("BEGIN")
    const intermediary = await client.query<{ id_intermediario: string }>(
      `INSERT INTO previasis.intermediario (
         nombre_apellido, num_credencial, tipo_doc, ci_rif_pasaporte
       ) VALUES ($1, $2, 'V', $3)
       ON CONFLICT (num_credencial) DO UPDATE
         SET nombre_apellido = EXCLUDED.nombre_apellido,
             tipo_doc = EXCLUDED.tipo_doc,
             ci_rif_pasaporte = EXCLUDED.ci_rif_pasaporte
       RETURNING id_intermediario`,
      [demoAuthConfig.name, demoAuthConfig.credentialNumber, demoAuthConfig.document],
    )
    await client.query(
      `INSERT INTO previasis.vendedor (id_intermediario, usuario_external_id)
       VALUES ($1, $2)
       ON CONFLICT (usuario_external_id) DO UPDATE
         SET id_intermediario = EXCLUDED.id_intermediario,
             activo = TRUE`,
      [intermediary.rows[0].id_intermediario, demoAuthConfig.userExternalId],
    )
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
