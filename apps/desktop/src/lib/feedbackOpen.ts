import { isTauriRuntime } from './isTauri';

export type OpenFeedbackResult = { ok: true } | { ok: false; error: string };

/**
 * Opens a GitHub Issues URL in the default browser (Tauri opener) or a new tab (preview).
 * Never throws across the UI boundary.
 */
export async function openFeedbackUrl(url: string): Promise<OpenFeedbackResult> {
  if (!url.startsWith('https://github.com/')) {
    return { ok: false, error: 'Feedback can only open GitHub links.' };
  }

  if (isTauriRuntime()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, error: message || 'Could not open the browser.' };
    }
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    return { ok: false, error: 'The browser blocked opening GitHub. Allow pop-ups or try the desktop app.' };
  }
  return { ok: true };
}
