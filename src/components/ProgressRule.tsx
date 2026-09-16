import React from 'react';
import { uiContent, toPersianDigits } from '../content/ui.fa';

export interface ProgressRuleProps {
  current: number;
  total: number;
  syncState?: 'idle' | 'saving' | 'saved';
}

export const ProgressRule: React.FC<ProgressRuleProps> = ({
  current,
  total,
  syncState = 'idle',
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-app)]/95 backdrop-blur-sm pt-2 pb-3 border-b border-[var(--border-subtle)]/50 transition-colors">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {/* Top line with label and subtle sync indicator */}
        <div className="flex items-center justify-between text-sm mb-2 select-none">
          <span
            className="font-semibold text-[var(--text-secondary)] tracking-wide"
            aria-live="polite"
          >
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
          </div>
        </div>

        {/* Thin gold rule progress */}
        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuetext={uiContent.questionnaire.progressLabel(current, total)}
          className="w-full h-[3px] bg-[var(--border-subtle)] overflow-hidden"
        >
          <div
            className="h-full bg-[var(--accent-gold)] transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </header>
  );
};
