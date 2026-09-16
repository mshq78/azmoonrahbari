import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
