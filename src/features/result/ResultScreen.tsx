import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { useQuiz } from '../../context/QuizContext';
import { charactersData } from '../../content/characters.fa';
import { uiContent, toPersianDigits } from '../../content/ui.fa';
import { BRAND_CONFIG } from '../../config/brand';
import { CardFlip } from '../../components/CardFlip';
import { Collapsible } from '../../components/Collapsible';
import { BrandLockup } from '../../components/BrandLockup';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Copy, Check, Download, Share2, Loader2, AlertCircle } from 'lucide-react';

export const ResultScreen: React.FC = () => {
  const { resultCharacter, trackingCode } = useQuiz();
  const character = charactersData[resultCharacter] || charactersData.LINCOLN;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [activeAction, setActiveAction] = useState<'download' | 'share' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  /**
   * Generates a high-quality PNG data URL of the card element shown on screen
   */
  const generateCardPng = async (): Promise<string> => {
    const cardContainer = document.getElementById('result-card');
    if (!cardContainer) {
      throw new Error('Card container element not found');
    }

    const isFlipped = cardContainer.getAttribute('data-flipped') === 'true';
    const targetElement =
      (isFlipped ? document.getElementById('card-back') : document.getElementById('card-front')) ||
      cardContainer;

    return await toPng(targetElement, {
      pixelRatio: 2,
      cacheBust: true,
      style: {
        transform: 'none',
        position: 'relative',
      },
      filter: (domNode) => {
        // Guard against broken or unrendered images failing the html-to-image fetch
        if (domNode.tagName === 'IMG') {
          const img = domNode as HTMLImageElement;
          return img.complete && img.naturalWidth > 0;
        }
        return true;
      },
    });
  };

  /**
   * Downloads the rendered card as karte-man.png
   */
  const handleDownloadCard = async () => {
    if (isPreparing) return;

    setIsPreparing(true);
    setActiveAction('download');
    setErrorMessage(null);

    try {
      const dataUrl = await generateCardPng();
      const link = document.createElement('a');
      link.download = uiContent.result.downloadFileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to generate or download card image:', error);
      setErrorMessage(uiContent.result.imageGenError);
    } finally {
      setIsPreparing(false);
      setActiveAction(null);
    }
  };

  /**
   * Shares the generated PNG image along with the custom text and website URL.
   * If navigator.share / navigator.canShare is unsupported, copies text + URL to clipboard.
   */
  const handleShare = async () => {
    if (isPreparing) return;

    setIsPreparing(true);
    setActiveAction('share');
    setErrorMessage(null);

    try {
      const shareText = uiContent.result.shareText(character.name);
      const url = window.location.origin || window.location.href;
      const fullText = `${shareText}\n${url}`;

      // Generate the card PNG data URL
      const dataUrl = await generateCardPng();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], uiContent.result.downloadFileName, { type: 'image/png' });

      let shared = false;

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const shareDataWithFile: ShareData = {
          title: BRAND_CONFIG.brandName,
          text: fullText,
          files: [file],
        };

        if (typeof navigator.canShare === 'function' && navigator.canShare(shareDataWithFile)) {
          try {
            await navigator.share(shareDataWithFile);
            shared = true;
          } catch (shareErr: unknown) {
            // If user simply closed or cancelled the share sheet, treat as handled
            if (shareErr instanceof Error && shareErr.name === 'AbortError') {
              shared = true;
            }
          }
        } else {
          // If file sharing specifically is not supported, attempt text-only share
          const shareDataText: ShareData = {
            title: BRAND_CONFIG.brandName,
            text: fullText,
          };
          if (typeof navigator.canShare === 'function' && navigator.canShare(shareDataText)) {
            try {
              await navigator.share(shareDataText);
              shared = true;
            } catch (shareErr: unknown) {
              if (shareErr instanceof Error && shareErr.name === 'AbortError') {
                shared = true;
              }
            }
          }
        }
      }

      // If navigator.share was unavailable or not completed, copy text + url to clipboard
      if (!shared) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fullText);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = fullText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch (error) {
      console.error('Failed to share card:', error);
      setErrorMessage(uiContent.result.imageGenError);
    } finally {
      setIsPreparing(false);
      setActiveAction(null);
    }
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

        {/* Error notification banner if image preparation fails */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center justify-center gap-2 p-3 text-sm rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 max-w-md mx-auto"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons: Download Card & Share */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Download Card Button */}
          <button
            type="button"
            disabled={isPreparing}
            onClick={handleDownloadCard}
            aria-busy={isPreparing && activeAction === 'download'}
            className="inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-muted)] disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] text-sm font-semibold shadow-sm"
          >
            {isPreparing && activeAction === 'download' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" />
                <span>{uiContent.result.preparingImage}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
                <span>{uiContent.result.downloadCard}</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            disabled={isPreparing}
            onClick={handleShare}
            aria-busy={isPreparing && activeAction === 'share'}
            className="inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-muted)] disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] text-sm font-semibold shadow-sm"
          >
            {isPreparing && activeAction === 'share' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" />
                <span>{uiContent.result.preparingImage}</span>
              </>
            ) : copiedShare ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {uiContent.result.copiedConfirmation}
                </span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
                <span>{uiContent.result.shareButton}</span>
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

        {/* Accessible Collapsible Card Content */}
        <Collapsible character={character} />
      </main>

      {/* Closing Note */}
      <footer className="pt-6 pb-2 border-t border-[var(--border-subtle)]/50 text-center">
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
          {uiContent.result.closingLine}
        </p>
      </footer>
    </div>
  );
};
