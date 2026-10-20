type Props = {
  error: { code: string; message: string; dbPath?: string };
};

/** Blocking recoverable UI for DB_OPEN_FAILED (FR-H04). */
export function DbOpenError({ error }: Props) {
  return (
    <div className="app-shell" style={{ padding: '2rem', maxWidth: 640 }}>
      <h1>Cannot open workspace database</h1>
      <p role="alert" className="error">
        {error.code}: {error.message}
      </p>
      {error.dbPath ? (
        <p>
          Path: <code>{error.dbPath}</code>
        </p>
      ) : null}
      <p className="lede">
        The existing file was left unchanged (no silent reseed). Quit the app, copy a known-good
        backup over this path, or fix the file and restore from Settings, then relaunch.
      </p>
      <p className="muted">
        Single-writer: do not run two LOS instances against the same database file.
      </p>
    </div>
  );
}
