import React, { useState } from 'react';
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
import { shareOrCopyOffer, useSavedOffers } from '../../lib/saved/savedOffers';
import { OfferLogo } from './OfferLogo';

interface LearningCardProps {
  offer: Offer;
  onNavigate: (path: string) => void;
  surface?: 'daylight' | 'paper';
  wiggleIcon?: boolean;
}

export function LearningCard({
  offer,
  onNavigate,
  surface = 'daylight',
  wiggleIcon = false,
}: LearningCardProps) {
  const { isSaved, toggleSave } = useSavedOffers();
  const [sharedFeedback, setSharedFeedback] = useState(false);

  const saved = isSaved(offer.identity.slug);
  const cardBgClass = surface === 'paper' ? 'bg-paper' : 'bg-daylight';
  const learning = offer.learning;

  const handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(`/offer/${offer.identity.slug}`);
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
      className={`${cardBgClass} rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 flex flex-col justify-between gap-4 spring-card card-enter min-w-0`}
    >
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] bg-white shadow-xs flex items-center justify-center shrink-0 overflow-hidden p-1.5 ${
              wiggleIcon ? 'wiggle-tile' : ''
            }`}
          >
            <OfferLogo offer={offer} imgClassName="w-7 h-7 sm:w-8 sm:h-8 object-contain" fallbackClassName="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="text-right min-w-0">
            <span className="block font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[14px] leading-[1.15] text-midnight-mouth truncate">
              {learning ? formatLearningFormat(learning.format) : offer.classification.subcategory}
            </span>
            <span className="block font-[var(--font-inter)] text-[12px] sm:text-[12.5px] text-ink/80 mt-0.5 truncate">
              {offer.identity.provider}
            </span>
          </div>
        </div>

        {/* Clean Verification Line */}
        <div className="flex items-center gap-1.5 font-[var(--font-inter)] text-[12px] sm:text-[12.5px] text-ink/75">
          {offer.verification.status === 'verified' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-midnight-mouth shrink-0" aria-hidden="true" />
          )}
          <span>{formatVerificationStatus(offer.verification.status)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(offer.verification.last_verified_at)}</span>
        </div>

        <div className="min-w-0">
          <h3 className="font-[var(--font-wallop)] font-bold text-[17px] sm:text-[18.5px] leading-[1.2] tracking-[-0.02em] text-midnight-mouth mb-1.5">
            <a
              href={`/offer/${offer.identity.slug}`}
              onClick={handleOpen}
              className="hover:underline underline-offset-4"
            >
              {offer.identity.name}
            </a>
          </h3>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.45] text-ink/85 line-clamp-3">
            {offer.description}
          </p>
        </div>
      </div>

      {/* Focused Learning Metadata + Save & Share Actions */}
      <div className="flex flex-col gap-3 pt-3 border-t border-midnight-mouth/10 min-w-0">
        <dl className="flex flex-col gap-1 font-[var(--font-inter)] text-[12.5px] sm:text-[13px] text-ink">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink/70 shrink-0">Difficulty</dt>
            <dd className="font-medium text-midnight-mouth text-right min-w-0 break-words">
              {learning ? formatLearningDifficulty(learning.difficulty) : 'All levels'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink/70 shrink-0">Language</dt>
            <dd className="font-medium text-midnight-mouth text-right min-w-0 break-words">
              {learning?.language ?? 'Unknown'}
            </dd>
          </div>
          {learning && learning.topics.length > 0 && (
            <div className="pt-0.5 text-midnight-mouth font-semibold break-words line-clamp-1">
              {learning.topics.slice(0, 4).join(' · ')}
            </div>
          )}
        </dl>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <a
            href={`/offer/${offer.identity.slug}`}
            onClick={handleOpen}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[13.5px] leading-none rounded-full px-3.5 py-2 min-h-[36px] whitespace-nowrap spring-pill"
          >
            <span>View guide</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </a>

          <div className="flex items-center gap-1.5 shrink-0">
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
              className={`inline-flex items-center justify-center gap-1 font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3 py-1.5 min-h-[36px] filter-pill cursor-pointer border ${
                saved
                  ? 'bg-sunshine-yellow text-[#101014] border-midnight-mouth/15'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/10 hover:bg-sunshine-yellow/60'
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
              title="Share resource link"
              onClick={handleShare}
              className={`inline-flex items-center justify-center gap-1 font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-2.5 py-1.5 min-h-[36px] filter-pill cursor-pointer border ${
                sharedFeedback
                  ? 'bg-grass-green text-[#101014] border-midnight-mouth/15'
                  : 'bg-paper text-midnight-mouth border-midnight-mouth/10 hover:bg-sky-blue/50'
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
                  <span className="sr-only sm:not-sr-only">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

