import { env } from '../config/index';

type Level = 'debug' | 'info' | 'warn' | 'error';

const RANK: Record<Level | 'silent', number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

/**
 * Deliberately minimal structured logging. Never log cookies, tokens,
 * passwords or request bodies — see SECURITY notes in the README.
 */
function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (RANK[level] < RANK[env.LOG_LEVEL]) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ?? {}),
  };
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(line)}\n`);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};

/**
 * A readable one-line description of anything that was thrown.
 *
 * Not everything that reaches a catch block is an `Error`. The Neon driver
 * surfaces a failed connection as a DOM-style `ErrorEvent`, which stringifies
 * to `[object ErrorEvent]` and would otherwise hide the only detail that
 * matters — whether the URL, the credentials or the network is wrong.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; error?: unknown; type?: unknown };
    if (typeof candidate.message === 'string' && candidate.message.length > 0) {
      return candidate.message;
    }
    // ErrorEvent nests the real cause under `error`.
    if (candidate.error !== undefined && candidate.error !== error) {
      return describeError(candidate.error);
    }
    if (typeof candidate.type === 'string' && candidate.type.length > 0) {
      return `${candidate.type} event`;
    }
  }
  return String(error);
}
