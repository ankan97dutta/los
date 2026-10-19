import type {
  CandidateWorkItem,
  CandidateWorkRepository,
  CommitmentSnapshot,
  CommitmentSnapshotRepository,
  PeriodCapacityRepository,
  PeriodMemberCapacity,
  PlanningPeriodMeta,
  PlanningPeriodsRepository,
  TeamMember,
  TeamMembersRepository,
  WorkAllocation,
  WorkAllocationRepository,
  WorkPriority,
  WorkStatus,
  CommitmentKind,
  PeriodStatus,
} from '@los/domain';
import type { DbSession } from './ports.js';

export type PlanningRepos = {
  teamMembers: TeamMembersRepository;
  planningPeriods: PlanningPeriodsRepository;
  periodCapacity: PeriodCapacityRepository;
  candidateWork: CandidateWorkRepository;
  workAllocations: WorkAllocationRepository;
  commitmentSnapshots: CommitmentSnapshotRepository;
};

export function createPlanningRepos(db: DbSession): PlanningRepos {
  return {
    teamMembers: {
      async list() {
        const rows = await db.query<{
          id: string;
          display_name: string;
          active: number;
          created_at: string;
          updated_at: string;
        }>(`SELECT id, display_name, active, created_at, updated_at FROM team_members ORDER BY display_name`);
        return rows.map((r) => ({
          id: r.id,
          displayName: r.display_name,
          active: Boolean(r.active),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      },
      async getById(id) {
        const rows = await db.query<{
          id: string;
          display_name: string;
          active: number;
          created_at: string;
          updated_at: string;
        }>(`SELECT id, display_name, active, created_at, updated_at FROM team_members WHERE id = ?`, [
          id,
        ]);
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          displayName: r.display_name,
          active: Boolean(r.active),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      },
      async save(member: TeamMember) {
        await db.exec(
          `INSERT INTO team_members (id, display_name, active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             display_name = excluded.display_name,
             active = excluded.active,
             updated_at = excluded.updated_at`,
          [
            member.id,
            member.displayName,
            member.active ? 1 : 0,
            member.createdAt,
            member.updatedAt,
          ],
        );
      },
    },
    planningPeriods: {
      async get(periodStart) {
        const rows = await db.query<{
          period_start: string;
          period_end: string;
          status: PeriodStatus;
          tradeoff_notes: string;
          outcome_summary: string;
          carryover_notes: string;
          warnings_acknowledged_at: string | null;
          closed_at: string | null;
          updated_at: string;
        }>(
          `SELECT period_start, period_end, status, tradeoff_notes, outcome_summary, carryover_notes,
                  warnings_acknowledged_at, closed_at, updated_at
           FROM planning_periods WHERE period_start = ?`,
          [periodStart],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          periodStart: r.period_start,
          periodEnd: r.period_end,
          status: r.status,
          tradeoffNotes: r.tradeoff_notes,
          outcomeSummary: r.outcome_summary,
          carryoverNotes: r.carryover_notes,
          warningsAcknowledgedAt: r.warnings_acknowledged_at,
          closedAt: r.closed_at,
          updatedAt: r.updated_at,
        };
      },
      async save(period: PlanningPeriodMeta) {
        await db.exec(
          `INSERT INTO planning_periods (
             period_start, period_end, status, tradeoff_notes, outcome_summary, carryover_notes,
             warnings_acknowledged_at, closed_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(period_start) DO UPDATE SET
             period_end = excluded.period_end,
             status = excluded.status,
             tradeoff_notes = excluded.tradeoff_notes,
             outcome_summary = excluded.outcome_summary,
             carryover_notes = excluded.carryover_notes,
             warnings_acknowledged_at = excluded.warnings_acknowledged_at,
             closed_at = excluded.closed_at,
             updated_at = excluded.updated_at`,
          [
            period.periodStart,
            period.periodEnd,
            period.status,
            period.tradeoffNotes,
            period.outcomeSummary,
            period.carryoverNotes,
            period.warningsAcknowledgedAt,
            period.closedAt,
            period.updatedAt,
          ],
        );
      },
    },
    periodCapacity: {
      async listByPeriod(periodStart) {
        const rows = await db.query<{
          id: string;
          period_start: string;
          team_member_id: string;
          available_hours: number;
          leave_hours: number;
          reserved_commitment_hours: number;
          unplanned_buffer_hours: number;
          updated_at: string;
        }>(
          `SELECT id, period_start, team_member_id, available_hours, leave_hours,
                  reserved_commitment_hours, unplanned_buffer_hours, updated_at
           FROM period_member_capacity WHERE period_start = ?`,
          [periodStart],
        );
        return rows.map((r) => ({
          id: r.id,
          periodStart: r.period_start,
          teamMemberId: r.team_member_id,
          availableHours: r.available_hours,
          leaveHours: r.leave_hours,
          reservedCommitmentHours: r.reserved_commitment_hours,
          unplannedBufferHours: r.unplanned_buffer_hours,
          updatedAt: r.updated_at,
        }));
      },
      async get(periodStart, teamMemberId) {
        const rows = await db.query<{
          id: string;
          period_start: string;
          team_member_id: string;
          available_hours: number;
          leave_hours: number;
          reserved_commitment_hours: number;
          unplanned_buffer_hours: number;
          updated_at: string;
        }>(
          `SELECT id, period_start, team_member_id, available_hours, leave_hours,
                  reserved_commitment_hours, unplanned_buffer_hours, updated_at
           FROM period_member_capacity WHERE period_start = ? AND team_member_id = ?`,
          [periodStart, teamMemberId],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          periodStart: r.period_start,
          teamMemberId: r.team_member_id,
          availableHours: r.available_hours,
          leaveHours: r.leave_hours,
          reservedCommitmentHours: r.reserved_commitment_hours,
          unplannedBufferHours: r.unplanned_buffer_hours,
          updatedAt: r.updated_at,
        };
      },
      async save(row: PeriodMemberCapacity) {
        await db.exec(
          `INSERT INTO period_member_capacity (
             id, period_start, team_member_id, available_hours, leave_hours,
             reserved_commitment_hours, unplanned_buffer_hours, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(period_start, team_member_id) DO UPDATE SET
             available_hours = excluded.available_hours,
             leave_hours = excluded.leave_hours,
             reserved_commitment_hours = excluded.reserved_commitment_hours,
             unplanned_buffer_hours = excluded.unplanned_buffer_hours,
             updated_at = excluded.updated_at`,
          [
            row.id,
            row.periodStart,
            row.teamMemberId,
            row.availableHours,
            row.leaveHours,
            row.reservedCommitmentHours,
            row.unplannedBufferHours,
            row.updatedAt,
          ],
        );
      },
    },
    candidateWork: {
      async listByPeriod(periodStart) {
        const rows = await db.query<{
          id: string;
          period_start: string;
          title: string;
          priority: WorkPriority;
          estimate_hours: number | null;
          estimate_unknown: number;
          actual_hours: number | null;
          application_id: string | null;
          status: WorkStatus;
          dependency_notes: string;
          carried_from_work_item_id: string | null;
          personal_action_id: string | null;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, period_start, title, priority, estimate_hours, estimate_unknown, actual_hours,
                  application_id, status, dependency_notes, carried_from_work_item_id,
                  personal_action_id, created_at, updated_at
           FROM candidate_work_items WHERE period_start = ? ORDER BY created_at`,
          [periodStart],
        );
        return rows.map(mapWork);
      },
      async getById(id) {
        const rows = await db.query<{
          id: string;
          period_start: string;
          title: string;
          priority: WorkPriority;
          estimate_hours: number | null;
          estimate_unknown: number;
          actual_hours: number | null;
          application_id: string | null;
          status: WorkStatus;
          dependency_notes: string;
          carried_from_work_item_id: string | null;
          personal_action_id: string | null;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, period_start, title, priority, estimate_hours, estimate_unknown, actual_hours,
                  application_id, status, dependency_notes, carried_from_work_item_id,
                  personal_action_id, created_at, updated_at
           FROM candidate_work_items WHERE id = ?`,
          [id],
        );
        const r = rows[0];
        return r ? mapWork(r) : null;
      },
      async save(item: CandidateWorkItem) {
        await db.exec(
          `INSERT INTO candidate_work_items (
             id, period_start, title, priority, estimate_hours, estimate_unknown, actual_hours,
             application_id, status, dependency_notes, carried_from_work_item_id,
             personal_action_id, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             priority = excluded.priority,
             estimate_hours = excluded.estimate_hours,
             estimate_unknown = excluded.estimate_unknown,
             actual_hours = excluded.actual_hours,
             application_id = excluded.application_id,
             status = excluded.status,
             dependency_notes = excluded.dependency_notes,
             carried_from_work_item_id = excluded.carried_from_work_item_id,
             personal_action_id = excluded.personal_action_id,
             updated_at = excluded.updated_at`,
          [
            item.id,
            item.periodStart,
            item.title,
            item.priority,
            item.estimateHours,
            item.estimateUnknown ? 1 : 0,
            item.actualHours,
            item.applicationId,
            item.status,
            item.dependencyNotes,
            item.carriedFromWorkItemId,
            item.personalActionId,
            item.createdAt,
            item.updatedAt,
          ],
        );
      },
    },
    workAllocations: {
      async getByWorkItemId(workItemId) {
        const rows = await db.query<{
          id: string;
          work_item_id: string;
          team_member_id: string | null;
          commitment_kind: CommitmentKind;
          updated_at: string;
        }>(
          `SELECT id, work_item_id, team_member_id, commitment_kind, updated_at
           FROM work_allocations WHERE work_item_id = ?`,
          [workItemId],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          workItemId: r.work_item_id,
          teamMemberId: r.team_member_id,
          commitmentKind: r.commitment_kind,
          updatedAt: r.updated_at,
        };
      },
      async listByPeriodWorkIds(workItemIds) {
        if (!workItemIds.length) return [];
        const placeholders = workItemIds.map(() => '?').join(',');
        const rows = await db.query<{
          id: string;
          work_item_id: string;
          team_member_id: string | null;
          commitment_kind: CommitmentKind;
          updated_at: string;
        }>(
          `SELECT id, work_item_id, team_member_id, commitment_kind, updated_at
           FROM work_allocations WHERE work_item_id IN (${placeholders})`,
          workItemIds,
        );
        return rows.map((r) => ({
          id: r.id,
          workItemId: r.work_item_id,
          teamMemberId: r.team_member_id,
          commitmentKind: r.commitment_kind,
          updatedAt: r.updated_at,
        }));
      },
      async save(allocation: WorkAllocation) {
        await db.exec(
          `INSERT INTO work_allocations (id, work_item_id, team_member_id, commitment_kind, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(work_item_id) DO UPDATE SET
             team_member_id = excluded.team_member_id,
             commitment_kind = excluded.commitment_kind,
             updated_at = excluded.updated_at`,
          [
            allocation.id,
            allocation.workItemId,
            allocation.teamMemberId,
            allocation.commitmentKind,
            allocation.updatedAt,
          ],
        );
      },
    },
    commitmentSnapshots: {
      async getByPeriod(periodStart) {
        const rows = await db.query<{
          id: string;
          period_start: string;
          payload: string;
          created_at: string;
        }>(
          `SELECT id, period_start, payload, created_at FROM commitment_snapshots WHERE period_start = ?`,
          [periodStart],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          periodStart: r.period_start,
          payload: r.payload,
          createdAt: r.created_at,
        };
      },
      async save(snapshot: CommitmentSnapshot) {
        await db.exec(
          `INSERT INTO commitment_snapshots (id, period_start, payload, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(period_start) DO UPDATE SET
             payload = excluded.payload,
             created_at = excluded.created_at`,
          [snapshot.id, snapshot.periodStart, snapshot.payload, snapshot.createdAt],
        );
      },
    },
  };
}

function mapWork(r: {
  id: string;
  period_start: string;
  title: string;
  priority: WorkPriority;
  estimate_hours: number | null;
  estimate_unknown: number;
  actual_hours: number | null;
  application_id: string | null;
  status: WorkStatus;
  dependency_notes: string;
  carried_from_work_item_id: string | null;
  personal_action_id: string | null;
  created_at: string;
  updated_at: string;
}): CandidateWorkItem {
  return {
    id: r.id,
    periodStart: r.period_start,
    title: r.title,
    priority: r.priority,
    estimateHours: r.estimate_hours,
    estimateUnknown: Boolean(r.estimate_unknown),
    actualHours: r.actual_hours,
    applicationId: r.application_id,
    status: r.status,
    dependencyNotes: r.dependency_notes,
    carriedFromWorkItemId: r.carried_from_work_item_id,
    personalActionId: r.personal_action_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
