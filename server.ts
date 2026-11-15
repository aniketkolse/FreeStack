import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from './src/lib/data/nodeLoader.ts';
import {
  generateDataQualityReport,
  isSafeHttpsUrl,
} from './src/lib/validation/offerValidator.ts';
import { filterAndSortOffers, searchParamsToFilters } from './src/lib/filters/filterOffers.ts';
import type { OutdatedReport } from './src/types/resource.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = process.cwd();
const REPORTS_PATH = path.join(ROOT_DIR, 'data', 'reports.json');

const ALLOWED_REPORT_TYPES = new Set([
  'outdated_limit',
  'card_changed',
  'broken_link',
  'new_resource',
  'other',
]);

function readReports(): OutdatedReport[] {
  try {
    if (!fs.existsSync(REPORTS_PATH)) return [];
    const raw = fs.readFileSync(REPORTS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutdatedReport[]) : [];
  } catch {
    return [];
  }
}

function writeReports(reports: OutdatedReport[]): void {
  fs.mkdirSync(path.dirname(REPORTS_PATH), { recursive: true });
  fs.writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2) + '\n', 'utf-8');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  const categories = loadCategoriesFromDisk(ROOT_DIR);
  const offers = loadOffersFromDisk(ROOT_DIR);
  const sourceRegistry = loadSourceRegistryFromDisk(ROOT_DIR);
  const offerBySlug = new Map(offers.map((o) => [o.identity.slug, o]));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      categories: categories.length,
      offers: offers.length,
      sources: sourceRegistry.sources.length,
    });
  });

  // Data quality and source registry report endpoint (Milestone 8)
  app.get('/api/quality-report', (_req, res) => {
    res.json({
      quality: generateDataQualityReport(offers, categories),
      sourceRegistry,
    });
  });

  // Public read-only catalog API
  app.get('/api/offers', (req, res) => {
    const urlParams = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') urlParams.set(k, v);
    }
    const filters = searchParamsToFilters(urlParams);
    const filtered = filterAndSortOffers(offers, filters);
    res.json({
      total: filtered.length,
      offers: filtered,
      categories,
    });
  });

  // Community outdated info / suggest resource reports
  app.get('/api/reports', (_req, res) => {
    const reports = readReports();
    res.json({ reports });
  });

  app.post('/api/reports', (req, res) => {
    const body = req.body as Partial<OutdatedReport> | undefined;
    const offerName = typeof body?.offerName === 'string' ? body.offerName.trim() : '';
    const details = typeof body?.details === 'string' ? body.details.trim() : '';
    const offerSlug =
      typeof body?.offerSlug === 'string' && body.offerSlug.trim()
        ? body.offerSlug.trim().slice(0, 120)
        : null;
    const reportType =
      typeof body?.reportType === 'string' && ALLOWED_REPORT_TYPES.has(body.reportType)
        ? (body.reportType as OutdatedReport['reportType'])
        : 'other';
    const rawSourceUrl =
      typeof body?.sourceUrl === 'string' && body.sourceUrl.trim()
        ? body.sourceUrl.trim()
        : null;

    if (offerName.length < 2 || offerName.length > 160) {
      res.status(400).json({ error: 'Please provide a resource name (2–160 characters).' });
      return;
    }
    if (details.length < 8 || details.length > 2000) {
      res.status(400).json({ error: 'Please provide details (8–2000 characters).' });
      return;
    }
    if (rawSourceUrl !== null && !isSafeHttpsUrl(rawSourceUrl)) {
      res.status(400).json({ error: 'Supporting source URL must start with https://.' });
      return;
    }

    const report: OutdatedReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      offerSlug,
      offerName,
      reportType,
      details,
      sourceUrl: rawSourceUrl,
      createdAt: new Date().toISOString(),
    };

    const existing = readReports();
    existing.unshift(report);
    writeReports(existing.slice(0, 500));

    res.status(201).json({ report });
  });

  // Allowlisted outbound redirect (no open redirects!)
  app.get('/go/:slug', (req, res) => {
    const slug = String(req.params.slug || '').trim();
    const offer = offerBySlug.get(slug);
    if (!offer) {
      res.status(404).redirect('/explore');
      return;
    }

    const targetParam = typeof req.query.target === 'string' ? req.query.target : 'official';
    let destination: string | null = offer.links.official;
    if (targetParam === 'signup' && offer.links.signup) destination = offer.links.signup;
    else if (targetParam === 'docs' && offer.links.documentation) destination = offer.links.documentation;
    else if (targetParam === 'pricing' && offer.links.pricing) destination = offer.links.pricing;

    if (!isSafeHttpsUrl(destination)) {
      destination = offer.links.official;
    }
    if (!isSafeHttpsUrl(destination)) {
      res.status(400).redirect(`/offer/${encodeURIComponent(offer.identity.slug)}`);
      return;
    }

    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.redirect(302, destination);
  });

  // Dynamic robots.txt
  app.get('/robots.txt', (req, res) => {
    const origin =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /go/\n\nSitemap: ${origin}/sitemap.xml\n`
    );
  });

  // Dynamic sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const origin =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;

    const staticPaths = [
      '/',
      '/explore',
      '/categories',
      '/learning',
      '/students',
      '/about',
    ];

    const urls = [
      ...staticPaths.map((p) => ({ loc: `${origin}${p}`, lastmod: null as string | null })),
      ...categories.map((c) => ({
        loc: `${origin}/category/${c.slug}`,
        lastmod: null as string | null,
      })),
      ...offers.map((o) => ({
        loc: `${origin}/offer/${o.identity.slug}`,
        lastmod: o.metadata.updated_at,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${escapeXml(u.loc)}</loc>${
        u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''
      }\n  </url>`
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(ROOT_DIR, 'index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FreeStack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FreeStack server:', err);
  process.exit(1);
});
