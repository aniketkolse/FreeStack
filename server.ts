import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from './src/lib/data/nodeLoader.ts';
import { createApp } from './src/lib/server/createApp.ts';
import { injectHtmlMeta, resolveRouteMeta } from './src/lib/server/htmlMeta.ts';
import { buildRouteSsrSnapshot } from './src/lib/server/ssrSnapshot.ts';

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();
const hasDistIndex = fs.existsSync(path.join(ROOT_DIR, 'dist', 'index.html'));
const hasViteInstalled = fs.existsSync(path.join(ROOT_DIR, 'node_modules', 'vite'));
const isProd =
  process.env.NODE_ENV === 'production' ||
  (hasDistIndex && (!hasViteInstalled || process.env.npm_lifecycle_event === 'start'));

process.on('unhandledRejection', (reason) => {
  console.error('[FreeStack] Unhandled Rejection:', reason instanceof Error ? reason.message : 'unknown');
});

process.on('uncaughtException', (err) => {
  console.error('[FreeStack] Uncaught Exception:', err.message);
  process.exit(1);
});

async function startServer() {
  const vitePromise = !isProd
    ? import('vite').then(({ createServer: createViteServer }) =>
        createViteServer({
          server: { middlewareMode: true },
          appType: 'custom',
        })
      )
    : Promise.resolve(null);

  const categories = loadCategoriesFromDisk(ROOT_DIR);
  const sourceRegistry = loadSourceRegistryFromDisk(ROOT_DIR);
  const offers = loadOffersFromDisk(ROOT_DIR);

  const { app, resolveRequestSiteUrl, offerBySlug, categoryBySlug, catalogIndex } = createApp({
    rootDir: ROOT_DIR,
    isProduction: isProd,
    offers,
    categories,
    sourceRegistry,
  });

  const vite = await vitePromise;
  if (vite) {
    app.use(vite.middlewares);

    const devIndexHtmlPath = path.join(ROOT_DIR, 'index.html');
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const rawHtml = fs.readFileSync(devIndexHtmlPath, 'utf-8');
        const transformed = await vite.transformIndexHtml('/', rawHtml);
        const hasQuery = Object.keys(req.query).length > 0;
        const effectiveOrigin = resolveRequestSiteUrl(req);
        const meta = resolveRouteMeta(
          req.path,
          hasQuery,
          effectiveOrigin,
          offerBySlug,
          categoryBySlug
        );
        const ssrSnapshot = buildRouteSsrSnapshot({
          pathname: req.path,
          categories,
          offers: catalogIndex.fullOffers,
          offerBySlug,
          categoryBySlug,
          categoryCounts: catalogIndex.categoryCounts,
        });
        res.setHeader('Cache-Control', 'no-cache');
        res
          .status(meta.status)
          .type('text/html; charset=utf-8')
          .send(injectHtmlMeta(transformed, meta, ssrSnapshot));
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

startServer().catch((err) => {
  console.error('[FreeStack] Fatal startup error:', err);
  process.exit(1);
});
