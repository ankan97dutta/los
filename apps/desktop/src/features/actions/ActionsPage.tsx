import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { Application, PersonalAction } from '@los/domain';
import { api } from '../../lib/api';
import { EmptyState } from '../../ui/EmptyState';
import { Select } from '../../ui/Select';

type Props = { rt: WorkspaceRuntime };

export function ActionsPage({ rt }: Props) {
  const [actions, setActions] = useState<PersonalAction[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [description, setDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'done' | 'all'>('open');
  const [appFilter, setAppFilter] = useState<string>('');
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api.actionsCreate(rt, description, appFilter || null);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setDescription('');
    await refresh();
  }

  async function setStatus(id: string, status: 'open' | 'done') {
    const r = await api.actionsSetStatus(rt, id, status);
    if (!r.ok) setError(r.error.message);
    else await refresh();
  }

  async function saveEdit(id: string) {
    const r = await api.actionsUpdate(rt, id, { description: editText });
    if (!r.ok) setError(r.error.message);
    else {
      setEditingId(null);
      await refresh();
    }
  }

  async function linkApp(id: string, applicationId: string | null) {
    const r = await api.actionsUpdate(rt, id, { applicationId });
    if (!r.ok) setError(r.error.message);
    else await refresh();
  }

  return (
    <section className="stack">
      <h1>Personal actions</h1>
      <p className="lede">Create, complete, and link actions to one application. Keyboard: Tab through controls; Space/Enter activate buttons.</p>

      <form className="stack" onSubmit={onCreate}>
        <div className="field">
          <label htmlFor="action-create">New action</label>
          <input
            id="action-create"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Action description"
          />
        </div>
        <div className="row">
          <button type="submit" className="primary">
            Create
          </button>
          {error ? <span className="error" role="alert">{error}</span> : null}
        </div>
      </form>

      <div className="row">
        <Select
          id="status-filter"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'open' | 'done' | 'all')}
        >
          <option value="open">Open</option>
          <option value="done">Done</option>
          <option value="all">All</option>
        </Select>
        <Select
          id="app-filter"
          label="Application"
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
        >
          <option value="">Any</option>
          {apps.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          title="No actions match this filter"
          actionHint="Create one here or convert from Inbox."
        />
      ) : (
        <ul className="list">
          {actions.map((action) => (
            <li key={action.id}>
              {editingId === action.id ? (
                <div className="stack">
                  <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <div className="row">
                    <button type="button" className="primary" onClick={() => void saveEdit(action.id)}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>{action.description}</div>
                  <p className="muted" style={{ margin: '0.35rem 0' }}>
                    {action.status} · {action.source}
                    {action.applicationId
                      ? ` · ${apps.find((a) => a.id === action.applicationId)?.name ?? 'linked'}`
                      : ' · unlinked'}
                  </p>
                </>
              )}
              <div className="row">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(action.id);
                    setEditText(action.description);
                  }}
                >
                  Edit
                </button>
                {action.status === 'open' ? (
                  <button type="button" onClick={() => void setStatus(action.id, 'done')}>
                    Complete
                  </button>
                ) : (
                  <button type="button" onClick={() => void setStatus(action.id, 'open')}>
                    Reopen
                  </button>
                )}
                <select
                  aria-label={`Link application for ${action.description}`}
                  value={action.applicationId ?? ''}
                  onChange={(e) => void linkApp(action.id, e.target.value || null)}
                >
                  <option value="">No application</option>
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
