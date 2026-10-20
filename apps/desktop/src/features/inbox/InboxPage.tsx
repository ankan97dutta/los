import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { InboxItem } from '@los/domain';
import { api } from '../../lib/api';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { TextAreaField } from '../../ui/Field';

type Props = { rt: WorkspaceRuntime; onConverted?: () => void };
type Disposition = 'convert' | 'dismiss' | 'keep' | 'reopen';

const DISPOSITION_LABEL: Record<Disposition, string> = {
  convert: 'Converted to a personal action',
  dismiss: 'Dismissed',
  keep: 'Kept for later',
  reopen: 'Returned to inbox',
};

export function InboxPage({ rt, onConverted }: Props) {
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [kept, setKept] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const refresh = useCallback(async () => {
    const [open, keptRes] = await Promise.all([api.inboxListOpen(rt), api.inboxListKept(rt)]);
    if (open.ok) setItems(open.data.items);
    if (keptRes.ok) setKept(keptRes.data.items);
  }, [rt]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api.inboxCapture(rt, description);
    if (!r.ok) { setError(r.error.message); return; }
    setDescription('');
    setAnnouncement('Captured to inbox');
    await refresh();
  }

  async function triage(item: InboxItem, disposition: Disposition) {
    setError(null);
    const r = await api.inboxTriage(rt, item.id, disposition);
    if (!r.ok) { setError(r.error.message); return; }
    setAnnouncement(`“${item.description}” — ${DISPOSITION_LABEL[disposition]}.`);
    await refresh();
    if (disposition === 'convert') onConverted?.();
  }

  function onItemKeyDown(e: React.KeyboardEvent, item: InboxItem) {
    if (e.target !== e.currentTarget) return; // let buttons/inputs handle their own keys
    const key = e.key.toLowerCase();
    if (key === 'c') { e.preventDefault(); void triage(item, 'convert'); }
    else if (key === 'x') { e.preventDefault(); void triage(item, 'dismiss'); }
    else if (key === 'k' && item.status === 'open') { e.preventDefault(); void triage(item, 'keep'); }
    else if (key === 'r' && item.status === 'kept') { e.preventDefault(); void triage(item, 'reopen'); }
  }

  function renderItem(item: InboxItem) {
    const isKept = item.status === 'kept';
    return (
      <li key={item.id}>
        <div
          tabIndex={0}
          role="group"
          aria-label={`Inbox item: ${item.description}. Press C to convert, ${isKept ? 'R to return to inbox' : 'K to keep for later'}, X to dismiss.`}
          onKeyDown={(e) => onItemKeyDown(e, item)}
          style={{ borderRadius: 'var(--radius)', padding: '0.2rem 0.3rem', margin: '0 -0.3rem' }}
        >
          <div>{item.description}</div>
          <p className="muted" style={{ margin: '0.35rem 0 0.6rem' }}>
            {isKept ? `Kept for later · captured ${new Date(item.capturedAt).toLocaleString()}` : new Date(item.capturedAt).toLocaleString()}
          </p>
          <div className="row">
            <button type="button" onClick={() => void triage(item, 'convert')}>Convert <kbd aria-hidden="true">C</kbd></button>
            {isKept ? (
              <button type="button" onClick={() => void triage(item, 'reopen')}>Return to inbox <kbd aria-hidden="true">R</kbd></button>
            ) : (
              <button type="button" onClick={() => void triage(item, 'keep')}>Keep for later <kbd aria-hidden="true">K</kbd></button>
            )}
            <button type="button" onClick={() => void triage(item, 'dismiss')} className="danger">Dismiss <kbd aria-hidden="true">X</kbd></button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <section className="stack">
      <h1>Inbox</h1>
      <p className="lede">Capture first, classify later. Focus an item and press <kbd>C</kbd> convert · <kbd>K</kbd> keep for later · <kbd>X</kbd> dismiss — or Tab to its buttons.</p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      <form className="stack" onSubmit={onSubmit}>
        <TextAreaField
          id="inbox-capture" label="New item" value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          placeholder="What needs attention?" rows={3}
        />
        <div className="row">
          <Button variant="primary" type="submit">Capture</Button>
          {error ? <Banner tone="error">{error}</Banner> : null}
        </div>
      </form>

      <h2>Needs triage ({items.length})</h2>
      {items.length === 0 ? (
        <EmptyState title="Nothing needs triage" actionHint={kept.length > 0 ? 'Review kept items below, or capture something new above.' : 'Capture a request above — it lands here first.'} />
      ) : (
        <ul className="list">{items.map(renderItem)}</ul>
      )}

      <h2>Kept for later ({kept.length})</h2>
      {kept.length === 0 ? (
        <EmptyState title="Nothing kept" actionHint="Use “Keep for later” (K) on an item to park it here, out of your triage list." />
      ) : (
        <ul className="list">{kept.map(renderItem)}</ul>
      )}
    </section>
  );
}
