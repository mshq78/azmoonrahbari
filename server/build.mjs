import { build } from 'esbuild';

/**
 * Bundles the server. Dependencies stay external so native modules (mysql2)
 * load normally from node_modules; only our own source and the shared contracts
 * are inlined.
 *
 * Two entry points, one app:
 *   server.ts     — the long-lived process that calls listen()
 *   vercel-app.ts — the same app as a request handler, for serverless hosts
 */
const common = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
};

await build({ ...common, entryPoints: ['src/server.ts'], outfile: 'dist/server.js' });
await build({ ...common, entryPoints: ['src/vercel-app.ts'], outfile: 'dist/vercel-app.js' });
