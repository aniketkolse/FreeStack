import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type {
  Category,
  Offer,
  OutdatedReport,
  PricingModel,
  RequirementState,
  SortOption,
  SourceRegistry,
} from '../../types/resource';
import { DEFAULT_FILTER_STATE, filterAndSortOffers } from '../filters/filterOffers';
import { generateDataQualityReport } from '../validation/offerValidator';
import {
  escapeXml,
  hasPollutedQuery,
  isSafeExternalHttpsUrl,
  isSafeRedirectDestination,
  stripControlChars,
  validateSiteUrl,
  verifyBearerAdminToken,
} from './securityUtils';
import { injectHtmlMeta, resolveRouteMeta } from './htmlMeta';

export interface CreateAppOptions {
  rootDir?: string;
  isProduction?: boolean;
  siteUrl?: string;
  strictSiteUrl?: boolean;
  denyFraming?: boolean;
  reportsPath?: string;
  adminToken?: string;
  trustProxy?: boolean | number | string;
  offers: Offer[];
  categories: Category[];
  sourceRegistry: SourceRegistry;
  enableRateLimits?: boolean;
}

const VALID_CATEGORY_SLUGS = [
  'ai-ml',
  'mcp',
  'cloud-hosting',
  'developer-tools',
  'databases-backend',
  'learning',
  'student-benefits',
  'apis-integrations',
  'design-creative',
  'security-networking',
  'productivity-collaboration',
] as const;

const VALID_PRICING_VALUES = new Set<PricingModel>([
  'completely_free',
  'free_tier',
  'free_credits',
  'student_exclusive',
  'open_source',
  'free_learning_material',
  'free_trial',
  'freemium',
]);

const offersQuerySchema = z
  .object({
    q: z
      .string()
      .max(160)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    category: z.enum(VALID_CATEGORY_SLUGS).optional(),
    subcategory: z
      .string()
      .max(120)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    card: z.enum(['not_required', 'required', 'conditional', 'unknown', 'all']).optional(),
    pricing: z
      .string()
      .max(240)
      .optional(),
    student: z.enum(['true', 'false']).optional(),
    sort: z
      .enum([
        'relevance',
        'use_case',
        'context_desc',
        'recently_added',
        'recently_verified',
        'name_asc',
        'verified',
        'newest',
        'alphabetical',
      ])
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((v) => Number.parseInt(v, 10))
      .refine((n) => n >= 1 && n <= 100, { message: 'limit must be between 1 and 100' })
      .optional(),
    offset: z
      .string()
      .regex(/^\d+$/)
      .transform((v) => Number.parseInt(v, 10))
      .refine((n) => n >= 0 && n <= 20000, { message: 'offset must be between 0 and 20000' })
      .optional(),
  })
  .strict();

const reportBodySchema = z
  .object({
    offerSlug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{1,120}$/)
      .nullable()
      .optional(),
    offerName: z
      .string()
      .transform((v) => stripControlChars(v).replace(/<[^>]*>/g, '').trim())
      .refine((v) => v.length >= 2 && v.length <= 160, {
        message: 'Resource name must be between 2 and 160 characters.',
      }),
    reportType: z.enum([
      'outdated_limit',
      'card_changed',
      'pricing_change',
      'card_required_change',
      'broken_link',
      'expired_offer',
      'new_resource',
      'other',
    ]),
    details: z
      .string()
      .transform((v) => stripControlChars(v).trim())
      .refine((v) => v.length >= 8 && v.length <= 2000, {
        message: 'Please provide between 8 and 2000 characters of factual details.',
      }),
    sourceUrl: z
      .string()
      .trim()
      .max(2048)
      .nullable()
      .optional(),
    website: z.string().max(200).optional(), // Honeypot field
  })
  .strict();

const MAX_REPORTS_FILE_BYTES = 2 * 1024 * 1024; // 2 MB cap
const DAILY_GLOBAL_REPORTS_CAP = 200;

function readReportsSafe(reportsPath: string): OutdatedReport[] {
  try {
    if (!fs.existsSync(reportsPath)) return [];
    const stat = fs.statSync(reportsPath);
    if (stat.size > MAX_REPORTS_FILE_BYTES) return [];
    const raw = fs.readFileSync(reportsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutdatedReport[]) : [];
  } catch {
    return [];
  }
}

function writeReportsAtomic(reportsPath: string, reports: OutdatedReport[]): void {
  const dir = path.dirname(reportsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const serialized = JSON.stringify(reports, null, 2);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_REPORTS_FILE_BYTES) {
    throw new Error('Reports queue storage cap reached');
  }
  const tmpPath = `${reportsPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, serialized, { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmpPath, reportsPath);
}

function buildSitemapXml(
  siteUrl: string,
  categories: Category[],
  offers: Offer[]
): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const staticRoutes = [
    '/',
    '/explore',
    '/categories',
    '/learning',
    '/students',
    '/about',
    '/privacy',
    '/privacy-requests',
    '/terms',
  ];
  const categoryRoutes = categories
    .filter((c) => /^[a-z0-9-]+$/.test(c.slug))
    .map((c) => `/category/${encodeURIComponent(c.slug)}`);

  const urls: string[] = [];
  for (const r of [...staticRoutes, ...categoryRoutes]) {
    urls.push(`  <url><loc>${escapeXml(`${cleanSiteUrl}${r}`)}</loc></url>`);
  }

  for (const o of offers) {
    if (!/^[a-z0-9-]+$/.test(o.identity.slug)) continue;
    const loc = escapeXml(`${cleanSiteUrl}/offer/${encodeURIComponent(o.identity.slug)}`);
    const lastmod =
      o.metadata?.updated_at && /^\d{4}-\d{2}-\d{2}$/.test(o.metadata.updated_at)
        ? `<lastmod>${escapeXml(o.metadata.updated_at)}</lastmod>`
        : '';
    urls.push(`  <url><loc>${loc}</loc>${lastmod}</url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    '\n'
  )}\n</urlset>`;
}

export function createApp(options: CreateAppOptions) {
  const rootDir = options.rootDir ?? process.cwd();
  const isProd = options.isProduction ?? process.env.NODE_ENV === 'production';
  const strictSiteUrl = options.strictSiteUrl ?? process.env.STRICT_SITE_URL === 'true';
  const denyFraming = options.denyFraming ?? process.env.DENY_FRAMING === 'true';
  const siteUrl = validateSiteUrl(
    options.siteUrl ?? process.env.SITE_URL ?? process.env.APP_URL,
    isProd,
    strictSiteUrl
  );
  const reportsPath =
    options.reportsPath ??
    process.env.REPORTS_PATH ??
    path.join(rootDir, 'data', 'reports.json');
  const adminToken = options.adminToken ?? process.env.ADMIN_TOKEN;
  const enableRateLimits = options.enableRateLimits ?? true;

  const { offers, categories, sourceRegistry } = options;
  const offerBySlug = new Map<string, Offer>(offers.map((o) => [o.identity.slug, o]));
  const categoryBySlug = new Map<string, Category>(categories.map((c) => [c.slug, c]));
  const qualityReport = generateDataQualityReport(offers, categories);
  const cachedSitemapXml = buildSitemapXml(siteUrl, categories, offers);
  const cachedRobotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /go/',
    'Disallow: /api/',
    'Disallow: /search',
    'Disallow: /saved',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  const app = express();
  app.disable('x-powered-by');

  const trustProxyVal = options.trustProxy ?? process.env.TRUST_PROXY;
  if (trustProxyVal !== undefined && trustProxyVal !== '' && trustProxyVal !== 'false') {
    if (trustProxyVal === 'true' || trustProxyVal === true) {
      app.set('trust proxy', 1);
    } else if (typeof trustProxyVal === 'number') {
      app.set('trust proxy', trustProxyVal);
    } else if (/^\d+$/.test(String(trustProxyVal))) {
      app.set('trust proxy', Number.parseInt(String(trustProxyVal), 10));
    } else {
      app.set('trust proxy', trustProxyVal);
    }
  }

  // Enforce HTTPS redirect in production when behind a TLS-terminating proxy
  if (isProd) {
    app.use((req, res, next) => {
      const forwardedProto = req.headers['x-forwarded-proto'];
      if (forwardedProto === 'http') {
        const safePath =
          req.originalUrl.startsWith('/') && !req.originalUrl.startsWith('//')
            ? req.originalUrl
            : '/';
        res.redirect(301, `${siteUrl}${safePath}`);
        return;
      }
      next();
    });
  }

  // Explicit Helmet Security Headers & Content Security Policy
  // Allows Google AI Studio preview iframe embedding by default while blocking arbitrary third-party clickjacking frames.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: isProd ? ["'self'"] : ["'self'", 'ws:', 'wss:'],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
          frameAncestors: denyFraming
            ? ["'none'"]
            : [
                "'self'",
                'https://aistudio.google.com',
                'https://*.google.com',
                'https://*.usercontent.goog',
                'https://*.run.app',
              ],
          ...(isProd ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      strictTransportSecurity: isProd
        ? {
            maxAge: 15552000, // 6 months
            includeSubDomains: true,
            preload: false,
          }
        : false,
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xFrameOptions: denyFraming ? { action: 'deny' } : false,
      crossOriginOpenerPolicy: denyFraming ? { policy: 'same-origin' } : false,
      crossOriginResourcePolicy: { policy: denyFraming ? 'same-origin' : 'cross-origin' },
    })
  );

  // Explicit Permissions-Policy header
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );
    next();
  });

  // Block dotfiles, internal repo folders, and server source paths before any route/static handler
  app.use((req, res, next) => {
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(req.path);
    } catch {
      res.status(400).json({ error: 'Malformed URL path' });
      return;
    }

    if (decodedPath.includes('\0') || decodedPath.includes('..')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const lower = decodedPath.toLowerCase();
    const isWellKnownSecurityTxt = lower === '/.well-known/security.txt';
    const isViteDevDep = !isProd && lower.startsWith('/node_modules/.vite/');
    const isViteDevDataImport =
      !isProd &&
      !lower.startsWith('/data/reports') &&
      (lower.startsWith('/data/offers/') ||
        lower === '/data/categories.json' ||
        lower === '/data/sources/registry.json') &&
      Object.prototype.hasOwnProperty.call(req.query, 'import');

    if (
      (!isWellKnownSecurityTxt && !isViteDevDep && /(?:^|\/)\.[^/]+/.test(lower)) ||
      lower === '/server.ts' ||
      lower === '/server.js' ||
      lower === '/package.json' ||
      lower === '/package-lock.json' ||
      lower === '/tsconfig.json' ||
      lower === '/vite.config.ts' ||
      lower.startsWith('/data/reports') ||
      (!isViteDevDataImport && (lower.startsWith('/data/') || lower === '/data')) ||
      lower.startsWith('/scripts/') ||
      lower === '/scripts' ||
      lower.startsWith('/schema/') ||
      lower === '/schema' ||
      lower.startsWith('/dist-server/') ||
      lower === '/dist-server' ||
      (isProd && (lower.startsWith('/src/') || lower === '/src'))
    ) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    next();
  });

  // Rate limiters
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      !enableRateLimits ||
      (!isProd &&
        (req.path.startsWith('/src/') ||
          req.path.startsWith('/node_modules/') ||
          req.path.startsWith('/@') ||
          Object.prototype.hasOwnProperty.call(req.query, 'import'))),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    },
  });

  const reportsPostLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !enableRateLimits,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded for report submissions (max 5 per hour). Please try again later.',
      });
    },
  });

  const goRedirectLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !enableRateLimits,
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many outbound redirect requests. Please slow down.' });
    },
  });

  app.use(globalLimiter);

  // Strict 8kb JSON body parser
  app.use(express.json({ limit: '8kb', strict: true }));

  // Reject array/object query parameter pollution on /api/* and /go/*
  app.use(['/api', '/go'], (req, res, next) => {
    if (hasPollutedQuery(req.query as Record<string, unknown>, req.originalUrl)) {
      res.status(400).json({ error: 'Invalid query parameters: arrays and nested objects are not permitted.' });
      return;
    }
    next();
  });

  // Health & Readiness Endpoint
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      status: 'ok',
      catalogLoaded: offers.length > 0,
      offersCount: offers.length,
      categoriesCount: categories.length,
    });
  });

  // Data Quality & Verification Summary Endpoint (includes verified, unverified, needs_review, expired counts)
  app.get('/api/quality-report', (_req, res) => {
    res.json({
      ...qualityReport,
      statusBreakdown: {
        verified: qualityReport.verifiedCount,
        unverified: qualityReport.unverifiedCount,
        needs_review: qualityReport.needsReviewCount,
        expired: qualityReport.expiredCount,
        unavailable: qualityReport.unavailableCount,
      },
      registeredSources: sourceRegistry.sources.length,
    });
  });

  // Public GET-only /api/offers with strict Zod validation and mandatory pagination (max 100)
  app.all('/api/offers', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
    next();
  });

  app.get('/api/offers', (req, res) => {
    const parsed = offersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }

    const { q, category, subcategory, card, pricing, student, sort, limit = 24, offset = 0 } = parsed.data;

    let pricingModels: PricingModel[] = [];
    if (pricing) {
      const split = pricing.split(',').map((s) => s.trim()).filter(Boolean);
      for (const item of split) {
        if (!VALID_PRICING_VALUES.has(item as PricingModel)) {
          res.status(400).json({ error: `Invalid pricing model filter: ${item}` });
          return;
        }
        pricingModels.push(item as PricingModel);
      }
    }

    let sortBy: SortOption = 'relevance';
    if (sort === 'verified' || sort === 'recently_verified') sortBy = 'recently_verified';
    else if (sort === 'newest' || sort === 'recently_added') sortBy = 'recently_added';
    else if (sort === 'alphabetical' || sort === 'name_asc') sortBy = 'name_asc';
    else if (sort === 'use_case' || sort === 'context_desc' || sort === 'relevance') sortBy = sort;

    const normalizedCard: RequirementState | 'all' =
      card === 'not_required' || card === 'required' || card === 'unknown' ? card : 'all';

    const filtered = filterAndSortOffers(offers, {
      ...DEFAULT_FILTER_STATE,
      query: q ?? '',
      category: category ?? 'all',
      subcategory: subcategory ?? 'all',
      cardRequired: normalizedCard,
      pricingModels,
      studentAccess: student === 'true' ? 'exclusive' : 'all',
      sortBy,
    });

    const slice = filtered.slice(offset, offset + limit);
    res.json({
      count: slice.length,
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + slice.length < filtered.length,
      items: slice,
    });
  });

  // Admin-authenticated GET /api/reports (disabled if ADMIN_TOKEN is unset or <32 chars)
  app.get('/api/reports', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!adminToken || adminToken.trim().length < 32) {
      res.status(404).json({ error: 'Endpoint disabled' });
      return;
    }
    if (!verifyBearerAdminToken(req.headers.authorization, adminToken)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const items = readReportsSafe(reportsPath);
    res.json({ count: items.length, items });
  });

  // Same-origin, rate-limited, Zod-validated POST /api/reports
  app.post('/api/reports', reportsPostLimiter, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      res.status(415).json({ error: 'Content-Type must be application/json' });
      return;
    }

    // Same-origin enforcement (accounting for AI Studio preview iframe where Origin matches host)
    const secFetchSite = req.headers['sec-fetch-site'];
    const originHeader = req.headers.origin?.replace(/\/+$/, '');
    const reqHost = req.headers.host;
    const isMatchingHostOrigin =
      originHeader &&
      (originHeader === siteUrl ||
        (reqHost &&
          (originHeader === `https://${reqHost}` || originHeader === `http://${reqHost}`)));

    if (
      secFetchSite &&
      secFetchSite !== 'same-origin' &&
      secFetchSite !== 'none' &&
      !isMatchingHostOrigin
    ) {
      res.status(403).json({ error: 'Cross-origin report submissions are not permitted.' });
      return;
    }
    if (originHeader && isProd && !isMatchingHostOrigin) {
      res.status(403).json({ error: 'Origin mismatch' });
      return;
    }

    const parsed = reportBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid report payload',
      });
      return;
    }

    const { offerSlug, offerName, reportType, details, sourceUrl, website } = parsed.data;

    // Honeypot check
    if (website && website.trim().length > 0) {
      res.status(400).json({ error: 'Invalid submission' });
      return;
    }

    // Validate offerSlug exists in catalog when provided (or when reporting on an existing resource)
    let resolvedSlug: string | null = null;
    if (offerSlug) {
      if (!Map.prototype.has.call(offerBySlug, offerSlug)) {
        res.status(400).json({ error: 'Specified offerSlug does not exist in the catalog.' });
        return;
      }
      resolvedSlug = offerSlug;
    } else if (reportType !== 'new_resource') {
      const byName = offers.find(
        (o) =>
          o.identity.slug === offerName.toLowerCase() ||
          o.identity.name.toLowerCase() === offerName.toLowerCase()
      );
      if (byName) {
        resolvedSlug = byName.identity.slug;
      }
    }

    // Validate optional sourceUrl with strict HTTPS / no-credentials / no-private-IP validator
    let cleanSourceUrl: string | null = null;
    if (sourceUrl && sourceUrl.length > 0) {
      if (!isSafeExternalHttpsUrl(sourceUrl, { rejectTrackingParams: false })) {
        res.status(400).json({
          error:
            'Source URL must be a valid public https:// URL without credentials, IP literals, localhost, or URL shorteners.',
        });
        return;
      }
      cleanSourceUrl = sourceUrl;
    }

    const existing = readReportsSafe(reportsPath);
    const todayPrefix = new Date().toISOString().slice(0, 10);

    // Daily global cap check
    const todayCount = existing.filter((r) => (r.createdAt ?? '').startsWith(todayPrefix)).length;
    if (todayCount >= DAILY_GLOBAL_REPORTS_CAP) {
      res.status(429).json({
        error: 'Daily report queue capacity reached. Please open a GitHub issue instead.',
      });
      return;
    }

    const normalizedReportType: OutdatedReport['reportType'] =
      reportType === 'pricing_change'
        ? 'outdated_limit'
        : reportType === 'card_required_change'
        ? 'card_changed'
        : reportType === 'expired_offer'
        ? 'other'
        : reportType;

    // Content deduplication check
    const normalizedDetails = details.toLowerCase();
    const normalizedName = offerName.toLowerCase();
    const isDuplicate = existing.some(
      (r) =>
        r.reportType === normalizedReportType &&
        r.offerName.toLowerCase() === normalizedName &&
        r.details.toLowerCase() === normalizedDetails
    );
    if (isDuplicate) {
      res.status(409).json({ error: 'An identical report is already in the verification queue.' });
      return;
    }

    const report: OutdatedReport = {
      id: `rep_${crypto.randomBytes(8).toString('hex')}`,
      offerSlug: resolvedSlug,
      offerName,
      reportType: normalizedReportType,
      details,
      sourceUrl: cleanSourceUrl,
      createdAt: new Date().toISOString(),
    };

    try {
      existing.unshift(report);
      writeReportsAtomic(reportsPath, existing.slice(0, 500));
    } catch {
      res.status(503).json({ error: 'Unable to persist report at this time.' });
      return;
    }

    res.status(201).json({ status: 'queued', report });
  });

  // Safe Outbound Redirect Handler (/go/:slug)
  app.get('/go/:slug', goRedirectLimiter, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    const slug = req.params.slug;
    if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
      res.status(404).json({ error: 'Resource link not found' });
      return;
    }

    // Reject unknown query keys on /go/:slug
    const queryKeys = Object.keys(req.query);
    if (queryKeys.some((k) => k !== 'target')) {
      res.status(400).json({ error: 'Unsupported query parameter on redirect route' });
      return;
    }

    const rawTarget = req.query.target;
    const targetKind = rawTarget === undefined ? 'official' : String(rawTarget);
    if (!['official', 'signup', 'docs', 'pricing'].includes(targetKind)) {
      res.status(400).json({ error: 'Invalid redirect target kind' });
      return;
    }

    const offer = Map.prototype.get.call(offerBySlug, slug) as Offer | undefined;
    if (!offer) {
      res.status(404).json({ error: 'Resource link not found' });
      return;
    }

    let destination: string | null = offer.links.official;
    if (targetKind === 'signup') destination = offer.links.signup ?? offer.links.official;
    else if (targetKind === 'docs') destination = offer.links.documentation ?? offer.links.official;
    else if (targetKind === 'pricing') destination = offer.links.pricing ?? offer.links.official;

    if (!isSafeRedirectDestination(destination, offer)) {
      res.status(404).json({ error: 'Destination link unavailable' });
      return;
    }

    res.redirect(302, destination!);
  });

  // Cached robots.txt & sitemap.xml using SITE_URL (never Host header)
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain; charset=utf-8').send(cachedRobotsTxt);
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml; charset=utf-8').send(cachedSitemapXml);
  });

  // Serve /.well-known/security.txt
  app.get('/.well-known/security.txt', (_req, res) => {
    const secTxtPath = path.join(rootDir, 'public', '.well-known', 'security.txt');
    if (fs.existsSync(secTxtPath)) {
      res.type('text/plain; charset=utf-8').send(fs.readFileSync(secTxtPath, 'utf-8'));
      return;
    }
    res.status(404).type('text/plain; charset=utf-8').send('Not found');
  });

  // Unknown /api/* routes return 404 JSON
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Production static asset & SPA route handler
  if (isProd) {
    const distPath = path.join(rootDir, 'dist');
    const assetsPath = path.join(distPath, 'assets');

    if (fs.existsSync(assetsPath)) {
      app.use(
        '/assets',
        express.static(assetsPath, {
          dotfiles: 'ignore',
          index: false,
          redirect: false,
          maxAge: '365d',
          immutable: true,
        })
      );
    }

    if (fs.existsSync(distPath)) {
      app.use(
        express.static(distPath, {
          dotfiles: 'ignore',
          index: false,
          redirect: false,
          maxAge: '1h',
        })
      );
    }

    const indexHtmlPath = path.join(distPath, 'index.html');
    const cachedTemplateHtml = fs.existsSync(indexHtmlPath)
      ? fs.readFileSync(indexHtmlPath, 'utf-8')
      : '<!doctype html><html lang="en"><head><title>FreeStack</title><meta name="description" content="" /><meta property="og:title" content="" /><meta property="og:description" content="" /></head><body><div id="root"></div></body></html>';

    app.get('*', (req, res) => {
      const hasQuery = Object.keys(req.query).length > 0;
      const meta = resolveRouteMeta(
        req.path,
        hasQuery,
        siteUrl,
        offerBySlug,
        categoryBySlug
      );

      res.setHeader('Cache-Control', 'no-cache');
      const renderedHtml = injectHtmlMeta(cachedTemplateHtml, meta);
      res.status(meta.status).type('text/html; charset=utf-8').send(renderedHtml);
    });
  }

  // Central error handler: generic JSON, no stack traces or internal paths leaked
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (
      err &&
      typeof err === 'object' &&
      'type' in err &&
      (err as { type?: string }).type === 'entity.too.large'
    ) {
      res.status(413).json({ error: 'Request payload too large (max 8kb).' });
      return;
    }
    if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
      res.status(400).json({ error: 'Malformed JSON in request body.' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return {
    app,
    siteUrl,
    offerBySlug,
    categoryBySlug,
    qualityReport,
  };
}
