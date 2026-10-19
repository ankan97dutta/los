/**
 * FR-U14 / SC-U08 LocalStatus capability phrases (research R9).
 *
 * Detection: **preview** when not running in Tauri (`!isTauriRuntime()`).
 * Otherwise use workspace flags: trayAvailable, globalShortcutAvailable,
 * globalShortcutRegistered, globalShortcutError.
 */

import { isTauriRuntime } from '../../lib/isTauri';

export type CapabilityCause = 'preview' | 'os-unavailable' | 'registration-failed' | 'available';

export type CapabilityFlags = {
  inTauri: boolean;
  trayAvailable: boolean;
  globalShortcutAvailable: boolean;
  globalShortcutRegistered: boolean;
  globalShortcutError?: string;
};

export { isTauriRuntime };

export function trayCause(flags: CapabilityFlags): CapabilityCause {
  if (!flags.inTauri) return 'preview';
  return flags.trayAvailable ? 'available' : 'os-unavailable';
}

export function shortcutCause(flags: CapabilityFlags): CapabilityCause {
  if (!flags.inTauri) return 'preview';
  if (flags.globalShortcutRegistered) return 'available';
  // Available path but not registered, or explicit error → registration-failed
  if (flags.globalShortcutAvailable || flags.globalShortcutError) return 'registration-failed';
  return 'os-unavailable';
}

/** Canonical FR-U14 tray line (exact strings for SC-U08). */
export function trayPhrase(cause: CapabilityCause): string {
  switch (cause) {
    case 'preview':
      return 'Tray: n/a (browser preview)';
    case 'available':
      return 'Tray: available';
    case 'os-unavailable':
    case 'registration-failed':
      return 'Tray: unavailable (OS)';
  }
}

/** Canonical FR-U14 shortcut line (exact strings for SC-U08). */
export function shortcutPhrase(cause: CapabilityCause, error?: string): string {
  switch (cause) {
    case 'preview':
      return 'Shortcut: n/a (browser preview)';
    case 'available':
      return 'Shortcut: registered';
    case 'registration-failed': {
      const base = 'Shortcut: unavailable (registration failed)';
      return error?.trim() ? `${base}: ${error.trim()}` : base;
    }
    case 'os-unavailable':
      // Spec focuses registration-failed for shortcut; OS-level absence uses same family of honesty
      return 'Shortcut: unavailable (registration failed)';
  }
}

export function capabilityLines(flags: CapabilityFlags): { tray: string; shortcut: string } {
  const t = trayCause(flags);
  const s = shortcutCause(flags);
  return {
    tray: trayPhrase(t),
    shortcut: shortcutPhrase(s, flags.globalShortcutError),
  };
}
