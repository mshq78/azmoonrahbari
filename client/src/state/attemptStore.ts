import type { BootstrapResponse } from '@shared/types/public-api';
import { ApiError } from '@/services/http';
import { saveAnswer } from '@/services/api';
import {
  clearAttemptData,
  db,
  makeAnswerId,
  makeAttemptKey,
  pruneOtherAttempts,
  type AnswerSyncStatus,
  type CachedAnswer,
  type CachedAttempt,
} from './db';

export type SyncState = 'idle' | 'saving' | 'saved' | 'failed';

export interface LocalAnswer {
  questionId: number;
  selectedOptionId: number;
  status: AnswerSyncStatus;
  updatedAt: number;
}

export interface AttemptSnapshot {
  ready: boolean;
  attemptKey: string | null;
  answers: Record<number, LocalAnswer>;
  syncState: SyncState;
  pendingCount: number;
}

const EMPTY: AttemptSnapshot = {
  ready: false,
  attemptKey: null,
  answers: {},
  syncState: 'idle',
  pendingCount: 0,
};

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 30000];
const SAVED_BADGE_MS = 1800;

function newMutationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Local answer state and the background sync loop.
 *
 * Selecting an option writes to Dexie and updates the UI immediately; the
 * network call happens afterwards and is retried with backoff. A question never
 * ends up with two answers, because both the local row and the server row are
 * keyed by (attempt, question).
 */
class AttemptStore {
  private snapshot: AttemptSnapshot = EMPTY;
  private listeners = new Set<() => void>();
  private attemptKey: string | null = null;
  private flushing = false;
  private retryIndex = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private savedTimer: ReturnType<typeof setTimeout> | null = null;
  /** Set once the server says the attempt is closed; stops the retry loop. */
  private halted = false;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): AttemptSnapshot => this.snapshot;

  /**
   * Reconciles the cache with a fresh bootstrap.
   *
   * Server answers win for anything already confirmed, but a local `pending`
   * answer is never overwritten by an older server answer — it is flushed
   * first, so the participant's most recent tap always survives.
   */
  async hydrate(bootstrap: BootstrapResponse): Promise<void> {
    const attemptKey = makeAttemptKey(bootstrap.attempt.publicId, bootstrap.attempt.testVersionId);
    const switchingAttempt = this.attemptKey !== null && this.attemptKey !== attemptKey;
    this.attemptKey = attemptKey;
    this.halted = false;

    if (switchingAttempt) this.cancelRetry();

    // The server reporting Completed is the definitive successful finalize, and
    // the only thing that clears an attempt's local data. Every later screen
    // reads its result from the server, so nothing is lost.
    if (bootstrap.attempt.status === 'Completed') {
      this.cancelRetry();
      await clearAttemptData(attemptKey);
      await pruneOtherAttempts(attemptKey);
      this.snapshot = { ...EMPTY, ready: true, attemptKey };
      this.emit();
      return;
    }

    const content = {
      attemptKey,
      attemptPublicId: bootstrap.attempt.publicId,
      testVersionId: bootstrap.attempt.testVersionId,
      versionNumber: bootstrap.content.versionNumber,
      contentHash: bootstrap.content.contentHash,
      questions: bootstrap.content.questions,
      tieBreak: bootstrap.tieBreak,
      completionCycle: bootstrap.attempt.completionCycle,
      updatedAt: Date.now(),
    };

    // Read and write in one transaction. A bootstrap can land while a finalize
    // is still settling — `setQueryData` re-runs this from the mutation's own
    // success handler — and a plain read-then-write would let this stale copy
    // of `finalizeIdempotencyKey` overwrite the reset that handler just did.
    // The next finalize would then reuse a spent key with a new payload, which
    // the server correctly rejects as a conflict.
    await db.transaction('rw', db.attempts, async () => {
      const existing = await db.attempts.get(attemptKey);

      // A new completion cycle (an admin reopened the attempt) invalidates the
      // finalize key, so the next finalize is a fresh operation.
      const cycleChanged =
        existing !== undefined && existing.completionCycle !== bootstrap.attempt.completionCycle;

      await db.attempts.put({
        ...content,
        finalizeIdempotencyKey: cycleChanged ? null : (existing?.finalizeIdempotencyKey ?? null),
      });
    });

    // `contentHash` guards against a stale or corrupt cache: the record written
    // above always carries the server's current content, and any cached answer
    // whose question is no longer part of it is dropped below.
    const localRows = await db.answers.where('attemptKey').equals(attemptKey).toArray();
    const localByQuestion = new Map(localRows.map((row) => [row.questionId, row]));

    const serverByQuestion = new Map(
      bootstrap.answers.map((a) => [
        a.questionId,
        { selectedOptionId: a.selectedOptionId, updatedAt: Date.parse(a.updatedAt) },
      ]),
    );

    // Content changed underneath us: drop any cached answer whose question is
    // no longer part of this version.
    const validQuestionIds = new Set(bootstrap.content.questions.map((q) => q.id));
    if (bootstrap.tieBreak) validQuestionIds.add(bootstrap.tieBreak.questionId);

    const merged: CachedAnswer[] = [];
    const toDelete: string[] = [];

    for (const [questionId, local] of localByQuestion) {
      if (!validQuestionIds.has(questionId)) {
        toDelete.push(local.id);
        continue;
      }

      const server = serverByQuestion.get(questionId);

      if (local.status === 'pending' || local.status === 'failed') {
        // Unsent local intent always survives; the flush below sends it.
        merged.push(local);
        continue;
      }

      if (!server) {
        // The server has no record of a confirmed answer, so neither should we.
        toDelete.push(local.id);
        continue;
      }

      const serverIsNewer =
        Number.isFinite(server.updatedAt) && server.updatedAt >= local.updatedAt;
      merged.push(
        serverIsNewer
          ? {
              ...local,
              selectedOptionId: server.selectedOptionId,
              status: 'synced',
              updatedAt: server.updatedAt,
            }
          : local,
      );
    }

    for (const [questionId, server] of serverByQuestion) {
      if (localByQuestion.has(questionId)) continue;
      merged.push({
        id: makeAnswerId(attemptKey, questionId),
        attemptKey,
        questionId,
        selectedOptionId: server.selectedOptionId,
        clientMutationId: newMutationId(),
        status: 'synced',
        updatedAt: Number.isFinite(server.updatedAt) ? server.updatedAt : Date.now(),
      });
    }

    await db.transaction('rw', db.answers, async () => {
      if (toDelete.length > 0) await db.answers.bulkDelete(toDelete);
      if (merged.length > 0) await db.answers.bulkPut(merged);
    });

    await pruneOtherAttempts(attemptKey);
    this.publish(merged, this.snapshot.syncState);
    this.snapshot = { ...this.snapshot, ready: true };
    this.emit();

    void this.flush();
  }

  /** Optimistic local write, then a background PUT. */
  async select(questionId: number, selectedOptionId: number): Promise<void> {
    const attemptKey = this.attemptKey;
    if (!attemptKey) return;

    const row: CachedAnswer = {
      id: makeAnswerId(attemptKey, questionId),
      attemptKey,
      questionId,
      selectedOptionId,
      clientMutationId: newMutationId(),
      status: 'pending',
      updatedAt: Date.now(),
    };

    await db.answers.put(row);
    this.halted = false;
    await this.refresh('saving');
    void this.flush();
  }

  /** Sends every unsent answer, oldest first. Safe to call concurrently. */
  async flush(): Promise<void> {
    const attemptKey = this.attemptKey;
    if (!attemptKey || this.flushing || this.halted) return;

    this.flushing = true;
    try {
      for (;;) {
        const rows = await db.answers.where('attemptKey').equals(attemptKey).toArray();
        const unsent = rows
          .filter((row) => row.status !== 'synced')
          .sort((a, b) => a.updatedAt - b.updatedAt);

        if (unsent.length === 0) {
          this.cancelRetry();
          this.retryIndex = 0;
          await this.refresh(rows.length > 0 ? 'saved' : 'idle');
          this.scheduleSavedReset();
          return;
        }

        await this.refresh('saving');
        const row = unsent[0];

        try {
          await saveAnswer({
            questionId: row.questionId,
            selectedOptionId: row.selectedOptionId,
            clientMutationId: row.clientMutationId,
          });
          // Re-read before writing: the participant may have tapped again while
          // this request was in flight, and that newer choice must not be
          // stamped `synced`.
          const current = await db.answers.get(row.id);
          if (current && current.clientMutationId === row.clientMutationId) {
            await db.answers.put({ ...current, status: 'synced' });
          }
          this.retryIndex = 0;
        } catch (error) {
          await this.handleFlushError(row, error);
          return;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private async handleFlushError(row: CachedAnswer, error: unknown): Promise<void> {
    if (error instanceof ApiError && !error.isNetworkError && error.status < 500) {
      // The server rejected this answer outright (attempt completed, stale
      // question, expired session). Retrying cannot help.
      await db.answers.put({ ...row, status: 'failed' });
      this.halted = error.status === 401 || error.status === 409;
      await this.refresh('failed');
      return;
    }

    // Offline or a server-side hiccup: keep it pending and try again later.
    await db.answers.put({ ...row, status: 'pending' });
    await this.refresh('failed');
    this.scheduleRetry();
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null || this.halted) return;
    const delay = RETRY_DELAYS_MS[Math.min(this.retryIndex, RETRY_DELAYS_MS.length - 1)];
    this.retryIndex += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  private cancelRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private scheduleSavedReset(): void {
    if (this.savedTimer !== null) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => {
      this.savedTimer = null;
      if (this.snapshot.syncState === 'saved') {
        this.snapshot = { ...this.snapshot, syncState: 'idle' };
        this.emit();
      }
    }, SAVED_BADGE_MS);
  }

  /** The answer snapshot finalize submits, in the cached question order. */
  async finalizePayload(): Promise<Array<{ questionId: number; selectedOptionId: number }>> {
    const attemptKey = this.attemptKey;
    if (!attemptKey) return [];

    const attempt = await db.attempts.get(attemptKey);
    const rows = await db.answers.where('attemptKey').equals(attemptKey).toArray();
    const byQuestion = new Map(rows.map((row) => [row.questionId, row]));

    const ordered: Array<{ questionId: number; selectedOptionId: number }> = [];
    for (const question of attempt?.questions ?? []) {
      const row = byQuestion.get(question.id);
      if (row) ordered.push({ questionId: question.id, selectedOptionId: row.selectedOptionId });
    }

    const tieBreakId = attempt?.tieBreak?.questionId;
    if (tieBreakId !== undefined) {
      const row = byQuestion.get(tieBreakId);
      if (row) ordered.push({ questionId: tieBreakId, selectedOptionId: row.selectedOptionId });
    }

    return ordered;
  }

  /**
   * One key per finalize operation, kept across retries so a repeated click or
   * a lost response replays instead of rescoring.
   */
  async takeFinalizeKey(): Promise<string> {
    const attemptKey = this.attemptKey;
    if (!attemptKey) return newMutationId();

    const attempt = await db.attempts.get(attemptKey);
    if (attempt?.finalizeIdempotencyKey) return attempt.finalizeIdempotencyKey;

    const key = newMutationId();
    if (attempt) await db.attempts.put({ ...attempt, finalizeIdempotencyKey: key });
    return key;
  }

  /** Called after a tie-break is requested, so the next finalize uses a new key. */
  async resetFinalizeKey(): Promise<void> {
    const attemptKey = this.attemptKey;
    if (!attemptKey) return;
    const attempt = await db.attempts.get(attemptKey);
    if (attempt) await db.attempts.put({ ...attempt, finalizeIdempotencyKey: null });
  }

  async getCachedAttempt(): Promise<CachedAttempt | undefined> {
    if (!this.attemptKey) return undefined;
    return db.attempts.get(this.attemptKey);
  }

  /** Only ever called after a definitive successful finalize. */
  async clearAfterFinalize(): Promise<void> {
    const attemptKey = this.attemptKey;
    if (!attemptKey) return;
    this.cancelRetry();
    await clearAttemptData(attemptKey);
    this.attemptKey = null;
    this.snapshot = { ...EMPTY, ready: true };
    this.emit();
  }

  private async refresh(syncState: SyncState): Promise<void> {
    const attemptKey = this.attemptKey;
    if (!attemptKey) return;
    const rows = await db.answers.where('attemptKey').equals(attemptKey).toArray();
    this.publish(rows, syncState);
  }

  private publish(rows: CachedAnswer[], syncState: SyncState): void {
    const answers: Record<number, LocalAnswer> = {};
    let pendingCount = 0;
    for (const row of rows) {
      answers[row.questionId] = {
        questionId: row.questionId,
        selectedOptionId: row.selectedOptionId,
        status: row.status,
        updatedAt: row.updatedAt,
      };
      if (row.status !== 'synced') pendingCount += 1;
    }

    this.snapshot = {
      ready: true,
      attemptKey: this.attemptKey,
      answers,
      syncState,
      pendingCount,
    };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export const attemptStore = new AttemptStore();

// Coming back online, or returning to the tab, is the natural moment to retry.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void attemptStore.flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void attemptStore.flush();
  });
}
