import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '../../types/resource';
import {
  CategoryStickerIcon,
  getCategoryBgClass,
  HandDrawnWaveDoodle,
} from '../illustrations/TocaStickers';

interface CategoryTileProps {
  category: Category;
  count: number;
  onNavigate: (path: string) => void;
  showWave?: boolean;
  detailed?: boolean;
}

export function CategoryTile({
  category,
  count,
  onNavigate,
  showWave = false,
  detailed = false,
}: CategoryTileProps) {
  const bgClass = getCategoryBgClass(category.color);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate(`/category/${category.slug}`);
  };

  return (
    <a
      href={`/category/${category.slug}`}
      onClick={handleClick}
      className={`${bgClass} rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 spring-card card-enter relative overflow-hidden group focus-visible:outline-2 focus-visible:outline-offset-4`}
    >
      {/* Rounded inner image frame */}
      <div className="bg-paper rounded-[14px] sm:rounded-[16px] px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 relative">
        <CategoryStickerIcon slug={category.slug} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
        <span className="font-[var(--font-wallop)] font-bold text-[13px] sm:text-[14px] text-midnight-mouth tabular-nums whitespace-nowrap">
          {count} {count === 1 ? 'offer' : 'offers'}
        </span>
      </div>

      {showWave && (
        <HandDrawnWaveDoodle className="hidden sm:block w-16 sm:w-20 -mt-2 mb-0.5 pointer-events-none" />
      )}

      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2.5">
          <h3 className="font-[var(--font-wallop)] font-bold text-[17.5px] sm:text-[20px] leading-[1.18] tracking-[-0.025em] text-midnight-mouth">
            {detailed ? category.name : category.shortName}
          </h3>
          <span className="w-8 h-8 rounded-full bg-midnight-mouth text-daylight inline-flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </div>

        {detailed && (
          <p className="font-[var(--font-inter)] text-[13px] sm:text-[14px] leading-[1.45] text-ink/85 mt-0.5 line-clamp-1 sm:line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
    </a>
  );
}
