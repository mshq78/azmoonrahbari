import { index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { testAttempts } from './testAttempts';
import { questions } from './questions';
import { options } from './options';

/** At most one answer per (attempt, question) — enforced by the unique index. */
export const answers = pgTable(
  'answers',
  {
    id: serial('id').primaryKey(),
    attemptId: integer('attempt_id')
      .notNull()
      .references(() => testAttempts.id, { onDelete: 'cascade' }),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    selectedOptionId: integer('selected_option_id')
      .notNull()
      .references(() => options.id),
    /** Last client mutation applied to this row; makes repeated PUTs idempotent. */
    lastClientMutationId: varchar('last_client_mutation_id', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    attemptQuestionUnique: uniqueIndex('uq_answers_attempt_question').on(t.attemptId, t.questionId),
    attemptIdx: index('ix_answers_attempt').on(t.attemptId),
  }),
);

export type AnswerRow = typeof answers.$inferSelect;
