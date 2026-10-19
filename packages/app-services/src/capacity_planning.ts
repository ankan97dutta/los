import {
  addDays,
  computeCapacity,
  computeMemberLoad,
  createTeamMember,
  err,
  fortnightContaining,
  isCarryForwardEligible,
  localToday,
  newId,
  ok,
  remainingHours,
  validateAllocation,
  validateCapacityHours,
  validateEstimate,
  validateWorkTitle,
  type CommitmentKind,
  type WorkPriority,
  type WorkStatus,
} from '@los/domain';
import { createRepos, type WorkspaceRepos } from '@los/persistence';
import type { WorkspaceRuntime } from './workspace.js';

function repos(rt: WorkspaceRuntime): WorkspaceRepos {
  if (rt.sqliteRepos) return rt.sqliteRepos;
  if (!rt.store) throw new Error('WorkspaceRuntime requires store or sqliteRepos');
  return createRepos(rt.store);
}

async function tx<T>(rt: WorkspaceRuntime, fn: () => Promise<T>): Promise<T> {
  if (rt.withTransaction) return rt.withTransaction(fn);
  return fn();
}

function now(rt: WorkspaceRuntime): string {
  return (rt.now?.() ?? new Date()).toISOString();
}

function persist(rt: WorkspaceRuntime): void {
  void rt.persist?.();
}

type Warning = { code: string; message: string; workItemId?: string; teamMemberId?: string };

async function ensurePeriod(rt: WorkspaceRuntime, periodStart?: string) {
  const settings = await repos(rt).settings.get();
  const asOf = periodStart ?? localToday();
  const period = periodStart
    ? fortnightContaining(periodStart, settings.fortnightStartWeekday)
    : fortnightContaining(asOf, settings.fortnightStartWeekday);
  const existing = await repos(rt).planning.planningPeriods.get(period.periodStart);
  if (existing) return existing;
  const meta = {
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    status: 'open' as const,
    tradeoffNotes: '',
    outcomeSummary: '',
    carryoverNotes: '',
    warningsAcknowledgedAt: null,
    closedAt: null,
    updatedAt: now(rt),
  };
  await repos(rt).planning.planningPeriods.save(meta);
  persist(rt);
  return meta;
}

async function assertPeriodOpen(rt: WorkspaceRuntime, periodStart: string) {
  const p = await ensurePeriod(rt, periodStart);
  if (p.status === 'closed') {
    return err('PERIOD_CLOSED', 'Planning period is closed; plan structure is read-only.');
  }
  return ok(p);
}

async function buildWarnings(rt: WorkspaceRuntime, periodStart: string): Promise<Warning[]> {
  const work = await repos(rt).planning.candidateWork.listByPeriod(periodStart);
  const allocs = await repos(rt).planning.workAllocations.listByPeriodWorkIds(work.map((w) => w.id));
  const byWork = new Map(allocs.map((a) => [a.workItemId, a]));
  const caps = await repos(rt).planning.periodCapacity.listByPeriod(periodStart);
  const warnings: Warning[] = [];

  const loadItems = work.map((w) => {
    const a = byWork.get(w.id);
    return {
      estimateHours: w.estimateHours,
      estimateUnknown: w.estimateUnknown,
      commitmentKind: a?.commitmentKind ?? ('none' as CommitmentKind),
      teamMemberId: a?.teamMemberId ?? null,
    };
  });

  for (const cap of caps) {
    const br = computeCapacity(cap);
    const load = computeMemberLoad(loadItems, cap.teamMemberId);
    if (load.committedLoadHours > br.netHours) {
      warnings.push({
        code: 'CAPACITY_OVERLOAD',
        message: `Committed load exceeds net capacity for member ${cap.teamMemberId}.`,
        teamMemberId: cap.teamMemberId,
      });
    }
  }

  for (const w of work) {
    const a = byWork.get(w.id);
    if (a?.commitmentKind !== 'commitment') continue;
    if (w.status === 'blocked' || w.status === 'waiting_external') {
      warnings.push({
        code: 'COMMIT_BLOCKED_ITEM',
        message: `Commitment on ${w.status} item.`,
        workItemId: w.id,
      });
    }
    if (w.estimateUnknown || w.estimateHours == null) {
      warnings.push({
        code: 'COMMIT_UNKNOWN_ESTIMATE',
        message: 'Commitment on unestimated item.',
        workItemId: w.id,
      });
    }
  }
  return warnings;
}

export async function planningMembersList(rt: WorkspaceRuntime) {
  const members = await repos(rt).planning.teamMembers.list();
  return ok({ members });
}

export async function planningMemberUpsert(
  rt: WorkspaceRuntime,
  input: { id?: string; displayName: string; active?: boolean },
) {
  const existing = input.id ? await repos(rt).planning.teamMembers.getById(input.id) : null;
  if (input.id && !existing) return err('MEMBER_NOT_FOUND', 'Team member not found.');
  if (existing) {
    const name = createTeamMember(input.displayName, now(rt), existing.id);
    if (!name.ok) return name;
    const member = {
      ...existing,
      displayName: name.data.displayName,
      active: input.active ?? existing.active,
      updatedAt: now(rt),
    };
    await repos(rt).planning.teamMembers.save(member);
    persist(rt);
    return ok({ member });
  }
  const created = createTeamMember(input.displayName, now(rt));
  if (!created.ok) return created;
  await repos(rt).planning.teamMembers.save(created.data);
  persist(rt);
  return ok({ member: created.data });
}

export async function planningCapacityUpsert(
  rt: WorkspaceRuntime,
  input: {
    periodStart: string;
    teamMemberId: string;
    availableHours: number;
    leaveHours: number;
    reservedCommitmentHours: number;
    unplannedBufferHours: number;
  },
) {
  const open = await assertPeriodOpen(rt, input.periodStart);
  if (!open.ok) return open;
  const member = await repos(rt).planning.teamMembers.getById(input.teamMemberId);
  if (!member) return err('MEMBER_NOT_FOUND', 'Team member not found.');
  const hours = validateCapacityHours({
    availableHours: input.availableHours,
    leaveHours: input.leaveHours,
    reservedCommitmentHours: input.reservedCommitmentHours,
    unplannedBufferHours: input.unplannedBufferHours,
  });
  if (!hours.ok) return hours;
  const existing = await repos(rt).planning.periodCapacity.get(
    input.periodStart,
    input.teamMemberId,
  );
  const row = {
    id: existing?.id ?? newId(),
    periodStart: input.periodStart,
    teamMemberId: input.teamMemberId,
    ...hours.data,
    updatedAt: now(rt),
  };
  await repos(rt).planning.periodCapacity.save(row);
  persist(rt);
  const netHours = computeCapacity(row).netHours;
  return ok({ capacity: row, netHours });
}

export async function planningWorkList(rt: WorkspaceRuntime, periodStart: string) {
  await ensurePeriod(rt, periodStart);
  const items = await repos(rt).planning.candidateWork.listByPeriod(periodStart);
  const allocs = await repos(rt).planning.workAllocations.listByPeriodWorkIds(items.map((i) => i.id));
  return ok({ items, allocations: allocs });
}

export async function planningWorkUpsert(
  rt: WorkspaceRuntime,
  input: {
    id?: string;
    periodStart: string;
    title: string;
    priority?: WorkPriority;
    estimateHours?: number | null;
    estimateUnknown?: boolean;
    actualHours?: number | null;
    applicationId?: string | null;
    status?: WorkStatus;
    dependencyNotes?: string;
  },
) {
  const open = await assertPeriodOpen(rt, input.periodStart);
  if (!open.ok) return open;
  const title = validateWorkTitle(input.title);
  if (!title.ok) return title;
  const est = validateEstimate({
    estimateHours: input.estimateHours,
    estimateUnknown: input.estimateUnknown ?? input.estimateHours == null,
  });
  if (!est.ok) return est;
  if (input.applicationId) {
    const app = await repos(rt).applications.getById(input.applicationId);
    if (!app) return err('APPLICATION_NOT_FOUND', 'Application not found.');
  }
  const existing = input.id ? await repos(rt).planning.candidateWork.getById(input.id) : null;
  if (input.id && !existing) return err('WORK_NOT_FOUND', 'Work item not found.');
  if (existing && existing.periodStart !== input.periodStart) {
    return err('VALIDATION_ERROR', 'Cannot move work across periods.');
  }
  const item = {
    id: existing?.id ?? newId(),
    periodStart: input.periodStart,
    title: title.data,
    priority: input.priority ?? existing?.priority ?? ('p2' as WorkPriority),
    estimateHours: est.data.estimateHours,
    estimateUnknown: est.data.estimateUnknown,
    actualHours: input.actualHours ?? existing?.actualHours ?? null,
    applicationId: input.applicationId === undefined ? (existing?.applicationId ?? null) : input.applicationId,
    status: input.status ?? existing?.status ?? ('ready' as WorkStatus),
    dependencyNotes: input.dependencyNotes ?? existing?.dependencyNotes ?? '',
    carriedFromWorkItemId: existing?.carriedFromWorkItemId ?? null,
    personalActionId: existing?.personalActionId ?? null,
    createdAt: existing?.createdAt ?? now(rt),
    updatedAt: now(rt),
  };
  await repos(rt).planning.candidateWork.save(item);
  if (!existing) {
    await repos(rt).planning.workAllocations.save({
      id: newId(),
      workItemId: item.id,
      teamMemberId: null,
      commitmentKind: 'none',
      updatedAt: now(rt),
    });
  }
  persist(rt);
  return ok({ item });
}

export async function planningAllocate(
  rt: WorkspaceRuntime,
  input: {
    workItemId: string;
    teamMemberId: string | null;
    commitmentKind: CommitmentKind;
  },
) {
  const work = await repos(rt).planning.candidateWork.getById(input.workItemId);
  if (!work) return err('WORK_NOT_FOUND', 'Work item not found.');
  const open = await assertPeriodOpen(rt, work.periodStart);
  if (!open.ok) return open;
  const allocCheck = validateAllocation(input);
  if (!allocCheck.ok) return allocCheck;
  if (input.teamMemberId) {
    const m = await repos(rt).planning.teamMembers.getById(input.teamMemberId);
    if (!m) return err('MEMBER_NOT_FOUND', 'Team member not found.');
    if (!m.active) return err('VALIDATION_ERROR', 'Cannot allocate to inactive member.');
  }
  const existing = await repos(rt).planning.workAllocations.getByWorkItemId(input.workItemId);
  const allocation = {
    id: existing?.id ?? newId(),
    workItemId: input.workItemId,
    teamMemberId: input.teamMemberId,
    commitmentKind: input.commitmentKind,
    updatedAt: now(rt),
  };
  await repos(rt).planning.workAllocations.save(allocation);
  persist(rt);
  const warnings = await buildWarnings(rt, work.periodStart);
  return ok({
    allocation,
    warnings,
    planConflicted: warnings.length > 0,
  });
}

export async function planningPeriodSaveMeta(
  rt: WorkspaceRuntime,
  input: {
    periodStart: string;
    tradeoffNotes?: string;
    outcomeSummary?: string;
    carryoverNotes?: string;
  },
) {
  const period = await ensurePeriod(rt, input.periodStart);
  const next = {
    ...period,
    tradeoffNotes: input.tradeoffNotes ?? period.tradeoffNotes,
    outcomeSummary: input.outcomeSummary ?? period.outcomeSummary,
    carryoverNotes: input.carryoverNotes ?? period.carryoverNotes,
    updatedAt: now(rt),
  };
  await repos(rt).planning.planningPeriods.save(next);
  persist(rt);
  return ok({ period: next });
}

export async function planningPeriodGet(rt: WorkspaceRuntime, periodStart?: string) {
  const period = await ensurePeriod(rt, periodStart);
  const members = await repos(rt).planning.teamMembers.list();
  const caps = await repos(rt).planning.periodCapacity.listByPeriod(period.periodStart);
  const work = await repos(rt).planning.candidateWork.listByPeriod(period.periodStart);
  const allocs = await repos(rt).planning.workAllocations.listByPeriodWorkIds(work.map((w) => w.id));
  const byWork = new Map(allocs.map((a) => [a.workItemId, a]));
  const loadItems = work.map((w) => {
    const a = byWork.get(w.id);
    return {
      estimateHours: w.estimateHours,
      estimateUnknown: w.estimateUnknown,
      commitmentKind: a?.commitmentKind ?? ('none' as CommitmentKind),
      teamMemberId: a?.teamMemberId ?? null,
    };
  });

  const memberSummaries = caps.map((cap) => {
    const m = members.find((x) => x.id === cap.teamMemberId);
    const br = computeCapacity(cap);
    const load = computeMemberLoad(loadItems, cap.teamMemberId);
    return {
      teamMemberId: cap.teamMemberId,
      displayName: m?.displayName ?? cap.teamMemberId,
      availableHours: cap.availableHours,
      leaveHours: cap.leaveHours,
      reservedCommitmentHours: cap.reservedCommitmentHours,
      unplannedBufferHours: cap.unplannedBufferHours,
      netHours: br.netHours,
      committedLoadHours: load.committedLoadHours,
      remainingHours: remainingHours(br.netHours, load.committedLoadHours),
      unestimatedCommitCount: load.unestimatedCommitCount,
      stretchHours: load.stretchHours,
    };
  });

  const totals = memberSummaries.reduce(
    (acc, m) => ({
      netHours: acc.netHours + m.netHours,
      committedLoadHours: acc.committedLoadHours + m.committedLoadHours,
      remainingHours: acc.remainingHours + m.remainingHours,
      unestimatedCommitCount: acc.unestimatedCommitCount + m.unestimatedCommitCount,
      unallocatedCount: acc.unallocatedCount,
    }),
    {
      netHours: 0,
      committedLoadHours: 0,
      remainingHours: 0,
      unestimatedCommitCount: 0,
      unallocatedCount: work.filter((w) => !(byWork.get(w.id)?.teamMemberId)).length,
    },
  );

  const warnings = await buildWarnings(rt, period.periodStart);
  return ok({
    period: {
      ...period,
      planConflicted: warnings.length > 0,
    },
    capacitySummary: { members: memberSummaries, totals },
    work,
    allocations: allocs,
    warnings,
  });
}

export async function planningPeriodClose(
  rt: WorkspaceRuntime,
  input: {
    periodStart: string;
    outcomeSummary?: string;
    carryoverNotes?: string;
    acceptWarnings?: boolean;
    carryForwardWorkItemIds?: string[];
  },
) {
  return tx(rt, async () => {
    const period = await ensurePeriod(rt, input.periodStart);
    if (period.status === 'closed') {
      const snap = await repos(rt).planning.commitmentSnapshots.getByPeriod(period.periodStart);
      return ok({
        period,
        snapshotId: snap?.id ?? '',
        nextPeriodStart: undefined as string | undefined,
        carriedForwardCount: 0,
      });
    }

    const warnings = await buildWarnings(rt, period.periodStart);
    if (warnings.length && !input.acceptWarnings) {
      const first = warnings[0]!;
      return err(first.code as 'CAPACITY_OVERLOAD', first.message);
    }

    const work = await repos(rt).planning.candidateWork.listByPeriod(period.periodStart);
    const allocs = await repos(rt).planning.workAllocations.listByPeriodWorkIds(work.map((w) => w.id));
    const members = await repos(rt).planning.teamMembers.list();
    const byMember = new Map(members.map((m) => [m.id, m.displayName]));
    const byAlloc = new Map(allocs.map((a) => [a.workItemId, a]));

    const ids = input.carryForwardWorkItemIds ?? [];
    for (const id of ids) {
      const src = work.find((w) => w.id === id);
      const a = byAlloc.get(id);
      if (!src || !a || !isCarryForwardEligible({ commitmentKind: a.commitmentKind, status: src.status })) {
        return err('CARRY_FORWARD_INVALID', `Work item ${id} is not eligible for carry-forward.`);
      }
    }

    const payload = JSON.stringify({
      version: 1,
      items: work.map((w) => {
        const a = byAlloc.get(w.id);
        return {
          id: w.id,
          title: w.title,
          estimateHours: w.estimateHours,
          estimateUnknown: w.estimateUnknown,
          status: w.status,
          commitmentKind: a?.commitmentKind ?? 'none',
          teamMemberId: a?.teamMemberId ?? null,
          teamMemberName: a?.teamMemberId ? byMember.get(a.teamMemberId) ?? null : null,
        };
      }),
    });
    const snapshotId = newId();
    await repos(rt).planning.commitmentSnapshots.save({
      id: snapshotId,
      periodStart: period.periodStart,
      payload,
      createdAt: now(rt),
    });

    const closed = {
      ...period,
      status: 'closed' as const,
      outcomeSummary: input.outcomeSummary ?? period.outcomeSummary,
      carryoverNotes: input.carryoverNotes ?? period.carryoverNotes,
      warningsAcknowledgedAt: warnings.length ? now(rt) : period.warningsAcknowledgedAt,
      closedAt: now(rt),
      updatedAt: now(rt),
    };
    await repos(rt).planning.planningPeriods.save(closed);

    let carriedForwardCount = 0;
    let nextPeriodStart: string | undefined;
    if (ids.length) {
      const settings = await repos(rt).settings.get();
      const nextStart = addDays(period.periodEnd, 1);
      const nextPeriod = fortnightContaining(nextStart, settings.fortnightStartWeekday);
      nextPeriodStart = nextPeriod.periodStart;
      let nextMeta = await repos(rt).planning.planningPeriods.get(nextPeriod.periodStart);
      if (!nextMeta) {
        nextMeta = {
          periodStart: nextPeriod.periodStart,
          periodEnd: nextPeriod.periodEnd,
          status: 'open',
          tradeoffNotes: '',
          outcomeSummary: '',
          carryoverNotes: '',
          warningsAcknowledgedAt: null,
          closedAt: null,
          updatedAt: now(rt),
        };
        await repos(rt).planning.planningPeriods.save(nextMeta);
      }

      for (const id of ids) {
        const src = work.find((w) => w.id === id)!;
        const copyId = newId();
        const status: WorkStatus =
          src.status === 'blocked' || src.status === 'waiting_external' ? src.status : 'ready';
        await repos(rt).planning.candidateWork.save({
          id: copyId,
          periodStart: nextPeriod.periodStart,
          title: src.title,
          priority: src.priority,
          estimateHours: src.estimateHours,
          estimateUnknown: src.estimateUnknown,
          actualHours: null,
          applicationId: src.applicationId,
          status,
          dependencyNotes: src.dependencyNotes,
          carriedFromWorkItemId: src.id,
          personalActionId: null,
          createdAt: now(rt),
          updatedAt: now(rt),
        });
        await repos(rt).planning.workAllocations.save({
          id: newId(),
          workItemId: copyId,
          teamMemberId: null,
          commitmentKind: 'none',
          updatedAt: now(rt),
        });
        carriedForwardCount += 1;
      }
    }

    persist(rt);
    return ok({ period: closed, snapshotId, nextPeriodStart, carriedForwardCount });
  });
}

export async function planningHistoryGet(rt: WorkspaceRuntime, periodStart: string) {
  const period = await repos(rt).planning.planningPeriods.get(periodStart);
  if (!period) return err('NOT_FOUND', 'Period not found.');
  const snapshot = await repos(rt).planning.commitmentSnapshots.getByPeriod(periodStart);
  return ok({ period, snapshot });
}
