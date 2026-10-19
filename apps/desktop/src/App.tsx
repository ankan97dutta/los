import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { bootWorkspaceRuntime, type BootNotice } from './lib/runtime';
import { LocalStatus } from './features/status/LocalStatus';
import { InboxPage } from './features/inbox/InboxPage';
import { QuickCapture } from './features/inbox/QuickCapture';
import { ActionsPage } from './features/actions/ActionsPage';
import { ApplicationsPage } from './features/applications/ApplicationsPage';
import { DailyReviewPage } from './features/reviews/DailyReviewPage';
import { FortnightPlanPage } from './features/reviews/FortnightPlanPage';
import { MonthlyReviewPage } from './features/reviews/MonthlyReviewPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { DbOpenError } from './features/status/DbOpenError';

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
      error?: string;
    };
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    new URLSearchParams(window.location.search).get('view') === 'quick' ? 'quick' : 'inbox',
  );
  const [rt, setRt] = useState<WorkspaceRuntime | null>(null);
  const [bootError, setBootError] = useState<{
    code: string;
    message: string;
    dbPath?: string;
  } | null>(null);
  const [notices, setNotices] = useState<BootNotice[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const caps = window.__LOS_CAPS__ ?? {};
    const inTauri = Boolean(window.__TAURI__);
    void bootWorkspaceRuntime({
      trayAvailable: caps.trayAvailable ?? inTauri,
      globalShortcutAvailable: caps.globalShortcutAvailable ?? inTauri,
      globalShortcutRegistered: caps.globalShortcutRegistered ?? false,
      globalShortcutError: caps.error,
    }).then((result) => {
      if (cancelled) return;
      setNotices(result.notices);
      if (result.ok) {
        setBootError(null);
        setRt(result.rt);
      } else {
        setBootError(result.error);
        setRt(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const onCaps = (e: Event) => {
      const detail = (e as CustomEvent).detail as Window['__LOS_CAPS__'];
      window.__LOS_CAPS__ = { ...window.__LOS_CAPS__, ...detail };
      setRt((prev) =>
        prev
          ? {
              ...prev,
              trayAvailable: detail?.trayAvailable ?? prev.trayAvailable,
              globalShortcutAvailable:
                detail?.globalShortcutAvailable ?? prev.globalShortcutAvailable,
              globalShortcutRegistered:
                detail?.globalShortcutRegistered ?? prev.globalShortcutRegistered,
              globalShortcutError: detail?.error ?? prev.globalShortcutError,
            }
          : prev,
      );
    };
    const onQuick = () => setRoute('quick');
    window.addEventListener('los:caps', onCaps);
    window.addEventListener('los:quick-capture', onQuick);
    return () => {
      window.removeEventListener('los:caps', onCaps);
      window.removeEventListener('los:quick-capture', onQuick);
    };
  }, []);

  if (bootError) {
    return <DbOpenError error={bootError} />;
  }

  if (!rt) {
    return <p className="muted" style={{ padding: '2rem' }}>Opening local database…</p>;
  }

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
        {notices.map((n, i) => (
          <p key={`${n.kind}-${i}`} className={n.kind === 'error' ? 'error' : 'muted'} role="status">
            {n.text}
          </p>
        ))}
        {route === 'inbox' ? <InboxPage rt={rt} onConverted={() => setRoute('actions')} /> : null}
        {route === 'actions' ? <ActionsPage rt={rt} /> : null}
        {route === 'applications' ? <ApplicationsPage rt={rt} /> : null}
        {route === 'daily' ? <DailyReviewPage rt={rt} /> : null}
        {route === 'fortnight' ? <FortnightPlanPage rt={rt} /> : null}
        {route === 'monthly' ? <MonthlyReviewPage rt={rt} /> : null}
        {route === 'settings' ? (
          <SettingsPage rt={rt} onRestored={() => setReloadKey((k) => k + 1)} />
        ) : null}
      </main>
    </div>
  );
}
