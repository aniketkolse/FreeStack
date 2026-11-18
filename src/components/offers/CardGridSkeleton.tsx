import React, { useEffect, useRef } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface CardGridSkeletonProps {
  count?: number;
  columnsClassName?: string;
}

export function CardGridSkeleton({
  count = 6,
  columnsClassName = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4',
}: CardGridSkeletonProps) {
  return (
    <div
      data-testid="offers-grid-skeleton"
      aria-busy="true"
      aria-label="Loading resources"
      className={columnsClassName}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-daylight rounded-[16px] sm:rounded-[24px] p-3 sm:p-5 flex flex-col justify-between gap-3 min-h-[112px] sm:min-h-[270px] animate-pulse"
        >
          <div className="flex items-center justify-between gap-3 bg-paper/75 rounded-[14px] p-3">
            <div className="w-10 h-10 rounded-[12px] bg-midnight-mouth/10 shrink-0" />
            <div className="flex flex-col items-end gap-1.5 flex-1">
              <div className="h-3.5 w-24 rounded-full bg-midnight-mouth/10" />
              <div className="h-3 w-16 rounded-full bg-midnight-mouth/8" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col gap-2">
            <div className="h-4 w-3/4 rounded-full bg-midnight-mouth/12" />
            <div className="h-3 w-full rounded-full bg-midnight-mouth/8" />
            <div className="h-3 w-5/6 rounded-full bg-midnight-mouth/8" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-midnight-mouth/8">
            <div className="h-8 flex-1 rounded-full bg-midnight-mouth/12" />
            <div className="h-8 w-16 rounded-full bg-midnight-mouth/8" />
            <div className="h-8 w-16 rounded-full bg-midnight-mouth/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface OffersErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function OffersErrorState({ message, onRetry }: OffersErrorStateProps) {
  return (
    <div
      role="alert"
      data-testid="offers-error-state"
      className="bg-daylight rounded-[22px] p-7 sm:p-9 text-center flex flex-col items-center gap-3"
    >
      <AlertCircle className="w-7 h-7 text-midnight-mouth" aria-hidden="true" />
      <h3 className="font-[var(--font-wallop)] font-bold text-[19px] sm:text-[22px] text-midnight-mouth">
        Could not load resources
      </h3>
      <p className="font-[var(--font-inter)] text-[13.5px] sm:text-[14.5px] text-ink/80 max-w-md">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13.5px] rounded-full px-5 py-2.5 min-h-[40px] inline-flex items-center gap-2 spring-pill cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Retry loading</span>
      </button>
    </div>
  );
}

interface InfiniteLoadMoreProps {
  hasMore: boolean;
  isFetchingMore: boolean;
  remainingCount: number;
  onLoadMore: () => void;
  label?: string;
}

export function InfiniteLoadMore({
  hasMore,
  isFetchingMore,
  remainingCount,
  onLoadMore,
  label = 'Load more resources',
}: InfiniteLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isFetchingMore) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '320px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center pt-2">
      <button
        type="button"
        disabled={isFetchingMore}
        onClick={onLoadMore}
        className="w-full sm:w-auto bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[14px] rounded-full px-6 py-3 min-h-[42px] spring-pill cursor-pointer disabled:opacity-65"
      >
        {isFetchingMore
          ? 'Loading more...'
          : `${label} (${remainingCount} remaining)`}
      </button>
    </div>
  );
}
