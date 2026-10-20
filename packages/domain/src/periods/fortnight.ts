import { addDays, formatLocalDate, LocalDate, parseLocalDate } from './calendar.js';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const WEEKDAY_TO_JS: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export type FortnightPeriod = { periodStart: LocalDate; periodEnd: LocalDate };

/** Start of the week containing `date` for the given weekday (local). */
export function startOfWeekContaining(date: LocalDate, startWeekday: Weekday): LocalDate {
  const d = parseLocalDate(date);
  const target = WEEKDAY_TO_JS[startWeekday];
  const current = d.getDay();
  const delta = (current - target + 7) % 7;
  d.setDate(d.getDate() - delta);
  return formatLocalDate(d);
}

/**
 * Fixed 14-day fortnights anchored to `startWeekday`.
 * Periods are contiguous blocks of 14 days starting on that weekday.
 * Epoch: the startWeekday on or before 1970-01-05-ish is not used;
 * we count 14-day blocks from the week start of a fixed origin Monday 1970-01-05
 * adjusted to the configured weekday via week alignment of the date itself.
 *
 * Algorithm: find weekStart of date; then floor days since a reference weekStart
 * of the same weekday family into 14-day buckets.
 */
export function fortnightContaining(
  date: LocalDate,
  startWeekday: Weekday = 'mon',
): FortnightPeriod {
  const weekStart = startOfWeekContaining(date, startWeekday);
  // Reference: week start of 1970-01-01 in local... use UTC-free local Date
  const ref = startOfWeekContaining('1970-01-05', startWeekday); // 1970-01-05 was a Monday
  const weekStartMs = parseLocalDate(weekStart).getTime();
  const refMs = parseLocalDate(ref).getTime();
  const dayDiff = Math.floor((weekStartMs - refMs) / 86400000);
  const fortnightIndex = Math.floor(dayDiff / 14);
  const periodStart = addDays(ref, fortnightIndex * 14);
  const periodEnd = addDays(periodStart, 13);
  return { periodStart, periodEnd };
}

export function previousFortnight(period: FortnightPeriod): FortnightPeriod {
  const periodStart = addDays(period.periodStart, -14);
  return { periodStart, periodEnd: addDays(periodStart, 13) };
}

export function nextFortnight(period: FortnightPeriod): FortnightPeriod {
  const periodStart = addDays(period.periodStart, 14);
  return { periodStart, periodEnd: addDays(periodStart, 13) };
}

export function isWeekday(s: string): s is Weekday {
  return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(s);
}

/** Weekly planning periods (7 days) starting on `startWeekday`. Period type is shared with fortnight shape. */
export function weekContaining(date: LocalDate, startWeekday: Weekday = 'mon'): FortnightPeriod {
  const periodStart = startOfWeekContaining(date, startWeekday);
  return { periodStart, periodEnd: addDays(periodStart, 6) };
}

export function previousWeek(period: FortnightPeriod): FortnightPeriod {
  const periodStart = addDays(period.periodStart, -7);
  return { periodStart, periodEnd: addDays(periodStart, 6) };
}

export function nextWeek(period: FortnightPeriod): FortnightPeriod {
  const periodStart = addDays(period.periodStart, 7);
  return { periodStart, periodEnd: addDays(periodStart, 6) };
}
