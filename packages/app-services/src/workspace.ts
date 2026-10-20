import {
  applyTriage,
  createInboxItem,
  createPersonalAction,
  ensureLineIds,
  err,
  fortnightContaining,
  isValidLocalDate,
  isValidYearMonth,
  isWeekday,
  localToday,
  materializeNextActions,
  monthContaining,
  newId,
  nextFortnight,
  nextWeek,
  previousWeek,
  ok,
  previousFortnight,
  setActionStatus,
  updateActionDescription,
  validateName,
  type Weekday,
} from '@los/domain';
import {
  createEmptySnapshot,
  createRepos,
  MemoryStore,
  type WorkspaceRepos,
} from '@los/persistence';

export type WorkspaceRuntime = {
  /** Vite preview / tests — in-memory JSON shape */
  store?: MemoryStore;
  /** Durable SQLite repos (Tauri / Node) */
  sqliteRepos?: WorkspaceRepos;
  /** Required for FR-H03; MemoryStore path may pass through */
  withTransaction?: <T>(fn: () => Promise<T>) => Promise<T>;
  persist?: () => void | Promise<void>;
  now?: () => Date;
  dbPath?: string;
  dbReady?: boolean;
  trayAvailable?: boolean;
  globalShortcutAvailable?: boolean;
  globalShortcutRegistered?: boolean;
  globalShortcutError?: string;
  /** Close durable DbSession before in-app file replace restore */
  closeDb?: () => Promise<void>;
  /** Wipe all user data and reseed defaults (Settings → Reset). */
  resetAll?: () => Promise<void>;
};

function repos(rt: WorkspaceRuntime): WorkspaceRepos {
  if (rt.sqliteRepos) return rt.sqliteRepos;
  if (!rt.store) throw new Error('WorkspaceRuntime requires store or sqliteRepos');
  return createRepos(rt.store);
}

async function runTx<T>(rt: WorkspaceRuntime, fn: () => Promise<T>): Promise<T> {
  if (rt.withTransaction) return rt.withTransaction(fn);
  return fn();
}

function nowIso(rt: WorkspaceRuntime): string {
  return (rt.now?.() ?? new Date()).toISOString();
}

function afterWrite(rt: WorkspaceRuntime): void {
  void rt.persist?.();
}

function addDaysSafe(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

export async function inboxCapture(rt: WorkspaceRuntime, description: string) {
  const item = createInboxItem(description, nowIso(rt));
  if (!item.ok) return item;
  await repos(rt).inbox.save(item.data);
  afterWrite(rt);
  return ok({ item: item.data });
}

export async function inboxListOpen(rt: WorkspaceRuntime) {
  return ok({ items: await repos(rt).inbox.listOpen() });
}

export async function inboxListKept(rt: WorkspaceRuntime) {
  return ok({ items: await repos(rt).inbox.listKept() });
}

export async function inboxTriage(
  rt: WorkspaceRuntime,
  id: string,
  disposition: 'convert' | 'dismiss' | 'keep' | 'reopen',
) {
  const r = repos(rt);
  const item = await r.inbox.getById(id);
  if (!item) return err('NOT_FOUND', 'Inbox item not found.');
  if (disposition === 'convert') {
    const action = createPersonalAction({
      description: item.description,
      source: 'inbox',
      sourceRef: item.id,
      nowIso: nowIso(rt),
    });
    if (!action.ok) return action;
    await r.actions.save(action.data);
    const triaged = applyTriage(item, 'convert', nowIso(rt), action.data.id);
    if (!triaged.ok) return triaged;
    await r.inbox.save(triaged.data);
    afterWrite(rt);
    return ok({ item: triaged.data, action: action.data });
  }
  const triaged = applyTriage(item, disposition, nowIso(rt));
  if (!triaged.ok) return triaged;
  await r.inbox.save(triaged.data);
  afterWrite(rt);
  return ok({ item: triaged.data });
}

export async function actionsCreate(
  rt: WorkspaceRuntime,
  description: string,
  applicationId?: string | null,
) {
  const r = repos(rt);
  if (applicationId) {
    const app = await r.applications.getById(applicationId);
    if (!app) return err('APPLICATION_NOT_FOUND', 'Application not found.');
  }
  const action = createPersonalAction({
    description,
    applicationId,
    source: 'manual',
    nowIso: nowIso(rt),
  });
  if (!action.ok) return action;
  await r.actions.save(action.data);
  afterWrite(rt);
  return ok({ action: action.data });
}

export async function actionsUpdate(
  rt: WorkspaceRuntime,
  id: string,
  patch: { description?: string; applicationId?: string | null },
) {
  const r = repos(rt);
  const existing = await r.actions.getById(id);
  if (!existing) return err('NOT_FOUND', 'Action not found.');
  let next = existing;
  if (patch.description !== undefined) {
    const updated = updateActionDescription(existing, patch.description, nowIso(rt));
    if (!updated.ok) return updated;
    next = updated.data;
  }
  if ('applicationId' in patch) {
    if (patch.applicationId) {
      const app = await r.applications.getById(patch.applicationId);
      if (!app) return err('APPLICATION_NOT_FOUND', 'Application not found.');
    }
    next = { ...next, applicationId: patch.applicationId ?? null, updatedAt: nowIso(rt) };
  }
  await r.actions.save(next);
  afterWrite(rt);
  return ok({ action: next });
}

export async function actionsSetStatus(rt: WorkspaceRuntime, id: string, status: 'open' | 'done') {
  const r = repos(rt);
  const existing = await r.actions.getById(id);
  if (!existing) return err('NOT_FOUND', 'Action not found.');
  const next = setActionStatus(existing, status, nowIso(rt));
  await r.actions.save(next);
  afterWrite(rt);
  return ok({ action: next });
}

export async function actionsList(
  rt: WorkspaceRuntime,
  filter?: { status?: 'open' | 'done' | 'all'; applicationId?: string | null },
) {
  return ok({ actions: await repos(rt).actions.list(filter) });
}

export async function applicationsList(rt: WorkspaceRuntime) {
  return ok({ applications: await repos(rt).applications.list() });
}

export async function applicationsCreate(rt: WorkspaceRuntime, name: string) {
  const r = repos(rt);
  const v = validateName(name);
  if (!v.ok) return v;
  const existing = await r.applications.list();
  const slotIndex = existing.reduce((m, a) => Math.max(m, a.slotIndex), 0) + 1;
  const now = nowIso(rt);
  const app = { id: newId(), slotIndex, name: v.data, createdAt: now, updatedAt: now };
  await r.applications.save(app);
  afterWrite(rt);
  return ok({ application: app });
}

export async function applicationsRemove(rt: WorkspaceRuntime, id: string) {
  const r = repos(rt);
  const app = await r.applications.getById(id);
  if (!app) return err('NOT_FOUND', 'Thread not found.');
  const actions = await r.actions.list({ status: 'all', applicationId: id });
  if (actions.length > 0) {
    return err('VALIDATION_ERROR', `Thread is linked to ${actions.length} personal action(s). Unlink them first, or rename the thread instead.`);
  }
  const work = await r.planning.candidateWork.listByApplication(id);
  if (work.length > 0) {
    return err('VALIDATION_ERROR', `Thread is linked to ${work.length} planning work item(s). Reassign them in Planning first, or rename the thread instead.`);
  }
  await r.applications.remove(id);
  afterWrite(rt);
  return ok({ removedId: id });
}

export async function applicationsRename(rt: WorkspaceRuntime, id: string, name: string) {
  const r = repos(rt);
  const app = await r.applications.getById(id);
  if (!app) return err('NOT_FOUND', 'Application not found.');
  const v = validateName(name);
  if (!v.ok) return v;
  const next = { ...app, name: v.data, updatedAt: nowIso(rt) };
  await r.applications.save(next);
  afterWrite(rt);
  return ok({ application: next });
}

export async function dailyGet(rt: WorkspaceRuntime, date: string) {
  if (!isValidLocalDate(date)) return err('INVALID_DATE', 'Invalid date.');
  return ok({ review: await repos(rt).daily.getByDate(date) });
}

export async function dailyUpsert(
  rt: WorkspaceRuntime,
  input: {
    date: string;
    outcomes?: string;
    blockers?: string;
    followUps?: string;
    nextActionLines?: Array<{
      id: string;
      sortOrder: number;
      text: string;
      personalActionId?: string;
    }>;
  },
) {
  if (!isValidLocalDate(input.date)) return err('INVALID_DATE', 'Invalid date.');
  return runTx(rt, async () => {
    const r = repos(rt);
    const existing = await r.daily.getByDate(input.date);
    const lines = ensureLineIds(input.nextActionLines ?? existing?.nextActionLines ?? []);
    const actions = await r.actions.list({ status: 'all' });
    const map = new Map(actions.map((a) => [a.id, a]));
    const material = materializeNextActions(lines, map, nowIso(rt));
    if (!material.ok) return material;
    for (const a of material.data.createdActions) await r.actions.save(a);
    for (const a of material.data.updatedActions) await r.actions.save(a);

    const review = {
      id: existing?.id ?? newId(),
      date: input.date,
      outcomes: input.outcomes ?? existing?.outcomes ?? '',
      blockers: input.blockers ?? existing?.blockers ?? '',
      followUps: input.followUps ?? existing?.followUps ?? '',
      nextActionLines: material.data.lines,
      updatedAt: nowIso(rt),
    };
    await r.daily.save(review);
    afterWrite(rt);
    return ok({
      review,
      createdActionIds: material.data.createdActions.map((a) => a.id),
    });
  });
}

export async function fortnightCurrentPeriod(rt: WorkspaceRuntime, asOf?: string) {
  const settings = await repos(rt).settings.get();
  const date = asOf && isValidLocalDate(asOf) ? asOf : localToday(rt.now?.() ?? new Date());
  const period = fortnightContaining(date, settings.fortnightStartWeekday);
  return ok({ ...period, startWeekday: settings.fortnightStartWeekday });
}

export async function fortnightGet(rt: WorkspaceRuntime, periodStart?: string) {
  const settings = await repos(rt).settings.get();
  const canonical =
    periodStart && isValidLocalDate(periodStart)
      ? (() => {
          const containing = fortnightContaining(periodStart, settings.fortnightStartWeekday);
          if (containing.periodStart === periodStart) return containing;
          return { periodStart, periodEnd: addDaysSafe(periodStart, 13) };
        })()
      : fortnightContaining(localToday(rt.now?.() ?? new Date()), settings.fortnightStartWeekday);

  const plan = await repos(rt).fortnight.getByPeriodStart(canonical.periodStart);
  return ok({
    plan: plan ?? {
      id: '',
      periodStart: canonical.periodStart,
      periodEnd: canonical.periodEnd,
      commitments: '',
      selectedActionIds: [],
      updatedAt: '',
    },
    period: { start: canonical.periodStart, end: canonical.periodEnd },
  });
}

export async function fortnightUpsert(
  rt: WorkspaceRuntime,
  input: { periodStart: string; commitments?: string; selectedActionIds?: string[] },
) {
  if (!isValidLocalDate(input.periodStart)) return err('INVALID_PERIOD', 'Invalid period.');
  const settings = await repos(rt).settings.get();
  const period = fortnightContaining(input.periodStart, settings.fortnightStartWeekday);
  const periodStart =
    period.periodStart === input.periodStart ? period.periodStart : input.periodStart;
  const periodEnd =
    period.periodStart === input.periodStart ? period.periodEnd : addDaysSafe(input.periodStart, 13);

  const r = repos(rt);
  if (input.selectedActionIds) {
    for (const id of input.selectedActionIds) {
      const a = await r.actions.getById(id);
      if (!a) return err('ACTION_NOT_FOUND', `Action not found: ${id}`);
    }
  }
  const existing = await r.fortnight.getByPeriodStart(periodStart);
  const plan = {
    id: existing?.id ?? newId(),
    periodStart,
    periodEnd,
    commitments: input.commitments ?? existing?.commitments ?? '',
    selectedActionIds: input.selectedActionIds ?? existing?.selectedActionIds ?? [],
    updatedAt: nowIso(rt),
  };
  await r.fortnight.save(plan);
  afterWrite(rt);
  return ok({ plan });
}

export async function monthlyGet(rt: WorkspaceRuntime, yearMonth?: string) {
  const ym =
    yearMonth && isValidYearMonth(yearMonth)
      ? yearMonth
      : monthContaining(localToday(rt.now?.() ?? new Date()));
  return ok({ review: await repos(rt).monthly.getByYearMonth(ym), yearMonth: ym });
}

export async function monthlyUpsert(
  rt: WorkspaceRuntime,
  input: { yearMonth: string; improvementPriorities?: string },
) {
  if (!isValidYearMonth(input.yearMonth)) return err('INVALID_YEAR_MONTH', 'Invalid yearMonth.');
  const r = repos(rt);
  const existing = await r.monthly.getByYearMonth(input.yearMonth);
  const review = {
    id: existing?.id ?? newId(),
    yearMonth: input.yearMonth,
    improvementPriorities: input.improvementPriorities ?? existing?.improvementPriorities ?? '',
    updatedAt: nowIso(rt),
  };
  await r.monthly.save(review);
  afterWrite(rt);
  return ok({ review });
}

export async function settingsGet(rt: WorkspaceRuntime) {
  return ok({ settings: await repos(rt).settings.get() });
}

export async function settingsUpdate(
  rt: WorkspaceRuntime,
  patch: Partial<{
    fortnightStartWeekday: Weekday;
    globalShortcutEnabled: boolean;
    globalShortcutAccel: string;
  }>,
) {
  const r = repos(rt);
  const current = await r.settings.get();
  if (patch.fortnightStartWeekday && !isWeekday(patch.fortnightStartWeekday)) {
    return err('INVALID_WEEKDAY', 'Invalid weekday.');
  }
  const settings = {
    ...current,
    ...patch,
    updatedAt: nowIso(rt),
  };
  await r.settings.save(settings);
  afterWrite(rt);
  return ok({ settings });
}

export async function workspaceResetAll(rt: WorkspaceRuntime) {
  if (rt.resetAll) {
    await rt.resetAll();
    return ok({ reset: true as const });
  }
  if (rt.store) {
    rt.store.replace(createEmptySnapshot(nowIso(rt)));
    afterWrite(rt);
    return ok({ reset: true as const });
  }
  return err('VALIDATION_ERROR', 'Reset is not available for this workspace runtime.');
}

export async function workspaceStatus(rt: WorkspaceRuntime) {
  return ok({
    mode: 'local_only' as const,
    dbPath: rt.dbPath,
    dbReady: rt.dbReady ?? Boolean(rt.sqliteRepos || rt.store),
    trayAvailable: rt.trayAvailable ?? false,
    globalShortcutAvailable: rt.globalShortcutAvailable ?? false,
    globalShortcutRegistered: rt.globalShortcutRegistered ?? false,
    globalShortcutError: rt.globalShortcutError,
  });
}

export { previousFortnight, nextFortnight, previousWeek, nextWeek, localToday };
