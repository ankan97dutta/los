import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { ApplicationsPage } from '../applications/ApplicationsPage';
import { SectionSubNav } from '../../shell/SectionSubNav';
import { TeamRosterPanel } from './TeamRosterPanel';

type Props = {
  rt: WorkspaceRuntime;
  section: 'team-roster' | 'team-apps';
  onSection: (id: 'team-roster' | 'team-apps') => void;
};

export function TeamPage({ rt, section, onSection }: Props) {
  const [counts, setCounts] = useState<{ people: number; threads: number } | null>(null);
  useEffect(() => {
    void (async () => {
      const [m, a] = await Promise.all([api.planningMembersList(rt), api.applicationsList(rt)]);
      setCounts({ people: m.ok ? m.data.members.length : 0, threads: a.ok ? a.data.applications.length : 0 });
    })();
  }, [rt, section]);
  return (
    <section className="stack">
      <h1>Team</h1>
      <p className="lede">The people you plan with, and the threads their work belongs to. It all stays on this device.</p>
      {counts ? <p className="lede" aria-live="polite">{counts.people} people on the roster, {counts.threads} threads. Pick a section below to work on either list.</p> : null}
      <SectionSubNav
        label="Team sections"
        items={[
          { id: 'team-roster', label: 'Roster' },
          { id: 'team-apps', label: 'Threads' },
        ]}
        activeId={section}
        onSelect={(id) => onSection(id as 'team-roster' | 'team-apps')}
      />
      {section === 'team-roster' ? <TeamRosterPanel rt={rt} /> : <ApplicationsPage rt={rt} />}
    </section>
  );
}
