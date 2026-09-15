/**
 * Convierte un string de fecha (soporta YYYY-MM-DD y DD/MM/YYYY) a un objeto Date.
 */
function parseDateString(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  let year: number, month: number, day: number;
  const cleanStr = dateStr.trim();

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    [year, month, day] = cleanStr.split('-').map(Number);
  }
  // Formato DD/MM/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    const [dayStr, monthStr, yearStr] = cleanStr.split('/');
    year = Number(yearStr);
    month = Number(monthStr);
    day = Number(dayStr);
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Validar que sea una fecha válida (p. ej. evitar 31 de febrero)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Calcula la edad actuarial basada en la regla de redondear hacia arriba
 * si faltan 6 meses o menos para el próximo cumpleaños.
 */
export function calculateActuarialAge(
  dateOfBirthInput: string | Date,
  referenceDateInput: string | Date = new Date()
): number | null {
  const fechaNacimiento =
    typeof dateOfBirthInput === 'string'
      ? parseDateString(dateOfBirthInput)
      : dateOfBirthInput;

  const fechaEfectividad =
    typeof referenceDateInput === 'string'
      ? parseDateString(referenceDateInput)
      : referenceDateInput;

  // Validación de seguridad para fechas nulas o futuras
  if (!fechaNacimiento || !fechaEfectividad || fechaNacimiento > fechaEfectividad) {
    return null;
  }

  // 1. Calcular la edad cronológica base
  let edadCronologica = fechaEfectividad.getFullYear() - fechaNacimiento.getFullYear();

  // Ajustar si aún no ha pasado el cumpleaños en el año actual
  const mesNacimiento = fechaNacimiento.getMonth();
  const diaNacimiento = fechaNacimiento.getDate();
  const mesEfectividad = fechaEfectividad.getMonth();
  const diaEfectividad = fechaEfectividad.getDate();

  if (
    mesEfectividad < mesNacimiento ||
    (mesEfectividad === mesNacimiento && diaEfectividad < diaNacimiento)
  ) {
    edadCronologica--;
  }

  // 2. Determinar la fecha del próximo cumpleaños
  const proximoCumpleanos = new Date(
    fechaEfectividad.getFullYear(),
    mesNacimiento,
    diaNacimiento
  );

  // Si el cumpleaños de este año ya pasó, el próximo es el año que viene
  if (proximoCumpleanos < fechaEfectividad) {
    proximoCumpleanos.setFullYear(proximoCumpleanos.getFullYear() + 1);
  }

  // 3. Calcular la diferencia en meses hasta el próximo cumpleaños
  const milisegundosPorMes = (1000 * 60 * 60 * 24 * 365.25) / 12;
  const diferenciaMeses =
    (proximoCumpleanos.getTime() - fechaEfectividad.getTime()) / milisegundosPorMes;

  // 4. Aplicar regla actuarial: si faltan 6 meses o menos, se suma +1
  if (diferenciaMeses <= 6) {
    return edadCronologica + 1;
  }

  return edadCronologica;
}

// Alias por si requieres importar la función con nombre en español
export const calcularEdadActuarial = calculateActuarialAge;