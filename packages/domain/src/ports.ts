import type { PersonalAction } from './actions.js';
import type { InboxItem } from './inbox.js';
import type { DailyNextActionLine, DailyReview } from './daily.js';
import type { Weekday } from './periods/fortnight.js';
import type {
  CandidateWorkItem,
  CommitmentSnapshot,
  PeriodMemberCapacity,
  PlanningPeriodMeta,
  TeamMember,
  WorkAllocation,
} from './planning.js';
import type { FocusSession } from './focus.js';
import type { ReportDraft, ReportSection, ReportType } from './reports.js';

export type Application = {
  id: string;
  /** User-facing name for this entity is "Thread" (renamed from Application). */
  slotIndex: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FortnightPlan = {
  id: string;
  periodStart: string;
  periodEnd: string;
  commitments: string;
  selectedActionIds: string[];
  updatedAt: string;
};

export type MonthlyReview = {
  id: string;
  yearMonth: string;
  improvementPriorities: string;
  updatedAt: string;
};

export type WorkspaceSettings = {
  fortnightStartWeekday: Weekday;
  globalShortcutEnabled: boolean;
  globalShortcutAccel: string;
  focusTechnique?: string;
  focusCustomFocusMinutes?: number;
  focusCustomBreakMinutes?: number;
  focusLongBreakMinutes?: number;
  focusSoundEnabled?: boolean;
  focusNotificationsEnabled?: boolean;
  focusNotificationsIncludeTask?: boolean;
  updatedAt: string;
};

export interface InboxRepository {
  listOpen(): Promise<InboxItem[]>;
  listKept(): Promise<InboxItem[]>;
  getById(id: string): Promise<InboxItem | null>;
  save(item: InboxItem): Promise<void>;
}

export interface ActionsRepository {
  list(filter?: { status?: 'open' | 'done' | 'all'; applicationId?: string | null }): Promise<
    PersonalAction[]
  >;
  getById(id: string): Promise<PersonalAction | null>;
  save(action: PersonalAction): Promise<void>;
}

export interface ApplicationsRepository {
  list(): Promise<Application[]>;
  getById(id: string): Promise<Application | null>;
  save(app: Application): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface DailyRepository {
  getByDate(date: string): Promise<DailyReview | null>;
  /** Inclusive at both ends. */
  listBetween(startDate: string, endDate: string): Promise<DailyReview[]>;
  save(review: DailyReview): Promise<void>;
}

export interface FortnightRepository {
  getByPeriodStart(periodStart: string): Promise<FortnightPlan | null>;
  save(plan: FortnightPlan): Promise<void>;
}

export interface MonthlyRepository {
  getByYearMonth(yearMonth: string): Promise<MonthlyReview | null>;
  save(review: MonthlyReview): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<WorkspaceSettings>;
  save(settings: WorkspaceSettings): Promise<void>;
}

export interface TeamMembersRepository {
  list(): Promise<TeamMember[]>;
  getById(id: string): Promise<TeamMember | null>;
  save(member: TeamMember): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface PlanningPeriodsRepository {
  get(periodStart: string): Promise<PlanningPeriodMeta | null>;
  /** Inclusive ranges. A period qualifies when it overlaps the range. */
  listBetween(startDate: string, endDate: string): Promise<PlanningPeriodMeta[]>;
  save(period: PlanningPeriodMeta): Promise<void>;
}

export interface FocusRepository {
  save(session: FocusSession): Promise<void>;
  getById(id: string): Promise<FocusSession | null>;
  listActive(): Promise<FocusSession[]>;
  /** Inclusive at both ends, by finishedLocalDate. */
  listByFinishedDateRange(startDate: string, endDate: string): Promise<FocusSession[]>;
  listAll(): Promise<FocusSession[]>;
}

export interface ReportsRepository {
  saveDraft(draft: ReportDraft, sections: ReportSection[]): Promise<void>;
  getDraft(reportType: ReportType, periodStart: string): Promise<{ draft: ReportDraft; sections: ReportSection[] } | null>;
  getDraftById(id: string): Promise<{ draft: ReportDraft; sections: ReportSection[] } | null>;
  listDrafts(): Promise<ReportDraft[]>;
}

export interface PeriodCapacityRepository {
  listByPeriod(periodStart: string): Promise<PeriodMemberCapacity[]>;
  get(periodStart: string, teamMemberId: string): Promise<PeriodMemberCapacity | null>;
  save(row: PeriodMemberCapacity): Promise<void>;
  removeByMember(teamMemberId: string): Promise<void>;
}

export interface CandidateWorkRepository {
  listByPeriod(periodStart: string): Promise<CandidateWorkItem[]>;
  listByApplication(applicationId: string): Promise<CandidateWorkItem[]>;
  getById(id: string): Promise<CandidateWorkItem | null>;
  save(item: CandidateWorkItem): Promise<void>;
}

export interface WorkAllocationRepository {
  getByWorkItemId(workItemId: string): Promise<WorkAllocation | null>;
  listByPeriodWorkIds(workItemIds: string[]): Promise<WorkAllocation[]>;
  listByMember(teamMemberId: string): Promise<WorkAllocation[]>;
  save(allocation: WorkAllocation): Promise<void>;
}

export interface CommitmentSnapshotRepository {
  getByPeriod(periodStart: string): Promise<CommitmentSnapshot | null>;
  save(snapshot: CommitmentSnapshot): Promise<void>;
}

export type { DailyNextActionLine, DailyReview };
