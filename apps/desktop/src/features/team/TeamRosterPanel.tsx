import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { TeamMember } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Field } from '../../ui/Field';

type Props = { rt: WorkspaceRuntime };

export function TeamRosterPanel({ rt }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const load = useCallback(async () => {
    const r = await api.planningMembersList(rt);
    if (r.ok) setMembers(r.data.members);
  }, [rt]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    const r = await api.planningMemberUpsert(rt, { displayName: name });
    if (!r.ok) { setError(r.error.message); return; }
    setName(''); setError(null);
    setAnnouncement(`${r.data.member.displayName} added to the roster.`);
    await load();
  }

  async function rename(member: TeamMember) {
    const r = await api.planningMemberUpsert(rt, { id: member.id, displayName: editName, active: member.active });
    if (!r.ok) { setError(r.error.message); return; }
    setEditingId(null); setError(null);
    setAnnouncement(`Renamed to ${editName}.`);
    await load();
  }

  async function setActive(member: TeamMember, active: boolean) {
    const r = await api.planningMemberUpsert(rt, { id: member.id, displayName: member.displayName, active });
    if (!r.ok) { setError(r.error.message); return; }
    setError(null);
    setAnnouncement(active ? `${member.displayName} reactivated.` : `${member.displayName} deactivated — existing allocations stay, new ones are blocked.`);
    await load();
  }

  return (
    <div className="stack">
      <p className="muted">Add, rename, or deactivate roster members. Deactivation keeps history and existing allocations; it only blocks new allocations. Per-period hours are edited under Planning.</p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {error ? <Banner tone="error">{error}</Banner> : null}
      <form className="row" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Field id="roster-name" label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="primary" type="submit">Add member</Button>
      </form>
      {members.length === 0 ? (
        <EmptyState title="No team members yet" actionHint="Add a display name above to build the local roster." />
      ) : (
        <ul className="list">
          {members.map((m) => (
            <li key={m.id}>
              {editingId === m.id ? (
                <form className="row" onSubmit={(e) => { e.preventDefault(); void rename(m); }}>
                  <label className="field"><span className="field-label">Display name</span>
                    <input autoFocus value={editName} aria-label={`Rename ${m.displayName}`} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); } }} />
                  </label>
                  <Button variant="primary" type="submit">Save</Button>
                  <Button onClick={() => setEditingId(null)}>Cancel <kbd aria-hidden="true">Esc</kbd></Button>
                </form>
              ) : (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span><strong style={m.active ? undefined : { color: 'var(--muted)' }}>{m.displayName}</strong>
                    <span className="muted"> · {m.active ? 'active' : 'inactive'}</span></span>
                  <span className="row">
                    <Button onClick={() => { setEditingId(m.id); setEditName(m.displayName); }}>Rename</Button>
                    {m.active ? (
                      <Button className="danger" onClick={() => void setActive(m, false)}>Deactivate</Button>
                    ) : (
                      <Button onClick={() => void setActive(m, true)}>Reactivate</Button>
                    )}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
