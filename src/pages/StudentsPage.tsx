import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Home, CheckCircle2 } from 'lucide-react';
import {
  useDebouncedValue,
  usePaginatedOffersQuery,
} from '../lib/data/useOffersApi';
import type { NavigateOptions } from '../lib/router/useRouter';
import { ResourceCard } from '../components/offers/ResourceCard';
import {
  CardGridSkeleton,
  InfiniteLoadMore,
  OffersErrorState,
} from '../components/offers/CardGridSkeleton';
import { SlabIllustration } from '../components/illustrations/TocaStickers';
import { SearchBar } from '../components/search/SearchBar';

interface StudentsPageProps {
  searchParams?: URLSearchParams;
  onNavigate: (path: string, options?: NavigateOptions) => void;
}

const STUDENT_TRACKS = [
  { id: 'all', label: 'All student benefits' },
  { id: 'Student Developer Packs', label: 'Developer packs' },
  { id: 'Student AI & Dev Tools', label: 'Student AI & Dev tools' },
  { id: 'Student Cloud Credits', label: 'Cloud credits' },
  { id: 'Educational Software', label: 'Educational software' },
  { id: 'Free Student Domains & Web Hosting', label: 'Domains & hosting' },
  { id: 'Certifications & Learning Benefits', label: 'Certifications & learning' },
  { id: 'Coding Courses & Interactive Platforms for Students', label: 'Coding courses' },
  { id: 'APIs, Observability & DevOps Student Perks', label: 'APIs & DevOps perks' },
  { id: 'Academic Research, Data Science & Reference Tools', label: 'Academic research & data' },
  { id: 'Hackathons, Open-Source Fellowships & Student Grants', label: 'Fellowships & grants' },
];

export function StudentsPage({ searchParams, onNavigate }: StudentsPageProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>(
    searchParams?.get('track') || 'all'
  );
  const [studentIdFilter, setStudentIdFilter] = useState<'all' | 'required' | 'not_required'>(
    (searchParams?.get('verify') as 'all' | 'required' | 'not_required') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(searchParams?.get('q') || '');
  const debouncedQuery = useDebouncedValue(searchQuery, 150);

  useEffect(() => {
    setSelectedTrack(searchParams?.get('track') || 'all');
    setStudentIdFilter(
      (searchParams?.get('verify') as 'all' | 'required' | 'not_required') || 'all'
    );
    setSearchQuery((prev) => {
      const urlQ = searchParams?.get('q') || '';
      return prev.trim() === urlQ.trim() ? prev : urlQ;
    });
  }, [searchParams]);

  const syncStudentsUrl = (next: {
    q?: string;
    track?: string;
    verify?: 'all' | 'required' | 'not_required';
  }) => {
    const qVal = next.q !== undefined ? next.q : searchQuery;
    const trackVal = next.track ?? selectedTrack;
    const verifyVal = next.verify ?? studentIdFilter;

    const qs = new URLSearchParams();
    if (qVal.trim()) qs.set('q', qVal.trim());
    if (trackVal !== 'all') qs.set('track', trackVal);
    if (verifyVal !== 'all') qs.set('verify', verifyVal);
    const queryStr = qs.toString();
    onNavigate(queryStr ? `/students?${queryStr}` : '/students', {
      replace: true,
      scrollTop: false,
    });
  };

  useEffect(() => {
    const urlQ = searchParams?.get('q') || '';
    if (debouncedQuery.trim() === urlQ.trim()) return;
    syncStudentsUrl({ q: debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const apiFilterQuery = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set('category', 'student-benefits');
    if (debouncedQuery.trim()) qs.set('q', debouncedQuery.trim());
    if (selectedTrack !== 'all') qs.set('subcategory', selectedTrack);
    if (studentIdFilter !== 'all') qs.set('verify', studentIdFilter);
    return qs.toString();
  }, [debouncedQuery, selectedTrack, studentIdFilter]);

  const {
    items: displayedStudentOffers,
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

  const studentsSummary = facets?.studentsSummary;
  const generalStudentEligible = studentsSummary?.generalStudentEligible ?? [];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 sm:pt-5 pb-12 flex flex-col gap-3.5 sm:gap-7">
      {/* Compact Grass Green Student Slab with Explicit Student ID Requirement Callout at Top */}
      <section className="bg-grass-green rounded-[18px] sm:rounded-[26px] p-3.5 sm:p-6 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-7 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-2 sm:gap-2.5">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13px] rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 min-h-[30px] sm:min-h-[32px] inline-flex items-center gap-1.5 spring-pill"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Home</span>
          </a>

          <h1 className="font-[var(--font-wallop)] font-extrabold text-[23px] sm:text-[36px] lg:text-[42px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            Student benefits &amp; cloud credits
          </h1>
          <p className="font-[var(--font-inter)] text-[13px] sm:text-[14.5px] leading-[1.4] sm:leading-[1.45] text-ink max-w-xl line-clamp-2 sm:line-clamp-none">
            Verified academic developer packs, AI coding assistants, desktop IDEs, student cloud credits, CAD/EDA tools, domains, certifications, and fellowships.
          </p>

          <div className="w-full pt-0.5">
            <SearchBar
              inputId="students-search-input"
              initialQuery={searchQuery}
              onChangeQuery={(q) => {
                setSearchQuery(q);
              }}
              onSubmitQuery={(q) => {
                setSearchQuery(q);
                syncStudentsUrl({ q });
              }}
              placeholder="Search student packs, GitHub Student Pack, Cursor Pro, Azure $100, JetBrains..."
              label="Search student benefits"
              showSuggestions={false}
            />
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-5">
          <SlabIllustration variant="students" />
        </div>
      </section>

      {/* Verification Filter + Smooth Track Tabs */}
      <div className="flex flex-col gap-2">
        <div
          role="group"
          aria-label="Filter by Student ID requirement"
          className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-0.5"
        >
          <span className="font-[var(--font-wallop)] font-bold text-[11.5px] sm:text-[12px] uppercase tracking-wider text-midnight-mouth/70 mr-0.5 sm:mr-1 shrink-0">
            Verification:
          </span>
          <button
            type="button"
            onClick={() => {
              setStudentIdFilter('all');
              syncStudentsUrl({ verify: 'all' });
            }}
            className={`font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[12.5px] rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[34px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              studentIdFilter === 'all'
                ? 'bg-midnight-mouth text-daylight'
                : 'bg-daylight text-midnight-mouth hover:bg-grass-green/40'
            }`}
          >
            <span>All Verification</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentIdFilter('required');
              syncStudentsUrl({ verify: 'required' });
            }}
            className={`font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[12.5px] rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[34px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              studentIdFilter === 'required'
                ? 'bg-sunshine-yellow text-midnight-mouth ring-2 ring-midnight-mouth'
                : 'bg-sunshine-yellow/55 text-midnight-mouth hover:bg-sunshine-yellow'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Student ID / .edu Req.</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentIdFilter('not_required');
              syncStudentsUrl({ verify: 'not_required' });
            }}
            className={`font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[12.5px] rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[34px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              studentIdFilter === 'not_required'
                ? 'bg-grass-green text-midnight-mouth ring-2 ring-midnight-mouth'
                : 'bg-grass-green/45 text-midnight-mouth hover:bg-grass-green'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>No Student ID Req.</span>
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Student benefit categories"
          className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-0.5"
        >
          {STUDENT_TRACKS.map((track) => {
            const active = selectedTrack === track.id;
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedTrack(track.id);
                  syncStudentsUrl({ track: track.id });
                }}
                className={`font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[13px] rounded-full px-3.5 sm:px-4 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer ${
                  active
                    ? 'bg-midnight-mouth text-daylight shadow-xs'
                    : 'bg-daylight text-midnight-mouth hover:bg-grass-green'
                }`}
              >
                {track.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Student Benefits Grid */}
      <section className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-midnight-mouth shrink-0" aria-hidden="true" />
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[18px] sm:text-[26px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
              {studentIdFilter === 'required'
                ? `Requires Student ID / .edu Verification (${totalFilteredCount})`
                : studentIdFilter === 'not_required'
                ? `No Student ID Required (${totalFilteredCount})`
                : `Verified Student Benefits (${totalFilteredCount})`}
            </h2>
          </div>
        </div>

        {isInitialLoading && displayedStudentOffers.length === 0 ? (
          <CardGridSkeleton
            count={6}
            columnsClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4"
          />
        ) : error && displayedStudentOffers.length === 0 ? (
          <OffersErrorState message={error} onRetry={retry} />
        ) : (
          <>
            <div
              aria-busy={isTransitioning}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 transition-opacity duration-150 ${
                isTransitioning ? 'opacity-75' : 'opacity-100'
              }`}
            >
              {displayedStudentOffers.map((offer, idx) => (
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
              remainingCount={Math.max(0, totalFilteredCount - displayedStudentOffers.length)}
              onLoadMore={loadMore}
            />
          </>
        )}
      </section>

      {/* Open-to-All Tools Commonly Used by Students */}
      {generalStudentEligible.length > 0 && (
        <section className="flex flex-col gap-3.5 sm:gap-4">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[20px] sm:text-[26px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
            No student ID needed (free for everyone)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {generalStudentEligible.map((offer) => (
              <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
