import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { CHARACTER_CODES } from '../shared/contracts/constants';
import { closeDb, db, type Tx } from '../server/src/db/client';
import {
  APP_SETTING_KEYS,
  characters,
  options,
  questions,
  testVersions,
} from '../server/src/db/schema/index';
import { setSetting } from '../server/src/modules/questionnaire/repository';
import { nowUtc } from '../server/src/shared/time';

/**
 * Seeds questionnaire content from seed/seed-content.json.
 *
 * Idempotent: running it twice leaves the database in the same state. It never
 * touches a version that already has attempts, and never deletes anything — an
 * option that disappears from the file is deactivated, not dropped.
 */

const seedSchema = z.object({
  versionNumber: z.number().int().positive(),
  characters: z
    .array(
      z.object({
        code: z.enum(CHARACTER_CODES),
        displayName: z.string().min(1),
        years: z.string().min(1),
        frontImage: z.string().min(1),
        backImage: z.string().min(1),
        tieOrder: z.number().int().positive(),
      }),
    )
    .min(1),
  questions: z
    .array(
      z.object({
        code: z.string().min(1),
        displayOrder: z.number().int().positive(),
        isTieBreaker: z.boolean(),
        text: z.string().min(1),
        options: z
          .array(
            z.object({
              code: z.string().min(1),
              text: z.string().min(1),
              character: z.enum(CHARACTER_CODES),
            }),
          )
          .min(2),
      }),
    )
    .min(1),
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seedFile = process.env.SEED_FILE ?? path.join(repoRoot, 'seed', 'seed-content.json');

async function main(): Promise<void> {
  const raw = await readFile(seedFile, 'utf8');
  const seed = seedSchema.parse(JSON.parse(raw));

  await db.transaction(async (tx) => {
    const now = nowUtc();

    // 1. Characters.
    for (const character of seed.characters) {
      await tx
        .insert(characters)
        .values({
          code: character.code,
          displayName: character.displayName,
          years: character.years,
          frontImage: character.frontImage,
          backImage: character.backImage,
          tieOrder: character.tieOrder,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: characters.code,
          set: {
            displayName: character.displayName,
            years: character.years,
            frontImage: character.frontImage,
            backImage: character.backImage,
            tieOrder: character.tieOrder,
            isActive: true,
          },
        });
    }
    log(`characters: ${seed.characters.length} upserted`);

    // 2. The test version, published, and made active.
    const versionId = await ensureVersion(tx, seed.versionNumber, now);

    // 3. Questions and options.
    let questionCount = 0;
    let optionCount = 0;
    for (const question of seed.questions) {
      const questionId = await upsertQuestion(tx, versionId, question, now);
      questionCount += 1;

      const seenOptionCodes = new Set<string>();
      for (const [index, option] of question.options.entries()) {
        await upsertOption(tx, questionId, option, index + 1, now);
        seenOptionCodes.add(option.code);
        optionCount += 1;
      }
      await deactivateMissingOptions(tx, questionId, seenOptionCodes, now);
    }

    const seenQuestionCodes = new Set(seed.questions.map((q) => q.code));
    await deactivateMissingQuestions(tx, versionId, seenQuestionCodes, now);

    log(`questions: ${questionCount} upserted, options: ${optionCount} upserted`);
  });

  log('seed complete');
  await closeDb();
}

async function ensureVersion(tx: Tx, versionNumber: number, now: Date): Promise<number> {
  const [existing] = await tx
    .select()
    .from(testVersions)
    .where(eq(testVersions.versionNumber, versionNumber))
    .limit(1);

  if (existing) {
    log(`version #${versionNumber} already exists (id ${existing.id}, ${existing.status})`);
    if (existing.status === 'Published') {
      await setSetting(APP_SETTING_KEYS.activeTestVersionId, String(existing.id), tx);
    }
    return existing.id;
  }

  const [anyPublished] = await tx
    .select({ id: testVersions.id })
    .from(testVersions)
    .where(eq(testVersions.status, 'Published'))
    .limit(1);

  // Only the very first seeded version publishes itself; if something is
  // already live, the new version arrives as a Draft for an admin to review.
  const status = anyPublished ? ('Draft' as const) : ('Published' as const);

  const [inserted] = await tx.insert(testVersions).values({
    versionNumber,
    status,
    title: null,
    notes: 'Seeded from seed/seed-content.json',
    publishedAt: status === 'Published' ? now : null,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: testVersions.id });

  const versionId = inserted.id;
  log(`version #${versionNumber} created (id ${versionId}, ${status})`);

  if (status === 'Published') {
    await setSetting(APP_SETTING_KEYS.activeTestVersionId, String(versionId), tx);
    log(`app_settings.activeTestVersionId = ${versionId}`);
  }

  return versionId;
}

async function upsertQuestion(
  tx: Tx,
  versionId: number,
  question: { code: string; text: string; displayOrder: number; isTieBreaker: boolean },
  now: Date,
): Promise<number> {
  const [existing] = await tx
    .select()
    .from(questions)
    .where(and(eq(questions.testVersionId, versionId), eq(questions.code, question.code)))
    .limit(1);

  if (existing) {
    await tx
      .update(questions)
      .set({
        text: question.text,
        displayOrder: question.displayOrder,
        isTieBreaker: question.isTieBreaker,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(questions.id, existing.id));
    return existing.id;
  }

  const [inserted] = await tx.insert(questions).values({
    testVersionId: versionId,
    code: question.code,
    text: question.text,
    displayOrder: question.displayOrder,
    isTieBreaker: question.isTieBreaker,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: questions.id });
  return inserted.id;
}

async function upsertOption(
  tx: Tx,
  questionId: number,
  option: { code: string; text: string; character: string },
  displayOrder: number,
  now: Date,
): Promise<void> {
  const [existing] = await tx
    .select()
    .from(options)
    .where(and(eq(options.questionId, questionId), eq(options.code, option.code)))
    .limit(1);

  if (existing) {
    await tx
      .update(options)
      .set({
        text: option.text,
        displayOrder,
        // The scoring map lives here and only here.
        internalValue: option.character,
        score: '1.00',
        isActive: true,
        updatedAt: now,
      })
      .where(eq(options.id, existing.id));
    return;
  }

  await tx.insert(options).values({
    questionId,
    code: option.code,
    text: option.text,
    displayOrder,
    internalValue: option.character,
    score: '1.00',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

/** Content that left the seed file is deactivated, never physically deleted. */
async function deactivateMissingOptions(
  tx: Tx,
  questionId: number,
  keepCodes: Set<string>,
  now: Date,
): Promise<void> {
  const rows = await tx.select().from(options).where(eq(options.questionId, questionId));
  for (const row of rows) {
    if (keepCodes.has(row.code) || !row.isActive) continue;
    await tx
      .update(options)
      .set({ isActive: false, updatedAt: now })
      .where(eq(options.id, row.id));
    log(`option ${row.code} on question ${questionId} deactivated (absent from seed)`);
  }
}

async function deactivateMissingQuestions(
  tx: Tx,
  versionId: number,
  keepCodes: Set<string>,
  now: Date,
): Promise<void> {
  const rows = await tx.select().from(questions).where(eq(questions.testVersionId, versionId));
  for (const row of rows) {
    if (keepCodes.has(row.code) || !row.isActive) continue;
    await tx
      .update(questions)
      .set({ isActive: false, updatedAt: now })
      .where(eq(questions.id, row.id));
    log(`question ${row.code} deactivated (absent from seed)`);
  }
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

main().catch(async (error: unknown) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
  await closeDb().catch(() => undefined);
  process.exit(1);
});
