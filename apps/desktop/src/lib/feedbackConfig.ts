import type { FeedbackTargetConfig } from '@los/domain';
import { isTauriRuntime } from './isTauri';

/**
 * Official LOS GitHub Issues destination.
 * Leave `template` empty until `.github/ISSUE_TEMPLATE` files exist; label fallback still works.
 */
export const FEEDBACK_TARGET: FeedbackTargetConfig = {
  owner: 'ankan97dutta',
  repo: 'los',
  kinds: {
    bug: { template: '', labels: ['bug'] },
    idea: { template: '', labels: ['enhancement'] },
    other: { template: '', labels: ['feedback'] },
  },
};

/** Fallback when not in Tauri or getVersion fails — keep in sync with package.json / tauri.conf.json. */
export const FEEDBACK_APP_VERSION_FALLBACK = '0.1.0';

/** Resolve the running app version for diagnostics (Tauri getVersion, else package fallback). */
export async function resolveFeedbackAppVersion(): Promise<string> {
  if (isTauriRuntime()) {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      const version = await getVersion();
      if (version.trim()) return version.trim();
    } catch {
      // fall through to package fallback
    }
  }
  return FEEDBACK_APP_VERSION_FALLBACK;
}
