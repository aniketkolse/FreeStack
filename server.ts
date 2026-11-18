import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from './src/lib/data/nodeLoader';
import { createApp } from './src/lib/server/createApp';
import { injectHtmlMeta, resolveRouteMeta } from './src/lib/server/htmlMeta';

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const isProd = process.env.NODE_ENV === 'production';

process.on('unhandledRejection', (reason) => {
  console.error('[FreeStack] Unhandled Rejection:', reason instanceof Error ? reason.message : 'unknown');
});

process.on('uncaughtException', (err) => {
  console.error('[FreeStack] Uncaught Exception:', err.message);
  process.exit(1);
});

async function startServer() {
  const categories = loadCategoriesFromDisk(ROOT_DIR);
  const sourceRegistry = loadSourceRegistryFromDisk(ROOT_DIR);
  const offers = loadOffersFromDisk(ROOT_DIR);

  const { app, siteUrl, offerBySlug, categoryBySlug } = createApp({
    rootDir: ROOT_DIR,
    isProduction: isProd,
    offers,
    categories,
    sourceRegistry,
  });

  if (!isProd) {
    // Dynamically import Vite only in development mode so production never loads Vite
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    const devIndexHtmlPath = path.join(ROOT_DIR, 'index.html');
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const rawHtml = fs.readFileSync(devIndexHtmlPath, 'utf-8');
        const transformed = await vite.transformIndexHtml('/', rawHtml);
        const hasQuery = Object.keys(req.query).length > 0;
        const meta = resolveRouteMeta(
          req.path,
          hasQuery,
          siteUrl,
          offerBySlug,
          categoryBySlug
        );
        res.setHeader('Cache-Control', 'no-cache');
        res.status(meta.status).type('text/html; charset=utf-8').send(injectHtmlMeta(transformed, meta));
      } catch (err) {
        next(err);
      }
    });
  }

  const host = process.env.HOST || '0.0.0.0';
  const server = app.listen(PORT, host, () => {
    console.log(
      `FreeStack server running on http://${host}:${PORT} (${offers.length} offers loaded, mode=${
        isProd ? 'production' : 'development'
      })`
    );
  });

  server.headersTimeout = 15_000;
  server.requestTimeout = 15_000;
  server.keepAliveTimeout = 5_000;

  const shutdown = (signal: string) => {
    console.log(`[FreeStack] Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
