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
  const sourceRegistry = loadSourceRegistryFromDisk();

  console.log(
    `Loaded ${categories.length} categories, ${offers.length} resource files, and ${sourceRegistry.sources.length} discovery sources.`
  );

  const result = validateCatalog(offers, categories);
  if (!result.valid) {
    console.error('Data validation failed:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const regResult = validateSourceRegistry(sourceRegistry);
  if (!regResult.valid) {
    console.error('Source registry validation failed:');
    for (const err of regResult.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const report = generateDataQualityReport(offers, categories);
  console.log(
    `Quality Report: ${report.verifiedCount}/${report.totalOffers} verified, ${report.noCardCount} no-card, ${report.totalEvidenceClaims} cited claims (${report.highConfidenceClaims} high confidence).`
  );
  console.log(
    'All category registry checks, source registry policies, cross-record uniqueness, and Section 9 constraints passed.'
  );
}

main();
