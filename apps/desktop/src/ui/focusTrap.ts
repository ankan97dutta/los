type TrapKeyEvent = {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
};

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab and Shift+Tab cycling inside a dialog container.
 * Returns true when the event was handled. Pure DOM in, no framework.
 */
export function trapTabKey(e: TrapKeyEvent, container: HTMLElement | null): boolean {
  if (e.key !== 'Tab' || !container) return false;
  const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (focusables.length === 0) return false;
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
