import { index, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

/**
 * Identity is the normalized pair (mobile, full name).
 *
 * The name is stored whole rather than split. Persian names do not divide
 * reliably on whitespace — "محمدرضا شاه‌حسینی" and "علی اکبر قلی‌زاده" break
 * differently — so guessing a boundary would put wrong values in the database
 * and, worse, make the uniqueness constraint depend on that guess.
 *
 * The original is kept purely for display; only the normalized values are ever
 * used for lookup and for the unique constraint.
 */
export const participants = pgTable(
  'participants',
  {
    id: serial('id').primaryKey(),
    fullName: varchar('full_name', { length: 240 }).notNull(),
    mobileOriginal: varchar('mobile_original', { length: 40 }).notNull(),
    normalizedFullName: varchar('normalized_full_name', { length: 240 }).notNull(),
    normalizedMobile: varchar('normalized_mobile', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    identityUnique: uniqueIndex('uq_participants_identity').on(
      t.normalizedMobile,
      t.normalizedFullName,
    ),
    mobileIdx: index('ix_participants_normalized_mobile').on(t.normalizedMobile),
    nameIdx: index('ix_participants_normalized_name').on(t.normalizedFullName),
  }),
);

export type ParticipantRow = typeof participants.$inferSelect;
