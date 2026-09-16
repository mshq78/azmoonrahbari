import {
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { ATTEMPT_STATUSES } from '../../../../shared/contracts/constants';
import { participants } from './participants';
import { testVersions } from './testVersions';

/**
 * Exactly one attempt per participant (participantId is UNIQUE). An admin
 * "reopen" reuses the same row: it bumps `reopenCount` and `completionCycle`
 * and clears the result fields, but keeps the answers and the tracking code.
 */
export const testAttempts = mysqlTable(
  'test_attempts',
  {
    id: int('id').autoincrement().primaryKey(),
    publicId: varchar('public_id', { length: 32 }).notNull(),
    participantId: int('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    testVersionId: int('test_version_id')
      .notNull()
      .references(() => testVersions.id),
    orgCode: varchar('org_code', { length: 64 }),
    status: mysqlEnum('status', ATTEMPT_STATUSES).notNull().default('NotStarted'),
    trackingCode: varchar('tracking_code', { length: 16 }),
    startedAt: datetime('started_at'),
    lastActivityAt: datetime('last_activity_at').notNull(),
    completedAt: datetime('completed_at'),
    reopenCount: int('reopen_count').notNull().default(0),
    completionCycle: int('completion_cycle').notNull().default(1),
    resultCharacterCode: varchar('result_character_code', { length: 32 }),
    resultScores: json('result_scores').$type<Record<string, number>>(),
    resultComputedAt: datetime('result_computed_at'),
    tieBreakRequired: boolean('tie_break_required').notNull().default(false),
    tiedCharacters: json('tied_characters').$type<string[]>(),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (t) => ({
    publicIdUnique: uniqueIndex('uq_test_attempts_public_id').on(t.publicId),
    participantUnique: uniqueIndex('uq_test_attempts_participant').on(t.participantId),
    trackingCodeUnique: uniqueIndex('uq_test_attempts_tracking_code').on(t.trackingCode),
    statusIdx: index('ix_test_attempts_status').on(t.status),
    versionIdx: index('ix_test_attempts_version').on(t.testVersionId),
    orgCodeIdx: index('ix_test_attempts_org_code').on(t.orgCode),
    resultIdx: index('ix_test_attempts_result').on(t.resultCharacterCode),
  }),
);

export type TestAttemptRow = typeof testAttempts.$inferSelect;
