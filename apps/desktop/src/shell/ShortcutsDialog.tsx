import { useEffect, useRef } from 'react';

type Props = { open: boolean; onClose: () => void };

const ROWS: Array<[string, string]> = [
  ['⌘K / Ctrl+K', 'Command palette'],
  ['⌘1 to ⌘6 / Ctrl+1 to Ctrl+6', 'Jump to Today, Inbox, Planning, Team, Reviews, or Settings'],
  ['?', 'This shortcuts dialog (when not typing)'],
  ['↑ / ↓', 'Move between sidebar items, work rows, and palette results'],
  ['← / →', 'Move between section tabs'],
  ['Enter / Space', 'Activate the focused control; Enter saves single-line edits'],
  ['C · K · X · R', 'Inbox item focused: Convert · Keep for later · Dismiss · Return to inbox'],
  ['Esc', 'Close palette, dialog, detail panel, or cancel an inline edit'],
  ['Tab / Shift+Tab', 'Move through every control in a predictable order'],
];

export function ShortcutsDialog({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open ]);
  if (!open) return null;
  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="palette-panel" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"
        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}
      >
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>Keyboard shortcuts</strong>
          <button ref={closeRef} type="button" className="ghost" onClick={onClose} aria-label="Close shortcuts dialog">✕</button>
        </div>
        <p className="muted">Every action in LOS can be reached by keyboard. Focus is always visible; anything important asks you to confirm right on the page, so you never need a mouse for a dialog.</p>
        <table className="shortcuts-table">
          <tbody>
            {ROWS.map(([keys, action]) => (
              <tr key={action}><td><kbd>{keys}</kbd></td><td>{action}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
