import { and, eq, sql } from 'drizzle-orm';
import { db, type DbOrTx } from '../../db/client';
import {
  answers,
  testAttempts,
  type AnswerRow,
  type TestAttemptRow,
} from '../../db/schema/index';

export async function getAttemptById(
  attemptId: number,
  conn: DbOrTx = db,
): Promise<TestAttemptRow | null> {
  const [row] = await conn
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.id, attemptId))
    .limit(1);
  return row ?? null;
}

export async function getAttemptByParticipantId(
  participantId: number,
  conn: DbOrTx = db,
): Promise<TestAttemptRow | null> {
  const [row] = await conn
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.participantId, participantId))
    .limit(1);
  return row ?? null;
}

/**
 * Reads an attempt under a row lock. Finalize runs inside a transaction that
 * starts here, so two concurrent finalizes for the same attempt serialize
 * instead of both scoring.
 */
export async function lockAttempt(
  attemptId: number,
  conn: DbOrTx,
): Promise<TestAttemptRow | null> {
  const [row] = await conn
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.id, attemptId))
    .limit(1)
    .for('update');
  return row ?? null;
}

export async function loadAnswers(attemptId: number, conn: DbOrTx = db): Promise<AnswerRow[]> {
  return conn.select().from(answers).where(eq(answers.attemptId, attemptId));
}

export async function findAnswer(
  attemptId: number,
  questionId: number,
  conn: DbOrTx = db,
): Promise<AnswerRow | null> {
  const [row] = await conn
    .select()
    .from(answers)
    .where(and(eq(answers.attemptId, attemptId), eq(answers.questionId, questionId)))
    .limit(1);
  return row ?? null;
}

export async function touchAttemptActivity(
  attemptId: number,
  at: Date,
  conn: DbOrTx = db,
): Promise<void> {
  await conn
    .update(testAttempts)
    .set({ lastActivityAt: at, updatedAt: at })
    .where(eq(testAttempts.id, attemptId));
}

export async function countAnswers(attemptId: number, conn: DbOrTx = db): Promise<number> {
  const [row] = await conn
    .select({ count: sql<number>`count(*)` })
    .from(answers)
    .where(eq(answers.attemptId, attemptId));
  return Number(row?.count ?? 0);
}
