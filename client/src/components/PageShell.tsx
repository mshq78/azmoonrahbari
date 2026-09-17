import React from 'react';
import { BrandLockup, GeraLogo } from './BrandLockup';
import { ThemeToggle } from './ThemeToggle';

export interface PageShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Centres the main block vertically — used by the short entry/intro screens. */
  centered?: boolean;
}

/**
 * The header/footer chrome every public screen shares, which is also what puts
 * the GERA credit on every page without each screen having to remember it.
 */
export const PageShell: React.FC<PageShellProps> = ({ children, footer, centered = false }) => (
  <div className="min-h-screen flex flex-col justify-between py-5 px-4 sm:px-6 max-w-xl mx-auto">
    <header className="flex items-center justify-between pb-5">
      <BrandLockup compact />
      <ThemeToggle compact />
    </header>

    <main className={centered ? 'my-auto py-6' : 'py-4'}>{children}</main>

    <footer className="pt-8 flex flex-col items-center gap-3 text-center">
      {footer && (
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed max-w-md">{footer}</p>
      )}
      <GeraLogo />
    </footer>
  </div>
);
