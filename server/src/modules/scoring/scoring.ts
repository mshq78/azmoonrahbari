import type { OptionRow } from '../../db/schema/options';
import type { QuestionWithOptions } from '../questionnaire/repository';

export interface ScoredAnswer {
  question: QuestionWithOptions;
  option: OptionRow;
}

export type Tally = Record<string, number>;

export interface TallyResult {
  tally: Tally;
  max: number;
  winners: string[];
}

/**
 * One pass over the scored (non-tie-break) answers, adding `options.score` to
 * the character named by `options.internalValue`.
 *
 * The scoring map exists only in the database. Nothing here knows which option
 * belongs to which character, and no character list is hard-coded.
 */
export function tallyAnswers(answers: readonly ScoredAnswer[]): TallyResult {
  const tally: Tally = {};

  for (const { question, option } of answers) {
    if (question.isTieBreaker) continue;
    const character = option.internalValue;
    // `score` is DECIMAL, which mysql2 returns as a string.
    const points = Number(option.score);
    tally[character] = round2((tally[character] ?? 0) + (Number.isFinite(points) ? points : 0));
  }

  const values = Object.values(tally);
  const max = values.length > 0 ? Math.max(...values) : 0;
  const winners = Object.keys(tally)
    .filter((code) => tally[code] === max)
    .sort();

  return { tally, max, winners };
}

/**
 * Last-resort resolution when a tie exists but the tie-break question cannot be
 * used (missing, inactive, or with fewer than two options among the tied
 * characters). Deterministic so the same answers always produce the same card:
 *
 *   1. the tied character chosen in the highest-numbered scored question, then
 *   2. `characters.tieOrder`.
 */
export function resolveTieDeterministically(
  winners: readonly string[],
  answers: readonly ScoredAnswer[],
  tieOrderByCode: ReadonlyMap<string, number>,
): string {
  const tied = new Set(winners);

  const byDisplayOrderDesc = [...answers]
    .filter((a) => !a.question.isTieBreaker && tied.has(a.option.internalValue))
    .sort(
      (a, b) =>
        b.question.displayOrder - a.question.displayOrder || b.question.id - a.question.id,
    );

  if (byDisplayOrderDesc.length > 0) {
    return byDisplayOrderDesc[0].option.internalValue;
  }

  return [...winners].sort((a, b) => {
    const orderA = tieOrderByCode.get(a) ?? Number.MAX_SAFE_INTEGER;
    const orderB = tieOrderByCode.get(b) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB || (a < b ? -1 : 1);
  })[0];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
