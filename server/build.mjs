import { build } from 'esbuild';

/**
 * Bundles the server into a single ESM file. Dependencies stay external so
 * native modules (mysql2) load normally from node_modules; only our own source
 * and the shared contracts are inlined.
 */
await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
