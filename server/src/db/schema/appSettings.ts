import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/** Small key/value store. Currently holds `activeTestVersionId`. */
export const appSettings = pgTable('app_settings', {
  settingKey: varchar('setting_key', { length: 64 }).primaryKey(),
  settingValue: text('setting_value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const APP_SETTING_KEYS = {
  activeTestVersionId: 'activeTestVersionId',
} as const;

export type AppSettingRow = typeof appSettings.$inferSelect;
