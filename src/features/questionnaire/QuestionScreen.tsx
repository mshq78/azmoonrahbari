import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import { ProgressRule } from '../../components/ProgressRule';
import { OptionRow } from '../../components/OptionRow';
import { uiContent } from '../../content/ui.fa';

export const QuestionScreen: React.FC = () => {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const {
    questions,
    answers,
    selectAnswer,
    syncState,
    returnToReview,
    setReturnToReview,
  } = useQuiz();

  const currentIndex = parseInt(index || '1', 10);
  const currentQuestion = questions[currentIndex - 1];

  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const isAdvancingRef = useRef<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);

  // Validate index bounds
  useEffect(() => {
    if (isNaN(currentIndex) || currentIndex < 1) {
      navigate('/q/1', { replace: true });
    } else if (currentIndex > questions.length) {
      navigate('/review', { replace: true });
    }
  }, [currentIndex, questions.length, navigate]);

  // Focus management and accessibility announcement
  useEffect(() => {
    isAdvancingRef.current = false;
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
      questionHeadingRef.current?.focus();
    }, 220);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (!currentQuestion) {
    return null;
  }

  const selectedOptionId = answers[currentQuestion.id];

  const handleSelectOption = (optionId: string) => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    selectAnswer(currentQuestion.id, optionId);

    // Wait ~200ms then advance
    setTimeout(() => {
      if (returnToReview) {
        setReturnToReview(false);
        navigate('/review');
      } else if (currentIndex < questions.length) {
        setSlideDirection('forward');
        navigate(`/q/${currentIndex + 1}`);
      } else {
        navigate('/review');
      }
    }, 220);
  };

  const handlePrev = () => {
    if (currentIndex > 1) {
      setSlideDirection('backward');
      navigate(`/q/${currentIndex - 1}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-app)]">
      {/* Sticky Progress Rule */}
      <ProgressRule
        current={currentIndex}
        total={questions.length}
        syncState={syncState}
      />

      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {uiContent.questionnaire.progressLabel(currentIndex, questions.length)}: {currentQuestion.text}
      </div>

      {/* Main Question & Options Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        <div
          key={currentQuestion.id}
          className={`space-y-6 sm:space-y-8 transition-all duration-200 ease-out ${
            isAnimating
              ? slideDirection === 'forward'
                ? 'opacity-80 translate-x-2'
                : 'opacity-80 -translate-x-2'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Question Text */}
          <div className="text-right">
            <h1
              ref={questionHeadingRef}
              tabIndex={-1}
              className="text-[21px] sm:text-[23px] md:text-[24px] font-semibold text-[var(--text-primary)] leading-[1.65] outline-none"
            >
              {currentQuestion.text}
            </h1>
          </div>

          {/* Option Rows */}
          <div
            role="radiogroup"
            aria-label="گزینه‌ها"
            className="space-y-3 sm:space-y-3.5"
          >
            {currentQuestion.options.map((opt, optIdx) => (
              <OptionRow
                key={opt.id}
                id={opt.id}
                code={opt.code}
                text={opt.text}
                selected={selectedOptionId === opt.id}
                onSelect={() => handleSelectOption(opt.id)}
                index={optIdx}
              />
            ))}
          </div>
        </div>

        {/* Navigation Actions (Bottom bar) */}
        <div className="mt-8 pt-4 flex items-center justify-between min-h-[48px]">
          {currentIndex > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 min-h-[48px] px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
            >
              ← {uiContent.questionnaire.prevButton}
            </button>
          ) : (
            <div />
          )}

          {returnToReview && (
            <button
              type="button"
              onClick={() => {
                setReturnToReview(false);
                navigate('/review');
              }}
              className="inline-flex items-center gap-1.5 min-h-[48px] px-4 py-2 text-sm font-semibold rounded-lg text-[var(--accent-gold)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              بازگشت به مرور پاسخ‌ها
            </button>
          )}
        </div>
      </main>

      {/* Discreet bottom spacing */}
      <footer className="py-2 text-center text-xs text-transparent select-none">
        .
      </footer>
    </div>
  );
};
