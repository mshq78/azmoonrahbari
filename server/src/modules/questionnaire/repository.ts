import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, type DbOrTx } from '../../db/client';
import {
  APP_SETTING_KEYS,
  appSettings,
  options,
  questions,
  testAttempts,
  testVersions,
  type OptionRow,
  type QuestionRow,
  type TestVersionRow,
} from '../../db/schema/index';

export interface QuestionWithOptions extends QuestionRow {
  options: OptionRow[];
}

export interface VersionContent {
  version: TestVersionRow;
  /** Active, non-tie-break questions in (displayOrder, id) order. */
  scored: QuestionWithOptions[];
  /** The active tie-break question, if this version has one. */
  tieBreak: QuestionWithOptions | null;
}

export async function getSetting(key: string, conn: DbOrTx = db): Promise<string | null> {
  const [row] = await conn
    .select()
    .from(appSettings)
    .where(eq(appSettings.settingKey, key))
    .limit(1);
  return row?.settingValue ?? null;
}

export async function setSetting(key: string, value: string, conn: DbOrTx = db): Promise<void> {
  const now = new Date();
  await conn
    .insert(appSettings)
    .values({ settingKey: key, settingValue: value, updatedAt: now })
    .onDuplicateKeyUpdate({ set: { settingValue: value, updatedAt: now } });
}

export async function getVersionById(
  id: number,
  conn: DbOrTx = db,
): Promise<TestVersionRow | null> {
  const [row] = await conn.select().from(testVersions).where(eq(testVersions.id, id)).limit(1);
  return row ?? null;
}

/**
 * The version new attempts are created against: whatever `activeTestVersionId`
 * points at if it is still published, otherwise the most recently published
 * version. Returns null when nothing is published (registration is then closed).
 */
export async function getActiveVersion(conn: DbOrTx = db): Promise<TestVersionRow | null> {
  const settingValue = await getSetting(APP_SETTING_KEYS.activeTestVersionId, conn);
  if (settingValue) {
    const id = Number(settingValue);
    if (Number.isInteger(id)) {
      const candidate = await getVersionById(id, conn);
      if (candidate && candidate.status === 'Published') return candidate;
    }
  }

  const [latest] = await conn
    .select()
    .from(testVersions)
    .where(eq(testVersions.status, 'Published'))
    .orderBy(sql`${testVersions.publishedAt} desc`, sql`${testVersions.versionNumber} desc`)
    .limit(1);

  return latest ?? null;
}

/** Loads a version's questions and options. Inactive rows are excluded unless asked for. */
export async function loadQuestionsWithOptions(
  versionId: number,
  conn: DbOrTx = db,
  opts: { includeInactive?: boolean } = {},
): Promise<QuestionWithOptions[]> {
  const includeInactive = opts.includeInactive ?? false;

  const questionRows = await conn
    .select()
    .from(questions)
    .where(
      includeInactive
        ? eq(questions.testVersionId, versionId)
        : and(eq(questions.testVersionId, versionId), eq(questions.isActive, true)),
    )
    .orderBy(asc(questions.displayOrder), asc(questions.id));

  if (questionRows.length === 0) return [];

  const questionIds = questionRows.map((q) => q.id);
  const optionRows = await conn
    .select()
    .from(options)
    .where(
      includeInactive
        ? inArray(options.questionId, questionIds)
        : and(inArray(options.questionId, questionIds), eq(options.isActive, true)),
    )
    .orderBy(asc(options.displayOrder), asc(options.id));

  const byQuestion = new Map<number, OptionRow[]>();
  for (const option of optionRows) {
    const list = byQuestion.get(option.questionId);
    if (list) list.push(option);
    else byQuestion.set(option.questionId, [option]);
  }

  return questionRows.map((question) => ({
    ...question,
    options: byQuestion.get(question.id) ?? [],
  }));
}

export async function loadVersionContent(
  versionId: number,
  conn: DbOrTx = db,
): Promise<VersionContent | null> {
  const version = await getVersionById(versionId, conn);
  if (!version) return null;

  const all = await loadQuestionsWithOptions(versionId, conn);
  return {
    version,
    scored: all.filter((q) => !q.isTieBreaker),
    tieBreak: all.find((q) => q.isTieBreaker) ?? null,
  };
}

export async function countAttemptsForVersion(
  versionId: number,
  conn: DbOrTx = db,
): Promise<number> {
  const [row] = await conn
    .select({ count: sql<number>`count(*)` })
    .from(testAttempts)
    .where(eq(testAttempts.testVersionId, versionId));
  return Number(row?.count ?? 0);
}
