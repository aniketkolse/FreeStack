import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Home, CheckCircle2 } from 'lucide-react';
import { OFFERS, getStudentOffers } from '../lib/data/resources';
import { DEFAULT_FILTER_STATE, filterAndSortOffers } from '../lib/filters/filterOffers';
import type { NavigateOptions } from '../lib/router/useRouter';
import { formatCardRequirement, formatDate } from '../lib/utils/formatters';
import { ResourceCard } from '../components/offers/ResourceCard';
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
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    setSelectedTrack(searchParams?.get('track') || 'all');
    setStudentIdFilter(
      (searchParams?.get('verify') as 'all' | 'required' | 'not_required') || 'all'
    );
    setSearchQuery(searchParams?.get('q') || '');
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

  const allStudentOffers = useMemo(
    () =>
      filterAndSortOffers(getStudentOffers(), {
        ...DEFAULT_FILTER_STATE,
        category: 'student-benefits',
        sortBy: 'relevance',
      }),
    []
  );

  const studentIdRequiredOffers = useMemo(
    () =>
      allStudentOffers.filter(
        (o) =>
          o.eligibility.student_access === 'exclusive' ||
          o.classification.tags.includes('Student ID / .edu Required')
      ),
    [allStudentOffers]
  );

  const noStudentIdOffers = useMemo(
    () =>
      allStudentOffers.filter(
        (o) =>
          o.eligibility.student_access !== 'exclusive' &&
          (o.classification.tags.includes('No Student ID Required') ||
            o.eligibility.student_access === 'eligible')
      ),
    [allStudentOffers]
  );

  const filteredStudentOffers = useMemo(() => {
    const baseList = filterAndSortOffers(allStudentOffers, {
      ...DEFAULT_FILTER_STATE,
      category: 'student-benefits',
      subcategory: selectedTrack,
      query: searchQuery,
      sortBy: 'relevance',
    });
    if (studentIdFilter === 'required') {
      return baseList.filter(
        (o) =>
          o.eligibility.student_access === 'exclusive' ||
          o.classification.tags.includes('Student ID / .edu Required')
      );
    }
    if (studentIdFilter === 'not_required') {
      return baseList.filter(
        (o) =>
          o.eligibility.student_access !== 'exclusive' &&
          (o.classification.tags.includes('No Student ID Required') ||
            o.eligibility.student_access === 'eligible')
      );
    }
    return baseList;
  }, [allStudentOffers, selectedTrack, studentIdFilter, searchQuery]);

  const generalStudentEligible = useMemo(
    () =>
      OFFERS.filter(
        (o) =>
          o.classification.category !== 'student-benefits' &&
          o.eligibility.student_access === 'eligible' &&
          (o.eligibility.conditions?.toLowerCase().includes('student') ||
            o.classification.category === 'cloud-hosting' ||
            o.classification.category === 'ai-ml')
      ).slice(0, 6),
    []
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-5 sm:gap-7">
      {/* Compact Grass Green Student Slab with Explicit Student ID Requirement Callout at Top */}
      <section className="bg-grass-green rounded-[22px] sm:rounded-[26px] p-4 sm:p-6 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-2.5">
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

          <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[36px] lg:text-[42px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            Student benefits &amp; cloud credits
          </h1>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14.5px] leading-[1.45] text-ink max-w-xl">
            Verified academic developer packs, AI coding assistants, desktop IDEs, student cloud credits, CAD/EDA tools, domains, certifications, and fellowships.
          </p>

          <div className="w-full pt-0.5">
            <SearchBar
              inputId="students-search-input"
              initialQuery={searchQuery}
              onChangeQuery={(q) => {
                setSearchQuery(q);
                setVisibleCount(24);
                syncStudentsUrl({ q });
              }}
              onSubmitQuery={(q) => {
                setSearchQuery(q);
                setVisibleCount(24);
                syncStudentsUrl({ q });
              }}
              placeholder="Search student packs, GitHub Student Pack, Cursor Pro, Azure $100, JetBrains..."
              label="Search student benefits"
              showSuggestions={false}
            />
          </div>
        </div>
        <div className="lg:col-span-5">
          <SlabIllustration variant="students" />
        </div>
      </section>

      {/* Verification Filter + Smooth Track Tabs */}
      <div className="flex flex-col gap-2.5">
        <div
          role="group"
          aria-label="Filter by Student ID requirement"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="font-[var(--font-wallop)] font-bold text-[12px] uppercase tracking-wider text-midnight-mouth/70 mr-1">
            Verification:
          </span>
          <button
            type="button"
            onClick={() => {
              setStudentIdFilter('all');
              setVisibleCount(24);
              syncStudentsUrl({ verify: 'all' });
            }}
            className={`font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-1.5 min-h-[34px] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              studentIdFilter === 'all'
                ? 'bg-midnight-mouth text-daylight'
                : 'bg-daylight text-midnight-mouth hover:bg-grass-green/40'
            }`}
          >
            <span>All Verification ({allStudentOffers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentIdFilter('required');
              setVisibleCount(24);
              syncStudentsUrl({ verify: 'required' });
            }}
            className={`font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-1.5 min-h-[34px] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              studentIdFilter === 'required'
                ? 'bg-sunshine-yellow text-midnight-mouth ring-2 ring-midnight-mouth'
                : 'bg-sunshine-yellow/55 text-midnight-mouth hover:bg-sunshine-yellow'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Student ID / .edu Req. ({studentIdRequiredOffers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentIdFilter('not_required');
              setVisibleCount(24);
              syncStudentsUrl({ verify: 'not_required' });
            }}
            className={`font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3.5 py-1.5 min-h-[34px] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              studentIdFilter === 'not_required'
                ? 'bg-grass-green text-midnight-mouth ring-2 ring-midnight-mouth'
                : 'bg-grass-green/45 text-midnight-mouth hover:bg-grass-green'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>No Student ID Req. ({noStudentIdOffers.length})</span>
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
                  setVisibleCount(24);
                  syncStudentsUrl({ track: track.id });
                }}
                className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-1.5 min-h-[36px] whitespace-nowrap shrink-0 filter-pill cursor-pointer ${
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
      <section className="flex flex-col gap-3.5 sm:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-midnight-mouth shrink-0" aria-hidden="true" />
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[20px] sm:text-[26px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
              {studentIdFilter === 'required'
                ? `Requires Student ID / .edu Verification (${filteredStudentOffers.length})`
                : studentIdFilter === 'not_required'
                ? `No Student ID Required (${filteredStudentOffers.length})`
                : `Verified Student Benefits (${filteredStudentOffers.length})`}
            </h2>
          </div>
        </div>

        <div
          key={`${selectedTrack}-${studentIdFilter}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
        >
          {filteredStudentOffers.slice(0, visibleCount).map((offer) => (
            <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
          ))}
        </div>

        {filteredStudentOffers.length > visibleCount && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="font-[var(--font-inter)] text-[13px] text-ink/70">
              Showing {visibleCount} of {filteredStudentOffers.length} verified student benefits
            </p>
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 24)}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-bold text-[14px] rounded-full px-6 py-2.5 min-h-[42px] cursor-pointer spring-pill"
            >
              Load more ({filteredStudentOffers.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </section>

      {/* Quick Terms Matrix for Transparency */}
      <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4">
        <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] tracking-[-0.02em] text-midnight-mouth">
          Eligibility, Student ID requirement &amp; renewal comparison (Top 20 Programs)
        </h2>

        {/* Mobile Stacked Comparison Cards */}
        <div className="md:hidden flex flex-col gap-2.5">
          {allStudentOffers.slice(0, 20).map((offer) => (
            <div key={offer.identity.id} className="bg-paper rounded-[16px] p-3.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={`/offer/${offer.identity.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`/offer/${offer.identity.slug}`);
                  }}
                  className="font-[var(--font-wallop)] font-bold text-[15px] text-midnight-mouth hover:underline"
                >
                  {offer.identity.name}
                </a>
                <span className="font-[var(--font-inter)] text-[11.5px] text-ink/70 tabular-nums shrink-0">
                  {formatDate(offer.verification.last_verified_at)}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-[var(--font-inter)] text-[12.5px] text-ink">
                <div>
                  <dt className="text-ink/65">Benefit</dt>
                  <dd className="font-medium text-midnight-mouth">
                    {offer.access.free_limits[0]
                      ? `${offer.access.free_limits[0].value ?? 'Unknown'} (${
                          offer.access.free_limits[0].period ?? ''
                        })`
                      : 'See details'}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink/65">Card rule</dt>
                  <dd className="font-medium text-midnight-mouth">
                    {formatCardRequirement(offer.access.requirements.card_required)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink/65">Duration</dt>
                  <dd className="font-medium text-midnight-mouth">
                    {offer.access.validity.duration ?? 'While enrolled'}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink/65">Regions</dt>
                  <dd className="font-medium text-midnight-mouth">{offer.eligibility.regions.join(', ')}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* Desktop & Tablet Comparison Matrix */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-midnight-mouth/15 font-[var(--font-wallop)] font-semibold text-[13.5px] text-midnight-mouth">
                <th className="py-2.5 pr-4">Program</th>
                <th className="py-2.5 pr-4">Student ID / .edu?</th>
                <th className="py-2.5 pr-4">Benefit / Credit</th>
                <th className="py-2.5 pr-4">Card rule</th>
                <th className="py-2.5 pr-4">Duration &amp; renewal</th>
                <th className="py-2.5">Verified</th>
              </tr>
            </thead>
            <tbody className="font-[var(--font-inter)] text-[13px] text-ink">
              {allStudentOffers.slice(0, 20).map((offer) => {
                const reqId =
                  offer.eligibility.student_access === 'exclusive' ||
                  offer.classification.tags.includes('Student ID / .edu Required');
                return (
                  <tr key={offer.identity.id} className="border-b border-midnight-mouth/10 align-top">
                    <td className="py-3 pr-4 font-semibold text-midnight-mouth">
                      <a
                        href={`/offer/${offer.identity.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/offer/${offer.identity.slug}`);
                        }}
                        className="hover:underline"
                      >
                        {offer.identity.name}
                      </a>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-[var(--font-wallop)] font-semibold text-[11.5px] ${
                          reqId
                            ? 'bg-sunshine-yellow/80 text-midnight-mouth'
                            : 'bg-grass-green/75 text-midnight-mouth'
                        }`}
                      >
                        {reqId ? 'Student ID / .edu Req.' : 'No Student ID Req.'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {offer.access.free_limits[0]
                        ? `${offer.access.free_limits[0].value ?? 'Unknown'} (${
                            offer.access.free_limits[0].period ?? ''
                          })`
                        : 'See details'}
                    </td>
                    <td className="py-3 pr-4">
                      {formatCardRequirement(offer.access.requirements.card_required)}
                    </td>
                    <td className="py-3 pr-4">
                      {offer.access.validity.duration ?? 'While enrolled'}
                    </td>
                    <td className="py-3 tabular-nums">
                      {formatDate(offer.verification.last_verified_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
