import { datetime, index, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { testAttempts } from './testAttempts';
import { questions } from './questions';
import { options } from './options';

/** At most one answer per (attempt, question) — enforced by the unique index. */
export const answers = mysqlTable(
  'answers',
  {
    id: int('id').autoincrement().primaryKey(),
    attemptId: int('attempt_id')
      .notNull()
      .references(() => testAttempts.id, { onDelete: 'cascade' }),
    questionId: int('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    selectedOptionId: int('selected_option_id')
      .notNull()
      .references(() => options.id),
    /** Last client mutation applied to this row; makes repeated PUTs idempotent. */
    lastClientMutationId: varchar('last_client_mutation_id', { length: 64 }),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (t) => ({
    attemptQuestionUnique: uniqueIndex('uq_answers_attempt_question').on(t.attemptId, t.questionId),
    attemptIdx: index('ix_answers_attempt').on(t.attemptId),
  }),
);

export type AnswerRow = typeof answers.$inferSelect;
