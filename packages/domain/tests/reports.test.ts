import { describe, expect, it } from 'vitest';
import { buildReportDraft, listReportPeriods, mergeReportSections, reportPeriodFor, type ReportFacts } from '../src/reports.js';

const empty: ReportFacts = { completedActions: [], dailyOutcomes: [], dailyBlockers: [], monthlyPriorities: '', closedPeriods: [], focus: { blocks: 0, minutes: 0, byTechnique: [] }, teamChanges: [], threadChanges: [] };

describe('reports domain', () => {
  it('month and quarter bounds', () => {
    const m = reportPeriodFor('mbr', '2026-09-15', '2026-10-20');
    expect(m.periodStart).toBe('2026-09-01');
    expect(m.periodEnd).toBe('2026-09-30');
    expect(m.periodComplete).toBe(true);
    const q = reportPeriodFor('qbr', '2026-08-10', '2026-10-20');
    expect(q.periodStart).toBe('2026-07-01');
    expect(q.periodEnd).toBe('2026-09-30');
  });
  it('running period effective end is today and no future periods listed', () => {
    const cur = reportPeriodFor('mbr', '2026-10-05', '2026-10-20');
    expect(cur.periodComplete).toBe(false);
    expect(cur.effectiveEnd).toBe('2026-10-20');
    const list = listReportPeriods('mbr', '2026-10-20', 3);
    expect(list[0]?.periodStart).toBe('2026-10-01');
    expect(list.every((p) => p.periodStart <= '2026-10-20')).toBe(true);
  });
  it('empty facts give honest empty sentences', () => {
    const period = reportPeriodFor('mbr', '2026-09-01', '2026-10-20');
    const { sections } = buildReportDraft(empty, period, '2026-10-20T00:00:00.000Z');
    expect(sections.find((s) => s.sectionKey === 'delivery')?.body).toBe('No closed planning periods in this period.');
    expect(sections.find((s) => s.sectionKey === 'focus')?.body).toBe('No focus sessions recorded in this period.');
    expect(sections.map((s) => s.body).join(' ')).not.toContain('0h');
  });
  it('merge keeps edited, takes fresh for unedited, tombstone stays, undo restores', () => {
    const period = reportPeriodFor('mbr', '2026-09-01', '2026-10-20');
    const first = buildReportDraft(empty, period, '2026-10-20T00:00:00.000Z');
    const existing = first.sections.map((s) =>
      s.sectionKey === 'highlights' ? { ...s, body: 'My words', edited: true } :
      s.sectionKey === 'risks' ? { ...s, removed: true, edited: true, body: 'Gone' } : s);
    const freshFacts = { ...empty, dailyOutcomes: ['Shipped the thing'] };
    const fresh = buildReportDraft(freshFacts, period, '2026-10-21T00:00:00.000Z').sections;
    const merged = mergeReportSections(existing, fresh);
    expect(merged.sections.find((s) => s.sectionKey === 'highlights')?.body).toBe('My words');
    expect(merged.sections.find((s) => s.sectionKey === 'risks')?.removed).toBe(true);
    const undone = merged.sections.map((s) => s.sectionKey === 'risks' ? { ...s, removed: false } : s);
    expect(undone.find((s) => s.sectionKey === 'risks')?.body).toBe('Gone');
  });
});
