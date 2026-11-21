import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Layers,
  SlidersHorizontal,
  X,
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
import { ErrorFallbackPage } from '../components/layout/ErrorFallbackPage';
import { SearchBar } from '../components/search/SearchBar';
import {
  CategoryFilterSidebar,
  MCP_LANGUAGE_OPTIONS,
  MCP_OS_OPTIONS,
  MCP_SCOPE_OPTIONS,
} from '../components/offers/CategoryFilterSidebar';
import {
  AI_CONTEXT_FILTER_OPTIONS,
  AI_MODALITY_OPTIONS,
  type AiModalityId,
} from '../lib/ai/aiModelMetadata';
import { FilterScrollArea } from '../components/ui/FilterScrollArea';

interface CategoryDetailPageProps {
  slug: string;
  searchParams?: URLSearchParams;
  onNavigate: (path: string, options?: NavigateOptions) => void;
  onBack?: (fallbackPath?: string) => void;
  previousPath?: string | null;
}

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
  const defaultSort: SortOption = 'relevance';

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
  const [studentVerificationFilter, setStudentVerificationFilter] = useState<
    'all' | 'exclusive' | 'eligible'
  >((searchParams?.get('verify') as 'all' | 'exclusive' | 'eligible') || 'all');
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
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
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
    const nextDefaultSort: SortOption = 'relevance';
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
    setStudentVerificationFilter(
      (searchParams?.get('verify') as 'all' | 'exclusive' | 'eligible') || 'all'
    );
    setMcpOfficialOnly(searchParams?.get('official') === '1');
    setMcpScope(searchParams?.get('scope') || 'all');
    setMcpLang(searchParams?.get('lang') || 'all');
    setMcpOs(searchParams?.get('os') || 'all');
    setAiModality((searchParams?.get('modality') as AiModalityId | 'all') || 'all');
    setAiMinContext(searchParams?.get('ctx') || 'all');
  }, [slug, searchParams, category, primaryTypeGroups]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

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

  const allPopulatedSubcategories = useMemo(() => {
    if (categorySummary?.allPopulatedSubcategories) {
      return categorySummary.allPopulatedSubcategories;
    }
    if (!category) return [];
    return category.subcategories.map((sub) => ({ ...sub, count: 0 }));
  }, [category, categorySummary]);

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

  const handleSelectSubcategory = (nextSub: string) => {
    if (usesMacroGroups) {
      const ownerType =
        nextSub !== 'all'
          ? findPrimaryTypeForSubcategory(primaryTypeGroups, nextSub)
          : selectedTypeGroup;
      setSelectedSubcategory(nextSub);
      if (nextSub !== 'all' && ownerType && selectedTypeGroup === 'all') {
        setSelectedTypeGroup(ownerType);
      }
      syncUrl({
        sub: nextSub,
        type:
          nextSub !== 'all' && ownerType && selectedTypeGroup === 'all'
            ? ownerType
            : selectedTypeGroup,
      });
    } else {
      setSelectedSubcategory(nextSub);
      setSelectedTagSubtype('all');
      syncUrl({ sub: nextSub, subtype: 'all' });
    }
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
    setSortBy(defaultSort);
    setDrawerOpen(false);
    onNavigate(`/category/${slug}`, { replace: true, scrollTop: false });
  };

  if (!category) {
    const notFoundBackMeta = getBackNavigationMeta(previousPath, '/categories', {
      getCategoryName: (catSlug) => getCategoryBySlug(catSlug)?.name,
      getOfferName: (offerSlug) => getOfferBySlug(offerSlug)?.identity.name,
    });
    return (
      <ErrorFallbackPage
        explicitVariant="not_found"
        notFound
        onNavigate={onNavigate}
        onBack={() => {
          if (onBack) {
            onBack('/categories');
          } else {
            onNavigate(notFoundBackMeta.targetHref);
          }
        }}
        backLabel={notFoundBackMeta.label}
        backHref={notFoundBackMeta.targetHref}
      />
    );
  }

  const bgClass = getCategoryBgClass(category.color);
  const relatedCategories = CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 3);
  const sampleNames = categorySummary?.sampleNames ?? '';

  const displayCount =
    isInitialLoading && !hasActiveFilters ? totalInCategoryCount : totalFilteredCount;

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

  // Build Explore-style active filter chips
  const activeChips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (searchQuery.trim()) {
    activeChips.push({
      key: 'q',
      label: `"${searchQuery.trim()}"`,
      onClear: () => {
        setSearchQuery('');
        syncUrl({ q: '' });
      },
    });
  }
  if (usesMacroGroups && activePrimaryGroup) {
    activeChips.push({
      key: 'type',
      label: activePrimaryGroup.label,
      onClear: () => {
        setSelectedTypeGroup('all');
        setSelectedSubcategory('all');
        syncUrl({ type: 'all', sub: 'all' });
      },
    });
  }
  if (selectedSubcategory !== 'all') {
    activeChips.push({
      key: 'sub',
      label: selectedSubcategory,
      onClear: () => {
        setSelectedSubcategory('all');
        syncUrl({ sub: 'all' });
      },
    });
  }
  if (selectedTagSubtype !== 'all') {
    const tagObj = standardCategoryTagSubtypes.find((t) => t.tag === selectedTagSubtype);
    activeChips.push({
      key: 'subtype',
      label: tagObj?.label ?? selectedTagSubtype,
      onClear: () => {
        setSelectedTagSubtype('all');
        syncUrl({ subtype: 'all' });
      },
    });
  }
  if (aiModality !== 'all') {
    const modObj = AI_MODALITY_OPTIONS.find((m) => m.id === aiModality);
    activeChips.push({
      key: 'modality',
      label: modObj?.label ?? aiModality,
      onClear: () => {
        setAiModality('all');
        syncUrl({ modality: 'all' });
      },
    });
  }
  if (aiMinContext !== 'all') {
    const ctxObj = AI_CONTEXT_FILTER_OPTIONS.find((c) => c.value === aiMinContext);
    activeChips.push({
      key: 'ctx',
      label: ctxObj?.label ?? aiMinContext,
      onClear: () => {
        setAiMinContext('all');
        syncUrl({ ctx: 'all' });
      },
    });
  }
  if (mcpOfficialOnly) {
    activeChips.push({
      key: 'official',
      label: 'Official MCP',
      onClear: () => {
        setMcpOfficialOnly(false);
        syncUrl({ official: false });
      },
    });
  }
  if (mcpScope !== 'all') {
    const scopeObj = MCP_SCOPE_OPTIONS.find((s) => s.value === mcpScope);
    activeChips.push({
      key: 'scope',
      label: `Scope: ${scopeObj?.label ?? mcpScope}`,
      onClear: () => {
        setMcpScope('all');
        syncUrl({ scope: 'all' });
      },
    });
  }
  if (mcpLang !== 'all') {
    const langObj = MCP_LANGUAGE_OPTIONS.find((l) => l.value === mcpLang);
    activeChips.push({
      key: 'lang',
      label: langObj?.label ?? mcpLang,
      onClear: () => {
        setMcpLang('all');
        syncUrl({ lang: 'all' });
      },
    });
  }
  if (mcpOs !== 'all') {
    const osObj = MCP_OS_OPTIONS.find((o) => o.value === mcpOs);
    activeChips.push({
      key: 'os',
      label: osObj?.label ?? mcpOs,
      onClear: () => {
        setMcpOs('all');
        syncUrl({ os: 'all' });
      },
    });
  }
  if (studentVerificationFilter !== 'all') {
    activeChips.push({
      key: 'verify',
      label:
        studentVerificationFilter === 'exclusive'
          ? 'Student ID / .edu Req.'
          : 'No Student ID Req.',
      onClear: () => {
        setStudentVerificationFilter('all');
        syncUrl({ verify: 'all' });
      },
    });
  }
  if (cardFilter !== 'all') {
    activeChips.push({
      key: 'card',
      label:
        cardFilter === 'not_required'
          ? 'No card required'
          : cardFilter === 'required'
            ? 'Card required'
            : 'Card unknown',
      onClear: () => {
        setCardFilter('all');
        syncUrl({ card: 'all' });
      },
    });
  }
  for (const model of selectedPricing) {
    activeChips.push({
      key: `pricing-${model}`,
      label: formatPricingModel(model),
      onClear: () => togglePricing(model),
    });
  }
  if (studentFriendlyOnly) {
    activeChips.push({
      key: 'student',
      label: 'Student friendly',
      onClear: () => {
        setStudentFriendlyOnly(false);
        syncUrl({ student: false });
      },
    });
  }

  const sidebarSharedProps = {
    category,
    totalInCategoryCount,
    usesMacroGroups,
    primaryTypeGroups,
    activePrimaryGroup,
    allPopulatedSubcategories,
    standardCategoryTagSubtypes,
    categoryPricingOptions,
    mcpFilterCounts,
    studentVerificationCounts,
    selectedTypeGroup,
    selectedSubcategory,
    selectedTagSubtype,
    cardFilter,
    selectedPricing,
    studentFriendlyOnly,
    studentVerificationFilter,
    mcpOfficialOnly,
    mcpScope,
    mcpLang,
    mcpOs,
    aiModality,
    aiMinContext,
    onSelectTypeGroup: (typeId: string) => {
      setSelectedTypeGroup(typeId);
      setSelectedSubcategory('all');
      syncUrl({ type: typeId, sub: 'all' });
    },
    onSelectSubcategory: handleSelectSubcategory,
    onSelectTagSubtype: (tag: string) => {
      setSelectedTagSubtype(tag);
      syncUrl({ subtype: tag });
    },
    onSelectCardFilter: (card: RequirementState | 'all') => {
      setCardFilter(card);
      syncUrl({ card });
    },
    onTogglePricing: togglePricing,
    onClearPricing: () => {
      setSelectedPricing([]);
      syncUrl({ pricing: [] });
    },
    onToggleStudentFriendly: () => {
      const next = !studentFriendlyOnly;
      setStudentFriendlyOnly(next);
      syncUrl({ student: next });
    },
    onSelectStudentVerification: (val: 'all' | 'exclusive' | 'eligible') => {
      setStudentVerificationFilter(val);
      syncUrl({ verify: val });
    },
    onToggleMcpOfficial: () => {
      const next = !mcpOfficialOnly;
      setMcpOfficialOnly(next);
      syncUrl({ official: next });
    },
    onSelectMcpScope: (scope: string) => {
      setMcpScope(scope);
      syncUrl({ scope });
    },
    onSelectMcpLang: (lang: string) => {
      setMcpLang(lang);
      syncUrl({ lang });
    },
    onSelectMcpOs: (os: string) => {
      setMcpOs(os);
      syncUrl({ os });
    },
    onSelectAiModality: (modality: AiModalityId | 'all') => {
      setAiModality(modality);
      syncUrl({ modality });
    },
    onSelectAiMinContext: (ctx: string) => {
      setAiMinContext(ctx);
      syncUrl({ ctx });
    },
  };

  return (
    <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-8 sm:pb-16 flex flex-col gap-3 sm:gap-5">
      {/* Top Back Button & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <a
            href={backMeta.targetHref}
            data-testid="category-back-btn"
            onClick={handleBackClick}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13.5px] rounded-full px-3 sm:px-4 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[36px] inline-flex items-center gap-1.5 spring-pill shadow-2xs max-w-full"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[180px] sm:max-w-[320px]">{backMeta.label}</span>
          </a>
          <a
            href="/categories"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/categories');
            }}
            className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[13px] rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[36px] inline-flex items-center gap-1.5 spring-pill border border-midnight-mouth/10"
          >
            <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
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

      {/* Compact Category Header Slab (Clean, Focused — No Bloated Filter Wall Inside) */}
      <section
        aria-label="Category header and search"
        className={`${bgClass} rounded-[15px] sm:rounded-[24px] p-3 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3.5 lg:gap-6`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[14px] bg-paper flex items-center justify-center shrink-0 shadow-xs">
            <CategoryStickerIcon slug={category.slug} className="w-5.5 h-5.5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5 sm:gap-1">
            <h1 className="font-[var(--font-wallop)] font-extrabold text-[19px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth truncate">
              {category.name}
            </h1>
            <p className="font-[var(--font-inter)] text-[12px] sm:text-[14px] leading-[1.35] sm:leading-[1.4] text-ink/85 line-clamp-2 sm:truncate">
              {category.description}
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
          <SearchBar
            inputId="category-search-input"
            initialQuery={searchQuery}
            onChangeQuery={(q) => setSearchQuery(q)}
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
      </section>

      {/* Mobile / Tablet Filter Trigger Bar (< lg) */}
      <div className="lg:hidden flex items-center justify-between gap-2">
        <button
          type="button"
          data-testid="mobile-filter-toggle"
          onClick={() => setDrawerOpen(true)}
          className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13.5px] rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[38px] inline-flex items-center gap-1.5 shrink-0 spring-pill cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filters</span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetCategoryFilters}
            className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[12.5px] rounded-full px-3 sm:px-3.5 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[38px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Layout: Sticky Category Filter Sidebar + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-start">
        {/* Desktop Sticky Category Filter Sidebar */}
        <aside
          aria-label={`${category.name} filters`}
          data-testid="systematic-filter-panel"
          className="hidden lg:flex lg:col-span-3 lg:sticky lg:top-[82px] lg:max-h-[calc(100vh-6rem)] bg-daylight rounded-[22px] p-4 xl:p-5 flex-col gap-3.5 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-midnight-mouth/10 shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
              <h2 className="font-[var(--font-wallop)] font-bold text-[17px] leading-[1.2] text-midnight-mouth">
                Filters
              </h2>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetCategoryFilters}
                className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[12px] text-midnight-mouth bg-paper rounded-full px-2.5 py-1 hover:bg-sunshine-yellow transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <FilterScrollArea
            testId="category-filter-scroll"
            className="flex-1"
          >
            <CategoryFilterSidebar idPrefix="desktop" {...sidebarSharedProps} />
          </FilterScrollArea>
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 flex flex-col gap-2.5 sm:gap-3.5 min-w-0">
          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div aria-label="Active filters" className="flex flex-wrap items-center gap-1.5">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  className="chip-enter bg-sunshine-yellow hover:bg-tangerine text-[#101014] font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[12.5px] rounded-full px-2.5 sm:px-3 py-1 min-h-[28px] sm:min-h-[30px] inline-flex items-center gap-1.5 filter-pill cursor-pointer"
                >
                  <span>{chip.label}</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              ))}
              {activeChips.length > 1 && (
                <button
                  type="button"
                  onClick={resetCategoryFilters}
                  className="font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[12px] text-midnight-mouth/80 hover:text-midnight-mouth underline underline-offset-4 px-2 py-1 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Resource Grid, Skeleton, Error, or Empty State */}
          {isInitialLoading && displayedOffers.length === 0 ? (
            <CardGridSkeleton
              count={6}
              columnsClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4"
            />
          ) : error && displayedOffers.length === 0 ? (
            <OffersErrorState message={error} onRetry={retry} onNavigate={onNavigate} />
          ) : !isInitialLoading && !isTransitioning && displayedOffers.length === 0 ? (
            <div className="bg-daylight rounded-[18px] sm:rounded-[22px] p-6 sm:p-10 text-center flex flex-col items-center gap-2.5 sm:gap-3 card-enter">
              <h3 className="font-[var(--font-wallop)] font-bold text-[17.5px] sm:text-[22px] text-midnight-mouth">
                No matching resources in {category.name}
              </h3>
              <p className="font-[var(--font-inter)] text-[13px] sm:text-[14px] text-ink/80 max-w-md">
                Try clearing a filter or searching with broader keywords.
              </p>
              <button
                type="button"
                onClick={resetCategoryFilters}
                className="mt-1 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[13.5px] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] cursor-pointer spring-pill"
              >
                Show all in {category.shortName}
              </button>
            </div>
          ) : (
            <>
              <div
                data-testid="category-results-grid"
                aria-busy={isTransitioning}
                className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 transition-opacity duration-150 ${
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
        </div>
      </div>

      {/* Related Categories */}
      <section className="flex flex-col gap-2.5 sm:gap-4 pt-2 sm:pt-3">
        <h2 className="font-[var(--font-wallop)] font-extrabold text-[18px] sm:text-[26px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
          Related categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
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

      {/* Mobile / Tablet Accessible Bottom Filter Drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Filter ${category.name}`}
          className="fixed inset-0 z-50 bg-[#101014]/70 flex items-end lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="bg-daylight w-full rounded-t-[20px] sm:rounded-t-[24px] p-3.5 sm:p-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[84dvh] sm:max-h-[86dvh] flex flex-col gap-3 sm:gap-3.5 drawer-enter">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-midnight-mouth/10">
              <h2 className="font-[var(--font-wallop)] font-bold text-[16.5px] sm:text-[20px] text-midnight-mouth">
                Filter {category.shortName}
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters drawer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-paper text-midnight-mouth inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <FilterScrollArea
              testId="category-mobile-filter-scroll"
              className="flex-1"
            >
              <CategoryFilterSidebar idPrefix="mobile" {...sidebarSharedProps} />
            </FilterScrollArea>

            <div className="pt-2 sm:pt-2.5 border-t border-midnight-mouth/10 flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={resetCategoryFilters}
                className="flex-1 bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[14px] rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[42px] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-[2] bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[14px] rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[42px] cursor-pointer"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
