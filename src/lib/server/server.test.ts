import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { createApp } from './createApp';
import { loadCategoriesFromDisk, loadOffersFromDisk, loadSourceRegistryFromDisk } from '../data/nodeLoader';
import { safeJsonLdSerialize, escapeHtmlAttr } from './securityUtils';
import { resolveRouteMeta, injectHtmlMeta } from './htmlMeta';
import { extractInlineCspHashes } from './contentSecurityPolicy';
import type { Offer } from '../../types/resource';

const CATEGORIES = loadCategoriesFromDisk();
const ALL_OFFERS = loadOffersFromDisk();
const SAMPLE_OFFERS = ALL_OFFERS.slice(0, 25);
const SOURCE_REGISTRY = loadSourceRegistryFromDisk();

describe('FreeStack Server Security & API Hardening (Phase 2 & 6)', () => {
  let server: Server;
  let baseUrl: string;
  let tmpReportsDir: string;
  let reportsPath: string;
  const validAdminToken = 'adm_test_secret_token_32_characters_minimum_9999';

  before(async () => {
    tmpReportsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'freestack-test-'));
    reportsPath = path.join(tmpReportsDir, 'reports.json');

    const { app } = createApp({
      isProduction: true,
      siteUrl: 'https://freestack.example.com',
      strictSiteUrl: true,
      denyFraming: true,
      reportsPath,
      adminToken: validAdminToken,
      offers: SAMPLE_OFFERS,
      categories: CATEGORIES,
      sourceRegistry: SOURCE_REGISTRY,
      enableRateLimits: true,
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    fs.rmSync(tmpReportsDir, { recursive: true, force: true });
  });

  it('fails fast when NODE_ENV=production, strictSiteUrl=true, and SITE_URL is missing or non-HTTPS', () => {
    assert.throws(
      () =>
        createApp({
          isProduction: true,
          strictSiteUrl: true,
          siteUrl: '',
          offers: SAMPLE_OFFERS,
          categories: CATEGORIES,
          sourceRegistry: SOURCE_REGISTRY,
        }),
      /SITE_URL environment variable is required in production/
    );

    assert.throws(
      () =>
        createApp({
          isProduction: true,
          siteUrl: 'http://insecure.example.com',
          offers: SAMPLE_OFFERS,
          categories: CATEGORIES,
          sourceRegistry: SOURCE_REGISTRY,
        }),
      /https:\/\//
    );
  });

  it('redirects HTTP to HTTPS (301) in production when x-forwarded-proto is http', async () => {
    const res = await fetch(`${baseUrl}/explore?q=supabase`, {
      redirect: 'manual',
      headers: {
        'x-forwarded-proto': 'http',
      },
    });
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), 'https://freestack.example.com/explore?q=supabase');
  });

  it('sets strict Helmet security headers, CSP, HSTS, Permissions-Policy, and hides X-Powered-By', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.ok(res.headers.get('strict-transport-security')?.includes('max-age=15552000'));
    assert.ok(res.headers.get('permissions-policy')?.includes('camera=()'));

    const csp = res.headers.get('content-security-policy') ?? '';
    const directive = (name: string) =>
      csp
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name} `)) ?? '';
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(csp.includes("script-src 'self'"));
    assert.ok(!csp.includes('unsafe-eval'));
    assert.ok(csp.includes("object-src 'none'"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.ok(!csp.includes('*'), 'CSP must not contain wildcard sources');
    assert.ok(!directive('script-src').includes("'unsafe-inline'"));
    assert.ok(!directive('style-src').includes("'unsafe-inline'"));
    assert.ok(directive('style-src-attr').includes("'unsafe-inline'"));
  });

  it('hashes inline style and script blocks so CSP can avoid unsafe-inline', () => {
    const hashes = extractInlineCspHashes(
      '<style>.fs-ssr-only{display:none}</style><script type="application/ld+json">{"@type":"WebSite"}</script><script src="/assets/app.js"></script>'
    );
    assert.equal(hashes.styleHashes.length, 1);
    assert.equal(hashes.scriptHashes.length, 1);
    assert.match(hashes.styleHashes[0], /^'sha256-[A-Za-z0-9+/=]+'$/);
    assert.match(hashes.scriptHashes[0], /^'sha256-[A-Za-z0-9+/=]+'$/);
  });

  it('serves HTML with a hash-based CSP that does not allow wildcards or unsafe-inline scripts', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const csp = res.headers.get('content-security-policy') ?? '';
    assert.ok(!csp.includes('*'));
    assert.match(csp, /script-src[^;]*'sha256-/);
    assert.ok(!csp.includes("script-src 'self' 'unsafe-inline'"));
  });

  it('blocks access to dotfiles, server source files, and internal repo directories while serving /.well-known/security.txt', async () => {
    const blockedPaths = [
      '/.env',
      '/.git/config',
      '/server.ts',
      '/package.json',
      '/data/categories.json',
      '/scripts/validate-data.ts',
      '/schema/offer.schema.json',
      '/src/main.tsx',
    ];

    for (const p of blockedPaths) {
      const res = await fetch(`${baseUrl}${p}`);
      assert.equal(res.status, 404, `Expected ${p} to return 404, got ${res.status}`);
    }

    const secTxt = await fetch(`${baseUrl}/.well-known/security.txt`);
    assert.equal(secTxt.status, 200);
    const text = await secTxt.text();
    assert.ok(text.includes('Expires:'));
  });

  it('prevents Host header poisoning in /sitemap.xml, /robots.txt, and canonical HTML tags', async () => {
    const resSitemap = await fetch(`${baseUrl}/sitemap.xml`, {
      headers: { Host: 'evil-attacker.example.org' },
    });
    assert.equal(resSitemap.status, 200);
    const xml = await resSitemap.text();
    assert.ok(xml.includes('https://freestack.example.com/explore'));
    assert.ok(!xml.includes('evil-attacker.example.org'));

    const resRobots = await fetch(`${baseUrl}/robots.txt`, {
      headers: { Host: 'evil-attacker.example.org' },
    });
    assert.equal(resRobots.status, 200);
    const robots = await resRobots.text();
    assert.ok(robots.includes('Sitemap: https://freestack.example.com/sitemap.xml'));
    assert.ok(!robots.includes('evil-attacker.example.org'));

    const resPage = await fetch(`${baseUrl}/explore`, {
      headers: { Host: 'evil-attacker.example.org' },
    });
    assert.equal(resPage.status, 200);
    const html = await resPage.text();
    assert.ok(html.includes('href="https://freestack.example.com/explore"'));
    assert.ok(!html.includes('evil-attacker.example.org'));
  });

  it('escapes </script> in JSON-LD and sets noindex on search/saved/filtered/404 routes', async () => {
    const maliciousPayload = {
      name: '</script><script>alert("xss")</script>',
      description: 'Test & <tag>',
    };
    const serialized = safeJsonLdSerialize(maliciousPayload);
    assert.ok(!serialized.includes('</script>'));
    assert.ok(serialized.includes('\\u003c/script\\u003e'));

    const escaped = escapeHtmlAttr('"><img src=x onerror=alert(1)>');
    assert.ok(!escaped.includes('<'));
    assert.ok(!escaped.includes('>'));

    const offerBySlug = new Map<string, Offer>(SAMPLE_OFFERS.map((o) => [o.identity.slug, o]));
    const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

    const searchMeta = resolveRouteMeta('/search', false, 'https://freestack.example.com', offerBySlug, categoryBySlug);
    assert.equal(searchMeta.robots, 'noindex, follow');

    const filteredExploreMeta = resolveRouteMeta('/explore', true, 'https://freestack.example.com', offerBySlug, categoryBySlug);
    assert.equal(filteredExploreMeta.robots, 'noindex, follow');

    const unknownMeta = resolveRouteMeta('/nonexistent-route-xyz', false, 'https://freestack.example.com', offerBySlug, categoryBySlug);
    assert.equal(unknownMeta.status, 404);
    assert.equal(unknownMeta.robots, 'noindex, follow');

    const template = '<!doctype html><html><head><title>T</title><meta name="description" content="" /><meta property="og:title" content="" /><meta property="og:description" content="" /></head><body></body></html>';
    const rendered = injectHtmlMeta(template, searchMeta);
    assert.ok(rendered.includes('<meta name="robots" content="noindex, follow" />'));
  });

  it('enforces GET-only, pagination cap (<=100), and strict query validation on /api/offers', async () => {
    const postRes = await fetch(`${baseUrl}/api/offers`, { method: 'POST' });
    assert.equal(postRes.status, 405);

    const overLimitRes = await fetch(`${baseUrl}/api/offers?limit=500`);
    assert.equal(overLimitRes.status, 400);

    const pollutedRes = await fetch(`${baseUrl}/api/offers?category=ai-ml&category=mcp`);
    assert.equal(pollutedRes.status, 400);

    const unknownParamRes = await fetch(`${baseUrl}/api/offers?unexpected=1`);
    assert.equal(unknownParamRes.status, 400);

    const validRes = await fetch(`${baseUrl}/api/offers?limit=5&offset=0`);
    assert.equal(validRes.status, 200);
    const body = (await validRes.json()) as { count: number; limit: number; items: unknown[] };
    assert.equal(body.limit, 5);
    assert.equal(body.items.length, 5);
  });

  it('hardens /go/:slug against open redirects, prototype keys, and query pollution', async () => {
    const sampleSlug = SAMPLE_OFFERS[0].identity.slug;

    const validGo = await fetch(`${baseUrl}/go/${sampleSlug}?target=official`, {
      redirect: 'manual',
    });
    assert.equal(validGo.status, 302);
    assert.equal(validGo.headers.get('location'), SAMPLE_OFFERS[0].links.official);
    assert.ok(validGo.headers.get('cache-control')?.includes('no-store'));
    assert.equal(validGo.headers.get('x-robots-tag'), 'noindex, nofollow');

    const protoGo = await fetch(`${baseUrl}/go/constructor`, { redirect: 'manual' });
    assert.equal(protoGo.status, 404);

    const badTargetGo = await fetch(`${baseUrl}/go/${sampleSlug}?target=https://evil.com`, {
      redirect: 'manual',
    });
    assert.equal(badTargetGo.status, 400);

    const extraParamGo = await fetch(`${baseUrl}/go/${sampleSlug}?url=https://evil.com`, {
      redirect: 'manual',
    });
    assert.equal(extraParamGo.status, 400);
  });

  it('protects GET /api/reports with bearer token and validates POST /api/reports + rate limits', async () => {
    const unauthGet = await fetch(`${baseUrl}/api/reports`);
    assert.equal(unauthGet.status, 401);

    const wrongTokenGet = await fetch(`${baseUrl}/api/reports`, {
      headers: { Authorization: 'Bearer wrong_token_value_that_is_long_enough_12345' },
    });
    assert.equal(wrongTokenGet.status, 401);

    const authGet = await fetch(`${baseUrl}/api/reports`, {
      headers: { Authorization: `Bearer ${validAdminToken}` },
    });
    assert.equal(authGet.status, 200);

    // Reject cross-site Sec-Fetch-Site
    const crossSitePost = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Sec-Fetch-Site': 'cross-site',
      },
      body: JSON.stringify({
        offerName: SAMPLE_OFFERS[0].identity.name,
        reportType: 'outdated_limit',
        details: 'Free tier quota changed recently on official pricing page.',
      }),
    });
    assert.equal(crossSitePost.status, 403);

    // Reject honeypot filled
    const honeypotPost = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerName: SAMPLE_OFFERS[0].identity.name,
        reportType: 'outdated_limit',
        details: 'Free tier quota changed recently on official pricing page.',
        website: 'https://spam-bot.example.com',
      }),
    });
    assert.equal(honeypotPost.status, 400);

    // Reject unsafe sourceUrl (shortener or IP literal)
    const unsafeUrlPost = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerName: SAMPLE_OFFERS[0].identity.name,
        reportType: 'outdated_limit',
        details: 'Free tier quota changed recently on official pricing page.',
        sourceUrl: 'https://bit.ly/fake-pricing',
      }),
    });
    assert.equal(unsafeUrlPost.status, 400);

    // Accept valid report (201)
    const validPost = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerSlug: SAMPLE_OFFERS[0].identity.slug,
        offerName: SAMPLE_OFFERS[0].identity.name,
        reportType: 'outdated_limit',
        details: 'Free tier quota updated to 1,500 requests per day on official docs.',
        sourceUrl: SAMPLE_OFFERS[0].links.official,
      }),
    });
    assert.equal(validPost.status, 201);

    // Reject duplicate report (409)
    const duplicatePost = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerSlug: SAMPLE_OFFERS[0].identity.slug,
        offerName: SAMPLE_OFFERS[0].identity.name,
        reportType: 'outdated_limit',
        details: 'Free tier quota updated to 1,500 requests per day on official docs.',
        sourceUrl: SAMPLE_OFFERS[0].links.official,
      }),
    });
    assert.equal(duplicatePost.status, 409);

    // Trigger 429 rate limit on 6th POST within the hour window
    const r5 = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerName: 'New Tool Suggestion',
        reportType: 'new_resource',
        details: 'Another distinct valid report payload to test rate limiter.',
      }),
    });
    assert.equal(r5.status, 429);
  });

  it('handles X-Forwarded-For and Forwarded headers behind Cloud Run proxy without ValidationError', async () => {
    const loggedErrors: string[] = [];
    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args: unknown[]) => {
      loggedErrors.push(args.map(String).join(' '));
    };
    console.warn = (...args: unknown[]) => {
      loggedErrors.push(args.map(String).join(' '));
    };

    try {
      const resXff = await fetch(`${baseUrl}/api/health`, {
        headers: {
          'X-Forwarded-For': '203.0.113.42',
          Forwarded: 'for=203.0.113.42;proto=https',
        },
      });
      assert.equal(resXff.status, 200);

      const resForwardedOnly = await fetch(`${baseUrl}/api/offers?limit=1`, {
        headers: {
          Forwarded: 'for="198.51.100.7:443";proto=https',
        },
      });
      assert.equal(resForwardedOnly.status, 200);

      // Distinct client IP via X-Forwarded-For should have its own POST /api/reports quota
      const resDistinctClientPost = await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '203.0.113.99',
          Forwarded: 'for=203.0.113.99;proto=https',
        },
        body: JSON.stringify({
          offerName: 'Proxy Header Test Tool',
          reportType: 'new_resource',
          details: 'Verifies proxy-forwarded client IPs are tracked independently.',
        }),
      });
      assert.equal(resDistinctClientPost.status, 201);
    } finally {
      console.error = origError;
      console.warn = origWarn;
    }

    const combined = loggedErrors.join('\n');
    assert.ok(!combined.includes('ValidationError'), `Unexpected ValidationError: ${combined}`);
    assert.ok(!combined.includes('ERR_ERL_'), `Unexpected ERR_ERL error: ${combined}`);
  });
});
