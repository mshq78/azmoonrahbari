import React, { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';
import { OptionRow } from '../../components/OptionRow';
import { ProgressRule } from '../../components/ProgressRule';
import { useAttempt } from '../attempt/AttemptContext';

const ADVANCE_DELAY_MS = 220;

export const QuestionScreen: React.FC = () => {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bootstrap, questions, answers, syncState, selectAnswer } = useAttempt();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const advancingRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const position = Number.parseInt(index ?? '1', 10);
  const question = questions[position - 1];

  // Arriving from the review screen means going straight back there after one edit.
  const returnToReview = searchParams.get('from') === 'review';

  useEffect(() => {
    advancingRef.current = false;
    headingRef.current?.focus();
    return () => {
      if (advanceTimer.current !== null) clearTimeout(advanceTimer.current);
    };
  }, [position]);

  if (bootstrap.attempt.status === 'Completed') return <Navigate to="/already" replace />;
  if (bootstrap.tieBreak) return <Navigate to="/tiebreak" replace />;
  if (!Number.isFinite(position) || position < 1) return <Navigate to="/q/1" replace />;
  if (position > questions.length) return <Navigate to="/review" replace />;
  if (!question) return <Navigate to="/review" replace />;

  const selectedOptionId = answers[question.id]?.selectedOptionId;

  const handleSelect = (optionId: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    // The write is local and instant; the network call happens in the
    // background, so advancing never waits on it.
    void selectAnswer(question.id, optionId);

    advanceTimer.current = setTimeout(() => {
      if (returnToReview) navigate('/review');
      else if (position < questions.length) navigate(`/q/${position + 1}`);
      else navigate('/review');
    }, ADVANCE_DELAY_MS);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-app)]">
      <ProgressRule current={position} total={questions.length} syncState={syncState} />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {uiContent.questionnaire.progressLabel(position, questions.length)}: {question.text}
      </div>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        <div key={question.id} className="space-y-6 sm:space-y-8">
          <div className="text-right">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-[21px] sm:text-[23px] md:text-[24px] font-semibold text-[var(--text-primary)] leading-[1.65] outline-none"
            >
              {question.text}
            </h1>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt=""
                className="mt-4 w-full rounded-xl border border-[var(--border-subtle)]"
              />
            )}
          </div>

          <div
            role="radiogroup"
            aria-label={uiContent.questionnaire.optionsLabel}
            className="space-y-3 sm:space-y-3.5"
          >
            {question.options.map((option) => (
              <OptionRow
                key={option.id}
                id={String(option.id)}
                code={option.code}
                text={option.text}
                imageUrl={option.imageUrl}
                selected={selectedOptionId === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 flex items-center justify-between min-h-[48px]">
          {position > 1 ? (
            <button
              type="button"
              onClick={() => navigate(`/q/${position - 1}`)}
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
              onClick={() => navigate('/review')}
              className="inline-flex items-center gap-1.5 min-h-[48px] px-4 py-2 text-sm font-semibold rounded-lg text-[var(--accent-gold)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
            >
              {uiContent.questionnaire.backToReview}
            </button>
          )}
        </div>
      </main>

      <div className="py-2" aria-hidden="true" />
    </div>
  );
};
