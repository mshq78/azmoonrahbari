import React, { useState } from 'react';
import { useQuiz } from '../../context/QuizContext';
import { charactersData } from '../../content/characters.fa';
import { uiContent, toPersianDigits } from '../../content/ui.fa';
import { CardFlip } from '../../components/CardFlip';
import { Collapsible } from '../../components/Collapsible';
import { BrandLockup } from '../../components/BrandLockup';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Copy, Check, Download, Share2 } from 'lucide-react';

export const ResultScreen: React.FC = () => {
  const { resultCharacter, trackingCode } = useQuiz();
  const character = charactersData[resultCharacter] || charactersData.LINCOLN;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadImage = () => {
    // Direct download link trigger
    const link = document.createElement('a');
    link.href = character.frontImage;
    link.download = `${character.code}_card.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]/60">
        <BrandLockup compact />
        <ThemeToggle compact />
      </header>

      {/* Main Result Presentation */}
      <main className="py-6 sm:py-8 text-center space-y-6">
        {/* Success line */}
        <div className="inline-block px-3.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--accent-gold)]/40 text-xs font-semibold text-[var(--accent-gold)]">
          {uiContent.result.successLine}
        </div>

        {/* Flippable 3D Card */}
        <CardFlip character={character} />

        {/* Action Buttons: Download Card & Copy Link */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-2 min-h-[48px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] text-sm font-semibold"
          >
            <Download className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
            <span>{uiContent.result.downloadCard}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 min-h-[48px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] text-sm font-semibold"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{uiContent.result.linkCopied}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
                <span>{uiContent.result.copyLink}</span>
              </>
            )}
          </button>
        </div>

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

        {/* Accessible Collapsible Card Content */}
        <Collapsible character={character} />
      </main>

      {/* Closing Note (quiet and thoughtful at the very bottom) */}
      <footer className="pt-6 pb-2 border-t border-[var(--border-subtle)]/50 text-center">
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
          {uiContent.result.closingLine}
        </p>
      </footer>
    </div>
  );
};
