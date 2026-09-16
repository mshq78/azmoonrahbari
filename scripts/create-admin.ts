import { createInterface } from 'node:readline/promises';
import { eq } from 'drizzle-orm';
import { closeDb, db } from '../server/src/db/client';
import { admins } from '../server/src/db/schema/index';
import { hashPassword, validatePasswordStrength } from '../server/src/shared/password';
import { nowUtc } from '../server/src/shared/time';

/**
 * Creates or resets an admin account.
 *
 *   npm run create:admin -- --username admin --display-name "مدیر" --password '...'
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='...' npm run create:admin
 *
 * With no password supplied, it prompts. There is no default password and no
 * fallback value anywhere in this script: an admin account is only ever created
 * with a password an operator chose.
 */

interface Args {
  username?: string;
  displayName?: string;
  password?: string;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case '--username':
        args.username = value;
        i += 1;
        break;
      case '--display-name':
        args.displayName = value;
        i += 1;
        break;
      case '--password':
        args.password = value;
        i += 1;
        break;
      case '--force':
        args.force = true;
        break;
      default:
        break;
    }
  }
  return args;
}

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  try {
    if (!hidden) return (await rl.question(question)).trim();

    // Suppress echo while a password is typed.
    const originalWrite = process.stdout.write.bind(process.stdout);
    let muted = false;
    process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
      if (muted) return true;
      return originalWrite(chunk as never, ...(rest as []));
    }) as typeof process.stdout.write;

    const answer = rl.question(question);
    muted = true;
    const value = await answer;
    muted = false;
    process.stdout.write = originalWrite;
    process.stdout.write('\n');
    return value.trim();
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const username = (args.username ?? process.env.ADMIN_USERNAME ?? (await prompt('Username: ')))
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
    fail('Username must be 3-64 characters: lowercase letters, digits, dot, underscore or hyphen.');
  }

  const displayName =
    args.displayName ??
    process.env.ADMIN_DISPLAY_NAME ??
    (await prompt(`Display name [${username}]: `)) ??
    '';

  const password =
    args.password ?? process.env.ADMIN_PASSWORD ?? (await prompt('Password: ', true));
  if (!password) fail('A password is required.');

  const problems = validatePasswordStrength(password);
  if (problems.length > 0 && !args.force) {
    fail(`Password rejected:\n${problems.map((p) => `  - ${p}`).join('\n')}\nUse --force to override.`);
  }

  const passwordHash = await hashPassword(password);
  const now = nowUtc();

  const [existing] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);

  if (existing) {
    await db
      .update(admins)
      .set({
        passwordHash,
        displayName: displayName || existing.displayName,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(admins.id, existing.id));
    log(`Admin "${username}" updated (password reset, account enabled).`);
  } else {
    await db.insert(admins).values({
      username,
      displayName: displayName || username,
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    log(`Admin "${username}" created.`);
  }

  await closeDb();
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

main().catch(async (error: unknown) => {
  process.stderr.write(
    `create-admin failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  await closeDb().catch(() => undefined);
  process.exit(1);
});
