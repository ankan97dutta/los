import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from './lib/api';
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
import { ShortcutsDialog } from './shell/ShortcutsDialog';
import { Tour, markTourSeen, tourSeen } from './shell/Tour';
import { defaultChild, type PrimaryRouteId, type RouteId } from './shell/routes';
import { isTauriRuntime } from './lib/isTauri';
import { FocusOverlay, type FocusSeed } from './features/focus/FocusOverlay';
import { FiredPhases, formatClock, remainingFor } from './features/focus/focusView';
import { notifyFocusEnded } from './lib/focusNotify';
import type { FocusSession } from '@los/domain';

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
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
    new URLSearchParams(window.location.search).get('view') === 'quick' ? 'quick' : 'today',
  );
  const [inboxCount, setInboxCount] = useState(0);
  const [rt, setRt] = useState<WorkspaceRuntime | null>(null);
  const [bootError, setBootError] = useState<{
    code: string;
    message: string;
    dbPath?: string;
  } | null>(null);
  const [notices, setNotices] = useState<BootNotice[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusSeed, setFocusSeed] = useState<FocusSeed | undefined>(undefined);
  const [activeFocus, setActiveFocus] = useState<FocusSession | null>(null);
  const firedRef = useRef(new FiredPhases());

  useEffect(() => {
    const onOpenFocus = (e: Event) => {
      const detail = (e as CustomEvent<FocusSeed | undefined>).detail;
      setFocusSeed(detail);
      setFocusOpen(true);
    };
    window.addEventListener('los:open-focus', onOpenFocus);
    return () => window.removeEventListener('los:open-focus', onOpenFocus);
  }, []);

  // App-level watcher: reconcile, live chip, single-fire end alert when overlay closed.
  useEffect(() => {
    if (!rt) return;
    let cancelled = false;
    const tick = async () => {
      const r = await api.focusGetActive(rt);
      if (cancelled || !r.ok) return;
      const s = r.data.session;
      setActiveFocus(s);
      if (!s) return;
      if (focusOpen) return; // overlay owns alerts while open
      if (s.status !== 'focusDone' && s.status !== 'breakDone') return;
      if (!firedRef.current.shouldFire(s.id, s.status)) return;
      firedRef.current.mark(s.id, s.status);
      const sr = await api.settingsGet(rt);
      const st = sr.ok ? sr.data.settings : null;
      if (!st?.focusNotificationsEnabled) return;
      void notifyFocusEnded({
        phase: s.status === 'focusDone' ? 'focus' : 'break',
        taskLabel: s.taskLabel,
        includeTask: Boolean(st.focusNotificationsIncludeTask),
        enabled: true,
      });
    };
    void tick();
    const id = setInterval(() => { void tick(); }, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [rt, focusOpen]);

  useEffect(() => {
    let cancelled = false;
    const caps = window.__LOS_CAPS__ ?? {};
    const inTauri = isTauriRuntime();
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

  // T102: honor persisted shortcut settings at startup. Rust setup()
  // registers a hardcoded default before the DB is readable, so after
  // boot we re-register with the saved WorkspaceSettings values.
  const shortcutAppliedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!rt || !isTauriRuntime()) return;
    const key = `${rt.dbPath ?? ''}#${reloadKey}`;
    if (shortcutAppliedFor.current === key) return;
    shortcutAppliedFor.current = key;
    let cancelled = false;
    void (async () => {
      const r = await api.settingsGet(rt);
      if (!r.ok || cancelled) return;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke<{ registered: boolean; error?: string | null }>(
          'shortcuts_reregister',
          {
            enabled: r.data.settings.globalShortcutEnabled,
            accel: r.data.settings.globalShortcutAccel,
          },
        );
        if (cancelled) return;
        setRt((prev) =>
          prev
            ? {
                ...prev,
                globalShortcutAvailable: true,
                globalShortcutRegistered: result.registered,
                globalShortcutError: result.error ?? undefined,
              }
            : prev,
        );
      } catch {
        // Registration failure is surfaced via LocalStatus; capture stays usable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rt, reloadKey]);

  useEffect(() => {
    if (!rt) return;
    let cancelled = false;
    void api.inboxListOpen(rt).then((r) => {
      if (!cancelled && r.ok) setInboxCount(r.data.items.length);
    });
    return () => { cancelled = true; };
  }, [rt, route, reloadKey]);

  useEffect(() => {
    const digitRoute: Record<string, PrimaryRouteId> = {
      '1': 'today', '2': 'inbox', '3': 'planning', '4': 'team', '5': 'reviews', '6': 'settings',
    };
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      const target = digitRoute[e.key];
      if (target && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setRoute(defaultChild(target));
      }
    };
    const onHelpKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (e.key === '?' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    const onOpenShortcuts = () => setShortcutsOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', onHelpKey);
    window.addEventListener('los:open-shortcuts', onOpenShortcuts);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', onHelpKey);
      window.removeEventListener('los:open-shortcuts', onOpenShortcuts);
    };
  }, []);

  function navigatePrimary(id: PrimaryRouteId) {
    setRoute(defaultChild(id));
  }

  // First run: offer the tour once (dismissing marks it seen).
  const tourOffered = useRef(false);
  useEffect(() => {
    if (rt && !tourOffered.current) {
      tourOffered.current = true;
      if (!tourSeen()) setTourOpen(true);
    }
  }, [rt]);

  useEffect(() => {
    const onStartTour = () => setTourOpen(true);
    window.addEventListener('los:start-tour', onStartTour);
    return () => window.removeEventListener('los:start-tour', onStartTour);
  }, []);

  function runPalette(action: PaletteAction) {
    setPaletteOpen(false);
    if (action.run === 'quick-capture') {
      setRoute('quick');
      return;
    }
    if (action.run === 'shortcuts') {
      setShortcutsOpen(true);
      return;
    }
    if (action.run === 'tour') {
      setTourOpen(true);
      return;
    }
    if (action.run === 'focus') {
      setFocusSeed(undefined);
      setFocusOpen(true);
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
            { id: 'planning-capacity', label: 'Weekly capacity' },
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
  } else if (route === 'reviews-monthly' || route === 'reviews-history' || route === 'reviews-calendar' || route === 'reviews-reports') {
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

  const focusChip = activeFocus ? (
    <button
      type="button"
      className="focus-chip"
      onClick={() => { setFocusSeed(undefined); setFocusOpen(true); }}
      aria-label={`Reopen focus timer. ${activeFocus.taskLabel}, ${formatClock(remainingFor(activeFocus, new Date().toISOString()))} left`}
    >
      <span className="focus-chip__dot" aria-hidden="true" />
      <span>{activeFocus.status === 'paused' ? 'Paused' : activeFocus.status === 'breakRunning' ? 'On a break' : activeFocus.status === 'focusDone' ? 'Focus block done' : activeFocus.status === 'breakDone' ? 'Break done' : 'Focusing'}</span>
      <span className="focus-chip__time">{formatClock(remainingFor(activeFocus, new Date().toISOString()))}</span>
    </button>
  ) : null;

  return (
    <>
      <AppShell
        rt={rt}
        route={route}
        inboxCount={inboxCount}
        onNavigatePrimary={navigatePrimary}
        onCommandPalette={() => setPaletteOpen(true)}
        onQuickCapture={() => setRoute('quick')}
        notices={noticesNode}
        focusChip={focusChip}
      >
        {content}
      </AppShell>
      <FocusOverlay
        rt={rt}
        open={focusOpen}
        seed={focusSeed ?? null}
        onClose={() => setFocusOpen(false)}
      />
      <CommandPalette
        open={paletteOpen}
        actions={DEFAULT_PALETTE_ACTIONS}
        onClose={() => setPaletteOpen(false)}
        onRun={runPalette}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Tour
        open={tourOpen}
        onNavigate={(r) => setRoute(r)}
        onClose={() => { markTourSeen(); setTourOpen(false); }}
      />
    </>
  );
}
