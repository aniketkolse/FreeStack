import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Compass,
  Home,
  Share2,
  Trash2,
} from 'lucide-react';
import { OFFERS } from '../lib/data/resources';
import { useSavedOffers } from '../lib/saved/savedOffers';
import { ResourceCard } from '../components/offers/ResourceCard';
import { LearningCard } from '../components/offers/LearningCard';

interface SavedOffersPageProps {
  onNavigate: (path: string) => void;
}

export function SavedOffersPage({ onNavigate }: SavedOffersPageProps) {
  const { savedSlugs, clearSaved } = useSavedOffers();
  const [copiedStack, setCopiedStack] = useState(false);

  const savedOffers = useMemo(() => {
    const bySlug = new Map(OFFERS.map((offer) => [offer.identity.slug, offer]));
    return savedSlugs
      .map((slug) => bySlug.get(slug))
      .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer));
  }, [savedSlugs]);

  const handleShareStack = async () => {
    if (savedOffers.length === 0) return;
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://freestack.dev';
    const summaryLines = savedOffers.map(
      (o, idx) =>
        `${idx + 1}. ${o.identity.name} (${o.identity.provider}) — ${origin}/offer/${o.identity.slug}`
    );
    const text = `My Saved FreeStack Tools (${savedOffers.length}):\n${summaryLines.join('\n')}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedStack(true);
      window.setTimeout(() => setCopiedStack(false), 2200);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-5 sm:gap-6">
      {/* Compact Header Slab */}
      <section className="bg-sunshine-yellow rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[12.5px] rounded-full px-3 py-1 min-h-[30px] inline-flex items-center gap-1.5 spring-pill"
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Home</span>
            </a>
            <span className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12px] rounded-full px-3 py-1 inline-flex items-center gap-1.5">
              <Bookmark className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>{savedOffers.length} saved</span>
            </span>
          </div>

          <h1 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] leading-[1.06] tracking-[-0.03em] text-midnight-mouth">
            Saved tools &amp; resources
          </h1>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14.5px] text-midnight-mouth/85 max-w-2xl">
            Your personal bookmarked stack stored locally in your browser — no account or login wall required.
          </p>
        </div>

        {savedOffers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="share-saved-stack-btn"
              onClick={handleShareStack}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-4 py-2 min-h-[36px] inline-flex items-center gap-1.5 spring-pill cursor-pointer"
            >
              {copiedStack ? (
                <>
                  <Check className="w-3.5 h-3.5 text-grass-green" aria-hidden="true" />
                  <span>Stack copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Share saved stack</span>
                </>
              )}
            </button>
            <button
              type="button"
              data-testid="clear-saved-stack-btn"
              onClick={clearSaved}
              className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13px] rounded-full px-3.5 py-2 min-h-[36px] inline-flex items-center gap-1.5 spring-pill cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </section>

      {savedOffers.length === 0 ? (
        <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-8 sm:p-12 text-center flex flex-col items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-midnight-mouth">
            <Bookmark className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="font-[var(--font-wallop)] font-bold text-[20px] sm:text-[24px] text-midnight-mouth">
            No saved tools yet
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15px] text-ink/80 max-w-md">
            Tap the <strong>Save</strong> button on any AI model, MCP server, API, frontend tool, or student benefit to keep it handy here.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <a
              href="/explore"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/explore');
              }}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center gap-2 spring-pill"
            >
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Explore tools</span>
            </a>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="bg-paper text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center gap-2 spring-pill"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Back to Home</span>
            </a>
          </div>
        </section>
      ) : (
        <section
          data-testid="saved-offers-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
        >
          {savedOffers.map((offer) =>
            offer.learning ? (
              <LearningCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
            ) : (
              <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
            )
          )}
        </section>
      )}
    </div>
  );
}
