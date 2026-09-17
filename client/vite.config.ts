import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

/**
 * Fills `%VITE_PUBLIC_ORIGIN%` in index.html with the deployed origin, so the
 * Open Graph tags carry absolute URLs — Telegram and WhatsApp do not reliably
 * resolve relative ones.
 *
 * Vite's own `%VAR%` substitution leaves the placeholder verbatim when the
 * variable is unset, which would ship a literal `%VITE_PUBLIC_ORIGIN%` into the
 * markup. This always substitutes: unset means an empty prefix, which degrades
 * to the relative path rather than to nonsense.
 */
function publicOrigin(): Plugin {
  const origin = (process.env.VITE_PUBLIC_ORIGIN ?? '').replace(/\/+$/, '');
  return {
    name: 'azmoonrahbari:public-origin',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%VITE_PUBLIC_ORIGIN%', origin),
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), publicOrigin()],
  resolve: {
    alias: {
      '@': path.resolve(here, 'src'),
      // Request/response contracts are shared with the server rather than
      // re-declared here, so a shape can only change in one place.
      '@shared': path.resolve(repoRoot, 'shared'),
    },
  },
  server: {
    port: 5173,
    // In dev the SPA runs on its own port; everything under /api and /uploads
    // is proxied so cookies stay same-origin exactly as in production.
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false },
      '/uploads': { target: 'http://127.0.0.1:3000', changeOrigin: false },
    },
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
