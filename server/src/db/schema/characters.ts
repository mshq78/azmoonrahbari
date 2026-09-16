import { boolean, pgTable, smallint, varchar } from 'drizzle-orm/pg-core';

/**
 * The five historical characters. `code` is the primary key and is the value
 * stored in `options.internalValue` — the scoring map lives there and nowhere else.
 */
export const characters = pgTable('characters', {
  code: varchar('code', { length: 32 }).primaryKey(),
  displayName: varchar('display_name', { length: 191 }).notNull(),
  years: varchar('years', { length: 64 }).notNull(),
  frontImage: varchar('front_image', { length: 255 }).notNull(),
  backImage: varchar('back_image', { length: 255 }).notNull(),
  /** Deterministic ordering used as the last-resort tie-break. */
  tieOrder: smallint('tie_order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export type CharacterRow = typeof characters.$inferSelect;
