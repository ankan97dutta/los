import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Field } from '../../ui/Field';

type Props = { rt: WorkspaceRuntime };

const THREAD_TONES = ['#7c7ff0', '#4db380', '#d9a92f', '#e8844a', '#5aa9e6', '#c77dbb'];

function threadTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return THREAD_TONES[hash % THREAD_TONES.length];
}

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

  useEffect(() => {
    if (!announcement) return;
    const t = window.setTimeout(() => setAnnouncement(''), 3200);
    return () => window.clearTimeout(t);
  }, [announcement]);

  async function rename(thread: Application, name: string) {
    setError(null);
    const r = await api.applicationsRename(rt, thread.id, name.trim());
    if (!r.ok) { setError(r.error.message); return; }
    setEditingId(null);
    setAnnouncement(`Thread renamed to ${name.trim()}. Everything linked to it keeps its link.`);
    await refresh();
  }

  async function add() {
    setError(null);
    const r = await api.applicationsCreate(rt, newName.trim());
    if (!r.ok) { setError(r.error.message); return; }
    setNewName('');
    setAnnouncement(`${r.data.application.name} is a thread now.`);
    await refresh();
  }

  async function remove(thread: Application) {
    setError(null);
    const r = await api.applicationsRemove(rt, thread.id);
    if (!r.ok) { setError(r.error.message); setRemovingId(null); return; }
    setRemovingId(null);
    setAnnouncement(`${thread.name} was removed.`);
    await refresh();
  }

  return (
    <section className="stack">
      <div>
        <h1>Threads</h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          Threads are your projects and workstreams. You will see them in Actions and Planning whenever you link work. If a thread is already tied to work, we will stop you from removing it, so nothing ever gets quietly unlinked.
        </p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {announcement ? <div className="toast" role="presentation">{announcement}</div> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      <form className="roster-add" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Field id="thread-new" label="Start a new thread" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="For example: Platform, Mobile app, Hiring" />
        <Button variant="primary" type="submit" disabled={!newName.trim()}>Add thread</Button>
      </form>

      <div>
        <div className="list-head">
          <h2>Your threads</h2>
          <span className="count-chip num">{threads.length}</span>
        </div>
        {threads.length === 0 ? (
          <EmptyState title="No threads yet" actionHint="Add your first thread above, then link your actions and planning work to it so everything hangs together." />
        ) : (
          <ul className="thread-list">
            {threads.map((thread, index) => {
              const tone = threadTone(thread.id);
              return (
                <li key={thread.id} className="thread-row">
                  {editingId === thread.id ? (
                    <form className="row" style={{ gridColumn: '1 / -1', flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); void rename(thread, editName); }}>
                      <span className="thread-avatar" style={{ color: tone, borderColor: tone }} aria-hidden="true">{(editName || thread.name).slice(0, 1).toUpperCase()}</span>
                      <input className="control-input" autoFocus value={editName} aria-label={`Rename thread ${thread.name}`} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); } }} />
                      <Button variant="primary" type="submit" disabled={!editName.trim()}>Save name</Button>
                      <Button onClick={() => setEditingId(null)}>Cancel <kbd aria-hidden="true">Esc</kbd></Button>
                    </form>
                  ) : removingId === thread.id ? (
                    <div className="panel" style={{ gridColumn: '1 / -1' }} role="group" aria-label={`Confirm removing thread ${thread.name}`}
                      onKeyDown={(e) => { if (e.key === 'Escape') setRemovingId(null); }}>
                      <p style={{ marginTop: 0 }}>
                        Remove <strong>{thread.name}</strong> for good? If actions or planned work are linked to it, we will refuse and explain why. Renaming is usually the safer move.
                      </p>
                      <div className="row">
                        <Button autoFocus onClick={() => setRemovingId(null)}>Keep it</Button>
                        <Button className="danger" onClick={() => void remove(thread)}>Remove thread</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="thread-avatar" style={{ color: tone, borderColor: tone }} aria-hidden="true">{thread.name.slice(0, 1).toUpperCase() || '#'}</span>
                      <span style={{ minWidth: 0 }}>
                        <strong className="item-title">{thread.name}</strong>
                        <span className="thread-meta" style={{ display: 'block' }}>Thread {index + 1} of {threads.length}. Shows up in Actions and Planning.</span>
                      </span>
                      <span className="roster-actions">
                        <Button onClick={() => { setEditingId(thread.id); setEditName(thread.name); }}>Rename</Button>
                        <Button className="danger" onClick={() => setRemovingId(thread.id)}>Remove</Button>
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
