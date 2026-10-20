import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Weekday, WorkspaceSettings } from '@los/domain';
import { APP_MAX_SCHEMA_VERSION, DbError } from '@los/persistence';
import { api } from '../../lib/api';
import { exportDbJson, importDbJson } from '../../lib/runtime';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { isTauriRuntime } from '../../lib/isTauri';
import { readTheme, writeTheme, type UiTheme } from '../../ui/theme';

type Props = { rt: WorkspaceRuntime; onRestored?: () => void };

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function isTauri(): boolean {
  return isTauriRuntime();
}

export function SettingsPage({ rt, onRestored }: Props) {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<UiTheme>(() => readTheme());

  useEffect(() => {
    void api.settingsGet(rt).then((r) => {
      if (r.ok) setSettings(r.data.settings);
    });
  }, [rt]);

  const [pendingWeekday, setPendingWeekday] = useState<Weekday | null>(null);

  async function changeWeekday(next: Weekday) {
    if (!settings || next === settings.fortnightStartWeekday) return;
    setError(null);
    const r = await api.settingsUpdate(rt, { fortnightStartWeekday: next });
    if (!r.ok) setError(r.error.message);
    else {
      setSettings(r.data.settings);
      setPendingWeekday(null);
      setMessage('Week start day updated. Historical periods keep their stored keys.');
    }
  }

  async function saveShortcut(next: WorkspaceSettings) {
    setError(null);
    const r = await api.settingsUpdate(rt, {
      globalShortcutAccel: next.globalShortcutAccel,
      globalShortcutEnabled: next.globalShortcutEnabled,
    });
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setSettings(r.data.settings);
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<{ registered: boolean; error?: string }>('shortcuts_reregister', {
        enabled: r.data.settings.globalShortcutEnabled,
        accel: r.data.settings.globalShortcutAccel,
      });
      if (!result.registered) {
        setMessage(
          `Settings saved. Shortcut not registered${result.error ? `: ${result.error}` : ''}. In-app capture still works.`,
        );
      } else {
        setMessage('Settings saved; global shortcut re-registered.');
      }
    } else {
      setMessage('Settings saved. The system-wide shortcut only works in the desktop app.');
    }
  }

  async function onExport(): Promise<boolean> {
    setError(null);
    if (!isTauri()) {
      const blob = new Blob([exportDbJson(rt)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'los-db-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Exported preview JSON (non-durable).');
      return true;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    const { save } = await import('@tauri-apps/plugin-dialog');
    const dest = await save({
      defaultPath: 'los-backup.sqlite',
      filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }],
    });
    if (!dest) return false;
    const result = await invoke<{ backupPath: string }>('db_export_backup', { destPath: dest });
    setMessage(`Backup written to ${result.backupPath}`);
    return true;
  }

  const [showReset, setShowReset] = useState(false);
  const [exportFirst, setExportFirst] = useState(true);
  const [resetting, setResetting] = useState(false);

  async function onResetAll() {
    setError(null);
    if (exportFirst) {
      const exported = await onExport();
      if (!exported) {
        setError('Export cancelled. Your data was not reset.');
        return;
      }
    }
    setResetting(true);
    if (isTauri()) {
      // File-based reset: close the DB, delete it, and let the next boot
      // recreate a fresh workspace. Immune to locked tables/transactions.
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await rt.closeDb?.();
        await invoke('db_reset_all');
      } catch (e) {
        setResetting(false);
        setError(e instanceof Error ? e.message : 'Reset failed');
        return;
      }
      setResetting(false);
      setShowReset(false);
      setMessage('All workspace data was reset. Threads and settings are back to defaults.');
      onRestored?.();
      return;
    }
    const r = await api.workspaceResetAll(rt);
    setResetting(false);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setShowReset(false);
    setMessage('All workspace data was reset. Threads and settings are back to defaults.');
    onRestored?.();
  }

  async function onImportPreview(file: File) {
    setError(null);
    try {
      const text = await file.text();
      importDbJson(rt, text);
      const s = await api.settingsGet(rt);
      if (s.ok) setSettings(s.data.settings);
      setMessage('Preview database restored from JSON.');
      onRestored?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    }
  }

  async function onRestoreTauri() {
    setError(null);
    const { invoke } = await import('@tauri-apps/api/core');
    const { open } = await import('@tauri-apps/plugin-dialog');
    const source = await open({
      multiple: false,
      filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }],
    });
    if (!source || Array.isArray(source)) return;

    // Schema-too-new check before replace: open backup read-only via temporary plugin load
    try {
      const Database = (await import('@tauri-apps/plugin-sql')).default;
      const probe = await Database.load(`sqlite:${source}`);
      try {
        const rows = await probe.select<{ version: number }[]>(
          'SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations',
        );
        const version = Number(rows[0]?.version ?? 0);
        if (version > APP_MAX_SCHEMA_VERSION) {
          throw new DbError(
            'DB_SCHEMA_TOO_NEW',
            `Backup schema version ${version} exceeds app max ${APP_MAX_SCHEMA_VERSION}`,
          );
        }
      } finally {
        await probe.close();
      }
    } catch (e) {
      if (e instanceof DbError && e.code === 'DB_SCHEMA_TOO_NEW') {
        setError(e.message);
        return;
      }
      // If probe fails for other reasons, still refuse rather than blind replace when not sqlite
      setError(e instanceof Error ? e.message : 'Cannot read backup schema');
      return;
    }

    await rt.closeDb?.();
    await invoke('db_restore_backup', { sourcePath: source });
    setMessage('Database restored. Reloading workspace…');
    onRestored?.();
  }

  if (!settings) return <p className="muted">Loading settings…</p>;

  return (
    <section className="stack">
      <h1>Settings</h1>
      <p className="lede">Your preferences, saved on this device. No account, no cloud.</p>

      <div className="pref-group">
        <h2>Appearance</h2>
        <Select
          id="ui-theme"
          label="Theme"
          value={theme}
          onValueChange={(v) => {
            const next = v as UiTheme;
            setTheme(next);
            writeTheme(next);
            setMessage('Theme updated. We keep that choice on this device.');
          }}
          options={[
            { value: 'dark', label: 'Dark graphite (the default)' },
            { value: 'light', label: 'Light' },
          ]}
        />
      </div>

      <div className="pref-group">
        <h2>Planning calendar</h2>
        <Select
          id="weekday"
          label="Week starts on"
          value={pendingWeekday ?? settings.fortnightStartWeekday}
          onValueChange={(v) => setPendingWeekday(v as Weekday)}
          options={WEEKDAYS.map((w) => ({ value: w, label: w[0].toUpperCase() + w.slice(1) }))}
        />
        {pendingWeekday && pendingWeekday !== settings.fortnightStartWeekday ? (
          <div className="panel" role="group" aria-label="Confirm week start change"
            onKeyDown={(e) => { if (e.key === 'Escape') setPendingWeekday(null); }}>
            <p style={{ marginTop: 0 }}>Change week start from <strong>{settings.fortnightStartWeekday}</strong> to <strong>{pendingWeekday}</strong>? Historical periods keep their stored keys; new weekly planning uses the new day.</p>
            <div className="row">
              <button type="button" autoFocus onClick={() => setPendingWeekday(null)}>Cancel</button>
              <button type="button" className="primary" onClick={() => void changeWeekday(pendingWeekday)}>Change week start</button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pref-group">
        <h2>Keyboard</h2>
        <p className="muted" style={{ margin: 0 }}>
          Everything is keyboard-operable: <kbd>⌘K</kbd> palette, <kbd>⌘1-6</kbd> navigation, arrow keys in
          lists and tabs, <kbd>C</kbd>/<kbd>K</kbd>/<kbd>X</kbd> on a focused inbox item, <kbd>Esc</kbd> to close or cancel.
        </p>
        <div className="row">
          <button type="button" onClick={() => window.dispatchEvent(new Event('los:open-shortcuts'))}>
            View all shortcuts <kbd aria-hidden="true">?</kbd>
          </button>
          <button type="button" onClick={() => window.dispatchEvent(new Event('los:start-tour'))}>
            Replay UI tour
          </button>
        </div>
      </div>

      <div className="pref-group">
        <h2>Shortcuts</h2>
        <p className="muted" style={{ margin: 0 }}>
          OS global shortcut registration applies in the Tauri desktop shell only. Status of tray/shortcut
          availability is shown in the sidebar (shown as Local status in the sidebar), so we do not repeat it here.
        </p>
        <div className="field">
          <label htmlFor="accel">Global shortcut accelerator</label>
          <input
            id="accel"
            value={settings.globalShortcutAccel}
            onChange={(e) =>
              setSettings({ ...settings, globalShortcutAccel: e.target.value })
            }
            onBlur={() => void saveShortcut(settings)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void saveShortcut(settings); } }}
          />
        </div>
        <Checkbox
          checked={settings.globalShortcutEnabled}
          onChange={(checked) => {
            const next = { ...settings, globalShortcutEnabled: checked };
            setSettings(next);
            void saveShortcut(next);
          }}
        >
          Let me capture from anywhere with the global shortcut
        </Checkbox>
      </div>

      <div className="pref-group">
        <h2>Backup / restore</h2>
        <p className="muted">
          {isTauri() ? (
            <>
              Durable DB: <code>{rt.dbPath ?? '$APP_DATA/los/los.sqlite'}</code>. Export copies that
              SQLite file. In-app restore replaces it (connection closed/reopened). Quit-and-replace:
              quit LOS, copy a backup over the path, relaunch.
            </>
          ) : (
            <>
              Preview uses localStorage <code>los-db-v1</code> (non-durable). Use{' '}
              <code>pnpm tauri:dev</code> for SQLite acceptance.
            </>
          )}
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={() => void onExport()}>
            Export DB
          </button>
          {isTauri() ? (
            <button type="button" onClick={() => void onRestoreTauri()}>
              Restore SQLite…
            </button>
          ) : (
            <label className="row">
              <span className="muted">Import JSON</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImportPreview(f);
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="pref-group">
        <h2>Reset all data</h2>
        <p className="muted" style={{ margin: 0 }}>
          Permanently deletes every inbox item, action, review, team member, plan, and history snapshot
          in this workspace, then restores default applications and settings. This cannot be undone
          unless you export a backup first.
        </p>
        {!showReset ? (
          <div className="row">
            <button type="button" className="danger" onClick={() => setShowReset(true)}>
              Reset all data…
            </button>
          </div>
        ) : (
          <div className="panel" role="group" aria-label="Confirm reset all data"
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setShowReset(false); } }}>
            <p style={{ marginTop: 0 }}><strong>Are you sure?</strong> This deletes all workspace data on this device.</p>
            <Checkbox checked={exportFirst} onChange={setExportFirst}>
              Save a backup first (a good idea)
            </Checkbox>
            <div className="row" style={{ marginTop: 'var(--space-3)' }}>
              <button type="button" autoFocus onClick={() => setShowReset(false)}>
                Cancel <kbd aria-hidden="true">Esc</kbd>
              </button>
              <button type="button" className="danger" disabled={resetting} onClick={() => void onResetAll()}
                onKeyDown={(e) => { if (e.key === 'Escape') setShowReset(false); }}>
                {resetting ? 'Resetting…' : exportFirst ? 'Export & reset everything' : 'Reset everything without export'}
              </button>
            </div>
          </div>
        )}
      </div>

      {message ? <p className="muted" role="status">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </section>
  );
}
