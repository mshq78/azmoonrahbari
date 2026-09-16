import React, { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { OptionRow } from '../../components/OptionRow';
import { PageShell } from '../../components/PageShell';
import { useAttempt } from '../attempt/AttemptContext';
import { useFinalize } from '@/state/useAttempt';

/**
 * Shown only when the server asked for a tie-break. The options it offers are
 * exactly the ones the server sent — the tied characters — and the client has
 * no idea which option maps to which character.
 */
export const TiebreakScreen: React.FC = () => {
  const navigate = useNavigate();
  const { bootstrap, answers, selectAnswer } = useAttempt();
  const finalize = useFinalize();

  const submitting = useRef(false);
  const tieBreak = bootstrap.tieBreak;
  const [selectedId, setSelectedId] = useState<number | null>(
    tieBreak ? (answers[tieBreak.questionId]?.selectedOptionId ?? null) : null,
  );

  if (bootstrap.attempt.status === 'Completed') return <Navigate to="/already" replace />;
  if (!tieBreak) return <Navigate to="/review" replace />;

  const handleSubmit = async () => {
    if (selectedId === null || submitting.current) return;
    submitting.current = true;
    try {
      // Save the choice first so it survives a failed finalize, then finalize
      // again with the fresh idempotency key.
      await selectAnswer(tieBreak.questionId, selectedId);
      const result = await finalize.mutateAsync();
      navigate(result.outcome === 'completed' ? '/reveal' : '/tiebreak', { replace: true });
    } catch {
      // Message shown below.
    } finally {
      submitting.current = false;
    }
  };

  return (
    <PageShell centered>
      <div className="text-right space-y-6">
        <div>
          <span className="text-sm font-semibold text-[var(--accent-gold)] block mb-2">
            {uiContent.tiebreak.smallLineAbove}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-[1.6]">
            {tieBreak.text}
          </h1>
        </div>

        <div
          role="radiogroup"
          aria-label={uiContent.tiebreak.optionsLabel}
          className="space-y-3.5 pt-2"
        >
          {tieBreak.options.map((option) => (
            <OptionRow
              key={option.id}
              id={String(option.id)}
              code={option.code}
              text={option.text}
              selected={selectedId === option.id}
              onSelect={() => setSelectedId(option.id)}
            />
          ))}
        </div>

        {finalize.isError && (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-500/10 rounded-lg px-3.5 py-2.5"
          >
            {finalize.error.message}
          </p>
        )}

        <div className="pt-6">
          <Button
            variant="primary"
            fullWidth
            disabled={selectedId === null}
            isLoading={finalize.isPending}
            onClick={handleSubmit}
            className="text-lg py-3.5"
          >
            {uiContent.tiebreak.submitButton}
          </Button>
        </div>
      </div>
    </PageShell>
  );
};
