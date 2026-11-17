import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  CATEGORIES,
  getCategoryCounts,
  getLearningOffers,
  getRecentlyVerifiedOffers,
} from '../lib/data/resources';
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

export function HomePage({ onNavigate }: HomePageProps) {
  const counts = getCategoryCounts();
  const popularCategories = CATEGORIES.filter((c) => c.popular);
  const learningHighlights = getLearningOffers().slice(0, 4);
  const recentlyVerified = getRecentlyVerifiedOffers(4);

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
    <div className="w-full bg-paper flex flex-col gap-6 sm:gap-10 lg:gap-12 pb-8">
      {/* 1 & 2. Spacious, Expressive Hero Section & Search Bar */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 md:pt-10 pb-0 text-center flex flex-col items-center">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[32px] sm:text-[42px] md:text-[48px] lg:text-[60px] xl:text-[68px] leading-[1.12] sm:leading-[1.08] tracking-[-0.032em] text-midnight-mouth max-w-[1040px] flex flex-col items-center text-center">
          {/* Mobile: stack Find more. <heart> and Spend less. <cloud> centered as balanced text+sticker lockups */}
          <span className="sm:hidden flex flex-col items-center">
            <span className="inline-flex items-center justify-center whitespace-nowrap">
              <span>Find more.</span>
              <HeroHeartSticker className="ml-2 w-10 h-8 -mt-0.5 shrink-0 pointer-events-none" />
            </span>
            <span className="inline-flex items-center justify-center whitespace-nowrap mt-0.5">
              <span>Spend less.</span>
              <HeroBoltSticker className="ml-2 w-10 h-8 -mt-0.5 shrink-0 pointer-events-none" />
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
            <SparkBurstDoodle className="absolute left-full -top-2 sm:-top-3.5 ml-1 sm:ml-1.5 w-6 h-6 sm:w-9 sm:h-9 lg:w-11 lg:h-11 pointer-events-none" />
          </span>
        </h1>

        <p className="font-[var(--font-inter)] text-[14.5px] sm:text-[16.5px] leading-[1.5] text-ink/85 max-w-xl mt-3.5 sm:mt-4 mb-5 sm:mb-6">
          Discover verified free AI models, MCP servers, APIs, frontend &amp; design tools, cloud credits, courses, and student packs with cited limits.
        </p>

        {/* Search Bar directly above Popular Categories */}
        <SearchBar onSubmitQuery={handleSearch} showSuggestions={false} />
      </section>

      {/* 3. Popular Categories directly under Search Bar */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-2 lg:pt-1">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-9">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[23px] sm:text-[32px] lg:text-[38px] leading-[1.15] tracking-[-0.015em] text-midnight-mouth">
            Popular categories
          </h2>
          <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[15.5px] leading-[1.45] text-ink/80 mt-2 sm:mt-2.5">
            Browse verified free tools and limits by stack.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {popularCategories.map((cat, idx) => (
            <CategoryTile
              key={cat.slug}
              category={cat}
              count={counts[cat.slug] ?? 0}
              onNavigate={onNavigate}
              showWave={idx % 2 === 0}
              detailed
            />
          ))}
        </div>

        <div className="mt-5 sm:mt-7 flex justify-center">
          <a
            href="/categories"
            onClick={(e) => go(e, '/categories')}
            className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] sm:text-[15px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center gap-2 spring-pill"
          >
            <span>View all {CATEGORIES.length} categories</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* 4. Learning Highlights */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sunshine-yellow rounded-[18px] sm:rounded-[26px] p-4 sm:p-8 md:p-10">
          <div className="text-center max-w-2xl mx-auto mb-3.5 sm:mb-8">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[21px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
              Learning highlights
            </h2>
            <p className="font-[var(--font-inter)] text-[13px] sm:text-[15.5px] leading-[1.4] sm:leading-[1.45] text-ink/90 mt-1 sm:mt-2">
              Full university lectures, open-source web curriculums, technical e-books, roadmaps, and interview practice without paywalls.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-7">
            {learningHighlights.map((item, idx) => (
              <LearningCard
                key={item.identity.id}
                offer={item}
                onNavigate={onNavigate}
                surface="paper"
                wiggleIcon={idx % 2 === 0}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <a
              href="/learning"
              onClick={(e) => go(e, '/learning')}
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[15px] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[40px] inline-flex items-center gap-2 spring-pill"
            >
              <span>Browse Learning Hub</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* 5. Recently Verified Resources */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-3.5 sm:mb-8">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[21px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
            Recently verified
          </h2>
          <p className="font-[var(--font-inter)] text-[13px] sm:text-[15.5px] leading-[1.4] sm:leading-[1.45] text-ink/80 mt-1 sm:mt-2">
            Checked directly against provider pricing and official documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {recentlyVerified.map((offer) => (
            <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 10. Closing Call to Action */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sky-blue rounded-[18px] sm:rounded-[26px] p-4 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          <div className="hidden lg:block lg:col-span-5">
            <SlabIllustration variant="verify" />
          </div>
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-2.5 sm:gap-4">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[21px] sm:text-[34px] lg:text-[42px] leading-[1.06] tracking-[-0.03em] text-midnight-mouth">
              Know a limit that changed — or a gem we missed?
            </h2>
            <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[15.5px] leading-[1.45] sm:leading-[1.5] text-ink max-w-xl">
              Every listing explains real quotas, payment card rules, and eligibility without hidden trials or login walls. Spot an update or suggest a resource anytime.
            </p>
            <div className="w-full sm:w-auto flex flex-row flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-1">
              <a
                href="/explore"
                onClick={(e) => go(e, '/explore')}
                className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[15px] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[40px] inline-flex items-center justify-center gap-2 whitespace-nowrap spring-pill"
              >
                <span>Start exploring</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="/about"
                onClick={(e) => go(e, '/about')}
                className="bg-daylight text-ink font-[var(--font-wallop)] font-semibold text-[13.5px] sm:text-[15px] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[40px] inline-flex items-center justify-center gap-2 whitespace-nowrap spring-pill"
              >
                <span>Report info / Contribute</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
