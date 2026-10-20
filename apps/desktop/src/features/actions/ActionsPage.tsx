import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application, PersonalAction } from '@los/domain';
import { api } from '../../lib/api';
import { EmptyState } from '../../ui/EmptyState';
import { Segmented } from '../../ui/Segmented';
import { Select } from '../../ui/Select';

type Props = { rt: WorkspaceRuntime };

function sourceLabel(source: PersonalAction['source']): string {
  return source === 'manual' ? 'Added by you' : source.replace(/_/g, ' ');
}

export function ActionsPage({ rt }: Props) {
  const [actions, setActions] = useState<PersonalAction[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [description, setDescription] = useState('');
  const [createThreadId, setCreateThreadId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'done' | 'all'>('open');
  const [appFilter, setAppFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const refresh = useCallback(async () => {
    const [a, appsRes] = await Promise.all([
      api.actionsList(rt, {
        status: statusFilter,
        applicationId: appFilter ? appFilter : undefined,
      }),
      api.applicationsList(rt),
    ]);
    if (a.ok) setActions(a.data.actions);
    if (appsRes.ok) setApps(appsRes.data.applications);
  }, [rt, statusFilter, appFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  const openCount = useMemo(() => actions.filter((a) => a.status === 'open').length, [actions]);
  const doneCount = useMemo(() => actions.filter((a) => a.status === 'done').length, [actions]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api.actionsCreate(rt, description.trim(), createThreadId || null);
    if (!r.ok) { setError(r.error.message); return; }
    setDescription('');
    await refresh();
  }

  async function setStatus(id: string, status: 'open' | 'done') {
    const r = await api.actionsSetStatus(rt, id, status);
    if (!r.ok) setError(r.error.message);
    else await refresh();
  }

  async function saveEdit(id: string) {
    const r = await api.actionsUpdate(rt, id, { description: editText.trim() });
    if (!r.ok) setError(r.error.message);
    else { setEditingId(null); await refresh(); }
  }

  async function linkThread(id: string, applicationId: string | null) {
    const r = await api.actionsUpdate(rt, id, { applicationId });
    if (!r.ok) setError(r.error.message);
    else await refresh();
  }

  const threadName = (id: string | null) => apps.find((a) => a.id === id)?.name;

  return (
    <section className="stack">
      <div>
        <h1>Your actions</h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          The small things you owe yourself and other people. Tick one off when it is done, or link it to a thread so it shows up with the rest of that work.
        </p>
      </div>

      <form className="create-bar" onSubmit={onCreate}>
        <div className="field grow">
          <label htmlFor="action-create">What needs doing?</label>
          <input
            id="action-create"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="For example: reply to Priya about the launch date"
          />
        </div>
        <Select
          id="action-create-thread"
          label="Thread (optional)"
          value={createThreadId}
          onValueChange={setCreateThreadId}
          options={[{ value: '', label: 'No thread' }, ...apps.map((a) => ({ value: a.id, label: a.name }))]}
        />
        <button type="submit" className="primary" disabled={!description.trim()}>Add action</button>
      </form>
      {error ? <p className="error" role="alert" style={{ margin: 0 }}>{error}</p> : null}

      <div className="toolbar">
        <Segmented
          label="Filter by status"
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as 'open' | 'done' | 'all')}
          options={[
            { value: 'open', label: 'Still to do', count: statusFilter === 'open' ? actions.length : undefined },
            { value: 'done', label: 'Done', count: statusFilter === 'done' ? actions.length : undefined },
            { value: 'all', label: 'Everything', count: statusFilter === 'all' ? actions.length : undefined },
          ]}
        />
        <Select
          id="app-filter"
          label="Thread"
          value={appFilter}
          onValueChange={setAppFilter}
          options={[{ value: '', label: 'All threads' }, ...apps.map((a) => ({ value: a.id, label: a.name }))]}
        />
      </div>
      <p className="muted" style={{ margin: 0 }} aria-live="polite">
        {actions.length === 0
          ? 'Nothing here right now.'
          : statusFilter === 'all'
            ? `${openCount} still to do, ${doneCount} done.`
            : `${actions.length} ${actions.length === 1 ? 'action' : 'actions'} shown.`}
      </p>

      {actions.length === 0 ? (
        <EmptyState
          title={statusFilter === 'done' ? 'Nothing finished yet' : 'All clear'}
          actionHint={statusFilter === 'done' ? 'When you tick an action off, it will show up here.' : 'Add your first action above. Keep it small and specific.'}
        />
      ) : (
        <ul className="item-list">
          {actions.map((action) => (
            <li key={action.id} className={`item-row ${action.status === 'done' ? 'is-done' : ''}`}>
              <button
                type="button"
                className={`done-toggle ${action.status === 'done' ? 'is-done' : ''}`}
                aria-label={action.status === 'done' ? `Mark "${action.description}" as not done` : `Mark "${action.description}" as done`}
                aria-pressed={action.status === 'done'}
                onClick={() => void setStatus(action.id, action.status === 'done' ? 'open' : 'done')}
              >✓</button>
              {editingId === action.id ? (
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <input
                    autoFocus
                    aria-label="Action text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); void saveEdit(action.id); }
                      if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
                    }}
                  />
                  <button type="button" className="primary icon-btn" onClick={() => void saveEdit(action.id)}>Save</button>
                  <button type="button" className="icon-btn" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <div style={{ minWidth: 0 }}>
                  <div className="item-title">{action.description}</div>
                  <div className="item-meta">
                    <span className={`chip ${action.status === 'done' ? 'is-done' : 'is-open'}`}>
                      <span className="dot" aria-hidden="true" />
                      {action.status === 'done' ? 'Done' : 'Still to do'}
                    </span>
                    <span>{sourceLabel(action.source)}</span>
                    {threadName(action.applicationId) ? <span>{threadName(action.applicationId)}</span> : null}
                  </div>
                </div>
              )}
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                {editingId !== action.id ? (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => { setEditingId(action.id); setEditText(action.description); }}
                  >Edit</button>
                ) : null}
                <Select
                  aria-label={`Thread for ${action.description}`}
                  size="sm"
                  value={action.applicationId ?? ''}
                  onValueChange={(v) => void linkThread(action.id, v || null)}
                  options={[{ value: '', label: 'No thread' }, ...apps.map((a) => ({ value: a.id, label: a.name }))]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
