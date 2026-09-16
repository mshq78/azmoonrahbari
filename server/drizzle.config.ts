import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit loads this file through its own CJS loader, so it deliberately
 * does not import the app's env module — it reads .env directly instead.
 * Runtime configuration still lives in server/src/config/env.ts.
 */
const envFile = path.resolve(process.cwd(), '..', '.env');
if (existsSync(envFile)) {
  for (const rawLine of readFileSync(envFile, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (key in process.env) continue;
    process.env[key] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
}

export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'azmoonrahbari',
  },
  verbose: true,
  strict: true,
});
