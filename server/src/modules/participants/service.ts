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
  firstName: string;
  lastName: string;
  mobileOriginal: string;
  normalizedFirstName: string;
  normalizedLastName: string;
  normalizedMobile: string;
}

/**
 * Turns raw form input into the identity the database keys on. Display values
 * keep the participant's own spelling; only the normalized triple is ever used
 * for lookup or uniqueness.
 */
export function normalizeIdentity(input: {
  firstName: string;
  lastName: string;
  mobile: string;
}): NormalizedIdentity {
  const firstName = normalizeNameForDisplay(input.firstName);
  const lastName = normalizeNameForDisplay(input.lastName);

  if (firstName.length === 0 || lastName.length === 0) {
    throw badRequest(ERROR_CODES.INVALID_NAME);
  }
  if (firstName.length > 120 || lastName.length > 120) {
    throw badRequest(ERROR_CODES.INVALID_NAME);
  }

  const mobile = normalizeMobile(input.mobile);
  if (!mobile.ok) {
    throw badRequest(ERROR_CODES.INVALID_MOBILE);
  }

  return {
    firstName,
    lastName,
    mobileOriginal: cleanMobileForDisplay(input.mobile),
    normalizedFirstName: normalizeNameForLookup(firstName),
    normalizedLastName: normalizeNameForLookup(lastName),
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
        eq(participants.normalizedFirstName, identity.normalizedFirstName),
        eq(participants.normalizedLastName, identity.normalizedLastName),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Find-or-create on the normalized triple. Two simultaneous registrations of
 * the same identity race here; the unique index decides, and the loser re-reads
 * the winner's row rather than failing the request.
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
      firstName: identity.firstName,
      lastName: identity.lastName,
      mobileOriginal: identity.mobileOriginal,
      normalizedFirstName: identity.normalizedFirstName,
      normalizedLastName: identity.normalizedLastName,
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

export function isDuplicateKeyError(error: unknown): boolean {
  const code = (error as { code?: string; errno?: number } | null)?.code;
  const errno = (error as { errno?: number } | null)?.errno;
  return code === 'ER_DUP_ENTRY' || errno === 1062;
}
