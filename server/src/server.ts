import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/index';
import { closeDb, pool } from './db/client';
import { purgeStaleAdminSessions } from './modules/auth/service';
import { describeError, logger } from './shared/logger';
import { storage } from './storage/index';

const SESSION_PURGE_INTERVAL_MS = 60 * 60 * 1000;

async function main(): Promise<void> {
  await storage.init();

  // Fail fast if the database is unreachable, rather than serving 500s.
  try {
    const connection = await pool.connect();
    connection.release();
  } catch (error) {
    throw new Error(
      `Cannot reach the database: ${describeError(error)}. Check DATABASE_URL, and that this host is allowed to connect.`,
    );
  }

  const app = createApp();
  const server: Server = app.listen(env.PORT, env.HOST, () => {
    logger.info('server listening', {
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
    });
  });

  const purgeTimer = setInterval(() => {
    void purgeStaleAdminSessions().catch((error: unknown) => {
      logger.warn('admin session purge failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, SESSION_PURGE_INTERVAL_MS);
  purgeTimer.unref();

  const shutdown = (signal: string) => {
    logger.info('shutting down', { signal });
    clearInterval(purgeTimer);
    server.close(() => {
      void closeDb()
        .catch(() => undefined)
        .finally(() => process.exit(0));
    });
    // Do not hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  logger.error('failed to start', { message: describeError(error) });
  process.exit(1);
});
