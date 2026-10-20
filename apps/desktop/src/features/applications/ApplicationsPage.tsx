import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Field } from '../../ui/Field';

type Props = { rt: WorkspaceRuntime };

export function ApplicationsPage({ rt }: Props) {
  const [threads, setThreads] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const refresh = useCallback(async () => {
    const r = await api.applicationsList(rt);
    if (r.ok) setThreads(r.data.applications);
  }, [rt]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function rename(thread: Application, name: string) {
    setError(null);
    const r = await api.applicationsRename(rt, thread.id, name);
    if (!r.ok) { setError(r.error.message); return; }
    setEditingId(null);
    setAnnouncement(`Thread renamed to ${name}. Work and actions already linked keep their link.`);
    await refresh();
  }

  async function add() {
    setError(null);
    const r = await api.applicationsCreate(rt, newName);
    if (!r.ok) { setError(r.error.message); return; }
    setNewName('');
    setAnnouncement(`${r.data.application.name} thread added.`);
    await refresh();
  }

  async function remove(thread: Application) {
    setError(null);
    const r = await api.applicationsRemove(rt, thread.id);
    if (!r.ok) { setError(r.error.message); setRemovingId(null); return; }
    setRemovingId(null);
    setAnnouncement(`${thread.name} thread removed.`);
    await refresh();
  }

  return (
    <section className="stack">
      <h1>Threads</h1>
      <p className="lede">Threads are the projects and workstreams used across Actions and Planning (formerly called Applications). Add, rename, or remove them — a thread in use can’t be removed, so nothing is ever silently unlinked.</p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <form className="row" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Field id="thread-new" label="New thread name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Platform, Mobile app, Hiring" />
        <Button variant="primary" type="submit">Add thread</Button>
      </form>

      {threads.length === 0 ? (
        <EmptyState title="No threads yet" actionHint="Add your first thread above — then link actions and planning work to it." />
      ) : (
        <ul className="list">
          {threads.map((thread) => (
            <li key={thread.id}>
              {editingId === thread.id ? (
                <form className="row" onSubmit={(e) => { e.preventDefault(); void rename(thread, editName); }}>
                  <label className="field"><span className="field-label">Thread name</span>
                    <input autoFocus value={editName} aria-label={`Rename thread ${thread.name}`} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); } }} />
                  </label>
                  <Button variant="primary" type="submit">Save name</Button>
                  <Button onClick={() => setEditingId(null)}>Cancel <kbd aria-hidden="true">Esc</kbd></Button>
                </form>
              ) : removingId === thread.id ? (
                <div className="panel" role="group" aria-label={`Confirm removing thread ${thread.name}`}
                  onKeyDown={(e) => { if (e.key === 'Escape') setRemovingId(null); }}>
                  <p style={{ marginTop: 0 }}>Remove <strong>{thread.name}</strong>? Threads linked to actions or planning work are protected and will refuse with an explanation.</p>
                  <div className="row">
                    <Button autoFocus onClick={() => setRemovingId(null)}>Cancel</Button>
                    <Button className="danger" onClick={() => void remove(thread)}>Remove thread</Button>
                  </div>
                </div>
              ) : (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span><strong>{thread.name}</strong></span>
                  <span className="row">
                    <Button onClick={() => { setEditingId(thread.id); setEditName(thread.name); }}>Rename</Button>
                    <Button className="danger" onClick={() => setRemovingId(thread.id)}>Remove</Button>
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
