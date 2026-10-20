import type { AutosaveStatus } from '../lib/autosave';

export type SaveStatus = 'idle' | 'pending' | 'saved' | 'failed';

type Props = {
  status: SaveStatus | AutosaveStatus;
  message?: string | null;
};

function mapStatus(status: SaveStatus | AutosaveStatus): SaveStatus {
  switch (status) {
    case 'unsaved':
    case 'saving':
    case 'pending':
      return 'pending';
    case 'error':
    case 'failed':
      return 'failed';
    case 'saved':
      return 'saved';
    case 'idle':
    default:
      return 'idle';
  }
}

const LABELS: Record<SaveStatus, string> = {
  idle: '',
  pending: 'Saving…',
  saved: 'Saved',
  failed: 'Save failed',
};

export function SaveIndicator({ status, message }: Props) {
  const mapped = mapStatus(status);
  const text = LABELS[mapped];
  if (!text && !message) return null;
  return (
    <span
      className="autosave"
      aria-live="polite"
      style={{ color: mapped === 'failed' ? 'var(--status-danger)' : undefined }}
    >
      {text}
      {message ? ` ${message}` : ''}
    </span>
  );
}
