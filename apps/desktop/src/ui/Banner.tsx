import type { ReactNode } from 'react';

type Tone = 'error' | 'warning' | 'info';

const LABELS: Record<Tone, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

type Props = {
  tone?: Tone;
  children: ReactNode;
  title?: string;
};

export function Banner({ tone = 'info', title, children }: Props) {
  const color =
    tone === 'error'
      ? 'var(--status-danger)'
      : tone === 'warning'
        ? 'var(--status-warning)'
        : 'var(--accent)';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        border: `1px solid ${color}`,
        borderLeftWidth: 4,
        borderRadius: 'var(--radius)',
        padding: '0.65rem 0.85rem',
        background: 'color-mix(in srgb, var(--bg-elevated) 70%, transparent)',
      }}
    >
      <strong style={{ color }}>{title ?? LABELS[tone]}: </strong>
      <span>{children}</span>
    </div>
  );
}
