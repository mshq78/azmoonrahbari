import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';
import { useAttempt } from '../attempt/AttemptContext';

/**
 * The short pause between finalize and the card. Purely presentational — the
 * result already exists on the server by the time this renders.
 */
export const RevealScreen: React.FC = () => {
  const navigate = useNavigate();
  const { bootstrap } = useAttempt();
  const [phase, setPhase] = useState<'tracing' | 'settling'>('tracing');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 1200 : 2500;

    const phaseTimer = setTimeout(() => setPhase('settling'), duration * 0.7);
    const finishTimer = setTimeout(() => navigate('/result', { replace: true }), duration);

    return () => {
      clearTimeout(phaseTimer);
      clearTimeout(finishTimer);
    };
  }, [navigate]);

  // Landing here without a result (a refresh after a failed finalize) goes back
  // to review rather than showing an empty animation.
  if (!bootstrap.result) return <Navigate to="/review" replace />;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--navy-900)] text-[var(--cream-50)] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      <div className="w-64 h-32 relative mb-8 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          {[-40, -20, 0, 20, 40].map((offset) => (
            <div
              key={offset}
              className={`absolute w-16 h-24 rounded border transition-all duration-1000 ease-out ${
                phase === 'settling'
                  ? 'opacity-80 border-[var(--gold-500)] shadow-lg'
                  : 'opacity-25 border-[var(--gold-500)]/20'
              }`}
              style={{
                transform:
                  phase === 'settling'
                    ? 'translateX(0) rotate(0deg)'
                    : `translateX(${offset}px) rotate(${offset / 6}deg)`,
              }}
            />
          ))}
        </div>

        <svg viewBox="0 0 200 60" className="w-full h-full relative z-10 overflow-visible">
          <path
            d="M 10 30 Q 55 5, 100 30 T 190 30"
            fill="none"
            stroke="var(--gold-500)"
            strokeWidth="2"
            strokeDasharray="220"
            strokeDashoffset={phase === 'settling' ? '0' : '80'}
            className="transition-all duration-1000 ease-out"
          />
          <circle
            cx={phase === 'settling' ? '100' : '170'}
            cy="30"
            r="3"
            fill="var(--gold-500)"
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      <div className="max-w-md space-y-3" aria-live="polite">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--gold-500)]">
          {phase === 'tracing' ? uiContent.reveal.tracingText : uiContent.reveal.thenText}
        </h2>
      </div>
    </div>
  );
};
