import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLoadError, isLikelyNetworkOrLoadMessage } from './errorClassification';

test('classifyLoadError detects offline state with highest priority', () => {
  const meta = classifyLoadError({ isOnline: false, notFound: true });
  assert.equal(meta.variant, 'offline');
  assert.equal(meta.code, '404');
  assert.match(meta.kicker, /Offline/i);
  assert.match(meta.primaryActionLabel, /retry/i);
});

test('classifyLoadError classifies network, timeout, and chunk load errors as load_error', () => {
  assert.equal(isLikelyNetworkOrLoadMessage('TypeError: Failed to fetch'), true);
  assert.equal(
    isLikelyNetworkOrLoadMessage('Failed to fetch dynamically imported module'),
    true
  );
  assert.equal(isLikelyNetworkOrLoadMessage('Request timed out'), true);

  const meta = classifyLoadError({
    isOnline: true,
    errorMessage:
      'Failed to fetch dynamically imported module: https://example.com/src/pages/CategoryDetailPage.tsx',
  });
  assert.equal(meta.variant, 'load_error');
  assert.equal(meta.description.includes('We hit a bump'), false);
  assert.equal(meta.description.includes('Failed to fetch'), false);
  assert.equal(meta.description.includes('CategoryDetailPage.tsx'), false);
});

test('classifyLoadError returns not_found when online and no network/load error exists', () => {
  const meta = classifyLoadError({ isOnline: true, notFound: true });
  assert.equal(meta.variant, 'not_found');
  assert.equal(meta.code, '404');
  assert.match(meta.kicker, /Error 404/);
});
