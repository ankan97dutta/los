import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { createSqliteRepos } from '../src/sqlite_repos.js';
import { MemoryStore, createRepos } from '../src/index.js';
import type { FocusSession } from '@los/domain';

const session: FocusSession = {
  id: 'fs-1', taskKind: 'intention', taskRef: null, taskLabel: 'Write', technique: 'pomodoro',
  plannedFocusMinutes: 25, plannedBreakMinutes: 5, longBreakMinutes: 20, blockIndex: 1, setSize: 4,
  status: 'finished', startedAt: '2026-10-20T09:00:00.000Z', focusEndsAt: '2026-10-20T09:25:00.000Z',
  pausedRemainingSeconds: null, pausedAt: null, breakEndsAt: null, endedAt: '2026-10-20T09:25:00.000Z',
  countedFocusSeconds: 1500, finishedLocalDate: '2026-10-20',
};

describe('focus and reports repos', () => {
  it('sqlite round trip and migration 5', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-fr-'));
    const boot = await bootstrapNodeSqlite(join(dir, 'los.sqlite'));
    expect(boot.migratedTo).toBe(5);
    const repos = createSqliteRepos(boot.session);
    await repos.focus.save(session);
    expect((await repos.focus.getById('fs-1'))?.taskLabel).toBe('Write');
    expect(await repos.focus.listByFinishedDateRange('2026-10-20', '2026-10-20')).toHaveLength(1);
    expect(await repos.focus.listByFinishedDateRange('2026-10-21', '2026-10-21')).toHaveLength(0);
    await repos.reports.saveDraft(
      { id: 'd1', reportType: 'mbr', periodStart: '2026-10-01', periodEnd: '2026-10-31', periodComplete: false, title: 'T', titleEdited: false, summary: 'S', summaryEdited: false, generatedAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z' },
      [{ id: 'd1-highlights', draftId: 'd1', sectionKey: 'highlights', heading: 'H', body: 'B', sourceKind: 'lead', edited: true, removed: false, sortOrder: 1, updatedAt: '2026-10-20T00:00:00.000Z' }],
    );
    const found = await repos.reports.getDraft('mbr', '2026-10-01');
    expect(found?.sections[0]?.body).toBe('B');
    boot.session.close();
  });
  it('memory round trip', async () => {
    const repos = createRepos(new MemoryStore());
    await repos.focus.save(session);
    expect(await repos.focus.listActive()).toHaveLength(0);
    expect((await repos.focus.listByFinishedDateRange('2026-10-01', '2026-10-31'))).toHaveLength(1);
  });
});
