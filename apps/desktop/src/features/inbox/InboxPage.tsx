import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import type { InboxItem } from '@los/domain';
import { api } from '../../lib/api';

type Props = { rt: WorkspaceRuntime; onConverted?: () => void };

export function InboxPage({ rt, onConverted }: Props) {
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await api.inboxListOpen(rt);
    if (r.ok) setItems(r.data.items);
  }, [rt]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api.inboxCapture(rt, description);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setDescription('');
    await refresh();
  }

  async function triage(id: string, disposition: 'convert' | 'dismiss' | 'keep') {
    setError(null);
    const r = await api.inboxTriage(rt, id, disposition);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    await refresh();
    if (disposition === 'convert') onConverted?.();
  }

  return (
    <section className="stack">
      <h1>Inbox</h1>
      <p className="lede">Capture requests quickly. Newest first. Keyboard: Tab to field, Enter to submit.</p>

      <form className="stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="inbox-capture">New item</label>
          <textarea
            id="inbox-capture"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="What needs attention?"
            rows={3}
          />
        </div>
        <div className="row">
          <button type="submit" className="primary">
            Capture
          </button>
          {error ? <span className="error" role="alert">{error}</span> : null}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="empty">Inbox is empty. Capture a request to get started.</div>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <li key={item.id}>
              <div>{item.description}</div>
              <p className="muted" style={{ margin: '0.35rem 0 0.6rem' }}>
                {new Date(item.capturedAt).toLocaleString()}
              </p>
              <div className="row">
                <button type="button" onClick={() => void triage(item.id, 'convert')}>
                  Convert
                </button>
                <button type="button" onClick={() => void triage(item.id, 'dismiss')} className="danger">
                  Dismiss
                </button>
                <button type="button" onClick={() => void triage(item.id, 'keep')}>
                  Keep
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
