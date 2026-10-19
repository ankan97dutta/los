import type {
  Application,
  CandidateWorkItem,
  CommitmentSnapshot,
  FortnightPlan,
  InboxItem,
  MonthlyReview,
  PeriodMemberCapacity,
  PersonalAction,
  DailyReview,
  PlanningPeriodMeta,
  TeamMember,
  WorkAllocation,
  WorkspaceSettings,
} from '@los/domain';
import { newId } from '@los/domain';

export type LosDbSnapshot = {
  version: number;
  applications: Application[];
  inbox: InboxItem[];
  actions: PersonalAction[];
  daily: DailyReview[];
  fortnights: FortnightPlan[];
  monthly: MonthlyReview[];
  settings: WorkspaceSettings;
  teamMembers: TeamMember[];
  planningPeriods: PlanningPeriodMeta[];
  periodCapacities: PeriodMemberCapacity[];
  candidateWork: CandidateWorkItem[];
  workAllocations: WorkAllocation[];
  commitmentSnapshots: CommitmentSnapshot[];
};

const SCHEMA_VERSION = 2;

export function seedApplications(nowIso: string): Application[] {
  return ([1, 2, 3, 4] as const).map((slotIndex) => ({
    id: newId(),
    slotIndex,
    name: `Application ${slotIndex}`,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}

export function defaultSettings(nowIso: string): WorkspaceSettings {
  return {
    fortnightStartWeekday: 'mon',
    globalShortcutEnabled: true,
    globalShortcutAccel: 'CommandOrControl+Shift+L',
    updatedAt: nowIso,
  };
}

export function createEmptySnapshot(nowIso: string = new Date().toISOString()): LosDbSnapshot {
  return {
    version: SCHEMA_VERSION,
    applications: seedApplications(nowIso),
    inbox: [],
    actions: [],
    daily: [],
    fortnights: [],
    monthly: [],
    settings: defaultSettings(nowIso),
    teamMembers: [],
    planningPeriods: [],
    periodCapacities: [],
    candidateWork: [],
    workAllocations: [],
    commitmentSnapshots: [],
  };
}

function normalizeSnapshot(data: LosDbSnapshot): LosDbSnapshot {
  const empty = createEmptySnapshot(data.settings?.updatedAt);
  return {
    ...empty,
    ...data,
    version: Math.max(data.version ?? 1, SCHEMA_VERSION),
    teamMembers: data.teamMembers ?? [],
    planningPeriods: data.planningPeriods ?? [],
    periodCapacities: data.periodCapacities ?? [],
    candidateWork: data.candidateWork ?? [],
    workAllocations: data.workAllocations ?? [],
    commitmentSnapshots: data.commitmentSnapshots ?? [],
  };
}

export class MemoryStore {
  public data: LosDbSnapshot;

  constructor(data: LosDbSnapshot = createEmptySnapshot()) {
    this.data = normalizeSnapshot(data);
  }

  clone(): LosDbSnapshot {
    return structuredClone(this.data);
  }

  replace(data: LosDbSnapshot): void {
    this.data = normalizeSnapshot(structuredClone(data));
  }
}
