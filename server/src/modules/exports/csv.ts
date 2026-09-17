import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { answers, characters, options, questions, testAttempts } from '../../db/schema/index';
import { listAttemptsForExport, type AttemptFilters } from '../admin/participants';
import { getActiveVersion } from '../questionnaire/repository';

/** Excel only reads UTF-8 CSV correctly when the file starts with a BOM. */
export const UTF8_BOM = '﻿';

/**
 * Builds the attempts export.
 *
 * Question columns come from the currently active version in `displayOrder`, so
 * a spreadsheet keeps a stable shape. Rows from other versions leave those
 * columns blank rather than shifting answers into the wrong column.
 */
export async function buildAttemptsCsv(filters: AttemptFilters): Promise<string> {
  const attempts = await listAttemptsForExport(filters);
  const characterRows = await db.select().from(characters).orderBy(asc(characters.tieOrder));

  const columnVersion = filters.versionId
    ? { id: filters.versionId }
    : ((await getActiveVersion()) ?? { id: 0 });

  const questionColumns = await db
    .select({ id: questions.id, code: questions.code, order: questions.displayOrder })
    .from(questions)
    .where(eq(questions.testVersionId, columnVersion.id))
    .orderBy(asc(questions.displayOrder), asc(questions.id));

  const attemptIds = attempts.map((attempt) => attempt.id);
  const answerRows =
    attemptIds.length > 0
      ? await db
          .select({
            attemptId: answers.attemptId,
            questionId: answers.questionId,
            optionCode: options.code,
            optionText: options.text,
            internalValue: options.internalValue,
          })
          .from(answers)
          .innerJoin(options, eq(options.id, answers.selectedOptionId))
          .where(inArray(answers.attemptId, attemptIds))
      : [];

  const answersByAttempt = new Map<number, Map<number, (typeof answerRows)[number]>>();
  for (const row of answerRows) {
    let perAttempt = answersByAttempt.get(row.attemptId);
    if (!perAttempt) {
      perAttempt = new Map();
      answersByAttempt.set(row.attemptId, perAttempt);
    }
    perAttempt.set(row.questionId, row);
  }

  const header = [
    'id',
    'fullName',
    'mobile',
    'status',
    'version',
    'createdAt',
    'lastActivityAt',
    'completedAt',
    'trackingCode',
    'resultCharacter',
    ...characterRows.map((character) => `score_${character.code}`),
    ...questionColumns.map((question) => question.code),
  ];

  const scoresByAttempt = await loadScores(attemptIds);
  const lines = [header.map(csvCell).join(',')];

  for (const attempt of attempts) {
    const scores = scoresByAttempt.get(attempt.id) ?? null;
    const perAttempt = answersByAttempt.get(attempt.id);

    const row = [
      attempt.id,
      attempt.fullName,
      attempt.mobile,
      attempt.status,
      attempt.versionNumber,
      attempt.createdAt,
      attempt.lastActivityAt,
      attempt.completedAt ?? '',
      attempt.trackingCode ?? '',
      attempt.resultCharacterCode ?? '',
      ...characterRows.map((character) => scores?.[character.code] ?? ''),
      ...questionColumns.map((question) => {
        const answer = perAttempt?.get(question.id);
        if (!answer) return '';
        // One cell carries the chosen text plus the codes an analyst needs to
        // aggregate without joining back to the database.
        return `${answer.optionText} | ${answer.optionCode} | ${answer.internalValue}`;
      }),
    ];

    lines.push(row.map(csvCell).join(','));
  }

  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}

/** One query for every exported attempt's score map, rather than one per row. */
async function loadScores(
  attemptIds: number[],
): Promise<Map<number, Record<string, number> | null>> {
  if (attemptIds.length === 0) return new Map();
  const rows = await db
    .select({ id: testAttempts.id, resultScores: testAttempts.resultScores })
    .from(testAttempts)
    .where(inArray(testAttempts.id, attemptIds));
  return new Map(rows.map((row) => [row.id, row.resultScores ?? null]));
}

/**
 * Escapes one CSV cell. A leading `=`, `+`, `-` or `@` is prefixed with a quote
 * so a spreadsheet treats participant-supplied text as text, not as a formula.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
