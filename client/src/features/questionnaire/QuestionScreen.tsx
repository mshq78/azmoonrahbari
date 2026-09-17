import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { uiContent } from '../../content/ui.fa';
import { OptionRow } from '../../components/OptionRow';
import { ProgressRule } from '../../components/ProgressRule';
import { GeraLogo } from '../../components/BrandLockup';
import { useAttempt } from '../attempt/AttemptContext';

/**
 * Long enough for the chosen option's own state change to register before the
 * screen moves on — any shorter and the tap feels unacknowledged.
 */
const ADVANCE_DELAY_MS = 260;

type Direction = 'forward' | 'back';

/**
 * Holds the entrance animation steady for the life of one question.
 *
 * The parent re-renders on every answer sync, and a className that changed
 * underneath a running animation would restart it — mid-flight, and possibly in
 * the other direction. Capturing the class on mount, with the element keyed by
 * question id, means each question animates in exactly once.
 */
const EnterTransition: React.FC<{ direction: Direction; children: React.ReactNode }> = ({
  direction,
  children,
}) => {
  const [enterClass] = useState(() =>
    direction === 'back' ? 'question-enter-back' : 'question-enter-forward',
  );
  return <div className={enterClass}>{children}</div>;
};

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

  // Which way the participant is travelling, so the incoming question enters
  // from the side they are heading towards.
  //
  // Recorded where the move is initiated rather than inferred by comparing this
  // render's position with the last one. Inferring it needs state that survives
  // exactly one render and no more, which nothing in React guarantees — an
  // effect updates it a render too late, and a ref read during render is reset
  // by StrictMode's double invocation. The two buttons already know which way
  // they go, so they say so.
  const directionRef = useRef<Direction>('forward');

  // Arriving from the review screen means going straight back there after one edit.
  const returnToReview = searchParams.get('from') === 'review';

  useEffect(() => {
    advancingRef.current = false;
    headingRef.current?.focus({ preventScroll: true });
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

    directionRef.current = 'forward';

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
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)]">
      <ProgressRule current={position} total={questions.length} syncState={syncState} />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {uiContent.questionnaire.progressLabel(position, questions.length)}: {question.text}
      </div>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* Keyed on the question id so React remounts the block and the enter
            animation runs again on every move. */}
        <EnterTransition key={question.id} direction={directionRef.current}>
          <div className="text-right">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-[22px] sm:text-[25px] font-semibold text-[var(--text-primary)] leading-[1.7] tracking-tight outline-none text-balance"
            >
              {question.text}
            </h1>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt=""
                className="mt-5 w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)]"
              />
            )}
          </div>

          <div
            role="radiogroup"
            aria-label={uiContent.questionnaire.optionsLabel}
            className="space-y-3 mt-7 sm:mt-9"
          >
            {question.options.map((option, optionIndex) => (
              <OptionRow
                key={option.id}
                id={String(option.id)}
                code={option.code}
                text={option.text}
                imageUrl={option.imageUrl}
                selected={selectedOptionId === option.id}
                staggerIndex={optionIndex}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>
        </EnterTransition>

        <div className="mt-10 flex items-center justify-between min-h-[48px]">
          {position > 1 ? (
            <button
              type="button"
              onClick={() => {
                directionRef.current = 'back';
                navigate(`/q/${position - 1}`);
              }}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 -mr-3 text-sm font-medium rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              {uiContent.questionnaire.prevButton}
            </button>
          ) : (
            <div />
          )}

          {returnToReview && (
            <button
              type="button"
              onClick={() => navigate('/review')}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 -ml-3 text-sm font-semibold rounded-[var(--radius-sm)] text-[var(--accent-gold)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
            >
              {uiContent.questionnaire.backToReview}
            </button>
          )}
        </div>
      </main>

      <footer className="pb-6 pt-4 flex justify-center">
        <GeraLogo />
      </footer>
    </div>
  );
};
