/** Pure view helpers for the Planning canvas — no React, no services. */

export type WorkloadState = 'over' | 'zero' | 'open';

export function workloadState(input: { netHours: number; committedLoadHours: number }): WorkloadState {
  if (input.netHours <= 0) return 'zero';
  if (input.committedLoadHours > input.netHours) return 'over';
  return 'open';
}

/** Bar fill 0–100; over-capacity clamps to 100 so the bar never overflows its track. */
export function workloadPercent(input: { netHours: number; committedLoadHours: number }): number {
  if (input.netHours <= 0) return input.committedLoadHours > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (input.committedLoadHours / input.netHours) * 100));
}

export function workloadLabel(input: { netHours: number; committedLoadHours: number }): string {
  const state = workloadState(input);
  if (state === 'zero') {
    return input.committedLoadHours > 0
      ? `No capacity — ${formatHours(input.committedLoadHours)} committed against 0h net`
      : 'No capacity — 0h net';
  }
  if (state === 'over') {
    return `Over capacity by ${formatHours(input.committedLoadHours - input.netHours)} — review allocation`;
  }
  return `${formatHours(input.netHours - input.committedLoadHours)} remaining`;
}

/** Unknown estimates render as "Unknown", never as 0h. */
export function estimateLabel(input: { estimateHours: number | null; estimateUnknown: boolean }): string {
  if (input.estimateUnknown || input.estimateHours == null) return 'Unknown';
  return formatHours(input.estimateHours);
}

export function actualLabel(actualHours: number | null): string {
  return actualHours == null ? '—' : formatHours(actualHours);
}

export function formatHours(value: number): string {
  const clean = Math.round(value * 10) / 10;
  return `${Number.isInteger(clean) ? clean : clean.toFixed(1)}h`;
}

/** Committed vs stretch must differ by more than color: symbol + word. */
export function commitmentLabel(kind: 'none' | 'commitment' | 'stretch'): string {
  if (kind === 'commitment') return '● Committed';
  if (kind === 'stretch') return '○ Stretch';
  return 'Unclassified';
}

export function isBlockedStatus(status: string): boolean {
  return status === 'blocked' || status === 'waiting_external';
}
