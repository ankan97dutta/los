import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application } from '@los/domain';
import { api } from '../../lib/api';

type Props = { rt: WorkspaceRuntime };

export function ApplicationsPage({ rt }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await api.applicationsList(rt);
    if (r.ok) {
      setApps(r.data.applications);
      setDrafts(Object.fromEntries(r.data.applications.map((a) => [a.id, a.name])));
    }
  }, [rt]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function rename(id: string) {
    setError(null);
    const r = await api.applicationsRename(rt, id, drafts[id] ?? '');
    if (!r.ok) setError(r.error.message);
    else await refresh();
  }

  return (
    <section className="stack">
      <h1>Applications</h1>
      <p className="lede">Four fixed slots. Rename for your portfolio. Keyboard: Tab to name, Enter to save.</p>
      {error ? <span className="error" role="alert">{error}</span> : null}
      {apps.length === 0 ? (
        <div className="empty">Applications have not been seeded yet.</div>
      ) : (
        <ul className="list">
          {apps.map((app) => (
            <li key={app.id}>
              <div className="muted">Slot {app.slotIndex}</div>
              <div className="row" style={{ marginTop: '0.5rem' }}>
                <input
                  aria-label={`Rename application slot ${app.slotIndex}`}
                  value={drafts[app.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [app.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void rename(app.id);
                  }}
                />
                <button type="button" className="primary" onClick={() => void rename(app.id)}>
                  Save name
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
