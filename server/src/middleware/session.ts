import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { COOKIE_NAMES } from '../../../shared/contracts/constants';
import { env } from '../config/index';
import { ERROR_CODES, unauthenticated } from '../shared/errors';
import { generateCsrfToken } from '../shared/ids';
import { decodeSignedPayload, encodeSignedPayload } from '../shared/signedPayload';

interface ParticipantSessionPayload {
  /** attempt id */
  aid: number;
  /** participant id */
  pid: number;
  /** CSRF token bound to this session; a forged cookie cannot match it. */
  csrf: string;
  /** expiry, epoch seconds */
  exp: number;
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

/**
 * Issues the participant session cookie (HttpOnly, scoped to one attempt) and
 * the companion CSRF cookie the client reads to populate the request header.
 * Returns the CSRF token so it can also be echoed in the response body.
 */
export function issueParticipantSession(
  res: Response,
  input: { attemptId: number; participantId: number; csrfToken?: string },
): string {
  const csrf = input.csrfToken ?? generateCsrfToken();
  const maxAgeMs = env.PARTICIPANT_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload: ParticipantSessionPayload = {
    aid: input.attemptId,
    pid: input.participantId,
    csrf,
    exp: Math.floor((Date.now() + maxAgeMs) / 1000),
  };

  res.cookie(COOKIE_NAMES.participantSession, encodeSignedPayload(payload), {
    ...baseCookieOptions(),
    maxAge: maxAgeMs,
  });
  // Readable by the SPA so it can send the value back in the CSRF header.
  res.cookie(COOKIE_NAMES.participantCsrf, csrf, {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: maxAgeMs,
  });

  return csrf;
}

export function clearParticipantSession(res: Response): void {
  const options = baseCookieOptions();
  res.clearCookie(COOKIE_NAMES.participantSession, options);
  res.clearCookie(COOKIE_NAMES.participantCsrf, { ...options, httpOnly: false });
}

function readParticipantSession(req: Request): Request['participantSession'] {
  const raw = (req.cookies as Record<string, string> | undefined)?.[
    COOKIE_NAMES.participantSession
  ];
  const payload = decodeSignedPayload<ParticipantSessionPayload>(raw);
  if (!payload) return undefined;

  if (
    typeof payload.aid !== 'number' ||
    typeof payload.pid !== 'number' ||
    typeof payload.csrf !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return undefined;
  }
  if (payload.exp * 1000 <= Date.now()) return undefined;

  return {
    attemptId: payload.aid,
    participantId: payload.pid,
    csrfToken: payload.csrf,
    expiresAt: payload.exp * 1000,
  };
}

/** Attaches the participant session when present. Never rejects. */
export const loadParticipantSession: RequestHandler = (req, _res, next) => {
  req.participantSession = readParticipantSession(req);
  next();
};

/** Rejects when no valid participant session is present. */
export const requireParticipantSession: RequestHandler = (req, res, next) => {
  req.participantSession = readParticipantSession(req);
  if (!req.participantSession) {
    // A missing or stale cookie both mean "start again", never "server error".
    clearParticipantSession(res);
    next(unauthenticated(ERROR_CODES.SESSION_EXPIRED));
    return;
  }
  next();
};

export { baseCookieOptions };
