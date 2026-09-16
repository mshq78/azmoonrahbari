import { datetime, index, int, mysqlTable, smallint, text, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

/**
 * Stores the response of a completed idempotent operation so a retry with the
 * same key replays it instead of re-running the work.
 */
export const idempotencyRecords = mysqlTable(
  'idempotency_records',
  {
    id: int('id').autoincrement().primaryKey(),
    scope: varchar('scope', { length: 32 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    attemptId: int('attempt_id').notNull(),
    completionCycle: int('completion_cycle').notNull(),
    /** sha256 of the canonicalized request body; a mismatch is a 409. */
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    responseStatus: smallint('response_status').notNull(),
    responseBody: text('response_body').notNull(),
    createdAt: datetime('created_at').notNull(),
    expiresAt: datetime('expires_at'),
  },
  (t) => ({
    scopeKeyUnique: uniqueIndex('uq_idempotency_scope_key').on(t.scope, t.idempotencyKey),
    attemptIdx: index('ix_idempotency_attempt').on(t.attemptId),
    expiresIdx: index('ix_idempotency_expires').on(t.expiresAt),
  }),
);

export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
