import React from 'react';
import { MoonStar, SunMedium } from 'lucide-react';

const STORAGE_KEY = 'mate_theme';

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

export function useTheme() {
  const [theme, setTheme] = React.useState(() => getStoredTheme());

  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  };
}

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-secondary h-11 w-11 rounded-full p-0 ${className}`}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
    </button>
  );
};

export default ThemeToggle;
