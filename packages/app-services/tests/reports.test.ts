import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@los/persistence';
import { reportCopy, reportGenerate, reportRefresh, reportSaveEdits } from '../src/reports.js';
import { actionsCreate, actionsSetStatus } from '../src/workspace.js';

function rt() {
  return { store: new MemoryStore(), withTransaction: async <T>(fn: () => Promise<T>) => fn(), now: () => new Date('2026-10-20T12:00:00.000Z') };
}

describe('report services', () => {
  it('generates empty-honest draft, keeps edits on refresh, copies to today', async () => {
    const r = rt();
    const gen = await reportGenerate(r, { reportType: 'mbr', periodStart: '2026-10-01' });
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;
    expect(gen.data.sections.find((s) => s.sectionKey === 'delivery')?.body).toContain('No closed planning periods');
    const edited = await reportSaveEdits(r, { draftId: gen.data.draft.id, summary: 'My summary', sections: [{ sectionKey: 'highlights', body: 'My highlights' }] });
    expect(edited.ok).toBe(true);
    const refreshed = await reportRefresh(r, { draftId: gen.data.draft.id });
    if (refreshed.ok) {
      expect(refreshed.data.draft.summary).toBe('My summary');
      expect(refreshed.data.sections.find((s) => s.sectionKey === 'highlights')?.body).toBe('My highlights');
    }
    const copy = await reportCopy(r, { draftId: gen.data.draft.id });
    if (copy.ok) {
      expect(copy.data.text).toContain('to today');
      expect(copy.data.text).toContain('My highlights');
    }
    const again = await reportGenerate(r, { reportType: 'mbr', periodStart: '2026-10-01' });
    if (again.ok) expect(again.data.draft.summary).toBe('My summary');
  });
  it('remove then undo restores section', async () => {
    const r = rt();
    const gen = await reportGenerate(r, { reportType: 'qbr', periodStart: '2026-07-01' });
    if (!gen.ok) throw new Error('gen failed');
    const removed = await reportSaveEdits(r, { draftId: gen.data.draft.id, removeSectionKey: 'risks' });
    if (removed.ok) expect(removed.data.sections.find((s) => s.sectionKey === 'risks')?.removed).toBe(true);
    const undone = await reportSaveEdits(r, { draftId: gen.data.draft.id, undoRemoveSectionKey: 'risks' });
    if (undone.ok) expect(undone.data.sections.find((s) => s.sectionKey === 'risks')?.removed).toBe(false);
  });
  it('completed actions need completedAt inside period', async () => {
    const r = rt();
    const a = await actionsCreate(r, 'Done thing', null);
    if (!a.ok) throw new Error('action failed');
    await actionsSetStatus(r, a.data.action.id, 'done');
    const gen = await reportGenerate(r, { reportType: 'mbr', periodStart: '2026-10-01' });
    if (gen.ok) expect(gen.data.sections.find((s) => s.sectionKey === 'highlights')?.body).toContain('Done thing');
  });
});
