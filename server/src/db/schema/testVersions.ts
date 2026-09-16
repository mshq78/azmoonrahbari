import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { TEST_VERSION_STATUSES } from '../../../../shared/contracts/constants';

export const testVersionStatus = pgEnum('test_version_status', TEST_VERSION_STATUSES);

export const testVersions = pgTable(
  'test_versions',
  {
    id: serial('id').primaryKey(),
    versionNumber: integer('version_number').notNull(),
    status: testVersionStatus('status').notNull().default('Draft'),
    title: varchar('title', { length: 191 }),
    notes: text('notes'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    versionNumberUnique: uniqueIndex('uq_test_versions_version_number').on(t.versionNumber),
  }),
);

export type TestVersionRow = typeof testVersions.$inferSelect;
