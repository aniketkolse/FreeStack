import React, { memo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import type { Offer } from '../../types/resource';
import {
  formatDate,
  formatLearningDifficulty,
  formatLearningFormat,
  formatVerificationStatus,
} from '../../lib/utils/formatters';
import { getCategoryBySlug, prefetchOfferDetail } from '../../lib/data/resources';
import { prefetchRouteChunk } from '../../lib/router/routePrefetch';
import { shareOrCopyOffer, useSavedOffers } from '../../lib/saved/savedOffers';
import { getCategoryBgClass } from '../illustrations/TocaStickers';
import { OfferLogo } from './OfferLogo';

interface LearningCardProps {
  offer: Offer;
  onNavigate: (path: string) => void;
  surface?: 'daylight' | 'paper';
  wiggleIcon?: boolean;
  priority?: boolean;
}

export const LearningCard = memo(function LearningCard({
  offer,
  onNavigate,
  surface = 'daylight',
  wiggleIcon = false,
  priority = false,
}: LearningCardProps) {
  const { isSaved, toggleSave } = useSavedOffers();
  const [sharedFeedback, setSharedFeedback] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);

  const saved = isSaved(offer.identity.slug);
  const category = getCategoryBySlug(offer.classification.category);
  const bgSwatchClass = category ? getCategoryBgClass(category.color) : 'bg-sunshine-yellow';
  const cardBgClass = surface === 'paper' ? 'bg-paper' : 'bg-daylight';
  const learning = offer.learning;

  const handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(`/offer/${offer.identity.slug}`);
  };

  const handlePrefetchNow = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    prefetchRouteChunk('offer');
    prefetchOfferDetail(offer.identity.slug);
  };

  const handlePrefetchStart = () => {
    prefetchRouteChunk('offer');
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      prefetchOfferDetail(offer.identity.slug);
    }, 40);
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
      data-testid={`learning-card-${offer.identity.slug}`}
      onMouseEnter={handlePrefetchStart}
      onMouseLeave={handlePrefetchCancel}
      onFocus={handlePrefetchStart}
      onBlur={handlePrefetchCancel}
      onPointerDown={handlePrefetchNow}
      onTouchStart={handlePrefetchNow}
      className={`${cardBgClass} rounded-[15px] sm:rounded-[24px] p-2.5 sm:p-4 min-h-0 sm:min-h-[304px] h-full flex flex-col justify-between gap-2 sm:gap-2.5 spring-card min-w-0 overflow-hidden`}
    >
      <div className="flex flex-col gap-2 sm:gap-2.5 min-w-0">
        {/* Category-Colored Header Rectangle — White-backed Logo on Left + Provider & Format on Right */}
        <div
          data-testid={`learning-card-header-${offer.identity.slug}`}
          className={`${bgSwatchClass} rounded-[11px] sm:rounded-[16px] px-2.5 py-2 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3 min-w-0`}
        >
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[8px] sm:rounded-[12px] bg-white shadow-2xs flex items-center justify-center shrink-0 overflow-hidden p-1 sm:p-1.5 ${
              wiggleIcon ? 'wiggle-tile' : ''
            }`}
          >
            <OfferLogo
              offer={offer}
              priority={priority}
              imgClassName="w-5.5 h-5.5 sm:w-7 sm:h-7 object-contain"
              fallbackClassName="w-4.5 h-4.5 sm:w-6 sm:h-6"
            />
          </div>

          <div className="text-right min-w-0 flex-1 flex flex-col justify-center gap-0.5 sm:gap-2">
            <span className="block font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[14px] leading-[1.2] text-midnight-mouth truncate">
              {offer.identity.provider}
            </span>
            <span className="block font-[var(--font-inter)] text-[11px] sm:text-[12.5px] leading-[1.2] sm:leading-[1.25] text-ink/85 truncate">
              {learning ? formatLearningFormat(learning.format) : offer.classification.subcategory}
            </span>
          </div>
        </div>

        {/* Verification + Title Below Header */}
        <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 font-[var(--font-inter)] text-[11px] sm:text-[12px] leading-[1.25] sm:leading-[1.3] text-ink/75 min-w-0 truncate">
            {offer.verification.status === 'verified' ? (
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
            )}
            <span className="shrink-0">{formatVerificationStatus(offer.verification.status)}</span>
            <span aria-hidden="true" className="shrink-0">·</span>
            <span className="truncate">{formatDate(offer.verification.last_verified_at)}</span>
          </div>

          <h3
            title={offer.identity.name}
            className="font-[var(--font-wallop)] font-bold text-[14.5px] sm:text-[17px] leading-[1.24] sm:leading-[1.3] tracking-[-0.015em] text-midnight-mouth min-w-0 line-clamp-2"
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

      {/* Middle Learning Metadata */}
      <div className="pt-2 sm:pt-2.5 border-t border-midnight-mouth/10 min-w-0 w-full sm:mb-1 flex flex-col gap-1 sm:gap-1.5 font-[var(--font-inter)] text-[11.5px] sm:text-[12.5px] leading-[1.3] sm:leading-[1.38] text-ink">
        <dl className="w-full min-w-0 flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-baseline justify-between gap-2 sm:gap-2.5 min-w-0">
            <dt className="text-ink/70 shrink-0">Difficulty</dt>
            <dd className="font-medium text-midnight-mouth text-right min-w-0 truncate pr-0.5 sm:pr-0">
              {learning ? formatLearningDifficulty(learning.difficulty) : 'All levels'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2 sm:gap-2.5 min-w-0">
            <dt className="text-ink/70 shrink-0">Language</dt>
            <dd className="font-medium text-midnight-mouth text-right min-w-0 truncate pr-0.5 sm:pr-0">
              {learning?.language ?? 'Unknown'}
            </dd>
          </div>
        </dl>
        {learning && learning.topics.length > 0 && (
          <p className="pt-0.5 leading-[1.3] sm:leading-[1.38] text-midnight-mouth font-semibold truncate">
            {learning.topics.slice(0, 4).join(' · ')}
          </p>
        )}
      </div>

      {/* Bottom View Guide + Save & Share Actions */}
      <div className="flex items-center justify-between gap-1.5 min-w-0 w-full">
          <a
            href={`/offer/${offer.identity.slug}`}
            onClick={handleOpen}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[11.5px] sm:text-[12.5px] leading-none rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px] whitespace-nowrap spring-pill"
          >
            <span>View</span>
            <span className="hidden sm:inline lg:hidden 2xl:inline">guide</span>
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
          </a>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              data-testid={`save-btn-${offer.identity.slug}`}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${offer.identity.name} from saved tools` : `Save ${offer.identity.name}`}
              title={saved ? 'Saved to your stack' : 'Save resource'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSave(offer.identity.slug);
              }}
              className={`inline-flex items-center justify-center gap-1 font-[var(--font-wallop)] font-semibold text-[11px] sm:text-[11.5px] leading-none rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[36px] whitespace-nowrap filter-pill cursor-pointer border ${
                saved
                  ? 'bg-sunshine-yellow text-[#101014] border-midnight-mouth/15'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow hover:text-[#101014]'
              }`}
            >
              <Bookmark
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${saved ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              data-testid={`share-btn-${offer.identity.slug}`}
              aria-label={`Share ${offer.identity.name}`}
              title="Share resource link"
              onClick={handleShare}
              className={`inline-flex items-center justify-center gap-1 font-[var(--font-wallop)] font-semibold text-[11px] sm:text-[11.5px] leading-none rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-[32px] sm:min-h-[36px] whitespace-nowrap filter-pill cursor-pointer border ${
                sharedFeedback
                  ? 'bg-grass-green text-[#101014] border-midnight-mouth/15'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/10 hover:bg-sky-blue hover:text-[#101014]'
              }`}
            >
              {sharedFeedback ? (
                <>
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
      </div>
    </article>
  );
});
