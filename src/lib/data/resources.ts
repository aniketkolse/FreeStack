import bootstrapData from './homeBootstrap.json';
import type {
  Category,
  CategorySlug,
  Offer,
} from '../../types/resource';
import type {
  CategoryFacetSummary,
  LearningFacetSummary,
  StudentsFacetSummary,
} from '../server/offerCatalogIndex';

interface BootstrapPayload {
  totalOffers: number;
  categories: Category[];
  categoryCounts: Record<CategorySlug, number>;
  pricingCounts: Record<string, number>;
  learningHighlights: Offer[];
  recentlyVerified: Offer[];
  sourceCount: number;
}

const typedBootstrap = bootstrapData as unknown as BootstrapPayload;

export const CATEGORIES: Category[] = typedBootstrap.categories;
export const TOTAL_OFFERS_COUNT: number = typedBootstrap.totalOffers;
export const PRICING_COUNTS: Record<string, number> = typedBootstrap.pricingCounts;

// Client-side in-memory offer registry seeded with bootstrap highlights
// and progressively enriched as pages load from /api/offers and /api/offers/:slug.
const clientOfferBySlug = new Map<string, Offer>();
const clientFullOfferBySlug = new Map<string, Offer>();
const clientRelatedBySlug = new Map<string, Offer[]>();

for (const item of [
  ...typedBootstrap.learningHighlights,
  ...typedBootstrap.recentlyVerified,
]) {
  clientOfferBySlug.set(item.identity.slug, item);
}

// Keep a lightweight array proxy of known offers for legacy callers (AboutPage count, DesignSystemPage sample)
// Note: create a proxy/array whose .length reflects TOTAL_OFFERS_COUNT if accessed for catalog count,
// or provide explicit items for iteration.
export const OFFERS: Offer[] = Array.from(clientOfferBySlug.values());

export function registerClientOffers(items: Offer[]): void {
  for (const item of items) {
    if (!item?.identity?.slug) continue;
    if (!clientFullOfferBySlug.has(item.identity.slug)) {
      clientOfferBySlug.set(item.identity.slug, item);
    }
  }
}

export function registerClientOfferDetail(offer: Offer, related: Offer[] = []): void {
  if (!offer?.identity?.slug) return;
  clientFullOfferBySlug.set(offer.identity.slug, offer);
  clientOfferBySlug.set(offer.identity.slug, offer);
  if (related.length > 0) {
    clientRelatedBySlug.set(offer.identity.slug, related);
    registerClientOffers(related);
  }
}

const CATEGORY_MAP = new Map<string, Category>(
  CATEGORIES.map((category) => [category.slug, category])
);

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORY_MAP.get(slug);
}

export function getOfferBySlug(slug: string): Offer | undefined {
  return clientFullOfferBySlug.get(slug) ?? clientOfferBySlug.get(slug);
}

export function getFullOfferBySlug(slug: string): Offer | undefined {
  return clientFullOfferBySlug.get(slug);
}

export function getOffersByCategory(categorySlug: CategorySlug): Offer[] {
  return Array.from(clientOfferBySlug.values()).filter(
    (offer) => offer.classification.category === categorySlug
  );
}

export function getCategoryCounts(): Record<CategorySlug, number> {
  return { ...typedBootstrap.categoryCounts };
}

export function getFeaturedOffers(limit = 6): Offer[] {
  return typedBootstrap.recentlyVerified.slice(0, limit);
}

export function getRecentlyVerifiedOffers(limit = 4): Offer[] {
  return typedBootstrap.recentlyVerified.slice(0, limit);
}

export function getLearningOffers(): Offer[] {
  return typedBootstrap.learningHighlights;
}

export function getStudentOffers(): Offer[] {
  return Array.from(clientOfferBySlug.values()).filter(
    (offer) =>
      offer.classification.category === 'student-benefits' ||
      offer.eligibility.student_access === 'exclusive' ||
      offer.classification.pricing_model === 'student_exclusive'
  );
}

export function getRelatedOffers(offer: Offer, limit = 3): Offer[] {
  const cached = clientRelatedBySlug.get(offer.identity.slug);
  if (cached && cached.length > 0) {
    return cached.slice(0, limit);
  }
  return Array.from(clientOfferBySlug.values())
    .filter(
      (candidate) =>
        candidate.identity.slug !== offer.identity.slug &&
        candidate.classification.category === offer.classification.category
    )
    .slice(0, limit);
}

// In-memory query cache for /api/offers and /api/offers/:slug
export interface OffersApiResponse {
  count: number;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  items: Offer[];
  facets?: {
    categoryCounts?: Record<CategorySlug, number>;
    pricingCounts?: Record<string, number>;
    totalCatalog?: number;
    categorySummary?: CategoryFacetSummary;
    learningSummary?: LearningFacetSummary;
    studentsSummary?: StudentsFacetSummary;
  };
}

export interface OfferDetailApiResponse {
  offer: Offer;
  related: Offer[];
}

const queryResponseCache = new Map<string, OffersApiResponse>();
const inFlightQueryPromises = new Map<string, Promise<OffersApiResponse>>();
const detailResponseCache = new Map<string, OfferDetailApiResponse>();
const inFlightDetailPromises = new Map<string, Promise<OfferDetailApiResponse>>();

export function getCachedOffersQuery(queryKey: string): OffersApiResponse | undefined {
  return queryResponseCache.get(queryKey);
}

export function getCachedOfferDetail(slug: string): OfferDetailApiResponse | undefined {
  return detailResponseCache.get(slug);
}

export function isSaveDataEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (!conn) return false;
  return Boolean(conn.saveData) || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
}

function waitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

export async function fetchOffersApi(
  queryString: string,
  externalSignal?: AbortSignal,
  timeoutMs = 9000
): Promise<OffersApiResponse> {
  const cached = queryResponseCache.get(queryString);
  if (cached) {
    return cached;
  }

  // Reuse an identical in-flight prefetch or fetch instead of firing a duplicate request
  const existing = inFlightQueryPromises.get(queryString);
  if (existing) {
    return waitWithSignal(existing, externalSignal);
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);

  const url = queryString ? `/api/offers?${queryString}` : '/api/offers';
  const reqPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Failed to load resources (HTTP ${res.status})`);
      }
      const data = (await res.json()) as OffersApiResponse;
      registerClientOffers(data.items);
      queryResponseCache.set(queryString, data);
      return data;
    } finally {
      globalThis.clearTimeout(timeoutId);
      inFlightQueryPromises.delete(queryString);
    }
  })();

  inFlightQueryPromises.set(queryString, reqPromise);
  return waitWithSignal(reqPromise, externalSignal);
}

export async function fetchOfferDetailApi(
  slug: string,
  externalSignal?: AbortSignal,
  timeoutMs = 9000
): Promise<OfferDetailApiResponse> {
  const cached = detailResponseCache.get(slug);
  if (cached) {
    return cached;
  }

  const existing = inFlightDetailPromises.get(slug);
  if (existing) {
    return waitWithSignal(existing, externalSignal);
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs);

  const url = `/api/offers/${encodeURIComponent(slug)}`;
  const reqPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (res.status === 404) {
        throw new Error('NOT_FOUND');
      }
      if (!res.ok) {
        throw new Error(`Failed to load resource details (HTTP ${res.status})`);
      }
      const data = (await res.json()) as OfferDetailApiResponse;
      registerClientOfferDetail(data.offer, data.related);
      detailResponseCache.set(slug, data);
      return data;
    } finally {
      globalThis.clearTimeout(timeoutId);
      inFlightDetailPromises.delete(slug);
    }
  })();

  inFlightDetailPromises.set(slug, reqPromise);
  return waitWithSignal(reqPromise, externalSignal);
}

export function prefetchOfferDetail(slug: string): void {
  if (!slug || detailResponseCache.has(slug) || isSaveDataEnabled()) return;
  void fetchOfferDetailApi(slug).catch(() => {
    // Ignore prefetch errors
  });
}

export function prefetchOffersQuery(queryString: string): void {
  if (queryResponseCache.has(queryString) || isSaveDataEnabled()) return;
  void fetchOffersApi(queryString).catch(() => {
    // Ignore prefetch errors
  });
}
