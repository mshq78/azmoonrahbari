import { asc, desc, eq, sql } from 'drizzle-orm';
import type { AdminVersionRow } from '../../../../shared/types/admin-api';
import { db, type Tx } from '../../db/client';
import {
  APP_SETTING_KEYS,
  options,
  questions,
  testAttempts,
  testVersions,
  type TestVersionRow,
} from '../../db/schema/index';
import { conflict, ERROR_CODES, notFound } from '../../shared/errors';
import { nowUtc, toIso, toIsoRequired } from '../../shared/time';
import { getActiveVersion, setSetting } from '../questionnaire/repository';

/**
 * Content is only editable while the version has never been used. Once a single
 * attempt exists against it, editing would silently change the meaning of
 * answers already recorded, so the admin must clone a new version instead.
 */
export async function assertVersionEditable(versionId: number, conn: Tx | typeof db = db) {
  const [version] = await conn
    .select()
    .from(testVersions)
    .where(eq(testVersions.id, versionId))
    .limit(1);
  if (!version) throw notFound(ERROR_CODES.NOT_FOUND);

  const [row] = await conn
    .select({ count: sql<number>`count(*)` })
    .from(testAttempts)
    .where(eq(testAttempts.testVersionId, versionId));

  if (Number(row?.count ?? 0) > 0) {
    throw conflict(ERROR_CODES.VERSION_IN_USE);
  }
  return version;
}

export async function listVersions(): Promise<AdminVersionRow[]> {
  const active = await getActiveVersion();

  const rows = await db
    .select()
    .from(testVersions)
    .orderBy(desc(testVersions.versionNumber));

  const attemptCounts = await db
    .select({ versionId: testAttempts.testVersionId, count: sql<number>`count(*)` })
    .from(testAttempts)
    .groupBy(testAttempts.testVersionId);

  const questionCounts = await db
    .select({ versionId: questions.testVersionId, count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.isActive, true))
    .groupBy(questions.testVersionId);

  const attemptsBy = new Map(attemptCounts.map((r) => [r.versionId, Number(r.count)]));
  const questionsBy = new Map(questionCounts.map((r) => [r.versionId, Number(r.count)]));

  return rows.map((row) => {
    const attemptCount = attemptsBy.get(row.id) ?? 0;
    return {
      id: row.id,
      versionNumber: row.versionNumber,
      status: row.status,
      title: row.title,
      notes: row.notes,
      publishedAt: toIso(row.publishedAt),
      createdAt: toIsoRequired(row.createdAt),
      attemptCount,
      activeQuestionCount: questionsBy.get(row.id) ?? 0,
      isActive: active?.id === row.id,
      editable: attemptCount === 0,
    };
  });
}

/**
 * Copies the active published version into a new Draft, questions and options
 * included. The clone is what the admin edits; the live version is untouched.
 */
export async function cloneActiveVersion(): Promise<TestVersionRow> {
  const source = await getActiveVersion();
  if (!source) throw conflict(ERROR_CODES.NO_PUBLISHED_VERSION);

  return db.transaction(async (tx) => {
    const [maxRow] = await tx
      .select({ max: sql<number>`coalesce(max(${testVersions.versionNumber}), 0)` })
      .from(testVersions);
    const nextNumber = Number(maxRow?.max ?? 0) + 1;

    const now = nowUtc();
    const [inserted] = await tx.insert(testVersions).values({
      versionNumber: nextNumber,
      status: 'Draft',
      title: source.title,
      notes: source.notes,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: testVersions.id });
    const newVersionId = inserted.id;

    const sourceQuestions = await tx
      .select()
      .from(questions)
      .where(eq(questions.testVersionId, source.id))
      .orderBy(asc(questions.displayOrder), asc(questions.id));

    for (const question of sourceQuestions) {
      const [insertedQuestion] = await tx.insert(questions).values({
        testVersionId: newVersionId,
        code: question.code,
        text: question.text,
        displayOrder: question.displayOrder,
        isTieBreaker: question.isTieBreaker,
        imageAssetId: question.imageAssetId,
        isActive: question.isActive,
        createdAt: now,
        updatedAt: now,
      }).returning({ id: questions.id });
      const newQuestionId = insertedQuestion.id;

      const sourceOptions = await tx
        .select()
        .from(options)
        .where(eq(options.questionId, question.id))
        .orderBy(asc(options.displayOrder), asc(options.id));

      for (const option of sourceOptions) {
        await tx.insert(options).values({
          questionId: newQuestionId,
          code: option.code,
          text: option.text,
          displayOrder: option.displayOrder,
          internalValue: option.internalValue,
          score: option.score,
          scoringMetadata: option.scoringMetadata,
          imageAssetId: option.imageAssetId,
          isActive: option.isActive,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const [created] = await tx
      .select()
      .from(testVersions)
      .where(eq(testVersions.id, newVersionId))
      .limit(1);
    return created;
  });
}

/**
 * Publishes a Draft: archives the previous published version, marks this one
 * Published and points `activeTestVersionId` at it — all in one transaction, so
 * there is never a moment with two published versions or none.
 */
export async function publishVersion(versionId: number): Promise<TestVersionRow> {
  return db.transaction(async (tx) => {
    const [version] = await tx
      .select()
      .from(testVersions)
      .where(eq(testVersions.id, versionId))
      .limit(1)
      .for('update');
    if (!version) throw notFound(ERROR_CODES.NOT_FOUND);
    if (version.status !== 'Draft') throw conflict(ERROR_CODES.VERSION_NOT_DRAFT);

    await assertPublishable(tx, versionId);

    const now = nowUtc();

    await tx
      .update(testVersions)
      .set({ status: 'Archived', updatedAt: now })
      .where(eq(testVersions.status, 'Published'));

    await tx
      .update(testVersions)
      .set({ status: 'Published', publishedAt: now, updatedAt: now })
      .where(eq(testVersions.id, versionId));

    await setSetting(APP_SETTING_KEYS.activeTestVersionId, String(versionId), tx);

    const [published] = await tx
      .select()
      .from(testVersions)
      .where(eq(testVersions.id, versionId))
      .limit(1);
    return published;
  });
}

/** At least one active question, and at least two active options on each of them. */
async function assertPublishable(tx: Tx, versionId: number): Promise<void> {
  const activeQuestions = await tx
    .select({ id: questions.id })
    .from(questions)
    .where(sql`${questions.testVersionId} = ${versionId} and ${questions.isActive} = true`);

  if (activeQuestions.length === 0) {
    throw conflict(ERROR_CODES.PUBLISH_REQUIREMENTS_UNMET);
  }

  const counts = await tx
    .select({ questionId: options.questionId, count: sql<number>`count(*)` })
    .from(options)
    .where(
      sql`${options.isActive} = true and ${options.questionId} in (select id from questions where test_version_id = ${versionId} and is_active = true)`,
    )
    .groupBy(options.questionId);

  const byQuestion = new Map(counts.map((row) => [row.questionId, Number(row.count)]));
  for (const question of activeQuestions) {
    if ((byQuestion.get(question.id) ?? 0) < 2) {
      throw conflict(ERROR_CODES.PUBLISH_REQUIREMENTS_UNMET);
    }
  }
}
