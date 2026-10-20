/** True inside the Tauri webview (v2 injects `__TAURI_INTERNALS__`; `__TAURI__` only if withGlobalTauri). */
export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  };
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
}
