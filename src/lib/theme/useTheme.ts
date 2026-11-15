import { useCallback, useEffect, useState } from 'react';
import {
  resolveInitialTheme,
  THEME_STORAGE_KEY,
  toggleThemeMode,
  type ThemeMode,
} from './themeUtils';

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    if (document.documentElement.classList.contains('dark')) return 'dark';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    return resolveInitialTheme(stored, systemDark);
  } catch {
    return 'light';
  }
}

export function applyThemeToDom(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);

  useEffect(() => {
    applyThemeToDom(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota / restricted iframe errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => toggleThemeMode(prev));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };
}
