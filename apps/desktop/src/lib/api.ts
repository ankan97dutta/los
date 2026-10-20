import type { WorkspaceRuntime } from '@los/app-services';
import * as svc from '@los/app-services';
import type { Weekday } from '@los/domain';

/** Thin TS clients mirroring Tauri invoke command names (contracts). */
export const api = {
  inboxCapture: (rt: WorkspaceRuntime, description: string) => svc.inboxCapture(rt, description),
  inboxListOpen: (rt: WorkspaceRuntime) => svc.inboxListOpen(rt),
  inboxListKept: (rt: WorkspaceRuntime) => svc.inboxListKept(rt),
  inboxTriage: (
    rt: WorkspaceRuntime,
    id: string,
    disposition: 'convert' | 'dismiss' | 'keep' | 'reopen',
  ) => svc.inboxTriage(rt, id, disposition),
  actionsCreate: (rt: WorkspaceRuntime, description: string, applicationId?: string | null) =>
    svc.actionsCreate(rt, description, applicationId),
  actionsUpdate: (
    rt: WorkspaceRuntime,
    id: string,
    patch: { description?: string; applicationId?: string | null },
  ) => svc.actionsUpdate(rt, id, patch),
  actionsSetStatus: (rt: WorkspaceRuntime, id: string, status: 'open' | 'done') =>
    svc.actionsSetStatus(rt, id, status),
  actionsList: (
    rt: WorkspaceRuntime,
    filter?: { status?: 'open' | 'done' | 'all'; applicationId?: string | null },
  ) => svc.actionsList(rt, filter),
  applicationsList: (rt: WorkspaceRuntime) => svc.applicationsList(rt),
  applicationsRename: (rt: WorkspaceRuntime, id: string, name: string) =>
    svc.applicationsRename(rt, id, name),
  applicationsCreate: (rt: WorkspaceRuntime, name: string) => svc.applicationsCreate(rt, name),
  applicationsRemove: (rt: WorkspaceRuntime, id: string) => svc.applicationsRemove(rt, id),
  planningMemberRemove: (rt: WorkspaceRuntime, id: string) => svc.planningMemberRemove(rt, id),
  dailyGet: (rt: WorkspaceRuntime, date: string) => svc.dailyGet(rt, date),
  dailyUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.dailyUpsert>[1],
  ) => svc.dailyUpsert(rt, input),
  fortnightCurrentPeriod: (rt: WorkspaceRuntime, asOf?: string) =>
    svc.fortnightCurrentPeriod(rt, asOf),
  fortnightGet: (rt: WorkspaceRuntime, periodStart?: string) => svc.fortnightGet(rt, periodStart),
  fortnightUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.fortnightUpsert>[1],
  ) => svc.fortnightUpsert(rt, input),
  monthlyGet: (rt: WorkspaceRuntime, yearMonth?: string) => svc.monthlyGet(rt, yearMonth),
  monthlyUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.monthlyUpsert>[1],
  ) => svc.monthlyUpsert(rt, input),
  settingsGet: (rt: WorkspaceRuntime) => svc.settingsGet(rt),
  settingsUpdate: (
    rt: WorkspaceRuntime,
    patch: Partial<{
      fortnightStartWeekday: Weekday;
      globalShortcutEnabled: boolean;
      globalShortcutAccel: string;
    }>,
  ) => svc.settingsUpdate(rt, patch),
  workspaceStatus: (rt: WorkspaceRuntime) => svc.workspaceStatus(rt),
  workspaceResetAll: (rt: WorkspaceRuntime) => svc.workspaceResetAll(rt),
  previousFortnight: svc.previousFortnight,
  nextFortnight: svc.nextFortnight,
  previousWeek: svc.previousWeek,
  nextWeek: svc.nextWeek,
  localToday: svc.localToday,
  planningPeriodGet: (rt: WorkspaceRuntime, periodStart?: string) =>
    svc.planningPeriodGet(rt, periodStart),
  planningPeriodSaveMeta: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningPeriodSaveMeta>[1],
  ) => svc.planningPeriodSaveMeta(rt, input),
  planningPeriodClose: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningPeriodClose>[1],
  ) => svc.planningPeriodClose(rt, input),
  planningHistoryGet: (rt: WorkspaceRuntime, periodStart: string) =>
    svc.planningHistoryGet(rt, periodStart),
  planningMembersList: (rt: WorkspaceRuntime) => svc.planningMembersList(rt),
  planningMemberUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningMemberUpsert>[1],
  ) => svc.planningMemberUpsert(rt, input),
  planningCapacityUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningCapacityUpsert>[1],
  ) => svc.planningCapacityUpsert(rt, input),
  planningWorkList: (rt: WorkspaceRuntime, periodStart: string) =>
    svc.planningWorkList(rt, periodStart),
  planningWorkUpsert: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningWorkUpsert>[1],
  ) => svc.planningWorkUpsert(rt, input),
  planningAllocate: (
    rt: WorkspaceRuntime,
    input: Parameters<typeof svc.planningAllocate>[1],
  ) => svc.planningAllocate(rt, input),
};
