import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { uiContent } from '../content/ui.fa';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Initial theme resolution
    const saved = localStorage.getItem('theme-preference');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme-preference', next);
    applyTheme(next);
  };

  const isDark = theme === 'dark';
  const label = isDark ? uiContent.theme.toggleToLight : uiContent.theme.toggleToDark;
  const currentLabel = isDark ? uiContent.theme.currentDark : uiContent.theme.currentLight;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border-subtle)] bg-[var(--surface-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[var(--accent-gold)] shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--accent-gold)] shrink-0" aria-hidden="true" />
      )}
      {!compact && <span>{currentLabel}</span>}
    </button>
  );
};
