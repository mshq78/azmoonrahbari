import { desc, eq, inArray, sql } from 'drizzle-orm';
import type { AdminMediaAsset, Paginated } from '../../../../shared/types/admin-api';
import { db } from '../../db/client';
import { mediaAssets, options, questions } from '../../db/schema/index';
import { conflict, ERROR_CODES, notFound } from '../../shared/errors';
import { nowUtc, toIsoRequired } from '../../shared/time';
import { deleteStoredFile, storeImage } from '../../storage/localStorage';
import { mediaUrlFromStoredName } from '../questionnaire/serializers';

export async function createMediaAsset(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  adminId: number;
}): Promise<AdminMediaAsset> {
  const stored = await storeImage(input.buffer, input.mimeType, input.originalName);
  const now = nowUtc();

  try {
    const [inserted] = await db.insert(mediaAssets).values({
      originalName: input.originalName.slice(0, 255),
      storedName: stored.storedName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      uploadedByAdminId: input.adminId,
      isActive: true,
      createdAt: now,
    });

    const [row] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, Number(inserted.insertId)))
      .limit(1);
    return toAdminMediaAsset(row, 0);
  } catch (error) {
    // Do not leave an orphan file behind if the row could not be written.
    await deleteStoredFile(stored.storedName).catch(() => undefined);
    throw error;
  }
}

export async function listMediaAssets(
  page: number,
  pageSize: number,
): Promise<Paginated<AdminMediaAsset>> {
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(mediaAssets);
  const total = Number(countRow?.count ?? 0);

  const rows = await db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const counts = await countReferences(rows.map((row) => row.id));

  return {
    items: rows.map((row) => toAdminMediaAsset(row, counts.get(row.id) ?? 0)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Deletes an asset. A file still referenced by a question or option is never
 * removed — it is deactivated instead, so existing content keeps rendering.
 */
export async function deleteMediaAsset(id: number): Promise<{ deleted: boolean }> {
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!row) throw notFound(ERROR_CODES.NOT_FOUND);

  const counts = await countReferences([id]);
  if ((counts.get(id) ?? 0) > 0) {
    throw conflict(ERROR_CODES.MEDIA_IN_USE);
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  await deleteStoredFile(row.storedName);
  return { deleted: true };
}

export async function deactivateMediaAsset(id: number): Promise<void> {
  const [row] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!row) throw notFound(ERROR_CODES.NOT_FOUND);
  await db.update(mediaAssets).set({ isActive: false }).where(eq(mediaAssets.id, id));
}

/** How many questions/options point at each asset, including inactive ones. */
export async function countReferences(ids: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (ids.length === 0) return counts;

  const questionRefs = await db
    .select({ id: questions.imageAssetId, count: sql<number>`count(*)` })
    .from(questions)
    .where(inArray(questions.imageAssetId, ids))
    .groupBy(questions.imageAssetId);

  const optionRefs = await db
    .select({ id: options.imageAssetId, count: sql<number>`count(*)` })
    .from(options)
    .where(inArray(options.imageAssetId, ids))
    .groupBy(options.imageAssetId);

  for (const row of [...questionRefs, ...optionRefs]) {
    if (row.id === null) continue;
    counts.set(row.id, (counts.get(row.id) ?? 0) + Number(row.count));
  }
  return counts;
}

export async function assertMediaAssetExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row) throw notFound(ERROR_CODES.NOT_FOUND);
}

function toAdminMediaAsset(
  row: typeof mediaAssets.$inferSelect,
  referenceCount: number,
): AdminMediaAsset {
  return {
    id: row.id,
    originalName: row.originalName,
    storedName: row.storedName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: mediaUrlFromStoredName(row.storedName),
    isActive: row.isActive,
    referenceCount,
    createdAt: toIsoRequired(row.createdAt),
  };
}
