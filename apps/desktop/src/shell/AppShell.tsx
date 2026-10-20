import type { ReactNode } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { LocalStatus } from '../features/status/LocalStatus';
import { Nav } from './Nav';
import { ROUTE_TITLES, type PrimaryRouteId, type RouteId } from './routes';

type Props = {
  rt: WorkspaceRuntime;
  route: RouteId;
  inboxCount?: number;
  onNavigatePrimary: (id: PrimaryRouteId) => void;
  onCommandPalette: () => void;
  onQuickCapture: () => void;
  notices?: ReactNode;
  children: ReactNode;
};

export function AppShell({ rt, route, inboxCount, onNavigatePrimary, onCommandPalette, onQuickCapture, notices, children }: Props) {
  const meta = ROUTE_TITLES[route] ?? { title: 'LOS', context: '' };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">LOS</span>
          <div>
            <div className="brand">LOS</div>
            <p className="brand-tag">Lead Operating System</p>
          </div>
          <span className="local-pill" title="Data stored on this device">Local</span>
        </div>
        <Nav route={route} inboxCount={inboxCount} onNavigate={onNavigatePrimary} onCommandPalette={onCommandPalette} />
        <div className="sidebar-status">
          <p className="muted" style={{ margin: '0 0 0.3rem', fontSize: '0.78rem' }}>
            <span className="ok-dot" aria-hidden="true">●</span> Private workspace
            <br />
            <span style={{ fontSize: '0.72rem' }}>Data stored on this device</span>
          </p>
          <LocalStatus rt={rt} />
        </div>
      </aside>
      <div className="main">
        <header className="page-header">
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }} aria-hidden="true">{meta.title}</span>
          {meta.context ? <span className="header-context">{meta.context}</span> : null}
          <div className="header-actions">
            <button type="button" className="ghost" onClick={onCommandPalette} aria-label="Open command palette">
              Search / commands <kbd aria-hidden="true">⌘K</kbd>
            </button>
            <button type="button" className="primary" onClick={onQuickCapture}>+ Quick capture</button>
          </div>
        </header>
        <main className="main-inner">
          {notices}
          <div key={route} className="main-fade">{children}</div>
        </main>
      </div>
    </div>
  );
}
