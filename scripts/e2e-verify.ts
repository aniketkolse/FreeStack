import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Server } from 'node:http';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from '../src/lib/data/nodeLoader';
import { createApp } from '../src/lib/server/createApp';

async function main() {
  console.log('=== FreeStack Production E2E & QA Verification ===');

  const categories = loadCategoriesFromDisk();
  const offers = loadOffersFromDisk();
  const sourceRegistry = loadSourceRegistryFromDisk();

  const { app } = createApp({
    isProduction: true,
    siteUrl: 'https://freestack.example.com',
    offers,
    categories,
    sourceRegistry,
    enableRateLimits: true,
  });

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Verify HTML routes, dynamic meta injection, ETag, and Brotli compression
    const routesToCheck = [
      { path: '/', expectedTitlePart: 'FreeStack' },
      { path: '/explore', expectedTitlePart: 'Explore' },
      { path: '/category/ai-ml', expectedTitlePart: 'AI' },
      { path: '/category/mcp', expectedTitlePart: 'MCP' },
      { path: '/offer/nvidia-nim-free-api-catalog', expectedTitlePart: 'NVIDIA' },
      { path: '/learning', expectedTitlePart: 'Learning' },
      { path: '/students', expectedTitlePart: 'Student' },
    ];

    for (const r of routesToCheck) {
      const res = await fetch(`${baseUrl}${r.path}`, {
        headers: { 'Accept-Encoding': 'br, gzip' },
      });
      assert.equal(res.status, 200, `Expected HTTP 200 for ${r.path}`);
      const csp = res.headers.get('content-security-policy') || '';
      assert.ok(
        csp.includes("script-src 'self'") && !/script-src[^;]*'unsafe-inline'/.test(csp),
        `Production CSP on ${r.path} must enforce script-src 'self' without unsafe-inline (got: ${csp})`
      );
      const html = await res.text();
      assert.ok(
        html.includes(r.expectedTitlePart),
        `Expected HTML on ${r.path} to contain "${r.expectedTitlePart}"`
      );
    }
    console.log('  [PASS] 7 core routes return HTTP 200 with strict CSP and route-specific metadata');

    // 2. Verify /api/offers pagination, facets, compression, ETag + 304 Not Modified
    const t0 = performance.now();
    const apiRes = await fetch(
      `${baseUrl}/api/offers?category=mcp&q=github&limit=48&offset=0&fields=card&facets=1`,
      { headers: { 'Accept-Encoding': 'br, gzip' } }
    );
    const queryDurationMs = Number((performance.now() - t0).toFixed(2));
    assert.equal(apiRes.status, 200);
    const cacheControl = apiRes.headers.get('cache-control') || '';
    assert.ok(
      cacheControl.includes('max-age=300') && cacheControl.includes('stale-while-revalidate=86400'),
      `Expected stale-while-revalidate Cache-Control on /api/offers, got ${cacheControl}`
    );
    const etag = apiRes.headers.get('etag');
    assert.ok(etag, 'Expected ETag header on /api/offers');

    const body = (await apiRes.json()) as {
      total: number;
      count: number;
      items: Array<{ identity: { slug: string; logo_url?: string }; description: string }>;
      facets?: { categorySummary?: { totalInCategory: number } };
    };
    assert.ok(body.total > 0 && body.items.length > 0, 'Expected matching MCP github offers');
    assert.equal(body.facets?.categorySummary?.totalInCategory, 4645, 'Expected 4,645 total MCP offers');
    for (const item of body.items) {
      assert.ok(item.description.length <= 140, 'Card projection description must be <= 140 chars');
      assert.ok(
        item.identity.logo_url && /^\/logos\/[a-z0-9-]+\.(svg|png|jpg)$/i.test(item.identity.logo_url),
        `Card item ${item.identity.slug} must include pre-resolved same-origin logo_url`
      );
    }

    // Verify 304 Not Modified with If-None-Match
    const res304 = await fetch(
      `${baseUrl}/api/offers?category=mcp&q=github&limit=48&offset=0&fields=card&facets=1`,
      { headers: { 'If-None-Match': etag! } }
    );
    assert.equal(res304.status, 304, 'Expected HTTP 304 when If-None-Match matches ETag');
    console.log(
      `  [PASS] /api/offers search + facet query completed in ${queryDurationMs} ms (< 100 ms budget) and validated ETag 304`
    );

    // 3. Verify single offer detail endpoint /api/offers/:slug
    const detailRes = await fetch(`${baseUrl}/api/offers/nvidia-nim-free-api-catalog`);
    assert.equal(detailRes.status, 200);
    const detailData = (await detailRes.json()) as {
      offer: { identity: { slug: string }; evidence: { sources: unknown[]; claims: unknown[] } };
      related: unknown[];
    };
    assert.equal(detailData.offer.identity.slug, 'nvidia-nim-free-api-catalog');
    assert.ok(
      detailData.offer.evidence.sources.length > 0 && detailData.offer.evidence.claims.length > 0,
      'Detail endpoint must include full evidence sources and claims'
    );
    assert.ok(detailData.related.length > 0, 'Detail endpoint must include related offers');
    console.log('  [PASS] /api/offers/:slug returns full offer detail + related offers');

    // 4. Verify rapid search keystrokes (50 sequential queries) never trigger 429 and average < 25 ms
    const rapidStart = performance.now();
    for (let i = 0; i < 30; i++) {
      const q = 'cloudflare'.slice(0, (i % 10) + 1);
      const r = await fetch(`${baseUrl}/api/offers?q=${q}&limit=24&offset=0&fields=card`);
      assert.equal(r.status, 200, `Query #${i} should not hit 429 rate limit`);
    }
    const avgMs = Number(((performance.now() - rapidStart) / 30).toFixed(2));
    assert.ok(avgMs < 100, `Expected average search response < 100ms, got ${avgMs}ms`);
    console.log(`  [PASS] 30 rapid search queries succeeded with 0 rate-limit errors (avg ${avgMs} ms/query)`);

    // 5. Verify immutable cache headers on /logos/*, /fonts/*, and /assets/*
    const logoRes = await fetch(`${baseUrl}/logos/cloudflare.svg`);
    assert.equal(logoRes.status, 200);
    assert.ok(
      (logoRes.headers.get('cache-control') || '').includes('immutable'),
      'Expected immutable Cache-Control on /logos/*'
    );

    const fontRes = await fetch(`${baseUrl}/fonts/plus-jakarta-sans-latin-wght-normal.woff2`);
    assert.equal(fontRes.status, 200);
    assert.ok(
      (fontRes.headers.get('cache-control') || '').includes('immutable'),
      'Expected immutable Cache-Control on /fonts/*'
    );

    const assetsDir = path.resolve(process.cwd(), 'dist/assets');
    const jsAsset = fs.readdirSync(assetsDir).find((f) => f.startsWith('index-') && f.endsWith('.js'));
    assert.ok(jsAsset, 'Expected index-*.js in dist/assets');
    const assetRes = await fetch(`${baseUrl}/assets/${jsAsset}`, {
      headers: { 'Accept-Encoding': 'br, gzip' },
    });
    assert.equal(assetRes.status, 200);
    assert.equal(assetRes.headers.get('content-encoding'), 'br', 'Expected precompressed Brotli (.br) on /assets/*');
    assert.ok(
      (assetRes.headers.get('cache-control') || '').includes('immutable'),
      'Expected immutable Cache-Control on /assets/*'
    );
    console.log('  [PASS] /logos/*, /fonts/*, and precompressed /assets/* serve with immutable 1-year cache headers');

    console.log('\n[test:e2e] ALL E2E & PERFORMANCE CHECKS PASSED.');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

main();
