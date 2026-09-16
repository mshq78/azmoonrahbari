import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import { uiContent } from '../../content/ui.fa';
import { OptionRow } from '../../components/OptionRow';
import { Button } from '../../components/Button';
import { BrandLockup } from '../../components/BrandLockup';
import { ThemeToggle } from '../../components/ThemeToggle';

export const TiebreakScreen: React.FC = () => {
  const navigate = useNavigate();
  const { tiebreakQuestion, selectTiebreakAnswer, finalizeQuiz } = useQuiz();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In mock mode show 2 options by default as per prompt spec, or all 5 if desired
  const options = tiebreakQuestion.options.slice(0, 2);

  const handleSelectOption = (optId: string) => {
    setSelectedId(optId);
    selectTiebreakAnswer(optId);
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    try {
      await finalizeQuiz();
      navigate('/reveal');
    } catch {
      navigate('/reveal');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 max-w-xl mx-auto">
      <header className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]/60">
        <BrandLockup compact />
        <ThemeToggle compact />
      </header>

      <main className="my-auto py-8 text-right space-y-6">
        <div>
          <span className="text-sm font-semibold text-[var(--accent-gold)] block mb-2">
            {uiContent.tiebreak.smallLineAbove}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-[1.6]">
            {uiContent.tiebreak.question}
          </h1>
        </div>

        <div role="radiogroup" aria-label="گزینه‌های تصمیم نهایی" className="space-y-3.5 pt-2">
          {options.map((opt, idx) => (
            <OptionRow
              key={opt.id}
              id={opt.id}
              code={opt.code}
              text={opt.text}
              selected={selectedId === opt.id}
              onSelect={() => handleSelectOption(opt.id)}
              index={idx}
            />
          ))}
        </div>

        <div className="pt-6">
          <Button
            variant="primary"
            fullWidth
            disabled={!selectedId}
            isLoading={isSubmitting}
            onClick={handleSubmit}
            className="text-lg py-3.5"
          >
            {uiContent.tiebreak.submitButton}
          </Button>
        </div>
      </main>

      <footer className="py-2 text-center text-xs text-transparent select-none">
        .
      </footer>
    </div>
  );
};
