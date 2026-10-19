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

  const load = useCallback(async () => {
    const r = await api.planningMembersList(rt);
    if (r.ok) setMembers(r.data.members);
  }, [rt]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    const r = await api.planningMemberUpsert(rt, { displayName: name });
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setName('');
    setError(null);
    await load();
  }

  return (
    <div className="stack">
      <p className="muted">
        Manage capacity roster members. Per-period hours are edited under Planning.
      </p>
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="row">
        <Field
          id="roster-name"
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add();
          }}
        />
        <Button variant="primary" onClick={() => void add()}>
          Add member
        </Button>
      </div>
      {members.length === 0 ? (
        <EmptyState title="No team members yet" actionHint="Add a display name to build the local roster." />
      ) : (
        <ul className="list">
          {members.map((m) => (
            <li key={m.id}>
              <strong>{m.displayName}</strong>
              <span className="muted"> · {m.active ? 'active' : 'inactive'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
