import { existsSync } from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/index';
import { apiNotFound, errorHandler } from './middleware/errorHandler';
import { notFound } from './shared/errors';
import { storage } from './storage/index';
import { adminRouter } from './modules/admin/routes';
import { publicRouter } from './modules/attempts/routes';
import { logger } from './shared/logger';

export function createApp(): Express {
  const app = express();

  if (env.TRUST_PROXY) {
    // Behind a reverse proxy, req.ip and req.protocol must come from the
    // forwarded headers for rate limiting and the origin check to be correct.
    app.set('trust proxy', 1);
  }
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Vite emits a small inline style block; fonts and images are self-hosted.
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', ...storage.imageOrigins],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          // Helmet adds this by default; in development the app is served over
          // plain HTTP, so forcing an upgrade would break local testing.
          upgradeInsecureRequests: env.isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      // Uploaded images are served from the same origin as the SPA.
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', apiNotFound);

  // Uploaded media: read-only, no directory listing, no dotfiles, and never
  // interpreted as anything but the stored image.
  if (storage.kind === 'local') mountUploads(app);

  if (env.SERVE_CLIENT) mountClient(app);

  app.use(errorHandler);

  return app;
}

/** Only the local driver serves files from this origin. */
function mountUploads(app: Express): void {
  app.use(
    '/uploads',
    express.static(env.uploadDir, {
      index: false,
      dotfiles: 'deny',
      maxAge: env.isProduction ? '7d' : 0,
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
      },
    }),
  );
  // An upload that is not there is a 404, never the SPA shell.
  app.use('/uploads', (_req, _res, next) => {
    next(notFound());
  });
}

/**
 * Serves the compiled SPA from the same origin as the API, with a history
 * fallback that deliberately excludes `/api` and `/uploads` so a missing asset
 * or a typo'd endpoint never returns index.html with a 200.
 */
function mountClient(app: Express): void {
  const distDir = env.clientDistDir;
  const indexFile = path.join(distDir, 'index.html');

  if (!existsSync(indexFile)) {
    logger.warn('client build not found; serving API only', { distDir });
    return;
  }

  app.use(
    express.static(distDir, {
      index: false,
      // Hashed asset filenames can be cached hard; index.html must not be.
      maxAge: env.isProduction ? '30d' : 0,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );

  app.get('*', (req, res, next) => {
    // The fallback exists for client-side routes only. API paths, uploads and
    // build assets must keep their own 404s: a missing bundle answered with
    // index.html turns a broken deploy into a silent blank page.
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/assets')
    ) {
      next();
      return;
    }
    if (!req.accepts('html')) {
      next();
      return;
    }
    res.sendFile(indexFile);
  });
}
