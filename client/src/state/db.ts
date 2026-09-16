import Dexie, { type Table } from 'dexie';
import type { PublicQuestion, PublicTieBreak } from '@shared/types/public-api';

/**
 * Durable local state for an in-progress attempt.
 *
 * Everything here is namespaced by `attemptKey` = `${attemptPublicId}:${testVersionId}`,
 * so a different attempt — or the same attempt moved to a different version —
 * never reads another's cached content or answers.
 *
 * The theme preference deliberately lives in localStorage instead, and is never
 * touched by anything in this file.
 */

export type AnswerSyncStatus = 'pending' | 'synced' | 'failed';

export interface CachedAttempt {
  attemptKey: string;
  attemptPublicId: string;
  testVersionId: number;
  versionNumber: number;
  /** Compared against the server on every bootstrap; a mismatch forces a refetch. */
  contentHash: string;
  questions: PublicQuestion[];
  tieBreak: PublicTieBreak | null;
  completionCycle: number;
  /** Reused across retries of one finalize; cleared once a finalize resolves. */
  finalizeIdempotencyKey: string | null;
  updatedAt: number;
}

export interface CachedAnswer {
  /** `${attemptKey}:${questionId}` */
  id: string;
  attemptKey: string;
  questionId: number;
  selectedOptionId: number;
  clientMutationId: string;
  status: AnswerSyncStatus;
  /** Last local change; used to decide between local and server state on resume. */
  updatedAt: number;
}

class AppDatabase extends Dexie {
  attempts!: Table<CachedAttempt, string>;
  answers!: Table<CachedAnswer, string>;

  constructor() {
    super('azmoonrahbari');
    this.version(1).stores({
      attempts: 'attemptKey',
      answers: 'id, attemptKey, status, [attemptKey+questionId]',
    });
  }
}

export const db = new AppDatabase();

export function makeAttemptKey(attemptPublicId: string, testVersionId: number): string {
  return `${attemptPublicId}:${testVersionId}`;
}

export function makeAnswerId(attemptKey: string, questionId: number): string {
  return `${attemptKey}:${questionId}`;
}

/**
 * Removes every trace of one attempt. Called only after a definitive successful
 * finalize — never on an error, a tie-break, or a lost connection.
 */
export async function clearAttemptData(attemptKey: string): Promise<void> {
  await db.transaction('rw', db.attempts, db.answers, async () => {
    await db.answers.where('attemptKey').equals(attemptKey).delete();
    await db.attempts.delete(attemptKey);
  });
}

/** Drops caches for any attempt other than the current one. */
export async function pruneOtherAttempts(currentKey: string): Promise<void> {
  const keys = await db.attempts.toCollection().primaryKeys();
  for (const key of keys) {
    if (key !== currentKey) await clearAttemptData(key);
  }
}
