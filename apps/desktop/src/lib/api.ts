import type { WorkspaceRuntime } from '@los/app-services';
import * as svc from '@los/app-services';
import type { Weekday } from '@los/domain';

/** Thin TS clients mirroring Tauri invoke command names (contracts). */
export const api = {
  inboxCapture: (rt: WorkspaceRuntime, description: string) => svc.inboxCapture(rt, description),
  inboxListOpen: (rt: WorkspaceRuntime) => svc.inboxListOpen(rt),
  inboxTriage: (
    rt: WorkspaceRuntime,
    id: string,
    disposition: 'convert' | 'dismiss' | 'keep',
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
  previousFortnight: svc.previousFortnight,
  nextFortnight: svc.nextFortnight,
  localToday: svc.localToday,
};
