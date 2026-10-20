import { isTauriRuntime } from './isTauri';

export type NotifyResult = 'sent' | 'denied' | 'unavailable' | 'off' | 'preview';

export async function notifyFocusEnded(input: {
  phase: 'focus' | 'break';
  taskLabel: string;
  includeTask: boolean;
  enabled: boolean;
}): Promise<NotifyResult> {
  if (!input.enabled) return 'off';
  if (!isTauriRuntime()) return 'preview';
  try {
    const mod = await import('@tauri-apps/plugin-notification');
    let granted = await mod.isPermissionGranted();
    if (!granted) granted = (await mod.requestPermission()) === 'granted';
    if (!granted) return 'denied';
    const base = input.phase === 'focus' ? 'Focus block done' : 'Break done';
    mod.sendNotification({ title: 'LOS Focus', body: input.includeTask ? `${base}: ${input.taskLabel}` : base });
    return 'sent';
  } catch {
    return 'unavailable';
  }
}
