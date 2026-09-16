import { and, eq } from 'drizzle-orm';
import type { CharacterCode } from '../../../../shared/contracts/constants';
import type {
  FinalizeCompletedResponse,
  FinalizeResponse,
} from '../../../../shared/types/public-api';
import { db, type Tx } from '../../db/client';
import {
  answers,
  characters,
  idempotencyRecords,
  testAttempts,
  type OptionRow,
  type TestAttemptRow,
} from '../../db/schema/index';
import {
  badRequest,
  conflict,
  ERROR_CODES,
  notFound,
  unprocessable,
} from '../../shared/errors';
import { hashRequestBody } from '../../shared/ids';
import { nowUtc, toIsoRequired } from '../../shared/time';
import { isDuplicateKeyError } from '../participants/service';
import { loadVersionContent, type QuestionWithOptions } from '../questionnaire/repository';
import { toPublicTieBreak } from '../questionnaire/serializers';
import { resolveTieDeterministically, tallyAnswers, type ScoredAnswer } from '../scoring/scoring';
import { allocateTrackingCode } from '../scoring/trackingCode';

const SCOPE = 'finalize';
/** Replayable window for a finalize key; long enough to cover any client retry. */
const RECORD_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface FinalizeInput {
  attemptId: number;
  idempotencyKey: string;
  answers: Array<{ questionId: number; selectedOptionId: number }>;
}

export interface FinalizeOutcome {
  status: number;
  body: FinalizeResponse;
  /** True when the response came from a stored idempotency record. */
  replayed: boolean;
}

/**
 * Closes an attempt: validates the full answer snapshot, scores it, and either
 * completes the attempt or asks for a tie-break.
 *
 * The whole thing runs in one transaction behind a row lock, and the response
 * is recorded against the Idempotency-Key so a retried or double-clicked
 * finalize replays the first answer instead of scoring twice.
 */
export async function finalizeAttempt(input: FinalizeInput): Promise<FinalizeOutcome> {
  const requestHash = hashRequestBody({
    answers: [...input.answers].sort(
      (a, b) => a.questionId - b.questionId || a.selectedOptionId - b.selectedOptionId,
    ),
  });

  return db.transaction(async (tx) => {
    // 1. Lock the attempt so concurrent finalizes serialize.
    const [attempt] = await tx
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, input.attemptId))
      .limit(1)
      .for('update');
    if (!attempt) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

    // 2. Replay a previous response for this key, or reject a key reused with a
    //    different payload.
    const replay = await findIdempotencyRecord(tx, input.idempotencyKey);
    if (replay) {
      if (replay.attemptId !== attempt.id || replay.completionCycle !== attempt.completionCycle) {
        throw conflict(ERROR_CODES.IDEMPOTENCY_CONFLICT);
      }
      if (replay.requestHash !== requestHash) {
        throw conflict(ERROR_CODES.IDEMPOTENCY_CONFLICT);
      }
      return {
        status: replay.responseStatus,
        body: JSON.parse(replay.responseBody) as FinalizeResponse,
        replayed: true,
      };
    }

    // 3. An already-completed attempt returns its existing result unchanged.
    if (attempt.status === 'Completed') {
      const body = completedResponseFor(attempt);
      await storeIdempotencyRecord(tx, input.idempotencyKey, attempt, requestHash, 200, body);
      return { status: 200, body, replayed: false };
    }

    const content = await loadVersionContent(attempt.testVersionId, tx);
    if (!content) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

    // 4. Every submitted question and option must belong to this attempt's version.
    const submitted = validateSubmission(input.answers, content.scored, content.tieBreak);

    // 5. Exactly one valid answer for every active, non-tie-break question.
    const missingQuestionIds = content.scored
      .filter((question) => !submitted.scored.has(question.id))
      .map((question) => question.id);
    if (missingQuestionIds.length > 0) {
      throw unprocessable(ERROR_CODES.INCOMPLETE_ANSWERS, { missingQuestionIds });
    }

    const now = nowUtc();

    // 6. Persist the snapshot.
    for (const [questionId, option] of submitted.scored) {
      await upsertAnswer(tx, attempt.id, questionId, option.id, now);
    }
    if (submitted.tieBreak && isUsableTieBreakChoice(attempt, submitted.tieBreak.option)) {
      await upsertAnswer(
        tx,
        attempt.id,
        submitted.tieBreak.questionId,
        submitted.tieBreak.option.id,
        now,
      );
    }

    // 7. Score.
    const scoredAnswers: ScoredAnswer[] = content.scored.map((question) => ({
      question,
      option: submitted.scored.get(question.id)!,
    }));
    const { tally, winners } = tallyAnswers(scoredAnswers);

    if (winners.length === 0) {
      // No scored answers at all should have been caught above; treat as a bad request.
      throw unprocessable(ERROR_CODES.INCOMPLETE_ANSWERS, {
        missingQuestionIds: content.scored.map((q) => q.id),
      });
    }

    if (winners.length === 1) {
      const body = await completeAttempt(tx, attempt, winners[0], tally, now);
      await storeIdempotencyRecord(tx, input.idempotencyKey, attempt, requestHash, 200, body);
      return { status: 200, body, replayed: false };
    }

    // A tie. An existing tie-break answer for one of the tied characters resolves it.
    const existingTieChoice = await readTieBreakChoice(tx, attempt.id, content.tieBreak);
    if (existingTieChoice && winners.includes(existingTieChoice.internalValue)) {
      const body = await completeAttempt(
        tx,
        attempt,
        existingTieChoice.internalValue,
        tally,
        now,
      );
      await storeIdempotencyRecord(tx, input.idempotencyKey, attempt, requestHash, 200, body);
      return { status: 200, body, replayed: false };
    }

    const tieBreakPayload = content.tieBreak ? toPublicTieBreak(content.tieBreak, winners) : null;

    // Fallback: the tie-break question cannot separate these characters, so
    // resolve deterministically rather than stranding the participant.
    if (!tieBreakPayload || tieBreakPayload.options.length < 2) {
      const tieOrder = await loadTieOrder(tx);
      const winner = resolveTieDeterministically(winners, scoredAnswers, tieOrder);
      const body = await completeAttempt(tx, attempt, winner, tally, now);
      await storeIdempotencyRecord(tx, input.idempotencyKey, attempt, requestHash, 200, body);
      return { status: 200, body, replayed: false };
    }

    await tx
      .update(testAttempts)
      .set({
        status: 'InProgress',
        tieBreakRequired: true,
        tiedCharacters: winners,
        resultScores: tally,
        startedAt: attempt.startedAt ?? now,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(testAttempts.id, attempt.id));

    const body: FinalizeResponse = { outcome: 'tie_break_required', tieBreak: tieBreakPayload };
    await storeIdempotencyRecord(tx, input.idempotencyKey, attempt, requestHash, 200, body);
    return { status: 200, body, replayed: false };
  });
}

interface ValidatedSubmission {
  scored: Map<number, OptionRow>;
  tieBreak: { questionId: number; option: OptionRow } | null;
}

function validateSubmission(
  submittedAnswers: FinalizeInput['answers'],
  scoredQuestions: readonly QuestionWithOptions[],
  tieBreakQuestion: QuestionWithOptions | null,
): ValidatedSubmission {
  const byId = new Map<number, QuestionWithOptions>();
  for (const question of scoredQuestions) byId.set(question.id, question);
  if (tieBreakQuestion) byId.set(tieBreakQuestion.id, tieBreakQuestion);

  const scored = new Map<number, OptionRow>();
  let tieBreak: ValidatedSubmission['tieBreak'] = null;
  const seen = new Set<number>();

  for (const entry of submittedAnswers) {
    if (seen.has(entry.questionId)) {
      // Two answers for one question is never a valid snapshot.
      throw badRequest(ERROR_CODES.VALIDATION_ERROR);
    }
    seen.add(entry.questionId);

    const question = byId.get(entry.questionId);
    if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);

    const option = question.options.find((o) => o.id === entry.selectedOptionId);
    if (!option) throw badRequest(ERROR_CODES.OPTION_MISMATCH);

    if (question.isTieBreaker) {
      tieBreak = { questionId: question.id, option };
    } else {
      scored.set(question.id, option);
    }
  }

  return { scored, tieBreak };
}

/** A tie-break choice is only stored while one is pending and names a tied character. */
function isUsableTieBreakChoice(attempt: TestAttemptRow, option: OptionRow): boolean {
  if (!attempt.tieBreakRequired) return false;
  return (attempt.tiedCharacters ?? []).includes(option.internalValue);
}

async function readTieBreakChoice(
  tx: Tx,
  attemptId: number,
  tieBreakQuestion: QuestionWithOptions | null,
): Promise<OptionRow | null> {
  if (!tieBreakQuestion) return null;
  const [row] = await tx
    .select()
    .from(answers)
    .where(and(eq(answers.attemptId, attemptId), eq(answers.questionId, tieBreakQuestion.id)))
    .limit(1);
  if (!row) return null;
  return tieBreakQuestion.options.find((o) => o.id === row.selectedOptionId) ?? null;
}

async function completeAttempt(
  tx: Tx,
  attempt: TestAttemptRow,
  characterCode: string,
  tally: Record<string, number>,
  now: Date,
): Promise<FinalizeCompletedResponse> {
  const trackingCode = attempt.trackingCode ?? (await allocateTrackingCode(tx));

  await tx
    .update(testAttempts)
    .set({
      status: 'Completed',
      resultCharacterCode: characterCode,
      resultScores: tally,
      resultComputedAt: now,
      completedAt: now,
      trackingCode,
      tieBreakRequired: false,
      tiedCharacters: null,
      startedAt: attempt.startedAt ?? now,
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(testAttempts.id, attempt.id));

  return {
    outcome: 'completed',
    trackingCode,
    completedAt: toIsoRequired(now),
    result: { characterCode: characterCode as CharacterCode },
  };
}

function completedResponseFor(attempt: TestAttemptRow): FinalizeCompletedResponse {
  if (!attempt.trackingCode || !attempt.completedAt || !attempt.resultCharacterCode) {
    // A Completed row always carries all three; a missing one is data corruption.
    throw conflict(ERROR_CODES.CONFLICT);
  }
  return {
    outcome: 'completed',
    trackingCode: attempt.trackingCode,
    completedAt: toIsoRequired(attempt.completedAt),
    result: { characterCode: attempt.resultCharacterCode as CharacterCode },
  };
}

async function upsertAnswer(
  tx: Tx,
  attemptId: number,
  questionId: number,
  optionId: number,
  now: Date,
): Promise<void> {
  await tx
    .insert(answers)
    .values({
      attemptId,
      questionId,
      selectedOptionId: optionId,
      createdAt: now,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({ set: { selectedOptionId: optionId, updatedAt: now } });
}

async function findIdempotencyRecord(tx: Tx, key: string) {
  const [row] = await tx
    .select()
    .from(idempotencyRecords)
    .where(and(eq(idempotencyRecords.scope, SCOPE), eq(idempotencyRecords.idempotencyKey, key)))
    .limit(1);
  return row ?? null;
}

async function storeIdempotencyRecord(
  tx: Tx,
  key: string,
  attempt: TestAttemptRow,
  requestHash: string,
  status: number,
  body: FinalizeResponse,
): Promise<void> {
  const now = nowUtc();
  try {
    await tx.insert(idempotencyRecords).values({
      scope: SCOPE,
      idempotencyKey: key,
      attemptId: attempt.id,
      completionCycle: attempt.completionCycle,
      requestHash,
      responseStatus: status,
      responseBody: JSON.stringify(body),
      createdAt: now,
      expiresAt: new Date(now.getTime() + RECORD_TTL_MS),
    });
  } catch (error) {
    // Another request inserted the same key first; its stored response wins and
    // is identical, because both ran behind the same attempt row lock.
    if (!isDuplicateKeyError(error)) throw error;
  }
}

/** `characters.tieOrder` is the final, fully deterministic ordering. */
async function loadTieOrder(tx: Tx): Promise<ReadonlyMap<string, number>> {
  const rows = await tx
    .select({ code: characters.code, tieOrder: characters.tieOrder })
    .from(characters);
  return new Map(rows.map((row) => [row.code, row.tieOrder]));
}
