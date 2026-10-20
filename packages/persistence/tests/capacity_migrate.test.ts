import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '../src/bootstrap.js';
import { createSqliteRepos } from '../src/sqlite_repos.js';

describe('002 capacity planning migration', () => {
  it('migrates to v2 and round-trips capacity + work', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'los-cap-'));
    const dbPath = join(dir, 'los.sqlite');
    const boot = await bootstrapNodeSqlite(dbPath);
    expect(boot.migratedTo).toBe(3);
    const repos = createSqliteRepos(boot.session);
    const now = new Date().toISOString();
    await repos.planning.teamMembers.save({
      id: 'm1',
      displayName: 'Ada',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await repos.planning.planningPeriods.save({
      periodStart: '2026-10-13',
      periodEnd: '2026-10-26',
      status: 'open',
      tradeoffNotes: '',
      outcomeSummary: '',
      carryoverNotes: '',
      warningsAcknowledgedAt: null,
      closedAt: null,
      updatedAt: now,
    });
    await repos.planning.periodCapacity.save({
      id: 'c1',
      periodStart: '2026-10-13',
      teamMemberId: 'm1',
      availableHours: 40,
      leaveHours: 8,
      reservedCommitmentHours: 4,
      unplannedBufferHours: 4,
      updatedAt: now,
    });
    await repos.planning.candidateWork.save({
      id: 'w1',
      periodStart: '2026-10-13',
      title: 'Ship capacity',
      priority: 'p1',
      estimateHours: 8,
      estimateUnknown: false,
      actualHours: null,
      applicationId: null,
      status: 'ready',
      dependencyNotes: '',
      carriedFromWorkItemId: null,
      personalActionId: null,
      createdAt: now,
      updatedAt: now,
    });
    const cap = await repos.planning.periodCapacity.get('2026-10-13', 'm1');
    expect(cap?.availableHours).toBe(40);
    const work = await repos.planning.candidateWork.getById('w1');
    expect(work?.title).toBe('Ship capacity');
    boot.session.close();
  });
});
