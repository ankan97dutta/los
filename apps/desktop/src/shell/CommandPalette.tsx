import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../ui/EmptyState';
import type { RouteId } from './routes';

export type PaletteAction = {
  id: string;
  label: string;
  run: 'navigate' | 'quick-capture';
  route?: RouteId;
};

type Props = {
  open: boolean;
  actions: PaletteAction[];
  onClose: () => void;
  onRun: (action: PaletteAction) => void;
};

export function CommandPalette({ open, actions, onClose, onRun }: Props) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="palette-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="palette-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const action = filtered[index];
            if (action) onRun(action);
          }
        }}
      >
        <label className="field" htmlFor="palette-filter">
          <span className="muted">Jump to…</span>
          <input
            id="palette-filter"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter commands"
            aria-label="Filter commands"
          />
        </label>
        {filtered.length === 0 ? (
          <EmptyState title="No matching commands" actionHint="Try another filter or press Escape to close." />
        ) : (
          <ul className="palette-list" role="listbox" aria-label="Commands">
            {filtered.map((action, i) => (
              <li key={action.id} role="option" aria-selected={i === index}>
                <button
                  type="button"
                  aria-selected={i === index}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => onRun(action)}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const DEFAULT_PALETTE_ACTIONS: PaletteAction[] = [
  { id: 'nav-today', label: 'Go to Today', run: 'navigate', route: 'today' },
  { id: 'nav-inbox', label: 'Go to Inbox', run: 'navigate', route: 'inbox' },
  { id: 'nav-actions', label: 'Go to Personal Actions', run: 'navigate', route: 'actions' },
  { id: 'nav-planning', label: 'Go to Planning / Capacity', run: 'navigate', route: 'planning-capacity' },
  { id: 'nav-team', label: 'Go to Team', run: 'navigate', route: 'team-roster' },
  { id: 'nav-reviews', label: 'Go to Reviews', run: 'navigate', route: 'reviews-monthly' },
  { id: 'nav-settings', label: 'Go to Settings', run: 'navigate', route: 'settings' },
  { id: 'quick', label: 'Quick Capture', run: 'quick-capture' },
];
