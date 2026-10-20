import type {
  CandidateWorkItem,
  CommitmentSnapshot,
  PeriodMemberCapacity,
  PlanningPeriodMeta,
  TeamMember,
  WorkAllocation,
} from '@los/domain';
import type { MemoryStore } from './memory_store.js';
import type { PlanningRepos } from './planning_repos.js';

export function createMemoryPlanningRepos(store: MemoryStore): PlanningRepos {
  return {
    teamMembers: {
      async list() {
        return [...store.data.teamMembers].sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        );
      },
      async getById(id) {
        return store.data.teamMembers.find((m) => m.id === id) ?? null;
      },
      async save(member: TeamMember) {
        const idx = store.data.teamMembers.findIndex((m) => m.id === member.id);
        if (idx >= 0) store.data.teamMembers[idx] = member;
        else store.data.teamMembers.push(member);
      },
      async remove(id: string) {
        store.data.teamMembers = store.data.teamMembers.filter((m) => m.id !== id);
      },
    },
    planningPeriods: {
      async get(periodStart) {
        return store.data.planningPeriods.find((p) => p.periodStart === periodStart) ?? null;
      },
      async listBetween(startDate: string, endDate: string) {
        return store.data.planningPeriods.filter((p) => p.periodStart <= endDate && p.periodEnd >= startDate);
      },
      async save(period: PlanningPeriodMeta) {
        const idx = store.data.planningPeriods.findIndex((p) => p.periodStart === period.periodStart);
        if (idx >= 0) store.data.planningPeriods[idx] = period;
        else store.data.planningPeriods.push(period);
      },
    },
    periodCapacity: {
      async listByPeriod(periodStart) {
        return store.data.periodCapacities.filter((c) => c.periodStart === periodStart);
      },
      async get(periodStart, teamMemberId) {
        return (
          store.data.periodCapacities.find(
            (c) => c.periodStart === periodStart && c.teamMemberId === teamMemberId,
          ) ?? null
        );
      },
      async save(row: PeriodMemberCapacity) {
        const idx = store.data.periodCapacities.findIndex(
          (c) => c.periodStart === row.periodStart && c.teamMemberId === row.teamMemberId,
        );
        if (idx >= 0) store.data.periodCapacities[idx] = row;
        else store.data.periodCapacities.push(row);
      },
      async removeByMember(teamMemberId: string) {
        store.data.periodCapacities = store.data.periodCapacities.filter(
          (c) => c.teamMemberId !== teamMemberId,
        );
      },
    },
    candidateWork: {
      async listByPeriod(periodStart) {
        return store.data.candidateWork
          .filter((w) => w.periodStart === periodStart)
          .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      },
      async listByApplication(applicationId: string) {
        return store.data.candidateWork.filter((w) => w.applicationId === applicationId);
      },
      async getById(id) {
        return store.data.candidateWork.find((w) => w.id === id) ?? null;
      },
      async save(item: CandidateWorkItem) {
        const idx = store.data.candidateWork.findIndex((w) => w.id === item.id);
        if (idx >= 0) store.data.candidateWork[idx] = item;
        else store.data.candidateWork.push(item);
      },
    },
    workAllocations: {
      async getByWorkItemId(workItemId) {
        return store.data.workAllocations.find((a) => a.workItemId === workItemId) ?? null;
      },
      async listByPeriodWorkIds(workItemIds) {
        const set = new Set(workItemIds);
        return store.data.workAllocations.filter((a) => set.has(a.workItemId));
      },
      async listByMember(teamMemberId: string) {
        return store.data.workAllocations.filter((a) => a.teamMemberId === teamMemberId);
      },
      async save(allocation: WorkAllocation) {
        const idx = store.data.workAllocations.findIndex((a) => a.workItemId === allocation.workItemId);
        if (idx >= 0) store.data.workAllocations[idx] = allocation;
        else store.data.workAllocations.push(allocation);
      },
    },
    commitmentSnapshots: {
      async getByPeriod(periodStart) {
        return store.data.commitmentSnapshots.find((s) => s.periodStart === periodStart) ?? null;
      },
      async save(snapshot: CommitmentSnapshot) {
        const idx = store.data.commitmentSnapshots.findIndex(
          (s) => s.periodStart === snapshot.periodStart,
        );
        if (idx >= 0) store.data.commitmentSnapshots[idx] = snapshot;
        else store.data.commitmentSnapshots.push(snapshot);
      },
    },
  };
}
