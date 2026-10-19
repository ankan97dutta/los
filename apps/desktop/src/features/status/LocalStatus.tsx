import { useEffect, useState } from 'react';
import type { WorkspaceRuntime } from '@los/app-services';
import { api } from '../../lib/api';

type Props = { rt: WorkspaceRuntime };

export function LocalStatus({ rt }: Props) {
  const [tray, setTray] = useState(false);
  const [shortcutAvail, setShortcutAvail] = useState(false);
  const [shortcutReg, setShortcutReg] = useState(false);
  const [shortcutError, setShortcutError] = useState<string | undefined>();
  const [dbPath, setDbPath] = useState<string | undefined>();

  useEffect(() => {
    void api.workspaceStatus(rt).then((r) => {
      if (!r.ok) return;
      setTray(r.data.trayAvailable);
      setShortcutAvail(r.data.globalShortcutAvailable);
      setShortcutReg(r.data.globalShortcutRegistered);
      setShortcutError(r.data.globalShortcutError);
      setDbPath(r.data.dbPath);
    });
  }, [rt]);

  return (
    <div className="stack" style={{ gap: '0.4rem' }}>
      <span className="status-pill" title="No cloud account or remote sync">
        <span className="dot" aria-hidden />
        Local only
      </span>
      <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
        Tray: {tray ? 'available' : 'unavailable'}
        <br />
        Shortcut:{' '}
        {shortcutReg
          ? 'registered'
          : shortcutAvail
            ? `unavailable${shortcutError ? ` (${shortcutError})` : ''}`
            : 'unavailable'}
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
