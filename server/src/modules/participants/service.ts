import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '../../db/client';
import { participants, type ParticipantRow } from '../../db/schema/index';
import { badRequest, ERROR_CODES } from '../../shared/errors';
import {
  cleanMobileForDisplay,
  normalizeMobile,
  normalizeNameForDisplay,
  normalizeNameForLookup,
} from '../../shared/normalize';
import { nowUtc } from '../../shared/time';

export interface NormalizedIdentity {
  fullName: string;
  mobileOriginal: string;
  normalizedFullName: string;
  normalizedMobile: string;
}

/** A name has to be more than a single letter to be a name at all. */
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 240;

/**
 * Turns raw form input into the identity the database keys on. The display
 * value keeps the participant's own spelling; only the normalized pair is ever
 * used for lookup or uniqueness.
 */
export function normalizeIdentity(input: {
  fullName: string;
  mobile: string;
}): NormalizedIdentity {
  const fullName = normalizeNameForDisplay(input.fullName);

  if (fullName.length < MIN_NAME_LENGTH || fullName.length > MAX_NAME_LENGTH) {
    throw badRequest(ERROR_CODES.INVALID_NAME);
  }

  const mobile = normalizeMobile(input.mobile);
  if (!mobile.ok) {
    throw badRequest(ERROR_CODES.INVALID_MOBILE);
  }

  return {
    fullName,
    mobileOriginal: cleanMobileForDisplay(input.mobile),
    normalizedFullName: normalizeNameForLookup(fullName),
    normalizedMobile: mobile.normalized,
  };
}

export async function findParticipantByIdentity(
  identity: NormalizedIdentity,
  conn: DbOrTx,
): Promise<ParticipantRow | null> {
  const [row] = await conn
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.normalizedMobile, identity.normalizedMobile),
        eq(participants.normalizedFullName, identity.normalizedFullName),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Find-or-create on the normalized pair. Two simultaneous registrations of the
 * same identity race here; the unique index decides, and the loser re-reads the
 * winner's row rather than failing the request.
 */
export async function findOrCreateParticipant(
  identity: NormalizedIdentity,
  conn: DbOrTx,
): Promise<ParticipantRow> {
  const existing = await findParticipantByIdentity(identity, conn);
  if (existing) return existing;

  const now = nowUtc();
  try {
    await conn.insert(participants).values({
      fullName: identity.fullName,
      mobileOriginal: identity.mobileOriginal,
      normalizedFullName: identity.normalizedFullName,
      normalizedMobile: identity.normalizedMobile,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }

  const created = await findParticipantByIdentity(identity, conn);
  if (!created) {
    throw new Error('Participant row disappeared immediately after insert');
  }
  return created;
}

/** Postgres SQLSTATE 23505 — unique_violation. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === '23505';
}
