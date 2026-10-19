import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Weekday, WorkspaceSettings } from '@los/domain';
import { api } from '../../lib/api';
import { exportDbJson, importDbJson } from '../../lib/runtime';

type Props = { rt: WorkspaceRuntime };

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function SettingsPage({ rt }: Props) {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  function onExport() {
    const blob = new Blob([exportDbJson(rt)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'los-db-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported los-db-backup.json');
  }

  async function onImport(file: File) {
    setError(null);
    try {
      const text = await file.text();
      importDbJson(rt, text);
      const s = await api.settingsGet(rt);
      if (s.ok) setSettings(s.data.settings);
      setMessage('Database restored from file. Reload views as needed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    }
  }

  if (!settings) return <p className="muted">Loading settings…</p>;

  return (
    <section className="stack">
      <h1>Settings</h1>
      <p className="lede">Local workspace preferences. No cloud account.</p>

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

      <div className="field">
        <label htmlFor="accel">Global shortcut accelerator</label>
        <input
          id="accel"
          value={settings.globalShortcutAccel}
          onChange={(e) =>
            setSettings({ ...settings, globalShortcutAccel: e.target.value })
          }
          onBlur={() =>
            void api.settingsUpdate(rt, {
              globalShortcutAccel: settings.globalShortcutAccel,
              globalShortcutEnabled: settings.globalShortcutEnabled,
            }).then((r) => {
              if (r.ok) setSettings(r.data.settings);
            })
          }
        />
      </div>

      <div className="stack">
        <strong>Backup / restore</strong>
        <p className="muted">
          Browser/dev: data lives in localStorage key <code>los-db-v1</code>. Tauri:{' '}
          <code>$APP_DATA/los/los-db.json</code>. Export copies the DB; import replaces it.
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={onExport}>
            Export DB
          </button>
          <label className="row">
            <span className="muted">Import / restore</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
              }}
            />
          </label>
        </div>
      </div>

      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </section>
  );
}
