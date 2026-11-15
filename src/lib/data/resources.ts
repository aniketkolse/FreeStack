import categoriesData from '../../../data/categories.json';
import sourceRegistryData from '../../../data/sources/registry.json';
import type { Category, CategorySlug, DataQualityReport, Offer, SourceRegistry } from '../../types/resource';
import { generateDataQualityReport, validateCatalog } from '../validation/offerValidator';

const offerModules = import.meta.glob('/data/offers/**/*.json', { eager: true }) as Record<
  string,
  { default?: Offer | Offer[] } | Offer | Offer[]
>;

export const CATEGORIES: Category[] = categoriesData as Category[];
export const SOURCE_REGISTRY: SourceRegistry = sourceRegistryData as SourceRegistry;

export const OFFERS: Offer[] = Object.values(offerModules)
  .flatMap((mod) => {
    const unwrapped = 'default' in mod && mod.default ? mod.default : mod;
    return Array.isArray(unwrapped) ? unwrapped : [unwrapped as Offer];
  })
  .filter((o) => Boolean(o?.identity?.slug))
  .sort((a, b) => a.identity.name.localeCompare(b.identity.name));

export function getCatalogValidation() {
  return validateCatalog(OFFERS, CATEGORIES);
}

export function getDataQualityReport(): DataQualityReport {
  return generateDataQualityReport(OFFERS, CATEGORIES);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getOfferBySlug(slug: string): Offer | undefined {
  return OFFERS.find((o) => o.identity.slug === slug);
}

export function getOffersByCategory(slug: CategorySlug): Offer[] {
  return OFFERS.filter((o) => o.classification.category === slug);
}

export function getFeaturedOffers(): Offer[] {
  return OFFERS.filter((o) => o.metadata.featured);
}

export function getRecentlyVerifiedOffers(limit = 4): Offer[] {
  return [...OFFERS]
    .filter((o) => o.verification.status === 'verified' && o.verification.last_verified_at)
    .sort((a, b) =>
      (b.verification.last_verified_at ?? '').localeCompare(
        a.verification.last_verified_at ?? ''
      )
    )
    .slice(0, limit);
}

export function getRecentlyAddedOffers(limit = 4): Offer[] {
  return [...OFFERS]
    .sort((a, b) => (b.metadata.created_at ?? '').localeCompare(a.metadata.created_at ?? ''))
    .slice(0, limit);
}

export function getLearningOffers(): Offer[] {
  return OFFERS.filter(
    (o) => o.classification.category === 'learning' || Boolean(o.learning)
  );
}

export function getStudentOffers(): Offer[] {
  return OFFERS.filter(
    (o) =>
      o.classification.category === 'student-benefits' ||
      o.eligibility.student_access === 'exclusive'
  );
}

export function getRelatedOffers(offer: Offer, limit = 3): Offer[] {
  return OFFERS.filter(
    (o) =>
      o.identity.id !== offer.identity.id &&
      o.classification.category === offer.classification.category
  ).slice(0, limit);
}

export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    counts[cat.slug] = 0;
  }
  for (const offer of OFFERS) {
    counts[offer.classification.category] =
      (counts[offer.classification.category] ?? 0) + 1;
  }
  return counts;
}
