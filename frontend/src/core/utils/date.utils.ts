const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Fecha local en formato `YYYY-MM-DD`.
 *
 * `Date.prototype.toISOString()` convierte a UTC, por lo que cerca de la medianoche
 * devuelve el día siguiente respecto a la fecha que ve el usuario.
 */
export function getLocalIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Mes local en formato `YYYY-MM`.
 *
 * Es el formato que espera `min`/`max` de `<input type="month">`.
 */
export function getLocalIsoMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  return `${year}-${month}`;
}

/** Primera fecha seleccionable al completar N años: `YYYY-MM-DD`. */
export function getMinimumDateYearsAgo(years: number, from: Date = new Date()): string {
  const date = new Date(from.getFullYear() - years, from.getMonth(), from.getDate());
  return getLocalIsoDate(date);
}