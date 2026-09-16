import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, Download, Share2 } from 'lucide-react';
import { charactersData, type CharacterCode } from '../../content/characters.fa';
import { uiContent } from '../../content/ui.fa';
import { PageShell } from '../../components/PageShell';
import { useAttempt } from '../attempt/AttemptContext';
import { ResultCard } from './ResultCard';

export const ResultScreen: React.FC = () => {
  const { bootstrap } = useAttempt();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!bootstrap.result) return <Navigate to="/review" replace />;

  const characterCode = bootstrap.result.characterCode as CharacterCode;
  const character = charactersData[characterCode];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard access can be denied; nothing else to do.
    }
  };

  const handleDownloadImage = () => {
    if (!character) return;
    const link = document.createElement('a');
    link.href = character.frontImage;
    link.download = `${character.code}_card.webp`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const actionClass =
    'inline-flex items-center gap-2 min-h-[48px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] text-sm font-semibold';

  return (
    <PageShell footer={uiContent.result.closingLine}>
      <ResultCard
        characterCode={characterCode}
        trackingCode={bootstrap.attempt.trackingCode}
        actions={
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button type="button" onClick={handleDownloadImage} className={actionClass}>
              <Download className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
              <span>{uiContent.result.downloadCard}</span>
            </button>

            <button type="button" onClick={handleCopyLink} className={actionClass}>
              {copiedLink ? (
                <>
                  <Check
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {uiContent.result.linkCopied}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
                  <span>{uiContent.result.copyLink}</span>
                </>
              )}
            </button>
          </div>
        }
      />
    </PageShell>
  );
};
