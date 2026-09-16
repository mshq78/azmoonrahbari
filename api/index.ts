import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/src/app';

/**
 * Serverless entry point (Vercel).
 *
 * The same Express app that `server/src/server.ts` listens with, exported as a
 * request handler instead. It is built once per cold start and reused by every
 * invocation on that instance, so the MySQL pool is shared rather than opened
 * per request.
 *
 * Static assets and the SPA shell are served by the CDN from `client/dist`, and
 * `vercel.json` rewrites only `/api/*` here — so the app's own static and
 * SPA-fallback handlers never run in this environment.
 */
const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  app(req, res);
}
