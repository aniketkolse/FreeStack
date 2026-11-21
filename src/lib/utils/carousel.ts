/**
 * Pure helpers for mobile horizontal snap-scroll carousels.
 */

export function computeActiveSlideIndex(params: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  slideCount: number;
}): number {
  const { scrollLeft, scrollWidth, clientWidth, slideCount } = params;
  if (slideCount <= 1) return 0;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  if (maxScroll <= 1) return 0;
  const clamped = Math.min(Math.max(0, scrollLeft), maxScroll);
  const ratio = clamped / maxScroll;
  const index = Math.round(ratio * (slideCount - 1));
  return Math.min(slideCount - 1, Math.max(0, index));
}

export function computeSlideScrollLeft(params: {
  targetIndex: number;
  scrollWidth: number;
  clientWidth: number;
  slideCount: number;
}): number {
  const { targetIndex, scrollWidth, clientWidth, slideCount } = params;
  if (slideCount <= 1) return 0;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  if (maxScroll <= 0) return 0;
  const clampedIndex = Math.min(slideCount - 1, Math.max(0, targetIndex));
  return Math.round((clampedIndex / (slideCount - 1)) * maxScroll);
}
