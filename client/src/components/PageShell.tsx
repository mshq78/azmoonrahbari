import React from 'react';
import { BrandLockup } from './BrandLockup';
import { ThemeToggle } from './ThemeToggle';

export interface PageShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Centres the main block vertically — used by the short entry/intro screens. */
  centered?: boolean;
}

/** The header/footer chrome every public screen shares. */
export const PageShell: React.FC<PageShellProps> = ({ children, footer, centered = false }) => (
  <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
    <header className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]/60">
      <BrandLockup compact />
      <ThemeToggle compact />
    </header>

    <main className={centered ? 'my-auto py-8' : 'py-6'}>{children}</main>

    {footer ? (
      <footer className="pt-6 pb-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)]/40">
        {footer}
      </footer>
    ) : (
      <div className="py-2" aria-hidden="true" />
    )}
  </div>
);
