import { useEffect, useState, type ReactNode } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { bootWorkspaceRuntime, type BootNotice } from './lib/runtime';
import { InboxPage } from './features/inbox/InboxPage';
import { QuickCapture } from './features/inbox/QuickCapture';
import { ActionsPage } from './features/actions/ActionsPage';
import { DailyReviewPage } from './features/reviews/DailyReviewPage';
import { FortnightPlanPage } from './features/reviews/FortnightPlanPage';
import { ReviewsPage } from './features/reviews/ReviewsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { DbOpenError } from './features/status/DbOpenError';
import { CapacityPlanPage } from './features/planning/CapacityPlanPage';
import { TeamPage } from './features/team/TeamPage';
import { AppShell } from './shell/AppShell';
import {
  CommandPalette,
  DEFAULT_PALETTE_ACTIONS,
  type PaletteAction,
} from './shell/CommandPalette';
import { SectionSubNav } from './shell/SectionSubNav';
import { defaultChild, type PrimaryRouteId, type RouteId } from './shell/routes';
import { initTheme } from './ui/theme';

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
  const [route, setRoute] = useState<RouteId>(() =>
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
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function navigatePrimary(id: PrimaryRouteId) {
    setRoute(defaultChild(id));
  }

  function runPalette(action: PaletteAction) {
    setPaletteOpen(false);
    if (action.run === 'quick-capture') {
      setRoute('quick');
      return;
    }
    if (action.route) setRoute(action.route);
  }

  if (bootError) {
    return <DbOpenError error={bootError} />;
  }

  if (!rt) {
    return (
      <p className="muted" style={{ padding: '2rem' }}>
        Opening local database…
      </p>
    );
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

  const noticesNode = notices.map((n, i) => (
    <p key={`${n.kind}-${i}`} className={n.kind === 'error' ? 'error' : 'muted'} role="status">
      {n.text}
    </p>
  ));

  let content: ReactNode = null;
  if (route === 'today') {
    content = <DailyReviewPage rt={rt} />;
  } else if (route === 'inbox' || route === 'actions') {
    content = (
      <section className="stack">
        <SectionSubNav
          label="Inbox sections"
          items={[
            { id: 'inbox', label: 'Inbox' },
            { id: 'actions', label: 'Actions' },
          ]}
          activeId={route}
          onSelect={(id) => setRoute(id as RouteId)}
        />
        {route === 'inbox' ? (
          <InboxPage rt={rt} onConverted={() => setRoute('actions')} />
        ) : (
          <ActionsPage rt={rt} />
        )}
      </section>
    );
  } else if (route === 'planning-capacity' || route === 'planning-fortnight') {
    content = (
      <section className="stack">
        <SectionSubNav
          label="Planning sections"
          items={[
            { id: 'planning-capacity', label: 'Capacity' },
            { id: 'planning-fortnight', label: 'Fortnight' },
          ]}
          activeId={route}
          onSelect={(id) => setRoute(id as RouteId)}
        />
        {route === 'planning-capacity' ? (
          <CapacityPlanPage rt={rt} />
        ) : (
          <FortnightPlanPage rt={rt} />
        )}
      </section>
    );
  } else if (route === 'team-roster' || route === 'team-apps') {
    content = (
      <TeamPage
        rt={rt}
        section={route}
        onSection={(id) => setRoute(id)}
      />
    );
  } else if (route === 'reviews-monthly' || route === 'reviews-history') {
    content = (
      <ReviewsPage
        rt={rt}
        section={route}
        onSection={(id) => setRoute(id)}
      />
    );
  } else if (route === 'settings') {
    content = <SettingsPage rt={rt} onRestored={() => setReloadKey((k) => k + 1)} />;
  }

  return (
    <>
      <AppShell rt={rt} route={route} onNavigatePrimary={navigatePrimary} notices={noticesNode}>
        {content}
      </AppShell>
      <CommandPalette
        open={paletteOpen}
        actions={DEFAULT_PALETTE_ACTIONS}
        onClose={() => setPaletteOpen(false)}
        onRun={runPalette}
      />
    </>
  );
}
