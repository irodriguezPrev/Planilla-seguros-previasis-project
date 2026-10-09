/**
 * Configuración del cliente de la tasa del BCV.
 *
 * Separada de `currency.config.ts` para que ese archivo no mezcle la moneda
 * del cotizador (dominio de negocio) con los límites operativos del cliente
 * que consulta la tasa (dominio de red).
 */

/** Límites de sanidad para una tasa recibida de una fuente externa.
 * Fuera de este rango se considera una respuesta manipulada o corrupta. */
export const BCV_RATE_MIN = 1;
export const BCV_RATE_MAX = 10_000;

/** Cuánto se conserva una tasa del BCV en memoria antes de volver a pedirla. */
export const BCV_RATE_TTL_MS = 6 * 60 * 60 * 1000;

/** Cuánto espera la ruta al BCV antes de rendirse. */
export const BCV_RATE_TIMEOUT_MS = 10_000;