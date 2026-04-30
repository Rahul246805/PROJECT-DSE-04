export const STORAGE_KEY = 'mate_theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.dataset.theme = theme;
}
