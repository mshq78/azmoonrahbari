import React, { ReactNode } from 'react';
import { BrandLockup } from './BrandLockup';
import { ThemeToggle } from './ThemeToggle';

export interface PageShellProps {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
  footer?: ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  showHeader = true,
  className = '',
  footer,
}) => {
  return (
    <div
      dir="rtl"
      className={`min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto ${className}`}
    >
      {showHeader && (
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]/60">
          <BrandLockup compact />
          <ThemeToggle compact />
        </header>
      )}

      {children}

      {footer && (
        <footer className="pt-6 pb-2 border-t border-[var(--border-subtle)]/50 text-center">
          {footer}
        </footer>
      )}
    </div>
  );
};
