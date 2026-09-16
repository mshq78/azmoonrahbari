import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CharacterCardData } from '../content/characters.fa';
import { uiContent } from '../content/ui.fa';

export interface CardFlipProps {
  character: CharacterCardData;
}

export const CardFlip: React.FC<CardFlipProps> = ({ character }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontImgError, setFrontImgError] = useState(false);
  const [backImgError, setBackImgError] = useState(false);

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Card Container (Portrait 2:3, max-width 420px) */}
      <div
        className="w-full max-w-[360px] sm:max-w-[400px] aspect-[2/3] relative cursor-pointer select-none group"
        style={{ perspective: '1200px' }}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={`${character.name} — ${uiContent.result.flipHint}`}
        onClick={toggleFlip}
        onKeyDown={handleKeyDown}
      >
        <div
          className="w-full h-full relative rounded-2xl transition-transform duration-600 ease-out shadow-xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Card Front */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border-2 border-[var(--accent-gold)] bg-[var(--navy-900)] text-[var(--cream-50)] shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {!frontImgError ? (
              <img
                src={character.frontImage}
                alt={`${character.name} — روی کارت`}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
                onError={() => setFrontImgError(true)}
              />
            ) : (
              /* Fallback engraved artwork if image webp is pending upload */
              <div className="w-full h-full p-6 flex flex-col justify-between text-center relative overflow-hidden bg-gradient-to-b from-[#0E2340] to-[#16304F]">
                <div className="absolute inset-2 border border-[#C9A227]/40 rounded-xl pointer-events-none" />
                <div className="absolute inset-3.5 border border-[#C9A227]/20 rounded-lg pointer-events-none" />

                <div className="pt-4 z-10">
                  <div className="text-xs tracking-widest text-[#F2C14E] font-semibold mb-1">
                    سبک تصمیم‌گیری
                  </div>
                  <h2 className="text-2xl font-black text-[#FAF4E6] tracking-wide">
                    {character.name}
                  </h2>
                  <p className="text-xs text-[#E6DCC9]/80 mt-1">{character.years}</p>
                </div>

                <div className="my-auto z-10 py-4 px-3">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#F2C14E]/60 flex items-center justify-center bg-[#0E2340]/80">
                    <span className="text-2xl font-black text-[#F2C14E]">
                      {character.name[0]}
                    </span>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-[#F2C14E]/15 border border-[#F2C14E]/40 text-xs text-[#F2C14E] font-semibold mb-3">
                    {character.traits}
                  </div>
                  <div className="text-xs text-[#F2C14E] font-semibold mb-1">
                    {character.powerTitle}
                  </div>
                  <p className="text-sm text-[#FAF4E6] leading-relaxed font-medium">
                    «{character.power}»
                  </p>
                </div>

                <div className="pb-2 z-10 text-[11px] text-[#C9A227]/90 font-medium">
                  رهبری هوشیار
                </div>
              </div>
            )}
          </div>

          {/* Card Back */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border-2 border-[var(--accent-gold)] bg-[var(--navy-700)] text-[var(--cream-50)] shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {!backImgError ? (
              <img
                src={character.backImage}
                alt={`${character.name} — پشت کارت`}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
                onError={() => setBackImgError(true)}
              />
            ) : (
              /* Fallback engraved artwork for back */
              <div className="w-full h-full p-6 flex flex-col justify-between text-center relative overflow-hidden bg-gradient-to-b from-[#16304F] to-[#0E2340]">
                <div className="absolute inset-2 border border-[#C9A227]/40 rounded-xl pointer-events-none" />
                <div className="absolute inset-3.5 border border-[#C9A227]/20 rounded-lg pointer-events-none" />

                <div className="pt-4 z-10">
                  <div className="text-xs tracking-widest text-[#F2C14E] font-semibold mb-1">
                    پشت کارت
                  </div>
                  <h3 className="text-xl font-bold text-[#FAF4E6]">
                    {character.name}
                  </h3>
                </div>

                <div className="my-auto z-10 py-2 px-3 space-y-4 text-right">
                  <div>
                    <div className="text-xs text-[#F2C14E] font-semibold mb-1">
                      {character.backTitle}
                    </div>
                    <p className="text-xs sm:text-sm text-[#FAF4E6] leading-relaxed">
                      {character.back}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#C9A227]/30">
                    <div className="text-xs text-[#F2C14E] font-semibold mb-1">
                      {character.reminderTitle}
                    </div>
                    <p className="text-xs sm:text-sm text-[#FAF4E6] leading-relaxed font-semibold">
                      «{character.reminder}»
                    </p>
                  </div>
                </div>

                <div className="pb-2 z-10 text-[11px] text-[#C9A227]/90 font-medium">
                  رهبری هوشیار
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visible, always-present hint button (required) */}
      <button
        type="button"
        onClick={toggleFlip}
        aria-pressed={isFlipped}
        className="mt-4 inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-app)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)] cursor-pointer text-sm font-semibold shadow-sm"
      >
        <RefreshCw className="w-4 h-4 text-[var(--accent-gold)]" aria-hidden="true" />
        <span>{uiContent.result.flipHint}</span>
      </button>
    </div>
  );
};
