import { useCallback, useEffect, useRef, useState } from 'react';
import type { RouteId } from './routes';

export type TourStep = {
  route: RouteId;
  selector?: string;
  title: string;
  body: string;
};

export const TOUR_STEPS: TourStep[] = [
  { route: 'today', selector: '[data-tour="nav"]', title: 'Your command center', body: 'Everything lives in the same six places. Press ⌘1 to ⌘6 (Ctrl+1 to Ctrl+6) to jump around, or use the arrow keys in the sidebar.' },
  { route: 'today', selector: '[data-tour="quick-capture"]', title: 'Capture from anywhere', body: 'Quick Capture (also ⌘K → Quick Capture, the global shortcut, or the tray icon) drops anything into the Inbox. Get it down first, sort it out later.' },
  { route: 'today', selector: '[data-tour="palette"]', title: 'Command palette', body: '⌘K / Ctrl+K searches every destination and action. Type to filter, ↑↓ to move, Enter to go. Press ? any time for all shortcuts.' },
  { route: 'today', selector: 'main', title: 'Today: your daily brief', body: 'Three questions: What must I move forward? Who is blocked? What decision is waiting? It saves as you type, so just keep writing and watch for Saved.' },
  { route: 'inbox', selector: '#inbox-capture', title: 'Inbox triage', body: 'New captures land in Needs triage. Convert turns one into a personal action, Keep for later parks it out of the way, Dismiss drops it. Focus an item and press C, K, or X.' },
  { route: 'planning-capacity', selector: '.summary-strip', title: 'Weekly planning', body: 'Net capacity, committed load, and how many hours are left this week, always in view. If nobody has estimated something yet, it says Unknown, never 0h.' },
  { route: 'planning-capacity', selector: '.planning-layout', title: 'Workload & work items', body: 'Bars show how loaded each person is, and anyone over capacity is called out in plain words. Click any piece of work to fix its priority, estimate, thread, or blockers in the side panel, without losing your place. When you close a week, we walk you through the warnings first.' },
  { route: 'team-apps', selector: 'main', title: 'Team & Threads', body: 'Roster members can be added, renamed, deactivated, or removed. Threads are your projects, and they work the same way. If a thread or a person is already tied to work, we will not let you remove them by accident.' },
  { route: 'settings', selector: 'main', title: 'Settings, backup & reset', body: 'Theme, week start, shortcuts, backups, and starting over from scratch all live here. Everything stays on this device. No account, no cloud.' },
];

type Props = {
  open: boolean;
  onNavigate: (route: RouteId) => void;
  onClose: (completed: boolean) => void;
};

export function Tour({ open, onNavigate, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const measure = useCallback(() => {
    const current = TOUR_STEPS[step];
    if (!current?.selector) { setRect(null); return; }
    const el = document.querySelector(current.selector);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const current = TOUR_STEPS[step];
    if (current) onNavigate(current.route);
    const t1 = window.setTimeout(measure, 120);
    const t2 = window.setTimeout(measure, 400);
    nextRef.current?.focus();
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, measure]);

  if (!open) return null;
  const current = TOUR_STEPS[step]!;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="tour-root">
      {rect ? (
        <div
          className="tour-highlight" aria-hidden="true"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      ) : null}
      <div
        className="tour-card" role="dialog" aria-modal="false" aria-label={`Tour step ${step + 1} of ${TOUR_STEPS.length}: ${current.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onClose(false); }
          if (e.key === 'ArrowRight' && !isLast) setStep((s) => s + 1);
          if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
        }}
      >
        <p className="tour-count">Step {step + 1} / {TOUR_STEPS.length}</p>
        <h2 style={{ margin: '0.1rem 0 0.35rem' }}>{current.title}</h2>
        <p className="muted" style={{ margin: 0 }}>{current.body}</p>
        <div className="tour-progress" aria-hidden="true">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'tour-dot is-active' : 'tour-dot'} />
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 'var(--space-3)' }}>
          <button type="button" className="ghost" onClick={() => onClose(false)}>Skip tour</button>
          <span className="row">
            <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Back</button>
            {isLast ? (
              <button ref={nextRef} type="button" className="primary" onClick={() => onClose(true)}>Done</button>
            ) : (
              <button ref={nextRef} type="button" className="primary" onClick={() => setStep((s) => s + 1)}>Next →</button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

const SEEN_KEY = 'los.ui.tourSeen';
export function tourSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}
export function markTourSeen(): void {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
}
