import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { createApp } from './createApp';
import { resolveRouteMeta, injectHtmlMeta } from './htmlMeta';
import { buildRouteSsrSnapshot } from './ssrSnapshot';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from '../data/nodeLoader';

const CATEGORIES = loadCategoriesFromDisk();
const ALL_OFFERS = loadOffersFromDisk();
const SOURCE_REGISTRY = loadSourceRegistryFromDisk();

function stripHtmlToWords(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

describe('On-Page SEO, SSR Crawlability & AI Visibility', () => {
  const offerBySlug = new Map(ALL_OFFERS.map((o) => [o.identity.slug, o]));
  const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

  it('keeps titles <= 60 chars and meta descriptions <= 160 chars across static, category, and offer routes', () => {
    const routesToCheck = [
      '/',
      '/explore',
      '/categories',
      '/learning',
      '/students',
      '/about',
      '/privacy',
      '/privacy-requests',
      '/terms',
      '/design-system',
      ...CATEGORIES.map((c) => `/category/${c.slug}`),
      ...ALL_OFFERS.slice(0, 30).map((o) => `/offer/${o.identity.slug}`),
    ];

    for (const route of routesToCheck) {
      const meta = resolveRouteMeta(
        route,
        false,
        'https://freestack.ai.studio',
        offerBySlug,
        categoryBySlug
      );
      assert.equal(meta.status, 200, `Expected 200 for ${route}`);
      assert.ok(
        meta.title.length >= 30 && meta.title.length <= 60,
        `Title for ${route} should be 30..60 chars, got ${meta.title.length}: "${meta.title}"`
      );
      assert.ok(
        meta.description.length >= 60 && meta.description.length <= 160,
        `Description for ${route} should be 60..160 chars, got ${meta.description.length}: "${meta.description}"`
      );
      assert.ok(
        meta.canonicalUrl.startsWith('https://freestack.ai.studio'),
        `Canonical for ${route} should use https://freestack.ai.studio`
      );
    }
  });

  it('never truncates an offer title with an ellipsis and never doubles the word Free', () => {
    for (const offer of ALL_OFFERS) {
      const meta = resolveRouteMeta(
        `/offer/${offer.identity.slug}`,
        false,
        'https://freestack.ai.studio',
        offerBySlug,
        categoryBySlug
      );
      const label = `${offer.identity.slug} -> "${meta.title}"`;
      assert.equal(meta.status, 200, label);
      assert.ok(!meta.title.includes('…'), `Offer title must not be ellipsis-clamped: ${label}`);
      assert.ok(
        meta.title.length <= 60 || meta.title === offer.identity.name.trim(),
        `Offer title must fit 60 chars unless it is the untouched offer name: ${label}`
      );
      assert.ok(meta.title.length >= 30, `Offer title must be >= 30 chars: ${label}`);
      if (/\bFree\b/i.test(offer.identity.name)) {
        const suffixOnly = meta.title.split(offer.identity.name).join('');
        assert.ok(
          !/free limits/i.test(suffixOnly),
          `Offer title repeats "Free" before "Free Limits": ${label}`
        );
      }
    }
  });

  it('omits the canonical link and BreadcrumbList gaps on 404 responses', () => {
    const meta = resolveRouteMeta(
      '/this-page-does-not-exist',
      false,
      'https://freestack.ai.studio',
      offerBySlug,
      categoryBySlug
    );
    assert.equal(meta.status, 404);
    assert.equal(meta.canonicalUrl, '', '404 responses must not claim a canonical URL');
    const html = injectHtmlMeta(
      '<html><head><title>x</title><meta name="description" content="" /></head><body></body></html>',
      meta
    );
    assert.ok(!/rel="canonical"/i.test(html), '404 HTML must not contain a canonical link');
  });

  it('emits BreadcrumbList, item counts, and last-verified dates in structured data', () => {
    const offer = ALL_OFFERS[0];
    const offerMeta = resolveRouteMeta(
      `/offer/${offer.identity.slug}`,
      false,
      'https://freestack.ai.studio',
      offerBySlug,
      categoryBySlug
    );
    const offerJson = JSON.stringify(offerMeta.jsonLd);
    assert.ok(offerJson.includes('BreadcrumbList'), 'Offer JSON-LD should include BreadcrumbList');
    assert.ok(offerJson.includes('dateModified'), 'Offer JSON-LD should include dateModified');
    assert.ok(offerJson.includes('/category/'), 'Offer breadcrumb should include its category');

    const catMeta = resolveRouteMeta(
      '/category/mcp',
      false,
      'https://freestack.ai.studio',
      offerBySlug,
      categoryBySlug,
      ALL_OFFERS
    );
    const catJson = JSON.stringify(catMeta.jsonLd);
    assert.ok(catJson.includes('BreadcrumbList'), 'Category JSON-LD should include BreadcrumbList');
    assert.ok(catJson.includes('numberOfItems'), 'Category JSON-LD should expose its item count');
    const mcpCount = ALL_OFFERS.filter((o) => o.classification.category === 'mcp').length;
    assert.ok(
      catJson.includes(`"numberOfItems":${mcpCount}`),
      `Category JSON-LD should report ${mcpCount} MCP items`
    );
  });

  it('generates exact 1 H1, 300+ words, and rich internal links in SSR semantic snapshots', () => {
    const categoryCounts: Record<string, number> = {};
    for (const o of ALL_OFFERS) {
      categoryCounts[o.classification.category] =
        (categoryCounts[o.classification.category] ?? 0) + 1;
    }

    const indexableRoutes = [
      '/',
      '/explore',
      '/categories',
      '/learning',
      '/students',
      '/about',
      '/privacy',
      '/privacy-requests',
      '/terms',
      '/category/ai-ml',
      '/category/mcp',
      `/offer/${ALL_OFFERS[0].identity.slug}`,
    ];

    for (const pathname of indexableRoutes) {
      const snapshot = buildRouteSsrSnapshot({
        pathname,
        categories: CATEGORIES,
        offers: ALL_OFFERS,
        offerBySlug,
        categoryBySlug,
        categoryCounts,
      });

      const h1Matches = snapshot.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
      assert.equal(h1Matches.length, 1, `Expected exactly 1 <h1> for ${pathname}`);

      const words = stripHtmlToWords(snapshot);
      assert.ok(
        words.length >= 300,
        `Expected >= 300 words for ${pathname}, got ${words.length}`
      );

      const internalLinks = snapshot.match(/href="\/[^"]*"/g) ?? [];
      assert.ok(
        internalLinks.length >= 15,
        `Expected >= 15 internal links for ${pathname}, got ${internalLinks.length}`
      );

      assert.ok(
        snapshot.includes('class="fs-ssr-only"'),
        'SSR snapshot must be wrapped in .fs-ssr-only to prevent unstyled visual flash'
      );
    }
  });

  it('injects OpenGraph, Twitter Card tags, JSON-LD, and SSR snapshot cleanly into HTML', () => {
    const template =
      '<!doctype html><html><head><title>T</title><meta name="description" content="" /><meta property="og:title" content="" /><meta property="og:description" content="" /></head><body><div id="root"></div></body></html>';
    const meta = resolveRouteMeta(
      '/',
      false,
      'https://freestack.ai.studio',
      offerBySlug,
      categoryBySlug
    );
    const snapshot = buildRouteSsrSnapshot({
      pathname: '/',
      categories: CATEGORIES,
      offers: ALL_OFFERS.slice(0, 40),
      offerBySlug,
      categoryBySlug,
    });
    const html = injectHtmlMeta(template, meta, snapshot);
    assert.ok(html.includes('<meta property="og:site_name" content="FreeStack" />'));
    assert.ok(
      html.includes('<meta property="og:image" content="https://freestack.ai.studio/og-image.png" />')
    );
    assert.ok(html.includes('<meta property="og:image:width" content="1200" />'));
    assert.ok(html.includes('<meta property="og:image:height" content="630" />'));
    assert.ok(html.includes('<meta name="twitter:title"'));
    assert.ok(html.includes('<meta name="twitter:description"'));
    assert.ok(
      html.includes('<meta name="twitter:image" content="https://freestack.ai.studio/og-image.png" />')
    );
    assert.ok(html.includes('application/ld+json'));
    assert.ok(html.includes('SearchAction'));
    assert.ok(html.includes('<h1>Find more. Spend less. Build anything.</h1>'));
    assert.ok(html.includes('alt="FreeStack verified free developer directory logo"'));
  });

  describe('Live HTTP endpoints (/robots.txt, /llms.txt, canonical origin, /api X-Robots-Tag)', () => {
    let server: Server;
    let baseUrl: string;
    let port = 0;

    before(async () => {
      const prevSiteUrl = process.env.SITE_URL;
      const prevAppUrl = process.env.APP_URL;
      delete process.env.SITE_URL;
      process.env.APP_URL = 'https://freestack-fallback.asia-east1.run.app';

      const { app } = createApp({
        isProduction: true,
        offers: ALL_OFFERS.slice(0, 60),
        categories: CATEGORIES,
        sourceRegistry: SOURCE_REGISTRY,
        enableRateLimits: false,
      });

      if (prevSiteUrl !== undefined) process.env.SITE_URL = prevSiteUrl;
      if (prevAppUrl !== undefined) process.env.APP_URL = prevAppUrl;
      else delete process.env.APP_URL;

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          if (addr && typeof addr === 'object') {
            port = addr.port;
            baseUrl = `http://127.0.0.1:${addr.port}`;
          }
          resolve();
        });
      });
    });

    after(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('allows all 15 AI bots in /robots.txt without Disallow restrictions and serves /llms.txt', async () => {
      const res = await fetch(`${baseUrl}/robots.txt`, {
        headers: { 'X-Forwarded-Host': 'freestack.ai.studio' },
      });
      assert.equal(res.status, 200);
      const txt = await res.text();
      assert.ok(!/^Disallow:/m.test(txt), 'robots.txt should not have Disallow lines restricting AI bots');
      for (const bot of [
        'OAI-SearchBot',
        'PerplexityBot',
        'ChatGPT-User',
        'anthropic-ai',
        'Claude-Web',
        'Perplexity-User',
        'Amazonbot',
        'MistralAI-User',
        'GPTBot',
        'Google-Extended',
        'ClaudeBot',
        'CCBot',
        'Applebot-Extended',
        'Bytespider',
        'Meta-ExternalAgent',
      ]) {
        assert.ok(txt.includes(`User-agent: ${bot}`), `Missing explicit rule for ${bot}`);
      }
      assert.ok(txt.includes('Sitemap: https://freestack.ai.studio/sitemap.xml'));

      const llmsRes = await fetch(`${baseUrl}/llms.txt`, {
        headers: { 'X-Forwarded-Host': 'freestack.ai.studio' },
      });
      assert.equal(llmsRes.status, 200);
      const llmsTxt = await llmsRes.text();
      assert.ok(llmsTxt.includes('# FreeStack'));
      assert.ok(llmsTxt.includes('https://freestack.ai.studio/category/ai-ml'));
      assert.ok(llmsTxt.includes('https://freestack.ai.studio/sitemap.xml'));
    });

    it('uses freestack.ai.studio canonical for allowlisted host while rejecting untrusted Host headers', async () => {
      const okRes = await fetch(`${baseUrl}/`, {
        headers: { 'X-Forwarded-Host': 'freestack.ai.studio' },
      });
      assert.equal(okRes.status, 200);
      assert.ok(
        (okRes.headers.get('cache-control') ?? '').includes('s-maxage=300'),
        'Public Home HTML should be edge-cacheable with s-maxage'
      );
      const okHtml = await okRes.text();
      assert.ok(okHtml.includes('<link rel="canonical" href="https://freestack.ai.studio/" />'));
      assert.ok(okHtml.includes('data-freestack-home-ssr="true"'));
      const h1Matches = okHtml.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
      assert.equal(h1Matches.length, 1, 'Expected exactly 1 <h1> in rendered Home HTML');
      assert.ok(h1Matches[0].includes('Find more.'));
      assert.ok(h1Matches[0].includes('Spend less.'));
      assert.ok(h1Matches[0].includes('Build anything.'));
      assert.ok(
        okHtml.includes('Discover verified free AI models, MCP servers, APIs'),
        'Expected visible hero LCP subtext in SSR HTML'
      );
      assert.ok(okHtml.includes('alt="FreeStack verified free developer directory logo"'));

      // Also verify direct HTTP Host header (since fetch() strips Host as a forbidden header)
      const http = await import('node:http');
      const rawHostHtml = await new Promise<string>((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path: '/',
            method: 'GET',
            headers: { Host: 'freestack.ai.studio' },
          },
          (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              body += chunk;
            });
            res.on('end', () => resolve(body));
          }
        );
        req.on('error', reject);
        req.end();
      });
      assert.ok(
        rawHostHtml.includes('<link rel="canonical" href="https://freestack.ai.studio/" />')
      );

      const evilRes = await fetch(`${baseUrl}/`, {
        headers: { 'X-Forwarded-Host': 'evil-attacker.example.org' },
      });
      assert.equal(evilRes.status, 200);
      const evilHtml = await evilRes.text();
      assert.ok(!evilHtml.includes('evil-attacker.example.org'));
      assert.ok(
        evilHtml.includes('https://freestack-fallback.asia-east1.run.app/')
      );
    });

    it('sets X-Robots-Tag: noindex, nofollow on /api/* responses and serves /sitemap.xml', async () => {
      const apiRes = await fetch(`${baseUrl}/api/health`);
      assert.equal(apiRes.status, 200);
      assert.equal(apiRes.headers.get('x-robots-tag'), 'noindex, nofollow');

      const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`, {
        headers: { 'X-Forwarded-Host': 'freestack.ai.studio' },
      });
      assert.equal(sitemapRes.status, 200);
      const sitemapXml = await sitemapRes.text();
      assert.ok(sitemapXml.includes('<urlset'));
      assert.ok(sitemapXml.includes('https://freestack.ai.studio/'));
      assert.ok(sitemapXml.includes('https://freestack.ai.studio/category/ai-ml'));
    });
  });
});
