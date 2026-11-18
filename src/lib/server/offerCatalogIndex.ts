import type {
  Category,
  CategorySlug,
  FilterState,
  LearningDifficulty,
  LearningFormat,
  Offer,
  PricingModel,
  RequirementState,
  ResourceType,
  SortOption,
  StudentAccessState,
  VerificationStatus,
} from '../../types/resource.ts';
import { DEFAULT_FILTER_STATE, filterAndSortOffers } from '../filters/filterOffers.ts';
import { compareOffersByPopularity } from '../filters/popularityRankings.ts';
import {
  getPopulatedPrimaryTypes,
  getTagSubtypesForOffers,
  hasMacroTypeGroups,
  type PopulatedPrimaryTypeGroup,
} from '../filters/categoryGroups.ts';
import {
  AI_CONTEXT_FILTER_OPTIONS,
  getAiContextWindow,
  getAiModality,
  type AiModalityId,
} from '../ai/aiModelMetadata.ts';
import { resolveOfferLogoSrc } from '../offers/offerLogos.ts';

function resolveOfferLogoUrl(offer: Offer): string | null {
  return resolveOfferLogoSrc(offer);
}

export interface CardProjectionMeta {
  slug: string;
  name: string;
  description: string;
  category: CategorySlug;
  subcategory: string;
  pricing_model: PricingModel;
  card_required: RequirementState;
  student_access: StudentAccessState;
  verification_status: VerificationStatus;
  popularity_rank: number;
  logo_key: string | null;
}

export interface CategoryFacetSummary {
  totalInCategory: number;
  primaryTypeGroups: PopulatedPrimaryTypeGroup[];
  allPopulatedSubcategories: Array<{ slug: string; name: string; count: number }>;
  standardCategoryTagSubtypes: Array<{ tag: string; label: string; count: number }>;
  categoryPricingOptions: Array<{ model: PricingModel; count: number }>;
  mcpFilterCounts: {
    officialCount: number;
    scopes: Record<string, number>;
    langs: Record<string, number>;
    os: Record<string, number>;
  };
  studentVerificationCounts: {
    exclusive: number;
    eligible: number;
    total: number;
  };
  categorySuggestions: string[];
  sampleNames: string;
}

export interface LearningFacetSummary {
  totalLearning: number;
  availableFormats: LearningFormat[];
  availableTopics: string[];
  availableLanguages: string[];
  availablePricing: PricingModel[];
}

export interface StudentsFacetSummary {
  totalStudentOffers: number;
  studentIdRequiredCount: number;
  noStudentIdCount: number;
  generalStudentEligible: Offer[];
}

export interface OfferQueryOptions {
  q?: string;
  category?: CategorySlug | 'all';
  type?: string;
  typeGroup?: string;
  resourceType?: ResourceType | 'all';
  subcategory?: string;
  subtype?: string;
  card?: RequirementState | 'all';
  pricing?: PricingModel[];
  student?: StudentAccessState | 'all' | '1';
  verify?: 'all' | 'exclusive' | 'eligible' | 'required' | 'not_required';
  status?: VerificationStatus | 'all';
  region?: string;
  official?: boolean;
  scope?: string;
  lang?: string;
  os?: string;
  modality?: AiModalityId | 'all';
  ctx?: string;
  format?: LearningFormat | 'all';
  difficulty?: LearningDifficulty | 'all';
  topic?: string;
  language?: string;
  learningOnly?: boolean;
  slugs?: string[];
  sort?: SortOption;
  limit?: number;
  offset?: number;
  fields?: 'card' | 'full';
  includeFacets?: boolean;
}

export interface OfferQueryResult {
  count: number;
  total: number;
  limit: number;
  offset: number;
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

const MCP_SCOPE_TAGS = ['local', 'cloud', 'embedded'] as const;
const MCP_LANG_TAGS = [
  'typescript',
  'python',
  'go',
  'rust',
  'java',
  'csharp',
  'cpp',
  'ruby',
] as const;
const MCP_OS_TAGS = ['macos', 'windows', 'linux'] as const;

const LEARNING_FORMAT_ORDER: LearningFormat[] = [
  'course',
  'book',
  'documentation',
  'tutorial',
  'roadmap',
  'video',
  'practice',
  'challenge',
  'other',
];

const RELEVANT_CARD_TAG_PREFIXES = ['modality:', 'ctx:'];
const RELEVANT_CARD_TAGS = new Set([
  'official-implementation',
  'Student ID / .edu Required',
  'No Student ID Required',
]);

export function truncateCardDescription(desc: string, maxChars = 140): string {
  if (!desc || desc.length <= maxChars) return desc;
  return `${desc.slice(0, maxChars - 1).trimEnd()}…`;
}

/**
 * Projects a full Offer into a compact card Offer (~350-450 bytes vs ~2.4 KB)
 * while preserving the exact Offer interface expected by ResourceCard and LearningCard.
 */
export function toCardOffer(offer: Offer, popularityRank = 0): Offer & { _card?: CardProjectionMeta } {
  const resolvedLogo = resolveOfferLogoUrl(offer);
  const cappedDescription = truncateCardDescription(offer.description, 140);

  // Keep primary limit + AI rate limit if applicable
  const keptLimits = offer.access.free_limits.slice(0, 1);
  if (offer.classification.category === 'ai-ml' && offer.access.free_limits.length > 1) {
    const rateLimit = offer.access.free_limits.find((l) =>
      /rate\s*limit|requests|quota|neurons|local/i.test(l.name)
    );
    if (rateLimit && rateLimit !== keptLimits[0]) {
      keptLimits.push(rateLimit);
    }
  }

  const keptTags = offer.classification.tags.filter(
    (tag) =>
      RELEVANT_CARD_TAGS.has(tag) ||
      RELEVANT_CARD_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix))
  );

  return {
    schema_version: offer.schema_version,
    identity: {
      id: offer.identity.id,
      name: offer.identity.name,
      slug: offer.identity.slug,
      provider: offer.identity.provider,
      logo_url: resolvedLogo,
    },
    classification: {
      category: offer.classification.category,
      subcategory: offer.classification.subcategory,
      resource_type: offer.classification.resource_type,
      pricing_model: offer.classification.pricing_model,
      tags: keptTags,
    },
    description: cappedDescription,
    access: {
      free_limits: keptLimits,
      requirements: {
        account_required: offer.access.requirements.account_required,
        card_required: offer.access.requirements.card_required,
        payment_method_notes: null,
      },
      validity: {
        type: offer.access.validity.type,
        duration: offer.access.validity.duration,
        auto_renewal: null,
      },
      restrictions: [],
    },
    eligibility: {
      student_access: offer.eligibility.student_access,
      regions: offer.eligibility.regions.slice(0, 2),
      conditions: null,
    },
    links: {
      official: offer.links.official,
    },
    ...(offer.learning
      ? {
          learning: {
            format: offer.learning.format,
            difficulty: offer.learning.difficulty,
            topics: offer.learning.topics.slice(0, 4),
            language: offer.learning.language,
          },
        }
      : {}),
    evidence: {
      sources: [],
      claims: [],
    },
    verification: {
      status: offer.verification.status,
      last_verified_at: offer.verification.last_verified_at,
      notes: null,
    },
    metadata: {
      created_at: offer.metadata.created_at,
      updated_at: offer.metadata.updated_at,
      featured: offer.metadata.featured,
    },
    _card: {
      slug: offer.identity.slug,
      name: offer.identity.name,
      description: cappedDescription,
      category: offer.classification.category,
      subcategory: offer.classification.subcategory,
      pricing_model: offer.classification.pricing_model,
      card_required: offer.access.requirements.card_required,
      student_access: offer.eligibility.student_access,
      verification_status: offer.verification.status,
      popularity_rank: popularityRank,
      logo_key: resolvedLogo,
    },
  };
}

export class OfferCatalogIndex {
  public readonly fullOffers: Offer[];
  public readonly categories: Category[];
  public readonly fullBySlug: Map<string, Offer>;
  public readonly cardBySlug: Map<string, Offer>;
  public readonly categoryBySlug: Map<CategorySlug, Category>;
  public readonly offersByCategory: Map<CategorySlug, Offer[]>;
  public readonly categoryCounts: Record<CategorySlug, number>;
  public readonly pricingCounts: Record<string, number>;
  public readonly learningOffersSorted: Offer[];
  public readonly studentOffersSorted: Offer[];
  public readonly generalStudentEligibleCards: Offer[];
  private readonly baseCategorySummaries: Map<CategorySlug, CategoryFacetSummary>;
  public readonly learningFacetSummary: LearningFacetSummary;
  public readonly studentsFacetSummary: StudentsFacetSummary;

  constructor(offers: Offer[], categories: Category[]) {
    this.categories = categories;
    this.categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

    // Ensure logo_url is resolved on full offers too so client never needs offerLogos.ts map
    this.fullOffers = offers.map((offer) => {
      const resolvedLogo = resolveOfferLogoUrl(offer);
      if (resolvedLogo && offer.identity.logo_url !== resolvedLogo) {
        return {
          ...offer,
          identity: {
            ...offer.identity,
            logo_url: resolvedLogo,
          },
        };
      }
      return offer;
    });

    // Rank offers by relevance once at startup to assign popularity_rank
    const relevanceRanked = filterAndSortOffers(this.fullOffers, {
      ...DEFAULT_FILTER_STATE,
      sortBy: 'relevance',
    });
    const rankBySlug = new Map<string, number>();
    relevanceRanked.forEach((o, idx) => {
      rankBySlug.set(o.identity.slug, idx + 1);
    });

    this.fullBySlug = new Map();
    this.cardBySlug = new Map();
    this.offersByCategory = new Map();
    for (const cat of categories) {
      this.offersByCategory.set(cat.slug, []);
    }

    const catCounts = {} as Record<CategorySlug, number>;
    for (const cat of categories) {
      catCounts[cat.slug] = 0;
    }
    const prCounts: Record<string, number> = {};

    for (const offer of this.fullOffers) {
      const slug = offer.identity.slug;
      this.fullBySlug.set(slug, offer);
      const rank = rankBySlug.get(slug) ?? this.fullOffers.length;
      this.cardBySlug.set(slug, toCardOffer(offer, rank));

      const catSlug = offer.classification.category;
      catCounts[catSlug] = (catCounts[catSlug] ?? 0) + 1;
      const catList = this.offersByCategory.get(catSlug);
      if (catList) {
        catList.push(offer);
      }

      const pm = offer.classification.pricing_model;
      prCounts[pm] = (prCounts[pm] ?? 0) + 1;
    }

    this.categoryCounts = catCounts;
    this.pricingCounts = prCounts;

    // Sort every category bucket from Most Famous/Popular -> Least Popular
    // so category summaries and related-offer lookups respect popularity too.
    for (const catList of this.offersByCategory.values()) {
      catList.sort(compareOffersByPopularity);
    }

    // Precompute category facet summaries
    this.baseCategorySummaries = new Map();
    for (const cat of categories) {
      const catOffers = this.offersByCategory.get(cat.slug) ?? [];
      this.baseCategorySummaries.set(cat.slug, this.buildCategorySummary(cat, catOffers, 'all'));
    }

    // Precompute Learning Hub base list & facets
    const rawLearning = this.fullOffers.filter(
      (o) => Boolean(o.learning) && o.classification.category === 'learning'
    );
    this.learningOffersSorted = filterAndSortOffers(rawLearning, {
      ...DEFAULT_FILTER_STATE,
      category: 'learning',
      sortBy: 'relevance',
    });

    const availableFormats = LEARNING_FORMAT_ORDER.filter((fmt) =>
      this.learningOffersSorted.some((o) => o.learning?.format === fmt)
    );
    const topicSet = new Set<string>();
    const langSet = new Set<string>();
    const pricingSet = new Set<PricingModel>();
    for (const item of this.learningOffersSorted) {
      for (const t of item.learning?.topics ?? []) topicSet.add(t);
      if (item.learning?.language) langSet.add(item.learning.language);
      pricingSet.add(item.classification.pricing_model);
    }
    this.learningFacetSummary = {
      totalLearning: this.learningOffersSorted.length,
      availableFormats,
      availableTopics: Array.from(topicSet).sort(),
      availableLanguages: Array.from(langSet).sort(),
      availablePricing: Array.from(pricingSet),
    };

    // Precompute Students Hub base list & facets
    const rawStudents = this.fullOffers.filter(
      (o) =>
        o.classification.category === 'student-benefits' ||
        o.eligibility.student_access === 'exclusive' ||
        o.classification.pricing_model === 'student_exclusive'
    );
    this.studentOffersSorted = filterAndSortOffers(rawStudents, {
      ...DEFAULT_FILTER_STATE,
      category: 'student-benefits',
      sortBy: 'relevance',
    });

    const studentIdRequiredCount = this.studentOffersSorted.filter(
      (o) =>
        o.eligibility.student_access === 'exclusive' ||
        o.classification.tags.includes('Student ID / .edu Required')
    ).length;

    const noStudentIdCount = this.studentOffersSorted.filter(
      (o) =>
        o.eligibility.student_access !== 'exclusive' &&
        (o.classification.tags.includes('No Student ID Required') ||
          o.eligibility.student_access === 'eligible')
    ).length;

    this.generalStudentEligibleCards = relevanceRanked
      .filter(
        (o) =>
          o.classification.category !== 'student-benefits' &&
          o.eligibility.student_access === 'eligible' &&
          (o.eligibility.conditions?.toLowerCase().includes('student') ||
            o.classification.category === 'cloud-hosting' ||
            o.classification.category === 'ai-ml')
      )
      .slice(0, 6)
      .map((o) => this.cardBySlug.get(o.identity.slug) ?? o);

    this.studentsFacetSummary = {
      totalStudentOffers: this.studentOffersSorted.length,
      studentIdRequiredCount,
      noStudentIdCount,
      generalStudentEligible: this.generalStudentEligibleCards,
    };
  }

  private buildCategorySummary(
    category: Category,
    catOffers: Offer[],
    selectedSubcategory: string
  ): CategoryFacetSummary {
    const primaryTypeGroups = getPopulatedPrimaryTypes(category, catOffers);
    const usesMacro = hasMacroTypeGroups(category.slug);

    const countMap = new Map<string, number>();
    for (const offer of catOffers) {
      const sub = offer.classification.subcategory;
      countMap.set(sub, (countMap.get(sub) ?? 0) + 1);
    }
    let allPopulatedSubcategories = category.subcategories
      .map((sub) => ({
        ...sub,
        count: countMap.get(sub.name) ?? 0,
      }))
      .filter((sub) => sub.count > 0 || selectedSubcategory === sub.name);

    if (allPopulatedSubcategories.length > 10) {
      allPopulatedSubcategories = [...allPopulatedSubcategories].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name)
      );
    }

    let standardCategoryTagSubtypes: Array<{ tag: string; label: string; count: number }> = [];
    if (!usesMacro) {
      const baseOffers =
        selectedSubcategory === 'all'
          ? catOffers
          : catOffers.filter((o) => o.classification.subcategory === selectedSubcategory);
      standardCategoryTagSubtypes = getTagSubtypesForOffers(baseOffers, 7);
    }

    const prMap = new Map<PricingModel, number>();
    for (const offer of catOffers) {
      const pm = offer.classification.pricing_model;
      prMap.set(pm, (prMap.get(pm) ?? 0) + 1);
    }
    const categoryPricingOptions = Array.from(prMap.entries()).map(([model, count]) => ({
      model,
      count,
    }));

    let officialCount = 0;
    const scopes: Record<string, number> = {};
    const langs: Record<string, number> = {};
    const os: Record<string, number> = {};

    if (category.slug === 'mcp') {
      for (const offer of catOffers) {
        const tags = offer.classification.tags;
        if (tags.includes('official-implementation') || offer.metadata.featured) {
          officialCount++;
        }
        for (const s of MCP_SCOPE_TAGS) {
          if (tags.includes(`scope:${s}`)) {
            scopes[s] = (scopes[s] ?? 0) + 1;
          }
        }
        for (const l of MCP_LANG_TAGS) {
          if (tags.includes(`lang:${l}`)) {
            langs[l] = (langs[l] ?? 0) + 1;
          }
        }
        for (const o of MCP_OS_TAGS) {
          if (tags.includes(`os:${o}`)) {
            os[o] = (os[o] ?? 0) + 1;
          }
        }
      }
    }

    let exclusive = 0;
    let eligible = 0;
    for (const o of catOffers) {
      if (o.eligibility.student_access === 'exclusive') exclusive++;
      else if (o.eligibility.student_access === 'eligible') eligible++;
    }

    const suggestions: string[] = [];
    for (const offer of catOffers.slice(0, 3)) {
      const shortTitle = offer.identity.name.split('(')[0].trim();
      if (shortTitle && !suggestions.includes(shortTitle)) suggestions.push(shortTitle);
    }
    for (const sub of category.subcategories.slice(0, 2)) {
      if (!suggestions.includes(sub.name)) suggestions.push(sub.name);
    }

    const sampleNames = Array.from(
      new Set(catOffers.map((o) => o.identity.provider))
    )
      .slice(0, 3)
      .join(', ');

    return {
      totalInCategory: catOffers.length,
      primaryTypeGroups,
      allPopulatedSubcategories,
      standardCategoryTagSubtypes,
      categoryPricingOptions,
      mcpFilterCounts: {
        officialCount,
        scopes,
        langs,
        os,
      },
      studentVerificationCounts: {
        exclusive,
        eligible,
        total: catOffers.length,
      },
      categorySuggestions: suggestions.slice(0, 5),
      sampleNames,
    };
  }

  public getCategorySummary(
    slug: CategorySlug,
    selectedSubcategory = 'all'
  ): CategoryFacetSummary | undefined {
    const base = this.baseCategorySummaries.get(slug);
    if (!base) return undefined;
    if (selectedSubcategory === 'all') return base;
    const category = this.categoryBySlug.get(slug);
    const catOffers = this.offersByCategory.get(slug) ?? [];
    if (!category) return base;
    return this.buildCategorySummary(category, catOffers, selectedSubcategory);
  }

  public getOfferDetail(slug: string, relatedLimit = 3): { offer: Offer; related: Offer[] } | null {
    const offer = this.fullBySlug.get(slug);
    if (!offer) return null;

    const sameCat = this.offersByCategory.get(offer.classification.category) ?? [];
    const relatedFull = sameCat
      .filter((o) => o.identity.slug !== offer.identity.slug)
      .sort((a, b) => {
        const sameSubA = a.classification.subcategory === offer.classification.subcategory ? 1 : 0;
        const sameSubB = b.classification.subcategory === offer.classification.subcategory ? 1 : 0;
        if (sameSubB !== sameSubA) return sameSubB - sameSubA;
        return Number(Boolean(b.metadata.featured)) - Number(Boolean(a.metadata.featured));
      })
      .slice(0, relatedLimit);

    const related = relatedFull.map((o) => this.cardBySlug.get(o.identity.slug) ?? o);
    return { offer, related };
  }

  public query(opts: OfferQueryOptions): OfferQueryResult {
    const limit = Math.min(Math.max(opts.limit ?? 24, 1), 100);
    const offset = Math.max(opts.offset ?? 0, 0);
    const fields = opts.fields ?? 'card';

    // 1. Batch lookup by slugs (used by SavedOffersPage)
    if (opts.slugs && opts.slugs.length > 0) {
      const matched: Offer[] = [];
      for (const s of opts.slugs) {
        const item = fields === 'full' ? this.fullBySlug.get(s) : this.cardBySlug.get(s);
        if (item) matched.push(item);
      }
      const paged = matched.slice(offset, offset + limit);
      return {
        count: paged.length,
        total: matched.length,
        limit,
        offset,
        items: paged,
      };
    }

    // 2. Learning Hub mode
    if (opts.learningOnly) {
      const q = (opts.q ?? '').trim();
      let list = q
        ? filterAndSortOffers(this.learningOffersSorted, {
            ...DEFAULT_FILTER_STATE,
            category: 'learning',
            query: q,
            sortBy: opts.sort ?? 'relevance',
          })
        : this.learningOffersSorted;

      if (opts.format && opts.format !== 'all') {
        list = list.filter((o) => o.learning?.format === opts.format);
      }
      if (opts.difficulty && opts.difficulty !== 'all') {
        list = list.filter((o) => o.learning?.difficulty === opts.difficulty);
      }
      if (opts.topic && opts.topic !== 'all') {
        list = list.filter((o) => (o.learning?.topics ?? []).includes(opts.topic!));
      }
      if (opts.language && opts.language !== 'all') {
        list = list.filter((o) => o.learning?.language === opts.language);
      }
      if (opts.pricing && opts.pricing.length > 0) {
        const prSet = new Set(opts.pricing);
        list = list.filter((o) => prSet.has(o.classification.pricing_model));
      }
      if (opts.status && opts.status !== 'all') {
        list = list.filter((o) => o.verification.status === opts.status);
      }

      const total = list.length;
      const paged = list
        .slice(offset, offset + limit)
        .map((o) => (fields === 'full' ? o : this.cardBySlug.get(o.identity.slug) ?? o));

      return {
        count: paged.length,
        total,
        limit,
        offset,
        items: paged,
        ...(opts.includeFacets
          ? {
              facets: {
                learningSummary: this.learningFacetSummary,
              },
            }
          : {}),
      };
    }

    // 3. Standard Explore / Category / Students Hub mode
    const category = opts.category ?? 'all';
    const isCategoryScoped = category !== 'all';
    const basePool = isCategoryScoped
      ? (this.offersByCategory.get(category) ?? [])
      : this.fullOffers;

    const filterState: FilterState = {
      ...DEFAULT_FILTER_STATE,
      query: opts.q ?? '',
      category: isCategoryScoped ? 'all' : category,
      subcategory: opts.subcategory ?? 'all',
      pricingModels: opts.pricing ?? [],
      cardRequired: opts.card ?? 'all',
      studentAccess:
        opts.student && opts.student !== '1' ? opts.student : 'all',
      resourceType: opts.resourceType ?? 'all',
      region: opts.region ?? 'all',
      verificationStatus: opts.status ?? 'all',
      sortBy: opts.sort ?? 'relevance',
    };

    let filtered = filterAndSortOffers(basePool, filterState);

    // Category-specific refinements matching CategoryDetailPage exactly
    if (isCategoryScoped) {
      const catSummary = this.baseCategorySummaries.get(category);
      const usesMacro = hasMacroTypeGroups(category);
      const typeGroup = opts.typeGroup ?? opts.type ?? 'all';

      if (usesMacro && typeGroup !== 'all' && (opts.subcategory ?? 'all') === 'all') {
        const group = catSummary?.primaryTypeGroups.find((g) => g.id === typeGroup);
        if (group) {
          const allowedSet = new Set(group.subcategories);
          filtered = filtered.filter((o) => allowedSet.has(o.classification.subcategory));
        }
      }

      if (!usesMacro && opts.subtype && opts.subtype !== 'all') {
        filtered = filtered.filter((o) => o.classification.tags.includes(opts.subtype!));
      }
    }

    if (opts.student === '1') {
      filtered = filtered.filter(
        (o) =>
          o.eligibility.student_access === 'eligible' ||
          o.eligibility.student_access === 'exclusive'
      );
    }

    if (opts.verify && opts.verify !== 'all') {
      if (opts.verify === 'required') {
        filtered = filtered.filter(
          (o) =>
            o.eligibility.student_access === 'exclusive' ||
            o.classification.tags.includes('Student ID / .edu Required')
        );
      } else if (opts.verify === 'not_required') {
        filtered = filtered.filter(
          (o) =>
            o.eligibility.student_access !== 'exclusive' &&
            (o.classification.tags.includes('No Student ID Required') ||
              o.eligibility.student_access === 'eligible')
        );
      } else {
        filtered = filtered.filter((o) => o.eligibility.student_access === opts.verify);
      }
    }

    if (category === 'mcp' || opts.official || (opts.scope && opts.scope !== 'all') || (opts.lang && opts.lang !== 'all') || (opts.os && opts.os !== 'all')) {
      if (opts.official) {
        filtered = filtered.filter(
          (o) =>
            o.classification.tags.includes('official-implementation') ||
            Boolean(o.metadata.featured)
        );
      }
      if (opts.scope && opts.scope !== 'all') {
        const targetTag = `scope:${opts.scope}`;
        filtered = filtered.filter((o) => o.classification.tags.includes(targetTag));
      }
      if (opts.lang && opts.lang !== 'all') {
        const targetTag = `lang:${opts.lang}`;
        filtered = filtered.filter((o) => o.classification.tags.includes(targetTag));
      }
      if (opts.os && opts.os !== 'all') {
        const targetTag = `os:${opts.os}`;
        filtered = filtered.filter((o) => o.classification.tags.includes(targetTag));
      }
    }

    if (category === 'ai-ml' || (opts.modality && opts.modality !== 'all') || (opts.ctx && opts.ctx !== 'all')) {
      if (opts.modality && opts.modality !== 'all') {
        filtered = filtered.filter((o) => getAiModality(o)?.id === opts.modality);
      }
      if (opts.ctx && opts.ctx !== 'all') {
        const opt = AI_CONTEXT_FILTER_OPTIONS.find((c) => c.value === opts.ctx);
        if (opt && opt.minTokens > 0) {
          filtered = filtered.filter((o) => (getAiContextWindow(o)?.tokens ?? 0) >= opt.minTokens);
        }
      }
    }

    const total = filtered.length;
    const paged = filtered
      .slice(offset, offset + limit)
      .map((o) => (fields === 'full' ? o : this.cardBySlug.get(o.identity.slug) ?? o));

    return {
      count: paged.length,
      total,
      limit,
      offset,
      items: paged,
      ...(opts.includeFacets
        ? {
            facets: {
              categoryCounts: this.categoryCounts,
              pricingCounts: this.pricingCounts,
              totalCatalog: this.fullOffers.length,
              ...(isCategoryScoped
                ? {
                    categorySummary: this.getCategorySummary(
                      category,
                      opts.subcategory ?? 'all'
                    ),
                  }
                : {}),
              ...(category === 'student-benefits'
                ? {
                    studentsSummary: this.studentsFacetSummary,
                  }
                : {}),
            },
          }
        : {}),
    };
  }
}
