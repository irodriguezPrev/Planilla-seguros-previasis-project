export function calculateActuarialAge(
  dateOfBirth: string,
  referenceDate = new Date(),
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;

  const [year, month, day] = dateOfBirth.split('-').map(Number);

  // 1. Normalizar fecha de referencia a las 00:00:00 (evita sesgo por hora del día)
  const refDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  const birthDate = new Date(year, month - 1, day);

  // Validar fecha real y que no sea futura
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day ||
    birthDate > refDate
  ) {
    return null;
  }

  // 2. Edad cronológica cumplida
  let age = refDate.getFullYear() - year;
  const birthdayThisYear = new Date(refDate.getFullYear(), month - 1, day);

  // Ajuste para nacidos el 29 de febrero en años no bisiestos
  if (month === 2 && day === 29 && birthdayThisYear.getMonth() !== 1) {
    birthdayThisYear.setDate(28);
  }

  if (birthdayThisYear > refDate) {
    age -= 1;
  }

  // 3. Determinar último y próximo cumpleaños
  const lastBirthday = new Date(birthdayThisYear);
  if (lastBirthday > refDate) {
    lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
  }

  const nextBirthday = new Date(lastBirthday);
  nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);

  // 4. Regla Actuarial de Seguros (Semestre / Cumpleaños más cercano)
  const timeSinceLastBirthday = refDate.getTime() - lastBirthday.getTime();
  const timeUntilNextBirthday = nextBirthday.getTime() - refDate.getTime();

  // Si pasaron más de 6 meses desde el último cumpleaños (o falta menos para el próximo), suma +1
  return timeUntilNextBirthday < timeSinceLastBirthday ? age : age;
}