import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { ATTEMPT_STATUSES } from '../../../../shared/contracts/constants';
import { participants } from './participants';
import { testVersions } from './testVersions';

export const attemptStatus = pgEnum('attempt_status', ATTEMPT_STATUSES);

/**
 * Exactly one attempt per participant (participantId is UNIQUE). An admin
 * "reopen" reuses the same row: it bumps `reopenCount` and `completionCycle`
 * and clears the result fields, but keeps the answers and the tracking code.
 */
export const testAttempts = pgTable(
  'test_attempts',
  {
    id: serial('id').primaryKey(),
    publicId: varchar('public_id', { length: 32 }).notNull(),
    participantId: integer('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    testVersionId: integer('test_version_id')
      .notNull()
      .references(() => testVersions.id),
    status: attemptStatus('status').notNull().default('NotStarted'),
    trackingCode: varchar('tracking_code', { length: 16 }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    reopenCount: integer('reopen_count').notNull().default(0),
    completionCycle: integer('completion_cycle').notNull().default(1),
    resultCharacterCode: varchar('result_character_code', { length: 32 }),
    resultScores: jsonb('result_scores').$type<Record<string, number>>(),
    resultComputedAt: timestamp('result_computed_at', { withTimezone: true }),
    tieBreakRequired: boolean('tie_break_required').notNull().default(false),
    tiedCharacters: jsonb('tied_characters').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    publicIdUnique: uniqueIndex('uq_test_attempts_public_id').on(t.publicId),
    participantUnique: uniqueIndex('uq_test_attempts_participant').on(t.participantId),
    trackingCodeUnique: uniqueIndex('uq_test_attempts_tracking_code').on(t.trackingCode),
    statusIdx: index('ix_test_attempts_status').on(t.status),
    versionIdx: index('ix_test_attempts_version').on(t.testVersionId),
    resultIdx: index('ix_test_attempts_result').on(t.resultCharacterCode),
  }),
);

export type TestAttemptRow = typeof testAttempts.$inferSelect;
