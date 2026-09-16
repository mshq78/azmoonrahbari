/**
 * Theme preference — the only thing this app keeps in localStorage, and the one
 * piece of local state that is never cleared when an attempt finishes.
 */

const STORAGE_KEY = 'theme-preference';

export type Theme = 'light' | 'dark';

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    // Private mode or blocked storage: fall back to the system preference.
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not being able to remember the choice is not worth an error.
  }
}

export function systemTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.setAttribute('data-theme', theme);
}

export function resolveInitialTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}
