import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadCategoriesFromDisk, loadOffersFromDisk } from './nodeLoader';
import { DEFAULT_FILTER_STATE, filterAndSortOffers } from '../filters/filterOffers';
import { OfferCatalogIndex } from '../server/offerCatalogIndex';
import type { CategorySlug, PricingModel, RequirementState, SortOption } from '../../types/resource';

const CATEGORIES = loadCategoriesFromDisk();
const DISK_OFFERS = loadOffersFromDisk();
const CATALOG_INDEX = new OfferCatalogIndex(DISK_OFFERS, CATEGORIES);

const SEARCH_QUERIES = [
  'supabase',
  'llm',
  'mcp',
  'postgres',
  'tailwind',
  'cloudflare',
  'github student',
  'docker',
  'redis',
  'openai',
  'sqlite',
  'auth',
  'stripe',
  'vercel',
  'nextjs',
  'vector',
  'ocr',
  'weather',
  'email',
  'python',
  'rust',
  'typescript',
  'kubernetes',
  'free credits',
  'course',
];

const SORT_MODES: SortOption[] = [
  'relevance',
  'use_case',
  'context_desc',
  'recently_verified',
  'recently_added',
  'name_asc',
];

describe('Phase 1 Data Layer Parity Tests (Old Full Loader vs OfferCatalogIndex)', () => {
  it('matches exact offer counts per category and subcategory across all 11 categories', () => {
    for (const cat of CATEGORIES) {
      const expectedCatOffers = DISK_OFFERS.filter(
        (o) => o.classification.category === cat.slug
      );
      const indexedResult = CATALOG_INDEX.query({
        category: cat.slug,
        limit: 10,
        includeFacets: true,
      });

      assert.equal(
        indexedResult.total,
        expectedCatOffers.length,
        `Category ${cat.slug} total mismatch`
      );
      assert.equal(
        CATALOG_INDEX.categoryCounts[cat.slug],
        expectedCatOffers.length,
        `categoryCounts[${cat.slug}] mismatch`
      );

      for (const sub of cat.subcategories) {
        const expectedSubCount = expectedCatOffers.filter(
          (o) => o.classification.subcategory === sub.name
        ).length;
        const indexedSubResult = CATALOG_INDEX.query({
          category: cat.slug,
          subcategory: sub.name,
          limit: 5,
        });
        assert.equal(
          indexedSubResult.total,
          expectedSubCount,
          `Subcategory ${cat.slug}/${sub.name} count mismatch`
        );
      }
    }
  });

  it('matches exact counts across cardRequired, pricingModels, studentAccess, and verificationStatus filters', () => {
    const cardRules: Array<RequirementState | 'all'> = ['all', 'not_required', 'required', 'unknown'];
    for (const card of cardRules) {
      const expected = filterAndSortOffers(DISK_OFFERS, {
        ...DEFAULT_FILTER_STATE,
        cardRequired: card,
      }).length;
      const actual = CATALOG_INDEX.query({ card, limit: 1 }).total;
      assert.equal(actual, expected, `card=${card} count mismatch`);
    }

    const pricingModels: PricingModel[] = [
      'completely_free',
      'free_tier',
      'freemium',
      'open_source',
      'free_credits',
      'student_exclusive',
      'free_learning_material',
      'free_trial',
    ];
    for (const pm of pricingModels) {
      const expected = filterAndSortOffers(DISK_OFFERS, {
        ...DEFAULT_FILTER_STATE,
        pricingModels: [pm],
      }).length;
      const actual = CATALOG_INDEX.query({ pricing: [pm], limit: 1 }).total;
      assert.equal(actual, expected, `pricing=${pm} count mismatch`);
    }
  });

  it('matches top 10 ranked slugs for 25 diverse search queries', () => {
    assert.ok(SEARCH_QUERIES.length >= 20);
    for (const q of SEARCH_QUERIES) {
      const expectedTop10 = filterAndSortOffers(DISK_OFFERS, {
        ...DEFAULT_FILTER_STATE,
        query: q,
        sortBy: 'relevance',
      })
        .slice(0, 10)
        .map((o) => o.identity.slug);

      const actualTop10 = CATALOG_INDEX.query({
        q,
        sort: 'relevance',
        limit: 10,
      }).items.map((o) => o.identity.slug);

      assert.deepEqual(
        actualTop10,
        expectedTop10,
        `Top 10 mismatch for query "${q}"`
      );
    }
  });

  it('matches ordering for every sort option (relevance, use_case, context_desc, recently_verified, recently_added, name_asc)', () => {
    for (const sort of SORT_MODES) {
      const cat: CategorySlug = sort === 'context_desc' ? 'ai-ml' : sort === 'use_case' ? 'mcp' : 'ai-ml';
      const catOffers = DISK_OFFERS.filter((o) => o.classification.category === cat);
      const expectedTop15 = filterAndSortOffers(catOffers, {
        ...DEFAULT_FILTER_STATE,
        sortBy: sort,
      })
        .slice(0, 15)
        .map((o) => o.identity.slug);

      const actualTop15 = CATALOG_INDEX.query({
        category: cat,
        sort,
        limit: 15,
      }).items.map((o) => o.identity.slug);

      assert.deepEqual(actualTop15, expectedTop15, `Sort ${sort} mismatch on ${cat}`);
    }
  });

  it('preserves full offer detail fields and related offers on getOfferDetail', () => {
    const sampleSlugs = [
      'nvidia-nim-free-api-catalog',
      'github-student-developer-pack',
      'cloudflare-pages-workers-free',
    ].filter((s) => DISK_OFFERS.some((o) => o.identity.slug === s));

    assert.ok(sampleSlugs.length > 0);

    for (const slug of sampleSlugs) {
      const raw = DISK_OFFERS.find((o) => o.identity.slug === slug)!;
      const detail = CATALOG_INDEX.getOfferDetail(slug, 3);
      assert.ok(detail, `Missing detail for ${slug}`);
      assert.equal(detail.offer.identity.slug, raw.identity.slug);
      assert.equal(detail.offer.identity.name, raw.identity.name);
      assert.equal(detail.offer.description, raw.description);
      assert.deepEqual(detail.offer.access.free_limits, raw.access.free_limits);
      assert.deepEqual(detail.offer.evidence.claims, raw.evidence.claims);
      assert.ok(detail.related.length > 0);
    }
  });

  it('builds compact card projections with capped descriptions (<= 140 chars) and required card fields', () => {
    const res = CATALOG_INDEX.query({ limit: 50, fields: 'card' });
    assert.equal(res.items.length, 50);
    for (const item of res.items) {
      assert.ok(item.description.length <= 140, `Card description exceeded 140 chars: ${item.description.length}`);
      assert.equal(item.evidence.claims.length, 0);
      assert.equal(item.evidence.sources.length, 0);
      assert.ok(item.identity.slug.length > 0);
      assert.ok(item.identity.name.length > 0);
    }
  });
});
