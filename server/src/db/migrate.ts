import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { closeDb, db } from './client';

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function main(): Promise<void> {
  process.stdout.write(`Running migrations from ${migrationsFolder}\n`);
  await migrate(db, { migrationsFolder });
  process.stdout.write('Migrations applied.\n');
  await closeDb();
}

main().catch(async (error: unknown) => {
  process.stderr.write(`Migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  await closeDb().catch(() => undefined);
  process.exit(1);
});
