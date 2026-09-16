import { createHash } from 'node:crypto';
import type {
  PublicOption,
  PublicQuestion,
  PublicTieBreak,
} from '../../../../shared/types/public-api';
import type { OptionRow } from '../../db/schema/options';
import type { QuestionWithOptions } from './repository';

/**
 * Maps `media_assets.id` to the URL it renders at, so serializers stay
 * synchronous and driver-agnostic — whether the file is served from /uploads or
 * from object storage is already resolved by the time it gets here.
 */
export type MediaMap = ReadonlyMap<number, string>;

export const EMPTY_MEDIA_MAP: MediaMap = new Map<number, string>();

function mediaUrl(assetId: number | null, media: MediaMap): string | null {
  if (assetId === null) return null;
  return media.get(assetId) ?? null;
}

/**
 * The single choke point between database rows and public JSON.
 *
 * `score`, `internalValue` and `scoringMetadata` are dropped here, by
 * construction rather than by omission at each call site — no public endpoint
 * may build an option payload any other way.
 */
export function toPublicOption(option: OptionRow, media: MediaMap = EMPTY_MEDIA_MAP): PublicOption {
  return {
    id: option.id,
    code: option.code,
    text: option.text,
    displayOrder: option.displayOrder,
    imageUrl: mediaUrl(option.imageAssetId, media),
  };
}

export function toPublicQuestion(
  question: QuestionWithOptions,
  media: MediaMap = EMPTY_MEDIA_MAP,
): PublicQuestion {
  return {
    id: question.id,
    code: question.code,
    text: question.text,
    displayOrder: question.displayOrder,
    imageUrl: mediaUrl(question.imageAssetId, media),
    options: question.options.map((option) => toPublicOption(option, media)),
  };
}

/**
 * The tie-break payload carries only the options whose character is still in
 * contention, reduced to the three fields the card UI needs.
 */
export function toPublicTieBreak(
  question: QuestionWithOptions,
  tiedCharacters: readonly string[],
): PublicTieBreak {
  const tied = new Set(tiedCharacters);
  return {
    questionId: question.id,
    code: question.code,
    text: question.text,
    options: question.options
      .filter((option) => tied.has(option.internalValue))
      .map((option) => ({ id: option.id, code: option.code, text: option.text })),
  };
}

/**
 * Identifies the exact content the client has cached. Any change to an active
 * question or option (text, order, image, set membership) changes the hash, and
 * the client refetches instead of trusting a stale or corrupt cache.
 */
export function computeContentHash(
  versionNumber: number,
  scored: readonly QuestionWithOptions[],
  tieBreak: QuestionWithOptions | null,
): string {
  const parts: string[] = [`v${versionNumber}`];
  for (const question of [...scored, ...(tieBreak ? [tieBreak] : [])]) {
    parts.push(
      [
        question.id,
        question.code,
        question.displayOrder,
        question.isTieBreaker ? 1 : 0,
        question.imageAssetId ?? '',
        question.text,
      ].join('|'),
    );
    for (const option of question.options) {
      parts.push(
        [
          '  ',
          option.id,
          option.code,
          option.displayOrder,
          option.imageAssetId ?? '',
          option.text,
        ].join('|'),
      );
    }
  }
  return createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 32);
}
