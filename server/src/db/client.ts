import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '../config/index';
import * as schema from './schema/index';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: env.DB_POOL_SIZE,
  waitForConnections: true,
  // Managed MySQL requires TLS; a local socket does not.
  ...(env.DB_SSL
    ? { ssl: { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED } }
    : {}),
  charset: 'utf8mb4',
  // All timestamps are stored and read as UTC; see shared/time.ts.
  timezone: 'Z',
  supportBigNumbers: true,
  dateStrings: false,
});

export const db = drizzle(pool, { schema, mode: 'default' });

export type Database = typeof db;
/** The transaction handle drizzle hands to `db.transaction(...)`. */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Anything that can run queries — the pool-backed db or an open transaction. */
export type DbOrTx = Database | Tx;

export async function closeDb(): Promise<void> {
  await pool.end();
}
