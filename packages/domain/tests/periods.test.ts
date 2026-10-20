import { describe, expect, it } from 'vitest';
import { localToday, monthContaining } from '../src/periods/calendar.js';
import {
  fortnightContaining,
  nextFortnight,
  nextWeek,
  previousFortnight,
  previousWeek,
  weekContaining,
} from '../src/periods/fortnight.js';

describe('calendar', () => {
  it('formats local today from fixed clock', () => {
    expect(localToday(new Date(2026, 9, 19, 15, 0, 0))).toBe('2026-10-19');
  });

  it('monthContaining', () => {
    expect(monthContaining('2026-10-19')).toBe('2026-10');
  });
});

describe('fortnight', () => {
  it('keeps same period for days within the same fortnight', () => {
    const a = fortnightContaining('2026-10-19', 'mon');
    const b = fortnightContaining('2026-10-20', 'mon');
    expect(a.periodStart).toBe(b.periodStart);
    expect(a.periodEnd).toBe(b.periodEnd);
  });

  it('period is 14 days inclusive', () => {
    const p = fortnightContaining('2026-10-19', 'mon');
    const start = new Date(p.periodStart + 'T00:00:00');
    const end = new Date(p.periodEnd + 'T00:00:00');
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    expect(days).toBe(14);
  });

  it('navigates ±14 days', () => {
    const p = fortnightContaining('2026-10-19', 'mon');
    const prev = previousFortnight(p);
    const next = nextFortnight(p);
    expect(prev.periodEnd < p.periodStart || prev.periodEnd <= p.periodStart).toBe(true);
    expect(next.periodStart > p.periodEnd || next.periodStart >= p.periodStart).toBe(true);
    expect(nextFortnight(prev)).toEqual(p);
  });
});

describe('week (capacity planning)', () => {
  it('period is 7 days inclusive starting on the configured weekday', () => {
    const p = weekContaining('2026-10-21', 'mon'); // Wednesday
    expect(p).toEqual({ periodStart: '2026-10-19', periodEnd: '2026-10-25' });
    expect(weekContaining('2026-10-25', 'mon')).toEqual(p);
    expect(weekContaining('2026-10-26', 'mon').periodStart).toBe('2026-10-26');
  });

  it('navigates ±7 days', () => {
    const p = weekContaining('2026-10-21', 'mon');
    expect(previousWeek(p)).toEqual({ periodStart: '2026-10-12', periodEnd: '2026-10-18' });
    expect(nextWeek(p)).toEqual({ periodStart: '2026-10-26', periodEnd: '2026-11-01' });
    expect(nextWeek(previousWeek(p))).toEqual(p);
  });
});
