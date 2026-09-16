import { boolean, datetime, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

/** Uploaded images. Files live under UPLOAD_DIR under a random `storedName`. */
export const mediaAssets = mysqlTable(
  'media_assets',
  {
    id: int('id').autoincrement().primaryKey(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    storedName: varchar('stored_name', { length: 191 }).notNull(),
    /**
     * Absolute URL for files served from another origin (object storage).
     * Null means the file is served by this app from /uploads/<storedName>.
     */
    publicUrl: varchar('public_url', { length: 512 }),
    mimeType: varchar('mime_type', { length: 64 }).notNull(),
    sizeBytes: int('size_bytes').notNull(),
    width: int('width'),
    height: int('height'),
    uploadedByAdminId: int('uploaded_by_admin_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: datetime('created_at').notNull(),
  },
  (t) => ({
    storedNameUnique: uniqueIndex('uq_media_assets_stored_name').on(t.storedName),
  }),
);

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
