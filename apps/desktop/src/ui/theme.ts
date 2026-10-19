export type UiTheme = 'dark' | 'light';

const KEY = 'los.ui.theme';

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
