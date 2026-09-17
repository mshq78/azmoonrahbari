import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Check, Download, Loader2, Share2 } from 'lucide-react';
import { charactersData, type CharacterCode } from '../../content/characters.fa';
import { uiContent } from '../../content/ui.fa';
import { PageShell } from '../../components/PageShell';
import { useAttempt } from '../attempt/AttemptContext';
import { ResultCard } from './ResultCard';
import { renderVisibleCardToFile, renderVisibleCardToPng } from './cardImage';

type PendingAction = 'download' | 'share' | null;

export const ResultScreen: React.FC = () => {
  const { bootstrap } = useAttempt();
  const [pending, setPending] = useState<PendingAction>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!bootstrap.result) return <Navigate to="/review" replace />;

  const characterCode = bootstrap.result.characterCode as CharacterCode;
  const character = charactersData[characterCode];

  const shareMessage = `${uiContent.result.shareText(character?.name ?? '')}\n${window.location.origin}`;

  const handleDownload = async () => {
    if (pending) return;
    setPending('download');
    setFailed(false);
    try {
      const dataUrl = await renderVisibleCardToPng();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = uiContent.result.downloadFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Could not render the card:', error);
      setFailed(true);
    } finally {
      setPending(null);
    }
  };

  const handleShare = async () => {
    if (pending) return;
    setPending('share');
    setFailed(false);
    try {
      const file = await renderVisibleCardToFile(uiContent.result.downloadFileName);
      const withImage = { text: shareMessage, files: [file] };

      // The share sheet is the good path on a phone: it hands over the card
      // itself, not a link to it. Desktop browsers mostly cannot take files, so
      // fall back to the text, and then to the clipboard.
      if (navigator.canShare?.(withImage)) {
        await navigator.share(withImage);
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: shareMessage });
        return;
      }

      await navigator.clipboard.writeText(shareMessage);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (error) {
      // Dismissing the share sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Could not share the card:', error);
      setFailed(true);
    } finally {
      setPending(null);
    }
  };

  const actionClass =
    'inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-muted)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] text-sm font-semibold shadow-sm';

  return (
    <PageShell footer={uiContent.result.closingLine}>
      <ResultCard
        characterCode={characterCode}
        trackingCode={bootstrap.attempt.trackingCode}
        actions={
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={pending !== null}
                aria-busy={pending === 'download'}
                className={actionClass}
              >
                {pending === 'download' ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin text-[var(--accent-gold)]"
                      aria-hidden="true"
                    />
                    <span>{uiContent.result.preparingImage}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
                    <span>{uiContent.result.downloadCard}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={pending !== null}
                aria-busy={pending === 'share'}
                className={actionClass}
              >
                {pending === 'share' ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin text-[var(--accent-gold)]"
                      aria-hidden="true"
                    />
                    <span>{uiContent.result.preparingImage}</span>
                  </>
                ) : shareCopied ? (
                  <>
                    <Check
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {uiContent.result.shareCopied}
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

            {failed && (
              <p
                role="alert"
                className="flex items-center justify-center gap-2 mx-auto max-w-md p-3 text-sm rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{uiContent.result.imageError}</span>
              </p>
            )}
          </div>
        }
      />
    </PageShell>
  );
};
