import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/index';

/**
 * Compact signed payload for cookie values: `base64url(json).base64url(hmac)`.
 * The payload is signed, not encrypted — it must never carry a secret, only
 * identifiers the server re-checks against the database.
 */

function sign(data: string): Buffer {
  return createHmac('sha256', env.SESSION_SECRET).update(data).digest();
}

export function encodeSignedPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body).toString('base64url')}`;
}

export function decodeSignedPayload<T>(value: string | undefined): T | null {
  if (!value) return null;

  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = value.slice(0, dot);
  let provided: Buffer;
  try {
    provided = Buffer.from(value.slice(dot + 1), 'base64url');
  } catch {
    return null;
  }

  const expected = sign(body);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

/** Constant-time comparison for CSRF tokens and other opaque strings. */
export function safeEquals(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
