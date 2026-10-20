import { PRIMARY_NAV, type PrimaryRouteId, primaryOf, type RouteId } from './routes';

type Props = {
  route: RouteId;
  inboxCount?: number;
  onNavigate: (id: PrimaryRouteId) => void;
  onCommandPalette: () => void;
};

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
}

export function Nav({ route, inboxCount = 0, onNavigate, onCommandPalette }: Props) {
  const activePrimary = primaryOf(route);
  const mod = isMac() ? '⌘' : 'Ctrl+';
  const groups: Array<{ id: 'workspace' | 'system'; label: string }> = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'system', label: 'System' },
  ];
  function onNavKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? Math.min(idx + 1, buttons.length - 1) : Math.max(idx - 1, 0);
    buttons[next]?.focus();
  }

  return (
    <nav className="nav" aria-label="Primary" onKeyDown={onNavKeyDown}>
      {groups.map((group) => (
        <div key={group.id}>
          <div className="nav-group-label" aria-hidden="true">{group.label}</div>
          {PRIMARY_NAV.filter((i) => i.group === group.id).map((item) => (
            <button
              key={item.id}
              type="button"
              className={activePrimary === item.id ? 'active' : undefined}
              aria-current={activePrimary === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span>{item.label}</span>
              {item.id === 'inbox' && inboxCount > 0 ? (
                <span className="nav-count" aria-label={`${inboxCount} open inbox items`}>{inboxCount}</span>
              ) : item.shortcutDigit ? (
                <kbd className="nav-hint" aria-hidden="true">{mod}{item.shortcutDigit}</kbd>
              ) : null}
            </button>
          ))}
          {group.id === 'system' ? (
            <button type="button" onClick={onCommandPalette}>
              <span>Command palette</span>
              <kbd className="nav-hint" aria-hidden="true">{mod}K</kbd>
            </button>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
