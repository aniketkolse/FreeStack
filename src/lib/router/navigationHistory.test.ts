import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canGoBackInStack,
  createInitialHistoryState,
  findPreviousDistinctIndex,
  getBackNavigationMeta,
  getCurrentHistoryEntry,
  getPreviousUrl,
  popHistoryEntry,
  pushHistoryEntry,
  replaceHistoryEntry,
  sanitizeInternalPath,
  syncPopStateEntry,
} from './navigationHistory.ts';

test('single-step back returns to searched category route with query intact', () => {
  let state = createInitialHistoryState('/category/databases-backend');
  assert.equal(canGoBackInStack(state), false);
  assert.equal(getPreviousUrl(state), null);

  // User types search query (syncUrl uses replace: true)
  state = replaceHistoryEntry(state, '/category/databases-backend?q=supabase');
  assert.equal(canGoBackInStack(state), false);
  assert.equal(getCurrentHistoryEntry(state).url, '/category/databases-backend?q=supabase');

  // User inspects an offer after scrolling down
  state = pushHistoryEntry(state, '/offer/supabase-free-plan', 420);
  assert.equal(canGoBackInStack(state), true);
  assert.equal(getPreviousUrl(state), '/category/databases-backend?q=supabase');

  // Clicking back fires popstate for entry id 0
  state = syncPopStateEntry(state, '/category/databases-backend?q=supabase', 0);
  assert.equal(canGoBackInStack(state), false);
  assert.equal(getCurrentHistoryEntry(state).url, '/category/databases-backend?q=supabase');
  assert.equal(getCurrentHistoryEntry(state).scrollY, 420);
});

test('multi-hop offer inspection steps back strictly one step at a time', () => {
  let state = createInitialHistoryState('/');
  state = pushHistoryEntry(state, '/category/security-networking', 120);
  state = replaceHistoryEntry(state, '/category/security-networking?q=cloudflare');
  state = pushHistoryEntry(state, '/offer/cloudflare-zero-trust', 310);
  state = pushHistoryEntry(state, '/offer/cloudflare-waf-free', 640);

  assert.equal(getPreviousUrl(state), '/offer/cloudflare-zero-trust');

  // First back step -> returns to first inspected offer
  const prevId1 = state.entries[state.cursor - 1].id;
  state = syncPopStateEntry(state, '/offer/cloudflare-zero-trust', prevId1);
  assert.equal(getCurrentHistoryEntry(state).url, '/offer/cloudflare-zero-trust');
  assert.equal(getCurrentHistoryEntry(state).scrollY, 640);
  assert.equal(getPreviousUrl(state), '/category/security-networking?q=cloudflare');

  // Second back step -> returns to searched category
  const prevId2 = state.entries[state.cursor - 1].id;
  state = syncPopStateEntry(state, '/category/security-networking?q=cloudflare', prevId2);
  assert.equal(getCurrentHistoryEntry(state).url, '/category/security-networking?q=cloudflare');
  assert.equal(getCurrentHistoryEntry(state).scrollY, 310);
  assert.equal(getPreviousUrl(state), '/');

  // Third back step -> returns to home
  const prevId3 = state.entries[state.cursor - 1].id;
  state = syncPopStateEntry(state, '/', prevId3);
  assert.equal(getCurrentHistoryEntry(state).url, '/');
  assert.equal(canGoBackInStack(state), false);
});

test('navigating after going back truncates forward history without loops', () => {
  let state = createInitialHistoryState('/explore?q=postgres');
  state = pushHistoryEntry(state, '/offer/neon-serverless-postgres', 150);
  state = syncPopStateEntry(state, '/explore?q=postgres', 0);

  state = replaceHistoryEntry(state, '/explore?q=redis');
  state = pushHistoryEntry(state, '/offer/redis-cloud-free-plan', 200);

  assert.equal(state.entries.length, 2);
  assert.equal(getPreviousUrl(state), '/explore?q=redis');
  assert.equal(getCurrentHistoryEntry(state).url, '/offer/redis-cloud-free-plan');
});

test('popHistoryEntry skips duplicate consecutive URLs so Back never freezes on same page', () => {
  let state = createInitialHistoryState('/');
  state = pushHistoryEntry(state, '/category/ai-ml', 180);
  state = pushHistoryEntry(state, '/category/ai-ml', 350);

  assert.equal(findPreviousDistinctIndex(state), 0);
  assert.equal(getPreviousUrl(state), '/');

  const popped = popHistoryEntry(state);
  assert.equal(popped.delta, -2);
  assert.equal(popped.targetEntry?.url, '/');
  assert.equal(popped.targetEntry?.scrollY, 180);
  assert.equal(canGoBackInStack(popped.nextState), false);

  const emptyPop = popHistoryEntry(popped.nextState);
  assert.equal(emptyPop.targetEntry, null);
  assert.equal(emptyPop.delta, 0);
});

test('getBackNavigationMeta resolves accurate contextual labels and preserves query strings', () => {
  const resolvers = {
    getCategoryName: (slug: string) =>
      slug === 'databases-backend' ? 'Databases & Backend' : undefined,
    getOfferName: (slug: string) =>
      slug === 'supabase-free-plan' ? 'Supabase Free Plan' : undefined,
  };

  assert.deepEqual(
    getBackNavigationMeta('/category/databases-backend?q=supabase', '/explore', resolvers),
    {
      targetHref: '/category/databases-backend?q=supabase',
      label: 'Back to Databases & Backend',
    }
  );

  assert.deepEqual(
    getBackNavigationMeta('/offer/supabase-free-plan', '/explore', resolvers),
    {
      targetHref: '/offer/supabase-free-plan',
      label: 'Back to Supabase Free Plan',
    }
  );

  assert.deepEqual(
    getBackNavigationMeta('/learning?q=cs50&format=course', '/explore', resolvers),
    {
      targetHref: '/learning?q=cs50&format=course',
      label: 'Back to Learning',
    }
  );

  assert.deepEqual(
    getBackNavigationMeta('/students?q=cursor&verify=required', '/explore', resolvers),
    {
      targetHref: '/students?q=cursor&verify=required',
      label: 'Back to Student Benefits',
    }
  );

  assert.deepEqual(
    getBackNavigationMeta(null, '/category/databases-backend', resolvers),
    {
      targetHref: '/category/databases-backend',
      label: 'Back to Databases & Backend',
    }
  );
});

test('sanitizeInternalPath blocks protocol-relative, external, and javascript URLs', () => {
  assert.equal(sanitizeInternalPath('/explore?q=ai'), '/explore?q=ai');
  assert.equal(sanitizeInternalPath('//evil.example.com/phish'), '/');
  assert.equal(sanitizeInternalPath('/\\evil.example.com'), '/');
  assert.equal(sanitizeInternalPath('https://evil.example.com'), '/');
  assert.equal(sanitizeInternalPath('javascript:alert(1)'), '/');
});

