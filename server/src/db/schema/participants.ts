import { index, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

/**
 * Identity is the normalized triple (mobile, first name, last name).
 * Originals are kept purely for display; only the normalized values are ever
 * used for lookup and for the unique constraint.
 */
export const participants = pgTable(
  'participants',
  {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 120 }).notNull(),
    lastName: varchar('last_name', { length: 120 }).notNull(),
    mobileOriginal: varchar('mobile_original', { length: 40 }).notNull(),
    normalizedFirstName: varchar('normalized_first_name', { length: 120 }).notNull(),
    normalizedLastName: varchar('normalized_last_name', { length: 120 }).notNull(),
    normalizedMobile: varchar('normalized_mobile', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    identityUnique: uniqueIndex('uq_participants_identity').on(
      t.normalizedMobile,
      t.normalizedFirstName,
      t.normalizedLastName,
    ),
    mobileIdx: index('ix_participants_normalized_mobile').on(t.normalizedMobile),
    nameIdx: index('ix_participants_normalized_name').on(
      t.normalizedLastName,
      t.normalizedFirstName,
    ),
  }),
);

export type ParticipantRow = typeof participants.$inferSelect;
