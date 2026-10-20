/**
 * Optional Tauri event bridge. When running under Tauri, Rust emits:
 * - los://caps  → CustomEvent('los:caps')
 * - los://quick → CustomEvent('los:quick-capture')
 *
 * Commands are fulfilled in-process via @los/app-services (api.ts) so the
 * TypeScript domain stays the source of truth; Rust owns tray/shortcut/window.
 */

export async function initTauriBridge(): Promise<void> {
  try {
    const { listen } = await import('@tauri-apps/api/event');
    await listen('los:caps', (event) => {
      window.dispatchEvent(new CustomEvent('los:caps', { detail: event.payload }));
    });
    await listen('los:quick-capture', () => {
      window.dispatchEvent(new CustomEvent('los:quick-capture'));
    });
    await listen('los:open-focus', () => {
      window.dispatchEvent(new CustomEvent('los:open-focus'));
    });
  } catch {
    // Browser / Vite-only: no Tauri runtime
  }
}
