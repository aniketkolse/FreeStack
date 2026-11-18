import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Home,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowDownAZ,
  ChevronDown,
  Check,
  RotateCcw,
  Layers,
  GraduationCap,
  Code2,
  Cpu,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CATEGORIES,
  getCategoryBySlug,
  getCategoryCounts,
  getOfferBySlug,
} from '../lib/data/resources';
import {
  useDebouncedValue,
  usePaginatedOffersQuery,
} from '../lib/data/useOffersApi';
import type { CategoryFacetSummary } from '../lib/server/offerCatalogIndex';
import { getBackNavigationMeta } from '../lib/router/navigationHistory';
import {
  findPrimaryTypeForSubcategory,
  hasMacroTypeGroups,
} from '../lib/filters/categoryGroups';
import { formatPricingModel } from '../lib/utils/formatters';
import type { NavigateOptions } from '../lib/router/useRouter';
import type { PricingModel, RequirementState, SortOption } from '../types/resource';
import { CategoryStickerIcon, getCategoryBgClass } from '../components/illustrations/TocaStickers';
import { CategoryTile } from '../components/categories/CategoryTile';
import { ResourceCard } from '../components/offers/ResourceCard';
import {
  CardGridSkeleton,
  InfiniteLoadMore,
  OffersErrorState,
} from '../components/offers/CardGridSkeleton';
import { SearchBar } from '../components/search/SearchBar';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import {
  AI_CONTEXT_FILTER_OPTIONS,
  AI_MODALITY_OPTIONS,
  type AiModalityId,
} from '../lib/ai/aiModelMetadata';

interface CategoryDetailPageProps {
  slug: string;
  searchParams?: URLSearchParams;
  onNavigate: (path: string, options?: NavigateOptions) => void;
  onBack?: (fallbackPath?: string) => void;
  previousPath?: string | null;
}

const SORT_OPTIONS: Array<{
  value: SortOption;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mcpOrAiOnly?: boolean;
  aiOnly?: boolean;
}> = [
  { value: 'use_case', label: 'Use Case', icon: Layers, mcpOrAiOnly: true },
  { value: 'context_desc', label: 'Context Size', icon: Cpu, aiOnly: true },
  { value: 'relevance', label: 'Featured', icon: Sparkles },
  { value: 'recently_verified', label: 'Verified', icon: ShieldCheck },
  { value: 'recently_added', label: 'Newest', icon: Clock },
  { value: 'name_asc', label: 'A–Z', icon: ArrowDownAZ },
];

const MCP_LANGUAGE_OPTIONS = [
  { value: 'typescript', label: '📇 TypeScript / JS', tag: 'lang:typescript' },
  { value: 'python', label: '🐍 Python', tag: 'lang:python' },
  { value: 'go', label: '🏎️ Go', tag: 'lang:go' },
  { value: 'rust', label: '🦀 Rust', tag: 'lang:rust' },
  { value: 'java', label: '☕ Java', tag: 'lang:java' },
  { value: 'csharp', label: '#️⃣ C#', tag: 'lang:csharp' },
  { value: 'cpp', label: '🌊 C/C++', tag: 'lang:cpp' },
  { value: 'ruby', label: '💎 Ruby', tag: 'lang:ruby' },
] as const;

const MCP_SCOPE_OPTIONS = [
  { value: 'all', label: 'All Scope', tag: '' },
  { value: 'local', label: '🏠 Local', tag: 'scope:local' },
  { value: 'cloud', label: '☁️ Cloud', tag: 'scope:cloud' },
  { value: 'embedded', label: '📟 Embedded', tag: 'scope:embedded' },
] as const;

const MCP_OS_OPTIONS = [
  { value: 'macos', label: '🍎 macOS', tag: 'os:macos' },
  { value: 'windows', label: '🪟 Windows', tag: 'os:windows' },
  { value: 'linux', label: '🐧 Linux', tag: 'os:linux' },
] as const;

export function CategoryDetailPage({
  slug,
  searchParams,
  onNavigate,
  onBack,
  previousPath = null,
}: CategoryDetailPageProps) {
  const category = getCategoryBySlug(slug);
  const isMcpCategory = slug === 'mcp';
  const isAiCategory = slug === 'ai-ml';
  const isStudentCategory = slug === 'student-benefits';
  const usesMacroGroups = category ? hasMacroTypeGroups(category.slug) : false;
  const defaultSort: SortOption = isMcpCategory ? 'use_case' : 'relevance';

  const initialQuery = searchParams?.get('q') || '';
  const initialTypeGroup = searchParams?.get('type') || 'all';
  const initialSub = searchParams?.get('subcategory') || 'all';
  const initialTagSubtype = searchParams?.get('subtype') || 'all';
  const initialCard = (searchParams?.get('card') as RequirementState | 'all') || 'all';
  const initialSort = (searchParams?.get('sort') as SortOption) || defaultSort;
  const initialPricing = useMemo(() => {
    const raw = searchParams?.get('pricing');
    return raw ? (raw.split(',').filter(Boolean) as PricingModel[]) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedTypeGroup, setSelectedTypeGroup] = useState<string>(initialTypeGroup);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSub);
  const [selectedTagSubtype, setSelectedTagSubtype] = useState<string>(initialTagSubtype);
  const [cardFilter, setCardFilter] = useState<RequirementState | 'all'>(initialCard);
  const [selectedPricing, setSelectedPricing] = useState<PricingModel[]>(initialPricing);
  const [studentFriendlyOnly, setStudentFriendlyOnly] = useState<boolean>(
    searchParams?.get('student') === '1'
  );
  const [studentVerificationFilter, setStudentVerificationFilter] = useState<'all' | 'exclusive' | 'eligible'>(
    (searchParams?.get('verify') as 'all' | 'exclusive' | 'eligible') || 'all'
  );
  const [mcpOfficialOnly, setMcpOfficialOnly] = useState<boolean>(
    searchParams?.get('official') === '1'
  );
  const [mcpScope, setMcpScope] = useState<string>(searchParams?.get('scope') || 'all');
  const [mcpLang, setMcpLang] = useState<string>(searchParams?.get('lang') || 'all');
  const [mcpOs, setMcpOs] = useState<string>(searchParams?.get('os') || 'all');
  const [aiModality, setAiModality] = useState<AiModalityId | 'all'>(
    (searchParams?.get('modality') as AiModalityId | 'all') || 'all'
  );
  const [aiMinContext, setAiMinContext] = useState<string>(
    searchParams?.get('ctx') || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [showAllSubtypes, setShowAllSubtypes] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 150);

  const counts = getCategoryCounts();
  const totalInCategoryCount = category ? (counts[category.slug] ?? 0) : 0;

  const apiFilterQuery = useMemo(() => {
    if (!category) return '';
    const qs = new URLSearchParams();
    qs.set('category', category.slug);
    if (debouncedQuery.trim()) qs.set('q', debouncedQuery.trim());
    if (selectedTypeGroup !== 'all') qs.set('typeGroup', selectedTypeGroup);
    if (selectedSubcategory !== 'all') qs.set('subcategory', selectedSubcategory);
    if (selectedTagSubtype !== 'all') qs.set('subtype', selectedTagSubtype);
    if (cardFilter !== 'all') qs.set('card', cardFilter);
    if (selectedPricing.length > 0) qs.set('pricing', selectedPricing.join(','));
    if (studentFriendlyOnly) qs.set('student', '1');
    if (isStudentCategory && studentVerificationFilter !== 'all') {
      qs.set('verify', studentVerificationFilter);
    }
    if (isMcpCategory) {
      if (mcpOfficialOnly) qs.set('official', '1');
      if (mcpScope !== 'all') qs.set('scope', mcpScope);
      if (mcpLang !== 'all') qs.set('lang', mcpLang);
      if (mcpOs !== 'all') qs.set('os', mcpOs);
    }
    if (isAiCategory) {
      if (aiModality !== 'all') qs.set('modality', aiModality);
      if (aiMinContext !== 'all') qs.set('ctx', aiMinContext);
    }
    qs.set('sort', sortBy);
    return qs.toString();
  }, [
    category,
    debouncedQuery,
    selectedTypeGroup,
    selectedSubcategory,
    selectedTagSubtype,
    cardFilter,
    selectedPricing,
    studentFriendlyOnly,
    isStudentCategory,
    studentVerificationFilter,
    isMcpCategory,
    mcpOfficialOnly,
    mcpScope,
    mcpLang,
    mcpOs,
    isAiCategory,
    aiModality,
    aiMinContext,
    sortBy,
  ]);

  const {
    items: displayedOffers,
    total: totalFilteredCount,
    hasMore,
    facets,
    isInitialLoading,
    isFetchingMore,
    isTransitioning,
    error,
    loadMore,
    retry,
  } = usePaginatedOffersQuery(apiFilterQuery, 24);

  const [cachedSummaryBySlug, setCachedSummaryBySlug] = useState<
    Record<string, CategoryFacetSummary>
  >({});

  useEffect(() => {
    if (category && facets?.categorySummary) {
      setCachedSummaryBySlug((prev) => ({
        ...prev,
        [category.slug]: facets.categorySummary!,
      }));
    }
  }, [category, facets?.categorySummary]);

  const categorySummary = category
    ? (facets?.categorySummary ?? cachedSummaryBySlug[category.slug])
    : undefined;

  // Row 1: Important Primary Types for this category
  const primaryTypeGroups = useMemo(() => {
    if (categorySummary?.primaryTypeGroups) {
      return categorySummary.primaryTypeGroups;
    }
    if (!category || usesMacroGroups) return [];
    return category.subcategories.map((sub) => ({
      id: sub.slug,
      label: sub.name,
      subcategories: [sub.name],
      count: 0,
      populatedSubcategories: [{ ...sub, count: 0 }],
    }));
  }, [category, categorySummary, usesMacroGroups]);

  useEffect(() => {
    const nextDefaultSort: SortOption = slug === 'mcp' ? 'use_case' : 'relevance';
    const subParam = searchParams?.get('subcategory') || 'all';
    const typeParam = searchParams?.get('type') || 'all';

    setSearchQuery((prev) => {
      const urlQ = searchParams?.get('q') || '';
      return prev.trim() === urlQ.trim() ? prev : urlQ;
    });
    setSelectedSubcategory(subParam);
    setSelectedTagSubtype(searchParams?.get('subtype') || 'all');

    if (typeParam !== 'all') {
      setSelectedTypeGroup(typeParam);
    } else if (subParam !== 'all' && category) {
      const parentId = findPrimaryTypeForSubcategory(primaryTypeGroups, subParam);
      setSelectedTypeGroup(parentId || 'all');
    } else {
      setSelectedTypeGroup('all');
    }

    setCardFilter((searchParams?.get('card') as RequirementState | 'all') || 'all');
    setSortBy((searchParams?.get('sort') as SortOption) || nextDefaultSort);
    const rawPricing = searchParams?.get('pricing');
    setSelectedPricing(rawPricing ? (rawPricing.split(',').filter(Boolean) as PricingModel[]) : []);
    setStudentFriendlyOnly(searchParams?.get('student') === '1');
    setStudentVerificationFilter((searchParams?.get('verify') as 'all' | 'exclusive' | 'eligible') || 'all');
    setMcpOfficialOnly(searchParams?.get('official') === '1');
    setMcpScope(searchParams?.get('scope') || 'all');
    setMcpLang(searchParams?.get('lang') || 'all');
    setMcpOs(searchParams?.get('os') || 'all');
    setAiModality((searchParams?.get('modality') as AiModalityId | 'all') || 'all');
    setAiMinContext(searchParams?.get('ctx') || 'all');
  }, [slug, searchParams, category, primaryTypeGroups]);

  useEffect(() => {
    setShowAllSubtypes(false);
    setMobileFiltersOpen(false);
  }, [slug]);

  const syncUrl = (next: {
    q?: string;
    type?: string;
    sub?: string;
    subtype?: string;
    card?: RequirementState | 'all';
    sort?: SortOption;
    pricing?: PricingModel[];
    student?: boolean;
    verify?: 'all' | 'exclusive' | 'eligible';
    official?: boolean;
    scope?: string;
    lang?: string;
    os?: string;
    modality?: AiModalityId | 'all';
    ctx?: string;
  }) => {
    const qVal = next.q !== undefined ? next.q : searchQuery;
    const typeVal = next.type !== undefined ? next.type : selectedTypeGroup;
    const subVal = next.sub !== undefined ? next.sub : selectedSubcategory;
    const subtypeVal = next.subtype !== undefined ? next.subtype : selectedTagSubtype;
    const cardVal = next.card !== undefined ? next.card : cardFilter;
    const sortVal = next.sort !== undefined ? next.sort : sortBy;
    const pricingVal = next.pricing !== undefined ? next.pricing : selectedPricing;
    const studentVal = next.student !== undefined ? next.student : studentFriendlyOnly;
    const verifyVal = next.verify !== undefined ? next.verify : studentVerificationFilter;
    const officialVal = next.official !== undefined ? next.official : mcpOfficialOnly;
    const scopeVal = next.scope !== undefined ? next.scope : mcpScope;
    const langVal = next.lang !== undefined ? next.lang : mcpLang;
    const osVal = next.os !== undefined ? next.os : mcpOs;
    const modalityVal = next.modality !== undefined ? next.modality : aiModality;
    const ctxVal = next.ctx !== undefined ? next.ctx : aiMinContext;

    const qs = new URLSearchParams();
    if (qVal.trim()) qs.set('q', qVal.trim());
    if (typeVal !== 'all') qs.set('type', typeVal);
    if (subVal !== 'all') qs.set('subcategory', subVal);
    if (subtypeVal !== 'all') qs.set('subtype', subtypeVal);
    if (cardVal !== 'all') qs.set('card', cardVal);
    if (pricingVal.length > 0) qs.set('pricing', pricingVal.join(','));
    if (studentVal) qs.set('student', '1');
    if (verifyVal !== 'all') qs.set('verify', verifyVal);
    if (officialVal) qs.set('official', '1');
    if (scopeVal !== 'all') qs.set('scope', scopeVal);
    if (langVal !== 'all') qs.set('lang', langVal);
    if (osVal !== 'all') qs.set('os', osVal);
    if (modalityVal !== 'all') qs.set('modality', modalityVal);
    if (ctxVal !== 'all') qs.set('ctx', ctxVal);
    if (sortVal !== defaultSort) qs.set('sort', sortVal);
    const queryStr = qs.toString();
    onNavigate(queryStr ? `/category/${slug}?${queryStr}` : `/category/${slug}`, {
      replace: true,
      scrollTop: false,
    });
  };

  // Sync debounced search query to URL without blocking input typing
  useEffect(() => {
    const urlQ = searchParams?.get('q') || '';
    if (debouncedQuery.trim() === urlQ.trim()) return;
    syncUrl({ q: debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const activePrimaryGroup = useMemo(
    () => primaryTypeGroups.find((g) => g.id === selectedTypeGroup),
    [primaryTypeGroups, selectedTypeGroup]
  );

  // All populated subcategories across the category
  const allPopulatedSubcategories = useMemo(() => {
    if (categorySummary?.allPopulatedSubcategories) {
      return categorySummary.allPopulatedSubcategories;
    }
    if (!category) return [];
    return category.subcategories.map((sub) => ({ ...sub, count: 0 }));
  }, [category, categorySummary]);

  const activeSubtypes = useMemo(() => {
    if (!usesMacroGroups) return [];
    if (activePrimaryGroup) {
      return activePrimaryGroup.populatedSubcategories;
    }
    return allPopulatedSubcategories;
  }, [usesMacroGroups, activePrimaryGroup, allPopulatedSubcategories]);

  const inlineSubtypes = useMemo(() => {
    const maxInline = isMcpCategory ? 5 : 6;
    if (showAllSubtypes || activeSubtypes.length <= maxInline) {
      return activeSubtypes;
    }
    const topSlice = activeSubtypes.slice(0, maxInline);
    if (
      selectedSubcategory !== 'all' &&
      !topSlice.some((s) => s.name === selectedSubcategory)
    ) {
      const activeObj = activeSubtypes.find((s) => s.name === selectedSubcategory);
      if (activeObj) {
        return [activeObj, ...topSlice.slice(0, maxInline - 1)];
      }
    }
    return topSlice;
  }, [activeSubtypes, showAllSubtypes, selectedSubcategory, isMcpCategory]);

  const standardCategoryTagSubtypes = useMemo(
    () => categorySummary?.standardCategoryTagSubtypes ?? [],
    [categorySummary]
  );

  const categoryPricingOptions = useMemo(
    () => categorySummary?.categoryPricingOptions ?? [],
    [categorySummary]
  );

  const mcpFilterCounts = useMemo(() => {
    const raw = categorySummary?.mcpFilterCounts;
    return {
      officialCount: raw?.officialCount ?? 0,
      scopes: new Map<string, number>(Object.entries(raw?.scopes ?? {})),
      langs: new Map<string, number>(Object.entries(raw?.langs ?? {})),
      os: new Map<string, number>(Object.entries(raw?.os ?? {})),
    };
  }, [categorySummary]);

  const categorySuggestions = useMemo(
    () => categorySummary?.categorySuggestions ?? [],
    [categorySummary]
  );

  const studentVerificationCounts = useMemo(
    () =>
      categorySummary?.studentVerificationCounts ?? {
        exclusive: 0,
        eligible: 0,
        total: totalInCategoryCount,
      },
    [categorySummary, totalInCategoryCount]
  );

  const togglePricing = (model: PricingModel) => {
    const next = selectedPricing.includes(model)
      ? selectedPricing.filter((m) => m !== model)
      : [...selectedPricing, model];
    setSelectedPricing(next);
    syncUrl({ pricing: next });
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTypeGroup !== 'all' ||
    selectedSubcategory !== 'all' ||
    selectedTagSubtype !== 'all' ||
    cardFilter !== 'all' ||
    selectedPricing.length > 0 ||
    studentFriendlyOnly ||
    studentVerificationFilter !== 'all' ||
    mcpOfficialOnly ||
    mcpScope !== 'all' ||
    mcpLang !== 'all' ||
    mcpOs !== 'all' ||
    aiModality !== 'all' ||
    aiMinContext !== 'all';

  const activeFilterCount =
    Number(selectedTypeGroup !== 'all') +
    Number(selectedSubcategory !== 'all') +
    Number(selectedTagSubtype !== 'all') +
    Number(cardFilter !== 'all') +
    selectedPricing.length +
    Number(studentFriendlyOnly) +
    Number(studentVerificationFilter !== 'all') +
    Number(mcpOfficialOnly) +
    Number(mcpScope !== 'all') +
    Number(mcpLang !== 'all') +
    Number(mcpOs !== 'all') +
    Number(aiModality !== 'all') +
    Number(aiMinContext !== 'all');

  const resetCategoryFilters = () => {
    setSearchQuery('');
    setSelectedTypeGroup('all');
    setSelectedSubcategory('all');
    setSelectedTagSubtype('all');
    setCardFilter('all');
    setSelectedPricing([]);
    setStudentFriendlyOnly(false);
    setStudentVerificationFilter('all');
    setMcpOfficialOnly(false);
    setMcpScope('all');
    setMcpLang('all');
    setMcpOs('all');
    setAiModality('all');
    setAiMinContext('all');
    setShowAllSubtypes(false);
    setSortBy(defaultSort);
    onNavigate(`/category/${slug}`, { replace: true, scrollTop: false });
  };

  if (!category) {
    const notFoundBackMeta = getBackNavigationMeta(previousPath, '/categories', {
      getCategoryName: (catSlug) => getCategoryBySlug(catSlug)?.name,
      getOfferName: (offerSlug) => getOfferBySlug(offerSlug)?.identity.name,
    });
    return (
      <div className="max-w-[1360px] mx-auto px-6 py-16 text-center flex flex-col items-center gap-4">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[32px] text-midnight-mouth">
          Category not found
        </h1>
        <p className="font-[var(--font-inter)] text-[15px] text-ink/80">
          The requested category does not exist in FreeStack&apos;s category registry.
        </p>
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 inline-flex items-center gap-1.5 spring-pill"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </a>
          <a
            href={notFoundBackMeta.targetHref}
            onClick={(e) => {
              e.preventDefault();
              if (onBack) {
                onBack('/categories');
              } else {
                onNavigate(notFoundBackMeta.targetHref);
              }
            }}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 spring-pill"
          >
            {notFoundBackMeta.label}
          </a>
        </div>
      </div>
    );
  }

  const bgClass = getCategoryBgClass(category.color);
  const relatedCategories = CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 3);
  const sampleNames = categorySummary?.sampleNames ?? '';

  const visibleSortOptions = SORT_OPTIONS.filter((opt) => {
    if (opt.aiOnly) return isAiCategory;
    if (opt.mcpOrAiOnly) return isMcpCategory || isAiCategory;
    return true;
  });

  const displayCount = isInitialLoading && !hasActiveFilters ? totalInCategoryCount : totalFilteredCount;

  // Heading title reflecting active Primary Type or Subtype
  const activeResultsTitle =
    selectedSubcategory !== 'all'
      ? `${selectedSubcategory} (${displayCount})`
      : activePrimaryGroup
        ? `${activePrimaryGroup.label} (${displayCount})`
        : `All ${category.name} (${displayCount})`;

  const backMeta = getBackNavigationMeta(previousPath, '/categories', {
    getCategoryName: (catSlug) => getCategoryBySlug(catSlug)?.name,
    getOfferName: (offerSlug) => getOfferBySlug(offerSlug)?.identity.name,
  });

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onBack) {
      onBack('/categories');
    } else {
      onNavigate(backMeta.targetHref);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 sm:pt-4 pb-12 flex flex-col gap-3 sm:gap-3.5">
      {/* Top Back Button & Quick Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <a
            href={backMeta.targetHref}
            data-testid="category-back-btn"
            onClick={handleBackClick}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[13.5px] rounded-full px-3.5 sm:px-4 py-1.5 min-h-[34px] sm:min-h-[36px] inline-flex items-center gap-1.5 spring-pill shadow-2xs max-w-full"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[200px] sm:max-w-[320px]">{backMeta.label}</span>
          </a>
          <a
            href="/categories"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/categories');
            }}
            className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13px] rounded-full px-3.5 py-1.5 min-h-[34px] sm:min-h-[36px] inline-flex items-center gap-1.5 spring-pill border border-midnight-mouth/10"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>All Categories</span>
          </a>
        </div>

        <nav
          aria-label="Category breadcrumb"
          className="hidden sm:flex items-center gap-1.5 font-[var(--font-inter)] text-[12.5px] text-ink/75"
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="hover:underline"
          >
            Home
          </a>
          <span aria-hidden="true">/</span>
          <a
            href="/categories"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/categories');
            }}
            className="hover:underline"
          >
            Categories
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-midnight-mouth font-medium">{category.name}</span>
        </nav>
      </div>

      {/* Unified Category Header, Search & Systematic 2-Tier Filter/Sort Card */}
      <section
        aria-label="Category header, search, and filters"
        className={`${bgClass} rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 flex flex-col gap-3`}
      >
        {/* Top Row: Category Icon + Title + Description on Left, Search Bar on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] bg-paper flex items-center justify-center shrink-0 shadow-xs">
              <CategoryStickerIcon slug={category.slug} className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <h1 className="font-[var(--font-wallop)] font-extrabold text-[22px] sm:text-[26px] lg:text-[28px] leading-[1.06] tracking-[-0.03em] text-midnight-mouth truncate">
                {category.name}
              </h1>
              <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[13px] leading-[1.35] text-ink/85 line-clamp-1">
                {category.description}
              </p>
            </div>
          </div>

          {/* Category Search Bar */}
          <div className="w-full lg:w-[430px] xl:w-[470px] shrink-0">
            <SearchBar
              inputId="category-search-input"
              initialQuery={searchQuery}
              onChangeQuery={(q) => {
                setSearchQuery(q);
              }}
              onSubmitQuery={(q) => {
                setSearchQuery(q);
                syncUrl({ q });
              }}
              placeholder={
                sampleNames
                  ? `Search in ${category.shortName} (${sampleNames})...`
                  : `Search in ${category.shortName}...`
              }
              label={`Search resources in ${category.name}`}
              showSuggestions={false}
              suggestions={categorySuggestions}
            />
          </div>
        </div>

        {/* Mobile-Only Compact Filter & Sort Bar (< 640px) — keeps filters from taking full screen on mobile */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              data-testid="mobile-filter-toggle"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3 py-1.5 min-h-[34px] cursor-pointer filter-pill border ${
                mobileFiltersOpen || activeFilterCount > 0
                  ? 'bg-midnight-mouth text-daylight border-midnight-mouth shadow-2xs'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/15'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Filters &amp; Types</span>
              {activeFilterCount > 0 && (
                <span className="bg-sunshine-yellow text-[#101014] text-[10.5px] font-bold rounded-full px-1.5 py-0.5 leading-none tabular-nums">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  mobileFiltersOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetCategoryFilters}
                className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11.5px] text-[#101014] bg-sunshine-yellow rounded-full px-2.5 py-1.5 min-h-[34px] shrink-0 filter-pill cursor-pointer border border-midnight-mouth/15"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <FilterDropdown
            id="cat-sort-mobile"
            label="Sort by"
            variant="pill"
            value={sortBy}
            triggerPrefix="Sort:"
            minMenuWidth={210}
            menuTitle="Sort results"
            onChange={(nextVal) => {
              const next = nextVal as SortOption;
              setSortBy(next);
              syncUrl({ sort: next });
            }}
            options={visibleSortOptions.map((opt) => {
              const Icon = opt.icon;
              return {
                value: opt.value,
                label: opt.label,
                icon: <Icon className="w-3.5 h-3.5" />,
              };
            })}
          />
        </div>

        {/* Systematic 3-Row Panel: Row 1 = Important Types, Row 2 = Subtypes under it, Row 3 = Filter & Sort */}
        <div
          data-testid="systematic-filter-panel"
          className={`bg-paper/95 rounded-[16px] px-3 py-2.5 border border-midnight-mouth/10 ${
            mobileFiltersOpen ? 'flex' : 'hidden'
          } sm:flex flex-col gap-2 shadow-2xs`}
        >
          {/* ROW 1: Important Primary Types (Wraps cleanly so zero pills are clipped) */}
          <div
            role="tablist"
            aria-label="Important types"
            data-testid="primary-types-row"
            className="flex flex-wrap items-center gap-1.5 min-w-0 py-0.5"
          >
            <span className="font-[var(--font-wallop)] font-bold text-[10.5px] uppercase tracking-[0.06em] text-midnight-mouth/55 w-[62px] shrink-0 select-none">
              Types
            </span>

            <button
              type="button"
              role="tab"
              aria-selected={
                usesMacroGroups
                  ? selectedTypeGroup === 'all' && selectedSubcategory === 'all'
                  : selectedSubcategory === 'all'
              }
              onClick={() => {
                setSelectedTypeGroup('all');
                setSelectedSubcategory('all');
                setSelectedTagSubtype('all');
                syncUrl({ type: 'all', sub: 'all', subtype: 'all' });
              }}
              className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-2.5 py-1 min-h-[26px] whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                (
                  usesMacroGroups
                    ? selectedTypeGroup === 'all' && selectedSubcategory === 'all'
                    : selectedSubcategory === 'all'
                )
                  ? 'bg-midnight-mouth text-daylight border-midnight-mouth shadow-2xs'
                  : 'bg-daylight/75 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/55'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] opacity-75 tabular-nums">
                ({totalInCategoryCount})
              </span>
            </button>

            {primaryTypeGroups.map((group) => {
              const active = usesMacroGroups
                ? selectedTypeGroup === group.id
                : selectedSubcategory === group.label;

              return (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (usesMacroGroups) {
                      const nextType = active ? 'all' : group.id;
                      setSelectedTypeGroup(nextType);
                      setSelectedSubcategory('all');
                      syncUrl({ type: nextType, sub: 'all' });
                    } else {
                      const nextSub = active ? 'all' : group.label;
                      setSelectedSubcategory(nextSub);
                      setSelectedTagSubtype('all');
                      syncUrl({ sub: nextSub, subtype: 'all' });
                    }
                  }}
                  className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-2.5 py-1 min-h-[26px] max-w-full text-left leading-tight sm:whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                    active
                      ? 'bg-midnight-mouth text-daylight border-midnight-mouth shadow-2xs'
                      : 'bg-daylight/75 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/55'
                  }`}
                >
                  <span className="truncate sm:overflow-visible">{group.label}</span>
                  <span className="text-[10px] opacity-70 tabular-nums shrink-0">({group.count})</span>
                </button>
              );
            })}
          </div>

          {/* ROW 2: Subtypes Directly Under Important Types (Full Width) */}
          <div
            data-testid="subtypes-row"
            className="flex flex-col gap-2 pt-2 border-t border-midnight-mouth/10"
          >
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
                <span className="font-[var(--font-wallop)] font-bold text-[10.5px] uppercase tracking-[0.06em] text-midnight-mouth/55 w-[62px] shrink-0 select-none">
                  Subtypes
                </span>

                {usesMacroGroups ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory('all');
                        syncUrl({ sub: 'all' });
                      }}
                      className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                        selectedSubcategory === 'all'
                          ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                          : 'bg-daylight/65 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                      }`}
                    >
                      <span>
                        {activePrimaryGroup
                          ? `All ${activePrimaryGroup.label}`
                          : 'All Subtypes'}
                      </span>
                      <span className="text-[10px] opacity-75 tabular-nums">
                        ({activePrimaryGroup ? activePrimaryGroup.count : totalInCategoryCount})
                      </span>
                    </button>

                    {inlineSubtypes.map((sub) => {
                      const active = selectedSubcategory === sub.name;
                      return (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => {
                            const nextSub = active ? 'all' : sub.name;
                            const ownerType =
                              nextSub !== 'all'
                                ? findPrimaryTypeForSubcategory(primaryTypeGroups, nextSub)
                                : selectedTypeGroup;
                            setSelectedSubcategory(nextSub);
                            if (ownerType && selectedTypeGroup === 'all') {
                              setSelectedTypeGroup(ownerType);
                            }
                            syncUrl({
                              sub: nextSub,
                              type:
                                ownerType && selectedTypeGroup === 'all'
                                  ? ownerType
                                  : selectedTypeGroup,
                            });
                          }}
                          className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                            active
                              ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                              : 'bg-daylight/65 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                          }`}
                        >
                          <span>{sub.name}</span>
                          <span className="text-[10px] opacity-70 tabular-nums">({sub.count})</span>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTagSubtype('all');
                        syncUrl({ subtype: 'all' });
                      }}
                      className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                        selectedTagSubtype === 'all'
                          ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                          : 'bg-daylight/65 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                      }`}
                    >
                      <span>All Subtypes</span>
                    </button>

                    {standardCategoryTagSubtypes.map((item) => {
                      const active = selectedTagSubtype === item.tag;
                      return (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => {
                            const next = active ? 'all' : item.tag;
                            setSelectedTagSubtype(next);
                            syncUrl({ subtype: next });
                          }}
                          className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                            active
                              ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                              : 'bg-daylight/65 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] opacity-70 tabular-nums">
                            ({item.count})
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Right Side of Subtypes Row: Expand Toggle + Subtype Jump Select */}
              <div className="flex items-center gap-1.5 shrink-0">
                {usesMacroGroups && activeSubtypes.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSubtypes((prev) => !prev)}
                    className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth bg-sunshine-yellow/55 hover:bg-sunshine-yellow/85 border border-midnight-mouth/12 rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap shrink-0 cursor-pointer filter-pill inline-flex items-center gap-1"
                  >
                    <span>
                      {showAllSubtypes
                        ? 'Hide list'
                        : `+${activeSubtypes.length - inlineSubtypes.length} more`}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        showAllSubtypes ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {usesMacroGroups && allPopulatedSubcategories.length > 0 && (
                  <FilterDropdown
                    id="cat-subcategory-select"
                    label={isMcpCategory ? 'Use Case' : 'Subtype'}
                    variant="pill"
                    value={selectedSubcategory}
                    active={selectedSubcategory !== 'all'}
                    triggerIcon={<Layers className="w-3 h-3" />}
                    maxTriggerWidthClass="max-w-[185px]"
                    minMenuWidth={310}
                    maxMenuHeight={360}
                    menuTitle={isMcpCategory ? 'Jump to use case' : 'Jump to subtype'}
                    menuSubtitle={`${allPopulatedSubcategories.length} ${isMcpCategory ? 'use cases' : 'subtypes'}`}
                    onChange={(nextSub) => {
                      const ownerType =
                        nextSub !== 'all'
                          ? findPrimaryTypeForSubcategory(primaryTypeGroups, nextSub)
                          : 'all';
                      setSelectedSubcategory(nextSub);
                      if (usesMacroGroups) {
                        setSelectedTypeGroup(ownerType || 'all');
                      }
                      syncUrl({
                        sub: nextSub,
                        type: usesMacroGroups ? ownerType || 'all' : selectedTypeGroup,
                      });
                    }}
                    options={[
                      {
                        value: 'all',
                        label: isMcpCategory ? 'Jump to use case' : 'Jump to subtype',
                        count: allPopulatedSubcategories.length,
                        icon: <Layers className="w-3.5 h-3.5" />,
                      },
                      ...allPopulatedSubcategories.map((sub) => ({
                        value: sub.name,
                        label: sub.name,
                        count: sub.count,
                      })),
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Expandable Full Subtypes Drawer (Only open when user clicks "+N more") */}
            {usesMacroGroups && showAllSubtypes && activeSubtypes.length > 8 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-midnight-mouth/8">
                {activeSubtypes.map((sub) => {
                  const active = selectedSubcategory === sub.name;
                  return (
                    <button
                      key={`expanded-${sub.slug}`}
                      type="button"
                      onClick={() => {
                        const nextSub = active ? 'all' : sub.name;
                        setSelectedSubcategory(nextSub);
                        syncUrl({ sub: nextSub });
                      }}
                      className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[24px] whitespace-nowrap cursor-pointer filter-pill inline-flex items-center gap-1 border ${
                        active
                          ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                          : 'bg-daylight/65 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                      }`}
                    >
                      <span>{sub.name}</span>
                      <span className="text-[10px] opacity-70 tabular-nums">({sub.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ROW 3: Filter Controls (Left) + Sort Switcher (Right) */}
          <div
            data-testid="filters-sort-row"
            className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-midnight-mouth/10"
          >
            {/* Left Side: Technical / Access Filters */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="font-[var(--font-wallop)] font-bold text-[10.5px] uppercase tracking-[0.06em] text-midnight-mouth/55 w-[62px] shrink-0 select-none">
                Filters
              </span>

              {isMcpCategory ? (
                <>
                  {/* Official Implementation Toggle */}
                  <button
                    type="button"
                    data-testid="mcp-official-filter"
                    aria-pressed={mcpOfficialOnly}
                    onClick={() => {
                      const next = !mcpOfficialOnly;
                      setMcpOfficialOnly(next);
                      syncUrl({ official: next });
                    }}
                    className={`inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap filter-pill cursor-pointer border ${
                      mcpOfficialOnly
                        ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                        : 'bg-daylight/75 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                    }`}
                  >
                    <span aria-hidden="true">🎖️</span>
                    <span>Official</span>
                    <span className="text-[10px] opacity-75 tabular-nums">
                      ({mcpFilterCounts.officialCount})
                    </span>
                  </button>

                  {/* Compact MCP Scope Dropdown */}
                  <FilterDropdown
                    id="mcp-scope-select"
                    testId="mcp-scope-select"
                    label="MCP Scope"
                    variant="pill"
                    value={mcpScope}
                    active={mcpScope !== 'all'}
                    triggerIcon={<Globe className="w-3 h-3" />}
                    minMenuWidth={230}
                    menuTitle="Execution scope"
                    menuSubtitle="Deployment environment"
                    onChange={(next) => {
                      setMcpScope(next);
                      syncUrl({ scope: next });
                    }}
                    options={MCP_SCOPE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                      count:
                        opt.value === 'all'
                          ? totalInCategoryCount
                          : mcpFilterCounts.scopes.get(opt.value) ?? 0,
                    }))}
                  />

                  {/* Compact MCP Language Dropdown */}
                  <FilterDropdown
                    id="mcp-lang-select"
                    testId="mcp-lang-select"
                    label="Codebase language"
                    variant="pill"
                    value={mcpLang}
                    active={mcpLang !== 'all'}
                    triggerIcon={<Code2 className="w-3 h-3" />}
                    minMenuWidth={240}
                    menuTitle="Codebase language"
                    menuSubtitle="SDK / runtime"
                    onChange={(next) => {
                      setMcpLang(next);
                      syncUrl({ lang: next });
                    }}
                    options={[
                      { value: 'all', label: 'All Languages' },
                      ...MCP_LANGUAGE_OPTIONS.map((lang) => ({
                        value: lang.value,
                        label: lang.label,
                        count: mcpFilterCounts.langs.get(lang.value) ?? 0,
                      })),
                    ]}
                  />

                  {/* Compact MCP OS Dropdown */}
                  <FilterDropdown
                    id="mcp-os-select"
                    testId="mcp-os-select"
                    label="Operating system"
                    variant="pill"
                    value={mcpOs}
                    active={mcpOs !== 'all'}
                    triggerIcon={<Cpu className="w-3 h-3" />}
                    minMenuWidth={220}
                    menuTitle="Operating system"
                    menuSubtitle="Host support"
                    onChange={(next) => {
                      setMcpOs(next);
                      syncUrl({ os: next });
                    }}
                    options={[
                      { value: 'all', label: 'All OS' },
                      ...MCP_OS_OPTIONS.map((osOpt) => ({
                        value: osOpt.value,
                        label: osOpt.label,
                        count: mcpFilterCounts.os.get(osOpt.value) ?? 0,
                      })),
                    ]}
                  />

                  {/* Compact MCP Access Model Dropdown */}
                  <FilterDropdown
                    id="mcp-access-select"
                    label="Access model"
                    variant="pill"
                    value={selectedPricing[0] || 'all'}
                    active={selectedPricing.length > 0}
                    triggerIcon={<Sparkles className="w-3 h-3" />}
                    minMenuWidth={240}
                    menuTitle="Access model"
                    menuSubtitle="Pricing rule"
                    onChange={(val) => {
                      const next = val === 'all' ? [] : ([val] as PricingModel[]);
                      setSelectedPricing(next);
                      syncUrl({ pricing: next });
                    }}
                    options={[
                      { value: 'all', label: 'All Access', count: totalInCategoryCount },
                      ...categoryPricingOptions.map(({ model, count }) => ({
                        value: model,
                        label: formatPricingModel(model),
                        count,
                      })),
                    ]}
                  />
                </>
              ) : (
                <>
                  {isAiCategory && (
                    <>
                      {/* AI Modality Dropdown */}
                      <FilterDropdown
                        id="ai-modality-select"
                        testId="ai-modality-select"
                        label="AI Modality"
                        variant="pill"
                        value={aiModality}
                        active={aiModality !== 'all'}
                        triggerIcon={<Sparkles className="w-3 h-3" />}
                        minMenuWidth={250}
                        menuTitle="Model modality"
                        menuSubtitle="Input & output capability"
                        onChange={(next) => {
                          const typed = next as AiModalityId | 'all';
                          setAiModality(typed);
                          syncUrl({ modality: typed });
                        }}
                        options={AI_MODALITY_OPTIONS.map((opt) => ({
                          value: opt.id,
                          label: opt.label,
                        }))}
                      />

                      {/* AI Context Window Filter Dropdown */}
                      <FilterDropdown
                        id="ai-context-select"
                        testId="ai-context-select"
                        label="Minimum context window"
                        variant="pill"
                        value={aiMinContext}
                        active={aiMinContext !== 'all'}
                        triggerIcon={<Cpu className="w-3 h-3" />}
                        minMenuWidth={240}
                        menuTitle="Context window"
                        menuSubtitle="Minimum token limit"
                        onChange={(next) => {
                          setAiMinContext(next);
                          syncUrl({ ctx: next });
                        }}
                        options={AI_CONTEXT_FILTER_OPTIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                      />
                    </>
                  )}

                  {isStudentCategory && (
                    <div
                      role="group"
                      aria-label="Student ID requirement filter"
                      data-testid="student-verification-filter-group"
                      className="inline-flex flex-wrap items-center max-w-full bg-daylight/90 p-0.5 rounded-[14px] sm:rounded-full border border-midnight-mouth/15 gap-0.5"
                    >
                      {[
                        {
                          val: 'all' as const,
                          label: `All Verification (${studentVerificationCounts.total})`,
                        },
                        {
                          val: 'exclusive' as const,
                          label: `Student ID / .edu Req. (${studentVerificationCounts.exclusive})`,
                        },
                        {
                          val: 'eligible' as const,
                          label: `No Student ID Req. (${studentVerificationCounts.eligible})`,
                        },
                      ].map((opt) => {
                        const active = studentVerificationFilter === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            data-testid={`student-verify-filter-${opt.val}`}
                            onClick={() => {
                              setStudentVerificationFilter(opt.val);
                              syncUrl({ verify: opt.val });
                            }}
                            className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[24px] whitespace-nowrap filter-pill cursor-pointer ${
                              active
                                ? 'bg-midnight-mouth text-daylight shadow-2xs'
                                : 'text-midnight-mouth/85 hover:bg-sunshine-yellow/55'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Pricing Model Quick Toggles */}
                  {categoryPricingOptions.map(({ model, count }) => {
                    const checked = selectedPricing.includes(model);
                    return (
                      <button
                        key={model}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => togglePricing(model)}
                        className={`inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap filter-pill cursor-pointer border ${
                          checked
                            ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                            : 'bg-daylight/75 text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/45'
                        }`}
                      >
                        {checked && (
                          <Check
                            className="w-2.5 h-2.5 text-grass-green stroke-[3]"
                            aria-hidden="true"
                          />
                        )}
                        <span>{formatPricingModel(model)}</span>
                        <span className="text-[10px] opacity-70 tabular-nums">({count})</span>
                      </button>
                    );
                  })}

                  {/* Card Policy Segmented Switch */}
                  <div
                    role="group"
                    aria-label="Card requirement filter"
                    className="inline-flex items-center bg-daylight/75 p-0.5 rounded-full border border-midnight-mouth/10 gap-0.5"
                  >
                    {[
                      { val: 'all', label: 'Any Card' },
                      { val: 'not_required', label: 'No Card' },
                      { val: 'required', label: 'Card Req.' },
                    ].map((opt) => {
                      const active = cardFilter === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            const next = opt.val as RequirementState | 'all';
                            setCardFilter(next);
                            syncUrl({ card: next });
                          }}
                          className={`font-[var(--font-wallop)] font-semibold text-[10.5px] rounded-full px-2 py-0.5 min-h-[22px] whitespace-nowrap filter-pill cursor-pointer ${
                            active
                              ? 'bg-midnight-mouth text-daylight'
                              : 'text-midnight-mouth/80 hover:bg-paper'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    aria-pressed={studentFriendlyOnly}
                    onClick={() => {
                      const next = !studentFriendlyOnly;
                      setStudentFriendlyOnly(next);
                      syncUrl({ student: next });
                    }}
                    className={`inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 min-h-[25px] whitespace-nowrap filter-pill cursor-pointer border ${
                      studentFriendlyOnly
                        ? 'bg-grass-green text-[#101014] border-midnight-mouth/15'
                        : 'bg-daylight/75 text-midnight-mouth border-midnight-mouth/10 hover:bg-grass-green/40'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" aria-hidden="true" />
                    <span>Students</span>
                  </button>
                </>
              )}

              <label htmlFor="cat-card-filter" className="sr-only">
                Card rule
              </label>
              <select
                id="cat-card-filter"
                value={cardFilter}
                onChange={(e) => {
                  const next = e.target.value as RequirementState | 'all';
                  setCardFilter(next);
                  syncUrl({ card: next });
                }}
                className="sr-only"
              >
                <option value="all">Any card policy</option>
                <option value="not_required">No credit card required</option>
                <option value="required">Card required</option>
                <option value="unknown">Card rule unknown</option>
              </select>
            </div>

            {/* Right Side: Reset + Sort Switcher */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetCategoryFilters}
                  className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11px] text-[#101014] bg-sunshine-yellow hover:bg-tangerine rounded-full px-2.5 py-0.5 min-h-[25px] shrink-0 filter-pill cursor-pointer border border-midnight-mouth/15"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              )}

              <div className="hidden sm:inline-flex items-center bg-daylight/75 p-0.5 rounded-full border border-midnight-mouth/10 gap-0.5">
                {visibleSortOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        syncUrl({ sort: opt.value });
                      }}
                      className={`inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[10.5px] rounded-full px-2 py-0.5 min-h-[22px] whitespace-nowrap filter-pill cursor-pointer ${
                        active
                          ? 'bg-midnight-mouth text-daylight'
                          : 'text-midnight-mouth/80 hover:bg-paper'
                      }`}
                    >
                      <Icon className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="sm:hidden">
                <FilterDropdown
                  id="cat-sort"
                  label="Sort by"
                  variant="pill"
                  value={sortBy}
                  triggerPrefix="Sort:"
                  minMenuWidth={220}
                  menuTitle="Sort results"
                  onChange={(nextVal) => {
                    const next = nextVal as SortOption;
                    setSortBy(next);
                    syncUrl({ sort: next });
                  }}
                  options={visibleSortOptions.map((opt) => {
                    const Icon = opt.icon;
                    return {
                      value: opt.value,
                      label: opt.label,
                      icon: <Icon className="w-3.5 h-3.5" />,
                    };
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Category Grid directly below the compact combined header */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              data-testid="category-results-heading"
              className="font-[var(--font-wallop)] font-bold text-[17px] sm:text-[19px] tracking-[-0.02em] text-midnight-mouth"
            >
              {activeResultsTitle}
            </h2>
            {sortBy === 'use_case' && selectedSubcategory === 'all' && (
              <span className="inline-flex items-center gap-1 bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-0.5 border border-midnight-mouth/10">
                <Layers className="w-3 h-3" aria-hidden="true" />
                <span>Sorted by Use Case ({activeSubtypes.length} subtypes)</span>
              </span>
            )}
          </div>
          {searchQuery.trim() && (
            <span className="font-[var(--font-inter)] text-[12px] text-ink/75">
              Matching &ldquo;{searchQuery.trim()}&rdquo;
            </span>
          )}
        </div>

        {isInitialLoading && displayedOffers.length === 0 ? (
          <CardGridSkeleton
            count={6}
            columnsClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4"
          />
        ) : error && displayedOffers.length === 0 ? (
          <OffersErrorState message={error} onRetry={retry} />
        ) : !isInitialLoading && !isTransitioning && displayedOffers.length === 0 ? (
          <div className="bg-daylight rounded-[20px] p-7 sm:p-8 text-center flex flex-col items-center gap-3 card-enter">
            <p className="font-[var(--font-inter)] text-[14px] sm:text-[15px] text-ink/85">
              No resources in {category.name} match your search or subtype filters yet.
            </p>
            <button
              type="button"
              onClick={resetCategoryFilters}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] cursor-pointer spring-pill"
            >
              Show all in {category.shortName}
            </button>
          </div>
        ) : (
          <>
            <div
              data-testid="category-results-grid"
              aria-busy={isTransitioning}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 transition-opacity duration-150 ${
                isTransitioning ? 'opacity-75' : 'opacity-100'
              }`}
            >
              {displayedOffers.map((offer, idx) => (
                <ResourceCard
                  key={offer.identity.slug}
                  offer={offer}
                  onNavigate={onNavigate}
                  priority={idx < 4}
                />
              ))}
            </div>
            <InfiniteLoadMore
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
              remainingCount={Math.max(0, totalFilteredCount - displayedOffers.length)}
              onLoadMore={loadMore}
            />
          </>
        )}
      </section>

      {/* Related Categories */}
      <section className="flex flex-col gap-3.5 sm:gap-4 pt-2">
        <h2 className="font-[var(--font-wallop)] font-extrabold text-[20px] sm:text-[26px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
          Related categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {relatedCategories.map((cat) => (
            <CategoryTile
              key={cat.slug}
              category={cat}
              count={counts[cat.slug] ?? 0}
              onNavigate={onNavigate}
              detailed
            />
          ))}
        </div>
      </section>
    </div>
  );
}
