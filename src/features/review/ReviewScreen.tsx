import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import { uiContent, toPersianDigits } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { ThemeToggle } from '../../components/ThemeToggle';
import { BrandLockup } from '../../components/BrandLockup';

export const ReviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    questions,
    answers,
    allAnswered,
    answeredCount,
    finalizeQuiz,
    setReturnToReview,
  } = useQuiz();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditQuestion = (index: number) => {
    setReturnToReview(true);
    navigate(`/q/${index}`);
  };

  const handleConfirmFinalize = async () => {
    setIsSubmitting(true);
    try {
      const res = await finalizeQuiz();
      setIsSubmitting(false);
      setIsModalOpen(false);

      if (res.outcome === 'tiebreak_required') {
        navigate('/tiebreak');
      } else {
        navigate('/reveal');
      }
    } catch {
      setIsSubmitting(false);
      setIsModalOpen(false);
      // Fallback navigate to reveal
      navigate('/reveal');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]/60">
        <BrandLockup compact />
        <ThemeToggle compact />
      </header>

      {/* Main Review Section */}
      <main className="py-6 text-right space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1.5">
            {uiContent.review.heading}
          </h1>
          <p className="text-[17px] text-[var(--text-secondary)] font-medium">
            {uiContent.review.summaryLine(answeredCount, questions.length)}
          </p>
        </div>

        {/* Question List */}
        <div className="space-y-4">
          {questions.map((q) => {
            const chosenOptionId = answers[q.id];
            const chosenOption = q.options.find((opt) => opt.id === chosenOptionId);

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-app)] text-right space-y-2.5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--accent-gold)]">
                      سؤال {toPersianDigits(q.index)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEditQuestion(q.index)}
                    className="text-sm font-bold text-[var(--accent-gold)] hover:underline min-h-[36px] px-2.5 py-1 rounded focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
                    aria-label={`ویرایش پاسخ سؤال ${toPersianDigits(q.index)}`}
                  >
                    {uiContent.review.editAction}
                  </button>
                </div>

                {/* Question title (small) */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {q.text}
                </p>

                {/* Chosen Option (emphasised) or Unanswered Badge */}
                <div className="pt-1 border-t border-[var(--border-subtle)]/60">
                  {chosenOption ? (
                    <div className="text-[16px] font-semibold text-[var(--text-primary)] leading-relaxed">
                      {chosenOption.text}
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

        {/* Primary Action: Final Submit */}
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
              برای ثبت نهایی، لطفاً به تمامی ۱۲ سؤال پاسخ دهید.
            </p>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        title={uiContent.confirmModal.title}
        message={uiContent.confirmModal.message}
        cancelText={uiContent.confirmModal.cancelButton}
        confirmText={uiContent.confirmModal.confirmButton}
        isPending={isSubmitting}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={handleConfirmFinalize}
      />

      <footer className="py-2 text-center text-xs text-transparent select-none">
        .
      </footer>
    </div>
  );
};
