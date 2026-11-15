import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCategoriesFromDisk, loadOffersFromDisk } from '../data/nodeLoader';
import { validateCatalog } from '../validation/offerValidator';
import { resolveOfferLogoSrc } from '../offers/offerLogos';
import { getAiContextWindow, getAiModality, parseContextTokens } from './aiModelMetadata';
import { DEFAULT_FILTER_STATE, filterAndSortOffers } from '../filters/filterOffers';

describe('AI Models Catalog, Modality Differentiation, Context Window & Brand Logos', () => {
  const categories = loadCategoriesFromDisk();
  const allOffers = loadOffersFromDisk();
  const aiOffers = allOffers.filter((o) => o.classification.category === 'ai-ml');

  it('validates the entire catalog including all verified AI models with zero schema errors', () => {
    const validation = validateCatalog(allOffers, categories);
    assert.equal(
      validation.valid,
      true,
      `Catalog validation failed:\n${validation.errors.slice(0, 10).join('\n')}`
    );
    assert.ok(aiOffers.length >= 65, `Expected at least 65 AI offers, found ${aiOffers.length}`);
  });

  it('excludes dead or paid-only AI endpoints identified during live verification', () => {
    const bannedPatterns = [/glhf\.chat/i, /oriper\.com/i, /chutes\.ai/i, /cloudcode\.one/i];
    for (const offer of aiOffers) {
      for (const pattern of bannedPatterns) {
        assert.equal(
          pattern.test(offer.links.official) || pattern.test(offer.identity.name),
          false,
          `Found banned/dead endpoint in ${offer.identity.slug}`
        );
      }
    }
  });

  it('resolves every AI model and provider to an existing company/brand logo on disk', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    for (const offer of aiOffers) {
      const logoSrc = resolveOfferLogoSrc(offer);
      assert.ok(logoSrc, `Missing logo for AI offer ${offer.identity.slug}`);
      const fullPath = path.join(publicDir, logoSrc.replace(/^\//, ''));
      assert.ok(fs.existsSync(fullPath), `Logo file missing on disk for ${offer.identity.slug}: ${fullPath}`);
    }
  });

  it('differentiates AI models across all modalities and context window sizes', () => {
    const modalityCounts = new Map<string, number>();
    for (const offer of aiOffers) {
      const mod = getAiModality(offer);
      assert.ok(mod, `Missing modality for ${offer.identity.slug}`);
      modalityCounts.set(mod.id, (modalityCounts.get(mod.id) ?? 0) + 1);

      const ctx = getAiContextWindow(offer);
      assert.ok(ctx && ctx.tokens >= 8000, `Expected valid context window for ${offer.identity.slug}`);
    }

    assert.ok((modalityCounts.get('text') ?? 0) >= 12, 'Should have at least 12 Text & Reasoning models');
    assert.ok((modalityCounts.get('text-image') ?? 0) >= 15, 'Should have at least 15 Text + Image models');
    assert.ok((modalityCounts.get('image') ?? 0) >= 5, 'Should have at least 5 Image Generation models');
    assert.ok((modalityCounts.get('code') ?? 0) >= 8, 'Should have at least 8 Code & Agentic models');
    assert.ok((modalityCounts.get('audio') ?? 0) >= 5, 'Should have at least 5 Audio & Speech models');
    assert.ok((modalityCounts.get('embedding') ?? 0) >= 4, 'Should have at least 4 Embedding models');
  });

  it('parses context windows accurately and sorts AI models from largest context (10M) to smallest', () => {
    assert.deepEqual(parseContextTokens('10M'), { tokens: 10_000_000, label: '10M ctx' });
    assert.deepEqual(parseContextTokens('1M'), { tokens: 1_000_000, label: '1M ctx' });
    assert.deepEqual(parseContextTokens('262K'), { tokens: 262_000, label: '262K ctx' });
    assert.deepEqual(parseContextTokens('128K'), { tokens: 128_000, label: '128K ctx' });

    const sorted = filterAndSortOffers(aiOffers, {
      ...DEFAULT_FILTER_STATE,
      category: 'ai-ml',
      sortBy: 'context_desc',
    });

    assert.equal(sorted[0].identity.slug, 'meta-llama-4-maverick-scout-multimodal');
    const firstTokens = getAiContextWindow(sorted[0])?.tokens ?? 0;
    const lastTokens = getAiContextWindow(sorted[sorted.length - 1])?.tokens ?? 0;
    assert.equal(firstTokens, 10_000_000);
    assert.ok(firstTokens > lastTokens);
  });
});
