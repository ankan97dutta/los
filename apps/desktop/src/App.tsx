import { useEffect, useMemo, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { createBrowserRuntime } from './lib/runtime';
import { LocalStatus } from './features/status/LocalStatus';
import { InboxPage } from './features/inbox/InboxPage';
import { QuickCapture } from './features/inbox/QuickCapture';
import { ActionsPage } from './features/actions/ActionsPage';
import { ApplicationsPage } from './features/applications/ApplicationsPage';
import { DailyReviewPage } from './features/reviews/DailyReviewPage';
import { FortnightPlanPage } from './features/reviews/FortnightPlanPage';
import { MonthlyReviewPage } from './features/reviews/MonthlyReviewPage';
import { SettingsPage } from './features/settings/SettingsPage';

type Route =
  | 'inbox'
  | 'actions'
  | 'applications'
  | 'daily'
  | 'fortnight'
  | 'monthly'
  | 'settings'
  | 'quick';

const NAV: { id: Route; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'actions', label: 'Actions' },
  { id: 'applications', label: 'Applications' },
  { id: 'daily', label: 'Daily' },
  { id: 'fortnight', label: 'Fortnight' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'settings', label: 'Settings' },
];

declare global {
  interface Window {
    __TAURI__?: unknown;
    __LOS_CAPS__?: {
      trayAvailable?: boolean;
      globalShortcutAvailable?: boolean;
      globalShortcutRegistered?: boolean;
    };
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    new URLSearchParams(window.location.search).get('view') === 'quick' ? 'quick' : 'inbox',
  );
  const [tick, setTick] = useState(0);

  const rt: WorkspaceRuntime = useMemo(() => {
    const caps = window.__LOS_CAPS__ ?? {};
    const inTauri = Boolean(window.__TAURI__);
    return createBrowserRuntime({
      trayAvailable: caps.trayAvailable ?? inTauri,
      globalShortcutAvailable: caps.globalShortcutAvailable ?? inTauri,
      globalShortcutRegistered: caps.globalShortcutRegistered ?? false,
    });
  }, [tick]);

  useEffect(() => {
    const onCaps = (e: Event) => {
      const detail = (e as CustomEvent).detail as Window['__LOS_CAPS__'];
      window.__LOS_CAPS__ = { ...window.__LOS_CAPS__, ...detail };
      setTick((t) => t + 1);
    };
    const onQuick = () => setRoute('quick');
    window.addEventListener('los:caps', onCaps);
    window.addEventListener('los:quick-capture', onQuick);
    return () => {
      window.removeEventListener('los:caps', onCaps);
      window.removeEventListener('los:quick-capture', onQuick);
    };
  }, []);

  if (route === 'quick') {
    return (
      <QuickCapture
        rt={rt}
        onDone={() => {
          setRoute('inbox');
          if (window.location.search.includes('view=quick')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">LOS</div>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Lead OS · offline workspace
        </p>
        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={route === item.id ? 'active' : undefined}
              aria-current={route === item.id ? 'page' : undefined}
              onClick={() => setRoute(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <LocalStatus rt={rt} />
        </div>
      </aside>
      <main className="main">
        {route === 'inbox' ? <InboxPage rt={rt} onConverted={() => setRoute('actions')} /> : null}
        {route === 'actions' ? <ActionsPage rt={rt} /> : null}
        {route === 'applications' ? <ApplicationsPage rt={rt} /> : null}
        {route === 'daily' ? <DailyReviewPage rt={rt} /> : null}
        {route === 'fortnight' ? <FortnightPlanPage rt={rt} /> : null}
        {route === 'monthly' ? <MonthlyReviewPage rt={rt} /> : null}
        {route === 'settings' ? <SettingsPage rt={rt} /> : null}
      </main>
    </div>
  );
}
