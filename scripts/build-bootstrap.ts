import fs from 'node:fs';
import path from 'node:path';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
  loadSourceRegistryFromDisk,
} from '../src/lib/data/nodeLoader';
import { OfferCatalogIndex } from '../src/lib/server/offerCatalogIndex';

const rootDir = process.cwd();
const categories = loadCategoriesFromDisk(rootDir);
const offers = loadOffersFromDisk(rootDir);
const sourceRegistry = loadSourceRegistryFromDisk(rootDir);

const index = new OfferCatalogIndex(offers, categories);

const learningHighlights = index.learningOffersSorted
  .slice(0, 4)
  .map((o) => index.cardBySlug.get(o.identity.slug) ?? o);

const recentlyVerified = [...index.fullOffers]
  .filter((o) => o.verification.status === 'verified' && o.verification.last_verified_at)
  .sort((a, b) =>
    (b.verification.last_verified_at ?? '').localeCompare(a.verification.last_verified_at ?? '')
  )
  .slice(0, 4)
  .map((o) => index.cardBySlug.get(o.identity.slug) ?? o);

const bootstrapPayload = {
  totalOffers: index.fullOffers.length,
  categories,
  categoryCounts: index.categoryCounts,
  pricingCounts: index.pricingCounts,
  learningHighlights,
  recentlyVerified,
  sourceCount: sourceRegistry.sources.length,
};

const outPath = path.join(rootDir, 'src/lib/data/homeBootstrap.json');
fs.writeFileSync(outPath, JSON.stringify(bootstrapPayload), 'utf-8');

const rawBytes = Buffer.byteLength(JSON.stringify(bootstrapPayload));
console.log(
  `[build-bootstrap] Wrote ${outPath} (${(rawBytes / 1024).toFixed(2)} KB raw, ${index.fullOffers.length} total offers indexed)`
);
