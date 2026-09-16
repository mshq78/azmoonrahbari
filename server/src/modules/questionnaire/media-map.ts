import { inArray } from 'drizzle-orm';
import { db, type DbOrTx } from '../../db/client';
import { mediaAssets } from '../../db/schema/index';
import type { QuestionWithOptions } from './repository';
import { publicUrlFor } from '../../storage/index';
import { EMPTY_MEDIA_MAP, type MediaMap } from './serializers';

/** Collects every media id referenced by a set of questions and their options. */
export function collectMediaIds(questions: readonly QuestionWithOptions[]): number[] {
  const ids = new Set<number>();
  for (const question of questions) {
    if (question.imageAssetId !== null) ids.add(question.imageAssetId);
    for (const option of question.options) {
      if (option.imageAssetId !== null) ids.add(option.imageAssetId);
    }
  }
  return [...ids];
}

/** One query for all referenced assets; returns an empty map when none are referenced. */
export async function loadMediaMap(ids: number[], conn: DbOrTx = db): Promise<MediaMap> {
  if (ids.length === 0) return EMPTY_MEDIA_MAP;

  const rows = await conn
    .select({
      id: mediaAssets.id,
      storedName: mediaAssets.storedName,
      publicUrl: mediaAssets.publicUrl,
    })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, ids));

  return new Map(rows.map((row) => [row.id, publicUrlFor(row)]));
}

export async function loadMediaMapForQuestions(
  questions: readonly QuestionWithOptions[],
  conn: DbOrTx = db,
): Promise<MediaMap> {
  return loadMediaMap(collectMediaIds(questions), conn);
}
