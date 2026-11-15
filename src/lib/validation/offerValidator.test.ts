import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadCategoriesFromDisk, loadOffersFromDisk } from '../data/nodeLoader';
import { validateCatalog, validateOffer, isSafeHttpsUrl } from './offerValidator';
import type { Offer } from '../../types/resource';

const CATEGORIES = loadCategoriesFromDisk();
const OFFERS = loadOffersFromDisk();

describe('offerValidator (Section 9 Contract)', () => {
  it('validates all published JSON offers on disk against categories registry', () => {
    assert.ok(OFFERS.length >= 30, `Expected >= 30 offers, found ${OFFERS.length}`);
    assert.equal(CATEGORIES.length, 11, 'Expected 11 categories');
    const result = validateCatalog(OFFERS, CATEGORIES);
    assert.equal(result.valid, true, `Catalog errors:\n${result.errors.join('\n')}`);
  });

  it('rejects non-HTTPS official or logo URLs', () => {
    assert.equal(isSafeHttpsUrl('https://aistudio.google.com'), true);
    assert.equal(isSafeHttpsUrl('http://insecure.example.com'), false);
    assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);

    const bad: Offer = structuredClone(OFFERS[0]);
    bad.links.official = 'http://insecure.example.com';
    const res = validateOffer(bad, CATEGORIES);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('HTTPS')));
  });

  it('rejects verified offer without evidence sources or claims', () => {
    const ungrounded: Offer = structuredClone(OFFERS[0]);
    ungrounded.verification.status = 'verified';
    ungrounded.evidence.sources = [];
    ungrounded.evidence.claims = [];
    const res = validateOffer(ungrounded, CATEGORIES);
    assert.equal(res.valid, false);
  });

  it('rejects claim referencing nonexistent source_id', () => {
    const brokenRef: Offer = structuredClone(OFFERS[0]);
    brokenRef.evidence.claims[0].source_id = 'does-not-exist';
    const res = validateOffer(brokenRef, CATEGORIES);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('missing source_id')));
  });

  it('rejects free_trial without trial_period validity', () => {
    const fakeTrial: Offer = structuredClone(OFFERS[0]);
    fakeTrial.classification.pricing_model = 'free_trial';
    fakeTrial.access.validity.type = 'ongoing';
    const res = validateOffer(fakeTrial, CATEGORIES);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('trial_period')));
  });

  it('rejects student_exclusive when student_access is not exclusive', () => {
    const badStudent: Offer = structuredClone(OFFERS[0]);
    badStudent.classification.pricing_model = 'student_exclusive';
    badStudent.eligibility.student_access = 'eligible';
    const res = validateOffer(badStudent, CATEGORIES);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('student_access')));
  });

  it('rejects updated_at preceding created_at', () => {
    const badDates: Offer = structuredClone(OFFERS[0]);
    badDates.metadata.created_at = '2026-11-10';
    badDates.metadata.updated_at = '2026-10-01';
    const res = validateOffer(badDates, CATEGORIES);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('precedes created_at')));
  });

  it('rejects duplicate ids across catalog', () => {
    const dup: Offer = structuredClone(OFFERS[0]);
    const res = validateCatalog([OFFERS[0], dup], CATEGORIES);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('Duplicate offer identity.id')));
  });
});
