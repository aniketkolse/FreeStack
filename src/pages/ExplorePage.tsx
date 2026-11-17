import React, { useEffect, useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowDownAZ,
  ChevronDown,
  Home,
  Layers,
  CreditCard,
  Tag,
  Cpu,
  GraduationCap,
} from 'lucide-react';
import { CATEGORIES, OFFERS, getCategoryBySlug, getCategoryCounts } from '../lib/data/resources';
import {
  countActiveFilters,
  DEFAULT_FILTER_STATE,
  filterAndSortOffers,
  filtersToSearchParams,
  searchParamsToFilters,
} from '../lib/filters/filterOffers';
import type { NavigateOptions } from '../lib/router/useRouter';
import type {
  CategorySlug,
  FilterState,
  PricingModel,
  RequirementState,
  ResourceType,
  SortOption,
  StudentAccessState,
  VerificationStatus,
} from '../types/resource';
import {
  formatPricingModel,
  formatResourceType,
  formatVerificationStatus,
} from '../lib/utils/formatters';
import { SearchBar } from '../components/search/SearchBar';
import { ResourceCard } from '../components/offers/ResourceCard';
import { CategoryStickerIcon, getCategoryBgClass } from '../components/illustrations/TocaStickers';
import { FilterDropdown, type FilterDropdownOption } from '../components/ui/FilterDropdown';

interface ExplorePageProps {
  searchParams: URLSearchParams;
  onNavigate: (path: string, options?: NavigateOptions) => void;
  mode?: 'explore' | 'search';
}

const PRICING_OPTIONS: PricingModel[] = [
  'completely_free',
  'free_tier',
  'freemium',
  'open_source',
  'free_credits',
  'student_exclusive',
  'free_learning_material',
  'free_trial',
];

const RESOURCE_TYPE_OPTIONS: ResourceType[] = [
  'ai_model',
  'mcp_server',
  'api',
  'cloud_service',
  'developer_tool',
  'software',
  'course',
  'book',
  'documentation',
  'roadmap',
  'practice',
  'student_benefit',
  'dataset',
  'other',
];

const QUICK_RESOURCE_TYPES: Array<{ value: ResourceType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'ai_model', label: 'AI Models' },
  { value: 'mcp_server', label: 'MCP Servers' },
  { value: 'api', label: 'APIs' },
  { value: 'cloud_service', label: 'Cloud' },
  { value: 'developer_tool', label: 'Dev Tools' },
  { value: 'software', label: 'Software' },
  { value: 'course', label: 'Courses' },
  { value: 'student_benefit', label: 'Student' },
];

const SORT_ITEMS: Array<{ value: SortOption; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'relevance', label: 'Relevance', shortLabel: 'Relevance', icon: Sparkles },
  { value: 'recently_verified', label: 'Recently verified', shortLabel: 'Verified', icon: ShieldCheck },
  { value: 'recently_added', label: 'Recently added', shortLabel: 'Newest', icon: Clock },
  { value: 'name_asc', label: 'Name (A–Z)', shortLabel: 'A–Z', icon: ArrowDownAZ },
];

const PAGE_SIZE = 12;

export function ExplorePage({
  searchParams,
  onNavigate,
  mode = 'explore',
}: ExplorePageProps) {
  const filters = useMemo(() => searchParamsToFilters(searchParams), [searchParams]);
  const counts = useMemo(() => getCategoryCounts(), []);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  const pricingCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of OFFERS) {
      const pm = o.classification.pricing_model;
      map[pm] = (map[pm] ?? 0) + 1;
    }
    return map;
  }, []);

  const categoryDropdownOptions = useMemo<FilterDropdownOption[]>(() => {
    return [
      {
        value: 'all',
        label: 'All categories',
        count: OFFERS.length,
        icon: <Layers className="w-3.5 h-3.5 text-midnight-mouth" aria-hidden="true" />,
        iconBgClass: 'bg-paper border border-midnight-mouth/12',
      },
      ...CATEGORIES.map((cat) => ({
        value: cat.slug,
        label: cat.name,
        count: counts[cat.slug] ?? 0,
        icon: <CategoryStickerIcon slug={cat.slug} className="w-4.5 h-4.5" />,
        iconBgClass: `${getCategoryBgClass(cat.color)} border border-midnight-mouth/10`,
      })),
    ];
  }, [counts]);

  const resourceTypeDropdownOptions = useMemo<FilterDropdownOption[]>(() => {
    return [
      { value: 'all', label: 'All resource types' },
      ...RESOURCE_TYPE_OPTIONS.map((rt) => ({
        value: rt,
        label: formatResourceType(rt),
      })),
    ];
  }, []);

  const statusDropdownOptions = useMemo<FilterDropdownOption[]>(() => {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'verified', label: 'Verified' },
      { value: 'needs_review', label: 'Needs review' },
      { value: 'unverified', label: 'Unverified' },
      { value: 'expired', label: 'Expired' },
    ];
  }, []);

  useEffect(() => {
    setDraftFilters(filters);
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

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

  const updateFilters = (
    updater: FilterState | ((prev: FilterState) => FilterState),
    basePath = mode === 'search' ? '/search' : '/explore'
  ) => {
    const next = typeof updater === 'function' ? updater(filters) : updater;
    const qs = filtersToSearchParams(next).toString();
    const target = qs ? `${basePath}?${qs}` : basePath;
    onNavigate(target, { replace: true, scrollTop: false });
  };

  const results = useMemo(() => filterAndSortOffers(OFFERS, filters), [filters]);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);
  const displayedResults = results.slice(0, visibleCount);
  const activeCategoryObj =
    filters.category !== 'all' ? getCategoryBySlug(filters.category) : undefined;

  // Animation key so cards smoothly animate whenever filter or sort state changes
  const transitionKey = useMemo(
    () =>
      `${filters.category}-${filters.subcategory}-${filters.resourceType}-${filters.cardRequired}-${filters.studentAccess}-${filters.sortBy}-${filters.query}-${filters.pricingModels.join(',')}`,
    [filters]
  );

  const togglePricingType = (
    state: FilterState,
    setFn: (next: FilterState) => void,
    type: PricingModel
  ) => {
    setFn({
      ...state,
      pricingModels: state.pricingModels.includes(type)
        ? state.pricingModels.filter((t) => t !== type)
        : [...state.pricingModels, type],
    });
  };

  const resetAll = () => {
    onNavigate('/explore', { replace: true, scrollTop: false });
    setDrawerOpen(false);
  };

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (filters.query.trim()) {
    activeChips.push({
      key: 'q',
      label: `"${filters.query.trim()}"`,
      onClear: () => updateFilters((p) => ({ ...p, query: '' })),
    });
  }
  if (filters.category !== 'all') {
    activeChips.push({
      key: 'cat',
      label: activeCategoryObj?.name ?? filters.category,
      onClear: () => updateFilters((p) => ({ ...p, category: 'all', subcategory: 'all' })),
    });
  }
  if (filters.subcategory !== 'all') {
    activeChips.push({
      key: 'sub',
      label: filters.subcategory,
      onClear: () => updateFilters((p) => ({ ...p, subcategory: 'all' })),
    });
  }
  if (filters.cardRequired !== 'all') {
    activeChips.push({
      key: 'card',
      label:
        filters.cardRequired === 'not_required'
          ? 'No card required'
          : filters.cardRequired === 'required'
          ? 'Card required'
          : 'Card unknown',
      onClear: () => updateFilters((p) => ({ ...p, cardRequired: 'all' })),
    });
  }
  if (filters.studentAccess !== 'all') {
    activeChips.push({
      key: 'student',
      label: `Student: ${filters.studentAccess.replace('_', ' ')}`,
      onClear: () => updateFilters((p) => ({ ...p, studentAccess: 'all' })),
    });
  }
  if (filters.resourceType !== 'all') {
    activeChips.push({
      key: 'type',
      label: formatResourceType(filters.resourceType),
      onClear: () => updateFilters((p) => ({ ...p, resourceType: 'all' })),
    });
  }
  if (filters.region !== 'all') {
    activeChips.push({
      key: 'region',
      label: `Region: ${filters.region}`,
      onClear: () => updateFilters((p) => ({ ...p, region: 'all' })),
    });
  }
  if (filters.verificationStatus !== 'all') {
    activeChips.push({
      key: 'status',
      label: formatVerificationStatus(filters.verificationStatus),
      onClear: () => updateFilters((p) => ({ ...p, verificationStatus: 'all' })),
    });
  }
  for (const model of filters.pricingModels) {
    activeChips.push({
      key: `pricing-${model}`,
      label: formatPricingModel(model),
      onClear: () =>
        updateFilters((p) => ({
          ...p,
          pricingModels: p.pricingModels.filter((m) => m !== model),
        })),
    });
  }

  const renderFilterControls = (
    current: FilterState,
    setCurrent: (next: FilterState) => void,
    idPrefix: string
  ) => {
    const selectedCategory =
      current.category !== 'all' ? getCategoryBySlug(current.category) : undefined;

    return (
      <div className="flex flex-col gap-3">
        {/* Section 1: Category & Subcategory Sub-Options */}
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2.5 border border-midnight-mouth/6">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`${idPrefix}-category`}
              className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
            >
              <Layers className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>Category &amp; Sub-Options</span>
            </label>
            {current.category !== 'all' && (
              <button
                type="button"
                onClick={() => setCurrent({ ...current, category: 'all', subcategory: 'all' })}
                className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
              >
                All
              </button>
            )}
          </div>

          <FilterDropdown
            id={`${idPrefix}-category`}
            label="Category"
            value={current.category}
            options={categoryDropdownOptions}
            menuTitle="Browse by category"
            menuSubtitle={`${CATEGORIES.length} stacks`}
            minMenuWidth={286}
            maxMenuHeight={380}
            onChange={(val) =>
              setCurrent({
                ...current,
                category: val as CategorySlug | 'all',
                subcategory: 'all',
              })
            }
          />

          {/* Interactive Subcategory Sub-Options when a category is selected */}
          {selectedCategory && selectedCategory.subcategories.length > 0 ? (
            <div className="flex flex-col gap-1.5 pt-0.5 chip-enter">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${idPrefix}-subcategory`}
                  className="font-[var(--font-inter)] font-semibold text-[11.5px] text-ink/75"
                >
                  {selectedCategory.shortName} subcategories:
                </label>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setCurrent({ ...current, subcategory: 'all' })}
                  className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-2.5 py-1 min-h-[26px] filter-pill cursor-pointer ${
                    current.subcategory === 'all'
                      ? 'bg-midnight-mouth text-daylight shadow-xs'
                      : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/50'
                  }`}
                >
                  All
                </button>
                {selectedCategory.subcategories.map((sub) => {
                  const active = current.subcategory === sub.name;
                  return (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() =>
                        setCurrent({
                          ...current,
                          subcategory: active ? 'all' : sub.name,
                        })
                      }
                      className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-2.5 py-1 min-h-[26px] filter-pill cursor-pointer ${
                        active
                          ? 'bg-midnight-mouth text-daylight shadow-xs'
                          : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/50'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
              <select
                id={`${idPrefix}-subcategory`}
                value={current.subcategory}
                onChange={(e) => setCurrent({ ...current, subcategory: e.target.value })}
                className="sr-only"
              >
                <option value="all">All in {selectedCategory.shortName}</option>
                {selectedCategory.subcategories.map((sub) => (
                  <option key={sub.slug} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pt-0.5">
              <span className="font-[var(--font-inter)] text-[11px] text-ink/65">
                Popular stacks:
              </span>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.filter((c) => c.popular).map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() =>
                      setCurrent({
                        ...current,
                        category: cat.slug,
                        subcategory: 'all',
                      })
                    }
                    className="font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-1 min-h-[25px] bg-daylight text-midnight-mouth hover:bg-sunshine-yellow/60 filter-pill cursor-pointer"
                  >
                    {cat.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Payment Card Rule Sub-Options */}
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6">
          <label
            htmlFor={`${idPrefix}-card`}
            className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
          >
            <CreditCard className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
            <span>Payment Card Rule</span>
          </label>
          <div className="grid grid-cols-2 gap-1 bg-daylight p-1 rounded-[12px] border border-midnight-mouth/8">
            {[
              { val: 'all', label: 'Any Rule' },
              { val: 'not_required', label: 'No Card' },
              { val: 'required', label: 'Card Req.' },
              { val: 'unknown', label: 'Unknown' },
            ].map((opt) => {
              const active = current.cardRequired === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() =>
                    setCurrent({
                      ...current,
                      cardRequired: opt.val as RequirementState | 'all',
                    })
                  }
                  className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-[9px] py-1.5 px-2 min-h-[30px] filter-pill cursor-pointer ${
                    active
                      ? 'bg-midnight-mouth text-daylight shadow-xs'
                      : 'text-midnight-mouth/80 hover:bg-paper'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <select
            id={`${idPrefix}-card`}
            value={current.cardRequired}
            onChange={(e) =>
              setCurrent({
                ...current,
                cardRequired: e.target.value as RequirementState | 'all',
              })
            }
            className="sr-only"
          >
            <option value="all">Any card requirement</option>
            <option value="not_required">No credit card required</option>
            <option value="required">Credit card required</option>
            <option value="unknown">Unknown (explicitly unconfirmed)</option>
          </select>
        </div>

        {/* Section 3: Resource Type Sub-Options */}
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`${idPrefix}-resource-type`}
              className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
            >
              <Cpu className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>Resource Type</span>
            </label>
            {current.resourceType !== 'all' && (
              <button
                type="button"
                onClick={() => setCurrent({ ...current, resourceType: 'all' })}
                className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Interactive Resource Type Sub-Option Pills */}
          <div className="flex flex-wrap gap-1">
            {QUICK_RESOURCE_TYPES.map((rt) => {
              const active = current.resourceType === rt.value;
              return (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() =>
                    setCurrent({
                      ...current,
                      resourceType: active && rt.value !== 'all' ? 'all' : rt.value,
                    })
                  }
                  className={`font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-2.5 py-1 min-h-[26px] filter-pill cursor-pointer ${
                    active
                      ? 'bg-midnight-mouth text-daylight shadow-xs'
                      : 'bg-daylight text-midnight-mouth/85 hover:bg-sunshine-yellow/50'
                  }`}
                >
                  {rt.label}
                </button>
              );
            })}
          </div>

          <div className="pt-0.5">
            <FilterDropdown
              id={`${idPrefix}-resource-type`}
              label="Resource type"
              value={current.resourceType}
              options={resourceTypeDropdownOptions}
              menuTitle="Resource format"
              size="sm"
              minMenuWidth={230}
              maxMenuHeight={300}
              onChange={(val) =>
                setCurrent({
                  ...current,
                  resourceType: val as ResourceType | 'all',
                })
              }
            />
          </div>
        </div>

        {/* Section 4: Pricing / Access Classification Sub-Options */}
        <fieldset className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2 border border-midnight-mouth/6">
          <div className="flex items-center justify-between gap-2">
            <legend className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth">
              <Tag className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>Pricing Sub-Options</span>
            </legend>
            {current.pricingModels.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrent({ ...current, pricingModels: [] })}
                className="font-[var(--font-wallop)] font-semibold text-[11px] text-midnight-mouth/70 hover:text-midnight-mouth underline cursor-pointer"
              >
                Clear ({current.pricingModels.length})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {PRICING_OPTIONS.map((type) => {
              const checked = current.pricingModels.includes(type);
              const count = pricingCounts[type] ?? 0;
              return (
                <button
                  key={type}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => togglePricingType(current, setCurrent, type)}
                  className={`flex items-center justify-between gap-2 rounded-[10px] px-2.5 py-1.5 min-h-[33px] text-left filter-pill cursor-pointer border ${
                    checked
                      ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
                      : 'bg-daylight text-midnight-mouth border-midnight-mouth/8 hover:bg-sunshine-yellow/40'
                  }`}
                >
                  <span className="font-[var(--font-inter)] font-medium text-[12px] truncate">
                    {formatPricingModel(type)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <span className="font-[var(--font-mono)] text-[10.5px] opacity-65 tabular-nums">
                      {count}
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 transition-transform ${
                        checked
                          ? 'bg-grass-green text-[#101014] scale-100'
                          : 'border border-midnight-mouth/25 scale-90'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Section 5: Student Eligibility & Verification Sub-Options */}
        <div className="bg-paper/75 rounded-[15px] p-3 flex flex-col gap-2.5 border border-midnight-mouth/6">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${idPrefix}-student`}
              className="inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[12.5px] text-midnight-mouth"
            >
              <GraduationCap className="w-3.5 h-3.5 text-midnight-mouth/80" aria-hidden="true" />
              <span>Student Eligibility</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { val: 'all', label: 'All' },
                { val: 'eligible', label: 'Everyone + Students' },
                { val: 'exclusive', label: 'Student Only' },
              ].map((opt) => {
                const active = current.studentAccess === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() =>
                      setCurrent({
                        ...current,
                        studentAccess: opt.val as StudentAccessState | 'all',
                      })
                    }
                    className={`font-[var(--font-wallop)] font-semibold text-[11px] rounded-full px-2.5 py-1 min-h-[26px] filter-pill cursor-pointer ${
                      active
                        ? 'bg-midnight-mouth text-daylight shadow-xs'
                        : 'bg-daylight text-midnight-mouth/85 hover:bg-grass-green/45'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <select
              id={`${idPrefix}-student`}
              value={current.studentAccess}
              onChange={(e) =>
                setCurrent({
                  ...current,
                  studentAccess: e.target.value as StudentAccessState | 'all',
                })
              }
              className="sr-only"
            >
              <option value="all">All audiences</option>
              <option value="eligible">Open to everyone &amp; students</option>
              <option value="exclusive">Student exclusive only</option>
              <option value="not_eligible">Not eligible for students</option>
              <option value="unknown">Eligibility unknown</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 pt-1 border-t border-midnight-mouth/8">
            <label
              htmlFor={`${idPrefix}-status`}
              className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[12px] text-midnight-mouth"
            >
              <ShieldCheck className="w-3 h-3 text-midnight-mouth/75" aria-hidden="true" />
              <span>Status</span>
            </label>
            <FilterDropdown
              id={`${idPrefix}-status`}
              label="Verification status"
              value={current.verificationStatus}
              options={statusDropdownOptions}
              size="sm"
              minMenuWidth={200}
              maxMenuHeight={240}
              onChange={(val) =>
                setCurrent({
                  ...current,
                  verificationStatus: val as VerificationStatus | 'all',
                })
              }
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 sm:pb-16 flex flex-col gap-4 sm:gap-6">
      {/* Compact Sky Blue Header Slab */}
      <section className="bg-sky-blue rounded-[22px] sm:rounded-[26px] p-4 sm:p-7 md:p-8 text-center flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13px] rounded-full px-3.5 py-1.5 min-h-[32px] inline-flex items-center gap-1.5 spring-pill"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Home</span>
          </a>
        </div>
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[36px] lg:text-[44px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
          {mode === 'search' && filters.query
            ? `Results for "${filters.query}"`
            : 'Explore FreeStack'}
        </h1>
        <p className="font-[var(--font-inter)] text-[14px] sm:text-[15px] leading-[1.45] text-ink max-w-xl">
          Instant, URL-synced filtering across AI Models, MCP servers, APIs, Frontend &amp; Design tools, pricing rules, and card requirements.
        </p>
        <div className="w-full pt-0.5">
          <SearchBar
            initialQuery={filters.query}
            onChangeQuery={(q) => updateFilters((prev) => ({ ...prev, query: q }))}
            onSubmitQuery={(q) => updateFilters((prev) => ({ ...prev, query: q }))}
          />
        </div>
      </section>

      {/* Smooth Horizontal Quick-Category Pill Rail */}
      <div
        role="tablist"
        aria-label="Quick category filter"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filters.category === 'all'}
          onClick={() => updateFilters((p) => ({ ...p, category: 'all', subcategory: 'all' }))}
          className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-3.5 py-2 min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer inline-flex items-center gap-1.5 ${
            filters.category === 'all'
              ? 'bg-midnight-mouth text-daylight shadow-xs'
              : 'bg-daylight text-midnight-mouth hover:bg-sunshine-yellow'
          }`}
        >
          <span>All Stacks</span>
          <span className="text-[11px] opacity-75 tabular-nums">({OFFERS.length})</span>
        </button>

        {CATEGORIES.map((cat) => {
          const active = filters.category === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                updateFilters((p) => ({
                  ...p,
                  category: active ? 'all' : cat.slug,
                  subcategory: 'all',
                }))
              }
              className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full pl-2.5 pr-3.5 py-1.5 min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer inline-flex items-center gap-1.5 ${
                active
                  ? 'bg-midnight-mouth text-daylight shadow-xs'
                  : 'bg-daylight text-midnight-mouth hover:bg-sunshine-yellow'
              }`}
            >
              <CategoryStickerIcon slug={cat.slug} className="w-4 h-4 shrink-0" />
              <span>{cat.name}</span>
              <span className="text-[11px] opacity-70 tabular-nums">({counts[cat.slug] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Filter Drawer Trigger + Quick Toggles */}
      <div className="lg:hidden flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            data-testid="mobile-filter-trigger"
            onClick={() => {
              setDraftFilters(filters);
              setDrawerOpen(true);
            }}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center gap-1.5 shrink-0 spring-pill cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              updateFilters((p) => ({
                ...p,
                cardRequired: p.cardRequired === 'not_required' ? 'all' : 'not_required',
              }))
            }
            className={`font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-2 min-h-[38px] inline-flex items-center gap-1.5 shrink-0 filter-pill cursor-pointer ${
              filters.cardRequired === 'not_required'
                ? 'bg-grass-green text-[#101014]'
                : 'bg-daylight text-midnight-mouth'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>No Card</span>
          </button>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-2 min-h-[38px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Filter Sidebar + Results Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Desktop Sticky Filter Sidebar */}
        <aside
          aria-label="Resource filters"
          className="hidden lg:flex lg:col-span-3 lg:sticky lg:top-[82px] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar bg-daylight rounded-[22px] p-4 xl:p-5 flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-midnight-mouth/10">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-midnight-mouth" aria-hidden="true" />
              <h2 className="font-[var(--font-wallop)] font-bold text-[17px] leading-[1.2] text-midnight-mouth">
                Filters
              </h2>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[12px] text-midnight-mouth bg-paper rounded-full px-2.5 py-1 hover:bg-sunshine-yellow transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset ({activeCount})</span>
              </button>
            )}
          </div>

          {renderFilterControls(filters, (next) => updateFilters(next), 'desktop-filter')}
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 flex flex-col gap-4 min-w-0">
          {/* Smooth Results Toolbar & Segmented Sort Bar */}
          <div className="bg-daylight rounded-[18px] sm:rounded-[20px] px-3.5 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <p
                data-testid="explore-results-count"
                className="font-[var(--font-wallop)] font-bold text-[14px] sm:text-[15px] text-midnight-mouth tabular-nums"
              >
                Showing {displayedResults.length} of {results.length}{' '}
                {results.length === 1 ? 'resource' : 'resources'}
              </p>

              {/* Desktop One-Click No-Card Pill */}
              <button
                type="button"
                onClick={() =>
                  updateFilters((p) => ({
                    ...p,
                    cardRequired: p.cardRequired === 'not_required' ? 'all' : 'not_required',
                  }))
                }
                className={`hidden sm:inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3 py-1 min-h-[28px] filter-pill cursor-pointer ${
                  filters.cardRequired === 'not_required'
                    ? 'bg-grass-green text-[#101014]'
                    : 'bg-paper text-midnight-mouth hover:bg-sunshine-yellow/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>No card required</span>
              </button>
            </div>

            {/* Smooth Animated Segmented Sort Control + Synced Native Select */}
            <div className="flex items-center gap-2">
              <span className="font-[var(--font-inter)] text-[12.5px] text-ink/70 hidden xl:inline">
                Sort:
              </span>

              {/* Segmented Sort Pills */}
              <div
                role="group"
                aria-label="Sort resources"
                className="hidden sm:inline-flex items-center bg-paper p-1 rounded-full border border-midnight-mouth/8 gap-0.5"
              >
                {SORT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = filters.sortBy === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        updateFilters((prev) => ({
                          ...prev,
                          sortBy: item.value,
                        }))
                      }
                      className={`inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3 py-1.5 min-h-[30px] filter-pill cursor-pointer ${
                        active
                          ? 'bg-midnight-mouth text-daylight shadow-xs'
                          : 'text-midnight-mouth/80 hover:text-midnight-mouth hover:bg-daylight'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{item.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile / Screen-Reader Synced Sort Select */}
              <div className="relative sm:sr-only">
                <label htmlFor="sort-offers" className="sr-only">
                  Sort by
                </label>
                <select
                  id="sort-offers"
                  value={filters.sortBy}
                  onChange={(e) =>
                    updateFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as SortOption,
                    }))
                  }
                  className="appearance-none bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13px] rounded-full pl-3.5 pr-8 py-1.5 min-h-[34px] border border-midnight-mouth/10 cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="recently_verified">Recently verified</option>
                  <option value="recently_added">Recently added</option>
                  <option value="name_asc">Name (A–Z)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-midnight-mouth/70 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Active Filter Chips with Pop Animation */}
          {activeChips.length > 0 && (
            <div
              aria-label="Active filters"
              className="flex flex-wrap items-center gap-1.5"
            >
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  className="chip-enter bg-sunshine-yellow hover:bg-tangerine text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3 py-1 min-h-[30px] inline-flex items-center gap-1.5 filter-pill cursor-pointer"
                >
                  <span>{chip.label}</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              ))}
              {activeChips.length > 1 && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="font-[var(--font-wallop)] font-semibold text-[12px] text-midnight-mouth/80 hover:text-midnight-mouth underline underline-offset-4 px-2 py-1 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Resource Grid or Empty State */}
          {results.length === 0 ? (
            <div className="bg-daylight rounded-[22px] p-8 sm:p-10 text-center flex flex-col items-center gap-3 card-enter">
              <h3 className="font-[var(--font-wallop)] font-bold text-[20px] sm:text-[24px] text-midnight-mouth">
                No matching free resources
              </h3>
              <p className="font-[var(--font-inter)] text-[14px] sm:text-[15px] text-ink/80 max-w-md">
                Try clearing a filter or searching with broader keywords like &ldquo;MCP&rdquo;, &ldquo;LLM&rdquo;, &ldquo;PostgreSQL&rdquo;, or &ldquo;Tailwind&rdquo;.
              </p>
              <button
                type="button"
                onClick={resetAll}
                className="mt-1 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 min-h-[40px] spring-pill cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              <div
                key={transitionKey}
                data-testid="explore-results-grid"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4"
              >
                {displayedResults.map((offer) => (
                  <ResourceCard
                    key={offer.identity.id}
                    offer={offer}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>

              {visibleCount < results.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="w-full sm:w-auto bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-6 py-3 min-h-[42px] spring-pill cursor-pointer"
                  >
                    Load more resources ({results.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Accessible Bottom Filter Drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter resources"
          className="fixed inset-0 z-50 bg-[#101014]/70 dark:bg-black/75 flex items-end lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="bg-daylight w-full rounded-t-[24px] p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[86dvh] flex flex-col gap-3.5 drawer-enter">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-midnight-mouth/10">
              <h2 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                Filter resources
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters drawer"
                className="w-9 h-9 rounded-full bg-paper text-midnight-mouth inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {renderFilterControls(draftFilters, setDraftFilters, 'mobile-filter')}
            </div>

            <div className="pt-2.5 border-t border-midnight-mouth/10 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(DEFAULT_FILTER_STATE);
                  resetAll();
                }}
                className="flex-1 bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-4 py-2.5 min-h-[42px] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  updateFilters(draftFilters);
                  setDrawerOpen(false);
                }}
                className="flex-[2] bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-4 py-2.5 min-h-[42px] cursor-pointer"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
