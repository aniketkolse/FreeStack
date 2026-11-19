import React, { memo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  GraduationCap,
  HelpCircle,
  Share2,
} from 'lucide-react';
import type { Offer } from '../../types/resource';
import {
  formatCardRequirement,
  formatDate,
  formatPricingModel,
  formatVerificationStatus,
  getPrimaryLimitSummary,
} from '../../lib/utils/formatters';
import { getCategoryBySlug, prefetchOfferDetail } from '../../lib/data/resources';
import { shareOrCopyOffer, useSavedOffers } from '../../lib/saved/savedOffers';
import { getCategoryBgClass } from '../illustrations/TocaStickers';
import { OfferLogo } from './OfferLogo';
import { getAiContextWindow, getAiModality } from '../../lib/ai/aiModelMetadata';

interface ResourceCardProps {
  offer: Offer;
  onNavigate: (path: string) => void;
  surface?: 'daylight' | 'paper';
  priority?: boolean;
}

export const ResourceCard = memo(function ResourceCard({
  offer,
  onNavigate,
  surface = 'daylight',
  priority = false,
}: ResourceCardProps) {
  const { isSaved, toggleSave } = useSavedOffers();
  const [sharedFeedback, setSharedFeedback] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);

  const saved = isSaved(offer.identity.slug);
  const requiresStudentId = offer.eligibility.student_access === 'exclusive';
  const isNoStudentIdStudentBenefit =
    offer.classification.category === 'student-benefits' &&
    offer.eligibility.student_access === 'eligible';

  const category = getCategoryBySlug(offer.classification.category);
  const bgSwatchClass = category ? getCategoryBgClass(category.color) : 'bg-sky-blue';
  const cardBgClass = surface === 'paper' ? 'bg-paper' : 'bg-daylight';

  const aiModality = getAiModality(offer);
  const aiContext = getAiContextWindow(offer);
  const aiRateLimit =
    offer.classification.category === 'ai-ml'
      ? offer.access.free_limits.find((l) => /rate\s*limit|requests|quota|neurons|local/i.test(l.name))
      : undefined;

  const statusIcon =
    offer.verification.status === 'verified' ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
    ) : offer.verification.status === 'needs_review' ? (
      <AlertCircle className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
    ) : offer.verification.status === 'unverified' ? (
      <HelpCircle className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
    ) : (
      <Clock className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
    );

  const handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(`/offer/${offer.identity.slug}`);
  };

  const handlePrefetchStart = () => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      prefetchOfferDetail(offer.identity.slug);
    }, 100);
  };

  const handlePrefetchCancel = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await shareOrCopyOffer(offer);
    if (res === 'copied' || res === 'shared') {
      setSharedFeedback(true);
      window.setTimeout(() => setSharedFeedback(false), 1800);
    }
  };

  return (
    <article
      data-testid={`resource-card-${offer.identity.slug}`}
      onMouseEnter={handlePrefetchStart}
      onMouseLeave={handlePrefetchCancel}
      onFocus={handlePrefetchStart}
      onBlur={handlePrefetchCancel}
      className={`${cardBgClass} rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-3 spring-card min-w-0`}
    >
      <div className="flex flex-col gap-2.5 min-w-0">
        {/* Category-Colored Header Rectangle — White-backed Logo on Left + Tool Provider & Subcategory on Right */}
        <div
          data-testid={`resource-card-header-${offer.identity.slug}`}
          className={`${bgSwatchClass} rounded-[14px] sm:rounded-[16px] p-3 sm:p-3.5 flex items-center justify-between gap-3 min-w-0`}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-[12px] bg-white shadow-2xs flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            <OfferLogo
              offer={offer}
              priority={priority}
              imgClassName="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              fallbackClassName="w-6 h-6 sm:w-7 sm:h-7"
            />
          </div>

          <div className="text-right min-w-0 flex-1">
            <span className="block font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[14px] leading-[1.15] text-midnight-mouth truncate">
              {offer.identity.provider}
            </span>
            <span className="block font-[var(--font-inter)] text-[11.5px] sm:text-[12.5px] leading-[1.2] text-ink/85 mt-0.5 truncate">
              {offer.classification.subcategory}
            </span>
          </div>
        </div>

        {/* Verification Metadata Line + Title Below Header */}
        <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-[var(--font-inter)] text-[11.5px] sm:text-[12px] leading-[1.2] text-ink/75">
              {statusIcon}
              <span>{formatVerificationStatus(offer.verification.status)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(offer.verification.last_verified_at)}</span>
            </div>

            {aiModality && (
              <div className="flex items-center gap-1 shrink-0">
                <span
                  data-testid={`ai-modality-badge-${offer.identity.slug}`}
                  className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[10.5px] leading-none rounded-full px-2 py-1 border border-midnight-mouth/12"
                >
                  {aiModality.shortLabel}
                </span>
                {aiContext && (
                  <span
                    data-testid={`ai-context-badge-${offer.identity.slug}`}
                    className="bg-sunshine-yellow text-[#101014] font-[var(--font-wallop)] font-bold text-[10.5px] leading-none rounded-full px-2 py-1 tabular-nums"
                  >
                    {aiContext.label}
                  </span>
                )}
              </div>
            )}

            {requiresStudentId && (
              <span
                data-testid={`student-id-badge-${offer.identity.slug}`}
                className="bg-sunshine-yellow text-[#101014] font-[var(--font-wallop)] font-semibold text-[11px] leading-none rounded-full px-2.5 py-1 inline-flex items-center gap-1 shrink-0"
              >
                <GraduationCap className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>Student ID / .edu Req.</span>
              </span>
            )}

            {isNoStudentIdStudentBenefit && (
              <span
                data-testid={`no-student-id-badge-${offer.identity.slug}`}
                className="bg-grass-green text-[#101014] font-[var(--font-wallop)] font-semibold text-[11px] leading-none rounded-full px-2.5 py-1 inline-flex items-center gap-1 shrink-0"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>No Student ID Req.</span>
              </span>
            )}
          </div>

          <h3 className="font-[var(--font-wallop)] font-bold text-[16px] sm:text-[18px] leading-[1.22] tracking-[-0.02em] text-midnight-mouth min-w-0">
            <a
              href={`/offer/${offer.identity.slug}`}
              onClick={handleOpen}
              className="hover:underline underline-offset-4"
            >
              {offer.identity.name}
            </a>
          </h3>
        </div>
      </div>

      {/* Bottom Free-Tier Truth Summary + Inspect + Save & Share Actions */}
      <div className="flex flex-col gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-midnight-mouth/10 min-w-0">
        <dl className="flex flex-col gap-1 font-[var(--font-inter)] text-[12px] sm:text-[12.5px] leading-[1.35] text-ink">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink/70 shrink-0">Access model</dt>
            <dd className="font-medium text-right text-midnight-mouth min-w-0 break-words">
              {formatPricingModel(offer.classification.pricing_model)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink/70 shrink-0">Payment card</dt>
            <dd className="font-medium text-right text-midnight-mouth min-w-0 break-words">
              {formatCardRequirement(offer.access.requirements.card_required)}
            </dd>
          </div>
          {aiContext && (
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-ink/70 shrink-0">Context window</dt>
              <dd className="font-semibold text-right text-midnight-mouth tabular-nums min-w-0 break-words">
                {aiContext.label.replace(' ctx', ' tokens')}
              </dd>
            </div>
          )}
          {requiresStudentId && (
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-ink/70 shrink-0">Verification</dt>
              <dd className="font-semibold text-right text-midnight-mouth min-w-0 break-words">
                Student ID / .edu email needed
              </dd>
            </div>
          )}
          {isNoStudentIdStudentBenefit && (
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-ink/70 shrink-0">Verification</dt>
              <dd className="font-semibold text-right text-midnight-mouth min-w-0 break-words">
                No Student ID / .edu needed
              </dd>
            </div>
          )}
          <div className="pt-0.5 text-midnight-mouth font-semibold tabular-nums break-words line-clamp-1">
            {aiRateLimit
              ? `${aiRateLimit.name}: ${aiRateLimit.value}${aiRateLimit.period ? ` ${aiRateLimit.period}` : ''}`
              : getPrimaryLimitSummary(offer)}
          </div>
        </dl>

        <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-0.5">
          <a
            href={`/offer/${offer.identity.slug}`}
            onClick={handleOpen}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[13.5px] leading-none rounded-full px-3 sm:px-3.5 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[36px] whitespace-nowrap spring-pill"
          >
            <span className="sm:hidden">Inspect</span>
            <span className="hidden sm:inline">Inspect offer</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </a>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid={`save-btn-${offer.identity.slug}`}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${offer.identity.name} from saved tools` : `Save ${offer.identity.name}`}
              title={saved ? 'Saved to your stack' : 'Save tool'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSave(offer.identity.slug);
              }}
              className={`inline-flex items-center justify-center gap-1 font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[12px] rounded-full px-2.5 sm:px-3 py-1.5 min-h-[34px] sm:min-h-[36px] filter-pill cursor-pointer border ${
                saved
                  ? 'bg-sunshine-yellow text-[#101014] border-midnight-mouth/15'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow hover:text-[#101014]'
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 shrink-0 ${saved ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              data-testid={`share-btn-${offer.identity.slug}`}
              aria-label={`Share ${offer.identity.name}`}
              title="Share tool link"
              onClick={handleShare}
              className={`inline-flex items-center justify-center gap-1 font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[12px] rounded-full px-2.5 py-1.5 min-h-[34px] sm:min-h-[36px] filter-pill cursor-pointer border ${
                sharedFeedback
                  ? 'bg-grass-green text-[#101014] border-midnight-mouth/15'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/10 hover:bg-sky-blue hover:text-[#101014]'
              }`}
            >
              {sharedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});
