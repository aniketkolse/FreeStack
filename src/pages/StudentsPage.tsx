import React, { useMemo, useState } from 'react';
import { GraduationCap, AlertTriangle, Home } from 'lucide-react';
import { OFFERS, getStudentOffers } from '../lib/data/resources';
import { searchOffers } from '../lib/search/searchOffers';
import { formatCardRequirement, formatDate } from '../lib/utils/formatters';
import { ResourceCard } from '../components/offers/ResourceCard';
import { SlabIllustration } from '../components/illustrations/TocaStickers';
import { SearchBar } from '../components/search/SearchBar';

interface StudentsPageProps {
  onNavigate: (path: string) => void;
}

const STUDENT_TRACKS = [
  { id: 'all', label: 'All student benefits' },
  { id: 'Student Developer Packs', label: 'Developer packs' },
  { id: 'Student Cloud Credits', label: 'Cloud credits' },
  { id: 'Educational Software', label: 'Educational software' },
  { id: 'Certifications & Learning Benefits', label: 'Certifications & learning' },
  { id: 'Student AI & Dev Tools', label: 'Student AI & Dev tools' },
];

export function StudentsPage({ onNavigate }: StudentsPageProps) {
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const studentExclusive = useMemo(() => getStudentOffers(), []);

  const filteredExclusive = useMemo(() => {
    const baseList = searchQuery.trim()
      ? searchOffers(studentExclusive, searchQuery).map((r) => r.offer)
      : studentExclusive;
    if (selectedTrack === 'all') return baseList;
    return baseList.filter(
      (o) => o.classification.subcategory === selectedTrack
    );
  }, [studentExclusive, selectedTrack, searchQuery]);

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
          <div className="flex flex-wrap items-center gap-2">
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
            <span
              data-testid="student-id-top-badge"
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12px] sm:text-[12.5px] rounded-full px-3.5 py-1.5 min-h-[32px] inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Student ID / .edu Verification Required for {studentExclusive.length} Academic Packs</span>
            </span>
          </div>

          <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[36px] lg:text-[42px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
            Student benefits &amp; cloud credits
          </h1>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14.5px] leading-[1.45] text-ink max-w-xl">
            Verified academic developer packs, professional desktop software, student cloud credits, and certifications — clearly marking where a <strong>Student ID / school .edu email</strong> is required vs. tools open to everyone.
          </p>

          {/* Explicit Top Breakdown: Where Student ID Is Needed */}
          <div
            data-testid="student-id-needed-notice"
            className="w-full bg-paper/95 rounded-[16px] p-3.5 flex flex-col gap-1.5 border border-midnight-mouth/10"
          >
            <div className="flex items-center gap-1.5 font-[var(--font-wallop)] font-bold text-[13.5px] sm:text-[14px] text-midnight-mouth">
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Where a Student ID or .edu / .ac school email is needed:</span>
            </div>
            <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[13px] leading-[1.45] text-ink/90">
              <strong>Student ID / enrollment proof required:</strong> GitHub Student Developer Pack, Microsoft Azure for Students ($100), JetBrains All Products Pack, Figma Education, Notion Plus for Education, and AWS Educate. Each card below is tagged with <span className="font-semibold text-midnight-mouth">&ldquo;Student ID / .edu Req.&rdquo;</span> so you know before clicking.
            </p>
          </div>

          <div className="w-full pt-0.5">
            <SearchBar
              inputId="students-search-input"
              initialQuery={searchQuery}
              onChangeQuery={setSearchQuery}
              onSubmitQuery={setSearchQuery}
              placeholder="Search student packs, GitHub Student Pack, Azure $100, JetBrains..."
              label="Search student benefits"
              showSuggestions={false}
            />
          </div>
        </div>
        <div className="lg:col-span-5">
          <SlabIllustration variant="students" />
        </div>
      </section>

      {/* Free Benefit vs Discount Distinction + Eligibility Guidance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        <div className="lg:col-span-5 bg-sunshine-yellow rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-midnight-mouth">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h2 className="font-[var(--font-wallop)] font-bold text-[17px] sm:text-[19px] leading-[1.15] text-midnight-mouth">
              Free benefit vs. student discount
            </h2>
          </div>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.5] text-midnight-mouth">
            <strong>A student discount is not free access.</strong> FreeStack only grants &ldquo;Student exclusive&rdquo; status when core software, packs, or cloud credits cost $0 during enrollment (for example, Notion Plus or Azure $100 credits). Paid student discounts are flagged explicitly in restrictions so you never hit an unexpected paywall.
          </p>
        </div>

        <div className="lg:col-span-7 bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-paper rounded-[16px] p-4">
            <h3 className="font-[var(--font-wallop)] font-bold text-[15.5px] text-midnight-mouth mb-1">
              Student ID / .edu proof
            </h3>
            <p className="font-[var(--font-inter)] text-[13px] leading-[1.45] text-ink/85">
              Programs verify via school email (.edu / .ac.in / .ac.uk), SheerID, or dated student ID card / enrollment letter.
            </p>
          </div>
          <div className="bg-paper rounded-[16px] p-4">
            <h3 className="font-[var(--font-wallop)] font-bold text-[15.5px] text-midnight-mouth mb-1">
              Credit expiry
            </h3>
            <p className="font-[var(--font-inter)] text-[13px] leading-[1.45] text-ink/85">
              Student credits (like Azure $100) expire after 12 months or depletion without auto-charging a card.
            </p>
          </div>
          <div className="bg-paper rounded-[16px] p-4">
            <h3 className="font-[var(--font-wallop)] font-bold text-[15.5px] text-midnight-mouth mb-1">
              Annual renewal
            </h3>
            <p className="font-[var(--font-inter)] text-[13px] leading-[1.45] text-ink/85">
              Licenses like JetBrains and Figma Education require re-verification every 1–2 years while enrolled.
            </p>
          </div>
        </div>
      </section>

      {/* Smooth Track Tabs */}
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
              onClick={() => setSelectedTrack(track.id)}
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

      {/* Student Exclusive Grid */}
      <section className="flex flex-col gap-3.5 sm:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-midnight-mouth shrink-0" aria-hidden="true" />
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[20px] sm:text-[26px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
              Verified student programs — Student ID / .edu needed ({filteredExclusive.length})
            </h2>
          </div>
        </div>

        <div
          key={selectedTrack}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
        >
          {filteredExclusive.map((offer) => (
            <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Quick Terms Matrix for Transparency */}
      <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4">
        <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] tracking-[-0.02em] text-midnight-mouth">
          Eligibility, regions &amp; renewal comparison
        </h2>

        {/* Mobile Stacked Comparison Cards */}
        <div className="md:hidden flex flex-col gap-2.5">
          {studentExclusive.map((offer) => (
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
                <th className="py-2.5 pr-4">Benefit / Credit</th>
                <th className="py-2.5 pr-4">Card rule</th>
                <th className="py-2.5 pr-4">Duration &amp; renewal</th>
                <th className="py-2.5 pr-4">Regions</th>
                <th className="py-2.5">Verified</th>
              </tr>
            </thead>
            <tbody className="font-[var(--font-inter)] text-[13px] text-ink">
              {studentExclusive.map((offer) => (
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
                  <td className="py-3 pr-4">{offer.eligibility.regions.join(', ')}</td>
                  <td className="py-3 tabular-nums">
                    {formatDate(offer.verification.last_verified_at)}
                  </td>
                </tr>
              ))}
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
