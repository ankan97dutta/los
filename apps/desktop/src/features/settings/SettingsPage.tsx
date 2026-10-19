import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Weekday, WorkspaceSettings } from '@los/domain';
import { APP_MAX_SCHEMA_VERSION, DbError } from '@los/persistence';
import { api } from '../../lib/api';
import { exportDbJson, importDbJson } from '../../lib/runtime';
import { Select } from '../../ui/Select';
import { readTheme, writeTheme, type UiTheme } from '../../ui/theme';

type Props = { rt: WorkspaceRuntime; onRestored?: () => void };

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function isTauri(): boolean {
  return Boolean(window.__TAURI__);
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

  async function changeWeekday(next: Weekday) {
    if (!settings || next === settings.fortnightStartWeekday) return;
    const ok = window.confirm(
      `Change fortnight start weekday from ${settings.fortnightStartWeekday} to ${next}? Historical periods keep their stored keys; new navigation uses the new weekday.`,
    );
    if (!ok) return;
    setError(null);
    const r = await api.settingsUpdate(rt, { fortnightStartWeekday: next });
    if (!r.ok) setError(r.error.message);
    else {
      setSettings(r.data.settings);
      setMessage('Fortnight start weekday updated.');
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
      setMessage('Settings saved (preview — OS shortcut only in Tauri).');
    }
  }

  async function onExport() {
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
      return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    const { save } = await import('@tauri-apps/plugin-dialog');
    const dest = await save({
      defaultPath: 'los-backup.sqlite',
      filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }],
    });
    if (!dest) return;
    const result = await invoke<{ backupPath: string }>('db_export_backup', { destPath: dest });
    setMessage(`Backup written to ${result.backupPath}`);
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
      <p className="lede">Local workspace preferences — no cloud account.</p>

      <div className="pref-group">
        <h2>Appearance</h2>
        <Select
          id="ui-theme"
          label="Theme"
          value={theme}
          onChange={(e) => {
            const next = e.target.value as UiTheme;
            setTheme(next);
            writeTheme(next);
            setMessage('Theme updated (stored locally in this browser profile).');
          }}
        >
          <option value="dark">Dark graphite (default)</option>
          <option value="light">Light</option>
        </Select>
      </div>

      <div className="pref-group">
        <h2>Planning calendar</h2>
        <div className="field">
          <label htmlFor="weekday">Fortnight start weekday</label>
          <select
            id="weekday"
            value={settings.fortnightStartWeekday}
            onChange={(e) => void changeWeekday(e.target.value as Weekday)}
          >
            {WEEKDAYS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pref-group">
        <h2>Shortcuts</h2>
        <div className="field">
          <label htmlFor="accel">Global shortcut accelerator</label>
          <input
            id="accel"
            value={settings.globalShortcutAccel}
            onChange={(e) =>
              setSettings({ ...settings, globalShortcutAccel: e.target.value })
            }
            onBlur={() => void saveShortcut(settings)}
          />
        </div>
        <label className="row">
          <input
            type="checkbox"
            checked={settings.globalShortcutEnabled}
            onChange={(e) => {
              const next = { ...settings, globalShortcutEnabled: e.target.checked };
              setSettings(next);
              void saveShortcut(next);
            }}
          />
          <span>Enable global shortcut</span>
        </label>
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

      {message ? <p className="muted" role="status">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </section>
  );
}
