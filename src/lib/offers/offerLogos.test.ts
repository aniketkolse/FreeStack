import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadOffersFromDisk } from '../data/nodeLoader';
import {
  resolveOfferBrandLogoSrc,
  resolveOfferLogoSrc,
  resolveOfferRemoteBrandUrl,
} from './offerLogos';

test('every cataloged offer resolves to an existing official logo file in public/logos with zero synthetic placeholders', () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  const offers = loadOffersFromDisk();

  assert.ok(
    offers.length >= 6500,
    `Expected at least 6500 offers including awesome-mcp-servers and public-apis, found ${offers.length}`
  );

  const checkedSvgPaths = new Set<string>();
  let brandOrRemoteMatched = 0;

  for (const offer of offers) {
    const logoSrc = resolveOfferLogoSrc(offer);
    assert.ok(logoSrc, `Missing logo mapping for ${offer.identity.slug}`);
    assert.ok(
      /^\/logos\/[a-z0-9-]+\.(svg|png|jpg)$/.test(logoSrc),
      `Expected official /logos/*.{svg,png,jpg} path for ${offer.identity.slug}, got ${logoSrc}`
    );
    const diskPath = path.join(publicDir, logoSrc.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `Logo file missing on disk: ${diskPath}`);
    assert.ok(fs.statSync(diskPath).size > 100, `Logo file unexpectedly empty: ${diskPath}`);

    const brandSrc = resolveOfferBrandLogoSrc(offer);
    const remoteSrc = resolveOfferRemoteBrandUrl(offer);
    if (brandSrc || remoteSrc) {
      brandOrRemoteMatched++;
    }

    if (
      offer.classification.category === 'ai-ml' ||
      offer.classification.category === 'developer-tools' ||
      offer.classification.category === 'design-creative'
    ) {
      assert.ok(
        brandSrc,
        `Every AI model, Developer Tool, and Frontend & Design Tool offer must resolve to a specific official model or company logo: ${offer.identity.slug}`
      );
    }

    if (diskPath.endsWith('.svg') && !checkedSvgPaths.has(diskPath)) {
      checkedSvgPaths.add(diskPath);
      const rawSvg = fs.readFileSync(diskPath, 'utf8');
      assert.ok(
        !/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/.test(rawSvg),
        `Unescaped XML ampersand found in SVG logo: ${diskPath}`
      );
      assert.ok(
        !rawSvg.includes('<rect width="64" height="64" rx="16"'),
        `Synthetic 64x64 placeholder SVG found instead of official brand vector: ${diskPath}`
      );
    }
  }

  assert.equal(
    brandOrRemoteMatched,
    offers.length,
    'Every offer across all categories should resolve to an official model/company logo or official website/GitHub logo'
  );
});

test('specific AI models and 3rd-party company integrations resolve to their exact model or company logos', () => {
  const offers = loadOffersFromDisk();
  const bySlug = new Map(offers.map((o) => [o.identity.slug, o]));

  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('google-ai-studio-gemini-free')!), '/logos/brand-aistudio.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('gemini-3-8-flash-free')!), '/logos/model-gemini.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('gemma-4-31b-it-multimodal')!), '/logos/model-gemma.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('qwen-3-5-397b-a17b-moe-vision')!), '/logos/brand-qwen.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('alibaba-modelscope-dashscope-qwen3-max')!), '/logos/brand-modelscope.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cohere-command-a-reasoning-111b')!), '/logos/model-commanda.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cohere-aya-expanse-32b-multilingual')!), '/logos/brand-aya.svg'.replace('brand-aya', 'model-aya'));
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cohere-north-mini-code-free')!), '/logos/brand-cohere.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('meta-muse-glimmer-step-3-7-vision')!), '/logos/model-muse.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('meta-llama-4-maverick-scout-multimodal')!), '/logos/brand-meta.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cloudflare-workers-ai-free-neurons')!), '/logos/cloudflare.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cloudflare-pages-workers')!), '/logos/cloudflare.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('baidu-ernie-image-alibaba-z-image')!), '/logos/brand-baidu.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('openai-gpt-oss-120b-20b-free')!), '/logos/brand-openai.svg');

  const publicDir = path.resolve(process.cwd(), 'public');
  const openaiSvg = fs.readFileSync(path.join(publicDir, 'logos/brand-openai.svg'), 'utf8');
  assert.ok(openaiSvg.includes('#000000'), 'OpenAI logo must use official #000000 black');

  const cloudflareSvg = fs.readFileSync(path.join(publicDir, 'logos/cloudflare.svg'), 'utf8');
  assert.ok(
    cloudflareSvg.includes('#F38020') && cloudflareSvg.includes('#FCAD32'),
    'Cloudflare logo must use official two-cloud #F38020 and #FCAD32 colors'
  );
});

test('Developer Tools category contains 106 verified strictly developer-tool offers across 10 subcategories with official brand logos', () => {
  const offers = loadOffersFromDisk();
  const devTools = offers.filter((o) => o.classification.category === 'developer-tools');

  assert.equal(devTools.length, 106, `Expected 106 verified Developer Tools offers, found ${devTools.length}`);

  const subcategories = new Set<string>();
  for (const offer of devTools) {
    assert.equal(
      offer.classification.resource_type,
      'developer_tool',
      `Developer tool ${offer.identity.slug} must have resource_type === 'developer_tool'`
    );
    assert.equal(offer.verification.status, 'verified', `Developer tool ${offer.identity.slug} must be verified`);
    assert.ok(offer.classification.subcategory, `Developer tool ${offer.identity.slug} must have a subcategory`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Developer tool ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Developer Tools subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );
});

test('Frontend & Design Tools category contains 104 verified offers across 8 subcategories with GradientDeck UI, getdesign.md, and Kombai at top by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const designTools = offers.filter((o) => o.classification.category === 'design-creative');

  assert.equal(designTools.length, 104, `Expected 104 verified Frontend & Design Tools offers, found ${designTools.length}`);

  const subcategories = new Set<string>();
  for (const offer of designTools) {
    assert.equal(offer.verification.status, 'verified', `Frontend & Design tool ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Frontend & Design tool ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    8,
    `Expected 8 Frontend & Design Tools subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(designTools, {
    ...DEFAULT_FILTER_STATE,
    category: 'design-creative',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 3).map((o) => o.identity.slug),
    [
      'gradientdeck-ui-design-md',
      'getdesign-md-website-library',
      'kombai-ai-design-engineer',
    ],
    'GradientDeck UI, getdesign.md, and Kombai must appear as the top 3 default offers in Frontend & Design Tools'
  );
});

