import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { charactersData, type CharacterCode } from '../../content/characters.fa';
import { uiContent } from '../../content/ui.fa';
import { CardFlip } from '../../components/CardFlip';
import { Collapsible } from '../../components/Collapsible';

export interface ResultCardProps {
  characterCode: CharacterCode;
  trackingCode: string | null;
  heading?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * The shared result presentation: the card, the tracking code, and the card
 * text. Used by both the just-finished screen and the already-participated one.
 */
export const ResultCard: React.FC<ResultCardProps> = ({
  characterCode,
  trackingCode,
  heading,
  subtitle,
  actions,
}) => {
  const character = charactersData[characterCode];
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the code stays visible and selectable.
    }
  };

  if (!character) return null;

  return (
    <div className="text-center space-y-6">
      {heading ? (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
      ) : (
        <div className="inline-block px-3.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--accent-gold)]/40 text-xs font-semibold text-[var(--accent-gold)]">
          {uiContent.result.successLine}
        </div>
      )}

      <CardFlip character={character} />

      {actions}

      {trackingCode && (
        <div className="max-w-sm mx-auto p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)] flex items-center justify-between text-sm shadow-sm">
          <span className="text-[var(--text-secondary)] font-medium">
            {uiContent.result.trackingPrefix}{' '}
            {/* Rendered LTR and in Latin characters: the code is meant to be read
                aloud and typed back exactly as stored. */}
            <strong
              dir="ltr"
              className="inline-block text-[var(--text-primary)] font-mono font-bold tracking-widest mr-1 align-middle"
            >
              {trackingCode}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleCopyCode}
            aria-label={uiContent.result.copyCodeAria}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface-muted)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
          >
            {copied ? (
              <>
                <Check
                  className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {uiContent.result.copiedCodeConfirmation}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
                <span className="text-xs">{uiContent.result.copyCodeAction}</span>
              </>
            )}
          </button>
        </div>
      )}

      <Collapsible character={character} />
    </div>
  );
};
