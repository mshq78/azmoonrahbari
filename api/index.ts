import type { IncomingMessage, ServerResponse } from 'node:http';
// The pre-built bundle, not the TypeScript source: a serverless bundler will
// not compile a sibling workspace's sources, and an unresolved import there
// fails at invocation rather than at build time.
import app from '../server/dist/vercel-app.js';

/**
 * Serverless entry point (Vercel).
 *
 * Static assets and the SPA shell are served by the CDN from `client/dist`, and
 * `vercel.json` rewrites only `/api/*` here — so the app's own static and
 * SPA-fallback handlers never run in this environment (see `SERVE_CLIENT`).
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  app(req, res);
}
