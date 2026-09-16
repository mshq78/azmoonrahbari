import { asc, eq, sql } from 'drizzle-orm';
import type { CharacterCode } from '../../../../shared/contracts/constants';
import type { AdminOption, AdminQuestion } from '../../../../shared/types/admin-api';
import { db, type Tx } from '../../db/client';
import { options, questions } from '../../db/schema/index';
import { conflict, ERROR_CODES, notFound } from '../../shared/errors';
import { nowUtc } from '../../shared/time';
import { isDuplicateKeyError } from '../participants/service';
import { loadMediaMap } from '../questionnaire/media-map';
import { loadQuestionsWithOptions } from '../questionnaire/repository';
import { type MediaMap } from '../questionnaire/serializers';
import { assertMediaAssetExists } from '../media/service';
import { assertVersionEditable } from './versions';

/** Admin views include inactive rows and the scoring fields the public API strips. */
export async function listAdminQuestions(versionId: number): Promise<AdminQuestion[]> {
  const rows = await loadQuestionsWithOptions(versionId, db, { includeInactive: true });

  const mediaIds = new Set<number>();
  for (const question of rows) {
    if (question.imageAssetId !== null) mediaIds.add(question.imageAssetId);
    for (const option of question.options) {
      if (option.imageAssetId !== null) mediaIds.add(option.imageAssetId);
    }
  }
  const media = await loadMediaMap([...mediaIds]);

  return rows.map((question) => toAdminQuestion(question, media));
}

export async function getAdminQuestion(questionId: number): Promise<AdminQuestion> {
  const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
  if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);

  const all = await listAdminQuestions(question.testVersionId);
  const found = all.find((q) => q.id === questionId);
  if (!found) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);
  return found;
}

export async function createQuestion(
  versionId: number,
  input: { code: string; text: string; displayOrder?: number; isTieBreaker: boolean },
): Promise<AdminQuestion> {
  await assertVersionEditable(versionId);

  const id = await db.transaction(async (tx) => {
    const displayOrder = input.displayOrder ?? (await nextQuestionOrder(tx, versionId));
    const now = nowUtc();
    try {
      const [inserted] = await tx.insert(questions).values({
        testVersionId: versionId,
        code: input.code,
        text: input.text,
        displayOrder,
        isTieBreaker: input.isTieBreaker,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }).returning({ id: questions.id });
      return inserted.id;
    } catch (error) {
      throw asDuplicateConflict(error, ERROR_CODES.DUPLICATE_CODE);
    }
  });

  return getAdminQuestion(id);
}

export async function updateQuestion(
  questionId: number,
  input: { text?: string; displayOrder?: number; isActive?: boolean },
): Promise<AdminQuestion> {
  const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
  if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);
  await assertVersionEditable(question.testVersionId);

  try {
    await db
      .update(questions)
      .set({
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: nowUtc(),
      })
      .where(eq(questions.id, questionId));
  } catch (error) {
    throw asDuplicateConflict(error, ERROR_CODES.DUPLICATE_ORDER);
  }

  return getAdminQuestion(questionId);
}

/**
 * Rewrites display order from a list of ids. The server repairs the ordering
 * rather than trusting the client's numbers: the result is always 1..n with no
 * gaps or duplicates, whatever order the ids arrive in.
 */
export async function reorderQuestions(
  versionId: number,
  orderedQuestionIds: number[],
): Promise<AdminQuestion[]> {
  await assertVersionEditable(versionId);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(questions)
      .where(eq(questions.testVersionId, versionId))
      .orderBy(asc(questions.displayOrder), asc(questions.id));

    const byId = new Map(existing.map((q) => [q.id, q]));
    const seen = new Set<number>();
    const ordered: number[] = [];

    for (const id of orderedQuestionIds) {
      if (!byId.has(id) || seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
    // Anything the client left out keeps its relative position, at the end.
    for (const question of existing) {
      if (!seen.has(question.id)) ordered.push(question.id);
    }

    const now = nowUtc();

    // Two passes: park every row in a range that cannot collide, then write the
    // final values. A single pass would trip the (version, displayOrder) unique
    // index halfway through.
    let parking = 1000;
    for (const id of ordered) {
      await tx
        .update(questions)
        .set({ displayOrder: parking, updatedAt: now })
        .where(eq(questions.id, id));
      parking += 1;
    }

    let position = 1;
    for (const id of ordered) {
      await tx
        .update(questions)
        .set({ displayOrder: position, updatedAt: now })
        .where(eq(questions.id, id));
      position += 1;
    }
  });

  return listAdminQuestions(versionId);
}

export async function setQuestionImage(
  questionId: number,
  mediaAssetId: number | null,
): Promise<AdminQuestion> {
  const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
  if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);
  await assertVersionEditable(question.testVersionId);
  if (mediaAssetId !== null) await assertMediaAssetExists(mediaAssetId);

  await db
    .update(questions)
    .set({ imageAssetId: mediaAssetId, updatedAt: nowUtc() })
    .where(eq(questions.id, questionId));

  return getAdminQuestion(questionId);
}

export async function createOption(
  questionId: number,
  input: {
    code: string;
    text: string;
    displayOrder?: number;
    internalValue: CharacterCode;
    score: number;
  },
): Promise<AdminQuestion> {
  const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
  if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);
  await assertVersionEditable(question.testVersionId);

  await db.transaction(async (tx) => {
    const displayOrder = input.displayOrder ?? (await nextOptionOrder(tx, questionId));
    const now = nowUtc();
    try {
      await tx.insert(options).values({
        questionId,
        code: input.code,
        text: input.text,
        displayOrder,
        internalValue: input.internalValue,
        score: input.score.toFixed(2),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      throw asDuplicateConflict(error, ERROR_CODES.DUPLICATE_CODE);
    }
  });

  return getAdminQuestion(questionId);
}

export async function updateOption(
  optionId: number,
  input: {
    text?: string;
    displayOrder?: number;
    internalValue?: CharacterCode;
    score?: number;
    isActive?: boolean;
  },
): Promise<AdminQuestion> {
  const [option] = await db.select().from(options).where(eq(options.id, optionId)).limit(1);
  if (!option) throw notFound(ERROR_CODES.OPTION_NOT_FOUND);

  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, option.questionId))
    .limit(1);
  if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);
  await assertVersionEditable(question.testVersionId);

  try {
    await db
      .update(options)
      .set({
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.internalValue !== undefined ? { internalValue: input.internalValue } : {}),
        ...(input.score !== undefined ? { score: input.score.toFixed(2) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: nowUtc(),
      })
      .where(eq(options.id, optionId));
  } catch (error) {
    throw asDuplicateConflict(error, ERROR_CODES.DUPLICATE_ORDER);
  }

  return getAdminQuestion(option.questionId);
}

export async function setOptionImage(
  optionId: number,
  mediaAssetId: number | null,
): Promise<AdminQuestion> {
  const [option] = await db.select().from(options).where(eq(options.id, optionId)).limit(1);
  if (!option) throw notFound(ERROR_CODES.OPTION_NOT_FOUND);

  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, option.questionId))
    .limit(1);
  if (!question) throw notFound(ERROR_CODES.QUESTION_NOT_FOUND);
  await assertVersionEditable(question.testVersionId);
  if (mediaAssetId !== null) await assertMediaAssetExists(mediaAssetId);

  await db
    .update(options)
    .set({ imageAssetId: mediaAssetId, updatedAt: nowUtc() })
    .where(eq(options.id, optionId));

  return getAdminQuestion(option.questionId);
}

async function nextQuestionOrder(tx: Tx, versionId: number): Promise<number> {
  const [row] = await tx
    .select({ max: sql<number>`coalesce(max(${questions.displayOrder}), 0)` })
    .from(questions)
    .where(eq(questions.testVersionId, versionId));
  return Number(row?.max ?? 0) + 1;
}

async function nextOptionOrder(tx: Tx, questionId: number): Promise<number> {
  const [row] = await tx
    .select({ max: sql<number>`coalesce(max(${options.displayOrder}), 0)` })
    .from(options)
    .where(eq(options.questionId, questionId));
  return Number(row?.max ?? 0) + 1;
}

function asDuplicateConflict(error: unknown, code: typeof ERROR_CODES[keyof typeof ERROR_CODES]) {
  if (isDuplicateKeyError(error)) return conflict(code);
  return error;
}

function toAdminQuestion(
  question: Awaited<ReturnType<typeof loadQuestionsWithOptions>>[number],
  media: MediaMap,
): AdminQuestion {
  return {
    id: question.id,
    testVersionId: question.testVersionId,
    code: question.code,
    text: question.text,
    displayOrder: question.displayOrder,
    isTieBreaker: question.isTieBreaker,
    imageAssetId: question.imageAssetId,
    imageUrl: mediaUrlFor(question.imageAssetId, media),
    isActive: question.isActive,
    options: question.options.map(
      (option): AdminOption => ({
        id: option.id,
        questionId: option.questionId,
        code: option.code,
        text: option.text,
        displayOrder: option.displayOrder,
        internalValue: option.internalValue as CharacterCode,
        score: option.score,
        imageAssetId: option.imageAssetId,
        imageUrl: mediaUrlFor(option.imageAssetId, media),
        isActive: option.isActive,
      }),
    ),
  };
}

function mediaUrlFor(assetId: number | null, media: MediaMap): string | null {
  if (assetId === null) return null;
  return media.get(assetId) ?? null;
}
