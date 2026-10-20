import type { FocusSession } from '@los/domain';
import { formatClock, phaseWord, remainingFor, techniqueLabel, blockWording } from '../features/focus/focusView';
import { isTauriRuntime } from './isTauri';

export type TrayFocusText = { title: string | null; tooltip: string; status: string };

function shortLabel(label: string, max = 42): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * What the system tray should say for a session. Pure and testable.
 * With no live session the title clears and the menu line rests.
 */
export function trayFocusText(session: FocusSession | null, nowIso: string): TrayFocusText {
  if (
    !session ||
    session.status === 'finished' ||
    session.status === 'endedEarly'
  ) {
    return { title: null, tooltip: 'Lead OS', status: 'No focus session' };
  }
  const clock = formatClock(remainingFor(session, nowIso));
  const technique = techniqueLabel(session.technique);
  const task = shortLabel(session.taskLabel);
  switch (session.status) {
    case 'running':
      return {
        title: clock,
        tooltip: `Focusing on ${task} · ${clock} left · ${technique}, ${blockWording(session).toLowerCase()}`,
        status: `Focusing · ${clock} left: ${task}`,
      };
    case 'paused':
      return {
        title: `Paused ${clock}`,
        tooltip: `Paused on ${task} · ${clock} held · ${technique}`,
        status: `Paused · ${clock} held: ${task}`,
      };
    case 'breakRunning':
      return {
        title: `Break ${clock}`,
        tooltip: `On a break from ${task} · ${clock} left`,
        status: `On a break · ${clock} left`,
      };
    case 'focusDone':
      return {
        title: 'Done',
        tooltip: `Focus block done: ${task}. Open LOS to start a break or the next block.`,
        status: `Focus block done: ${task}`,
      };
    case 'breakDone':
      return {
        title: 'Break done',
        tooltip: `Break done: ${task}. Open LOS to start the next block.`,
        status: `Break done: ${task}`,
      };
    default:
      return { title: null, tooltip: 'Lead OS', status: phaseWord(session) };
  }
}

let lastSent = '';

/**
 * Mirrors the session into the macOS menu bar (live title next to the tray
 * icon), the tray tooltip and the tray menu status line. No-ops outside
 * Tauri and never throws: the tray is a mirror, never a blocker.
 */
export async function syncTrayFocus(session: FocusSession | null): Promise<void> {
  if (!isTauriRuntime()) return;
  const text = trayFocusText(session, new Date().toISOString());
  const key = `${text.title ?? ''}|${text.tooltip}|${text.status}`;
  if (key === lastSent) return;
  lastSent = key;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('tray_focus_update', {
      title: text.title,
      tooltip: text.tooltip,
      status: text.status,
    });
  } catch {
    // Tray update failed; the in-app chip still shows the timer.
  }
}

/** Test hook: forget the last payload so the next sync sends again. */
export function resetTrayFocusCache(): void {
  lastSent = '';
}
