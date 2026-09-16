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
