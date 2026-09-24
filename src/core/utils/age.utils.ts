/** Converts a date string in YYYY-MM-DD or DD/MM/YYYY format to a Date. */
function parseDateString(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  let year: number, month: number, day: number;
  const cleanStr = dateStr.trim();

  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    [year, month, day] = cleanStr.split('-').map(Number);
  }
  // DD/MM/YYYY format
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    const [dayStr, monthStr, yearStr] = cleanStr.split('/');
    year = Number(yearStr);
    month = Number(monthStr);
    day = Number(dayStr);
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Reject invalid calendar dates such as February 31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Calculates actuarial age, rounding up when the next birthday is at most six months away. */
export function calculateActuarialAge(
  dateOfBirthInput: string | Date,
  referenceDateInput: string | Date = new Date()
): number | null {
  const dateOfBirth =
    typeof dateOfBirthInput === 'string'
      ? parseDateString(dateOfBirthInput)
      : dateOfBirthInput;

  const referenceDate =
    typeof referenceDateInput === 'string'
      ? parseDateString(referenceDateInput)
      : referenceDateInput;

  // Reject missing dates and future birth dates.
  if (!dateOfBirth || !referenceDate || dateOfBirth > referenceDate) {
    return null;
  }

  // Calculate the base chronological age.
  let chronologicalAge = referenceDate.getFullYear() - dateOfBirth.getFullYear();

  // Adjust when the birthday has not occurred yet in the current year.
  const birthMonth = dateOfBirth.getMonth();
  const birthDay = dateOfBirth.getDate();
  const referenceMonth = referenceDate.getMonth();
  const referenceDay = referenceDate.getDate();

  if (
    referenceMonth < birthMonth ||
    (referenceMonth === birthMonth && referenceDay < birthDay)
  ) {
    chronologicalAge--;
  }

  // Determine the next birthday.
  const nextBirthday = new Date(
    referenceDate.getFullYear(),
    birthMonth,
    birthDay,
  );

  if (nextBirthday < referenceDate) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  const millisecondsPerMonth = (1000 * 60 * 60 * 24 * 365.25) / 12;
  const monthsUntilBirthday =
    (nextBirthday.getTime() - referenceDate.getTime()) / millisecondsPerMonth;

  if (monthsUntilBirthday <= 6) {
    return chronologicalAge + 1;
  }

  return chronologicalAge;
}
