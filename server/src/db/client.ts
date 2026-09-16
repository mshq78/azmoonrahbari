import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { env } from '../config/index';
import * as schema from './schema/index';

/**
 * Neon's driver, over a WebSocket rather than a raw Postgres socket.
 *
 * It speaks the same protocol as `pg` — real sessions, so `db.transaction()`
 * and the `SELECT … FOR UPDATE` in finalize behave exactly as they would on a
 * TCP connection — but it reaches the database over port 443. That is what
 * makes it work unchanged on a serverless host, where outbound TCP is slow to
 * set up and connections cannot be kept warm between invocations.
 *
 * `Pool` here is API-compatible with `pg.Pool`, so swapping back to plain
 * `pg` + `drizzle-orm/node-postgres` is a two-line change if this app ever
 * moves off Neon.
 */

// Node has no global WebSocket in the versions this app targets; browsers and
// edge runtimes do, and there the driver uses the built-in one.
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_SIZE,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
/** The transaction handle drizzle hands to `db.transaction(...)`. */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Anything that can run queries — the pool-backed db or an open transaction. */
export type DbOrTx = Database | Tx;

export async function closeDb(): Promise<void> {
  await pool.end();
}
