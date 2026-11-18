import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import zlib from 'node:zlib';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { z } from 'zod';
import type {
  Category,
  LearningDifficulty,
  LearningFormat,
  Offer,
  OutdatedReport,
  PricingModel,
  RequirementState,
  ResourceType,
  SortOption,
  SourceRegistry,
  StudentAccessState,
  VerificationStatus,
} from '../../types/resource';
import type { AiModalityId } from '../ai/aiModelMetadata';
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
import { OfferCatalogIndex } from './offerCatalogIndex';

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

const VALID_RESOURCE_TYPES = new Set<ResourceType>([
  'software',
  'ai_model',
  'mcp_server',
  'api',
  'course',
  'book',
  'documentation',
  'tutorial',
  'roadmap',
  'dataset',
  'cloud_service',
  'developer_tool',
  'student_benefit',
  'practice',
  'other',
]);

const offersQuerySchema = z
  .object({
    q: z
      .string()
      .max(160)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    category: z.enum([...VALID_CATEGORY_SLUGS, 'all'] as const).optional(),
    type: z
      .string()
      .max(80)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    typeGroup: z
      .string()
      .max(80)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    resourceType: z
      .string()
      .max(80)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    subcategory: z
      .string()
      .max(120)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    subtype: z
      .string()
      .max(100)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    card: z.enum(['not_required', 'required', 'conditional', 'unknown', 'all']).optional(),
    pricing: z
      .string()
      .max(240)
      .optional(),
    student: z
      .enum(['true', 'false', '1', '0', 'all', 'eligible', 'exclusive', 'not_eligible', 'unknown'])
      .optional(),
    verify: z.enum(['all', 'exclusive', 'eligible', 'required', 'not_required']).optional(),
    status: z
      .enum(['all', 'verified', 'needs_review', 'expired', 'unavailable', 'unverified'])
      .optional(),
    region: z
      .string()
      .max(80)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    official: z.enum(['1', '0', 'true', 'false', 'all']).optional(),
    scope: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    lang: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    os: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    modality: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    ctx: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    format: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    difficulty: z
      .string()
      .max(40)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    topic: z
      .string()
      .max(100)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    language: z
      .string()
      .max(60)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    learningOnly: z.enum(['1', '0', 'true', 'false']).optional(),
    slugs: z
      .string()
      .max(4096)
      .transform((v) => stripControlChars(v).trim())
      .optional(),
    fields: z.enum(['card', 'full']).optional(),
    facets: z.enum(['1', '0', 'true', 'false']).optional(),
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

function extractIpFromForwardedHeader(forwardedHeader: string | string[] | undefined): string | null {
  if (!forwardedHeader) return null;
  const raw = Array.isArray(forwardedHeader) ? forwardedHeader.join(',') : forwardedHeader;
  const hops = raw.split(',');
  // Read right-most hop added by our trusted proxy first so spoofed client prefixes cannot override it
  for (let i = hops.length - 1; i >= 0; i--) {
    const hop = hops[i];
    const match = /(?:^|;\s*)for=([^;\s]+)/i.exec(hop);
    if (!match) continue;
    let candidate = match[1].replace(/^"|"$/g, '').trim();
    if (candidate.startsWith('[')) {
      const closeIdx = candidate.indexOf(']');
      if (closeIdx > 1) {
        candidate = candidate.slice(1, closeIdx);
      }
    } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
      candidate = candidate.replace(/:\d+$/, '');
    }
    if (net.isIP(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveClientIpFromRequest(req: Request): string {
  const trustProxySetting = req.app?.get('trust proxy');
  const trustsProxy = trustProxySetting !== false && trustProxySetting !== 0;

  if (trustsProxy) {
    const remoteAddr = req.socket?.remoteAddress;
    if (req.ip && req.ip !== remoteAddr && net.isIP(req.ip)) {
      return req.ip;
    }
    const forwardedIp = extractIpFromForwardedHeader(req.headers.forwarded);
    if (forwardedIp) {
      return forwardedIp;
    }
  }

  const fallback = req.ip ?? req.socket?.remoteAddress ?? '127.0.0.1';
  return net.isIP(fallback) ? fallback : '127.0.0.1';
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
  const catalogIndex = new OfferCatalogIndex(offers, categories);
  const offerBySlug = catalogIndex.fullBySlug;
  const categoryBySlug = catalogIndex.categoryBySlug;
  const qualityReport = generateDataQualityReport(offers, categories);
  const cachedSitemapXml = buildSitemapXml(siteUrl, categories, offers);

  function sendCompressedPayload(
    req: Request,
    res: Response,
    contentType: string,
    rawBody: string | Buffer,
    options?: {
      status?: number;
      cacheControl?: string;
      etag?: string;
    }
  ): void {
    const status = options?.status ?? 200;
    const bodyBuf = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody;
    const etag =
      options?.etag ??
      `W/"${crypto.createHash('sha1').update(bodyBuf).digest('hex').slice(0, 20)}"`;

    if (options?.cacheControl) {
      res.setHeader('Cache-Control', options.cacheControl);
    }
    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Accept-Encoding');

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.includes(etag) && status === 200) {
      res.status(304).end();
      return;
    }

    res.status(status).setHeader('Content-Type', contentType);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const acceptEncoding = String(req.headers['accept-encoding'] ?? '');
    if (bodyBuf.byteLength >= 512) {
      if (/\bbr\b/.test(acceptEncoding)) {
        const compressed = zlib.brotliCompressSync(bodyBuf, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
          },
        });
        res.setHeader('Content-Encoding', 'br');
        res.send(compressed);
        return;
      }
      if (/\bgzip\b/.test(acceptEncoding)) {
        const compressed = zlib.gzipSync(bodyBuf, { level: 6 });
        res.setHeader('Content-Encoding', 'gzip');
        res.send(compressed);
        return;
      }
    }

    res.send(bodyBuf);
  }
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

  // Default to 1 proxy hop (e.g., Cloud Run / AI Studio reverse proxy) unless explicitly disabled
  const rawTrustProxy = options.trustProxy ?? process.env.TRUST_PROXY;
  const trustProxyVal =
    rawTrustProxy === undefined || rawTrustProxy === '' ? 1 : rawTrustProxy;

  if (trustProxyVal === false || trustProxyVal === 'false' || trustProxyVal === 0 || trustProxyVal === '0') {
    app.set('trust proxy', false);
  } else if (trustProxyVal === 'true' || trustProxyVal === true) {
    app.set('trust proxy', 1);
  } else if (typeof trustProxyVal === 'number') {
    app.set('trust proxy', trustProxyVal);
  } else if (/^\d+$/.test(String(trustProxyVal))) {
    app.set('trust proxy', Number.parseInt(String(trustProxyVal), 10));
  } else {
    app.set('trust proxy', trustProxyVal);
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

  // Rate limiters (keyGenerator uses req.ip + RFC 7239 Forwarded + IPv6 subnet normalization)
  const keyGenerator = (req: Request) => ipKeyGenerator(resolveClientIpFromRequest(req), 56);

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skip: (req) =>
      !enableRateLimits ||
      req.path.startsWith('/api/offers') ||
      req.path.startsWith('/logos/') ||
      req.path.startsWith('/fonts/') ||
      req.path.startsWith('/assets/') ||
      (!isProd &&
        (req.path.startsWith('/src/') ||
          req.path.startsWith('/node_modules/') ||
          req.path.startsWith('/@') ||
          Object.prototype.hasOwnProperty.call(req.query, 'import'))),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    },
  });

  // Dedicated high-capacity rate limiter for /api/offers so typing & filtering never hit 429
  const offersApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 1200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skip: () => !enableRateLimits,
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many search/filter requests. Please wait a moment.' });
    },
  });

  const reportsPostLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
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
    keyGenerator,
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
  app.all('/api/offers', offersApiLimiter, (req, res, next) => {
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

    const {
      q,
      category,
      type,
      typeGroup,
      resourceType,
      subcategory,
      subtype,
      card,
      pricing,
      student,
      verify,
      status,
      region,
      official,
      scope,
      lang,
      os,
      modality,
      ctx,
      format,
      difficulty,
      topic,
      language,
      learningOnly,
      slugs,
      fields = 'card',
      facets,
      sort,
      limit = 24,
      offset = 0,
    } = parsed.data;

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

    let resolvedResourceType: ResourceType | 'all' = 'all';
    let resolvedTypeGroup = typeGroup ?? 'all';
    if (resourceType && resourceType !== 'all') {
      if (VALID_RESOURCE_TYPES.has(resourceType as ResourceType)) {
        resolvedResourceType = resourceType as ResourceType;
      } else {
        res.status(400).json({ error: `Invalid resourceType filter: ${resourceType}` });
        return;
      }
    } else if (type && type !== 'all') {
      if (VALID_RESOURCE_TYPES.has(type as ResourceType) && (!category || category === 'all')) {
        resolvedResourceType = type as ResourceType;
      } else {
        resolvedTypeGroup = type;
      }
    }

    let sortBy: SortOption | undefined;
    if (sort === 'verified' || sort === 'recently_verified') sortBy = 'recently_verified';
    else if (sort === 'newest' || sort === 'recently_added') sortBy = 'recently_added';
    else if (sort === 'alphabetical' || sort === 'name_asc') sortBy = 'name_asc';
    else if (sort === 'use_case' || sort === 'context_desc' || sort === 'relevance') sortBy = sort;

    const normalizedCard: RequirementState | 'all' =
      card === 'not_required' || card === 'required' || card === 'unknown' ? card : 'all';

    let normalizedStudent: StudentAccessState | 'all' | '1' = 'all';
    if (student === 'true') normalizedStudent = 'exclusive';
    else if (student === '1') normalizedStudent = '1';
    else if (
      student === 'eligible' ||
      student === 'exclusive' ||
      student === 'not_eligible' ||
      student === 'unknown'
    ) {
      normalizedStudent = student;
    }

    const slugList = slugs
      ? slugs
          .split(',')
          .map((s) => s.trim())
          .filter((s) => /^[a-z0-9-]{1,120}$/.test(s))
          .slice(0, 100)
      : undefined;

    const result = catalogIndex.query({
      q: q ?? '',
      category: category ?? 'all',
      type: resolvedTypeGroup,
      typeGroup: resolvedTypeGroup,
      resourceType: resolvedResourceType,
      subcategory: subcategory ?? 'all',
      subtype: subtype ?? 'all',
      card: normalizedCard,
      pricing: pricingModels,
      student: normalizedStudent,
      verify: verify ?? 'all',
      status: (status as VerificationStatus | 'all') ?? 'all',
      region: region ?? 'all',
      official: official === '1' || official === 'true',
      scope: scope ?? 'all',
      lang: lang ?? 'all',
      os: os ?? 'all',
      modality: (modality as AiModalityId | 'all') ?? 'all',
      ctx: ctx ?? 'all',
      format: (format as LearningFormat | 'all') ?? 'all',
      difficulty: (difficulty as LearningDifficulty | 'all') ?? 'all',
      topic: topic ?? 'all',
      language: language ?? 'all',
      learningOnly: learningOnly === '1' || learningOnly === 'true',
      slugs: slugList,
      sort: sortBy,
      limit,
      offset,
      fields,
      includeFacets: facets === '1' || facets === 'true',
    });

    const payload = JSON.stringify({
      count: result.count,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.offset + result.count < result.total,
      items: result.items,
      ...(result.facets ? { facets: result.facets } : {}),
    });

    sendCompressedPayload(req, res, 'application/json; charset=utf-8', payload, {
      cacheControl: 'public, max-age=300, stale-while-revalidate=86400',
    });
  });

  // Public GET-only /api/offers/:slug for single offer detail + related offers on demand
  app.all('/api/offers/:slug', offersApiLimiter, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
    next();
  });

  app.get('/api/offers/:slug', (req, res) => {
    const slug = req.params.slug;
    if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug) || !Map.prototype.has.call(offerBySlug, slug)) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }
    const detail = catalogIndex.getOfferDetail(slug, 3);
    if (!detail) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }
    const payload = JSON.stringify(detail);
    sendCompressedPayload(req, res, 'application/json; charset=utf-8', payload, {
      cacheControl: 'public, max-age=300, stale-while-revalidate=86400',
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
  app.get('/robots.txt', (req, res) => {
    sendCompressedPayload(req, res, 'text/plain; charset=utf-8', cachedRobotsTxt, {
      cacheControl: 'public, max-age=3600',
    });
  });

  app.get('/sitemap.xml', (req, res) => {
    sendCompressedPayload(req, res, 'application/xml; charset=utf-8', cachedSitemapXml, {
      cacheControl: 'public, max-age=3600',
    });
  });

  // Serve /.well-known/security.txt
  app.get('/.well-known/security.txt', (_req, res) => {
    const secTxtPath = path.join(rootDir, 'public', '.well-known', 'security.txt');
    if (fs.existsSync(secTxtPath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.type('text/plain; charset=utf-8').send(fs.readFileSync(secTxtPath, 'utf-8'));
      return;
    }
    res.status(404).type('text/plain; charset=utf-8').send('Not found');
  });

  // Unknown /api/* routes return 404 JSON
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Serve /logos and /fonts with long-lived immutable cache headers in both dev and prod
  const publicLogosPath = path.join(rootDir, 'public', 'logos');
  if (fs.existsSync(publicLogosPath)) {
    app.use(
      '/logos',
      express.static(publicLogosPath, {
        dotfiles: 'ignore',
        index: false,
        redirect: false,
        maxAge: '365d',
        immutable: true,
      }),
      (_req, res) => {
        res.status(404).type('text/plain; charset=utf-8').send('Logo not found');
      }
    );
  }

  const publicFontsPath = path.join(rootDir, 'public', 'fonts');
  if (fs.existsSync(publicFontsPath)) {
    app.use(
      '/fonts',
      express.static(publicFontsPath, {
        dotfiles: 'ignore',
        index: false,
        redirect: false,
        maxAge: '365d',
        immutable: true,
      }),
      (_req, res) => {
        res.status(404).type('text/plain; charset=utf-8').send('Font not found');
      }
    );
  }

  // Production static asset & SPA route handler
  if (isProd) {
    const distPath = path.join(rootDir, 'dist');
    const assetsPath = path.join(distPath, 'assets');

    if (fs.existsSync(assetsPath)) {
      // Serve precompressed .br / .gz assets when available
      app.use('/assets', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next();
          return;
        }
        const relPath = req.path.replace(/^\/+/, '');
        if (!relPath || relPath.includes('..') || relPath.includes('\0')) {
          next();
          return;
        }
        const origFile = path.join(assetsPath, relPath);
        const acceptEncoding = String(req.headers['accept-encoding'] ?? '');
        res.setHeader('Vary', 'Accept-Encoding');

        const ext = path.extname(relPath).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.svg': 'image/svg+xml; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
        };
        const contentType = mimeMap[ext];
        if (!contentType) {
          next();
          return;
        }

        if (/\bbr\b/.test(acceptEncoding) && fs.existsSync(`${origFile}.br`)) {
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.sendFile(`${origFile}.br`);
          return;
        }
        if (/\bgzip\b/.test(acceptEncoding) && fs.existsSync(`${origFile}.gz`)) {
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.sendFile(`${origFile}.gz`);
          return;
        }
        next();
      });

      app.use(
        '/assets',
        express.static(assetsPath, {
          dotfiles: 'ignore',
          index: false,
          redirect: false,
          maxAge: '365d',
          immutable: true,
        }),
        (_req, res) => {
          res.status(404).type('text/plain; charset=utf-8').send('Asset not found');
        }
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

      const renderedHtml = injectHtmlMeta(cachedTemplateHtml, meta);
      sendCompressedPayload(req, res, 'text/html; charset=utf-8', renderedHtml, {
        status: meta.status,
        cacheControl: 'no-cache',
      });
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
