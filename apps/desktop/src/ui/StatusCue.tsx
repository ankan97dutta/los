type Kind = 'ok' | 'warning' | 'danger' | 'unknown' | 'conflicted' | 'offline' | 'muted';

type Props = {
  kind: Kind;
  label: string;
};

const COLOR: Record<Kind, string> = {
  ok: 'var(--status-ok)',
  warning: 'var(--status-warning)',
  danger: 'var(--status-danger)',
  unknown: 'var(--status-unknown)',
  conflicted: 'var(--status-conflicted)',
  offline: 'var(--status-muted)',
  muted: 'var(--status-muted)',
};

export function StatusCue({ kind, label }: Props) {
  return (
    <span
      className="status-pill"
      role="status"
      style={{ borderColor: COLOR[kind], color: 'var(--text)' }}
    >
      <span className="dot" style={{ background: COLOR[kind] }} aria-hidden />
      {label}
    </span>
  );
}
