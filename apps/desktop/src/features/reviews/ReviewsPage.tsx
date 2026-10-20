import type { WorkspaceRuntime } from '@los/app-services';
import { SectionSubNav } from '../../shell/SectionSubNav';
import { MonthlyReviewPage } from './MonthlyReviewPage';
import { PlanningHistoryPanel } from './PlanningHistoryPanel';
import { ReviewsCalendar } from './ReviewsCalendar';

export type ReviewsSection = 'reviews-monthly' | 'reviews-history' | 'reviews-calendar';

type Props = {
  rt: WorkspaceRuntime;
  section: ReviewsSection;
  onSection: (id: ReviewsSection) => void;
};

export function ReviewsPage({ rt, section, onSection }: Props) {
  return (
    <section className="stack">
      <h1>Look back</h1>
      <p className="lede">
        See what you planned, what actually happened, and the weeks you have already closed. Nothing here changes your history, it is just for looking.
      </p>
      <SectionSubNav
        label="Reviews sections"
        items={[
          { id: 'reviews-calendar', label: 'Calendar' },
          { id: 'reviews-monthly', label: 'Monthly' },
          { id: 'reviews-history', label: 'Planning history' },
        ]}
        activeId={section}
        onSelect={(id) => onSection(id as ReviewsSection)}
      />
      {section === 'reviews-calendar' ? (
        <ReviewsCalendar rt={rt} />
      ) : section === 'reviews-monthly' ? (
        <MonthlyReviewPage rt={rt} />
      ) : (
        <PlanningHistoryPanel rt={rt} />
      )}
    </section>
  );
}
