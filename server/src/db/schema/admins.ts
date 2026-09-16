import { boolean, datetime, index, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

export const admins = mysqlTable(
  'admins',
  {
    id: int('id').autoincrement().primaryKey(),
    username: varchar('username', { length: 64 }).notNull(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    /** scrypt: "scrypt$N$r$p$saltB64$hashB64" — never a plaintext or reversible value. */
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: datetime('last_login_at'),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (t) => ({
    usernameUnique: uniqueIndex('uq_admins_username').on(t.username),
  }),
);

export const adminSessions = mysqlTable(
  'admin_sessions',
  {
    id: int('id').autoincrement().primaryKey(),
    adminId: int('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    /** sha256 of the raw session token; the raw token only ever lives in the cookie. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    csrfToken: varchar('csrf_token', { length: 64 }).notNull(),
    userAgent: varchar('user_agent', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 64 }),
    expiresAt: datetime('expires_at').notNull(),
    revokedAt: datetime('revoked_at'),
    createdAt: datetime('created_at').notNull(),
    lastSeenAt: datetime('last_seen_at').notNull(),
  },
  (t) => ({
    tokenHashUnique: uniqueIndex('uq_admin_sessions_token_hash').on(t.tokenHash),
    adminIdx: index('ix_admin_sessions_admin').on(t.adminId),
    expiresIdx: index('ix_admin_sessions_expires').on(t.expiresAt),
  }),
);

export type AdminRow = typeof admins.$inferSelect;
export type AdminSessionRow = typeof adminSessions.$inferSelect;
