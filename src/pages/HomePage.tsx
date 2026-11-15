import React from 'react';
import {
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Code2,
  Cpu,
  Palette,
  Rocket,
  Compass,
  Blocks,
  Webhook,
} from 'lucide-react';
import {
  CATEGORIES,
  OFFERS,
  getCategoryCounts,
  getFeaturedOffers,
  getLearningOffers,
  getRecentlyAddedOffers,
  getRecentlyVerifiedOffers,
} from '../lib/data/resources';
import { SearchBar } from '../components/search/SearchBar';
import { ResourceCard } from '../components/offers/ResourceCard';
import { LearningCard } from '../components/offers/LearningCard';
import { CategoryTile } from '../components/categories/CategoryTile';
import {
  CategoryStickerIcon,
  HeroBoltSticker,
  HeroHeartSticker,
  SlabIllustration,
  SparkBurstDoodle,
} from '../components/illustrations/TocaStickers';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const PURPOSE_PATHWAYS = [
  {
    title: 'AI Models & LLMs',
    description: 'Free LLM inference endpoints, local model runners, open weights, and ML notebooks.',
    href: '/category/ai-ml',
    bgClass: 'bg-sky-blue',
    icon: Cpu,
  },
  {
    title: 'MCP Servers & Agents',
    description: 'Official Model Context Protocol servers, SDKs, remote Workers MCP, and inspectors.',
    href: '/category/mcp',
    bgClass: 'bg-sunshine-yellow',
    icon: Blocks,
  },
  {
    title: 'APIs & Integrations',
    description: 'Public REST & GraphQL APIs, weather/location endpoints, webhooks, and email APIs.',
    href: '/category/apis-integrations',
    bgClass: 'bg-daylight',
    icon: Webhook,
  },
  {
    title: 'Frontend & Design Tools',
    description: 'Tailwind CSS, UI component systems, Figma & Penpot workspaces, and SVG icon sets.',
    href: '/category/design-creative',
    bgClass: 'bg-bubblegum-pink',
    icon: Palette,
  },
  {
    title: 'Students & .EDU Packs',
    description: 'Academic developer packs, no-card cloud credits, certifications, and free IDEs.',
    href: '/students',
    bgClass: 'bg-grass-green',
    icon: GraduationCap,
  },
  {
    title: 'Founders & Engineers',
    description: 'Zero-card serverless hosting, managed SQL databases, CI/CD, and TLS security.',
    href: '/category/cloud-hosting',
    bgClass: 'bg-tangerine',
    icon: Rocket,
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const counts = getCategoryCounts();
  const popularCategories = CATEGORIES.filter((c) => c.popular);
  const featuredOffers = getFeaturedOffers().slice(0, 4);
  const learningHighlights = getLearningOffers().slice(0, 4);
  const recentlyAdded = getRecentlyAddedOffers(4);
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
    <div className="w-full bg-paper flex flex-col gap-7 sm:gap-10 lg:gap-12 pb-8">
      {/* 1 & 2. Compact Hero Section & Search Bar */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 text-center flex flex-col items-center">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[28px] sm:text-[42px] lg:text-[54px] xl:text-[62px] leading-[1.06] tracking-[-0.032em] text-midnight-mouth max-w-[980px]">
          <span className="block">
            Find more.{' '}
            <HeroHeartSticker className="w-11 h-9 sm:w-16 sm:h-13 lg:w-20 lg:h-16 xl:w-[88px] xl:h-[70px] mx-1 align-middle -mt-1.5 sm:-mt-2.5" />
            {' '}Spend less.{' '}
            <HeroBoltSticker className="w-11 h-9 sm:w-16 sm:h-13 lg:w-20 lg:h-16 xl:w-[86px] xl:h-[70px] mx-1 align-middle -mt-1.5 sm:-mt-2.5" />
          </span>
          <span className="inline-flex items-center justify-center relative max-w-full mt-1">
            <span>Build anything.</span>
            <SparkBurstDoodle className="w-6 h-6 sm:w-9 sm:h-9 lg:w-11 lg:h-11 ml-1 -mt-3 sm:-mt-5 shrink-0" />
          </span>
        </h1>

        <p className="font-[var(--font-inter)] text-[14.5px] sm:text-[16px] leading-[1.5] text-ink/85 max-w-xl mt-3 sm:mt-3.5 mb-4 sm:mb-5">
          Discover verified free AI models, MCP servers, APIs, frontend &amp; design tools, cloud credits, courses, and student packs with cited limits.
        </p>

        {/* Search Bar directly above Popular Categories */}
        <SearchBar onSubmitQuery={handleSearch} showSuggestions={false} />
      </section>

      {/* 3. Popular Categories directly under Search Bar */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
            Popular categories
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink/80 mt-1 sm:mt-1.5">
            Dedicated stacks for AI Models, MCP servers, APIs, Frontend &amp; Design, Cloud, Databases, Dev Tools, Security &amp; Networking, and Productivity.
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

        <div className="mt-6 sm:mt-7 flex justify-center">
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

      {/* 5. Featured Resources */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
            Featured resources
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink/80 mt-1.5 sm:mt-2">
            High-impact tools builders use every day — with honest quotas and official evidence.
          </p>
        </div>

        {featuredOffers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {featuredOffers.map((offer) => (
              <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="bg-daylight rounded-[20px] p-6 text-center font-[var(--font-inter)] text-ink/80">
            No featured resources selected yet.
          </div>
        )}
      </section>

      {/* 6. Discover by Purpose */}
      <section
        data-testid="discover-by-purpose"
        className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
            Discover by purpose
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink/80 mt-1.5 sm:mt-2">
            Jump straight into curated pathways tailored to what you are building or studying.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {PURPOSE_PATHWAYS.map((pathway) => {
            const Icon = pathway.icon;
            return (
              <a
                key={pathway.title}
                href={pathway.href}
                onClick={(e) => go(e, pathway.href)}
                className={`${pathway.bgClass} rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 flex flex-col justify-between gap-3.5 sm:gap-4 spring-card group`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-paper flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-midnight-mouth" aria-hidden="true" />
                  </div>
                  <span className="w-8 h-8 rounded-full bg-midnight-mouth text-daylight inline-flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
                <div>
                  <h3 className="font-[var(--font-wallop)] font-bold text-[18px] sm:text-[20px] leading-[1.15] tracking-[-0.02em] text-midnight-mouth mb-1">
                    {pathway.title}
                  </h3>
                  <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14px] leading-[1.45] text-ink/85">
                    {pathway.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* 7. Learning Highlights */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sunshine-yellow rounded-[22px] sm:rounded-[26px] p-5 sm:p-8 md:p-10">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
              Learning highlights
            </h2>
            <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink/90 mt-1.5 sm:mt-2">
              Full university lectures, open-source web curriculums, technical e-books, roadmaps, and interview practice without paywalls.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6 sm:mb-7">
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
              className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] sm:text-[15px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center gap-2 spring-pill"
            >
              <span>Browse Learning Hub</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* 8. Recently Added Resources */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
            Recently added
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink/80 mt-1.5 sm:mt-2">
            Newest additions cataloged into the FreeStack Git repository.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {recentlyAdded.map((offer) => (
            <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 9. Recently Verified Resources */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[32px] lg:text-[38px] leading-[1.08] tracking-[-0.03em] text-midnight-mouth">
            Recently verified
          </h2>
          <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink/80 mt-1.5 sm:mt-2">
            Checked directly against provider pricing and official documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {recentlyVerified.map((offer) => (
            <ResourceCard key={offer.identity.id} offer={offer} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 10. Closing Call to Action */}
      <section className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sky-blue rounded-[22px] sm:rounded-[26px] p-5 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-5">
            <SlabIllustration variant="verify" />
          </div>
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-3.5 sm:gap-4">
            <h2 className="font-[var(--font-wallop)] font-extrabold text-[24px] sm:text-[34px] lg:text-[42px] leading-[1.06] tracking-[-0.03em] text-midnight-mouth">
              Know a limit that changed — or a gem we missed?
            </h2>
            <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.5] text-ink max-w-xl">
              Every listing explains real quotas, payment card rules, and eligibility without hidden trials or login walls. Spot an update or suggest a resource anytime.
            </p>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
              <a
                href="/explore"
                onClick={(e) => go(e, '/explore')}
                className="bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] sm:text-[15px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center justify-center gap-2 whitespace-nowrap spring-pill"
              >
                <span>Start exploring</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="/about"
                onClick={(e) => go(e, '/about')}
                className="bg-daylight text-ink font-[var(--font-wallop)] font-semibold text-[14px] sm:text-[15px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center justify-center gap-2 whitespace-nowrap spring-pill"
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
