export function calculateActuarialAge(
  dateOfBirth: string,
  referenceDate = new Date(),
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;

  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day ||
    birthDate > referenceDate
  ) {
    return null;
  }

  let age = referenceDate.getFullYear() - year;
  const birthdayThisYear = new Date(referenceDate.getFullYear(), month - 1, day);

  if (birthdayThisYear > referenceDate) age -= 1;

  const lastBirthday = new Date(referenceDate.getFullYear(), month - 1, day);
  if (lastBirthday > referenceDate) lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);

  const nextBirthday = new Date(lastBirthday);
  nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);

  const timeSinceLastBirthday = referenceDate.getTime() - lastBirthday.getTime();
  const timeUntilNextBirthday = nextBirthday.getTime() - referenceDate.getTime();

  return timeUntilNextBirthday < timeSinceLastBirthday ? age + 1 : age;
}
