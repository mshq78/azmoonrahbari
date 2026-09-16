import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ERROR_CODES, ERROR_MESSAGES_FA } from '../shared/errors';
import { logger } from '../shared/logger';

/** 404 for any unmatched API route. Non-API paths fall through to the SPA handler. */
export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: ERROR_CODES.NOT_FOUND, message: ERROR_MESSAGES_FA.NOT_FOUND },
  });
};

/**
 * The single place an error becomes a response body. Only AppError carries a
 * message meant for users; everything else is reported as INTERNAL_ERROR so no
 * stack trace, SQL text or driver detail can leak.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    logger.error('error after response started', { path: req.path });
    res.end();
    return;
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error('app error', { code: err.code, path: req.path, status: err.status });
    } else {
      logger.debug('app error', { code: err.code, path: req.path, status: err.status });
    }
    res.status(err.status).json({
      error: { code: err.code, message: err.publicMessage, ...(err.details ?? {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.debug('validation error', { path: req.path });
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: ERROR_MESSAGES_FA.VALIDATION_ERROR,
      },
    });
    return;
  }

  // Multer surfaces size/field errors with a `code` property.
  const multerCode = (err as { code?: string } | null)?.code;
  if (multerCode === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: { code: ERROR_CODES.FILE_TOO_LARGE, message: ERROR_MESSAGES_FA.FILE_TOO_LARGE },
    });
    return;
  }
  if (typeof multerCode === 'string' && multerCode.startsWith('LIMIT_')) {
    res.status(400).json({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: ERROR_MESSAGES_FA.VALIDATION_ERROR },
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: ERROR_MESSAGES_FA.VALIDATION_ERROR },
    });
    return;
  }

  logger.error('unhandled error', {
    path: req.path,
    method: req.method,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack?.split('\n').slice(0, 4).join(' | ') : undefined,
  });

  res.status(500).json({
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: ERROR_MESSAGES_FA.INTERNAL_ERROR },
  });
};
