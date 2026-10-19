import type {
  ActionsRepository,
  ApplicationsRepository,
  DailyRepository,
  FortnightRepository,
  InboxRepository,
  MonthlyRepository,
  SettingsRepository,
  InboxItem,
  PersonalAction,
  Application,
  DailyReview,
  FortnightPlan,
  MonthlyReview,
  WorkspaceSettings,
} from '@los/domain';
import type { MemoryStore } from './memory_store.js';

export function createRepos(store: MemoryStore): {
  inbox: InboxRepository;
  actions: ActionsRepository;
  applications: ApplicationsRepository;
  daily: DailyRepository;
  fortnight: FortnightRepository;
  monthly: MonthlyRepository;
  settings: SettingsRepository;
} {
  return {
    inbox: {
      async listOpen() {
        return store.data.inbox
          .filter((i) => i.status === 'open')
          .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
      },
      async getById(id) {
        return store.data.inbox.find((i) => i.id === id) ?? null;
      },
      async save(item: InboxItem) {
        const idx = store.data.inbox.findIndex((i) => i.id === item.id);
        if (idx >= 0) store.data.inbox[idx] = item;
        else store.data.inbox.push(item);
      },
    },
    actions: {
      async list(filter) {
        let list = [...store.data.actions];
        if (filter?.status && filter.status !== 'all') {
          list = list.filter((a) => a.status === filter.status);
        }
        if (filter && 'applicationId' in (filter as object)) {
          list = list.filter((a) => a.applicationId === filter!.applicationId);
        }
        return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      },
      async getById(id) {
        return store.data.actions.find((a) => a.id === id) ?? null;
      },
      async save(action: PersonalAction) {
        const idx = store.data.actions.findIndex((a) => a.id === action.id);
        if (idx >= 0) store.data.actions[idx] = action;
        else store.data.actions.push(action);
      },
    },
    applications: {
      async list() {
        return [...store.data.applications].sort((a, b) => a.slotIndex - b.slotIndex);
      },
      async getById(id) {
        return store.data.applications.find((a) => a.id === id) ?? null;
      },
      async save(app: Application) {
        const idx = store.data.applications.findIndex((a) => a.id === app.id);
        if (idx >= 0) store.data.applications[idx] = app;
      },
    },
    daily: {
      async getByDate(date) {
        return store.data.daily.find((d) => d.date === date) ?? null;
      },
      async save(review: DailyReview) {
        const idx = store.data.daily.findIndex((d) => d.date === review.date);
        if (idx >= 0) store.data.daily[idx] = review;
        else store.data.daily.push(review);
      },
    },
    fortnight: {
      async getByPeriodStart(periodStart) {
        return store.data.fortnights.find((f) => f.periodStart === periodStart) ?? null;
      },
      async save(plan: FortnightPlan) {
        const idx = store.data.fortnights.findIndex((f) => f.periodStart === plan.periodStart);
        if (idx >= 0) store.data.fortnights[idx] = plan;
        else store.data.fortnights.push(plan);
      },
    },
    monthly: {
      async getByYearMonth(yearMonth) {
        return store.data.monthly.find((m) => m.yearMonth === yearMonth) ?? null;
      },
      async save(review: MonthlyReview) {
        const idx = store.data.monthly.findIndex((m) => m.yearMonth === review.yearMonth);
        if (idx >= 0) store.data.monthly[idx] = review;
        else store.data.monthly.push(review);
      },
    },
    settings: {
      async get() {
        return store.data.settings;
      },
      async save(settings: WorkspaceSettings) {
        store.data.settings = settings;
      },
    },
  };
}
