import { asc, eq, sql } from 'drizzle-orm';
import type { AttemptStatus, CharacterCode } from '../../../../shared/contracts/constants';
import { ATTEMPT_STATUSES } from '../../../../shared/contracts/constants';
import type { DashboardResponse } from '../../../../shared/types/admin-api';
import { db } from '../../db/client';
import { characters, participants, questions, testAttempts } from '../../db/schema/index';
import { toIso } from '../../shared/time';
import { getActiveVersion } from '../questionnaire/repository';
import { listAttempts } from './participants';

export async function getDashboard(): Promise<DashboardResponse> {
  const activeVersion = await getActiveVersion();

  const [participantCount] = await db.select({ count: sql<number>`count(*)` }).from(participants);
  const [attemptCount] = await db.select({ count: sql<number>`count(*)` }).from(testAttempts);

  const statusRows = await db
    .select({ status: testAttempts.status, count: sql<number>`count(*)` })
    .from(testAttempts)
    .groupBy(testAttempts.status);

  const attemptsByStatus = Object.fromEntries(
    ATTEMPT_STATUSES.map((status) => [status, 0]),
  ) as Record<AttemptStatus, number>;
  for (const row of statusRows) {
    attemptsByStatus[row.status] = Number(row.count);
  }

  const activeQuestionCount = activeVersion
    ? Number(
        (
          await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(
              sql`${questions.testVersionId} = ${activeVersion.id} and ${questions.isActive} = true and ${questions.isTieBreaker} = false`,
            )
        )[0]?.count ?? 0,
      )
    : 0;

  // Every character appears, including ones nobody has landed on yet, so the
  // distribution reads as a complete picture rather than a partial one.
  const characterRows = await db.select().from(characters).orderBy(asc(characters.tieOrder));
  const resultRows = await db
    .select({ code: testAttempts.resultCharacterCode, count: sql<number>`count(*)` })
    .from(testAttempts)
    .where(eq(testAttempts.status, 'Completed'))
    .groupBy(testAttempts.resultCharacterCode);

  const resultCounts = new Map(
    resultRows.filter((row) => row.code !== null).map((row) => [row.code!, Number(row.count)]),
  );

  const latest = await listAttempts({}, 1, 10);

  let attemptsOnActiveVersion = 0;
  if (activeVersion) {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(testAttempts)
      .where(eq(testAttempts.testVersionId, activeVersion.id));
    attemptsOnActiveVersion = Number(row?.count ?? 0);
  }

  return {
    totals: {
      participants: Number(participantCount?.count ?? 0),
      attempts: Number(attemptCount?.count ?? 0),
      activeQuestions: activeQuestionCount,
    },
    attemptsByStatus,
    publishedVersion: activeVersion
      ? {
          id: activeVersion.id,
          versionNumber: activeVersion.versionNumber,
          publishedAt: toIso(activeVersion.publishedAt),
        }
      : null,
    activeVersionEditable: activeVersion !== null && attemptsOnActiveVersion === 0,
    characterDistribution: characterRows.map((character) => ({
      code: character.code as CharacterCode,
      displayName: character.displayName,
      count: resultCounts.get(character.code) ?? 0,
    })),
    latestAttempts: latest.items,
  };
}

export async function listCharacters() {
  const rows = await db.select().from(characters).orderBy(asc(characters.tieOrder));
  return rows.map((row) => ({
    code: row.code as CharacterCode,
    displayName: row.displayName,
    years: row.years,
    tieOrder: row.tieOrder,
    isActive: row.isActive,
  }));
}
