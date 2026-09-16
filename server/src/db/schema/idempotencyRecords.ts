import {
  index,
  integer,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Stores the response of a completed idempotent operation so a retry with the
 * same key replays it instead of re-running the work.
 */
export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: serial('id').primaryKey(),
    scope: varchar('scope', { length: 32 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    attemptId: integer('attempt_id').notNull(),
    completionCycle: integer('completion_cycle').notNull(),
    /** sha256 of the canonicalized request body; a mismatch is a 409. */
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    responseStatus: smallint('response_status').notNull(),
    responseBody: text('response_body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (t) => ({
    scopeKeyUnique: uniqueIndex('uq_idempotency_scope_key').on(t.scope, t.idempotencyKey),
    attemptIdx: index('ix_idempotency_attempt').on(t.attemptId),
    expiresIdx: index('ix_idempotency_expires').on(t.expiresAt),
  }),
);

export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
