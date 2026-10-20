import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';
import { capabilityLines, isTauriRuntime } from './capabilityPhrases';

type Props = { rt: WorkspaceRuntime };

export function LocalStatus({ rt }: Props) {
  const [tray, setTray] = useState(false);
  const [shortcutAvail, setShortcutAvail] = useState(false);
  const [shortcutReg, setShortcutReg] = useState(false);
  const [shortcutError, setShortcutError] = useState<string | undefined>();
  const [dbPath, setDbPath] = useState<string | undefined>();
  const inTauri = isTauriRuntime();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await api.workspaceStatus(rt);
      if (!r.ok || cancelled) return;
      setTray(r.data.trayAvailable);
      setShortcutAvail(r.data.globalShortcutAvailable);
      setShortcutReg(r.data.globalShortcutRegistered);
      setShortcutError(r.data.globalShortcutError);
      setDbPath(r.data.dbPath);

      // T101: in Tauri, the runtime object is a boot snapshot. Ask Rust
      // for the live registration state so a successful registration
      // does not keep rendering as "registration failed".
      if (inTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const status = await invoke<{
            globalShortcutAvailable?: boolean;
            globalShortcutRegistered?: boolean;
            globalShortcutError?: string | null;
          }>('workspace_status');
          if (cancelled) return;
          setShortcutAvail(status.globalShortcutAvailable ?? true);
          setShortcutReg(status.globalShortcutRegistered ?? false);
          setShortcutError(status.globalShortcutError ?? undefined);
        } catch {
          // Keep runtime snapshot on failure.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rt, inTauri]);

  const lines = capabilityLines({
    inTauri,
    trayAvailable: tray,
    globalShortcutAvailable: shortcutAvail,
    globalShortcutRegistered: shortcutReg,
    globalShortcutError: shortcutError,
  });

  return (
    <div className="stack" style={{ gap: '0.35rem' }}>
      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }} title="No cloud account or remote sync">
        Local only
      </p>
      <p className="muted" style={{ margin: 0, fontSize: '0.75rem' }} role="status">
        {lines.tray}
        <br />
        {lines.shortcut}
        {dbPath ? (
          <>
            <br />
            DB: <code style={{ fontSize: '0.7rem' }}>{dbPath}</code>
          </>
        ) : null}
      </p>
    </div>
  );
}
