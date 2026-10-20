export type UiTheme = 'dark' | 'light';
export type UiAccent = 'default' | 'ember' | 'signal';

const KEY = 'los.ui.theme';
const ACCENT_KEY = 'los.ui.accent';

export function readTheme(): UiTheme {
  const raw = localStorage.getItem(KEY);
  return raw === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: UiTheme): void {
  document.documentElement.dataset.theme = theme;
}

export function writeTheme(theme: UiTheme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function initTheme(): UiTheme {
  const theme = readTheme();
  applyTheme(theme);
  return theme;
}

export function readAccent(): UiAccent {
  const raw = localStorage.getItem(ACCENT_KEY);
  return raw === 'ember' || raw === 'signal' ? raw : 'default';
}

export function applyAccent(accent: UiAccent): void {
  document.documentElement.dataset.accent = accent;
}

export function writeAccent(accent: UiAccent): void {
  localStorage.setItem(ACCENT_KEY, accent);
  applyAccent(accent);
}

export function initAccent(): UiAccent {
  const accent = readAccent();
  applyAccent(accent);
  return accent;
}
