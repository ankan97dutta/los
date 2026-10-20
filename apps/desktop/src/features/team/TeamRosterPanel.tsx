import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { TeamMember } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Field } from '../../ui/Field';

type Props = { rt: WorkspaceRuntime };

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export function TeamRosterPanel({ rt }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api.planningMembersList(rt);
    if (r.ok) setMembers(r.data.members);
  }, [rt]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!announcement) return;
    const t = window.setTimeout(() => setAnnouncement(''), 3200);
    return () => window.clearTimeout(t);
  }, [announcement]);

  async function add() {
    const r = await api.planningMemberUpsert(rt, { displayName: name.trim() });
    if (!r.ok) { setError(r.error.message); return; }
    setName(''); setError(null);
    setAnnouncement(`${r.data.member.displayName} is on the roster now.`);
    await load();
  }

  async function rename(member: TeamMember) {
    const r = await api.planningMemberUpsert(rt, { id: member.id, displayName: editName.trim(), active: member.active });
    if (!r.ok) { setError(r.error.message); return; }
    setEditingId(null); setError(null);
    setAnnouncement(`Renamed to ${editName.trim()}.`);
    await load();
  }

  async function setActive(member: TeamMember, active: boolean) {
    const r = await api.planningMemberUpsert(rt, { id: member.id, displayName: member.displayName, active });
    if (!r.ok) { setError(r.error.message); return; }
    setError(null);
    setAnnouncement(active
      ? `${member.displayName} is active again.`
      : `${member.displayName} is paused. Their existing work stays put, they just will not get new work.`);
    await load();
  }

  async function remove(member: TeamMember) {
    const r = await api.planningMemberRemove(rt, member.id);
    if (!r.ok) { setError(r.error.message); setRemovingId(null); return; }
    setError(null); setRemovingId(null);
    setAnnouncement(`${member.displayName} was removed from the roster.`);
    await load();
  }

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Everyone you plan work with. Pausing someone keeps their history and current work, it only stops new work from being assigned to them. Their weekly hours are set in Planning.
      </p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {announcement ? <div className="toast" role="presentation">{announcement}</div> : null}
      {error ? <Banner tone="error">{error}</Banner> : null}

      <form className="roster-add" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Field id="roster-name" label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Priya Sharma" />
        <Button variant="primary" type="submit" disabled={!name.trim()}>Add member</Button>
      </form>

      {members.length === 0 ? (
        <EmptyState title="Nobody on the roster yet" actionHint="Add the first name above. It is just a display name, nothing leaves this device." />
      ) : (
        <div>
          <div className="roster-head" aria-hidden="true">
            <span>Person</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          <ul className="roster-list">
            {members.map((m) => (
              <li key={m.id} className="roster-row">
                {editingId === m.id ? (
                  <form
                    className="row"
                    style={{ gridColumn: '1 / -1', flexWrap: 'nowrap' }}
                    onSubmit={(e) => { e.preventDefault(); void rename(m); }}
                  >
                    <span className="avatar" aria-hidden="true">{initials(editName || m.displayName)}</span>
                    <input autoFocus value={editName} aria-label={`Rename ${m.displayName}`} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); } }} />
                    <Button variant="primary" type="submit">Save</Button>
                    <Button onClick={() => setEditingId(null)}>Cancel <kbd aria-hidden="true">Esc</kbd></Button>
                  </form>
                ) : removingId === m.id ? (
                  <div className="panel" style={{ gridColumn: '1 / -1' }} role="group" aria-label={`Confirm removing ${m.displayName}`}
                    onKeyDown={(e) => { if (e.key === 'Escape') setRemovingId(null); }}>
                    <p style={{ marginTop: 0 }}>
                      Take <strong>{m.displayName}</strong> off the roster for good? If they already have work assigned, we will stop you here. You can unassign them in Planning first, or pause them instead.
                    </p>
                    <div className="row">
                      <Button autoFocus onClick={() => setRemovingId(null)}>Keep them</Button>
                      <Button className="danger" onClick={() => void remove(m)}>Remove member</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="roster-person">
                      <span className="avatar" aria-hidden="true">{initials(m.displayName)}</span>
                      <strong style={m.active ? undefined : { color: 'var(--muted)' }}>{m.displayName}</strong>
                    </span>
                    <span className={`chip ${m.active ? 'is-open' : 'is-done'}`}>
                      <span className="dot" aria-hidden="true" />
                      {m.active ? 'Active' : 'Paused'}
                    </span>
                    <span className="roster-actions">
                      <Button onClick={() => { setEditingId(m.id); setEditName(m.displayName); }}>Rename</Button>
                      {m.active ? (
                        <Button onClick={() => void setActive(m, false)}>Pause</Button>
                      ) : (
                        <Button onClick={() => void setActive(m, true)}>Reactivate</Button>
                      )}
                      <Button className="danger" onClick={() => setRemovingId(m.id)}>Remove</Button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
