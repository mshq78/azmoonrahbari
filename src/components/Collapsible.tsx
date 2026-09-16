import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CharacterCardData } from '../content/characters.fa';
import { uiContent } from '../content/ui.fa';

export interface CollapsibleProps {
  character: CharacterCardData;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ character }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto mt-6 border border-[var(--border-subtle)] rounded-xl bg-[var(--surface-app)] overflow-hidden shadow-sm transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="card-text-content"
        className="w-full min-h-[48px] px-5 py-3.5 flex items-center justify-between text-right font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
      >
        <span className="flex items-center gap-2 text-[17px]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
          {uiContent.result.cardTextHeading} ({character.name})
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id="card-text-content"
          className="px-5 pb-6 pt-2 border-t border-[var(--border-subtle)] space-y-4 text-right animate-in fade-in duration-200"
        >
          <div>
            <div className="text-xs text-[var(--accent-gold)] font-bold mb-1">
              معرفی
            </div>
            <p className="text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {character.intro}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)]">
            <div className="text-xs text-[var(--accent-gold)] font-bold mb-1">
              ویژگی‌های اصلی
            </div>
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">
              {character.traits}
            </p>
          </div>

          <div>
            <div className="text-xs text-[var(--accent-gold)] font-bold mb-1">
              {character.powerTitle}
            </div>
            <p className="text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {character.power}
            </p>
          </div>

          <div>
            <div className="text-xs text-[var(--accent-gold)] font-bold mb-1">
              {character.backTitle}
            </div>
            <p className="text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {character.back}
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <div className="text-xs text-[var(--accent-gold)] font-bold mb-1">
              {character.reminderTitle}
            </div>
            <p className="text-[16px] font-semibold text-[var(--text-primary)] leading-relaxed">
              «{character.reminder}»
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
