import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';

type Props = { rt: WorkspaceRuntime };

export function ApplicationsPage({ rt }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const refresh = useCallback(async () => {
    const r = await api.applicationsList(rt);
    if (r.ok) setApps(r.data.applications);
  }, [rt]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function rename(app: Application, name: string) {
    setError(null);
    const r = await api.applicationsRename(rt, app.id, name);
    if (!r.ok) { setError(r.error.message); return; }
    setEditingId(null);
    setAnnouncement(`Slot ${app.slotIndex} renamed to ${name}. Work and actions already linked keep their link.`);
    await refresh();
  }

  return (
    <section className="stack">
      <h1>Applications</h1>
      <p className="lede">Four fixed project slots used across Actions and Planning. Rename a slot or reset it to its default name — links on existing work are never broken by a rename.</p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {apps.length === 0 ? (
        <EmptyState title="Applications have not been seeded yet" actionHint="Restart the workspace — slots are created with the local database." />
      ) : (
        <ul className="list">
          {apps.map((app) => (
            <li key={app.id}>
              {editingId === app.id ? (
                <form className="row" onSubmit={(e) => { e.preventDefault(); void rename(app, editName); }}>
                  <span className="muted">Slot {app.slotIndex}</span>
                  <label className="field"><span className="field-label">Application name</span>
                    <input autoFocus value={editName} aria-label={`Rename application slot ${app.slotIndex}`} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); } }} />
                  </label>
                  <Button variant="primary" type="submit">Save name</Button>
                  <Button onClick={() => setEditingId(null)}>Cancel <kbd aria-hidden="true">Esc</kbd></Button>
                </form>
              ) : (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span><span className="muted">Slot {app.slotIndex} · </span><strong>{app.name}</strong></span>
                  <span className="row">
                    <Button onClick={() => { setEditingId(app.id); setEditName(app.name); }}>Rename</Button>
                    <Button disabled={app.name === `Application ${app.slotIndex}`} onClick={() => void rename(app, `Application ${app.slotIndex}`)}>Reset name</Button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
