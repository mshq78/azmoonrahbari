import { createApp } from './app';

/**
 * The Express app as a plain request handler, for serverless hosts.
 *
 * Built once per cold start and reused by every invocation on that instance, so
 * the MySQL pool is shared rather than opened per request. This module is
 * bundled by `server/build.mjs` into `dist/vercel-app.js`; the serverless entry
 * point imports that bundle rather than this source, so the function has no
 * cross-directory TypeScript imports left to resolve at runtime.
 */
export default createApp();
