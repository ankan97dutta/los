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

  useEffect(() => {
    if (!announcement) return;
    const t = window.setTimeout(() => setAnnouncement(''), 3200);
    return () => window.clearTimeout(t);
  }, [announcement]);

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
    // Optimistic: move the item immediately, roll back if persistence fails.
    const prevItems = items;
    const prevKept = kept;
    if (disposition === 'keep') {
      setItems((list) => list.filter((i) => i.id !== item.id));
      setKept((list) => [{ ...item, status: 'kept' }, ...list]);
    } else if (disposition === 'reopen') {
      setKept((list) => list.filter((i) => i.id !== item.id));
      setItems((list) => [{ ...item, status: 'open' }, ...list]);
    } else {
      setItems((list) => list.filter((i) => i.id !== item.id));
      setKept((list) => list.filter((i) => i.id !== item.id));
    }
    const r = await api.inboxTriage(rt, item.id, disposition);
    if (!r.ok) {
      setItems(prevItems);
      setKept(prevKept);
      setError(`${r.error.message} (change rolled back)`);
      return;
    }
    setAnnouncement(`“${item.description}”: ${DISPOSITION_LABEL[disposition]}.`);
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

  function whenLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return sameDay ? `Today at ${time}` : `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at ${time}`;
  }

  function renderItem(item: InboxItem) {
    const isKept = item.status === 'kept';
    return (
      <li key={item.id} className="inbox-row">
        <span className={`inbox-avatar ${isKept ? 'is-kept' : ''}`} aria-hidden="true">{isKept ? '◷' : '↓'}</span>
        <div
          tabIndex={0}
          role="group"
          aria-label={`Inbox item: ${item.description}. Press C to convert, ${isKept ? 'R to return to inbox' : 'K to keep for later'}, X to dismiss.`}
          onKeyDown={(e) => onItemKeyDown(e, item)}
          style={{ minWidth: 0, borderRadius: 'var(--radius)' }}
        >
          <div className="item-title">{item.description}</div>
          <div className="captured-meta">
            <span className={`chip ${isKept ? '' : 'is-open'}`}>
              <span className="dot" aria-hidden="true" />
              {isKept ? 'Parked for later' : 'Needs a decision'}
            </span>{' '}
            Captured {whenLabel(item.capturedAt)}
          </div>
        </div>
        <div className="inbox-actions">
          <button type="button" className="primary icon-btn" onClick={() => void triage(item, 'convert')}>Make it an action <kbd aria-hidden="true">C</kbd></button>
          {isKept ? (
            <button type="button" className="icon-btn" onClick={() => void triage(item, 'reopen')}>Back to inbox <kbd aria-hidden="true">R</kbd></button>
          ) : (
            <button type="button" className="icon-btn" onClick={() => void triage(item, 'keep')}>Keep for later <kbd aria-hidden="true">K</kbd></button>
          )}
          <button type="button" className="icon-btn danger" onClick={() => void triage(item, 'dismiss')}>Dismiss <kbd aria-hidden="true">X</kbd></button>
        </div>
      </li>
    );
  }

  return (
    <section className="stack">
      <div>
        <h1>Inbox</h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          Get it down first, sort it out later. Click any item, then press <kbd>C</kbd> to make it an action, <kbd>K</kbd> to park it, or <kbd>X</kbd> to dismiss it. You can also Tab to the buttons.
        </p>
      </div>
      <p className="lede" aria-live="polite">{items.length} waiting for a decision{items.length ? `. Next up: ${items[0].description}` : '. Nothing is waiting on you.'}</p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {announcement ? <div className="toast" role="presentation">{announcement}</div> : null}

      <form className="create-bar" onSubmit={onSubmit}>
        <div style={{ flex: '1 1 16rem' }}>
          <TextAreaField
            id="inbox-capture"
            label="Jot something down"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
            placeholder="What needs attention? Do not worry about wording, just get it down."
            rows={2}
          />
          <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.79rem' }}>Press Enter to save it here. Shift+Enter for a new line.</p>
        </div>
        <Button variant="primary" type="submit" disabled={!description.trim()}>Capture</Button>
      </form>
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div>
        <div className="list-head">
          <h2>Needs your call</h2>
          <span className="count-chip num">{items.length}</span>
          {items.length > 0 ? <span className="muted">Decide what each one becomes.</span> : null}
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="All caught up"
            actionHint={kept.length > 0 ? 'Nice and clear. Anything you parked is waiting below whenever you want it.' : 'Nothing is waiting on you. Jot something above when it pops up and it will land here first.'}
          />
        ) : (
          <ul className="item-list">{items.map(renderItem)}</ul>
        )}
      </div>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 550 }}>Kept for later</summary>
      <div>
        <div className="list-head">
          <h2>Kept for later</h2>
          <span className="count-chip num">{kept.length}</span>
          {kept.length > 0 ? <span className="muted">Parked on purpose, out of your way.</span> : null}
        </div>
        {kept.length === 0 ? (
          <EmptyState title="Nothing parked here yet" actionHint="When something can wait, use Keep for later (K) and it will sit here quietly instead of nagging you in the list above." />
        ) : (
          <ul className="item-list">{kept.map(renderItem)}</ul>
        )}
      </div>
      </details>
    </section>
  );
}
