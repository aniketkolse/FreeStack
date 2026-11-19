import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

interface FilterScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  viewportClassName?: string;
  viewportStyle?: React.CSSProperties;
  testId?: string;
  size?: 'default' | 'compact';
}

interface ScrollMetrics {
  canScroll: boolean;
  thumbHeight: number;
  thumbTop: number;
  progress: number;
}

const MIN_THUMB_HEIGHT = 38;

export function FilterScrollArea({
  children,
  className = '',
  viewportClassName = '',
  viewportStyle,
  testId,
  size = 'default',
}: FilterScrollAreaProps) {
  const viewportId = useId();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startScrollTop: number;
    maxScroll: number;
    maxThumbTop: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    canScroll: false,
    thumbHeight: MIN_THUMB_HEIGHT,
    thumbTop: 0,
    progress: 0,
  });

  const trackPad = size === 'compact' ? 2 : 2;

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const { scrollHeight, clientHeight, scrollTop } = viewport;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 2 || clientHeight <= 0) {
      setMetrics((prev) =>
        prev.canScroll
          ? { canScroll: false, thumbHeight: MIN_THUMB_HEIGHT, thumbTop: 0, progress: 0 }
          : prev
      );
      return;
    }

    const trackHeight = trackRef.current
      ? Math.max(0, trackRef.current.clientHeight - trackPad * 2)
      : Math.max(0, clientHeight - trackPad * 2 - 4);

    if (trackHeight <= 0) return;

    const ratio = clientHeight / scrollHeight;
    const thumbHeight = Math.min(
      trackHeight,
      Math.max(size === 'compact' ? 28 : MIN_THUMB_HEIGHT, Math.round(ratio * trackHeight))
    );
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    const thumbTop = Math.round(progress * maxThumbTop);

    setMetrics((prev) => {
      if (
        prev.canScroll === true &&
        prev.thumbHeight === thumbHeight &&
        prev.thumbTop === thumbTop &&
        Math.abs(prev.progress - progress) < 0.005
      ) {
        return prev;
      }
      return { canScroll: true, thumbHeight, thumbTop, progress };
    });
  }, [size, trackPad]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport) return;

    let rafId = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateMetrics);
    };

    updateMetrics();

    viewport.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(viewport);
      if (content) resizeObserver.observe(content);
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && content) {
      mutationObserver = new MutationObserver(scheduleUpdate);
      mutationObserver.observe(content, { childList: true, subtree: true });
    }

    return () => {
      cancelAnimationFrame(rafId);
      viewport.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [updateMetrics]);

  // Re-measure once track mounts after canScroll flips to true
  useEffect(() => {
    if (metrics.canScroll) {
      const id = requestAnimationFrame(updateMetrics);
      return () => cancelAnimationFrame(id);
    }
  }, [metrics.canScroll, updateMetrics]);

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks originating directly on the thumb
    if (e.target !== e.currentTarget) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top - trackPad;
    const trackHeight = Math.max(1, rect.height - trackPad * 2);
    const maxThumbTop = Math.max(1, trackHeight - metrics.thumbHeight);
    const targetThumbTop = Math.min(
      maxThumbTop,
      Math.max(0, clickY - metrics.thumbHeight / 2)
    );
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    viewport.scrollTo({
      top: (targetThumbTop / maxThumbTop) * maxScroll,
      behavior: 'smooth',
    });
  };

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const trackHeight = Math.max(1, track.clientHeight - trackPad * 2);
    const maxThumbTop = Math.max(1, trackHeight - metrics.thumbHeight);
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);

    dragStateRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: viewport.scrollTop,
      maxScroll,
      maxThumbTop,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const viewport = viewportRef.current;
    if (!drag || !viewport || e.pointerId !== drag.pointerId) return;

    const deltaY = e.clientY - drag.startY;
    const nextScrollTop =
      drag.startScrollTop + (deltaY / drag.maxThumbTop) * drag.maxScroll;
    viewport.scrollTop = Math.min(drag.maxScroll, Math.max(0, nextScrollTop));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragStateRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className={`relative flex min-h-0 w-full ${className}`}>
      <div
        id={viewportId}
        ref={viewportRef}
        data-testid={testId}
        style={viewportStyle}
        className={`flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar overscroll-contain ${viewportClassName}`}
      >
        <div ref={contentRef} className="w-full">
          {children}
        </div>
      </div>

      {metrics.canScroll && (
        <div
          className={`shrink-0 flex items-stretch select-none ${
            size === 'compact' ? 'py-1.5 pl-1 pr-1' : 'py-0.5 pl-2.5 pr-0'
          }`}
        >
          <div
            ref={trackRef}
            role="scrollbar"
            aria-label="Filter list scrollbar"
            aria-controls={viewportId}
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(metrics.progress * 100)}
            data-testid={testId ? `${testId}-rail` : undefined}
            onPointerDown={handleTrackPointerDown}
            className={`relative rounded-full cursor-pointer transition-colors ${
              size === 'compact'
                ? 'w-[7px] bg-midnight-mouth/[0.08] p-[1.5px]'
                : 'w-[10px] bg-midnight-mouth/[0.08] border border-midnight-mouth/[0.07] p-[2px]'
            }`}
          >
            <div
              data-testid={testId ? `${testId}-thumb` : undefined}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{
                height: `${metrics.thumbHeight}px`,
                transform: `translateY(${metrics.thumbTop}px)`,
              }}
              className={`w-full rounded-full transition-colors duration-150 touch-none ${
                isDragging
                  ? 'bg-midnight-mouth cursor-grabbing'
                  : 'bg-midnight-mouth/40 hover:bg-sky-blue cursor-grab'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
