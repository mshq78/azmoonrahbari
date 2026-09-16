import React, { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { uiContent } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { PageShell } from '../../components/PageShell';
import { useAttempt } from '../attempt/AttemptContext';
import { useFinalize } from '@/state/useAttempt';

export const ReviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const { bootstrap, questions, answers, allAnswered, answeredCount } = useAttempt();
  const finalize = useFinalize();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // A ref, not `finalize.isPending`: the disabled state only takes effect after
  // a re-render, which leaves a window for a fast double-click.
  const submitting = useRef(false);

  if (bootstrap.attempt.status === 'Completed') return <Navigate to="/already" replace />;
  if (bootstrap.tieBreak) return <Navigate to="/tiebreak" replace />;

  const handleConfirm = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const result = await finalize.mutateAsync();
      setIsModalOpen(false);
      navigate(result.outcome === 'tie_break_required' ? '/tiebreak' : '/reveal', {
        replace: true,
      });
    } catch {
      // Keep the dialog open; the message below explains what happened, and the
      // same idempotency key is reused on the next attempt.
    } finally {
      submitting.current = false;
    }
  };

  return (
    <PageShell>
      <div className="text-right space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1.5">
            {uiContent.review.heading}
          </h1>
          <p className="text-[17px] text-[var(--text-secondary)] font-medium">
            {uiContent.review.summaryLine(answeredCount, questions.length)}
          </p>
        </div>

        {bootstrap.attempt.reopenCount > 0 && (
          <p
            role="status"
            className="text-sm leading-relaxed text-[var(--text-secondary)] bg-[var(--surface-highlight)] border border-[var(--accent-gold)]/40 rounded-xl px-4 py-3"
          >
            {uiContent.review.reopenedNotice}
          </p>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => {
            const selectedOptionId = answers[question.id]?.selectedOptionId;
            const chosen = question.options.find((option) => option.id === selectedOptionId);

            return (
              <div
                key={question.id}
                className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)] text-right space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold text-[var(--accent-gold)]">
                    {uiContent.review.questionLabel(index + 1)}
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate(`/q/${index + 1}?from=review`)}
                    className="text-sm font-bold text-[var(--accent-gold)] hover:underline min-h-[36px] px-2.5 py-1 rounded focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
                    aria-label={uiContent.review.editAria(index + 1)}
                  >
                    {uiContent.review.editAction}
                  </button>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {question.text}
                </p>

                <div className="pt-1 border-t border-[var(--border-subtle)]/60">
                  {chosen ? (
                    <div className="text-[16px] font-semibold text-[var(--text-primary)] leading-relaxed">
                      {chosen.text}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {uiContent.review.unansweredBadge}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {finalize.isError && (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-500/10 rounded-lg px-3.5 py-2.5"
          >
            {finalize.error.message}
          </p>
        )}

        <div className="pt-6 sticky bottom-4 z-10 bg-[var(--bg-app)]/90 backdrop-blur-sm pb-2">
          <Button
            variant="primary"
            fullWidth
            disabled={!allAnswered}
            onClick={() => setIsModalOpen(true)}
            className="text-lg py-3.5 shadow-md"
          >
            {uiContent.review.finalSubmitButton}
          </Button>
          {!allAnswered && (
            <p className="text-xs text-center text-[var(--text-muted)] mt-2">
              {uiContent.review.incompleteHint}
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={uiContent.confirmModal.title}
        message={uiContent.confirmModal.message}
        cancelText={uiContent.confirmModal.cancelButton}
        confirmText={uiContent.confirmModal.confirmButton}
        isPending={finalize.isPending}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </PageShell>
  );
};
