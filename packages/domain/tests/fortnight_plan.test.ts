import { describe, expect, it } from 'vitest';
import { addDays } from '../src/periods/calendar.js';
import { fortnightContaining } from '../src/periods/fortnight.js';

describe('fortnight plan period identity', () => {
  it('uses settings weekday and does not slide daily within period', () => {
    const period = fortnightContaining('2026-10-19', 'mon');
    let date = period.periodStart;
    for (let i = 0; i < 14; i++) {
      const p = fortnightContaining(date, 'mon');
      expect(p.periodStart).toBe(period.periodStart);
      expect(p.periodEnd).toBe(period.periodEnd);
      date = addDays(date, 1);
    }
  });

  it('changes period identity when start weekday changes', () => {
    const asMon = fortnightContaining('2026-10-19', 'mon');
    const asWed = fortnightContaining('2026-10-19', 'wed');
    expect(asMon.periodStart).not.toBe(asWed.periodStart);
  });
});
