import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { ReportDraft, ReportPeriod, ReportSection, ReportType } from '@los/domain';
import { api } from '../../lib/api';

type Props = { rt: WorkspaceRuntime };

export function ReportsPanel({ rt }: Props) {
  const [type, setType] = useState<ReportType>(() => (localStorage.getItem('los.reports.lastType') as ReportType) || 'mbr');
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [periodStart, setPeriodStart] = useState<string>(() => localStorage.getItem('los.reports.lastPeriod') ?? '');
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newHeading, setNewHeading] = useState('');

  useEffect(() => {
    void (async () => {
      const r = await api.reportPeriods(rt, type);
      if (!r.ok) return;
      setPeriods(r.data.periods);
      const wanted = periodStart && r.data.periods.some((p) => p.periodStart === periodStart) ? periodStart : r.data.periods[0]?.periodStart ?? '';
      setPeriodStart(wanted);
      if (wanted) {
        const existing = await api.reportGet(rt, type, wanted);
        if (existing.ok && existing.data.draft) { setDraft(existing.data.draft); setSections(existing.data.sections); }
        else { setDraft(null); setSections([]); }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt, type]);

  function pickType(next: ReportType) {
    setType(next);
    localStorage.setItem('los.reports.lastType', next);
    setPeriodStart('');
    setDraft(null); setSections([]);
  }
  function pickPeriod(next: string) {
    setPeriodStart(next);
    localStorage.setItem('los.reports.lastPeriod', next);
    setDraft(null); setSections([]);
    void api.reportGet(rt, type, next).then((r) => { if (r.ok && r.data.draft) { setDraft(r.data.draft); setSections(r.data.sections); } });
  }

  async function generate() {
    setError(null);
    const r = await api.reportGenerate(rt, type, periodStart);
    if (!r.ok) { setError(r.error.message); return; }
    setDraft(r.data.draft); setSections(r.data.sections);
    setMessage('Draft ready. Read it, change what you need, then copy or print it.');
  }
  async function save(patch: Parameters<typeof api.reportSaveEdits>[1]) {
    if (!draft) return;
    const r = await api.reportSaveEdits(rt, patch);
    if (!r.ok) { setError(r.error.message); return; }
    setDraft(r.data.draft); setSections(r.data.sections);
  }
  async function refresh() {
    if (!draft) return;
    const r = await api.reportRefresh(rt, draft.id);
    if (!r.ok) { setError(r.error.message); return; }
    setDraft(r.data.draft); setSections(r.data.sections);
    setMessage(r.data.updatedSectionKeys.length ? `Updated: ${r.data.updatedSectionKeys.join(', ')}. Your edited sections were kept.` : 'Everything was already up to date. Your edited sections were kept.');
  }
  async function copy() {
    if (!draft) return;
    const r = await api.reportCopy(rt, draft.id);
    if (!r.ok) { setError(r.error.message); return; }
    await navigator.clipboard.writeText(r.data.text);
    setMessage('Report copied. Paste it wherever you share it.');
  }

  const period = periods.find((p) => p.periodStart === periodStart);

  return (
    <section className="stack">
      <p className="lede">A first draft from what is already in LOS. You are the author. The app drafts, you decide.</p>
      <div className="row" role="group" aria-label="Report type">
        <button type="button" className={type === 'mbr' ? 'primary' : ''} onClick={() => pickType('mbr')}>Monthly (MBR)</button>
        <button type="button" className={type === 'qbr' ? 'primary' : ''} onClick={() => pickType('qbr')}>Quarterly (QBR)</button>
        <label className="field">Period
          <select value={periodStart} onChange={(e) => pickPeriod(e.target.value)} aria-label="Report period">
            {periods.map((p) => <option key={p.periodStart} value={p.periodStart}>{p.label}{p.periodComplete ? '' : ' (still running)'}</option>)}
          </select>
        </label>
        {!draft ? <button type="button" className="primary" onClick={() => void generate()}>Generate report</button> : null}
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="muted" role="status">{message}</p> : null}
      {draft ? (
        <>
          {period && !period.periodComplete ? <p role="status">Covers {period.periodStart} to today. This period is still running.</p> : null}
          <div className="row">
            <button type="button" onClick={() => void refresh()}>Refresh from latest data</button>
            <button type="button" onClick={() => void copy()}>Copy report</button>
            <button type="button" onClick={() => window.print()}>Print</button>
          </div>
          <article className="report-article">
            <label className="field">Title
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} onBlur={() => void save({ draftId: draft.id, title: draft.title })} />
            </label>
            <label className="field">Opening summary
              <textarea rows={4} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} onBlur={() => void save({ draftId: draft.id, summary: draft.summary })} />
            </label>
            {sections.filter((s) => !s.removed).map((s) => (
              <div key={s.id} className="report-section">
                <h3>{s.heading}{s.edited ? ' (edited)' : ''}</h3>
                <textarea rows={5} value={s.body} aria-label={s.heading}
                  onChange={(e) => setSections(sections.map((x) => x.id === s.id ? { ...x, body: e.target.value } : x))}
                  onBlur={() => void save({ draftId: draft.id, sections: [{ sectionKey: s.sectionKey, body: s.body }] })} />
                <div className="row">
                  <button type="button" onClick={() => {
                    if (s.edited && !window.confirm('Remove this section? You have edited it. You can undo right after.')) return;
                    void save({ draftId: draft.id, removeSectionKey: s.sectionKey }).then(() => setMessage('Section removed.'));
                  }}>Remove section</button>
                </div>
              </div>
            ))}
            {sections.some((s) => s.removed) ? (
              <div className="row">
                {sections.filter((s) => s.removed).map((s) => (
                  <button key={s.id} type="button" onClick={() => void save({ draftId: draft.id, undoRemoveSectionKey: s.sectionKey })}>Undo remove {s.heading}</button>
                ))}
              </div>
            ) : null}
            <div className="row">
              <input value={newHeading} onChange={(e) => setNewHeading(e.target.value)} placeholder="New section heading" aria-label="New section heading" />
              <button type="button" onClick={() => { if (newHeading.trim()) { void save({ draftId: draft.id, addSection: { heading: newHeading.trim(), body: '' } }); setNewHeading(''); } }}>Add section</button>
            </div>
            <p className="muted" role="status">Saved on this device.</p>
          </article>
        </>
      ) : (
        <p className="muted">No draft for this period yet. Generate one and it will be saved here.</p>
      )}
    </section>
  );
}
