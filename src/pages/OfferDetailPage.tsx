import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  GraduationCap,
  HelpCircle,
  ExternalLink,
  Share2,
  ShieldCheck,
  FileText,
  Flag,
  BookOpen,
} from 'lucide-react';
import {
  getCategoryBySlug,
  getOfferBySlug,
  getRelatedOffers,
} from '../lib/data/resources';
import {
  formatAccountRequirement,
  formatCardRequirement,
  formatDate,
  formatLearningDifficulty,
  formatLearningFormat,
  formatPricingModel,
  formatResourceType,
  formatStudentAccess,
  formatValidityType,
  formatVerificationStatus,
  getSafeGoUrl,
} from '../lib/utils/formatters';
import { shareOrCopyOffer, useSavedOffers } from '../lib/saved/savedOffers';
import { getBackNavigationMeta } from '../lib/router/navigationHistory';
import { safeExternalUrl } from '../lib/utils/safeExternalUrl';
import { getCategoryBgClass } from '../components/illustrations/TocaStickers';
import { OfferLogo } from '../components/offers/OfferLogo';
import { ResourceCard } from '../components/offers/ResourceCard';
import { ReportOutdatedModal } from '../components/offers/ReportOutdatedModal';

interface OfferDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onBack?: (fallbackPath?: string) => void;
  previousPath?: string | null;
}

export function OfferDetailPage({
  slug,
  onNavigate,
  onBack,
  previousPath = null,
}: OfferDetailPageProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [sharedFeedback, setSharedFeedback] = useState(false);
  const { isSaved, toggleSave } = useSavedOffers();

  const offer = getOfferBySlug(slug);
  const category = offer ? getCategoryBySlug(offer.classification.category) : undefined;
  const fallbackPath = category ? `/category/${category.slug}` : '/explore';
  const backMeta = getBackNavigationMeta(previousPath, fallbackPath, {
    getCategoryName: (catSlug) => getCategoryBySlug(catSlug)?.name,
    getOfferName: (offerSlug) => getOfferBySlug(offerSlug)?.identity.name,
  });

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onBack) {
      onBack(fallbackPath);
    } else {
      onNavigate(backMeta.targetHref);
    }
  };

  if (!offer) {
    return (
      <div className="max-w-[1360px] mx-auto px-6 py-16 text-center flex flex-col items-center gap-4">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[32px] text-midnight-mouth">
          Resource not found
        </h1>
        <p className="font-[var(--font-inter)] text-[15px] text-ink/80">
          This listing could not be found in the FreeStack catalog.
        </p>
        <a
          href={backMeta.targetHref}
          data-testid="offer-not-found-back-btn"
          onClick={handleBackClick}
          className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 inline-flex items-center gap-1.5 spring-pill"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{backMeta.label}</span>
        </a>
      </div>
    );
  }

  const saved = isSaved(offer.identity.slug);
  const requiresStudentId = offer.eligibility.student_access === 'exclusive';
  const bgClass = category ? getCategoryBgClass(category.color) : 'bg-sky-blue';
  const related = getRelatedOffers(offer, 3);
  const sourceById = new Map(offer.evidence.sources.map((s) => [s.id, s]));

  const handleShare = async () => {
    const res = await shareOrCopyOffer(offer);
    if (res === 'copied' || res === 'shared') {
      setSharedFeedback(true);
      window.setTimeout(() => setSharedFeedback(false), 2000);
    }
  };

  const statusIcon =
    offer.verification.status === 'verified' ? (
      <CheckCircle2 className="w-4 h-4 text-midnight-mouth shrink-0" aria-hidden="true" />
    ) : offer.verification.status === 'needs_review' ? (
      <AlertCircle className="w-4 h-4 text-midnight-mouth shrink-0" aria-hidden="true" />
    ) : offer.verification.status === 'unverified' ? (
      <HelpCircle className="w-4 h-4 text-midnight-mouth shrink-0" aria-hidden="true" />
    ) : (
      <Clock className="w-4 h-4 text-midnight-mouth shrink-0" aria-hidden="true" />
    );

  const goOfficial = getSafeGoUrl(offer.identity.slug, offer.links.official);
  const goSignup = offer.links.signup
    ? getSafeGoUrl(`${offer.identity.slug}?target=signup`, offer.links.signup)
    : null;
  const goDocs = offer.links.documentation
    ? getSafeGoUrl(`${offer.identity.slug}?target=docs`, offer.links.documentation)
    : null;
  const goPricing = offer.links.pricing
    ? getSafeGoUrl(`${offer.identity.slug}?target=pricing`, offer.links.pricing)
    : null;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-5 sm:gap-7">
      {/* Top Back & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <a
          href={backMeta.targetHref}
          data-testid="offer-back-btn"
          onClick={handleBackClick}
          className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[13.5px] rounded-full px-4 py-1.5 min-h-[34px] inline-flex items-center gap-1.5 spring-pill max-w-full"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[260px] sm:max-w-[360px]">{backMeta.label}</span>
        </a>

        <nav
          aria-label="Breadcrumb"
          className="font-[var(--font-inter)] text-[12.5px] sm:text-[13px] text-ink/75 flex flex-wrap items-center gap-1.5"
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="hover:underline py-0.5"
          >
            Home
          </a>
          <span aria-hidden="true">/</span>
          {category && (
            <>
              <a
                href={`/category/${category.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`/category/${category.slug}`);
                }}
                className="hover:underline py-0.5"
              >
                {category.name}
              </a>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span className="text-midnight-mouth font-medium">{offer.identity.name}</span>
        </nav>
      </div>

      {/* Compact Hero Intro Slab */}
      <section className={`${bgClass} rounded-[22px] sm:rounded-[26px] p-5 sm:p-7 md:p-9 flex flex-col gap-3.5 sm:gap-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[16px] bg-white shadow-xs flex items-center justify-center shrink-0 overflow-hidden p-2">
              <OfferLogo offer={offer} imgClassName="w-8 h-8 sm:w-9 sm:h-9 object-contain" fallbackClassName="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-[var(--font-wallop)] font-semibold text-[15px] sm:text-[16px] text-midnight-mouth truncate">
                  {offer.identity.provider}
                </p>
                {requiresStudentId && (
                  <span className="bg-sunshine-yellow text-[#101014] font-[var(--font-wallop)] font-semibold text-[11.5px] rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Student ID / .edu Required</span>
                  </span>
                )}
              </div>
              <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[13.5px] text-ink/85">
                {category?.name ?? offer.classification.category} · {offer.classification.subcategory} ·{' '}
                {formatResourceType(offer.classification.resource_type)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="detail-save-btn"
              aria-pressed={saved}
              onClick={() => toggleSave(offer.identity.slug)}
              className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-2 min-h-[36px] inline-flex items-center justify-center gap-1.5 cursor-pointer spring-pill ${
                saved
                  ? 'bg-midnight-mouth text-daylight'
                  : 'bg-paper text-midnight-mouth hover:bg-sunshine-yellow'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>{saved ? 'Saved to stack' : 'Save tool'}</span>
            </button>

            <button
              type="button"
              data-testid="detail-share-btn"
              onClick={handleShare}
              className={`font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-2 min-h-[36px] inline-flex items-center justify-center gap-1.5 cursor-pointer spring-pill ${
                sharedFeedback
                  ? 'bg-grass-green text-[#101014]'
                  : 'bg-paper text-midnight-mouth hover:bg-sunshine-yellow'
              }`}
            >
              {sharedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Link copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Share tool</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="open-report-modal-btn"
              onClick={() => setReportOpen(true)}
              className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-2 min-h-[36px] inline-flex items-center justify-center gap-1.5 cursor-pointer spring-pill"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Report outdated info</span>
            </button>
          </div>
        </div>

        <h1 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.03em] text-midnight-mouth">
          {offer.identity.name}
        </h1>

        <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.5] text-ink max-w-3xl">
          {offer.description}
        </p>
      </section>

      {/* 70/30 Desktop Main/Sidebar Arrangement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Main Column (~70%: 8 cols on PC, 2nd on mobile) */}
        <div className="order-2 lg:order-1 lg:col-span-8 flex flex-col gap-5 sm:gap-6 min-w-0">
          {/* Free-Tier Usage Limits */}
          <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4">
            <div>
              <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] leading-[1.15] tracking-[-0.02em] text-midnight-mouth">
                What is actually free
              </h2>
              <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] text-ink/80 mt-1">
                Classification:{' '}
                <strong className="text-midnight-mouth">
                  {formatPricingModel(offer.classification.pricing_model)}
                </strong>
              </p>
            </div>

            {offer.access.free_limits.length > 0 ? (
              <div className="flex flex-col gap-2">
                {offer.access.free_limits.map((limit) => (
                  <div
                    key={limit.name}
                    className="bg-paper rounded-[14px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3"
                  >
                    <span className="font-[var(--font-inter)] font-medium text-[13.5px] sm:text-[14px] text-ink">
                      {limit.name}
                    </span>
                    <span className="font-[var(--font-wallop)] font-bold text-[14.5px] sm:text-[15.5px] text-midnight-mouth tabular-nums sm:text-right break-words">
                      {limit.value === null ? 'Unknown' : String(limit.value)}
                      {limit.period ? ` · ${limit.period}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="bg-paper rounded-[14px] p-4 font-[var(--font-inter)] text-[14px] text-ink/80">
                Specific quota numbers not published by provider.
              </p>
            )}

            {/* Restrictions & Conditions */}
            {offer.access.restrictions.length > 0 && (
              <div className="bg-paper rounded-[16px] p-4 sm:p-5 flex flex-col gap-2">
                <h3 className="font-[var(--font-wallop)] font-semibold text-[15px] text-midnight-mouth">
                  Conditions &amp; restrictions
                </h3>
                <ul className="flex flex-col gap-1.5 font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink/90 list-disc pl-4">
                  {offer.access.restrictions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Learning Metadata Panel when present */}
          {offer.learning && (
            <section className="bg-sunshine-yellow rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-midnight-mouth shrink-0" aria-hidden="true" />
                <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] leading-[1.15] text-midnight-mouth">
                  Study material profile
                </h2>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="bg-paper rounded-[14px] p-3.5">
                  <dt className="font-[var(--font-inter)] text-[12px] text-ink/70">Format</dt>
                  <dd className="font-[var(--font-wallop)] font-bold text-[15px] text-midnight-mouth mt-0.5">
                    {formatLearningFormat(offer.learning.format)}
                  </dd>
                </div>
                <div className="bg-paper rounded-[14px] p-3.5">
                  <dt className="font-[var(--font-inter)] text-[12px] text-ink/70">Difficulty</dt>
                  <dd className="font-[var(--font-wallop)] font-bold text-[15px] text-midnight-mouth mt-0.5">
                    {formatLearningDifficulty(offer.learning.difficulty)}
                  </dd>
                </div>
                <div className="bg-paper rounded-[14px] p-3.5">
                  <dt className="font-[var(--font-inter)] text-[12px] text-ink/70">Language</dt>
                  <dd className="font-[var(--font-wallop)] font-bold text-[15px] text-midnight-mouth mt-0.5">
                    {offer.learning.language ?? 'Unknown'}
                  </dd>
                </div>
              </dl>
              <div className="font-[var(--font-inter)] text-[13.5px] text-midnight-mouth">
                <strong>Topics:</strong> {offer.learning.topics.join(' · ')}
              </div>
            </section>
          )}

          {/* Eligibility, Validity & Auto-Renewal */}
          <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4">
            <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] leading-[1.15] tracking-[-0.02em] text-midnight-mouth">
              Eligibility, validity &amp; expiry rules
            </h2>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-paper rounded-[14px] p-4">
                <dt className="font-[var(--font-wallop)] font-semibold text-[14px] text-midnight-mouth mb-0.5">
                  Student eligibility
                </dt>
                <dd className="font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink/90">
                  {formatStudentAccess(offer.eligibility.student_access)}
                </dd>
              </div>

              <div className="bg-paper rounded-[14px] p-4">
                <dt className="font-[var(--font-wallop)] font-semibold text-[14px] text-midnight-mouth mb-0.5">
                  Supported regions
                </dt>
                <dd className="font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink/90">
                  {offer.eligibility.regions.length > 0
                    ? offer.eligibility.regions.join(', ')
                    : 'Region availability unknown'}
                </dd>
              </div>

              <div className="bg-paper rounded-[14px] p-4">
                <dt className="font-[var(--font-wallop)] font-semibold text-[14px] text-midnight-mouth mb-0.5">
                  Validity &amp; duration
                </dt>
                <dd className="font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink/90">
                  {formatValidityType(offer.access.validity.type)}
                  {offer.access.validity.duration ? ` — ${offer.access.validity.duration}` : ''}
                </dd>
              </div>

              <div className="bg-paper rounded-[14px] p-4">
                <dt className="font-[var(--font-wallop)] font-semibold text-[14px] text-midnight-mouth mb-0.5">
                  Auto-renewal &amp; overages
                </dt>
                <dd className="font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink/90">
                  {offer.access.validity.auto_renewal ?? 'Unknown / not specified by provider'}
                </dd>
              </div>
            </dl>

            <div className="bg-paper rounded-[14px] p-4">
              <h3 className="font-[var(--font-wallop)] font-semibold text-[14px] text-midnight-mouth mb-0.5">
                Who qualifies
              </h3>
              <p className="font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink/90">
                {offer.eligibility.conditions ?? 'Unknown / not explicitly stated.'}
              </p>
            </div>
          </section>

          {/* Section 21: 10-Question FreeStack Standard Summary */}
          <section
            data-testid="ten-point-checklist"
            className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4"
          >
            <div>
              <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] leading-[1.15] tracking-[-0.02em] text-midnight-mouth">
                10-point FreeStack verification summary
              </h2>
              <p className="font-[var(--font-inter)] text-[13.5px] text-ink/80 mt-1">
                Every listing in FreeStack answers these 10 core questions without hidden assumptions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  q: '01. What is this resource?',
                  a: `${offer.identity.name} by ${offer.identity.provider} (${formatResourceType(offer.classification.resource_type)}).`,
                },
                {
                  q: '02. What can I use it for?',
                  a: `${category?.name ?? offer.classification.category} — ${offer.classification.subcategory}.`,
                },
                {
                  q: '03. What part is actually free?',
                  a: `${formatPricingModel(offer.classification.pricing_model)} (${offer.access.free_limits[0]?.name ?? 'Core access'}).`,
                },
                {
                  q: '04. What are the limits?',
                  a:
                    offer.access.free_limits.length > 0
                      ? offer.access.free_limits
                          .map((l) => `${l.name}: ${l.value ?? 'Unknown'}${l.period ? ` (${l.period})` : ''}`)
                          .join(' · ')
                      : 'Quota numbers not published by provider.',
                },
                {
                  q: '05. Do I need a payment card?',
                  a: formatCardRequirement(offer.access.requirements.card_required),
                },
                {
                  q: '06. Who is eligible?',
                  a: `${formatStudentAccess(offer.eligibility.student_access)}${offer.eligibility.conditions ? ` — ${offer.eligibility.conditions}` : ''}`,
                },
                {
                  q: '07. Which regions are supported?',
                  a:
                    offer.eligibility.regions.length > 0
                      ? offer.eligibility.regions.join(', ')
                      : 'Unknown',
                },
                {
                  q: '08. Does access expire?',
                  a: `${formatValidityType(offer.access.validity.type)}${offer.access.validity.duration ? ` (${offer.access.validity.duration})` : ''}`,
                },
                {
                  q: '09. Where is the official source?',
                  a: offer.links.official,
                },
                {
                  q: '10. When was it last verified?',
                  a: `${formatVerificationStatus(offer.verification.status)} on ${formatDate(offer.verification.last_verified_at)}`,
                },
              ].map((item) => (
                <div key={item.q} className="bg-paper rounded-[14px] p-3.5 flex flex-col gap-0.5">
                  <span className="font-[var(--font-wallop)] font-bold text-[13.5px] text-midnight-mouth">
                    {item.q}
                  </span>
                  <span className="font-[var(--font-inter)] text-[12.5px] sm:text-[13px] leading-[1.45] text-ink/90 break-words">
                    {item.a}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence & Official Sources */}
          <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-7 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-midnight-mouth shrink-0" aria-hidden="true" />
                <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] leading-[1.15] tracking-[-0.02em] text-midnight-mouth">
                  Official evidence &amp; sources
                </h2>
              </div>
              <span className="font-[var(--font-inter)] text-[12.5px] text-ink/75 tabular-nums">
                Schema v{offer.schema_version} · Updated {formatDate(offer.metadata.updated_at)}
              </span>
            </div>

            {offer.evidence.claims.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {offer.evidence.claims.map((claim, idx) => {
                  const src = sourceById.get(claim.source_id);
                  return (
                    <blockquote
                      key={`${claim.field_path}-${idx}`}
                      className="bg-paper rounded-[16px] p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-[var(--font-wallop)] font-semibold text-[13px] text-midnight-mouth flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                            {claim.field_path}
                          </span>
                          <span className="font-[var(--font-inter)] text-[11px] text-ink/70 uppercase tracking-wide">
                            {claim.confidence} confidence
                          </span>
                        </div>
                        <p className="font-[var(--font-inter)] text-[13.5px] leading-[1.45] text-ink">
                          &ldquo;{claim.quote}&rdquo;
                        </p>
                        {claim.notes && (
                          <p className="font-[var(--font-inter)] text-[12px] text-ink/75 mt-1.5">
                            Note: {claim.notes}
                          </p>
                        )}
                      </div>

                      {src && safeExternalUrl(src.url) && (
                        <a
                          href={safeExternalUrl(src.url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-[var(--font-inter)] text-[12px] text-midnight-mouth underline underline-offset-4 break-all inline-flex items-center gap-1"
                        >
                          <span>
                            {src.source_type.replace('_', ' ')} (checked {formatDate(src.checked_at)}):{' '}
                            {src.url}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                        </a>
                      )}
                    </blockquote>
                  );
                })}
              </div>
            ) : (
              <p className="font-[var(--font-inter)] text-[14px] text-ink/80 bg-paper rounded-[14px] p-4">
                No verbatim claim quotes recorded yet. Verify directly on the official provider links before relying on limits.
              </p>
            )}

            {offer.classification.tags.length > 0 && (
              <div className="font-[var(--font-inter)] text-[12.5px] text-ink/75">
                Tags: {offer.classification.tags.join(' · ')}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar (~30%: 4 cols on PC, 1st on Mobile) */}
        <aside className="order-1 lg:order-2 lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-[82px]">
          <div className="bg-daylight rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] text-midnight-mouth">
                {formatVerificationStatus(offer.verification.status)}
              </span>
            </div>

            {offer.verification.notes && (
              <div className="bg-sunshine-yellow rounded-[14px] p-3.5 font-[var(--font-inter)] text-[13px] leading-[1.4] text-midnight-mouth">
                {offer.verification.notes}
              </div>
            )}

            <dl className="flex flex-col gap-2 pt-2 border-t border-midnight-mouth/10 font-[var(--font-inter)] text-[13.5px]">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-ink/70 shrink-0">Last verified</dt>
                <dd className="font-semibold text-midnight-mouth tabular-nums text-right">
                  {formatDate(offer.verification.last_verified_at)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-ink/70 shrink-0">Pricing model</dt>
                <dd className="font-semibold text-midnight-mouth text-right break-words">
                  {formatPricingModel(offer.classification.pricing_model)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-ink/70 shrink-0">Payment card</dt>
                <dd className="font-semibold text-midnight-mouth text-right break-words">
                  {formatCardRequirement(offer.access.requirements.card_required)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-ink/70 shrink-0">Account needed</dt>
                <dd className="font-semibold text-midnight-mouth text-right break-words">
                  {formatAccountRequirement(offer.access.requirements.account_required)}
                </dd>
              </div>
            </dl>

            {offer.access.requirements.payment_method_notes && (
              <p className="font-[var(--font-inter)] text-[13px] leading-[1.45] text-ink/85 bg-paper rounded-[14px] p-3.5">
                {offer.access.requirements.payment_method_notes}
              </p>
            )}

            {/* Safe /go/:slug Outbound Redirect Links */}
            <div className="flex flex-col gap-2 pt-1">
              {goOfficial && (
                <a
                  href={`/go/${encodeURIComponent(offer.identity.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center justify-center gap-1.5 spring-pill"
                >
                  <span>Visit official site</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              {goSignup && (
                <a
                  href={`/go/${encodeURIComponent(offer.identity.slug)}?target=signup`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center justify-center gap-1.5 spring-pill"
                >
                  <span>Direct signup</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
              {goPricing && (
                <a
                  href={`/go/${encodeURIComponent(offer.identity.slug)}?target=pricing`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center justify-center gap-1.5 spring-pill"
                >
                  <span>Official pricing page</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
              {goDocs && (
                <a
                  href={`/go/${encodeURIComponent(offer.identity.slug)}?target=docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-4 py-2 min-h-[38px] inline-flex items-center justify-center gap-1.5 spring-pill"
                >
                  <span>Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="bg-paper rounded-[14px] p-3.5 font-[var(--font-inter)] text-[12px] leading-[1.45] text-ink/80">
              <strong className="text-midnight-mouth">Independent notice:</strong> FreeStack is not affiliated with {offer.identity.provider}. Free quotas, pricing, and card rules can change at any time—verify on the official page before use. Listing a tool, API, or MCP server is not a security audit; review permissions and source code before connecting credentials.
            </div>

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-0.5 min-h-[34px] text-center font-[var(--font-inter)] text-[13px] text-midnight-mouth underline underline-offset-4 cursor-pointer hover:text-ink"
            >
              Spot a change? Report outdated info
            </button>
          </div>
        </aside>
      </div>

      {/* Related Resources */}
      {related.length > 0 && (
        <section className="flex flex-col gap-4 pt-2">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[22px] sm:text-[28px] leading-[1.1] tracking-[-0.025em] text-midnight-mouth">
            More in {category?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {related.map((item) => (
              <ResourceCard key={item.identity.id} offer={item} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      <ReportOutdatedModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        offerSlug={offer.identity.slug}
        offerName={offer.identity.name}
      />
    </div>
  );
}
