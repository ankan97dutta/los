import type {
  Application,
  FortnightPlan,
  InboxItem,
  MonthlyReview,
  PersonalAction,
  DailyReview,
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
};

const SCHEMA_VERSION = 1;

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
  };
}

export class MemoryStore {
  constructor(public data: LosDbSnapshot = createEmptySnapshot()) {}

  clone(): LosDbSnapshot {
    return structuredClone(this.data);
  }

  replace(data: LosDbSnapshot): void {
    this.data = structuredClone(data);
  }
}
