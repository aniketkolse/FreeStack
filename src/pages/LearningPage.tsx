import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Home, SlidersHorizontal, ChevronDown } from 'lucide-react';
import {
  useDebouncedValue,
  usePaginatedOffersQuery,
} from '../lib/data/useOffersApi';
import type {
  LearningDifficulty,
  LearningFormat,
  PricingModel,
  VerificationStatus,
} from '../types/resource';
import {
  formatLearningDifficulty,
  formatLearningFormat,
  formatPricingModel,
  formatVerificationStatus,
} from '../lib/utils/formatters';
import type { NavigateOptions } from '../lib/router/useRouter';
import { LearningCard } from '../components/offers/LearningCard';
import {
  CardGridSkeleton,
  InfiniteLoadMore,
  OffersErrorState,
} from '../components/offers/CardGridSkeleton';
import { SlabIllustration } from '../components/illustrations/TocaStickers';
import { SearchBar } from '../components/search/SearchBar';
import { FilterDropdown } from '../components/ui/FilterDropdown';

interface LearningPageProps {
  searchParams?: URLSearchParams;
  onNavigate: (path: string, options?: NavigateOptions) => void;
}

const FORMAT_OPTIONS: LearningFormat[] = [
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

const DIFFICULTY_OPTIONS: LearningDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
  'all_levels',
  'unknown',
];

export function LearningPage({ searchParams, onNavigate }: LearningPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>(searchParams?.get('q') || '');
  const debouncedQuery = useDebouncedValue(searchQuery, 150);
  const [selectedFormat, setSelectedFormat] = useState<LearningFormat | 'all'>(
    (searchParams?.get('format') as LearningFormat | 'all') || 'all'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<LearningDifficulty | 'all'>(
    (searchParams?.get('difficulty') as LearningDifficulty | 'all') || 'all'
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(
    searchParams?.get('topic') || 'all'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    searchParams?.get('language') || 'all'
  );
  const [selectedPricing, setSelectedPricing] = useState<PricingModel | 'all'>(
    (searchParams?.get('pricing') as PricingModel | 'all') || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'all'>(
    (searchParams?.get('status') as VerificationStatus | 'all') || 'all'
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  useEffect(() => {
    setSearchQuery((prev) => {
      const urlQ = searchParams?.get('q') || '';
      return prev.trim() === urlQ.trim() ? prev : urlQ;
    });
    setSelectedFormat((searchParams?.get('format') as LearningFormat | 'all') || 'all');
    setSelectedDifficulty((searchParams?.get('difficulty') as LearningDifficulty | 'all') || 'all');
    setSelectedTopic(searchParams?.get('topic') || 'all');
    setSelectedLanguage(searchParams?.get('language') || 'all');
    setSelectedPricing((searchParams?.get('pricing') as PricingModel | 'all') || 'all');
    setSelectedStatus((searchParams?.get('status') as VerificationStatus | 'all') || 'all');
  }, [searchParams]);

  const syncLearningUrl = (next: {
    q?: string;
    format?: LearningFormat | 'all';
    difficulty?: LearningDifficulty | 'all';
    topic?: string;
    language?: string;
    pricing?: PricingModel | 'all';
    status?: VerificationStatus | 'all';
  }) => {
    const qVal = next.q !== undefined ? next.q : searchQuery;
    const fmt = next.format ?? selectedFormat;
    const diff = next.difficulty ?? selectedDifficulty;
    const top = next.topic ?? selectedTopic;
    const lang = next.language ?? selectedLanguage;
    const prc = next.pricing ?? selectedPricing;
    const st = next.status ?? selectedStatus;

    const qs = new URLSearchParams();
    if (qVal.trim()) qs.set('q', qVal.trim());
    if (fmt !== 'all') qs.set('format', fmt);
    if (diff !== 'all') qs.set('difficulty', diff);
    if (top !== 'all') qs.set('topic', top);
    if (lang !== 'all') qs.set('language', lang);
    if (prc !== 'all') qs.set('pricing', prc);
    if (st !== 'all') qs.set('status', st);
    const queryStr = qs.toString();
    onNavigate(queryStr ? `/learning?${queryStr}` : '/learning', {
      replace: true,
      scrollTop: false,
    });
  };

  useEffect(() => {
    const urlQ = searchParams?.get('q') || '';
    if (debouncedQuery.trim() === urlQ.trim()) return;
    syncLearningUrl({ q: debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const apiFilterQuery = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('learningOnly', '1');
    if (debouncedQuery.trim()) qs.set('q', debouncedQuery.trim());
    if (selectedFormat !== 'all') qs.set('format', selectedFormat);
    if (selectedDifficulty !== 'all') qs.set('difficulty', selectedDifficulty);
    if (selectedTopic !== 'all') qs.set('topic', selectedTopic);
    if (selectedLanguage !== 'all') qs.set('language', selectedLanguage);
    if (selectedPricing !== 'all') qs.set('pricing', selectedPricing);
    if (selectedStatus !== 'all') qs.set('status', selectedStatus);
    return qs.toString();
  }, [
    debouncedQuery,
    selectedFormat,
    selectedDifficulty,
    selectedTopic,
    selectedLanguage,
    selectedPricing,
    selectedStatus,
  ]);

  const {
    items: displayedLearning,
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

  const learningSummary = facets?.learningSummary;
  const availableFormats = learningSummary?.availableFormats ?? FORMAT_OPTIONS;
  const availableTopics = learningSummary?.availableTopics ?? [];
  const availableLanguages = learningSummary?.availableLanguages ?? [];
  const availablePricing = learningSummary?.availablePricing ?? [];

  const hasFilters =
    searchQuery.trim().length > 0 ||
    selectedFormat !== 'all' ||
    selectedDifficulty !== 'all' ||
    selectedTopic !== 'all' ||
    selectedLanguage !== 'all' ||
    selectedPricing !== 'all' ||
    selectedStatus !== 'all';

  const resetAll = () => {
    setSearchQuery('');
    setSelectedFormat('all');
    setSelectedDifficulty('all');
    setSelectedTopic('all');
    setSelectedLanguage('all');
    setSelectedPricing('all');
    setSelectedStatus('all');
    onNavigate('/learning', { replace: true, scrollTop: false });
  };

  return (
    <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-5 pb-8 sm:pb-12 flex flex-col gap-3 sm:gap-7">
      {/* Compact Sunshine Yellow Hero Slab */}
      <section className="bg-sunshine-yellow rounded-[16px] sm:rounded-[26px] p-3 sm:p-7 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-1.5 sm:gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[13px] rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 min-h-[28px] sm:min-h-[32px] inline-flex items-center gap-1.5 spring-pill"
          >
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
            <span>Home</span>
          </a>
          <h1 className="font-[var(--font-wallop)] font-extrabold text-[20px] sm:text-[36px] lg:text-[44px] leading-[1.06] sm:leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            Learning &amp; study materials
          </h1>
          <p className="font-[var(--font-inter)] text-[12px] sm:text-[15px] leading-[1.38] sm:leading-[1.45] text-ink max-w-xl line-clamp-2 sm:line-clamp-none">
            Curated programming courses, reference docs, technical books, developer roadmaps, CS lectures, and algorithm practice without paywalls.
          </p>
          <div className="w-full pt-0.5 sm:pt-1">
            <SearchBar
              inputId="learning-search-input"
              initialQuery={searchQuery}
              onChangeQuery={(q) => {
                setSearchQuery(q);
              }}
              onSubmitQuery={(q) => {
                setSearchQuery(q);
                syncLearningUrl({ q });
              }}
              placeholder="Search courses, books, CS50, Full Stack Open, roadmaps..."
              label="Search learning materials"
              showSuggestions={true}
              suggestions={['CS50', 'Full Stack Open', 'MDN', 'Roadmap', 'FreeCodeCamp']}
            />
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-5">
          <SlabIllustration variant="learning" />
        </div>
      </section>

      {/* Smooth Learning Format Tabs */}
      <div
        role="tablist"
        aria-label="Learning format"
        className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 py-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedFormat === 'all'}
          onClick={() => {
            setSelectedFormat('all');
            syncLearningUrl({ format: 'all' });
          }}
          className={`font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13px] rounded-full px-3 sm:px-4 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer ${
            selectedFormat === 'all'
              ? 'bg-midnight-mouth text-daylight shadow-xs'
              : 'bg-daylight text-midnight-mouth hover:bg-sunshine-yellow'
          }`}
        >
          All formats
        </button>
        {availableFormats.map((fmt) => {
          const active = selectedFormat === fmt;
          return (
            <button
              key={fmt}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSelectedFormat(fmt);
                syncLearningUrl({ format: fmt });
              }}
              className={`font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13px] rounded-full px-3 sm:px-4 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer ${
                active
                  ? 'bg-midnight-mouth text-daylight shadow-xs'
                  : 'bg-daylight text-midnight-mouth hover:bg-sunshine-yellow'
              }`}
            >
              {formatLearningFormat(fmt)}
            </button>
          );
        })}
      </div>

      {/* Mobile-Only Filter Toggle (< 640px) */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3 py-1.5 min-h-[32px] cursor-pointer filter-pill border ${
            mobileFiltersOpen || hasFilters
              ? 'bg-midnight-mouth text-daylight border-midnight-mouth'
              : 'bg-daylight text-midnight-mouth border-midnight-mouth/15'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filters</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              mobileFiltersOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 font-[var(--font-wallop)] font-semibold text-[11.5px] bg-sunshine-yellow text-midnight-mouth rounded-full px-3 py-1.5 min-h-[32px] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Multi-Criteria Learning Filters Bar */}
      <section
        aria-label="Learning filters"
        className={`bg-daylight rounded-[15px] sm:rounded-[22px] p-3 sm:p-4 ${
          mobileFiltersOpen ? 'grid' : 'hidden'
        } sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-end`}
      >
        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-difficulty"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Difficulty
          </label>
          <FilterDropdown
            id="learning-difficulty"
            label="Difficulty"
            surface="paper"
            size="sm"
            minMenuWidth={220}
            menuTitle="Skill level"
            value={selectedDifficulty}
            onChange={(val) => {
              const next = val as LearningDifficulty | 'all';
              setSelectedDifficulty(next);
              syncLearningUrl({ difficulty: next });
            }}
            options={[
              { value: 'all', label: 'All difficulties' },
              ...DIFFICULTY_OPTIONS.map((d) => ({
                value: d,
                label: formatLearningDifficulty(d),
              })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-topic"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Topic
          </label>
          <FilterDropdown
            id="learning-topic"
            label="Topic"
            surface="paper"
            size="sm"
            minMenuWidth={250}
            menuTitle="Learning topic"
            value={selectedTopic}
            onChange={(next) => {
              setSelectedTopic(next);
              syncLearningUrl({ topic: next });
            }}
            options={[
              { value: 'all', label: 'All topics' },
              ...availableTopics.map((topic) => ({
                value: topic,
                label: topic,
              })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-language"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Language
          </label>
          <FilterDropdown
            id="learning-language"
            label="Language"
            surface="paper"
            size="sm"
            minMenuWidth={220}
            menuTitle="Language"
            value={selectedLanguage}
            onChange={(next) => {
              setSelectedLanguage(next);
              syncLearningUrl({ language: next });
            }}
            options={[
              { value: 'all', label: 'All languages' },
              ...availableLanguages.map((lang) => ({
                value: lang,
                label: lang,
              })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-pricing"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Access classification
          </label>
          <FilterDropdown
            id="learning-pricing"
            label="Access classification"
            surface="paper"
            size="sm"
            minMenuWidth={230}
            menuTitle="Access classification"
            value={selectedPricing}
            onChange={(val) => {
              const next = val as PricingModel | 'all';
              setSelectedPricing(next);
              syncLearningUrl({ pricing: next });
            }}
            options={[
              { value: 'all', label: 'All free types' },
              ...availablePricing.map((pm) => ({
                value: pm,
                label: formatPricingModel(pm),
              })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="learning-status"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Verification status
          </label>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <FilterDropdown
                id="learning-status"
                label="Verification status"
                surface="paper"
                size="sm"
                minMenuWidth={220}
                menuTitle="Verification status"
                value={selectedStatus}
                onChange={(val) => {
                  const next = val as VerificationStatus | 'all';
                  setSelectedStatus(next);
                  syncLearningUrl({ status: next });
                }}
                options={[
                  { value: 'all', label: 'Any status' },
                  { value: 'verified', label: formatVerificationStatus('verified') },
                  { value: 'needs_review', label: formatVerificationStatus('needs_review') },
                ]}
              />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={resetAll}
                aria-label="Reset learning filters"
                className="bg-paper hover:bg-sunshine-yellow text-midnight-mouth rounded-[10px] p-2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center cursor-pointer filter-pill shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      {isInitialLoading && displayedLearning.length === 0 ? (
        <CardGridSkeleton
          count={6}
          columnsClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4"
        />
      ) : error && displayedLearning.length === 0 ? (
        <OffersErrorState message={error} onRetry={retry} />
      ) : !isInitialLoading && !isTransitioning && displayedLearning.length === 0 ? (
        <div className="bg-daylight rounded-[16px] sm:rounded-[20px] p-5 sm:p-9 text-center flex flex-col items-center gap-2.5 sm:gap-3 card-enter">
          <h2 className="font-[var(--font-wallop)] font-bold text-[16px] sm:text-[22px] text-midnight-mouth">
            No learning materials match those filters
          </h2>
          <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[14px] text-ink/80 max-w-md">
            Reset filters to view all curated courses, books, documentation, roadmaps, and practice sets.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13.5px] rounded-full px-4 sm:px-5 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[38px] cursor-pointer spring-pill"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          <div
            data-testid="learning-results-grid"
            aria-busy={isTransitioning}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 transition-opacity duration-150 ${
              isTransitioning ? 'opacity-75' : 'opacity-100'
            }`}
          >
            {displayedLearning.map((offer, idx) => (
              <LearningCard
                key={offer.identity.slug}
                offer={offer}
                onNavigate={onNavigate}
                wiggleIcon={idx % 3 === 0}
                priority={idx < 4}
              />
            ))}
          </div>

          <InfiniteLoadMore
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            remainingCount={Math.max(0, totalFilteredCount - displayedLearning.length)}
            onLoadMore={loadMore}
          />
        </div>
      )}
    </div>
  );
}
