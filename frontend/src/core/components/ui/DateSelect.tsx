'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';

type DateParts = {
  year: string;
  month: string;
  day: string;
};

type DatePart = keyof DateParts;

export interface DateSelectProps {
  /** Current date as `YYYY-MM-DD`, or an empty string when incomplete. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Earliest selectable date as `YYYY-MM-DD`. */
  min?: string;
  /** Latest selectable date as `YYYY-MM-DD`. */
  max?: string;
  required?: boolean;
  /** Applied to the year select so an external `<label htmlFor>` keeps working. */
  id?: string;
  error?: string;
  className?: string;
}

const EMPTY_PARTS: DateParts = { year: '', month: '', day: '' };

/** Years spanned when the consumer does not provide `min`. */
const DEFAULT_YEARS_BACK = 80;

const pad = (value: number): string => String(value).padStart(2, '0');

function parseParts(value: string | undefined | null): DateParts {
  const match = String(value ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return EMPTY_PARTS;

  const [, year, month, day] = match;
  return { year, month, day };
}

function toIsoDate({ year, month, day }: DateParts): string {
  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
}

/** `month` is 1-based, so passing 0 to the Date rolls back to the previous month's last day. */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Three selects in a fixed year → month → day order. The native `date` input lets the
 * OS decide the segment order, so it cannot be relied on across phones and browsers.
 */
export const DateSelect: React.FC<DateSelectProps> = ({
  value,
  onChange,
  onBlur,
  min,
  max,
  required = false,
  id,
  error,
  className,
}) => {
  const t = useTranslations('dateSelect');
  const locale = useLocale();

  const minDate = useMemo(() => parseParts(min), [min]);
  const maxDate = useMemo(() => parseParts(max), [max]);

  const currentYear = new Date().getFullYear();
  const minYear = minDate.year ? Number(minDate.year) : currentYear - DEFAULT_YEARS_BACK;
  const maxYear = maxDate.year ? Number(maxDate.year) : currentYear;

  const [parts, setParts] = useState<DateParts>(() => parseParts(value));
  // The parent owns the value, but it cannot round-trip a partially filled date. Tracking
  // the last emission lets an empty `value` from a partial selection keep the visible state.
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setParts(parseParts(value));
  }, [value]);

  const commit = useCallback(
    (next: DateParts) => {
      const iso = toIsoDate(next);
      lastEmitted.current = iso;
      setParts(next);
      onChange(iso);
    },
    [onChange],
  );

  const handlePartChange =
    (part: DatePart) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next: DateParts = { ...parts, [part]: event.target.value };
      const year = next.year ? Number(next.year) : null;
      const month = next.month ? Number(next.month) : null;

      // Shortening the month (or switching to a non-leap February) clamps an impossible day.
      if (year && month && next.day && Number(next.day) > daysInMonth(year, month)) {
        next.day = pad(daysInMonth(year, month));
      }

      commit(next);
    };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!onBlur) return;

    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;

    onBlur();
  };

  const yearOptions = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index),
    [maxYear, minYear],
  );

  const monthOptions = useMemo(() => {
    const selectedYear = parts.year ? Number(parts.year) : null;
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' });

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const isBeforeMin =
        selectedYear === minYear && minDate.year !== '' && month < Number(minDate.month);
      const isAfterMax =
        selectedYear === maxYear && maxDate.year !== '' && month > Number(maxDate.month);

      return {
        value: pad(month),
        label: monthFormatter.format(new Date(2000, index, 1)),
        disabled: isBeforeMin || isAfterMax,
      };
    });
  }, [locale, parts.year, minYear, maxYear, minDate.year, maxDate.year, minDate.month, maxDate.month]);

  const dayOptions = useMemo(() => {
    const selectedYear = parts.year ? Number(parts.year) : null;
    const selectedMonth = parts.month ? Number(parts.month) : null;
    const total =
      selectedYear && selectedMonth ? daysInMonth(selectedYear, selectedMonth) : 31;

    return Array.from({ length: total }, (_, index) => {
      const day = index + 1;
      const isBeforeMin =
        selectedYear === minYear &&
        minDate.year !== '' &&
        selectedMonth === Number(minDate.month) &&
        day < Number(minDate.day);
      const isAfterMax =
        selectedYear === maxYear &&
        maxDate.year !== '' &&
        selectedMonth === Number(maxDate.month) &&
        day > Number(maxDate.day);

      return { value: pad(day), label: String(day), disabled: isBeforeMin || isAfterMax };
    });
  }, [
    parts.year,
    parts.month,
    minYear,
    maxYear,
    minDate.year,
    maxDate.month,
    minDate.day,
    maxDate.day,
  ]);

  return (
    <div className={clsx('date-select', className)} onBlur={handleBlur}>
      <select
        id={id}
        className="date-select__field date-select__field--year previasis-input"
        value={parts.year}
        onChange={handlePartChange('year')}
        aria-label={t('year')}
        aria-invalid={error ? true : undefined}
        required={required}
      >
        <option value="">{t('yearPlaceholder')}</option>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select
        className="date-select__field previasis-input"
        value={parts.month}
        onChange={handlePartChange('month')}
        aria-label={t('month')}
        required={required}
      >
        <option value="">{t('monthPlaceholder')}</option>
        {monthOptions.map((month) => (
          <option key={month.value} value={month.value} disabled={month.disabled}>
            {month.label}
          </option>
        ))}
      </select>

      <select
        className="date-select__field previasis-input"
        value={parts.day}
        onChange={handlePartChange('day')}
        aria-label={t('day')}
        required={required}
      >
        <option value="">{t('dayPlaceholder')}</option>
        {dayOptions.map((day) => (
          <option key={day.value} value={day.value} disabled={day.disabled}>
            {day.label}
          </option>
        ))}
      </select>

      {error && <span className="date-select__error">{error}</span>}
    </div>
  );
};

export default DateSelect;
