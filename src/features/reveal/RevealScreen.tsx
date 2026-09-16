import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';

export const RevealScreen: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'tracing' | 'settling'>('tracing');

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 1200 : 2500;

    const phaseTimer = setTimeout(() => {
      setPhase('settling');
    }, duration * 0.7);

    const finishTimer = setTimeout(() => {
      navigate('/result', { replace: true });
    }, duration);

    return () => {
      clearTimeout(phaseTimer);
      clearTimeout(finishTimer);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--navy-900)] text-[var(--cream-50)] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Restrained elegant gold line tracing visual */}
      <div className="w-64 h-32 relative mb-8 flex items-center justify-center">
        {/* Five faint card silhouettes settling into center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[-40, -20, 0, 20, 40].map((offset, i) => (
            <div
              key={i}
              className={`absolute w-16 h-24 rounded border border-[var(--gold-500)]/20 transition-all duration-1000 ease-out ${
                phase === 'settling'
                  ? 'translate-x-0 rotate-0 opacity-80 border-[var(--gold-500)] shadow-lg'
                  : `opacity-25`
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

        {/* Tracing path SVG */}
        <svg
          viewBox="0 0 200 60"
          className="w-full h-full relative z-10 overflow-visible"
        >
          <path
            d="M 10 30 Q 55 5, 100 30 T 190 30"
            fill="none"
            stroke="var(--gold-500)"
            strokeWidth="2"
            strokeDasharray="220"
            strokeDashoffset={phase === 'settling' ? '0' : '80'}
            className="transition-all duration-1500 ease-out"
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

      {/* Text announcement */}
      <div className="max-w-md space-y-3 transition-opacity duration-300">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--gold-500)]">
          {phase === 'tracing' ? uiContent.reveal.tracingText : uiContent.reveal.thenText}
        </h2>
      </div>
    </div>
  );
};
