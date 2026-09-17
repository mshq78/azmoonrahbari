import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { testAttempts, type TestAttemptRow } from '../../db/schema/index';
import { ERROR_CODES, serviceUnavailable } from '../../shared/errors';
import { generatePublicId } from '../../shared/ids';
import { nowUtc } from '../../shared/time';
import {
  findOrCreateParticipant,
  isDuplicateKeyError,
  normalizeIdentity,
} from '../participants/service';
import { getActiveVersion } from '../questionnaire/repository';
import { getAttemptByParticipantId } from './repository';

export interface StartOrResumeInput {
  fullName: string;
  mobile: string;
}

/**
 * Registers a participant or resumes their existing attempt.
 *
 * Everything that decides identity happens in one transaction so two devices
 * submitting the same details at the same moment converge on one participant
 * and one attempt. A participant who already finished keeps their completed
 * attempt — this endpoint never restarts one.
 */
export async function startOrResume(input: StartOrResumeInput): Promise<TestAttemptRow> {
  const identity = normalizeIdentity(input);

  const activeVersion = await getActiveVersion();
  if (!activeVersion) {
    throw serviceUnavailable(ERROR_CODES.NO_PUBLISHED_VERSION);
  }

  return db.transaction(async (tx) => {
    const participant = await findOrCreateParticipant(identity, tx);

    const existing = await getAttemptByParticipantId(participant.id, tx);
    if (existing) {
      const now = nowUtc();
      // Only the activity clock moves on resume; the attempt keeps its own
      // version, status, answers and tracking code.
      await tx
        .update(testAttempts)
        .set({ lastActivityAt: now, updatedAt: now })
        .where(eq(testAttempts.id, existing.id));
      return { ...existing, lastActivityAt: now, updatedAt: now };
    }

    const now = nowUtc();
    try {
      await tx.insert(testAttempts).values({
        publicId: generatePublicId(),
        participantId: participant.id,
        testVersionId: activeVersion.id,
        status: 'NotStarted',
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      // `participantId` is UNIQUE: a concurrent request created the attempt first.
      if (!isDuplicateKeyError(error)) throw error;
    }

    const attempt = await getAttemptByParticipantId(participant.id, tx);
    if (!attempt) {
      throw new Error('Attempt row disappeared immediately after insert');
    }
    return attempt;
  });
}
