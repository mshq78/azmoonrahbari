import { ERROR_CODES, ERROR_MESSAGES_FA, type ErrorCode } from '../../../shared/contracts/errors';

/**
 * The only error type that is allowed to reach the client with a specific
 * message. Everything else is reported as INTERNAL_ERROR.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly publicMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    status: number,
    options: { message?: string; details?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(options.message ?? ERROR_MESSAGES_FA[code]);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.publicMessage = options.message ?? ERROR_MESSAGES_FA[code];
    this.details = options.details;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

export const badRequest = (code: ErrorCode = ERROR_CODES.VALIDATION_ERROR, message?: string) =>
  new AppError(code, 400, { message });

export const unauthenticated = (code: ErrorCode = ERROR_CODES.UNAUTHENTICATED) =>
  new AppError(code, 401);

export const forbidden = (code: ErrorCode = ERROR_CODES.FORBIDDEN) => new AppError(code, 403);

export const notFound = (code: ErrorCode = ERROR_CODES.NOT_FOUND) => new AppError(code, 404);

export const conflict = (code: ErrorCode = ERROR_CODES.CONFLICT, message?: string) =>
  new AppError(code, 409, { message });

export const unprocessable = (code: ErrorCode, details?: Record<string, unknown>) =>
  new AppError(code, 422, { details });

export const serviceUnavailable = (code: ErrorCode = ERROR_CODES.NO_PUBLISHED_VERSION) =>
  new AppError(code, 503);

export { ERROR_CODES, ERROR_MESSAGES_FA };
export type { ErrorCode };
