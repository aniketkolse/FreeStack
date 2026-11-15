import type {
  ChangeDetectionReport,
  FieldChange,
  Offer,
} from '../../types/resource';

/**
 * Implements Roadmap Sections 10.3, 10.4, and 11.2.E/F:
 * - Compares an existing published resource record with a candidate extraction
 * - Classifies critical changes (pricing_model, free_limits, card_required,
 *   student_access, regions, validity, availability/expiry) as requiring human review
 * - Classifies low-risk metadata updates (description polish, tags, docs URL) as eligible
 * - Ensures fetch timeouts/errors never delete records or falsely mark offers expired
 */
export function detectOfferChanges(
  previous: Offer,
  candidate: Offer
): ChangeDetectionReport {
  const changes: FieldChange[] = [];

  if (previous.classification.pricing_model !== candidate.classification.pricing_model) {
    changes.push({
      field: 'classification.pricing_model',
      previousValue: previous.classification.pricing_model,
      nextValue: candidate.classification.pricing_model,
      severity: 'critical',
      reason: 'Pricing classification changed (Section 10.3 critical policy).',
    });
  }

  if (
    previous.access.requirements.card_required !==
    candidate.access.requirements.card_required
  ) {
    changes.push({
      field: 'access.requirements.card_required',
      previousValue: previous.access.requirements.card_required,
      nextValue: candidate.access.requirements.card_required,
      severity: 'critical',
      reason: 'Payment card requirement changed (Section 10.3 critical policy).',
    });
  }

  if (
    JSON.stringify(previous.access.free_limits) !==
    JSON.stringify(candidate.access.free_limits)
  ) {
    changes.push({
      field: 'access.free_limits',
      previousValue: previous.access.free_limits,
      nextValue: candidate.access.free_limits,
      severity: 'critical',
      reason: 'Free-tier quota limits or usage periods changed (Section 10.3 critical policy).',
    });
  }

  if (
    previous.eligibility.student_access !== candidate.eligibility.student_access ||
    previous.eligibility.conditions !== candidate.eligibility.conditions
  ) {
    changes.push({
      field: 'eligibility',
      previousValue: {
        student_access: previous.eligibility.student_access,
        conditions: previous.eligibility.conditions,
      },
      nextValue: {
        student_access: candidate.eligibility.student_access,
        conditions: candidate.eligibility.conditions,
      },
      severity: 'critical',
      reason: 'Eligibility requirements changed (Section 10.3 critical policy).',
    });
  }

  if (
    JSON.stringify([...previous.eligibility.regions].sort()) !==
    JSON.stringify([...candidate.eligibility.regions].sort())
  ) {
    changes.push({
      field: 'eligibility.regions',
      previousValue: previous.eligibility.regions,
      nextValue: candidate.eligibility.regions,
      severity: 'critical',
      reason: 'Supported regions changed (Section 10.3 critical policy).',
    });
  }

  if (
    previous.access.validity.type !== candidate.access.validity.type ||
    previous.access.validity.duration !== candidate.access.validity.duration ||
    previous.access.validity.auto_renewal !== candidate.access.validity.auto_renewal
  ) {
    changes.push({
      field: 'access.validity',
      previousValue: previous.access.validity,
      nextValue: candidate.access.validity,
      severity: 'critical',
      reason: 'Expiry or renewal policy changed (Section 10.3 critical policy).',
    });
  }

  if (
    previous.verification.status !== candidate.verification.status &&
    (candidate.verification.status === 'expired' ||
      candidate.verification.status === 'unavailable')
  ) {
    changes.push({
      field: 'verification.status',
      previousValue: previous.verification.status,
      nextValue: candidate.verification.status,
      severity: 'critical',
      reason: 'Resource marked expired or unavailable requires human verification.',
    });
  }

  // Low-risk metadata diffs
  if (previous.description !== candidate.description) {
    changes.push({
      field: 'description',
      previousValue: previous.description,
      nextValue: candidate.description,
      severity: 'low_risk',
      reason: 'Editorial description updated.',
    });
  }

  if (
    JSON.stringify([...previous.classification.tags].sort()) !==
    JSON.stringify([...candidate.classification.tags].sort())
  ) {
    changes.push({
      field: 'classification.tags',
      previousValue: previous.classification.tags,
      nextValue: candidate.classification.tags,
      severity: 'low_risk',
      reason: 'Discovery tags updated.',
    });
  }

  if (previous.links.documentation !== candidate.links.documentation) {
    changes.push({
      field: 'links.documentation',
      previousValue: previous.links.documentation,
      nextValue: candidate.links.documentation,
      severity: 'low_risk',
      reason: 'Documentation link updated.',
    });
  }

  const requiresHumanReview = changes.some((c) => c.severity === 'critical');
  const hasChanges = changes.length > 0;

  return {
    offerId: previous.identity.id,
    slug: previous.identity.slug,
    hasChanges,
    requiresHumanReview,
    reviewClassification: !hasChanges
      ? 'no_change'
      : requiresHumanReview
      ? 'human_review_required'
      : 'low_risk_auto_eligible',
    changes,
  };
}

/**
 * Implements Roadmap Section 10.4 Fetch Failure Policy:
 * - A failed fetch or timeout must NEVER delete a published record or mark it expired.
 * - Preserves the last verified data and marks status as needs_review only after
 *   consecutive failures exceed maxRetries.
 */
export function resolveFetchFailureState(
  existingOffer: Offer,
  consecutiveFailures: number,
  maxRetries = 3
): Offer {
  const shouldFlagReview = consecutiveFailures >= maxRetries;
  return {
    ...existingOffer,
    verification: {
      ...existingOffer.verification,
      // Never mark 'expired' or 'unavailable' on a network timeout/fetch error
      status: shouldFlagReview ? 'needs_review' : existingOffer.verification.status,
      notes: shouldFlagReview
        ? `Automated fetch failed after ${consecutiveFailures} bounded attempts; preserving last verified data pending human review.`
        : existingOffer.verification.notes,
    },
  };
}
