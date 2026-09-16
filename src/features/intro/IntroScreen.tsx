import React from 'react';
import { useNavigate } from 'react-router-dom';
import { testIntroContent } from '../../content/testIntro.fa';
import { BrandLockup } from '../../components/BrandLockup';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';

export const IntroScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/start');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
      {/* Top Bar: Brand Lockup & Theme Toggle */}
      <header className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]/60">
        <BrandLockup compact />
        <ThemeToggle compact />
      </header>

      {/* Main Content Area */}
      <main className="my-auto py-8 sm:py-12 space-y-6 text-right">
        {/* Decorative subtle gold rule */}
        <div className="w-12 h-[2px] bg-[var(--accent-gold)]" aria-hidden="true" />

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] leading-[1.3] tracking-tight">
          {testIntroContent.title}
        </h1>

        <div className="space-y-4 pt-2 prose-persian">
          {testIntroContent.paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-[17px] sm:text-[18px] leading-[1.75] text-[var(--text-secondary)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-6">
          <Button
            variant="primary"
            fullWidth
            onClick={handleStart}
            className="text-lg py-3.5"
          >
            {testIntroContent.startButton}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-6 pb-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)]/40">
        تجربهٔ یادگیری و خودشناسی رهبری سازمانی
      </footer>
    </div>
  );
};
