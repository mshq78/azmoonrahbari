import { createHash, randomBytes, randomInt } from 'node:crypto';
import {
  TRACKING_CODE_ALPHABET,
  TRACKING_CODE_LENGTH,
} from '../../../shared/contracts/constants';

const URL_SAFE_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Non-guessable public identifier for an attempt (22 chars, ~130 bits). */
export function generatePublicId(length = 22): string {
  return randomFromAlphabet(URL_SAFE_ALPHABET, length);
}

/**
 * Tracking code shown to the participant: 8 characters from an alphabet with no
 * O/0 and no I/1, so it can be read aloud and typed back without ambiguity.
 * Uniqueness is enforced by the DB; callers retry on collision.
 */
export function generateTrackingCode(): string {
  return randomFromAlphabet(TRACKING_CODE_ALPHABET, TRACKING_CODE_LENGTH);
}

/** Raw session token; only ever stored hashed. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function generateCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Random, extension-less stored filename for an upload. */
export function generateStoredFileBase(): string {
  return `${Date.now().toString(36)}-${randomBytes(12).toString('hex')}`;
}

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

function randomFromAlphabet(alphabet: string, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

/**
 * Stable hash of a request body, used to detect an Idempotency-Key being
 * reused with a different payload. Object keys are sorted so that two
 * semantically identical bodies hash the same.
 */
export function hashRequestBody(body: unknown): string {
  return sha256Hex(canonicalize(body));
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
}
