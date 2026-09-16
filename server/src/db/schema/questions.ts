import {
  boolean,
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
import { testVersions } from './testVersions';
import { mediaAssets } from './mediaAssets';

export const questions = pgTable(
  'questions',
  {
    id: serial('id').primaryKey(),
    testVersionId: integer('test_version_id')
      .notNull()
      .references(() => testVersions.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull(),
    text: text('text').notNull(),
    displayOrder: smallint('display_order').notNull(),
    isTieBreaker: boolean('is_tie_breaker').notNull().default(false),
    imageAssetId: integer('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    versionCodeUnique: uniqueIndex('uq_questions_version_code').on(t.testVersionId, t.code),
    versionOrderUnique: uniqueIndex('uq_questions_version_order').on(
      t.testVersionId,
      t.displayOrder,
    ),
    versionActiveIdx: index('ix_questions_version_active').on(t.testVersionId, t.isActive),
  }),
);

export type QuestionRow = typeof questions.$inferSelect;
