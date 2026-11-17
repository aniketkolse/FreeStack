import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from '../src/lib/data/nodeLoader';
import {
  generateDataQualityReport,
  validateCatalog,
  validateSourceRegistry,
} from '../src/lib/validation/offerValidator';

function main() {
  const categories = loadCategoriesFromDisk();
  const offers = loadOffersFromDisk();
  const registry = loadSourceRegistryFromDisk();

  console.log(
    `Loaded ${categories.length} categories, ${offers.length} resource files, and ${registry.sources.length} discovery sources.`
  );

  const catalogResult = validateCatalog(offers, categories);
  const registryResult = validateSourceRegistry(registry);

  // Check for stale verification dates (> 180 days) as an informational quality warning
  const staleCutoffMs = Date.now() - 180 * 24 * 60 * 60 * 1000;
  let staleCount = 0;
  for (const offer of offers) {
    if (offer.verification.last_verified_at) {
      const ts = Date.parse(`${offer.verification.last_verified_at}T00:00:00Z`);
      if (!Number.isNaN(ts) && ts < staleCutoffMs) {
        staleCount += 1;
      }
    }
  }

  const allErrors = [...catalogResult.errors, ...registryResult.errors];

  if (allErrors.length > 0) {
    console.error(`Validation failed with ${allErrors.length} error(s):`);
    for (const err of allErrors.slice(0, 50)) {
      console.error(`  - ${err}`);
    }
    if (allErrors.length > 50) {
      console.error(`  ... and ${allErrors.length - 50} more error(s).`);
    }
    process.exit(1);
  }

  const report = generateDataQualityReport(offers, categories);
  console.log(
    `Quality Report: ${report.verifiedCount}/${report.totalOffers} verified (${report.unverifiedCount} unverified, ${report.needsReviewCount} needs_review, ${staleCount} older than 180d), ${report.noCardCount} no-card, ${report.totalEvidenceClaims} cited claims (${report.highConfidenceClaims} high confidence).`
  );
  console.log(
    'All category registry checks, source registry policies, strict URL/text security checks, cross-record uniqueness, and Section 9 constraints passed.'
  );
}

main();
