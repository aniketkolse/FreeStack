import test from 'node:test';
import assert from 'node:assert/strict';
import { computeActiveSlideIndex, computeSlideScrollLeft } from './carousel';

test('computeActiveSlideIndex maps scroll positions across 4 slides cleanly', () => {
  const base = { scrollWidth: 1200, clientWidth: 360, slideCount: 4 }; // maxScroll = 840
  assert.equal(computeActiveSlideIndex({ ...base, scrollLeft: 0 }), 0);
  assert.equal(computeActiveSlideIndex({ ...base, scrollLeft: 280 }), 1);
  assert.equal(computeActiveSlideIndex({ ...base, scrollLeft: 560 }), 2);
  assert.equal(computeActiveSlideIndex({ ...base, scrollLeft: 840 }), 3);
  // Clamps out-of-range overscroll cleanly
  assert.equal(computeActiveSlideIndex({ ...base, scrollLeft: -25 }), 0);
  assert.equal(computeActiveSlideIndex({ ...base, scrollLeft: 9999 }), 3);
});

test('computeActiveSlideIndex handles single slide or non-scrollable container', () => {
  assert.equal(
    computeActiveSlideIndex({ scrollLeft: 100, scrollWidth: 300, clientWidth: 300, slideCount: 4 }),
    0
  );
  assert.equal(
    computeActiveSlideIndex({ scrollLeft: 0, scrollWidth: 1000, clientWidth: 300, slideCount: 1 }),
    0
  );
});

test('computeSlideScrollLeft returns exact scroll target for dot navigation', () => {
  const base = { scrollWidth: 1200, clientWidth: 360, slideCount: 4 }; // maxScroll = 840
  assert.equal(computeSlideScrollLeft({ ...base, targetIndex: 0 }), 0);
  assert.equal(computeSlideScrollLeft({ ...base, targetIndex: 1 }), 280);
  assert.equal(computeSlideScrollLeft({ ...base, targetIndex: 2 }), 560);
  assert.equal(computeSlideScrollLeft({ ...base, targetIndex: 3 }), 840);
  assert.equal(computeSlideScrollLeft({ ...base, targetIndex: 10 }), 840);
  assert.equal(computeSlideScrollLeft({ ...base, targetIndex: -2 }), 0);
});
