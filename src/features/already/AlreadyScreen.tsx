import React, { useState } from 'react';
import { useQuiz } from '../../context/QuizContext';
import { charactersData } from '../../content/characters.fa';
import { uiContent, toPersianDigits } from '../../content/ui.fa';
import { CardFlip } from '../../components/CardFlip';
import { Collapsible } from '../../components/Collapsible';
import { BrandLockup } from '../../components/BrandLockup';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Copy, Check } from 'lucide-react';

export const AlreadyScreen: React.FC = () => {
  const { resultCharacter, trackingCode } = useQuiz();
  const character = charactersData[resultCharacter] || charactersData.LINCOLN;
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
      <header className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]/60">
        <BrandLockup compact />
        <ThemeToggle compact />
      </header>

      <main className="py-6 sm:py-8 text-center space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
            {uiContent.already.heading}
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            {uiContent.already.subtitle}
          </p>
        </div>

        <CardFlip character={character} />

        {/* Tracking Code Box */}
        <div className="max-w-sm mx-auto p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)] flex items-center justify-between text-sm shadow-sm">
          <span className="text-[var(--text-secondary)] font-medium">
            {uiContent.result.trackingPrefix}{' '}
            <strong className="text-[var(--text-primary)] font-mono font-bold tracking-wider mr-1">
              {toPersianDigits(trackingCode)}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="کپی کد رهگیری"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-muted)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">{uiContent.result.copiedCodeConfirmation}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
                <span className="text-xs">{uiContent.result.copyCodeAction}</span>
              </>
            )}
          </button>
        </div>

        <Collapsible character={character} />
      </main>

      <footer className="pt-6 pb-2 border-t border-[var(--border-subtle)]/50 text-center">
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
          {uiContent.result.closingLine}
        </p>
      </footer>
    </div>
  );
};
