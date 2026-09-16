import { datetime, index, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

/**
 * Identity is the normalized triple (mobile, first name, last name).
 * Originals are kept purely for display; only the normalized values are ever
 * used for lookup and for the unique constraint.
 */
export const participants = mysqlTable(
  'participants',
  {
    id: int('id').autoincrement().primaryKey(),
    firstName: varchar('first_name', { length: 120 }).notNull(),
    lastName: varchar('last_name', { length: 120 }).notNull(),
    mobileOriginal: varchar('mobile_original', { length: 40 }).notNull(),
    normalizedFirstName: varchar('normalized_first_name', { length: 120 }).notNull(),
    normalizedLastName: varchar('normalized_last_name', { length: 120 }).notNull(),
    normalizedMobile: varchar('normalized_mobile', { length: 20 }).notNull(),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
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
