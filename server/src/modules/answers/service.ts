import { and, eq } from 'drizzle-orm';
import type { SaveAnswerResponse } from '../../../../shared/types/public-api';
import { db } from '../../db/client';
import { answers, testAttempts } from '../../db/schema/index';
import { conflict, ERROR_CODES, notFound, badRequest } from '../../shared/errors';
import { nowUtc, toIsoRequired } from '../../shared/time';
import { loadVersionContent } from '../questionnaire/repository';
import { lockAttempt } from '../attempts/repository';

export interface SaveAnswerInput {
  attemptId: number;
  questionId: number;
  selectedOptionId: number;
  clientMutationId: string;
}

/**
 * Upserts one answer.
 *
 * Idempotent per `clientMutationId`: the client retries the same mutation after
 * a dropped connection, and a repeat is a no-op rather than a second row. The
 * unique index on (attemptId, questionId) means one question can never end up
 * with two answers.
 */
export async function saveAnswer(input: SaveAnswerInput): Promise<SaveAnswerResponse> {
  return db.transaction(async (tx) => {
    const attempt = await lockAttempt(input.attemptId, tx);
    if (!attempt) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

    if (attempt.status === 'Completed') {
      throw conflict(ERROR_CODES.ATTEMPT_COMPLETED);
    }

    const content = await loadVersionContent(attempt.testVersionId, tx);
    if (!content) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

    const allQuestions = [...content.scored, ...(content.tieBreak ? [content.tieBreak] : [])];
    // Version membership is checked against the attempt's own version, never
    // the currently-published one.
    const question = allQuestions.find((q) => q.id === input.questionId);
    if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);

    const option = question.options.find((o) => o.id === input.selectedOptionId);
    if (!option) {
      throw badRequest(ERROR_CODES.OPTION_MISMATCH);
    }

    if (question.isTieBreaker) {
      const tied = attempt.tiedCharacters ?? [];
      if (!attempt.tieBreakRequired || !tied.includes(option.internalValue)) {
        throw badRequest(ERROR_CODES.TIE_BREAK_OPTION_INVALID);
      }
    }

    const now = nowUtc();
    const [existing] = await tx
      .select()
      .from(answers)
      .where(and(eq(answers.attemptId, attempt.id), eq(answers.questionId, question.id)))
      .limit(1);

    if (existing) {
      const unchanged =
        existing.selectedOptionId === option.id &&
        existing.lastClientMutationId === input.clientMutationId;
      if (!unchanged) {
        await tx
          .update(answers)
          .set({
            selectedOptionId: option.id,
            lastClientMutationId: input.clientMutationId,
            updatedAt: now,
          })
          .where(eq(answers.id, existing.id));
      }
    } else {
      await tx.insert(answers).values({
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionId: option.id,
        lastClientMutationId: input.clientMutationId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // The first saved answer moves the attempt out of NotStarted.
    const becomesInProgress = attempt.status === 'NotStarted';
    await tx
      .update(testAttempts)
      .set({
        status: becomesInProgress ? 'InProgress' : attempt.status,
        startedAt: attempt.startedAt ?? now,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(testAttempts.id, attempt.id));

    const answered = await countScoredAnswers(attempt.id, content.scored.map((q) => q.id), tx);

    return {
      questionId: question.id,
      selectedOptionId: option.id,
      clientMutationId: input.clientMutationId,
      savedAt: toIsoRequired(now),
      attemptStatus: becomesInProgress ? ('InProgress' as const) : attempt.status,
      progress: { answered, total: content.scored.length },
    };
  });
}

async function countScoredAnswers(
  attemptId: number,
  scoredQuestionIds: number[],
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<number> {
  if (scoredQuestionIds.length === 0) return 0;
  const rows = await tx
    .select({ questionId: answers.questionId })
    .from(answers)
    .where(eq(answers.attemptId, attemptId));
  const scored = new Set(scoredQuestionIds);
  return rows.filter((row) => scored.has(row.questionId)).length;
}
