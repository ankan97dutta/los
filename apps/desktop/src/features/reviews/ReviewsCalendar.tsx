import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { StatusCue } from '../../ui/StatusCue';

type Props = { rt: WorkspaceRuntime };

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type WeekdayName = (typeof WEEKDAYS)[number];

type DayInfo = {
  date: string;
  hasBrief: boolean;
  nextCount: number;
  blocked: boolean;
  snippet: string;
};

type PeriodInfo = { periodStart: string; periodEnd: string; status: 'open' | 'closed'; conflicted: boolean };

function iso(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const month = d.getMonth() + 1;
  return `${d.getFullYear()}-${month < 10 ? '0' : ''}${month}`;
}

function prettyDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

/** Month calendar for reviews: daily briefs, weekly plan closures, monthly review. */
export function ReviewsCalendar({ rt }: Props) {
  const today = api.localToday();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [weekStart, setWeekStart] = useState<WeekdayName>('mon');
  const [days, setDays] = useState<Map<string, DayInfo>>(new Map());
  const [periods, setPeriods] = useState<PeriodInfo[]>([]);
  const [monthlyText, setMonthlyText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const dates: string[] = [];
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) dates.push(iso(d));

    const settingsRes = await api.settingsGet(rt);
    const startName = (settingsRes.ok ? settingsRes.data.settings.fortnightStartWeekday : 'mon') as WeekdayName;
    setWeekStart(startName);

    const [dailyResults, monthlyRes] = await Promise.all([
      Promise.all(dates.map(async (date) => {
        const r = await api.dailyGet(rt, date);
        return { date, r };
      })),
      api.monthlyGet(rt, month),
    ]);

    const nextDays = new Map<string, DayInfo>();
    for (const { date, r } of dailyResults) {
      if (!r.ok || !r.data.review) continue;
      const review = r.data.review;
      const lines = review.nextActionLines?.filter((l) => l.text.trim()) ?? [];
      const hasBrief = Boolean(review.outcomes.trim() || review.blockers.trim() || review.followUps.trim() || lines.length);
      if (!hasBrief) continue;
      nextDays.set(date, {
        date,
        hasBrief: true,
        nextCount: lines.length,
        blocked: Boolean(review.blockers.trim()),
        snippet: lines[0]?.text || review.outcomes.trim() || review.followUps.trim() || review.blockers.trim(),
      });
    }
    setDays(nextDays);
    setMonthlyText(monthlyRes.ok ? monthlyRes.data.review?.improvementPriorities ?? '' : '');

    // One period lookup per distinct week that touches this month.
    const startIndex = WEEKDAYS.indexOf(startName);
    const weekStarts = new Map<string, string>();
    for (const date of dates) {
      const d = new Date(`${date}T00:00:00`);
      const jsDay = (d.getDay() + 6) % 7; // Monday = 0
      const offset = (jsDay - startIndex + 7) % 7;
      const ws = new Date(d);
      ws.setDate(d.getDate() - offset);
      weekStarts.set(iso(ws), date);
    }
    const periodResults = await Promise.all(
      [...weekStarts.keys()].map(async (ws) => {
        const r = await api.planningPeriodGet(rt, ws);
        return r.ok ? {
          periodStart: r.data.period.periodStart,
          periodEnd: r.data.period.periodEnd,
          status: r.data.period.status,
          conflicted: r.data.period.planConflicted,
        } : null;
      }),
    );
    setPeriods(periodResults.filter((p): p is PeriodInfo => Boolean(p)));
    if (!settingsRes.ok) setError(settingsRes.error.message);
    setLoading(false);
  }, [rt, month]);

  useEffect(() => { void load(); }, [load]);

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const startIndex = WEEKDAYS.indexOf(weekStart);
    const jsFirst = (first.getDay() + 6) % 7;
    const lead = (jsFirst - startIndex + 7) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return iso(d);
    });
  }, [month, weekStart]);

  const dowLabels = useMemo(() => {
    const startIndex = WEEKDAYS.indexOf(weekStart);
    return Array.from({ length: 7 }, (_, i) => WEEKDAYS[(startIndex + i) % 7]);
  }, [weekStart]);

  const periodFor = (date: string) => periods.find((p) => date >= p.periodStart && date <= p.periodEnd);
  const selectedDay = days.get(selected);
  const selectedPeriod = periodFor(selected);
  const monthTitle = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="row">
          <Button onClick={() => setMonth((v) => addMonths(v, -1))}>Previous</Button>
          <strong style={{ minWidth: '9rem', textAlign: 'center' }}>{monthTitle}</strong>
          <Button onClick={() => setMonth((v) => addMonths(v, 1))}>Next</Button>
          <Button onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }}>Today</Button>
        </div>
        <span className="muted" aria-live="polite">
          {monthlyText.trim() ? 'You wrote a monthly review for this month.' : 'No monthly review for this month yet.'}
        </span>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="calendar-legend" aria-label="What the colours mean">
        <span><span className="legend-swatch swatch-brief" aria-hidden="true" />You wrote a brief</span>
        <span><span className="legend-swatch swatch-blocked" aria-hidden="true" />Blockers noted</span>
        <span><span className="legend-swatch swatch-closed" aria-hidden="true" />Week closed</span>
        <span><span className="legend-swatch swatch-conflicted" aria-hidden="true" />Week closed with warnings</span>
        <span><span className="legend-swatch swatch-monthly" aria-hidden="true" />Monthly review written</span>
        <span><span className="legend-swatch swatch-open" aria-hidden="true" />Week still open</span>
      </div>

      <div className="calendar-layout">
        <div className="calendar" aria-busy={loading || undefined}>
          <div className="calendar-grid" role="grid" aria-label={`Calendar for ${monthTitle}`}>
            {dowLabels.map((d) => <div key={d} className="calendar-dow" role="columnheader">{d}</div>)}
            {cells.map((date) => {
              const inMonth = date.startsWith(month);
              const info = days.get(date);
              const period = periodFor(date);
              const isWeekStart = period?.periodStart === date;
              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  aria-pressed={selected === date}
                  aria-label={`${prettyDay(date)}${info ? ', has a daily brief' : ''}${period?.status === 'closed' ? ', week closed' : ''}`}
                  className={`calendar-cell ${inMonth ? '' : 'is-outside'} ${date === today ? 'is-today' : ''} ${selected === date ? 'is-selected' : ''} ${info ? 'has-brief' : ''} ${info?.blocked ? 'has-blocked' : ''} ${period?.status === 'closed' ? 'is-closed-week' : ''}`}
                  onClick={() => setSelected(date)}
                >
                  <span className="calendar-day num">{Number(date.slice(8, 10))}</span>
                  <span className="calendar-markers">
                    {info ? <span className="marker marker-brief">Brief</span> : null}
                    {info?.blocked ? <span className="marker marker-blocked">Blocked</span> : null}
                    {date.endsWith('-01') && monthlyText.trim() ? <span className="marker marker-monthly">Monthly review</span> : null}
                    {isWeekStart && period?.status === 'closed' ? <span className="marker marker-closed">Week closed</span> : null}
                    {isWeekStart && period?.conflicted ? <span className="marker marker-conflicted">Conflicted</span> : null}
                    {isWeekStart && period && period.status !== 'closed' ? <span className="marker">Week open</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel" aria-label={`Details for ${prettyDay(selected)}`} style={{ alignSelf: 'start' }}>
          <h2 style={{ marginTop: 0 }}>{prettyDay(selected)}</h2>
          {selectedDay ? (
            <div className="stack" style={{ gap: 'var(--space-2)' }}>
              <span className="chip is-open"><span className="dot" style={{ background: 'var(--accent)' }} aria-hidden="true" />Daily brief written</span>
              {selectedDay.blocked ? <span className="chip"><span className="dot" style={{ background: 'var(--status-danger)' }} aria-hidden="true" />Blockers were noted</span> : null}
              <p style={{ margin: 0 }}>{selectedDay.snippet}</p>
              <p className="muted" style={{ margin: 0 }}>
                {selectedDay.nextCount} next {selectedDay.nextCount === 1 ? 'action' : 'actions'}
                {selectedDay.blocked ? ', with blockers noted.' : '.'}
              </p>
            </div>
          ) : (
            <EmptyState title="No brief for this day" actionHint="Open Today and write a few lines, then it will show up here." />
          )}
          {selectedPeriod ? (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <p className="muted" style={{ margin: '0 0 var(--space-2)' }}>
                That week ({selectedPeriod.periodStart} to {selectedPeriod.periodEnd}):
              </p>
              <div className="row">
                <StatusCue kind={selectedPeriod.status === 'closed' ? 'muted' : 'ok'} label={selectedPeriod.status === 'closed' ? 'Closed' : 'Still open'} />
                {selectedPeriod.conflicted ? <StatusCue kind="conflicted" label="Conflicted" /> : null}
              </div>
            </div>
          ) : null}
          {monthlyText.trim() ? (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <p className="muted" style={{ margin: '0 0 var(--space-2)' }}>Monthly review for {monthTitle}:</p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{monthlyText}</p>
            </div>
          ) : null}
        </aside>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Pick any day to see what you wrote. The colours match the legend above, so a quick glance tells you which days you showed up and which weeks you closed.
      </p>
    </div>
  );
}
