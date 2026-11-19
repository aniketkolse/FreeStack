import React from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  CATEGORIES,
  getCategoryBySlug,
  getLearningOffers,
  getOfferBySlug,
  getRecentlyVerifiedOffers,
} from '../lib/data/resources';
import { getBackNavigationMeta } from '../lib/router/navigationHistory';
import { FreeStackLogo, CategoryStickerIcon } from '../components/illustrations/TocaStickers';
import { ResourceCard } from '../components/offers/ResourceCard';
import { LearningCard } from '../components/offers/LearningCard';

interface DesignSystemPageProps {
  onNavigate: (path: string) => void;
  onBack?: (fallbackPath?: string) => void;
  previousPath?: string | null;
}

const COLOR_SWATCHES = [
  { name: 'Midnight Mouth', hex: '#101014', token: '--color-midnight-mouth', bg: 'bg-[#101014] text-white' },
  { name: 'Paper', hex: '#FFFFFF', token: '--color-paper', bg: 'bg-[#FFFFFF] text-[#101014] border border-[#101014]/15' },
  { name: 'Sky Blue', hex: '#59ACFF', token: '--color-sky-blue', bg: 'bg-sky-blue text-[#101014]' },
  { name: 'Grass Green', hex: '#62D962', token: '--color-grass-green', bg: 'bg-grass-green text-[#101014]' },
  { name: 'Daylight', hex: '#F2F2FF', token: '--color-daylight', bg: 'bg-[#F2F2FF] text-[#101014]' },
  { name: 'Bubblegum Pink', hex: '#FF8CBC', token: '--color-bubblegum-pink', bg: 'bg-bubblegum-pink text-[#101014]' },
  { name: 'Tangerine', hex: '#FFA94D', token: '--color-tangerine', bg: 'bg-tangerine text-[#101014]' },
  { name: 'Sunshine Yellow', hex: '#FFE359', token: '--color-sunshine-yellow', bg: 'bg-sunshine-yellow text-[#101014]' },
  { name: 'Ink', hex: '#0A0A0A', token: '--color-ink', bg: 'bg-[#0A0A0A] text-white' },
];

export function DesignSystemPage({
  onNavigate,
  onBack,
  previousPath = null,
}: DesignSystemPageProps) {
  const sampleOffer = getRecentlyVerifiedOffers(1)[0];
  const sampleLearning = getLearningOffers()[0];
  const backMeta = getBackNavigationMeta(previousPath, '/about', {
    getCategoryName: (slug) => getCategoryBySlug(slug)?.name,
    getOfferName: (slug) => getOfferBySlug(slug)?.identity.name,
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 flex flex-col gap-6 sm:gap-9">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <a
          href={backMeta.targetHref}
          data-testid="design-system-back-btn"
          onClick={(e) => {
            e.preventDefault();
            if (onBack) {
              onBack('/about');
            } else {
              onNavigate(backMeta.targetHref);
            }
          }}
          className="bg-daylight text-midnight-mouth font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[13.5px] rounded-full px-4 py-1.5 min-h-[34px] inline-flex items-center gap-1.5 spring-pill"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{backMeta.label}</span>
        </a>
      </div>

      {/* Hero Slab */}
      <section className="bg-bubblegum-pink rounded-[22px] sm:rounded-[26px] p-5 sm:p-7 md:p-9 flex flex-col gap-2.5">
        <h1 className="font-[var(--font-wallop)] font-extrabold text-[26px] sm:text-[38px] lg:text-[46px] leading-[1.04] tracking-[-0.03em] text-midnight-mouth">
          FreeStack Design System
        </h1>
        <p className="font-[var(--font-inter)] text-[14px] sm:text-[15.5px] leading-[1.45] text-ink max-w-2xl">
          Milestone 2 &amp; Section 6 visual foundation: Tailwind v4 <code className="bg-paper/80 px-1.5 py-0.5 rounded">@theme</code> tokens, Plus Jakarta Sans display paired with Inter body copy, stacked cylindrical Capital-F brand mark, and shared card primitives.
        </p>
      </section>

      {/* Brand Mark Variants */}
      <section className="bg-daylight rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 md:p-7 flex flex-col gap-4">
        <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] text-midnight-mouth">
          Brand mark &amp; category icons ({CATEGORIES.length} categories)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-paper rounded-[16px] p-4 flex flex-col gap-2">
            <span className="font-[var(--font-inter)] text-[12px] text-ink/70">Header Lockup (size=&quot;sm&quot;)</span>
            <FreeStackLogo size="sm" />
          </div>
          <div className="bg-paper rounded-[16px] p-4 flex flex-col gap-2">
            <span className="font-[var(--font-inter)] text-[12px] text-ink/70">Footer Display Lockup (size=&quot;lg&quot;)</span>
            <FreeStackLogo size="lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.slug}
              className="bg-paper rounded-[14px] p-3 flex flex-col items-center text-center gap-1.5"
            >
              <CategoryStickerIcon slug={cat.slug} className="w-8 h-8" />
              <span className="font-[var(--font-wallop)] font-semibold text-[12.5px] text-midnight-mouth">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Palette */}
      <section className="flex flex-col gap-3.5">
        <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] text-midnight-mouth">
          Section 6.2 Brand palette tokens
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COLOR_SWATCHES.map((swatch) => (
            <div
              key={swatch.name}
              className={`${swatch.bg} rounded-[18px] p-4 sm:p-5 flex flex-col justify-between min-h-[100px]`}
            >
              <span className="font-[var(--font-wallop)] font-bold text-[18px]">{swatch.name}</span>
              <div className="flex items-center justify-between font-mono text-[12px] opacity-90 pt-3">
                <span>{swatch.token}</span>
                <span>{swatch.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shared Card Primitives */}
      <section className="flex flex-col gap-3.5">
        <h2 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] text-midnight-mouth">
          ResourceCard &amp; LearningCard primitives
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleOffer && <ResourceCard offer={sampleOffer} onNavigate={onNavigate} />}
          {sampleLearning && <LearningCard offer={sampleLearning} onNavigate={onNavigate} />}
        </div>
      </section>
    </div>
  );
}
