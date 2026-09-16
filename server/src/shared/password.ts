import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/** OWASP-recommended scrypt parameters (N=2^16, r=8, p=1). */
const PARAMS = { N: 65536, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
/** scrypt needs roughly 128 * N * r bytes; give it headroom over the 32 MB default. */
const MAX_MEM = 192 * 1024 * 1024;

/** Encoded as `scrypt$N$r$p$saltB64$hashB64` so parameters can change without a migration. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, {
    ...PARAMS,
    maxmem: MAX_MEM,
  });
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await scrypt(password.normalize('NFKC'), salt, expected.length, {
    N,
    r,
    p,
    maxmem: MAX_MEM,
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/**
 * Guards against a too-weak admin password being set from a script or env var.
 * Returns a list of Persian problems; empty means acceptable.
 */
export function validatePasswordStrength(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 12) problems.push('رمز عبور باید حداقل ۱۲ کاراکتر باشد.');
  if (!/[a-z]/.test(password)) problems.push('رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد.');
  if (!/[A-Z]/.test(password)) problems.push('رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.');
  if (!/\d/.test(password)) problems.push('رمز عبور باید حداقل یک رقم داشته باشد.');
  return problems;
}
