export type LocalDate = string; // YYYY-MM-DD
export type YearMonth = string; // YYYY-MM

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseLocalDate(s: LocalDate): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`INVALID_DATE:${s}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(y, mo - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) {
    throw new Error(`INVALID_DATE:${s}`);
  }
  return d;
}

export function localToday(now: Date = new Date()): LocalDate {
  return formatLocalDate(now);
}

export function monthContaining(date: LocalDate): YearMonth {
  const d = parseLocalDate(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function isValidYearMonth(ym: string): ym is YearMonth {
  return /^\d{4}-\d{2}$/.test(ym);
}

export function isValidLocalDate(s: string): s is LocalDate {
  try {
    parseLocalDate(s);
    return true;
  } catch {
    return false;
  }
}
