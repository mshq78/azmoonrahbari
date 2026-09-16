import { datetime, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';

/** Small key/value store. Currently holds `activeTestVersionId`. */
export const appSettings = mysqlTable('app_settings', {
  settingKey: varchar('setting_key', { length: 64 }).primaryKey(),
  settingValue: text('setting_value'),
  updatedAt: datetime('updated_at').notNull(),
});

export const APP_SETTING_KEYS = {
  activeTestVersionId: 'activeTestVersionId',
} as const;

export type AppSettingRow = typeof appSettings.$inferSelect;
