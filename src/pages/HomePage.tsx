import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  CATEGORIES,
  getCategoryCounts,
  getLearningOffers,
  getRecentlyVerifiedOffers,
} from '../lib/data/resources';
import { prefetchRouteWithData } from '../lib/router/routePrefetch';
import {
  computeActiveSlideIndex,
  computeSlideScrollLeft,
} from '../lib/utils/carousel';
import { SearchBar } from '../components/search/SearchBar';
import { ResourceCard } from '../components/offers/ResourceCard';
import { LearningCard } from '../components/offers/LearningCard';
import { CategoryTile } from '../components/categories/CategoryTile';
import {
  HeroBoltSticker,
  HeroHeartSticker,
  SlabIllustration,
  SparkBurstDoodle,
} from '../components/illustrations/TocaStickers';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const HOME_POPULAR_CATEGORY_ORDER: string[] = [
  'ai-ml',
  'mcp',
  'apis-integrations',
  'design-creative',
  'cloud-hosting',
  'databases-backend',
  'developer-tools',
  'security-networking',
  'productivity-collaboration',
  'learning',
  'student-benefits',
];

export function HomePage({ onNavigate }: HomePageProps) {
  const counts = getCategoryCounts();
  const popularCategories = useMemo(() => {
    const base = CATEGORIES.filter((c) => c.popular);
    return [...base].sort((a, b) => {
      const ia = HOME_POPULAR_CATEGORY_ORDER.indexOf(a.slug);
      const ib = HOME_POPULAR_CATEGORY_ORDER.indexOf(b.slug);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, []);
  const learningHighlights = getLearningOffers().slice(0, 4);
  const recentlyVerified = getRecentlyVerifiedOffers(4);

  const learningRailRef = useRef<HTMLDivElement | null>(null);
  const [activeLearningSlide, setActiveLearningSlide] = useState(0);

  const recentRailRef = useRef<HTMLDivElement | null>(null);
  const [activeRecentSlide, setActiveRecentSlide] = useState(0);

  const handleLearningScroll = useCallback(() => {
    const rail = learningRailRef.current;
    if (!rail) return;
    const nextIndex = computeActiveSlideIndex({
      scrollLeft: rail.scrollLeft,
      scrollWidth: rail.scrollWidth,
      clientWidth: rail.clientWidth,
      slideCount: learningHighlights.length,
    });
    setActiveLearningSlide((prev) => (prev === nextIndex ? prev : nextIndex));
  }, [learningHighlights.length]);

  const scrollToLearningSlide = useCallback(
    (index: number) => {
      const rail = learningRailRef.current;
      if (!rail) return;
      const targetLeft = computeSlideScrollLeft({
        targetIndex: index,
        scrollWidth: rail.scrollWidth,
        clientWidth: rail.clientWidth,
        slideCount: learningHighlights.length,
      });
      rail.scrollTo({ left: targetLeft, behavior: 'smooth' });
      setActiveLearningSlide(index);
    },
    [learningHighlights.length]
  );

  const handleRecentScroll = useCallback(() => {
    const rail = recentRailRef.current;
    if (!rail) return;
    const nextIndex = computeActiveSlideIndex({
      scrollLeft: rail.scrollLeft,
      scrollWidth: rail.scrollWidth,
      clientWidth: rail.clientWidth,
      slideCount: recentlyVerified.length,
    });
    setActiveRecentSlide((prev) => (prev === nextIndex ? prev : nextIndex));
  }, [recentlyVerified.length]);

  const scrollToRecentSlide = useCallback(
    (index: number) => {
      const rail = recentRailRef.current;
      if (!rail) return;
      const targetLeft = computeSlideScrollLeft({
        targetIndex: index,
        scrollWidth: rail.scrollWidth,
        clientWidth: rail.clientWidth,
        slideCount: recentlyVerified.length,
      });
      rail.scrollTo({ left: targetLeft, behavior: 'smooth' });
      setActiveRecentSlide(index);
    },
    [recentlyVerified.length]
  );

  const handleSearch = (query: string) => {
    if (!query) {
      onNavigate('/explore');
      return;
    }
    onNavigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const go = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="w-full bg-paper flex flex-col gap-4 sm:gap-10 lg:gap-12 pb-6 sm:pb-8">
      {/* 1 & 2. Spacious, Expressive Hero Section & Search Bar */}
      <section className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-8 md:pt-10 pb-0 text-center flex flex-col items-center">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[42px] md:text-[48px] lg:text-[60px] xl:text-[68px] leading-[1.1] sm:leading-[1.08] tracking-[-0.032em] text-midnight-mouth max-w-[1040px] flex flex-col items-center text-center">
          {/* Mobile: stack Find more. <heart> and Spend less. <cloud> centered as balanced text+sticker lockups */}
          <span className="sm:hidden flex flex-col items-center">
            <span className="inline-flex items-center justify-center whitespace-nowrap">
              <span>Find more.</span>
              <HeroHeartSticker className="ml-1.5 w-8 h-6.5 -mt-0.5 shrink-0 pointer-events-none" />
            </span>
            <span className="inline-flex items-center justify-center whitespace-nowrap mt-0.5">
              <span>Spend less.</span>
              <HeroBoltSticker className="ml-1.5 w-8 h-6.5 -mt-0.5 shrink-0 pointer-events-none" />
            </span>
          </span>

          {/* Tablet & Desktop: Find more. <heart> Spend less. <cloud> centered as one lockup */}
          <span className="hidden sm:inline-flex items-center justify-center whitespace-nowrap">
            <span>Find more.</span>
            <HeroHeartSticker className="w-14 h-11 md:w-16 md:h-13 lg:w-22 lg:h-18 xl:w-[94px] xl:h-[74px] mx-2 md:mx-2.5 align-middle -mt-1 shrink-0 pointer-events-none" />
            <span>Spend less.</span>
            <HeroBoltSticker className="ml-2 md:ml-2.5 lg:ml-3 w-12 h-10 md:w-16 md:h-13 lg:w-21 lg:h-17 xl:w-[92px] xl:h-[74px] align-middle -mt-1 shrink-0 pointer-events-none" />
          </span>

          <span className="relative inline-block mt-0.5 sm:mt-2">
            <span>Build anything.</span>
            <SparkBurstDoodle className="absolute left-full top-0.5 sm:top-1.5 lg:top-2 ml-0.5 sm:ml-1 w-5 h-5 sm:w-9 sm:h-9 lg:w-11 lg:h-11 pointer-events-none" />
          </span>
        </h1>

        <p className="font-[var(--font-inter)] text-[13px] sm:text-[16.5px] leading-[1.42] sm:leading-[1.5] text-ink/85 max-w-xl mt-2 sm:mt-4 mb-3.5 sm:mb-6">
          Discover verified free AI models, MCP servers, APIs, frontend &amp; design tools, cloud credits, courses, and student packs with cited limits.
        </p>

        {/* Search Bar directly above Popular Categories */}
        <SearchBar onSubmitQuery={handleSearch} showSuggestions={false} />
      </section>

      {/* 3. Popular Categories directly under Search Bar */}
      <section className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-1 sm:pt-2 lg:pt-1">
        <div className="text-center max-w-2xl mx-auto mb-3.5 sm:mb-8 lg:mb-9">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[19px] sm:text-[32px] lg:text-[38px] leading-[1.15] tracking-[-0.015em] text-midnight-mouth">
            Popular categories
          </h2>
          <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[15.5px] leading-[1.4] sm:leading-[1.45] text-ink/80 mt-1 sm:mt-2.5">
            Browse verified free tools and limits by stack.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {popularCategories.map((cat, idx) => (
            <CategoryTile
              key={cat.slug}
              category={cat}
              count={counts[cat.slug] ?? 0}
              onNavigate={onNavigate}
              showWave={idx % 2 === 0}
              detailed
              className={
                popularCategories.length % 2 === 1 && idx === popularCategories.length - 1
                  ? 'col-span-2 sm:col-span-1'
                  : undefined
              }
            />
          ))}
        </div>

        <div className="mt-3.5 sm:mt-7 flex justify-center">
          <a
            href="/categories"
            onClick={(e) => go(e, '/categories')}
            onMouseEnter={() => prefetchRouteWithData('/categories')}
            onFocus={() => prefetchRouteWithData('/categories')}
            onPointerDown={() => prefetchRouteWithData('/categories')}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[15px] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] inline-flex items-center gap-1.5 sm:gap-2 spring-pill"
          >
            <span>View all {CATEGORIES.length} categories</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* 4. Learning Highlights (Mobile-Only Horizontal Touch Swipe Carousel; Desktop Grid Unchanged) */}
      <section className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 lg:px-8 content-visibility-auto">
        <div className="bg-sunshine-yellow rounded-[16px] sm:rounded-[26px] p-3 sm:p-8 md:p-10 overflow-hidden sm:overflow-visible">
          <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-8">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[19px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
              Learning highlights
            </h2>
            <p className="font-[var(--font-inter)] text-[12px] sm:text-[15.5px] leading-[1.38] sm:leading-[1.45] text-ink/90 mt-1 sm:mt-2">
              Full university lectures, open-source web curriculums, technical e-books, roadmaps, and interview practice without paywalls.
            </p>
          </div>

          <div
            ref={learningRailRef}
            data-testid="learning-highlights-carousel"
            onScroll={handleLearningScroll}
            aria-label="Learning highlights"
            className="flex sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-[11%] sm:scroll-px-0 -mx-3 px-[11%] sm:mx-0 sm:px-0 pb-1 sm:pb-0 no-scrollbar touch-pan-x overscroll-x-contain mb-1 sm:mb-7"
          >
            {learningHighlights.map((item, idx) => (
              <div
                key={item.identity.slug}
                data-testid={`learning-highlight-slide-${idx}`}
                className="w-full shrink-0 snap-center sm:w-auto sm:shrink"
              >
                <LearningCard
                  offer={item}
                  onNavigate={onNavigate}
                  surface="paper"
                  wiggleIcon={idx % 2 === 0}
                />
              </div>
            ))}
          </div>

          {/* Mobile-only compact dot & active pill indicator inside single >=28px touch target */}
          <div className="flex sm:hidden items-center justify-center mb-1.5">
            <button
              type="button"
              data-testid="learning-carousel-dots"
              aria-label={`Learning highlight ${activeLearningSlide + 1} of ${learningHighlights.length}. Tap to switch slide.`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX > 0 && rect.width > 0) {
                  const idx = Math.min(
                    learningHighlights.length - 1,
                    Math.max(
                      0,
                      Math.floor(((e.clientX - rect.left) / rect.width) * learningHighlights.length)
                    )
                  );
                  scrollToLearningSlide(idx);
                } else {
                  scrollToLearningSlide((activeLearningSlide + 1) % learningHighlights.length);
                }
              }}
              className="min-h-[28px] px-2.5 inline-flex items-center justify-center gap-1.5 rounded-full cursor-pointer"
            >
              {learningHighlights.map((item, idx) => {
                const active = idx === activeLearningSlide;
                return (
                  <span
                    key={item.identity.slug}
                    data-slide-index={idx}
                    data-active={active ? 'true' : 'false'}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      active ? 'w-5 bg-midnight-mouth' : 'w-1.5 bg-midnight-mouth/25'
                    }`}
                  />
                );
              })}
            </button>
          </div>

          <div className="flex justify-center">
            <a
              href="/learning"
              onClick={(e) => go(e, '/learning')}
              onMouseEnter={() => prefetchRouteWithData('/learning')}
              onFocus={() => prefetchRouteWithData('/learning')}
              onPointerDown={() => prefetchRouteWithData('/learning')}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[15px] rounded-full px-4 sm:px-5 py-1.5 sm:py-2.5 min-h-[34px] sm:min-h-[40px] inline-flex items-center gap-1.5 sm:gap-2 spring-pill"
            >
              <span>Browse Learning Hub</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* 5. Recently Verified Resources (Grey Daylight Frame Box matching Learning Highlights & About Unverified) */}
      <section className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 lg:px-8 content-visibility-auto">
        <div className="bg-daylight rounded-[16px] sm:rounded-[26px] p-3 sm:p-8 md:p-10 overflow-hidden sm:overflow-visible">
          <div className="text-center max-w-2xl mx-auto mb-3 sm:mb-8">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[19px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
              Recently verified
            </h2>
            <p className="font-[var(--font-inter)] text-[12px] sm:text-[15.5px] leading-[1.38] sm:leading-[1.45] text-ink/80 mt-1 sm:mt-2">
              Checked directly against provider pricing and official documentation.
            </p>
          </div>

          <div
            ref={recentRailRef}
            data-testid="recently-verified-carousel"
            onScroll={handleRecentScroll}
            aria-label="Recently verified resources"
            className="flex sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-[11%] sm:scroll-px-0 -mx-3 px-[11%] sm:mx-0 sm:px-0 pb-1 sm:pb-0 no-scrollbar touch-pan-x overscroll-x-contain mb-1 sm:mb-0"
          >
            {recentlyVerified.map((offer, idx) => (
              <div
                key={offer.identity.slug}
                data-testid={`recently-verified-slide-${idx}`}
                className="w-full shrink-0 snap-center sm:w-auto sm:shrink"
              >
                <ResourceCard offer={offer} onNavigate={onNavigate} surface="paper" />
              </div>
            ))}
          </div>

          {/* Mobile-only compact dot & active pill indicator inside single >=28px touch target */}
          <div className="flex sm:hidden items-center justify-center mt-1">
            <button
              type="button"
              data-testid="recent-carousel-dots"
              aria-label={`Recently verified item ${activeRecentSlide + 1} of ${recentlyVerified.length}. Tap to switch slide.`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX > 0 && rect.width > 0) {
                  const idx = Math.min(
                    recentlyVerified.length - 1,
                    Math.max(
                      0,
                      Math.floor(((e.clientX - rect.left) / rect.width) * recentlyVerified.length)
                    )
                  );
                  scrollToRecentSlide(idx);
                } else {
                  scrollToRecentSlide((activeRecentSlide + 1) % recentlyVerified.length);
                }
              }}
              className="min-h-[28px] px-2.5 inline-flex items-center justify-center gap-1.5 rounded-full cursor-pointer"
            >
              {recentlyVerified.map((offer, idx) => {
                const active = idx === activeRecentSlide;
                return (
                  <span
                    key={offer.identity.slug}
                    data-slide-index={idx}
                    data-active={active ? 'true' : 'false'}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      active ? 'w-5 bg-midnight-mouth' : 'w-1.5 bg-midnight-mouth/25'
                    }`}
                  />
                );
              })}
            </button>
          </div>
        </div>
      </section>

      {/* 10. Closing Call to Action */}
      <section className="max-w-[1360px] w-full mx-auto px-3 sm:px-6 lg:px-8 content-visibility-auto">
        <div className="bg-sky-blue rounded-[16px] sm:rounded-[26px] p-3.5 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-8 items-center">
          <div className="hidden lg:block lg:col-span-5">
            <SlabIllustration variant="verify" />
          </div>
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-2 sm:gap-4">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[18.5px] sm:text-[34px] lg:text-[42px] leading-[1.08] sm:leading-[1.06] tracking-[-0.03em] text-midnight-mouth">
              Ready to build your stack for $0?
            </h2>
            <p className="font-[var(--font-inter)] text-[12.5px] sm:text-[15.5px] leading-[1.4] sm:leading-[1.5] text-ink max-w-xl">
              Every listing explains real quotas, payment card rules, and eligibility without hidden trials or login walls.
            </p>
            <div className="w-full sm:w-auto flex flex-row flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-0.5 sm:pt-1">
              <a
                href="/explore"
                onClick={(e) => go(e, '/explore')}
                onMouseEnter={() => prefetchRouteWithData('/explore')}
                onFocus={() => prefetchRouteWithData('/explore')}
                onPointerDown={() => prefetchRouteWithData('/explore')}
                className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[12.5px] sm:text-[15px] rounded-full px-4 sm:px-5 py-1.5 sm:py-2.5 min-h-[34px] sm:min-h-[40px] inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap spring-pill"
              >
                <span>Start exploring</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
