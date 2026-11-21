import React, { useEffect, useRef } from 'react';
import { ErrorFallbackPage } from '../layout/ErrorFallbackPage';

interface CardGridSkeletonProps {
  count?: number;
  columnsClassName?: string;
}

export function CardGridSkeleton({
  count = 6,
  columnsClassName = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4',
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
          className="bg-daylight rounded-[15px] sm:rounded-[24px] p-2.5 sm:p-4 h-[206px] sm:h-[304px] flex flex-col justify-between gap-2 sm:gap-2.5 animate-pulse"
        >
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 bg-paper/75 rounded-[11px] sm:rounded-[16px] px-2.5 py-2 sm:p-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[8px] sm:rounded-[12px] bg-midnight-mouth/10 shrink-0" />
              <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-1">
                <div className="h-3 sm:h-3.5 w-24 rounded-full bg-midnight-mouth/10" />
                <div className="h-2.5 sm:h-3 w-16 rounded-full bg-midnight-mouth/8" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="h-2.5 sm:h-3 w-28 rounded-full bg-midnight-mouth/8" />
              <div className="h-4 sm:h-4.5 w-3/4 rounded-full bg-midnight-mouth/12" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 sm:pt-2.5 border-t border-midnight-mouth/8 sm:mb-1">
            <div className="h-2.5 sm:h-3 w-full rounded-full bg-midnight-mouth/8" />
            <div className="h-2.5 sm:h-3 w-4/5 rounded-full bg-midnight-mouth/8" />
          </div>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="h-7.5 sm:h-8 flex-1 rounded-full bg-midnight-mouth/12" />
            <div className="h-7.5 sm:h-8 w-14 sm:w-16 rounded-full bg-midnight-mouth/8" />
            <div className="h-7.5 sm:h-8 w-14 sm:w-16 rounded-full bg-midnight-mouth/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface OffersErrorStateProps {
  message: string;
  onRetry: () => void;
  onNavigate?: (path: string) => void;
}

export function OffersErrorState({ message, onRetry, onNavigate }: OffersErrorStateProps) {
  return (
    <div data-testid="offers-error-state">
      <ErrorFallbackPage
        errorMessage={message}
        onRetry={onRetry}
        onNavigate={onNavigate}
        compact
      />
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
    <div ref={sentinelRef} className="flex justify-center pt-1.5 sm:pt-2">
      <button
        type="button"
        disabled={isFetchingMore}
        onClick={onLoadMore}
        className="w-full sm:w-auto bg-midnight-mouth text-daylight font-[var(--font-wallop)] font-semibold text-[13px] sm:text-[14px] rounded-full px-5 sm:px-6 py-2.5 sm:py-3 min-h-[38px] sm:min-h-[42px] spring-pill cursor-pointer disabled:opacity-65"
      >
        {isFetchingMore
          ? 'Loading more...'
          : `${label} (${remainingCount} remaining)`}
      </button>
    </div>
  );
}
