import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/index';
import { ERROR_CODES, ERROR_MESSAGES_FA } from '../shared/errors';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * In-memory limiters. The app is a single process serving ~100 concurrent
 * users, so there is no shared store to coordinate — see README if that ever
 * changes.
 */
function makeLimiter(limit: number, extra: Partial<Options> = {}) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: ERROR_CODES.RATE_LIMITED, message: ERROR_MESSAGES_FA.RATE_LIMITED },
      });
    },
    ...extra,
  });
}

export const adminLoginLimiter = makeLimiter(env.RATE_LIMIT_ADMIN_LOGIN_PER_15MIN, {
  // Only failed logins should burn the budget.
  skipSuccessfulRequests: true,
});

export const startOrResumeLimiter = makeLimiter(env.RATE_LIMIT_START_PER_15MIN);

export const finalizeLimiter = makeLimiter(env.RATE_LIMIT_FINALIZE_PER_15MIN);

export const mediaUploadLimiter = makeLimiter(60);
