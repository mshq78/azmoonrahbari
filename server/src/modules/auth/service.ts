import { and, eq, gt, isNull, lt, or } from 'drizzle-orm';
import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { COOKIE_NAMES } from '../../../../shared/contracts/constants';
import { env } from '../../config/index';
import { db } from '../../db/client';
import {
  admins,
  adminSessions,
  type AdminRow,
  type AdminSessionRow,
} from '../../db/schema/index';
import { ERROR_CODES, unauthenticated } from '../../shared/errors';
import { generateCsrfToken, generateSessionToken, sha256Hex } from '../../shared/ids';
import { verifyPassword } from '../../shared/password';
import { addHours, nowUtc } from '../../shared/time';
import { decodeSignedPayload, encodeSignedPayload } from '../../shared/signedPayload';

interface AdminCookiePayload {
  /** admin_sessions.id */
  sid: number;
  /** raw session token; only its sha256 is stored */
  tok: string;
}

function adminCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export interface AuthenticatedAdmin {
  admin: AdminRow;
  session: AdminSessionRow;
}

/**
 * Verifies credentials. Always runs the password comparison, even for an
 * unknown or deactivated username, so a wrong username and a wrong password
 * take the same time.
 */
export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<AdminRow | null> {
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username.trim().toLowerCase()))
    .limit(1);

  const storedHash =
    admin?.passwordHash ??
    'scrypt$65536$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  const ok = await verifyPassword(password, storedHash);
  if (!ok || !admin || !admin.isActive) return null;

  return admin;
}

export async function createAdminSession(
  res: Response,
  admin: AdminRow,
  req: Request,
): Promise<AdminSessionRow> {
  const now = nowUtc();
  const rawToken = generateSessionToken();
  const csrfToken = generateCsrfToken();
  const expiresAt = addHours(now, env.ADMIN_SESSION_TTL_HOURS);

  const [inserted] = await db.insert(adminSessions).values({
    adminId: admin.id,
    tokenHash: sha256Hex(rawToken),
    csrfToken,
    userAgent: (req.get('user-agent') ?? '').slice(0, 255) || null,
    ipAddress: (req.ip ?? '').slice(0, 64) || null,
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
  }).returning({ id: adminSessions.id });

  const sessionId = inserted.id;
  const maxAgeMs = env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000;

  res.cookie(
    COOKIE_NAMES.adminSession,
    encodeSignedPayload({ sid: sessionId, tok: rawToken } satisfies AdminCookiePayload),
    { ...adminCookieOptions(), maxAge: maxAgeMs },
  );
  res.cookie(COOKIE_NAMES.adminCsrf, csrfToken, {
    ...adminCookieOptions(),
    httpOnly: false,
    maxAge: maxAgeMs,
  });

  await db.update(admins).set({ lastLoginAt: now, updatedAt: now }).where(eq(admins.id, admin.id));

  const [session] = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.id, sessionId))
    .limit(1);
  return session;
}

export function clearAdminSessionCookies(res: Response): void {
  const options = adminCookieOptions();
  res.clearCookie(COOKIE_NAMES.adminSession, options);
  res.clearCookie(COOKIE_NAMES.adminCsrf, { ...options, httpOnly: false });
}

export async function revokeAdminSession(sessionId: number): Promise<void> {
  const now = nowUtc();
  await db
    .update(adminSessions)
    .set({ revokedAt: now, lastSeenAt: now })
    .where(eq(adminSessions.id, sessionId));
}

async function resolveAdminSession(req: Request): Promise<AuthenticatedAdmin | null> {
  const raw = (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAMES.adminSession];
  const payload = decodeSignedPayload<AdminCookiePayload>(raw);
  if (!payload || typeof payload.sid !== 'number' || typeof payload.tok !== 'string') return null;

  const now = nowUtc();
  const [session] = await db
    .select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.id, payload.sid),
        // The signed cookie proves the token; the hash lookup proves the row.
        eq(adminSessions.tokenHash, sha256Hex(payload.tok)),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now),
      ),
    )
    .limit(1);
  if (!session) return null;

  const [admin] = await db
    .select()
    .from(admins)
    .where(and(eq(admins.id, session.adminId), eq(admins.isActive, true)))
    .limit(1);
  if (!admin) return null;

  await db
    .update(adminSessions)
    .set({ lastSeenAt: now })
    .where(eq(adminSessions.id, session.id));

  return { admin, session };
}

/** Rejects any request without a live admin session. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  void resolveAdminSession(req)
    .then((result) => {
      if (!result) {
        clearAdminSessionCookies(res);
        next(unauthenticated(ERROR_CODES.UNAUTHENTICATED));
        return;
      }
      req.adminSession = result;
      next();
    })
    .catch(next);
};

/** Housekeeping for expired/revoked session rows; called on a slow interval. */
export async function purgeStaleAdminSessions(): Promise<void> {
  const cutoff = nowUtc();
  await db
    .delete(adminSessions)
    .where(or(lt(adminSessions.expiresAt, cutoff), lt(adminSessions.revokedAt, cutoff)));
}
