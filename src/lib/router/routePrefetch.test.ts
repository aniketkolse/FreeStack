import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePrefetchPlan } from './routePrefetch';

test('resolvePrefetchPlan maps routes to exact chunk keys and API cache keys', () => {
  assert.deepEqual(resolvePrefetchPlan('/explore'), {
    routeKey: 'explore',
    offersQuery: 'limit=24&offset=0&facets=1',
  });

  assert.deepEqual(resolvePrefetchPlan('/category/ai-ml'), {
    routeKey: 'category',
    offersQuery: 'category=ai-ml&sort=relevance&limit=24&offset=0&facets=1',
  });

  assert.deepEqual(resolvePrefetchPlan('/learning'), {
    routeKey: 'learning',
    offersQuery: 'learningOnly=1&limit=24&offset=0&facets=1',
  });

  assert.deepEqual(resolvePrefetchPlan('/students'), {
    routeKey: 'students',
    offersQuery: 'category=student-benefits&limit=24&offset=0&facets=1',
  });

  assert.deepEqual(resolvePrefetchPlan('/offer/nvidia-nim-free-api-catalog'), {
    routeKey: 'offer',
    offerSlug: 'nvidia-nim-free-api-catalog',
  });

  assert.deepEqual(resolvePrefetchPlan('/categories'), {
    routeKey: 'categories',
  });

  assert.deepEqual(resolvePrefetchPlan('/'), {
    routeKey: null,
  });
});
