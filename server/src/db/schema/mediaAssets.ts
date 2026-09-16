import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

/** Uploaded images. Files live under UPLOAD_DIR under a random `storedName`. */
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: serial('id').primaryKey(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    storedName: varchar('stored_name', { length: 191 }).notNull(),
    /**
     * Absolute URL for files served from another origin (object storage).
     * Null means the file is served by this app from /uploads/<storedName>.
     */
    publicUrl: varchar('public_url', { length: 512 }),
    mimeType: varchar('mime_type', { length: 64 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    width: integer('width'),
    height: integer('height'),
    uploadedByAdminId: integer('uploaded_by_admin_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    storedNameUnique: uniqueIndex('uq_media_assets_stored_name').on(t.storedName),
  }),
);

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
