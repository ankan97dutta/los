import { DESCRIPTION_MAX, err, ok, type Result } from './result.js';
import { isValidHours } from './capacity.js';
import { newId, validateName } from './validation.js';

export type WorkPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type WorkStatus = 'ready' | 'blocked' | 'waiting_external' | 'done' | 'dropped';
export type CommitmentKind = 'none' | 'commitment' | 'stretch';
export type PeriodStatus = 'open' | 'closed';

export type TeamMember = {
  id: string;
  displayName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PeriodMemberCapacity = {
  id: string;
  periodStart: string;
  teamMemberId: string;
  availableHours: number;
  leaveHours: number;
  reservedCommitmentHours: number;
  unplannedBufferHours: number;
  updatedAt: string;
};

export type CandidateWorkItem = {
  id: string;
  periodStart: string;
  title: string;
  priority: WorkPriority;
  estimateHours: number | null;
  estimateUnknown: boolean;
  actualHours: number | null;
  applicationId: string | null;
  status: WorkStatus;
  dependencyNotes: string;
  carriedFromWorkItemId: string | null;
  personalActionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkAllocation = {
  id: string;
  workItemId: string;
  teamMemberId: string | null;
  commitmentKind: CommitmentKind;
  updatedAt: string;
};

export type PlanningPeriodMeta = {
  periodStart: string;
  periodEnd: string;
  status: PeriodStatus;
  tradeoffNotes: string;
  outcomeSummary: string;
  carryoverNotes: string;
  warningsAcknowledgedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

export type CommitmentSnapshot = {
  id: string;
  periodStart: string;
  payload: string;
  createdAt: string;
};

export function validateDisplayName(raw: string): Result<string> {
  const name = validateName(raw);
  if (!name.ok) return name;
  if (name.data.length > 200) {
    return err('VALIDATION_ERROR', 'Display name must be at most 200 characters.');
  }
  return name;
}

export function validateWorkTitle(raw: string): Result<string> {
  const title = raw.trim();
  if (!title) return err('VALIDATION_ERROR', 'Title is required.');
  if (title.length > DESCRIPTION_MAX) {
    return err('VALIDATION_ERROR', `Title must be at most ${DESCRIPTION_MAX} characters.`);
  }
  return ok(title);
}

export function validateCapacityHours(input: {
  availableHours: number;
  leaveHours: number;
  reservedCommitmentHours: number;
  unplannedBufferHours: number;
}): Result<typeof input> {
  for (const [k, v] of Object.entries(input)) {
    if (!isValidHours(v as number)) {
      return err('VALIDATION_ERROR', `${k} must be a non-negative multiple of 0.5.`);
    }
  }
  return ok(input);
}

export function validateEstimate(input: {
  estimateHours?: number | null;
  estimateUnknown?: boolean;
}): Result<{ estimateHours: number | null; estimateUnknown: boolean }> {
  const estimateUnknown = Boolean(input.estimateUnknown);
  if (estimateUnknown) {
    if (input.estimateHours != null) {
      return err('VALIDATION_ERROR', 'Unknown estimate must not include estimate hours.');
    }
    return ok({ estimateHours: null, estimateUnknown: true });
  }
  if (input.estimateHours == null) {
    return err('VALIDATION_ERROR', 'Estimate hours required unless marked unknown.');
  }
  if (!isValidHours(input.estimateHours)) {
    return err('VALIDATION_ERROR', 'Estimate hours must be a non-negative multiple of 0.5.');
  }
  return ok({ estimateHours: input.estimateHours, estimateUnknown: false });
}

export function validateAllocation(input: {
  teamMemberId: string | null;
  commitmentKind: CommitmentKind;
}): Result<typeof input> {
  if (input.commitmentKind === 'commitment' && !input.teamMemberId) {
    return err('COMMIT_REQUIRES_ASSIGNEE', 'Commitment requires an assigned team member.');
  }
  return ok(input);
}

/** Carry-forward eligibility (U1). */
export function isCarryForwardEligible(item: {
  commitmentKind: CommitmentKind;
  status: WorkStatus;
}): boolean {
  return item.commitmentKind === 'commitment' && item.status !== 'done' && item.status !== 'dropped';
}

export function createTeamMember(displayName: string, nowIso: string, id?: string): Result<TeamMember> {
  const name = validateDisplayName(displayName);
  if (!name.ok) return name;
  return ok({
    id: id ?? newId(),
    displayName: name.data,
    active: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}
