import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../ui/EmptyState';
import type { RouteId } from './routes';

export type PaletteAction = {
  id: string;
  label: string;
  group: 'Navigate' | 'Capture';
  hint?: string;
  run: 'navigate' | 'quick-capture' | 'shortcuts' | 'tour';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => `${a.group} ${a.label}`.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (open) { setQuery(''); setIndex(0); inputRef.current?.focus(); }
  }, [open ]);
  useEffect(() => { setIndex(0); }, [query]);
  if (!open) return null;

  const groups: Array<PaletteAction['group']> = ['Navigate', 'Capture'];

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="palette-panel" role="dialog" aria-modal="true" aria-label="Command palette"
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0))); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); const a = filtered[index]; if (a) onRun(a); }
        }}
      >
        <label className="field" htmlFor="palette-filter">
          <span className="muted">Search for apps and commands…</span>
          <input ref={inputRef} id="palette-filter" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Go to…, Capture…" aria-label="Filter commands" />
        </label>
        {filtered.length === 0 ? (
          <EmptyState title="No matching commands" actionHint="Try another filter or press Escape to close." />
        ) : (
          <div className="palette-list" role="listbox" aria-label="Commands">
            {groups.map((group) => {
              const items = filtered.filter((a) => a.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <div className="palette-group" aria-hidden="true">{group}</div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {items.map((action) => {
                      const flatIndex = filtered.indexOf(action);
                      return (
                        <li key={action.id} role="option" aria-selected={flatIndex === index}>
                          <button type="button" aria-selected={flatIndex === index} onMouseEnter={() => setIndex(flatIndex)} onClick={() => onRun(action)}>
                            <span>{action.label}</span>
                            {action.hint ? <kbd className="palette-hint" aria-hidden="true">{action.hint}</kbd> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.75rem' }}>↑↓ navigate · Enter select · Esc close</p>
      </div>
    </div>
  );
}

export const DEFAULT_PALETTE_ACTIONS: PaletteAction[] = [
  { id: 'nav-today', label: 'Go to Today', group: 'Navigate', hint: '⌘1', run: 'navigate', route: 'today' },
  { id: 'nav-inbox', label: 'Go to Inbox', group: 'Navigate', hint: '⌘2', run: 'navigate', route: 'inbox' },
  { id: 'nav-actions', label: 'Go to Personal Actions', group: 'Navigate', run: 'navigate', route: 'actions' },
  { id: 'nav-planning', label: 'Go to Planning / Capacity', group: 'Navigate', hint: '⌘3', run: 'navigate', route: 'planning-capacity' },
  { id: 'nav-team', label: 'Go to Team', group: 'Navigate', hint: '⌘4', run: 'navigate', route: 'team-roster' },
  { id: 'nav-reviews', label: 'Go to Reviews & history', group: 'Navigate', hint: '⌘5', run: 'navigate', route: 'reviews-monthly' },
  { id: 'nav-settings', label: 'Go to Settings', group: 'Navigate', hint: '⌘6', run: 'navigate', route: 'settings' },
  { id: 'quick', label: 'Quick Capture', group: 'Capture', run: 'quick-capture' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', group: 'Capture', hint: '?', run: 'shortcuts' },
  { id: 'tour', label: 'Start UI tour', group: 'Capture', run: 'tour' },
];
