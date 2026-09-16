import type { Request, RequestHandler } from 'express';
import { CSRF_HEADER } from '../../../shared/contracts/constants';
import { env } from '../config/index';
import { ERROR_CODES, forbidden } from '../shared/errors';
import { safeEquals } from '../shared/signedPayload';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Same-origin check. In production the request must come from an origin we
 * recognise; in development a missing Origin header (curl, same-origin fetch in
 * some browsers) is tolerated.
 */
function originAllowed(req: Request): boolean {
  const origin = req.get('origin');
  const referer = req.get('referer');
  const candidate = origin ?? referer;

  if (!candidate) {
    // Browsers always send Origin on cross-origin state-changing requests, so a
    // missing value cannot be a cross-site form post.
    return true;
  }

  let candidateOrigin: string;
  try {
    candidateOrigin = new URL(candidate).origin;
  } catch {
    return false;
  }

  if (env.allowedOrigins.length > 0) {
    return env.allowedOrigins.includes(candidateOrigin);
  }

  const host = req.get('host');
  if (!host) return false;
  const proto = req.protocol;
  return candidateOrigin === `${proto}://${host}`;
}

/**
 * CSRF protection for cookie-authenticated mutations: the request must carry
 * the token that was bound to the session when it was issued. Pairs with
 * SameSite=Lax cookies and the origin check above.
 */
export function csrfProtection(getExpectedToken: (req: Request) => string | undefined): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    if (!originAllowed(req)) {
      next(forbidden(ERROR_CODES.CSRF_INVALID));
      return;
    }

    const expected = getExpectedToken(req);
    const provided = req.get(CSRF_HEADER) ?? undefined;

    if (!expected || !safeEquals(expected, provided)) {
      next(forbidden(ERROR_CODES.CSRF_INVALID));
      return;
    }

    next();
  };
}

export const participantCsrf = csrfProtection((req) => req.participantSession?.csrfToken);
export const adminCsrf = csrfProtection((req) => req.adminSession?.session.csrfToken);
