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

/** Adds `months` to a date, clamping the day for shorter target months (e.g. Jan 31 + 1 month -> Feb 28/29). */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
}

/** Calculates actuarial age, rounding up when the next birthday is at most six months away. */
export function calculateActuarialAge(
  dateOfBirthInput: string | Date,
  referenceDateInput: string | Date = new Date(),
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

  // Compare date-only values to avoid off-by-one errors caused by the
  // reference time-of-day (new Date()) vs. midnight construction of birthdays.
  const birth = new Date(
    dateOfBirth.getFullYear(),
    dateOfBirth.getMonth(),
    dateOfBirth.getDate(),
  );
  const reference = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  // Calculate the base chronological age.
  let chronologicalAge = reference.getFullYear() - birth.getFullYear();

  // Adjust when the birthday has not occurred yet in the current year.
  if (
    reference.getMonth() < birth.getMonth() ||
    (reference.getMonth() === birth.getMonth() &&
      reference.getDate() < birth.getDate())
  ) {
    chronologicalAge--;
  }

  // Determine the next birthday (strictly after the reference date).
  const nextBirthday = new Date(
    reference.getFullYear(),
    birth.getMonth(),
    birth.getDate(),
  );
  if (nextBirthday <= reference) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  // Actuarial rule: if the next birthday is at most six months away, use the
  // following age. Measured with calendar-month arithmetic (not a 365.25-day
  // average, which mis-classifies the boundary by ~1.4 days and produced
  // inconsistent results depending on the time of day).
  if (nextBirthday <= addMonths(reference, 6)) {
    return chronologicalAge + 1;
  }

  return chronologicalAge;
}

/** Returns true when a person born on `dateOfBirth` has not yet reached `ageThreshold` years of age. */
export function isMinor(dateOfBirth: string, ageThreshold = 18): boolean {
  const dob = parseDateString(dateOfBirth);
  if (!dob) return false;

  const ref = new Date();
  const cutoff = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  cutoff.setFullYear(cutoff.getFullYear() - ageThreshold);

  return dob > cutoff;
}
