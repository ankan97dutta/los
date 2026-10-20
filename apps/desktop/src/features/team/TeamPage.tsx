import type { WorkspaceRuntime } from '@los/app-services';
import { ApplicationsPage } from '../applications/ApplicationsPage';
import { SectionSubNav } from '../../shell/SectionSubNav';
import { TeamRosterPanel } from './TeamRosterPanel';

type Props = {
  rt: WorkspaceRuntime;
  section: 'team-roster' | 'team-apps';
  onSection: (id: 'team-roster' | 'team-apps') => void;
};

export function TeamPage({ rt, section, onSection }: Props) {
  return (
    <section className="stack">
      <h1>Team</h1>
      <p className="lede">Local roster and threads.</p>
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
