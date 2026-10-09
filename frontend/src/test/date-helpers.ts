/**
 * Helpers de fecha compartidos por las specs.
 *
 * Están en `src/test/` para que queden fuera del reporte de cobertura
 * (ver `coverage.exclude` en `vitest.config.mts`).
 */

export const toDateString = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Fecha de nacimiento exactamente `years` años antes que hoy, en el mismo
 * día y mes. Si hoy es 29 de febrero, `Date` rueda al 1 de marzo en años
 * no bisiestos y la edad calculada quedaría un año atrás, así que en ese
 * caso se fuerza el 28 de febrero.
 */
export const birthDateYearsAgo = (years: number): string => {
  const today = new Date();
  const date = new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
  if (date.getMonth() !== today.getMonth() || date.getDate() !== today.getDate()) {
    date.setFullYear(today.getFullYear() - years, 1, 28);
  }
  return toDateString(date);
};
