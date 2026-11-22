import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '../../types/resource';
import {
  CategoryStickerIcon,
  getCategoryBgClass,
  HandDrawnWaveDoodle,
} from '../illustrations/TocaStickers';
import { prefetchRouteWithData } from '../../lib/router/routePrefetch';

interface CategoryTileProps {
  category: Category;
  count: number;
  onNavigate: (path: string) => void;
  showWave?: boolean;
  detailed?: boolean;
  className?: string;
}

export function CategoryTile({
  category,
  count,
  onNavigate,
  showWave = false,
  detailed = false,
  className = '',
}: CategoryTileProps) {
  const bgClass = getCategoryBgClass(category.color);
  const targetPath = `/category/${category.slug}`;

  const handlePrefetch = () => {
    prefetchRouteWithData(targetPath);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(targetPath);
  };

  return (
    <a
      href={targetPath}
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onPointerDown={handlePrefetch}
      onTouchStart={handlePrefetch}
      className={`${bgClass} rounded-[14px] sm:rounded-[24px] p-2.5 sm:p-5 flex flex-col justify-between gap-2 sm:gap-4 spring-card relative overflow-hidden group focus-visible:outline-2 focus-visible:outline-offset-4 min-w-0 ${className}`}
    >
      {/* Rounded inner image frame */}
      <div className="bg-paper rounded-[10px] sm:rounded-[16px] px-2 py-1.5 sm:px-4 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-3 relative min-w-0">
        <CategoryStickerIcon slug={category.slug} className="w-6 h-6 sm:w-10 sm:h-10 shrink-0" />
        <span className="font-[var(--font-wallop)] font-bold text-[11px] sm:text-[14px] text-midnight-mouth tabular-nums whitespace-nowrap truncate">
          {count} {count === 1 ? 'offer' : 'offers'}
        </span>
      </div>

      {showWave && (
        <HandDrawnWaveDoodle className="hidden sm:block w-16 sm:w-20 -mt-2 mb-0.5 pointer-events-none" />
      )}

      <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
        <div className="flex items-center sm:items-start justify-between gap-1.5 sm:gap-2.5 min-w-0">
          <h3 className="font-[var(--font-wallop)] font-bold text-[13.5px] sm:text-[20px] leading-[1.2] sm:leading-[1.28] tracking-[-0.02em] text-midnight-mouth truncate sm:whitespace-normal">
            {detailed ? category.name : category.shortName}
          </h3>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-midnight-mouth text-daylight inline-flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
          </span>
        </div>

        {detailed && (
          <p className="font-[var(--font-inter)] text-[11px] sm:text-[14px] leading-[1.35] sm:leading-[1.55] text-ink/85 line-clamp-1 sm:line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
    </a>
  );
}
