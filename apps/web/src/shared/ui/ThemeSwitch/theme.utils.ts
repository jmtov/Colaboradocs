export type Theme = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'review:theme';

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(theme: Theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento: el tema vale solo para esta visita.
  }
}

export function applyStoredTheme() {
  const theme = readTheme();
  if (theme !== 'auto') document.documentElement.dataset.theme = theme;
}
