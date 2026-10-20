import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bootstrapNodeSqlite } from '@los/persistence/node';
import { createSqliteRepos } from '@los/persistence';
import {
  planningAllocate,
  planningCapacityUpsert,
  planningHistoryGet,
  planningMemberUpsert,
  planningPeriodClose,
  planningPeriodGet,
  planningWorkList,
  planningWorkUpsert,
} from '../src/capacity_planning.js';

/** Same path Tauri `db_bootstrap` uses (macOS). */
function tauriAppDataDbPath(): string {
  // NEVER the real app-data DB: these smokes create/close periods and would
  // pollute (and lock) the developer's live workspace. Use an isolated temp DB.
  return join(tmpdir(), 'los-smoke', 'los.sqlite');
}

function makeRt(
  session: Awaited<ReturnType<typeof bootstrapNodeSqlite>>['session'],
  dbPath: string,
) {
  const sqliteRepos = createSqliteRepos(session);
  return {
    sqliteRepos,
    withTransaction: <T>(fn: () => Promise<T>) => session.withTransaction(fn),
    dbPath,
    dbReady: true as const,
    trayAvailable: false,
    globalShortcutAvailable: true,
    globalShortcutRegistered: false,
  };
}

const MARKER = `003-cap-smoke-${Date.now()}`;

describe('003 capacity smokes (Tauri app-data path)', () => {
  const dbPath = tauriAppDataDbPath();

  it('T018/T022/T029/T035/T036: capacity+demand+soft-gate+close/carry; relaunch ×3', async () => {
    mkdirSync(join(dbPath, '..'), { recursive: true });
    let periodStart = '';
    let memberId = '';
    let workId = '';

    {
      const boot = await bootstrapNodeSqlite(dbPath);
      const rt = makeRt(boot.session, dbPath);
      const period = await planningPeriodGet(rt);
      expect(period.ok).toBe(true);
      if (!period.ok) return;
      periodStart = period.data.period.periodStart;
      if (period.data.period.status === 'closed') {
        // Current week already closed in the shared app-data DB — scan ahead.
        const { nextWeek } = await import('@los/domain');
        let cursor = {
          periodStart: period.data.period.periodStart,
          periodEnd: period.data.period.periodEnd,
        };
        for (let i = 0; i < 8; i++) {
          cursor = nextWeek(cursor);
          const open = await planningPeriodGet(rt, cursor.periodStart);
          expect(open.ok).toBe(true);
          if (!open.ok) return;
          if (open.data.period.status !== 'closed') {
            periodStart = open.data.period.periodStart;
            break;
          }
        }
      }

      const m = await planningMemberUpsert(rt, { displayName: `Lead-${MARKER}` });
      expect(m.ok).toBe(true);
      if (!m.ok) return;
      memberId = m.data.member.id;

      const cap = await planningCapacityUpsert(rt, {
        periodStart,
        teamMemberId: memberId,
        availableHours: 40,
        leaveHours: 0,
        reservedCommitmentHours: 0,
        unplannedBufferHours: 4,
      });
      expect(cap.ok).toBe(true);
      if (cap.ok) expect(cap.data.netHours).toBe(36);

      const unknown = await planningWorkUpsert(rt, {
        periodStart,
        title: `${MARKER} unknown`,
        estimateUnknown: true,
        status: 'blocked',
      });
      expect(unknown.ok).toBe(true);

      const w = await planningWorkUpsert(rt, {
        periodStart,
        title: `${MARKER} commit`,
        estimateHours: 8,
        status: 'ready',
      });
      expect(w.ok).toBe(true);
      if (!w.ok) return;
      workId = w.data.item.id;

      const reject = await planningAllocate(rt, {
        workItemId: workId,
        teamMemberId: null,
        commitmentKind: 'commitment',
      });
      expect(reject.ok).toBe(false);
      if (!reject.ok) expect(reject.error.code).toBe('COMMIT_REQUIRES_ASSIGNEE');

      const overloadWork = await planningWorkUpsert(rt, {
        periodStart,
        title: `${MARKER} overload`,
        estimateHours: 80,
      });
      expect(overloadWork.ok).toBe(true);
      if (!overloadWork.ok) return;
      const overloaded = await planningAllocate(rt, {
        workItemId: overloadWork.data.item.id,
        teamMemberId: memberId,
        commitmentKind: 'commitment',
      });
      expect(overloaded.ok).toBe(true);
      if (overloaded.ok) {
        expect(overloaded.data.planConflicted).toBe(true);
        expect(overloaded.data.warnings.some((x) => x.code === 'CAPACITY_OVERLOAD')).toBe(true);
      }

      // Keep a normal commitment for carry-forward (not the overload-only plan)
      const okAlloc = await planningAllocate(rt, {
        workItemId: workId,
        teamMemberId: memberId,
        commitmentKind: 'commitment',
      });
      expect(okAlloc.ok).toBe(true);

      boot.session.close();
    }

    // SC-C02: relaunch ×3 — reopen durable DB; capacity + demand still present
    for (let trial = 1; trial <= 3; trial++) {
      const boot = await bootstrapNodeSqlite(dbPath);
      expect(boot.created).toBe(false);
      const rt = makeRt(boot.session, dbPath);
      const period = await planningPeriodGet(rt, periodStart);
      expect(period.ok).toBe(true);
      if (!period.ok) return;
      expect(period.data.capacitySummary.members.some((m) => m.teamMemberId === memberId)).toBe(
        true,
      );
      expect(period.data.work.some((w) => w.id === workId && w.title.includes(MARKER))).toBe(true);
      boot.session.close();
    }
    expect(existsSync(dbPath)).toBe(true);

    // Close + carry-forward + history (T035); may need acceptWarnings due to overload item
    {
      const boot = await bootstrapNodeSqlite(dbPath);
      const rt = makeRt(boot.session, dbPath);
      const closed = await planningPeriodClose(rt, {
        periodStart,
        acceptWarnings: true,
        carryForwardWorkItemIds: [workId],
        outcomeSummary: `closed ${MARKER}`,
        carryoverNotes: `carry ${MARKER}`,
      });
      expect(closed.ok).toBe(true);
      if (!closed.ok) return;
      expect(closed.data.carriedForwardCount).toBe(1);
      expect(closed.data.nextPeriodStart).toBeTruthy();

      const hist = await planningHistoryGet(rt, periodStart);
      expect(hist.ok).toBe(true);
      if (hist.ok) {
        expect(hist.data.snapshot).toBeTruthy();
        expect(hist.data.period.status).toBe('closed');
      }

      const next = await planningWorkList(rt, closed.data.nextPeriodStart!);
      expect(next.ok).toBe(true);
      if (next.ok) {
        expect(next.data.items.some((i) => i.carriedFromWorkItemId === workId)).toBe(true);
      }

      // Structural edit rejected when closed
      const frozen = await planningCapacityUpsert(rt, {
        periodStart,
        teamMemberId: memberId,
        availableHours: 10,
        leaveHours: 0,
        reservedCommitmentHours: 0,
        unplannedBufferHours: 0,
      });
      expect(frozen.ok).toBe(false);
      if (!frozen.ok) expect(frozen.error.code).toBe('PERIOD_CLOSED');

      boot.session.close();
    }
  });

  it('T039 SC-C05: first-pass plan (roster + ≥3 work + allocate + commit) under 15 minutes', async () => {
    const boot = await bootstrapNodeSqlite(dbPath);
    const rt = makeRt(boot.session, dbPath);
    const t0 = Date.now();
    const period = await planningPeriodGet(rt);
    expect(period.ok).toBe(true);
    if (!period.ok) return;
    // Use next open week if current was closed by a prior smoke (scan ahead).
    let ps = period.data.period.periodStart;
    if (period.data.period.status === 'closed') {
      const { nextWeek } = await import('@los/domain');
      let cursor = {
        periodStart: period.data.period.periodStart,
        periodEnd: period.data.period.periodEnd,
      };
      for (let i = 0; i < 8; i++) {
        cursor = nextWeek(cursor);
        const open = await planningPeriodGet(rt, cursor.periodStart);
        expect(open.ok).toBe(true);
        if (!open.ok) return;
        if (open.data.period.status !== 'closed') {
          ps = open.data.period.periodStart;
          break;
        }
      }
    }
    const m = await planningMemberUpsert(rt, { displayName: `Timed-${MARKER}` });
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    await planningCapacityUpsert(rt, {
      periodStart: ps,
      teamMemberId: m.data.member.id,
      availableHours: 40,
      leaveHours: 0,
      reservedCommitmentHours: 0,
      unplannedBufferHours: 2,
    });
    for (let i = 1; i <= 3; i++) {
      const w = await planningWorkUpsert(rt, {
        periodStart: ps,
        title: `${MARKER} timed-${i}`,
        estimateHours: 2,
      });
      expect(w.ok).toBe(true);
      if (!w.ok) return;
      const a = await planningAllocate(rt, {
        workItemId: w.data.item.id,
        teamMemberId: m.data.member.id,
        commitmentKind: 'commitment',
      });
      expect(a.ok).toBe(true);
    }
    const elapsedMs = Date.now() - t0;
    expect(elapsedMs).toBeLessThan(15 * 60 * 1000);
    boot.session.close();
  });

  it('T037 SC-C07: no Jira/Confluence/LLM package deps in workspace', () => {
    const root = join(import.meta.dirname, '../../..');
    const pkgs = [
      join(root, 'package.json'),
      join(root, 'packages/domain/package.json'),
      join(root, 'packages/persistence/package.json'),
      join(root, 'packages/app-services/package.json'),
      join(root, 'apps/desktop/package.json'),
    ];
    const banned = /jira|confluence|openai|anthropic|@ai-sdk|langchain|ollama/i;
    for (const pkg of pkgs) {
      const text = readFileSync(pkg, 'utf8');
      expect(banned.test(text)).toBe(false);
    }
    // Capacity planning module has no network imports
    const svc = readFileSync(
      join(import.meta.dirname, '../src/capacity_planning.ts'),
      'utf8',
    );
    expect(svc).not.toMatch(/fetch\(|axios|http\.|https\./);
  });

  it('T038 SC-C06: CapacityPlanPage keyboard Enter paths for member + work', () => {
    const page = readFileSync(
      join(
        import.meta.dirname,
        '../../../apps/desktop/src/features/planning/CapacityPlanPage.tsx',
      ),
      'utf8',
    );
    expect(page).toContain("e.key === 'Enter'");
    expect(page).toContain('Add member');
    expect(page).toContain('Add work');
    expect(page).toMatch(/onKeyDown/);
  });
});
