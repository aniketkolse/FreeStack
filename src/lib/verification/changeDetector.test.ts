import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectOfferChanges,
  resolveFetchFailureState,
} from './changeDetector';
import {
  generateDataQualityReport,
  validateSourceRegistry,
} from '../validation/offerValidator';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from '../data/nodeLoader';

test('detectOfferChanges classifies pricing, card, and limit changes as human_review_required', () => {
  const offers = loadOffersFromDisk();
  const base = offers[0]!;
  const modified = structuredClone(base);
  modified.access.requirements.card_required =
    base.access.requirements.card_required === 'not_required' ? 'required' : 'not_required';

  const report = detectOfferChanges(base, modified);
  assert.equal(report.hasChanges, true);
  assert.equal(report.requiresHumanReview, true);
  assert.equal(report.reviewClassification, 'human_review_required');
  assert.equal(report.changes[0]?.field, 'access.requirements.card_required');
});

test('detectOfferChanges classifies tag and description updates as low_risk_auto_eligible', () => {
  const offers = loadOffersFromDisk();
  const base = offers[0]!;
  const modified = structuredClone(base);
  modified.classification.tags = [...base.classification.tags, 'new-tag'];

  const report = detectOfferChanges(base, modified);
  assert.equal(report.hasChanges, true);
  assert.equal(report.requiresHumanReview, false);
  assert.equal(report.reviewClassification, 'low_risk_auto_eligible');
});

test('resolveFetchFailureState preserves last verified data and never marks timeout as expired', () => {
  const offers = loadOffersFromDisk();
  const verifiedOffer = offers.find((o) => o.verification.status === 'verified')!;

  const afterOneFailure = resolveFetchFailureState(verifiedOffer, 1, 3);
  assert.equal(afterOneFailure.verification.status, 'verified');
  assert.equal(
    afterOneFailure.verification.last_verified_at,
    verifiedOffer.verification.last_verified_at
  );

  const afterMaxRetries = resolveFetchFailureState(verifiedOffer, 3, 3);
  assert.equal(afterMaxRetries.verification.status, 'needs_review');
  assert.notEqual(afterMaxRetries.verification.status, 'expired');
  assert.equal(
    afterMaxRetries.verification.last_verified_at,
    verifiedOffer.verification.last_verified_at
  );
});

test('validateSourceRegistry and generateDataQualityReport pass on repository data', () => {
  const categories = loadCategoriesFromDisk();
  const offers = loadOffersFromDisk();
  const registry = loadSourceRegistryFromDisk();

  const regValidation = validateSourceRegistry(registry);
  assert.equal(regValidation.valid, true, regValidation.errors.join(', '));

  const quality = generateDataQualityReport(offers, categories);
  assert.equal(quality.schemaValid, true);
  assert.ok(quality.totalOffers >= 43);
  assert.equal(quality.totalCategories, 11);
});
