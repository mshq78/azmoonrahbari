import React, { createContext, useContext, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { BootstrapResponse, PublicQuestion } from '@shared/types/public-api';
import { ErrorState, FullPageLoading } from '../states/StateViews';
import { attemptStore, type LocalAnswer, type SyncState } from '@/state/attemptStore';
import { useAttemptSnapshot, useBootstrap } from '@/state/useAttempt';

interface AttemptContextValue {
  bootstrap: BootstrapResponse;
  questions: PublicQuestion[];
  answers: Record<number, LocalAnswer>;
  syncState: SyncState;
  answeredCount: number;
  allAnswered: boolean;
  selectAnswer: (questionId: number, optionId: number) => Promise<void>;
  refetch: () => void;
}

const AttemptContext = createContext<AttemptContextValue | null>(null);

export function useAttempt(): AttemptContextValue {
  const value = useContext(AttemptContext);
  if (!value) throw new Error('useAttempt must be used inside RequireAttempt');
  return value;
}

/**
 * Loads the attempt once for every screen beneath it. Ownership comes from the
 * session cookie, so there is nothing to pass around: a missing or expired
 * session simply sends the participant back to the entry screen.
 */
export const RequireAttempt: React.FC = () => {
  const location = useLocation();
  const query = useBootstrap();
  const snapshot = useAttemptSnapshot();

  const value = useMemo<AttemptContextValue | null>(() => {
    if (!query.data) return null;

    const questions = query.data.content.questions;
    const answeredCount = questions.filter(
      (question) => snapshot.answers[question.id] !== undefined,
    ).length;

    return {
      bootstrap: query.data,
      questions,
      answers: snapshot.answers,
      syncState: snapshot.syncState,
      answeredCount,
      allAnswered: questions.length > 0 && answeredCount === questions.length,
      selectAnswer: (questionId, optionId) => attemptStore.select(questionId, optionId),
      refetch: () => void query.refetch(),
    };
  }, [query, snapshot]);

  if (query.isPending) return <FullPageLoading />;

  if (query.error?.isUnauthenticated) {
    return <Navigate to="/start" replace state={{ from: location.pathname }} />;
  }

  if (query.error) {
    return <ErrorState onRetry={() => void query.refetch()} message={query.error.message} />;
  }

  if (!value) return <FullPageLoading />;

  return (
    <AttemptContext.Provider value={value}>
      <Outlet />
    </AttemptContext.Provider>
  );
};

/**
 * Where a participant belongs given the server's view of their attempt.
 * Used after start/resume and whenever a screen is entered out of order.
 */
export function resolveDestination(bootstrap: BootstrapResponse): string {
  if (bootstrap.attempt.status === 'Completed') return '/already';
  if (bootstrap.tieBreak) return '/tiebreak';

  const answered = new Set(bootstrap.answers.map((a) => a.questionId));
  const firstUnanswered = bootstrap.content.questions.findIndex((q) => !answered.has(q.id));

  // Everything answered (including after an admin reopen) goes to review.
  if (firstUnanswered === -1) return '/review';
  return `/q/${firstUnanswered + 1}`;
}
