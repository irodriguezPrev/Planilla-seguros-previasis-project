-- Sustituya los valores antes de ejecutar.
-- usuario_external_id debe coincidir con el usuario autenticado del backend.

BEGIN;
SET search_path TO previasis, public;

WITH nuevo_intermediario AS (
    INSERT INTO intermediario (
        nombre_apellido,
        num_credencial,
        tipo_doc,
        ci_rif_pasaporte
    ) VALUES (
        'NOMBRE DEL ASESOR',
        'CR-000000',
        'V',
        '00000000'
    )
    RETURNING id_intermediario
)
INSERT INTO vendedor (id_intermediario, usuario_external_id)
SELECT id_intermediario, 'USER_ID_DEL_BACKEND'
FROM nuevo_intermediario
RETURNING id_vendedor, codigo_referido;

COMMIT;
