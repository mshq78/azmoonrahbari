import {
  boolean,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { questions } from './questions';
import { mediaAssets } from './mediaAssets';

export const options = mysqlTable(
  'options',
  {
    id: int('id').autoincrement().primaryKey(),
    questionId: int('question_id')
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
    score: decimal('score', { precision: 6, scale: 2 }).notNull().default('1'),
    scoringMetadata: json('scoring_metadata'),
    imageAssetId: int('image_asset_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (t) => ({
    questionCodeUnique: uniqueIndex('uq_options_question_code').on(t.questionId, t.code),
    questionOrderUnique: uniqueIndex('uq_options_question_order').on(t.questionId, t.displayOrder),
    questionActiveIdx: index('ix_options_question_active').on(t.questionId, t.isActive),
  }),
);

export type OptionRow = typeof options.$inferSelect;
