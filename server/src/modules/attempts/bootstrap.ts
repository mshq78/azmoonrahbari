import { eq } from 'drizzle-orm';
import type { CharacterCode } from '../../../../shared/contracts/constants';
import type { BootstrapResponse, ConfirmedAnswer } from '../../../../shared/types/public-api';
import { db, type DbOrTx } from '../../db/client';
import { participants, type TestAttemptRow } from '../../db/schema/index';
import { ERROR_CODES, notFound } from '../../shared/errors';
import { toIso, toIsoRequired } from '../../shared/time';
import { loadMediaMapForQuestions } from '../questionnaire/media-map';
import { loadVersionContent, type VersionContent } from '../questionnaire/repository';
import {
  computeContentHash,
  toPublicQuestion,
  toPublicTieBreak,
} from '../questionnaire/serializers';
import { loadAnswers } from './repository';

/**
 * Builds the single payload every public screen is driven from. An attempt
 * always stays on its own `testVersionId`, so a version published mid-attempt
 * never changes the questions underneath a participant.
 */
export async function buildBootstrap(
  attempt: TestAttemptRow,
  csrfToken: string,
  conn: DbOrTx = db,
): Promise<BootstrapResponse> {
  const content = await loadVersionContent(attempt.testVersionId, conn);
  if (!content) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

  const [participant] = await conn
    .select()
    .from(participants)
    .where(eq(participants.id, attempt.participantId))
    .limit(1);
  if (!participant) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

  const allQuestions = [...content.scored, ...(content.tieBreak ? [content.tieBreak] : [])];
  const media = await loadMediaMapForQuestions(allQuestions, conn);

  const scoredQuestionIds = new Set(content.scored.map((q) => q.id));
  const answerRows = await loadAnswers(attempt.id, conn);

  // Only answers to currently-active scored questions are surfaced; an answer
  // to a deactivated question stays in the database but is not shown.
  const confirmedAnswers: ConfirmedAnswer[] = answerRows
    .filter((row) => scoredQuestionIds.has(row.questionId))
    .map((row) => ({
      questionId: row.questionId,
      selectedOptionId: row.selectedOptionId,
      updatedAt: toIsoRequired(row.updatedAt),
    }))
    .sort((a, b) => a.questionId - b.questionId);

  return {
    attempt: {
      publicId: attempt.publicId,
      status: attempt.status,
      testVersionId: attempt.testVersionId,
      versionNumber: content.version.versionNumber,
      completionCycle: attempt.completionCycle,
      reopenCount: attempt.reopenCount,
      startedAt: toIso(attempt.startedAt),
      lastActivityAt: toIsoRequired(attempt.lastActivityAt),
      completedAt: toIso(attempt.completedAt),
      trackingCode: attempt.trackingCode,
    },
    participant: {
      firstName: participant.firstName,
      lastName: participant.lastName,
      mobile: participant.mobileOriginal,
      orgCode: attempt.orgCode,
    },
    content: {
      versionNumber: content.version.versionNumber,
      contentHash: computeContentHash(
        content.version.versionNumber,
        content.scored,
        content.tieBreak,
      ),
      questions: content.scored.map((question) => toPublicQuestion(question, media)),
    },
    answers: confirmedAnswers,
    progress: { answered: confirmedAnswers.length, total: content.scored.length },
    tieBreak: buildPendingTieBreak(attempt, content),
    result: attempt.resultCharacterCode
      ? { characterCode: attempt.resultCharacterCode as CharacterCode }
      : null,
    csrfToken,
  };
}

/** The tie-break block is present only while one is actually pending. */
function buildPendingTieBreak(attempt: TestAttemptRow, content: VersionContent) {
  if (!attempt.tieBreakRequired || attempt.status === 'Completed') return null;
  if (!content.tieBreak) return null;

  const tied = attempt.tiedCharacters ?? [];
  if (tied.length < 2) return null;

  const payload = toPublicTieBreak(content.tieBreak, tied);
  return payload.options.length >= 2 ? payload : null;
}
