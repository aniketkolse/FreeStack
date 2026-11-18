import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadCategoriesFromDisk, loadOffersFromDisk } from '../data/nodeLoader';
import {
  DEFAULT_FILTER_STATE,
  filterAndSortOffers,
  filtersToSearchParams,
  searchParamsToFilters,
} from './filterOffers';
import { CATEGORY_POPULARITY_SEQUENCES } from './popularityRankings';
import { OfferCatalogIndex } from '../server/offerCatalogIndex';
import type { CategorySlug } from '../../types/resource';

const CATEGORIES = loadCategoriesFromDisk();
const OFFERS = loadOffersFromDisk();
const INDEX = new OfferCatalogIndex(OFFERS, CATEGORIES);

describe('filterOffers (Section 9 tri-state & URL sync)', () => {
  it('treats unknown card_required explicitly and never includes it in not_required filter', () => {
    const noCardResults = filterAndSortOffers(OFFERS, {
      ...DEFAULT_FILTER_STATE,
      cardRequired: 'not_required',
    });
    assert.ok(noCardResults.length > 0);
    assert.ok(
      noCardResults.every((o) => o.access.requirements.card_required === 'not_required')
    );
    assert.equal(
      noCardResults.some((o) => o.identity.slug === 'cloudflare-zero-trust-free'),
      false,
      'Unknown card_required offer must NOT match not_required'
    );

    const unknownResults = filterAndSortOffers(OFFERS, {
      ...DEFAULT_FILTER_STATE,
      cardRequired: 'unknown',
    });
    assert.ok(
      unknownResults.some((o) => o.identity.slug === 'cloudflare-zero-trust-free'),
      'Unknown card_required offer must appear under unknown filter'
    );
  });

  it('filters strictly by student_access exclusive', () => {
    const studentOnly = filterAndSortOffers(OFFERS, {
      ...DEFAULT_FILTER_STATE,
      studentAccess: 'exclusive',
    });
    assert.ok(studentOnly.length >= 4);
    assert.ok(studentOnly.every((o) => o.eligibility.student_access === 'exclusive'));
  });

  it('round-trips FilterState through URLSearchParams', () => {
    const original = {
      ...DEFAULT_FILTER_STATE,
      query: 'postgres',
      category: 'databases-backend' as const,
      pricingModels: ['free_tier' as const],
      cardRequired: 'not_required' as const,
      verificationStatus: 'verified' as const,
      sortBy: 'recently_verified' as const,
    };
    const qs = filtersToSearchParams(original);
    const restored = searchParamsToFilters(qs);
    assert.deepEqual(restored, original);
  });
});

describe('popularityRankings across all 11 categories', () => {
  const BOUNDED_CATEGORIES: CategorySlug[] = [
    'ai-ml',
    'design-creative',
    'cloud-hosting',
    'databases-backend',
    'developer-tools',
    'security-networking',
    'productivity-collaboration',
    'learning',
    'student-benefits',
  ];

  it('covers 100% of slugs with zero missing, duplicate, or stale entries in all 9 bounded categories', () => {
    for (const cat of BOUNDED_CATEGORIES) {
      const catSlugs = OFFERS.filter((o) => o.classification.category === cat).map(
        (o) => o.identity.slug
      );
      const seq = CATEGORY_POPULARITY_SEQUENCES[cat];
      const uniqueSeq = new Set(seq);
      const actualSet = new Set(catSlugs);

      assert.equal(uniqueSeq.size, seq.length, `Duplicate slug found in ${cat} sequence`);
      assert.equal(seq.length, actualSet.size, `Count mismatch in ${cat}`);
      for (const slug of catSlugs) {
        assert.ok(uniqueSeq.has(slug), `Missing slug ${slug} from ${cat} sequence`);
      }
    }
  });

  it('has zero stale slugs in mcp and apis-integrations flagship sequences', () => {
    for (const cat of ['mcp', 'apis-integrations'] as const) {
      const actualSet = new Set(
        OFFERS.filter((o) => o.classification.category === cat).map((o) => o.identity.slug)
      );
      for (const slug of CATEGORY_POPULARITY_SEQUENCES[cat]) {
        assert.ok(actualSet.has(slug), `Stale slug ${slug} in ${cat}`);
      }
    }
  });

  it('orders every category strictly from most famous/popular to least popular in both client and server index', () => {
    const famousBeforeNiche: Record<CategorySlug, [string, string]> = {
      'ai-ml': ['nvidia-nim-free-api-catalog', 'thinkingmachines-inkling-2-small'],
      mcp: ['github-mcp-server', 'mcp-gatyh-3dtexel-mcp'],
      'apis-integrations': ['github-rest-graphql-api', '10ml-fragrance-index-shopping-api'],
      'design-creative': ['figma-starter-plan', 'velvetyne-libre-type-foundry'],
      'cloud-hosting': ['aws-free-tier-cloud-credits', 'serv00-free-freebsd-shell-hosting'],
      'databases-backend': ['supabase-free-plan', 'manifest-1-file-yaml-backend'],
      'developer-tools': ['visual-studio-code', 'pinggy-localhost-tunnels'],
      'security-networking': ['cloudflare-zero-trust-free', 'doggo-modern-command-line-dns-client'],
      'productivity-collaboration': ['notion-free-plan', 'espanso-cross-platform-text-expander'],
      learning: ['freecodecamp-curriculum', 'seeing-theory-brown-probability'],
      'student-benefits': ['github-student-developer-pack', 'zyte-scrapy-cloud-student-forever'],
    };

    for (const [cat, [famousSlug, nicheSlug]] of Object.entries(famousBeforeNiche) as Array<
      [CategorySlug, [string, string]]
    >) {
      const clientSorted = filterAndSortOffers(OFFERS, {
        ...DEFAULT_FILTER_STATE,
        category: cat,
        sortBy: 'relevance',
      });
      const serverSorted = INDEX.query({
        category: cat,
        limit: 50,
      }).items;

      assert.deepEqual(
        serverSorted.slice(0, 24).map((o) => o.identity.slug),
        clientSorted.slice(0, 24).map((o) => o.identity.slug),
        `Client/server top-24 popularity mismatch in ${cat}`
      );

      const famousIdx = clientSorted.findIndex((o) => o.identity.slug === famousSlug);
      const nicheIdx = clientSorted.findIndex((o) => o.identity.slug === nicheSlug);
      assert.ok(famousIdx >= 0 && famousIdx < 5, `Expected ${famousSlug} in top 5 of ${cat}, got index ${famousIdx}`);
      if (nicheIdx >= 0) {
        assert.ok(
          famousIdx < nicheIdx,
          `Expected ${famousSlug} (${famousIdx}) before ${nicheSlug} (${nicheIdx}) in ${cat}`
        );
      }
    }
  });
});
