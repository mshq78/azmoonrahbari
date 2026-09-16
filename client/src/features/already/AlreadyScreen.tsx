import React from 'react';
import { Navigate } from 'react-router-dom';
import type { CharacterCode } from '../../content/characters.fa';
import { uiContent } from '../../content/ui.fa';
import { PageShell } from '../../components/PageShell';
import { useAttempt } from '../attempt/AttemptContext';
import { ResultCard } from '../result/ResultCard';

/** Shown when a participant who already finished returns. */
export const AlreadyScreen: React.FC = () => {
  const { bootstrap } = useAttempt();

  if (bootstrap.attempt.status !== 'Completed' || !bootstrap.result) {
    // An admin reopened the attempt: send them back to review their answers.
    return <Navigate to="/review" replace />;
  }

  return (
    <PageShell footer={uiContent.result.closingLine}>
      <ResultCard
        characterCode={bootstrap.result.characterCode as CharacterCode}
        trackingCode={bootstrap.attempt.trackingCode}
        heading={uiContent.already.heading}
        subtitle={uiContent.already.subtitle}
      />
    </PageShell>
  );
};
