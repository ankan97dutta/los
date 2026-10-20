import { FormEvent, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';

type Props = { rt: WorkspaceRuntime; onDone?: () => void };

/** Compact capture used by tray / global shortcut flow (US7). */
export function QuickCapture({ rt, onDone }: Props) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await api.inboxCapture(rt, description);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setDescription('');
    onDone?.();
  }

  return (
    <form className="stack panel" onSubmit={onSubmit} style={{ margin: '1rem', maxWidth: 420 }}>
      <h1>Quick capture</h1>
      <p className="lede">One quick note. Press Enter to save it, Escape to cancel.</p>
      <label htmlFor="quick-capture" className="muted">
        Inbox item
      </label>
      <textarea
        id="quick-capture"
        autoFocus
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
          if (e.key === 'Escape') onDone?.();
        }}
        rows={3}
      />
      <div className="row">
        <button type="submit" className="primary">
          Capture
        </button>
        <button type="button" onClick={() => onDone?.()}>
          Cancel
        </button>
        {error ? <span className="error">{error}</span> : null}
      </div>
    </form>
  );
}
