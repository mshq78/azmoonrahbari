import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { mediaAssets } from './mediaAssets';

export const options = pgTable(
  'options',
  {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull(),
    text: text('text').notNull(),
    displayOrder: smallint('display_order').notNull(),
    /**
     * The character code this option scores for. SERVER-ONLY: public serializers
     * must never emit this field (nor `score` / `scoringMetadata`).
     */
    internalValue: varchar('internal_value', { length: 32 }).notNull(),
    score: numeric('score', { precision: 6, scale: 2 }).notNull().default('1'),
    scoringMetadata: jsonb('scoring_metadata'),
    imageAssetId: integer('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    questionCodeUnique: uniqueIndex('uq_options_question_code').on(t.questionId, t.code),
    questionOrderUnique: uniqueIndex('uq_options_question_order').on(t.questionId, t.displayOrder),
    questionActiveIdx: index('ix_options_question_active').on(t.questionId, t.isActive),
  }),
);

export type OptionRow = typeof options.$inferSelect;
