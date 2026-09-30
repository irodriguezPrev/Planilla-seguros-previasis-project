-- ================================================================
-- PREVIASIS - Modelo relacional para PostgreSQL
-- Basado en la estructura actual del frontend (src/)
--
-- Nota:
-- * Este script modela el dominio de afiliación.
-- * No incluye autenticación/usuarios ni Socket.IO, porque no forman
--   parte del ER de afiliación mostrado.
-- * Las traducciones NO se guardan aquí: el frontend ya usa next-intl
--   y health-questions.config.ts contiene titleKey/descriptionKey.
-- ================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS previasis;
SET search_path TO previasis, public;

-- ================================================================
-- 1. TIPOS / DOMINIOS DEL NEGOCIO
-- ================================================================

CREATE TYPE tipo_documento AS ENUM ('V', 'E', 'P', 'M');
CREATE TYPE tipo_rif AS ENUM ('V', 'E', 'J', 'G');
CREATE TYPE estado_civil AS ENUM (
    'Soltero(a)',
    'Casado(a)',
    'Divorciado(a)',
    'Viudo(a)',
    'Concubinato'
);
CREATE TYPE sexo AS ENUM ('F', 'M');
CREATE TYPE clasificacion_actividad AS ENUM (
    'Independiente',
    'Dependiente',
    'Societaria'
);
CREATE TYPE tipo_persona_contratante AS ENUM ('Natural', 'Juridica');
CREATE TYPE actividad_economica_juridica AS ENUM (
    'Profesional',
    'Comercial',
    'Industrial'
);
CREATE TYPE tipo_operacion AS ENUM ('Emisión', 'Inclusión');
CREATE TYPE tipo_contrato AS ENUM ('Individual', 'Colectivo');
CREATE TYPE parentesco AS ENUM (
    'Titular',
    'Cónyuge',
    'Hijo/a',
    'Padre/Madre',
    'Hermano/a',
    'Otro'
);
CREATE TYPE frecuencia_pago AS ENUM ('Mensual', 'Trimestral', 'Semestral', 'Anual');
CREATE TYPE moneda_pago AS ENUM ('Bolívares', 'Dólares');
CREATE TYPE modalidad_pago AS ENUM (
    'Domiciliación de Pago',
    'Pago en Oficina',
    'Pagos en Divisas',
    'Zelle',
    'Otro'
);
CREATE TYPE detalle_salud_mode AS ENUM (
    'clinical',
    'sport',
    'beneficiary',
    'extra',
    'antecedent'
);
CREATE TYPE nivel_deportivo AS ENUM ('Amateur', 'Profesional');
CREATE TYPE categoria_documento AS ENUM (
    'Cédula de Identidad',
    'R.I.F. Digital',
    'Informe / Soporte Médico',
    'Otro'
);

-- ================================================================
-- 2. PERSONAS NATURALES
--    Sirve para titular, contratante natural y representante legal.
-- ================================================================

CREATE TABLE persona_natural (
    id_persona_natural BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombres                         VARCHAR(120) NOT NULL,
    apellidos                       VARCHAR(120) NOT NULL,

    tipo_doc                        tipo_documento NOT NULL,
    num_doc                         VARCHAR(30) NOT NULL,

    tipo_rif                        tipo_rif,
    num_rif                         VARCHAR(30),

    nacionalidad                    VARCHAR(80) NOT NULL,
    estado_civil                    estado_civil NOT NULL,
    sexo                            sexo NOT NULL,
    lugar_nacimiento                VARCHAR(150) NOT NULL,
    fecha_nacimiento                DATE NOT NULL,

    profesion                       VARCHAR(150) NOT NULL,
    ocupacion                       VARCHAR(150) NOT NULL,
    ramo_comercial                  VARCHAR(150),
    ingreso_anual_bs                NUMERIC(18,2) NOT NULL CHECK (ingreso_anual_bs >= 0),

    pep                             BOOLEAN NOT NULL DEFAULT FALSE,
    pep_descripcion                 TEXT,

    clasificacion_actividad         clasificacion_actividad NOT NULL,
    empresa                         VARCHAR(180),

    estado_residencia               VARCHAR(100),
    ciudad_residencia               VARCHAR(100),

    direccion_habitacion            TEXT NOT NULL,
    direccion_oficina               TEXT NOT NULL,
    direccion_cobro                 TEXT NOT NULL,

    telefono_habitacion             VARCHAR(40) NOT NULL,
    telefono_movil                  VARCHAR(40) NOT NULL,
    email                           VARCHAR(254) NOT NULL,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_persona_natural_documento UNIQUE (tipo_doc, num_doc),
    CONSTRAINT uq_persona_natural_rif UNIQUE (tipo_rif, num_rif),
    CONSTRAINT ck_persona_natural_pep_desc CHECK (
        pep = FALSE OR NULLIF(BTRIM(pep_descripcion), '') IS NOT NULL
    )
);

COMMENT ON TABLE persona_natural IS
'Persona natural usada por titular, contratante natural y representante legal.';

-- ================================================================
-- 3. PERSONAS JURÍDICAS
-- ================================================================

CREATE TABLE persona_juridica (
    id_persona_juridica BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    razon_social                    VARCHAR(200) NOT NULL,
    tipo_rif                        tipo_rif NOT NULL,
    num_rif                         VARCHAR(30) NOT NULL,

    num_registro_mercantil          VARCHAR(80) NOT NULL,
    num_tomo                        VARCHAR(80) NOT NULL,
    fecha_registro                  DATE NOT NULL,

    actividad_economica             actividad_economica_juridica NOT NULL,
    ramo_comercial                  VARCHAR(150),
    productos_servicios             TEXT NOT NULL,

    direccion_fiscal                TEXT NOT NULL,
    telefono                        VARCHAR(40) NOT NULL,

    utilidad_ejercicio_anterior     NUMERIC(18,2) NOT NULL CHECK (utilidad_ejercicio_anterior >= 0),
    patrimonio_neto                 NUMERIC(18,2) NOT NULL CHECK (patrimonio_neto >= 0),

    representante_legal_id          BIGINT NOT NULL
        REFERENCES persona_natural (id_persona_natural)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_persona_juridica_rif UNIQUE (tipo_rif, num_rif)
);

-- En frontend una persona jurídica solo puede usar J/G como RIF.
ALTER TABLE persona_juridica
    ADD CONSTRAINT ck_persona_juridica_tipo_rif
    CHECK (tipo_rif IN ('J', 'G'));

-- ================================================================
-- 4. INTERMEDIARIO
-- ================================================================

CREATE TABLE intermediario (
    id_intermediario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre_apellido                 VARCHAR(200) NOT NULL,
    num_credencial                  VARCHAR(80) NOT NULL,
    tipo_doc                        VARCHAR(1) NOT NULL,
    ci_rif_pasaporte                VARCHAR(50) NOT NULL,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_intermediario_tipo_doc
        CHECK (tipo_doc IN ('V', 'E', 'J', 'P'))
);

-- ================================================================
-- 5. PLANES DE SALUD
--
--    El frontend usa "Abuelos" para tres variantes distintas.
--    En BD se separan las variantes para no perder el nivel/cobertura.
-- ================================================================

CREATE TABLE plan_salud (
    id_plan BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    codigo_frontend                VARCHAR(40) NOT NULL,
    nombre                         VARCHAR(120) NOT NULL,
    variante                       VARCHAR(80) NOT NULL,
    cobertura_usd                  NUMERIC(18,2) NOT NULL CHECK (cobertura_usd > 0),
    rango_edad_min                 SMALLINT NOT NULL CHECK (rango_edad_min >= 0),
    rango_edad_max                 SMALLINT NOT NULL CHECK (rango_edad_max >= rango_edad_min),
    activo                         BOOLEAN NOT NULL DEFAULT TRUE,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_plan_salud UNIQUE (codigo_frontend, variante)
);

CREATE TABLE plan_tarifa (
    id_plan_tarifa BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_plan                         BIGINT NOT NULL
        REFERENCES plan_salud (id_plan)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    edad_min                        SMALLINT NOT NULL CHECK (edad_min >= 0),
    edad_max                        SMALLINT NOT NULL CHECK (edad_max >= edad_min),
    cuota_mensual_usd               NUMERIC(12,2) NOT NULL CHECK (cuota_mensual_usd >= 0),

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_plan_tarifa_rango UNIQUE (id_plan, edad_min, edad_max)
);

-- Datos que actualmente usa Step3AfiliadosPlan.tsx.
-- Son los valores del frontend, no deben asumirse como tarifa oficial hasta
-- que sean confirmados por el backend/negocio.

INSERT INTO plan_salud
    (codigo_frontend, nombre, variante, cobertura_usd, rango_edad_min, rango_edad_max)
VALUES
    ('Plan Bronce',   'Plan Bronce',   'Base',   10000, 0, 60),
    ('Plan Plata',    'Plan Plata',    'Base',   15000, 0, 60),
    ('Plan Oro',      'Plan Oro',      'Base',   25000, 0, 60),
    ('Plan Diamante', 'Plan Diamante', 'Base',   40000, 0, 60),
    ('Abuelos',       'Plan Abuelos',  'Bronce',  3000, 61, 80),
    ('Abuelos',       'Plan Abuelos',  'Plata',   5000, 61, 80),
    ('Abuelos',       'Plan Abuelos',  'Oro',    10000, 61, 80);

INSERT INTO plan_tarifa (id_plan, edad_min, edad_max, cuota_mensual_usd)
SELECT id_plan, 0, 20, 15 FROM plan_salud WHERE codigo_frontend = 'Plan Bronce' AND variante = 'Base'
UNION ALL
SELECT id_plan, 21, 40, 18 FROM plan_salud WHERE codigo_frontend = 'Plan Bronce' AND variante = 'Base'
UNION ALL
SELECT id_plan, 41, 60, 21 FROM plan_salud WHERE codigo_frontend = 'Plan Bronce' AND variante = 'Base'
UNION ALL
SELECT id_plan, 0, 20, 18 FROM plan_salud WHERE codigo_frontend = 'Plan Plata' AND variante = 'Base'
UNION ALL
SELECT id_plan, 21, 40, 21 FROM plan_salud WHERE codigo_frontend = 'Plan Plata' AND variante = 'Base'
UNION ALL
SELECT id_plan, 41, 60, 25 FROM plan_salud WHERE codigo_frontend = 'Plan Plata' AND variante = 'Base'
UNION ALL
SELECT id_plan, 0, 20, 27 FROM plan_salud WHERE codigo_frontend = 'Plan Oro' AND variante = 'Base'
UNION ALL
SELECT id_plan, 21, 40, 32 FROM plan_salud WHERE codigo_frontend = 'Plan Oro' AND variante = 'Base'
UNION ALL
SELECT id_plan, 41, 60, 37 FROM plan_salud WHERE codigo_frontend = 'Plan Oro' AND variante = 'Base'
UNION ALL
SELECT id_plan, 0, 20, 36 FROM plan_salud WHERE codigo_frontend = 'Plan Diamante' AND variante = 'Base'
UNION ALL
SELECT id_plan, 21, 40, 42 FROM plan_salud WHERE codigo_frontend = 'Plan Diamante' AND variante = 'Base'
UNION ALL
SELECT id_plan, 41, 60, 50 FROM plan_salud WHERE codigo_frontend = 'Plan Diamante' AND variante = 'Base'
UNION ALL
SELECT id_plan, 61, 80, 35 FROM plan_salud WHERE codigo_frontend = 'Abuelos' AND variante = 'Bronce'
UNION ALL
SELECT id_plan, 61, 80, 50 FROM plan_salud WHERE codigo_frontend = 'Abuelos' AND variante = 'Plata'
UNION ALL
SELECT id_plan, 61, 80, 70 FROM plan_salud WHERE codigo_frontend = 'Abuelos' AND variante = 'Oro';

-- ================================================================
-- 6. SOLICITUD DE AFILIACIÓN (PLANILLA)
-- ================================================================

CREATE TABLE solicitud_afiliacion (
    id_solicitud BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    tipo_operacion                 tipo_operacion NOT NULL,
    tipo_contrato                  tipo_contrato NOT NULL,
    num_solicitud                  VARCHAR(80),
    fecha_solicitud                DATE NOT NULL,

    titular_id                     BIGINT NOT NULL
        REFERENCES persona_natural (id_persona_natural)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    es_contratante_diferente       BOOLEAN NOT NULL DEFAULT FALSE,
    contratante_tipo               tipo_persona_contratante NOT NULL DEFAULT 'Natural',

    contratante_persona_natural_id BIGINT
        REFERENCES persona_natural (id_persona_natural)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    contratante_persona_juridica_id BIGINT
        REFERENCES persona_juridica (id_persona_juridica)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    intermediario_id               BIGINT
        REFERENCES intermediario (id_intermediario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    estatus                        VARCHAR(30) NOT NULL DEFAULT 'BORRADOR',

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_solicitud_numero UNIQUE (num_solicitud),

    CONSTRAINT ck_solicitud_contratante CHECK (
        (
            es_contratante_diferente = FALSE
            AND contratante_persona_natural_id IS NULL
            AND contratante_persona_juridica_id IS NULL
        )
        OR
        (
            es_contratante_diferente = TRUE
            AND contratante_tipo = 'Natural'
            AND contratante_persona_natural_id IS NOT NULL
            AND contratante_persona_juridica_id IS NULL
        )
        OR
        (
            es_contratante_diferente = TRUE
            AND contratante_tipo = 'Juridica'
            AND contratante_persona_natural_id IS NULL
            AND contratante_persona_juridica_id IS NOT NULL
        )
    )
);

COMMENT ON COLUMN solicitud_afiliacion.es_contratante_diferente IS
'Corresponde a contratante.esDiferente del frontend. Cuando es FALSE, el contratante es el titular.';

-- ================================================================
-- 7. AFILIADOS DE LA SOLICITUD
--
--    Reemplaza conceptualmente beneficiarios_planilla.
--    El primer afiliado normalmente tiene parentesco = Titular.
-- ================================================================

CREATE TABLE afiliado_solicitud (
    id_afiliado                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud                   BIGINT NOT NULL
        REFERENCES solicitud_afiliacion (id_solicitud)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    codigo_afiliado                INTEGER NOT NULL CHECK (codigo_afiliado > 0),

    -- El frontend actual solo recoge un nombre completo para afiliados.
    -- Se mantiene así para evitar inventar una separación nombres/apellidos.
    nombre_completo                VARCHAR(240) NOT NULL,
    tipo_doc                       tipo_documento NOT NULL,
    num_doc                        VARCHAR(30) NOT NULL,
    fecha_nacimiento               DATE NOT NULL,
    parentesco                     parentesco NOT NULL,
    sexo                           sexo NOT NULL,

    peso_kg                        NUMERIC(7,2) CHECK (peso_kg > 0),
    estatura_cm                    NUMERIC(7,2) CHECK (estatura_cm > 0),

    id_plan                        BIGINT NOT NULL
        REFERENCES plan_salud (id_plan)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    limite_cobertura_usd           NUMERIC(18,2) NOT NULL CHECK (limite_cobertura_usd > 0),
    moneda_cobertura               CHAR(3) NOT NULL DEFAULT 'USD'
        CHECK (moneda_cobertura IN ('USD', 'VES')),

    cuota_mensual_usd              NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (cuota_mensual_usd >= 0),

    -- Preparado para una futura migración del afiliado a persona_natural.
    persona_natural_id             BIGINT
        REFERENCES persona_natural (id_persona_natural)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_afiliado_codigo UNIQUE (id_solicitud, codigo_afiliado)
);

CREATE INDEX idx_afiliado_solicitud ON afiliado_solicitud (id_solicitud);
CREATE INDEX idx_afiliado_persona_natural ON afiliado_solicitud (persona_natural_id);
CREATE INDEX idx_afiliado_documento ON afiliado_solicitud (tipo_doc, num_doc);

-- ================================================================
-- 8. FORMA DE PAGO
-- ================================================================

CREATE TABLE forma_pago_solicitud (
    id_forma_pago                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud                   BIGINT NOT NULL UNIQUE
        REFERENCES solicitud_afiliacion (id_solicitud)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    frecuencia_pago                frecuencia_pago NOT NULL,
    moneda                         moneda_pago NOT NULL,
    modalidad_pago                 modalidad_pago NOT NULL,
    especifique_otro_pago          TEXT,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_pago_frecuencia_moneda CHECK (
        (moneda = 'Bolívares' AND frecuencia_pago IN ('Mensual', 'Trimestral'))
        OR
        (moneda = 'Dólares' AND frecuencia_pago IN ('Mensual', 'Trimestral', 'Semestral', 'Anual'))
    ),

    CONSTRAINT ck_pago_modalidad_moneda CHECK (
        (moneda = 'Bolívares' AND modalidad_pago IN ('Domiciliación de Pago', 'Pago en Oficina', 'Otro'))
        OR
        (moneda = 'Dólares' AND modalidad_pago IN ('Domiciliación de Pago', 'Pago en Oficina', 'Pagos en Divisas', 'Zelle', 'Otro'))
    ),

    CONSTRAINT ck_pago_otro_detalle CHECK (
        modalidad_pago <> 'Otro'
        OR NULLIF(BTRIM(especifique_otro_pago), '') IS NOT NULL
    )
);

-- ================================================================
-- 9. FIRMAS Y DECLARACIONES
-- ================================================================

CREATE TABLE firma_declaracion_solicitud (
    id_firma                       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud                   BIGINT NOT NULL UNIQUE
        REFERENCES solicitud_afiliacion (id_solicitud)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    lugar                          VARCHAR(180) NOT NULL,
    fecha                          DATE NOT NULL,

    firma_titular_base64           TEXT,
    firma_contratante_base64       TEXT,

    acepta_declaracion_titular     BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_origen_fondos_contratante BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 10. DOCUMENTOS ADJUNTOS
-- ================================================================

CREATE TABLE documento_adjunto (
    id_documento                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_solicitud                    BIGINT NOT NULL
        REFERENCES solicitud_afiliacion (id_solicitud)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    nombre                          VARCHAR(255) NOT NULL,
    mime_type                       VARCHAR(120) NOT NULL,
    size_bytes                      BIGINT NOT NULL CHECK (size_bytes >= 0),
    categoria                       categoria_documento NOT NULL,

    -- Ubicación del archivo en S3, MinIO, Azure Blob, disco, etc.
    storage_url                     TEXT,
    preview_url                     TEXT,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_documento_storage CHECK (
        NULLIF(BTRIM(storage_url), '') IS NOT NULL
    )
);

CREATE INDEX idx_documento_solicitud ON documento_adjunto (id_solicitud);

-- ================================================================
-- 11. BANCO DE PREGUNTAS DE SALUD
--
--    Las traducciones permanecen en next-intl. La BD solo conoce la
--    clave de traducción y las reglas de comportamiento.
-- ================================================================

CREATE TABLE pregunta_salud (
    id_pregunta                    SMALLINT PRIMARY KEY,
    title_key                      VARCHAR(180) NOT NULL,
    description_key                VARCHAR(180) NOT NULL,
    applicable_sex                 sexo,

    has_extra_input                BOOLEAN NOT NULL DEFAULT FALSE,
    beneficiary_detail             BOOLEAN NOT NULL DEFAULT FALSE,
    requires_beneficiary_selection BOOLEAN NOT NULL DEFAULT TRUE,
    requires_clinical_detail       BOOLEAN NOT NULL DEFAULT TRUE,
    detail_mode                    detalle_salud_mode NOT NULL DEFAULT 'clinical',

    activo                         BOOLEAN NOT NULL DEFAULT TRUE,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pregunta_salud
    (id_pregunta, title_key, description_key, applicable_sex,
     has_extra_input, beneficiary_detail, requires_beneficiary_selection,
     requires_clinical_detail, detail_mode)
VALUES
    (1,  'healthQuestions.1.title',  'healthQuestions.1.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (2,  'healthQuestions.2.title',  'healthQuestions.2.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (3,  'healthQuestions.3.title',  'healthQuestions.3.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (4,  'healthQuestions.4.title',  'healthQuestions.4.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (5,  'healthQuestions.5.title',  'healthQuestions.5.description',  NULL, FALSE, TRUE,  TRUE,  FALSE, 'beneficiary'),
    (6,  'healthQuestions.6.title',  'healthQuestions.6.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (7,  'healthQuestions.7.title',  'healthQuestions.7.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (8,  'healthQuestions.8.title',  'healthQuestions.8.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (9,  'healthQuestions.9.title',  'healthQuestions.9.description',  NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (10, 'healthQuestions.10.title', 'healthQuestions.10.description', NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (11, 'healthQuestions.11.title', 'healthQuestions.11.description', NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (12, 'healthQuestions.12.title', 'healthQuestions.12.description', NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (13, 'healthQuestions.13.title', 'healthQuestions.13.description', NULL, FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (14, 'healthQuestions.14.title', 'healthQuestions.14.description', 'F', FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (15, 'healthQuestions.15.title', 'healthQuestions.15.description', NULL, TRUE,  FALSE, TRUE,  FALSE, 'extra'),
    (16, 'healthQuestions.16.title', 'healthQuestions.16.description', 'M', FALSE, FALSE, TRUE,  TRUE, 'clinical'),
    (17, 'healthQuestions.17.title', 'healthQuestions.17.description', NULL, FALSE, TRUE,  TRUE,  FALSE, 'sport'),
    (18, 'healthQuestions.18.title', 'healthQuestions.18.description', NULL, TRUE,  FALSE, TRUE,  FALSE, 'extra'),
    (19, 'healthQuestions.19.title', 'healthQuestions.19.description', NULL, FALSE, TRUE,  TRUE,  FALSE, 'beneficiary'),
    (20, 'healthQuestions.20.title', 'healthQuestions.20.description', NULL, TRUE,  FALSE, TRUE,  FALSE, 'extra'),
    (21, 'healthQuestions.21.title', 'healthQuestions.21.description', NULL, FALSE, TRUE,  TRUE,  FALSE, 'beneficiary'),
    (22, 'healthQuestions.22.title', 'healthQuestions.22.description', NULL, TRUE,  FALSE, TRUE,  FALSE, 'extra'),
    (23, 'healthQuestions.23.title', 'healthQuestions.23.description', NULL, TRUE,  FALSE, TRUE,  FALSE, 'extra'),
    (24, 'healthQuestions.24.title', 'healthQuestions.24.description', NULL, TRUE,  FALSE, TRUE,  FALSE, 'extra'),
    (25, 'healthQuestions.25.title', 'healthQuestions.25.description', NULL, FALSE, FALSE, FALSE, FALSE, 'antecedent'),
    (26, 'healthQuestions.26.title', 'healthQuestions.26.description', NULL, FALSE, FALSE, FALSE, FALSE, 'antecedent');

-- ================================================================
-- 12. RESPUESTAS GENERALES DE SALUD POR SOLICITUD
-- ================================================================

CREATE TABLE respuesta_salud_solicitud (
    id_respuesta                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_solicitud                   BIGINT NOT NULL
        REFERENCES solicitud_afiliacion (id_solicitud)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    id_pregunta                    SMALLINT NOT NULL
        REFERENCES pregunta_salud (id_pregunta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    respuesta                      BOOLEAN NOT NULL,
    detalles_extra                 TEXT,
    antecedente_campo1             TEXT,
    antecedente_campo2             TEXT,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_respuesta_salud_solicitud UNIQUE (id_solicitud, id_pregunta)
);

CREATE INDEX idx_respuesta_salud_solicitud ON respuesta_salud_solicitud (id_solicitud);

-- ================================================================
-- 13. RESPUESTAS DE SALUD POR AFILIADO
-- ================================================================

CREATE TABLE respuesta_salud_afiliado (
    id_respuesta_afiliado          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_respuesta                   BIGINT NOT NULL
        REFERENCES respuesta_salud_solicitud (id_respuesta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    id_afiliado                    BIGINT NOT NULL
        REFERENCES afiliado_solicitud (id_afiliado)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    respuesta                      BOOLEAN NOT NULL,
    detalles_extra                 TEXT,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_respuesta_salud_afiliado UNIQUE (id_respuesta, id_afiliado)
);

CREATE INDEX idx_respuesta_salud_afiliado_afiliado
    ON respuesta_salud_afiliado (id_afiliado);

-- ================================================================
-- 14. DETALLES DEPORTIVOS
-- ================================================================

CREATE TABLE detalle_deportivo (
    id_detalle_deportivo            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_respuesta_afiliado           BIGINT NOT NULL
        REFERENCES respuesta_salud_afiliado (id_respuesta_afiliado)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    deporte                         VARCHAR(150) NOT NULL,
    frecuencia                      VARCHAR(100) NOT NULL,
    nivel                           nivel_deportivo NOT NULL,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_detalle_deportivo_respuesta UNIQUE (id_respuesta_afiliado)
);

-- ================================================================
-- 15. DETALLES DE ACLARACIÓN / BENEFICIARIO
-- ================================================================

CREATE TABLE detalle_aclaracion (
    id_detalle_aclaracion           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_respuesta_afiliado           BIGINT NOT NULL
        REFERENCES respuesta_salud_afiliado (id_respuesta_afiliado)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    campo1                          TEXT NOT NULL,
    campo2                          TEXT NOT NULL,

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_detalle_aclaracion_respuesta UNIQUE (id_respuesta_afiliado)
);

-- ================================================================
-- 16. AFECCIONES MÉDICAS / DETALLE CLÍNICO
-- ================================================================

CREATE TABLE afeccion_medica (
    id_afeccion                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_respuesta_afiliado          BIGINT NOT NULL
        REFERENCES respuesta_salud_afiliado (id_respuesta_afiliado)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    padecimiento                    VARCHAR(250) NOT NULL,
    fecha_diagnostico               DATE NOT NULL,
    tratamiento_practicado          TEXT NOT NULL,
    fecha_ultimo_chequeo            DATE,
    institucion_hospitalaria        VARCHAR(250),

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_afeccion_respuesta_afiliado
    ON afeccion_medica (id_respuesta_afiliado);

-- ================================================================
-- 17. ÍNDICES PRINCIPALES DE NEGOCIO
-- ================================================================

CREATE INDEX idx_solicitud_titular
    ON solicitud_afiliacion (titular_id);

CREATE INDEX idx_solicitud_contratante_natural
    ON solicitud_afiliacion (contratante_persona_natural_id);

CREATE INDEX idx_solicitud_contratante_juridico
    ON solicitud_afiliacion (contratante_persona_juridica_id);

CREATE INDEX idx_solicitud_intermediario
    ON solicitud_afiliacion (intermediario_id);

CREATE INDEX idx_solicitud_estatus
    ON solicitud_afiliacion (estatus);

CREATE INDEX idx_plan_tarifa_busqueda
    ON plan_tarifa (id_plan, edad_min, edad_max);

-- ================================================================
-- 18. TRIGGER GENÉRICO updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_persona_natural_updated_at
BEFORE UPDATE ON persona_natural
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_persona_juridica_updated_at
BEFORE UPDATE ON persona_juridica
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_intermediario_updated_at
BEFORE UPDATE ON intermediario
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plan_salud_updated_at
BEFORE UPDATE ON plan_salud
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_solicitud_afiliacion_updated_at
BEFORE UPDATE ON solicitud_afiliacion
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_afiliado_solicitud_updated_at
BEFORE UPDATE ON afiliado_solicitud
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_forma_pago_solicitud_updated_at
BEFORE UPDATE ON forma_pago_solicitud
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_firma_declaracion_solicitud_updated_at
BEFORE UPDATE ON firma_declaracion_solicitud
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_respuesta_salud_solicitud_updated_at
BEFORE UPDATE ON respuesta_salud_solicitud
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_respuesta_salud_afiliado_updated_at
BEFORE UPDATE ON respuesta_salud_afiliado
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_detalle_deportivo_updated_at
BEFORE UPDATE ON detalle_deportivo
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_detalle_aclaracion_updated_at
BEFORE UPDATE ON detalle_aclaracion
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_afeccion_medica_updated_at
BEFORE UPDATE ON afeccion_medica
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- 19. VISTA ÚTIL PARA CONSULTAR LA SOLICITUD COMPLETA
-- ================================================================

CREATE OR REPLACE VIEW vw_solicitud_resumen AS
SELECT
    s.id_solicitud,
    s.num_solicitud,
    s.tipo_operacion,
    s.tipo_contrato,
    s.fecha_solicitud,
    s.estatus,

    t.id_persona_natural AS titular_id,
    t.nombres AS titular_nombres,
    t.apellidos AS titular_apellidos,
    t.tipo_doc AS titular_tipo_doc,
    t.num_doc AS titular_num_doc,

    s.es_contratante_diferente,
    s.contratante_tipo,

    CASE
        WHEN s.es_contratante_diferente = FALSE
            THEN CONCAT(t.nombres, ' ', t.apellidos)
        WHEN s.contratante_tipo = 'Natural'
            THEN CONCAT(cn.nombres, ' ', cn.apellidos)
        WHEN s.contratante_tipo = 'Juridica'
            THEN cj.razon_social
        ELSE NULL
    END AS contratante_nombre,

    COUNT(a.id_afiliado) AS cantidad_afiliados,
    COALESCE(SUM(a.cuota_mensual_usd), 0) AS subtotal_mensual_usd

FROM solicitud_afiliacion s
JOIN persona_natural t
  ON t.id_persona_natural = s.titular_id
LEFT JOIN persona_natural cn
  ON cn.id_persona_natural = s.contratante_persona_natural_id
LEFT JOIN persona_juridica cj
  ON cj.id_persona_juridica = s.contratante_persona_juridica_id
LEFT JOIN afiliado_solicitud a
  ON a.id_solicitud = s.id_solicitud
GROUP BY
    s.id_solicitud,
    s.num_solicitud,
    s.tipo_operacion,
    s.tipo_contrato,
    s.fecha_solicitud,
    s.estatus,
    t.id_persona_natural,
    t.nombres,
    t.apellidos,
    t.tipo_doc,
    t.num_doc,
    s.es_contratante_diferente,
    s.contratante_tipo,
    cn.nombres,
    cn.apellidos,
    cj.razon_social;


-- ================================================================
-- Ejemplo de uso:
--
-- SELECT * FROM previasis.vw_solicitud_resumen;
-- SELECT * FROM previasis.plan_salud;
-- SELECT * FROM previasis.plan_tarifa;
-- SELECT * FROM previasis.pregunta_salud;
-- ================================================================
-- PREVIASIS
-- Correcciones al modelo recibido y soporte para expedientes versionados,
-- enlaces temporales, firma remota y auditoría.


SET search_path TO previasis, public;

-- El frontend utiliza M para menores que todavía no poseen cédula.

-- Ajustes para reflejar el formulario actual.
ALTER TABLE afiliado_solicitud
    ADD COLUMN IF NOT EXISTS nombres VARCHAR(120),
    ADD COLUMN IF NOT EXISTS apellidos VARCHAR(120),
    ADD COLUMN IF NOT EXISTS usa_documento_propio BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE pregunta_salud
    ADD COLUMN IF NOT EXISTS clinical_detail_level VARCHAR(20) NOT NULL DEFAULT 'simple',
    ADD COLUMN IF NOT EXISTS clinical_options JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS include_in_clinical_summary BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE pregunta_salud
    ADD CONSTRAINT ck_pregunta_clinical_detail_level
    CHECK (clinical_detail_level IN ('simple', 'detailed'));

UPDATE pregunta_salud
SET include_in_clinical_summary = TRUE
WHERE id_pregunta = 5;

UPDATE pregunta_salud
SET clinical_detail_level = 'detailed'
WHERE id_pregunta IN (7, 10);

UPDATE pregunta_salud
SET
    has_extra_input = FALSE,
    requires_clinical_detail = TRUE,
    detail_mode = 'clinical',
    clinical_options = '[
      "congenitalOrHereditary",
      "physicalDefect",
      "anomaly",
      "developmentalDisorder",
      "mentalDisorder",
      "downSyndrome"
    ]'::JSONB
WHERE id_pregunta = 18;

-- El formulario permite más de un deporte y más de una aclaración.
ALTER TABLE detalle_deportivo
    DROP CONSTRAINT IF EXISTS uq_detalle_deportivo_respuesta;

ALTER TABLE detalle_aclaracion
    DROP CONSTRAINT IF EXISTS uq_detalle_aclaracion_respuesta;

ALTER TABLE detalle_aclaracion
    ADD COLUMN IF NOT EXISTS campo2_numero VARCHAR(30),
    ADD COLUMN IF NOT EXISTS campo2_unidad VARCHAR(30);

-- Los formularios sencillos no requieren tratamiento y el diagnóstico
-- se captura con precisión de mes, no como un día inventado.
ALTER TABLE afeccion_medica
    ALTER COLUMN fecha_diagnostico DROP NOT NULL,
    ALTER COLUMN tratamiento_practicado DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS diagnostico_mes DATE;

ALTER TABLE afeccion_medica
    ADD CONSTRAINT ck_afeccion_diagnostico_mes
    CHECK (diagnostico_mes IS NULL OR EXTRACT(DAY FROM diagnostico_mes) = 1);

-- ================================================================
-- VENDEDORES Y ENLACES DE REFERIDO
-- ================================================================

ALTER TABLE intermediario
    ADD CONSTRAINT uq_intermediario_credencial UNIQUE (num_credencial),
    ADD CONSTRAINT uq_intermediario_documento
        UNIQUE (tipo_doc, ci_rif_pasaporte);

CREATE TABLE vendedor (
    id_vendedor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_intermediario BIGINT NOT NULL UNIQUE
        REFERENCES intermediario (id_intermediario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    usuario_external_id VARCHAR(120) NOT NULL UNIQUE,
    codigo_referido VARCHAR(64) NOT NULL UNIQUE
        DEFAULT encode(gen_random_bytes(16), 'hex'),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendedor_codigo_referido_activo
    ON vendedor (codigo_referido)
    WHERE activo = TRUE;

CREATE TABLE visita_enlace_referido (
    id_visita BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_vendedor UUID NOT NULL
        REFERENCES vendedor (id_vendedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    ip INET,
    user_agent TEXT,
    referer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visita_referido_vendedor_fecha
    ON visita_enlace_referido (id_vendedor, created_at DESC);

-- ================================================================
-- PROSPECTOS Y EXPEDIENTE DIGITAL
-- ================================================================

CREATE TABLE prospecto_cliente (
    id_prospecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vendedor UUID
        REFERENCES vendedor (id_vendedor)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    tipo_doc tipo_documento NOT NULL,
    num_doc VARCHAR(30) NOT NULL,
    nombres VARCHAR(120) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    email VARCHAR(254),
    telefono_movil VARCHAR(40),
    estado VARCHAR(30) NOT NULL DEFAULT 'NUEVO'
        CHECK (estado IN (
            'NUEVO',
            'EN_GESTION',
            'ENVIADO_A_FIRMA',
            'FIRMADO',
            'CONVERTIDO',
            'DESCARTADO'
        )),
    origen VARCHAR(80) NOT NULL DEFAULT 'FORMULARIO_ASISTIDO',
    vendedor_external_id VARCHAR(120),
    consentimiento_contacto BOOLEAN NOT NULL DEFAULT FALSE,
    consentimiento_datos_salud BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_prospecto_documento
    ON prospecto_cliente (tipo_doc, num_doc);

CREATE INDEX idx_prospecto_estado
    ON prospecto_cliente (estado);

CREATE INDEX idx_prospecto_vendedor
    ON prospecto_cliente (vendedor_external_id);

CREATE INDEX idx_prospecto_id_vendedor
    ON prospecto_cliente (id_vendedor);

CREATE TABLE expediente_afiliacion (
    id_expediente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vendedor UUID
        REFERENCES vendedor (id_vendedor)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    id_prospecto UUID NOT NULL
        REFERENCES prospecto_cliente (id_prospecto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    id_solicitud BIGINT
        REFERENCES solicitud_afiliacion (id_solicitud)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    numero_expediente VARCHAR(80),
    estado VARCHAR(40) NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN (
            'BORRADOR',
            'PENDIENTE_FIRMA',
            'PARCIALMENTE_FIRMADO',
            'FIRMADO',
            'REVOCADO',
            'EXPIRADO'
        )),
    llenado_asistido BOOLEAN NOT NULL DEFAULT TRUE,
    current_revision_id UUID,
    vendedor_external_id VARCHAR(120),
    enviado_a_firma_at TIMESTAMPTZ,
    firmado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_expediente_numero UNIQUE (numero_expediente)
);

CREATE INDEX idx_expediente_prospecto
    ON expediente_afiliacion (id_prospecto);

CREATE INDEX idx_expediente_vendedor
    ON expediente_afiliacion (id_vendedor);

CREATE INDEX idx_expediente_estado
    ON expediente_afiliacion (estado);

CREATE TABLE expediente_revision (
    id_revision UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_expediente UUID NOT NULL
        REFERENCES expediente_afiliacion (id_expediente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    numero_revision INTEGER NOT NULL CHECK (numero_revision > 0),
    schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
    form_data JSONB NOT NULL CHECK (jsonb_typeof(form_data) = 'object'),
    form_data_sha256 CHAR(64) GENERATED ALWAYS AS (
        encode(digest(form_data::TEXT, 'sha256'), 'hex')
    ) STORED,
    creado_por VARCHAR(20) NOT NULL
        CHECK (creado_por IN ('VENDEDOR', 'CLIENTE', 'SISTEMA')),
    motivo VARCHAR(80) NOT NULL DEFAULT 'GUARDADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_expediente_revision UNIQUE (id_expediente, numero_revision)
);

ALTER TABLE expediente_afiliacion
    ADD CONSTRAINT fk_expediente_current_revision
    FOREIGN KEY (current_revision_id)
    REFERENCES expediente_revision (id_revision)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

CREATE INDEX idx_revision_expediente
    ON expediente_revision (id_expediente, numero_revision DESC);

-- ================================================================
-- SOLICITUDES DE FIRMA REMOTA
-- ================================================================

CREATE TABLE solicitud_firma_remota (
    id_solicitud_firma UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_expediente UUID NOT NULL
        REFERENCES expediente_afiliacion (id_expediente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    id_revision UUID NOT NULL
        REFERENCES expediente_revision (id_revision)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    token_sha256 CHAR(64) NOT NULL UNIQUE,
    challenge_salt VARCHAR(64) NOT NULL,
    challenge_sha256 CHAR(64) NOT NULL,
    rol_firmante VARCHAR(30) NOT NULL
        CHECK (rol_firmante IN ('TITULAR', 'CONTRATANTE')),
    nombre_firmante VARCHAR(240) NOT NULL,
    documento_mascara VARCHAR(40) NOT NULL,
    modo_acceso VARCHAR(30) NOT NULL DEFAULT 'SOLO_FIRMA'
        CHECK (modo_acceso IN ('SOLO_FIRMA', 'EDITAR_Y_FIRMAR')),
    secciones_editables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'FIRMADO', 'EXPIRADO', 'REVOCADO')),
    expires_at TIMESTAMPTZ NOT NULL,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
    max_intentos INTEGER NOT NULL DEFAULT 8 CHECK (max_intentos > 0),
    first_access_at TIMESTAMPTZ,
    last_access_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by_external_id VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_solicitud_firma_expira CHECK (expires_at > created_at)
);

CREATE INDEX idx_solicitud_firma_expediente
    ON solicitud_firma_remota (id_expediente);

CREATE INDEX idx_solicitud_firma_estado_expira
    ON solicitud_firma_remota (estado, expires_at);

CREATE TABLE firma_electronica (
    id_firma_electronica UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_firma UUID NOT NULL UNIQUE
        REFERENCES solicitud_firma_remota (id_solicitud_firma)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    id_revision_firmada UUID NOT NULL
        REFERENCES expediente_revision (id_revision)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    firma_data_url TEXT NOT NULL,
    firma_sha256 CHAR(64) GENERATED ALWAYS AS (
        encode(digest(firma_data_url, 'sha256'), 'hex')
    ) STORED,
    acepta_declaracion_titular BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_origen_fondos BOOLEAN NOT NULL DEFAULT FALSE,
    lugar VARCHAR(180) NOT NULL,
    fecha DATE NOT NULL,
    ip INET,
    user_agent TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documento_expediente (
    id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_expediente UUID NOT NULL
        REFERENCES expediente_afiliacion (id_expediente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    id_revision UUID
        REFERENCES expediente_revision (id_revision)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('ADJUNTO', 'BORRADOR_PDF', 'PDF_FIRMADO')),
    nombre VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
    storage_key TEXT,
    sha256 CHAR(64),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_documento_expediente_storage
        CHECK (tipo <> 'PDF_FIRMADO' OR NULLIF(BTRIM(storage_key), '') IS NOT NULL)
);

CREATE INDEX idx_documento_expediente_revision
    ON documento_expediente (id_expediente, id_revision);

CREATE TABLE evento_expediente (
    id_evento BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_expediente UUID NOT NULL
        REFERENCES expediente_afiliacion (id_expediente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    id_solicitud_firma UUID
        REFERENCES solicitud_firma_remota (id_solicitud_firma)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    tipo VARCHAR(60) NOT NULL,
    actor VARCHAR(20) NOT NULL
        CHECK (actor IN ('VENDEDOR', 'CLIENTE', 'SISTEMA')),
    actor_external_id VARCHAR(120),
    ip INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evento_expediente_created_at
    ON evento_expediente (id_expediente, created_at DESC);

CREATE INDEX idx_evento_solicitud_firma
    ON evento_expediente (id_solicitud_firma)
    WHERE id_solicitud_firma IS NOT NULL;

CREATE TRIGGER trg_prospecto_cliente_updated_at
BEFORE UPDATE ON prospecto_cliente
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vendedor_updated_at
BEFORE UPDATE ON vendedor
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expediente_afiliacion_updated_at
BEFORE UPDATE ON expediente_afiliacion
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_solicitud_firma_remota_updated_at
BEFORE UPDATE ON solicitud_firma_remota
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
