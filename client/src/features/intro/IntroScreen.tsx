import React from 'react';
import { useNavigate } from 'react-router-dom';
import { testIntroContent } from '../../content/testIntro.fa';
import { uiContent } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { PageShell } from '../../components/PageShell';
import { ErrorState, FullPageLoading, UnavailableState } from '../states/StateViews';
import { useConfig } from '@/state/useAttempt';

export const IntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const config = useConfig();

  if (config.isPending) return <FullPageLoading />;
  if (config.isError) {
    return <ErrorState onRetry={() => void config.refetch()} />;
  }
  // No published version: registration is closed, and the message says nothing
  // about why or about the admin side.
  if (!config.data.registrationOpen) return <UnavailableState />;

  return (
    <PageShell centered footer={uiContent.footer.intro}>
      <div className="space-y-6 text-right">
        <div className="w-12 h-[2px] bg-[var(--accent-gold)]" aria-hidden="true" />

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] leading-[1.3] tracking-tight">
          {testIntroContent.title}
        </h1>

        <div className="space-y-4 pt-2 prose-persian">
          {testIntroContent.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-[17px] sm:text-[18px] leading-[1.75] text-[var(--text-secondary)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-6">
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/start')}
            className="text-lg py-3.5"
          >
            {testIntroContent.startButton}
          </Button>
        </div>
      </div>
    </PageShell>
  );
};
