import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/**
 * Minimal .env loader (no dotenv dependency). Real process env always wins, so
 * a deployment can set everything through the host's own environment.
 */
/**
 * The repository root, found by walking up from this module to the nearest
 * package.json that declares workspaces. Anchoring here keeps UPLOAD_DIR and
 * CLIENT_DIST_DIR pointing at the same place whether the process is started
 * from the repo root, from `server/`, or from a bundled `server/dist`.
 */
function findRepoRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const manifest = path.join(dir, 'package.json');
    if (existsSync(manifest)) {
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as { workspaces?: unknown };
        if (pkg.workspaces) return dir;
      } catch {
        // Unreadable manifest: keep walking.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const repoRoot = findRepoRoot();

function loadDotEnv(): void {
  const candidates = [
    process.env.ENV_FILE,
    path.resolve(repoRoot, '.env'),
    path.resolve(process.cwd(), '.env'),
  ].filter((p): p is string => Boolean(p));

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key in process.env) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    break;
  }
}

loadDotEnv();

const booleanish = (fallback: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true' || v === '1'));

/** Relative directory settings are resolved against the repository root, not cwd. */
function resolveFromRepoRoot(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().default('0.0.0.0'),

    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().min(1),
    DB_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),

    /** Must be long and random in production; used to sign session cookies. */
    SESSION_SECRET: z.string().min(32),
    PARTICIPANT_SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(12),
    COOKIE_SECURE: booleanish(false),
    COOKIE_DOMAIN: z.string().optional(),
    TRUST_PROXY: booleanish(false),

    /** Comma-separated list of origins allowed to make cookie-authenticated mutations. */
    ALLOWED_ORIGINS: z.string().default(''),

    UPLOAD_DIR: z.string().default('uploads'),
    MAX_UPLOAD_BYTES: z.coerce
      .number()
      .int()
      .min(1024)
      .max(100 * 1024 * 1024)
      .default(5 * 1024 * 1024),
    CLIENT_DIST_DIR: z.string().default('client/dist'),

    RATE_LIMIT_ADMIN_LOGIN_PER_15MIN: z.coerce.number().int().min(1).default(10),
    RATE_LIMIT_START_PER_15MIN: z.coerce.number().int().min(1).default(30),
    RATE_LIMIT_FINALIZE_PER_15MIN: z.coerce.number().int().min(1).default(40),

    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  })
  .transform((v) => ({
    ...v,
    isProduction: v.NODE_ENV === 'production',
    allowedOrigins: v.ALLOWED_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    repoRoot,
    uploadDir: resolveFromRepoRoot(v.UPLOAD_DIR),
    clientDistDir: resolveFromRepoRoot(v.CLIENT_DIST_DIR),
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // Fail fast and loudly: the process cannot serve anything without valid config.
  throw new Error(`Invalid environment configuration:\n${issues}\n\nSee .env.example.`);
}

export const env = parsed.data;
export type Env = typeof env;

if (env.isProduction && !env.COOKIE_SECURE) {
  throw new Error('COOKIE_SECURE must be true in production (the app is served over HTTPS).');
}
