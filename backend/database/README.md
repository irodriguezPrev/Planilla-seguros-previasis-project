# Base de datos PREVIASIS

El esquema consolidado de `backend/database/schema.sql` está preparado para una
instalación nueva de PostgreSQL. Incluye afiliaciones, prospectos, vendedores, enlaces de
referido, revisiones inmutables, firma remota y auditoría.

## Instalación

Con la base vacía y `DATABASE_URL` configurada:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/database/schema.sql
```

El script usa una transacción. Si una sentencia falla, PostgreSQL no deja el
esquema parcialmente creado.

Configure las variables en el entorno de ejecución o en el gestor de secretos:

- Backend: `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_POOL_MAX`, `PRIVATE_KEY`,
  `SIGNING_LINK_TTL_HOURS` y `PUBLIC_APP_URL`.
- Frontend: `BACKEND_INTERNAL_URL`, `NEXT_PUBLIC_BACKEND_URL` y
  `NEXT_PUBLIC_API_URL`.

No guarde credenciales reales en el repositorio.

## Desarrollo local

Después de instalar el esquema, cree la configuración local desde la plantilla:

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` y reemplace `DATABASE_URL` por la dirección real de
PostgreSQL y `PRIVATE_KEY` por la misma clave que firma los JWT de autenticación.
Este archivo está ignorado por Git; no comparta ni suba sus secretos.

Para habilitar el acceso vendedor de demostración, active
`DEMO_SELLER_ENABLED=true`. El endpoint se desactiva automáticamente cuando
`NODE_ENV=production`. Las credenciales definidas en la plantilla son usuario
`demo` y contraseña `12345`; cámbielas en `backend/.env` antes de compartir el
entorno. El perfil vendedor se crea o actualiza automáticamente al iniciar sesión.

Inicie backend y frontend en terminales separados desde la raíz del repositorio:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

El backend queda en `http://localhost:3004` y el frontend en
`http://localhost:3000`.

## Compartir el enlace con el cliente

El cliente sólo debe acceder al dominio del frontend. El navegador llama a
`/backend-api`; Next.js reenvía esas solicitudes a Express mediante
`BACKEND_INTERNAL_URL`, sin exponer credenciales ni la dirección de PostgreSQL.

Defina `BACKEND_INTERNAL_URL` antes de ejecutar `next build`, porque la regla de
proxy queda incorporada en la compilación de Next.js.

En desarrollo puede dejar `PUBLIC_APP_URL` vacío: el backend utiliza el origen
real del frontend que hizo la solicitud. Nunca comparta una URL con `localhost`,
porque en el teléfono del cliente apuntaría al propio teléfono.

En producción, `PUBLIC_APP_URL` es obligatorio y debe contener el dominio HTTPS
exactamente como lo abrirá el cliente. Por ejemplo:

```dotenv
PUBLIC_APP_URL=https://afiliacion.ejemplo.com
BACKEND_INTERNAL_URL=http://backend:3004
```

El dominio debe ser alcanzable desde la red del cliente. Un servidor disponible
sólo por VPN o por una IP privada necesita un proxy HTTPS, túnel o publicación
controlada; PostgreSQL puede y debe permanecer en la red interna.

Compruebe despliegue y base de datos por separado con `GET /api/health` y
`GET /api/health/database`.

## Alta de vendedores

Cada vendedor tiene:

- un registro de `intermediario` con los datos Sudeaseg;
- un registro de `vendedor` asociado al usuario del sistema;
- un `codigo_referido` aleatorio y único.

`usuario_external_id` debe coincidir con el `user_id` (o identificador devuelto
por `/api/credential/me`) del backend de autenticación. Hay una plantilla en
`backend/database/examples/create_seller.sql`.

El vendedor obtiene su URL desde `GET /api/referrals/me`. El cliente abre
`/afiliacion?ref=CODIGO`; la aplicación vuelve a consultar PostgreSQL y presenta
nombre, credencial y documento del asesor como campos de solo lectura.

## Firma remota

1. El vendedor revisa el borrador y pulsa **Enviar al cliente**.
2. Se crea un prospecto, un expediente y la revisión 1 del formulario.
3. Se genera un enlace distinto para titular y contratante cuando son personas
   diferentes.
4. El cliente confirma los últimos cuatro caracteres de su documento, revisa el
   PDF y firma.
5. Cada firma crea una revisión nueva; nunca se sobrescribe la revisión enviada.

En PostgreSQL sólo se guarda el hash SHA-256 del token del enlace. La
verificación documental usa `scrypt` con sal aleatoria, limita intentos y los
enlaces vencen por defecto en 72 horas.

## Consideraciones de operación

- Los datos de salud y firmas son sensibles. Restrinja el acceso al esquema,
  use TLS y cifrado de discos/copias de seguridad.
- Configure `DATABASE_SSL=true` cuando el proveedor PostgreSQL exija TLS.
- Configure `PRIVATE_KEY` con el mismo secreto que firma los JWT usados por el
  backend de autenticación.
- `firma_electronica` conserva la imagen de firma dentro de PostgreSQL para el
  MVP. En producción puede migrarse a almacenamiento de objetos cifrado y dejar
  en la tabla sólo `storage_key` y el hash.
- `documento_expediente` está preparado para guardar el PDF firmado definitivo
  en almacenamiento externo. La versión actual lo genera desde la revisión
  inmutable al abrir o descargar el documento.
- La modalidad actual es `SOLO_FIRMA`. Las columnas `modo_acceso` y
  `secciones_editables` permiten habilitar posteriormente edición limitada sin
  cambiar la estructura principal.

Antes de desplegar, pruebe el flujo completo en un ambiente aislado y verifique
la política legal aplicable a firma electrónica, conservación de evidencias y
tratamiento de datos de salud en Venezuela.
