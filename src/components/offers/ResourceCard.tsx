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
  getCompactLimitPair,
} from '../../lib/utils/formatters';
import { getCategoryBySlug, prefetchOfferDetail } from '../../lib/data/resources';
import { shareOrCopyOffer, useSavedOffers } from '../../lib/saved/savedOffers';
import { getCategoryBgClass } from '../illustrations/TocaStickers';
import { OfferLogo } from './OfferLogo';

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

  const compactLimit = getCompactLimitPair(offer);

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
      className={`${cardBgClass} rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-4 h-[286px] sm:h-[304px] flex flex-col justify-between gap-2 sm:gap-2.5 spring-card min-w-0`}
    >
      <div className="flex flex-col gap-2.5 min-w-0">
        {/* Category-Colored Header Rectangle — White-backed Logo on Left + Tool Provider & Subcategory on Right */}
        <div
          data-testid={`resource-card-header-${offer.identity.slug}`}
          className={`${bgSwatchClass} rounded-[14px] sm:rounded-[16px] p-2.5 sm:p-3 flex items-center justify-between gap-3 min-w-0`}
        >
          <div className="w-10 h-10 rounded-[10px] sm:rounded-[12px] bg-white shadow-2xs flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            <OfferLogo
              offer={offer}
              priority={priority}
              imgClassName="w-7 h-7 object-contain"
              fallbackClassName="w-6 h-6"
            />
          </div>

          <div className="text-right min-w-0 flex-1 flex flex-col justify-center gap-1.5 sm:gap-2">
            <span className="block font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[14px] leading-[1.2] text-midnight-mouth truncate">
              {offer.identity.provider}
            </span>
            <span className="block font-[var(--font-inter)] text-[11.5px] sm:text-[12.5px] leading-[1.25] text-ink/85 truncate">
              {offer.classification.subcategory}
            </span>
          </div>
        </div>

        {/* Verification Metadata Line + Title Below Header */}
        <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
          <div className="flex flex-nowrap items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 font-[var(--font-inter)] text-[11.5px] sm:text-[12px] leading-[1.3] text-ink/75 min-w-0 truncate">
              {statusIcon}
              <span className="shrink-0">{formatVerificationStatus(offer.verification.status)}</span>
              <span aria-hidden="true" className="shrink-0">·</span>
              <span className="truncate">{formatDate(offer.verification.last_verified_at)}</span>
            </div>

            {requiresStudentId && (
              <span
                data-testid={`student-id-badge-${offer.identity.slug}`}
                className="bg-sunshine-yellow text-[#101014] font-[var(--font-wallop)] font-semibold text-[10.5px] sm:text-[11px] leading-none rounded-full px-2 sm:px-2.5 py-1 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <GraduationCap className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>Student ID / .edu Req.</span>
              </span>
            )}

            {isNoStudentIdStudentBenefit && (
              <span
                data-testid={`no-student-id-badge-${offer.identity.slug}`}
                className="bg-grass-green text-[#101014] font-[var(--font-wallop)] font-semibold text-[10.5px] sm:text-[11px] leading-none rounded-full px-2 sm:px-2.5 py-1 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>No Student ID Req.</span>
              </span>
            )}
          </div>

          <h3
            title={offer.identity.name}
            className="font-[var(--font-wallop)] font-bold text-[15.5px] sm:text-[17px] leading-[1.3] tracking-[-0.015em] text-midnight-mouth min-w-0 line-clamp-2"
          >
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

      {/* Middle Free-Tier Truth Summary */}
      <div className="pt-2.5 border-t border-midnight-mouth/10 min-w-0 sm:mb-1">
        <dl className="flex flex-col gap-1.5 font-[var(--font-inter)] text-[12px] sm:text-[12.5px] leading-[1.38] text-ink">
          <div className="flex items-baseline justify-between gap-2.5 min-w-0">
            <dt className="text-ink/70 shrink-0">Access model</dt>
            <dd className="font-medium text-right text-midnight-mouth min-w-0 truncate">
              {formatPricingModel(offer.classification.pricing_model)}
            </dd>
          </div>
          {offer.access.requirements.card_required === 'required' && (
            <div className="flex items-baseline justify-between gap-2.5 min-w-0">
              <dt className="text-ink/70 shrink-0">Payment card</dt>
              <dd className="font-medium text-right text-midnight-mouth min-w-0 truncate">
                {formatCardRequirement(offer.access.requirements.card_required)}
              </dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-2.5 min-w-0">
            <dt className="text-ink/70 shrink-0">{compactLimit.label}</dt>
            <dd
              title={compactLimit.value}
              className="font-normal text-right text-midnight-mouth tabular-nums min-w-0 truncate"
            >
              {compactLimit.value}
            </dd>
          </div>
          {requiresStudentId && offer.access.requirements.card_required !== 'required' && (
            <div className="flex items-baseline justify-between gap-2.5 min-w-0">
              <dt className="text-ink/70 shrink-0">Verification</dt>
              <dd className="font-semibold text-right text-midnight-mouth min-w-0 truncate">
                Student ID / .edu email needed
              </dd>
            </div>
          )}
          {isNoStudentIdStudentBenefit && offer.access.requirements.card_required !== 'required' && (
            <div className="flex items-baseline justify-between gap-2.5 min-w-0">
              <dt className="text-ink/70 shrink-0">Verification</dt>
              <dd className="font-semibold text-right text-midnight-mouth min-w-0 truncate">
                No Student ID / .edu needed
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Bottom Inspect + Save & Share Actions */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
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
    </article>
  );
});
