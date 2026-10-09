/**
 * Setup global de las pruebas.
 *
 * Se ejecuta una vez antes de cada archivo de specs (ver `setupFiles`
 * en `vitest.config.mts`).
 *
 * Hoy el entorno es `node`: las specs cubren utilidades puras de
 * `src/core`, que no dependen del DOM. Cuando se agreguen pruebas de
 * componentes o hooks aquí se carga `@testing-library/react` y el
 * entorno pasa a `jsdom` (por archivo, con `@vitest-environment jsdom`).
 */
import { afterEach, vi } from 'vitest';

afterEach(() => {
  // `restoreMocks: true` en la config ya restaura los spies; acá se
  // limpia lo que un spec stubbea a mano sobre env y globals.
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
