import React from 'react';
import { uiContent } from '../content/ui.fa';

export interface ProgressRuleProps {
  current: number;
  total: number;
  syncState?: 'idle' | 'saving' | 'saved' | 'failed';
}

export const ProgressRule: React.FC<ProgressRuleProps> = ({
  current,
  total,
  syncState = 'idle',
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-app)]/80 backdrop-blur-md pt-3 pb-3.5 transition-colors">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {/* Top line with label and subtle sync indicator */}
        <div className="flex items-center justify-between text-[13px] mb-2.5 select-none">
          <span className="font-medium text-[var(--text-muted)] tracking-wide" aria-live="polite">
            {uiContent.questionnaire.progressLabel(current, total)}
          </span>

          <div className="h-5 flex items-center text-xs">
            {syncState === 'saving' && (
              <span className="text-[var(--accent-gold)] flex items-center gap-1.5 transition-opacity duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-ping" />
                {uiContent.states.syncing}
              </span>
            )}
            {syncState === 'saved' && (
              <span className="text-[var(--text-muted)] transition-opacity duration-200">
                {uiContent.states.synced}
              </span>
            )}
            {syncState === 'failed' && (
              <span className="text-[var(--text-muted)] transition-opacity duration-200">
                {uiContent.states.syncPending}
              </span>
            )}
          </div>
        </div>

        {/* Thin gold rule progress */}
        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuetext={uiContent.questionnaire.progressLabel(current, total)}
          className="w-full h-[3px] rounded-full bg-[var(--border-subtle)] overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-[var(--accent-gold)] transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </header>
  );
};
