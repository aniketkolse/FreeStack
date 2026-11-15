import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadOffersFromDisk } from '../data/nodeLoader';
import {
  DEFAULT_FILTER_STATE,
  filterAndSortOffers,
  filtersToSearchParams,
  searchParamsToFilters,
} from './filterOffers';

const OFFERS = loadOffersFromDisk();

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
