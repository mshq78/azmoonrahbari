import {
  datetime,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { TEST_VERSION_STATUSES } from '../../../../shared/contracts/constants';

export const testVersions = mysqlTable(
  'test_versions',
  {
    id: int('id').autoincrement().primaryKey(),
    versionNumber: int('version_number').notNull(),
    status: mysqlEnum('status', TEST_VERSION_STATUSES).notNull().default('Draft'),
    title: varchar('title', { length: 191 }),
    notes: text('notes'),
    publishedAt: datetime('published_at'),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (t) => ({
    versionNumberUnique: uniqueIndex('uq_test_versions_version_number').on(t.versionNumber),
  }),
);

export type TestVersionRow = typeof testVersions.$inferSelect;
