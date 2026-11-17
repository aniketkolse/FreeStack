import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, ChevronDown, Home } from 'lucide-react';
import { getLearningOffers } from '../lib/data/resources';
import { DEFAULT_FILTER_STATE, filterAndSortOffers } from '../lib/filters/filterOffers';
import { searchOffers } from '../lib/search/searchOffers';
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
import { SlabIllustration } from '../components/illustrations/TocaStickers';
import { SearchBar } from '../components/search/SearchBar';

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
  const allLearning = useMemo(
    () =>
      filterAndSortOffers(
        getLearningOffers().filter((o) => o.classification.category === 'learning'),
        {
          ...DEFAULT_FILTER_STATE,
          category: 'learning',
          sortBy: 'relevance',
        }
      ),
    []
  );

  const [visibleCount, setVisibleCount] = useState(24);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams?.get('q') || '');
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

  useEffect(() => {
    setSearchQuery(searchParams?.get('q') || '');
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

  const availableFormats = useMemo(
    () =>
      FORMAT_OPTIONS.filter((fmt) => allLearning.some((o) => o.learning?.format === fmt)),
    [allLearning]
  );

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    for (const item of allLearning) {
      for (const topic of item.learning?.topics ?? []) {
        set.add(topic);
      }
    }
    return Array.from(set).sort();
  }, [allLearning]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const item of allLearning) {
      if (item.learning?.language) set.add(item.learning.language);
    }
    return Array.from(set).sort();
  }, [allLearning]);

  const availablePricing = useMemo(() => {
    const set = new Set<PricingModel>();
    for (const item of allLearning) {
      set.add(item.classification.pricing_model);
    }
    return Array.from(set);
  }, [allLearning]);

  const filtered = useMemo(() => {
    const baseList = searchQuery.trim()
      ? searchOffers(allLearning, searchQuery).map((r) => r.offer)
      : allLearning;
    return baseList.filter((o) => {
      if (selectedFormat !== 'all' && o.learning?.format !== selectedFormat) return false;
      if (selectedDifficulty !== 'all' && o.learning?.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedTopic !== 'all' && !(o.learning?.topics ?? []).includes(selectedTopic)) {
        return false;
      }
      if (selectedLanguage !== 'all' && o.learning?.language !== selectedLanguage) {
        return false;
      }
      if (selectedPricing !== 'all' && o.classification.pricing_model !== selectedPricing) {
        return false;
      }
      if (selectedStatus !== 'all' && o.verification.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [
    allLearning,
    searchQuery,
    selectedFormat,
    selectedDifficulty,
    selectedTopic,
    selectedLanguage,
    selectedPricing,
    selectedStatus,
  ]);

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

  const transitionKey = `${searchQuery}-${selectedFormat}-${selectedDifficulty}-${selectedTopic}-${selectedLanguage}-${selectedPricing}-${selectedStatus}`;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-5 sm:gap-7">
      {/* Compact Sunshine Yellow Hero Slab */}
      <section className="bg-sunshine-yellow rounded-[22px] sm:rounded-[26px] p-4 sm:p-7 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-2.5 sm:gap-3">
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
          <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[36px] lg:text-[44px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            Learning &amp; study materials
          </h1>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15px] leading-[1.45] text-ink max-w-xl">
            Curated programming courses, reference docs, technical books, developer roadmaps, CS lectures, and algorithm practice without paywalls.
          </p>
          <div className="w-full pt-1">
            <SearchBar
              inputId="learning-search-input"
              initialQuery={searchQuery}
              onChangeQuery={(q) => {
                setSearchQuery(q);
                syncLearningUrl({ q });
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
        <div className="lg:col-span-5">
          <SlabIllustration variant="learning" />
        </div>
      </section>

      {/* Smooth Learning Format Tabs */}
      <div
        role="tablist"
        aria-label="Learning format"
        className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedFormat === 'all'}
          onClick={() => {
            setSelectedFormat('all');
            syncLearningUrl({ format: 'all' });
          }}
          className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-1.5 min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer ${
            selectedFormat === 'all'
              ? 'bg-midnight-mouth text-daylight shadow-xs'
              : 'bg-daylight text-midnight-mouth hover:bg-sunshine-yellow'
          }`}
        >
          All formats ({allLearning.length})
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
              className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-1.5 min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer ${
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

      {/* Multi-Criteria Learning Filters Bar */}
      <section
        aria-label="Learning filters"
        className="bg-daylight rounded-[18px] sm:rounded-[22px] p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-difficulty"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Difficulty
          </label>
          <div className="relative">
            <select
              id="learning-difficulty"
              value={selectedDifficulty}
              onChange={(e) => {
                const next = e.target.value as LearningDifficulty | 'all';
                setSelectedDifficulty(next);
                syncLearningUrl({ difficulty: next });
              }}
              className="w-full appearance-none bg-paper text-midnight-mouth font-[var(--font-inter)] font-medium text-[13px] rounded-[10px] pl-3 pr-8 py-2 min-h-[36px] border border-midnight-mouth/10 cursor-pointer"
            >
              <option value="all">All difficulties</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {formatLearningDifficulty(d)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-midnight-mouth/70 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-topic"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Topic
          </label>
          <div className="relative">
            <select
              id="learning-topic"
              value={selectedTopic}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedTopic(next);
                syncLearningUrl({ topic: next });
              }}
              className="w-full appearance-none bg-paper text-midnight-mouth font-[var(--font-inter)] font-medium text-[13px] rounded-[10px] pl-3 pr-8 py-2 min-h-[36px] border border-midnight-mouth/10 cursor-pointer"
            >
              <option value="all">All topics</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-midnight-mouth/70 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-language"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Language
          </label>
          <div className="relative">
            <select
              id="learning-language"
              value={selectedLanguage}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedLanguage(next);
                syncLearningUrl({ language: next });
              }}
              className="w-full appearance-none bg-paper text-midnight-mouth font-[var(--font-inter)] font-medium text-[13px] rounded-[10px] pl-3 pr-8 py-2 min-h-[36px] border border-midnight-mouth/10 cursor-pointer"
            >
              <option value="all">All languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-midnight-mouth/70 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="learning-pricing"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Access classification
          </label>
          <div className="relative">
            <select
              id="learning-pricing"
              value={selectedPricing}
              onChange={(e) => {
                const next = e.target.value as PricingModel | 'all';
                setSelectedPricing(next);
                syncLearningUrl({ pricing: next });
              }}
              className="w-full appearance-none bg-paper text-midnight-mouth font-[var(--font-inter)] font-medium text-[13px] rounded-[10px] pl-3 pr-8 py-2 min-h-[36px] border border-midnight-mouth/10 cursor-pointer"
            >
              <option value="all">All free types</option>
              {availablePricing.map((pm) => (
                <option key={pm} value={pm}>
                  {formatPricingModel(pm)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-midnight-mouth/70 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="learning-status"
            className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth"
          >
            Verification status
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                id="learning-status"
                value={selectedStatus}
                onChange={(e) => {
                  const next = e.target.value as VerificationStatus | 'all';
                  setSelectedStatus(next);
                  syncLearningUrl({ status: next });
                }}
                className="w-full appearance-none bg-paper text-midnight-mouth font-[var(--font-inter)] font-medium text-[13px] rounded-[10px] pl-3 pr-8 py-2 min-h-[36px] border border-midnight-mouth/10 cursor-pointer"
              >
                <option value="all">Any status</option>
                <option value="verified">{formatVerificationStatus('verified')}</option>
                <option value="needs_review">{formatVerificationStatus('needs_review')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-midnight-mouth/70 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={resetAll}
                aria-label="Reset learning filters"
                className="bg-paper hover:bg-sunshine-yellow text-midnight-mouth rounded-[10px] p-2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center cursor-pointer filter-pill"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-daylight rounded-[20px] p-7 sm:p-9 text-center flex flex-col items-center gap-3 card-enter">
          <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] text-midnight-mouth">
            No learning materials match those filters
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] text-ink/80 max-w-md">
            Reset filters to view all curated courses, books, documentation, roadmaps, and practice sets.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-5 py-2 min-h-[38px] cursor-pointer spring-pill"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            key={transitionKey}
            data-testid="learning-results-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
          >
            {filtered.slice(0, visibleCount).map((offer, idx) => (
              <LearningCard
                key={offer.identity.id}
                offer={offer}
                onNavigate={onNavigate}
                wiggleIcon={idx % 3 === 0}
              />
            ))}
          </div>

          {filtered.length > visibleCount && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="font-[var(--font-inter)] text-[13px] text-ink/70">
                Showing {visibleCount} of {filtered.length} verified learning resources (most popular first)
              </p>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-bold text-[14px] rounded-full px-6 py-2.5 min-h-[42px] cursor-pointer spring-pill"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
