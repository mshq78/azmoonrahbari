import type { Request } from 'express';
import type { output, ZodTypeAny } from 'zod';
import { badRequest, ERROR_CODES } from '../shared/errors';

/**
 * Parses one part of a request with a Zod schema, returning the schema's output
 * type (so `.default()` and `.transform()` are reflected in the result).
 *
 * Failures always become a generic VALIDATION_ERROR: Zod's own messages are
 * developer-facing English and must not reach a Persian UI.
 */
export function parseOrThrow<S extends ZodTypeAny>(schema: S, value: unknown): output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest(ERROR_CODES.VALIDATION_ERROR);
  }
  return result.data as output<S>;
}

export const parseBody = <S extends ZodTypeAny>(schema: S, req: Request): output<S> =>
  parseOrThrow(schema, req.body);

export const parseParams = <S extends ZodTypeAny>(schema: S, req: Request): output<S> =>
  parseOrThrow(schema, req.params);

export const parseQuery = <S extends ZodTypeAny>(schema: S, req: Request): output<S> =>
  parseOrThrow(schema, req.query);
