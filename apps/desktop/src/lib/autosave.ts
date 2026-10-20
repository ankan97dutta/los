import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

/**
 * Debounced autosave (~500ms) for daily / fortnight / monthly editors (FR-020).
 */
export function useDebouncedAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  opts?: { delayMs?: number; enabled?: boolean },
) {
  const delayMs = opts?.delayMs ?? 500;
  const enabled = opts?.enabled ?? true;
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);
  const latest = useRef(value);
  const saveRef = useRef(save);
  latest.current = value;
  saveRef.current = save;

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus('unsaved');
    setError(null);
    const t = window.setTimeout(async () => {
      setStatus('saving');
      try {
        await saveRef.current(latest.current);
        setStatus('saved');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs, enabled]);

  return { status, error };
}
