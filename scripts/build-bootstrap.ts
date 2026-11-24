import fs from 'node:fs';
import path from 'node:path';
import {
  loadCategoriesFromDisk,
  loadOffersFromDisk,
} from '../src/lib/data/nodeLoader';
import { OfferCatalogIndex } from '../src/lib/server/offerCatalogIndex';
import type { Offer } from '../src/types/resource';

function stripUnusedOfferFields(raw: Offer): Offer {
  const cleaned: Record<string, unknown> = {
    schema_version: raw.schema_version,
    identity: raw.identity,
    classification: raw.classification,
    description: raw.description,
    access: {
      free_limits: raw.access.free_limits,
      requirements: raw.access.requirements,
      validity: raw.access.validity,
      restrictions: [],
    },
    eligibility: {
      student_access: raw.eligibility.student_access,
      regions: raw.eligibility.regions,
      conditions: null,
    },
    links: raw.links,
    ...(raw.learning ? { learning: raw.learning } : {}),
    evidence: { sources: [], claims: [] },
    verification: {
      status: raw.verification.status,
      last_verified_at: raw.verification.last_verified_at,
      notes: null,
    },
    metadata: {
      created_at: raw.metadata.created_at,
      updated_at: raw.metadata.updated_at,
      featured: raw.metadata.featured,
    },
  };
  return cleaned as unknown as Offer;
}

const rootDir = process.cwd();
const categories = loadCategoriesFromDisk(rootDir).map((cat) => ({
  slug: cat.slug,
  name: cat.name,
  shortName: cat.shortName,
  description: cat.description,
  color: cat.color,
  popular: cat.popular,
  subcategories: [],
}));
const offers = loadOffersFromDisk(rootDir);

const index = new OfferCatalogIndex(offers, loadCategoriesFromDisk(rootDir));

const learningHighlights = index.learningOffersSorted
  .slice(0, 4)
  .map((o) => stripUnusedOfferFields(index.cardBySlug.get(o.identity.slug) ?? o));

// Editorially curated order for the home "Recently verified" rail. Curated slugs lead the
// list in this order; any remaining slots fall back to the most recently verified offers.
const CURATED_RECENTLY_VERIFIED_SLUGS: string[] = [
  'nvidia-nim-free-api-catalog',
  'supabase-free-plan',
  'figma-starter-plan',
  'aws-free-tier-cloud-credits',
];

const verifiedByRecency = [...index.fullOffers]
  .filter((o) => o.verification.status === 'verified' && o.verification.last_verified_at)
  .sort((a, b) =>
    (b.verification.last_verified_at ?? '').localeCompare(a.verification.last_verified_at ?? '')
  );

const verifiedBySlug = new Map(verifiedByRecency.map((o) => [o.identity.slug, o]));
const curatedRecentlyVerified = CURATED_RECENTLY_VERIFIED_SLUGS.map((slug) =>
  verifiedBySlug.get(slug)
).filter((o): o is Offer => Boolean(o));

const recentlyVerified = [...curatedRecentlyVerified, ...verifiedByRecency]
  .filter((o, i, list) => list.findIndex((x) => x.identity.slug === o.identity.slug) === i)
  .slice(0, 4)
  .map((o) => stripUnusedOfferFields(index.cardBySlug.get(o.identity.slug) ?? o));

const bootstrapPayload = {
  totalOffers: index.fullOffers.length,
  categories,
  categoryCounts: index.categoryCounts,
  learningHighlights,
  recentlyVerified,
};

const outPath = path.join(rootDir, 'src/lib/data/homeBootstrap.json');
fs.writeFileSync(outPath, JSON.stringify(bootstrapPayload), 'utf-8');

const rawBytes = Buffer.byteLength(JSON.stringify(bootstrapPayload));
console.log(
  `[build-bootstrap] Wrote ${outPath} (${(rawBytes / 1024).toFixed(2)} KB raw, ${index.fullOffers.length} total offers indexed)`
);
