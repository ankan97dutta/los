import type { WorkspaceRuntime } from '@los/app-services';
import { SectionSubNav } from '../../shell/SectionSubNav';
import { MonthlyReviewPage } from './MonthlyReviewPage';
import { PlanningHistoryPanel } from './PlanningHistoryPanel';

type Props = {
  rt: WorkspaceRuntime;
  section: 'reviews-monthly' | 'reviews-history';
  onSection: (id: 'reviews-monthly' | 'reviews-history') => void;
};

export function ReviewsPage({ rt, section, onSection }: Props) {
  return (
    <section className="stack">
      <h1>Reviews</h1>
      <p className="lede">Monthly review and closed-period history.</p>
      <SectionSubNav
        label="Reviews sections"
        items={[
          { id: 'reviews-monthly', label: 'Monthly' },
          { id: 'reviews-history', label: 'Planning history' },
        ]}
        activeId={section}
        onSelect={(id) => onSection(id as 'reviews-monthly' | 'reviews-history')}
      />
      {section === 'reviews-monthly' ? (
        <MonthlyReviewPage rt={rt} />
      ) : (
        <PlanningHistoryPanel rt={rt} />
      )}
    </section>
  );
}
