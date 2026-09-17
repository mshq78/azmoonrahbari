import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import type { AttemptStatus, CharacterCode } from '../../../../shared/contracts/constants';
import type {
  AdminAttemptDetail,
  AdminAttemptRow,
  Paginated,
} from '../../../../shared/types/admin-api';
import { db } from '../../db/client';
import {
  answers,
  options,
  participants,
  questions,
  testAttempts,
  testVersions,
} from '../../db/schema/index';
import { ERROR_CODES, notFound } from '../../shared/errors';
import { normalizeMobile, normalizeNameForLookup, toAsciiDigits } from '../../shared/normalize';
import { nowUtc, toIso, toIsoRequired } from '../../shared/time';

export interface AttemptFilters {
  q?: string;
  status?: AttemptStatus;
  versionId?: number;
}

/**
 * Builds the WHERE clause shared by the participants list and the CSV export,
 * so the exported rows are always exactly the rows the admin is looking at.
 */
export function buildAttemptFilters(filters: AttemptFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.status) clauses.push(eq(testAttempts.status, filters.status));
  if (filters.versionId) clauses.push(eq(testAttempts.testVersionId, filters.versionId));

  const term = filters.q?.trim();
  if (term) {
    // A search term can be a name fragment, any form of a mobile number, or a
    // tracking code; all three are tried.
    const nameTerm = `%${escapeLike(normalizeNameForLookup(term))}%`;
    const searchClauses: SQL[] = [
      like(participants.normalizedFullName, nameTerm),
      like(testAttempts.trackingCode, `%${escapeLike(term.toUpperCase())}%`),
    ];

    // Partial mobile search, but only when the term really is a run of digits.
    // Tracking codes mix letters and digits, so stripping the letters out of one
    // would leave a two- or three-digit fragment that matches most of the table.
    const digits = toAsciiDigits(term).replace(/[\s\-().+]/g, '');
    if (/^\d{4,}$/.test(digits)) {
      searchClauses.push(like(participants.normalizedMobile, `%${escapeLike(digits)}%`));
    }

    const mobile = normalizeMobile(term);
    if (mobile.ok) searchClauses.push(eq(participants.normalizedMobile, mobile.normalized));

    clauses.push(or(...searchClauses)!);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

const attemptSelection = {
  id: testAttempts.id,
  publicId: testAttempts.publicId,
  participantId: testAttempts.participantId,
  fullName: participants.fullName,
  mobile: participants.mobileOriginal,
  status: testAttempts.status,
  versionNumber: testVersions.versionNumber,
  trackingCode: testAttempts.trackingCode,
  resultCharacterCode: testAttempts.resultCharacterCode,
  createdAt: testAttempts.createdAt,
  lastActivityAt: testAttempts.lastActivityAt,
  completedAt: testAttempts.completedAt,
  reopenCount: testAttempts.reopenCount,
} as const;

type RawAttemptRow = {
  [K in keyof typeof attemptSelection]: unknown;
};

function toAdminAttemptRow(row: RawAttemptRow): AdminAttemptRow {
  return {
    id: row.id as number,
    publicId: row.publicId as string,
    participantId: row.participantId as number,
    fullName: row.fullName as string,
    mobile: row.mobile as string,
    status: row.status as AttemptStatus,
    versionNumber: row.versionNumber as number,
    trackingCode: (row.trackingCode as string | null) ?? null,
    resultCharacterCode: (row.resultCharacterCode as CharacterCode | null) ?? null,
    createdAt: toIsoRequired(row.createdAt as Date),
    lastActivityAt: toIsoRequired(row.lastActivityAt as Date),
    completedAt: toIso(row.completedAt as Date | null),
    reopenCount: row.reopenCount as number,
  };
}

export async function listAttempts(
  filters: AttemptFilters,
  page: number,
  pageSize: number,
): Promise<Paginated<AdminAttemptRow>> {
  const where = buildAttemptFilters(filters);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(testAttempts)
    .innerJoin(participants, eq(participants.id, testAttempts.participantId))
    .innerJoin(testVersions, eq(testVersions.id, testAttempts.testVersionId))
    .where(where);
  const total = Number(countRow?.count ?? 0);

  const rows = await db
    .select(attemptSelection)
    .from(testAttempts)
    .innerJoin(participants, eq(participants.id, testAttempts.participantId))
    .innerJoin(testVersions, eq(testVersions.id, testAttempts.testVersionId))
    .where(where)
    .orderBy(desc(testAttempts.lastActivityAt), desc(testAttempts.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map(toAdminAttemptRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAttemptsForExport(filters: AttemptFilters): Promise<AdminAttemptRow[]> {
  const rows = await db
    .select(attemptSelection)
    .from(testAttempts)
    .innerJoin(participants, eq(participants.id, testAttempts.participantId))
    .innerJoin(testVersions, eq(testVersions.id, testAttempts.testVersionId))
    .where(buildAttemptFilters(filters))
    .orderBy(desc(testAttempts.createdAt), desc(testAttempts.id));

  return rows.map(toAdminAttemptRow);
}

export async function getAttemptDetail(attemptId: number): Promise<AdminAttemptDetail> {
  const [row] = await db
    .select(attemptSelection)
    .from(testAttempts)
    .innerJoin(participants, eq(participants.id, testAttempts.participantId))
    .innerJoin(testVersions, eq(testVersions.id, testAttempts.testVersionId))
    .where(eq(testAttempts.id, attemptId))
    .limit(1);
  if (!row) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

  const [attempt] = await db
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.id, attemptId))
    .limit(1);

  const answerRows = await db
    .select({
      questionId: questions.id,
      questionCode: questions.code,
      questionText: questions.text,
      displayOrder: questions.displayOrder,
      isTieBreaker: questions.isTieBreaker,
      selectedOptionId: options.id,
      optionCode: options.code,
      optionText: options.text,
      internalValue: options.internalValue,
      score: options.score,
    })
    .from(answers)
    .innerJoin(questions, eq(questions.id, answers.questionId))
    .innerJoin(options, eq(options.id, answers.selectedOptionId))
    .where(eq(answers.attemptId, attemptId))
    .orderBy(questions.displayOrder, questions.id);

  return {
    attempt: toAdminAttemptRow(row),
    resultScores: attempt.resultScores ?? null,
    resultComputedAt: toIso(attempt.resultComputedAt),
    tieBreakRequired: attempt.tieBreakRequired,
    tiedCharacters: (attempt.tiedCharacters as CharacterCode[] | null) ?? null,
    completionCycle: attempt.completionCycle,
    answers: answerRows.map((answer) => ({
      ...answer,
      internalValue: answer.internalValue as CharacterCode,
    })),
  };
}

/**
 * Reopens a completed attempt for editing. Answers and the tracking code stay —
 * the participant returns to the review screen with their choices intact — while
 * the result fields are cleared so a fresh finalize recomputes them.
 */
export async function reopenAttempt(attemptId: number): Promise<AdminAttemptRow> {
  await db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1)
      .for('update');
    if (!attempt) throw notFound(ERROR_CODES.ATTEMPT_NOT_FOUND);

    const now = nowUtc();
    await tx
      .update(testAttempts)
      .set({
        status: 'InProgress',
        completedAt: null,
        resultCharacterCode: null,
        resultScores: null,
        resultComputedAt: null,
        tieBreakRequired: false,
        tiedCharacters: null,
        reopenCount: attempt.reopenCount + 1,
        completionCycle: attempt.completionCycle + 1,
        startedAt: attempt.startedAt ?? now,
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(eq(testAttempts.id, attemptId));
  });

  const detail = await getAttemptDetail(attemptId);
  return detail.attempt;
}

/**
 * Deletes a participant and everything hanging off them. The row is gone, so the
 * same person can register again from scratch — the admin UI says so explicitly
 * before this runs.
 */
export async function deleteParticipant(participantId: number): Promise<{ deleted: boolean }> {
  const [participant] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1);
  if (!participant) throw notFound(ERROR_CODES.NOT_FOUND);

  await db.delete(participants).where(eq(participants.id, participantId));
  return { deleted: true };
}
