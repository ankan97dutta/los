import type { ReactNode } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { LocalStatus } from '../features/status/LocalStatus';
import { Nav } from './Nav';
import type { PrimaryRouteId, RouteId } from './routes';

type Props = {
  rt: WorkspaceRuntime;
  route: RouteId;
  onNavigatePrimary: (id: PrimaryRouteId) => void;
  notices?: ReactNode;
  children: ReactNode;
};

export function AppShell({ rt, route, onNavigatePrimary, notices, children }: Props) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">LOS</div>
          <p className="brand-tag">Local-first</p>
        </div>
        <Nav route={route} onNavigate={onNavigatePrimary} />
        <div className="sidebar-status">
          <LocalStatus rt={rt} />
        </div>
      </aside>
      <main className="main">
        {notices}
        <div key={route} className="main-fade">
          {children}
        </div>
      </main>
    </div>
  );
}
