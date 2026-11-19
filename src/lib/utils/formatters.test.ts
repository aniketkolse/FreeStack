import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOffersFromDisk } from '../data/nodeLoader';
import { getCompactLimitPair } from './formatters';

test('getCompactLimitPair produces crisp short left/right pairs across flagship tools', () => {
  const offers = loadOffersFromDisk();
  const bySlug = new Map(offers.map((o) => [o.identity.slug, o]));

  assert.deepEqual(getCompactLimitPair(bySlug.get('nvidia-nim-free-api-catalog')!), {
    label: 'Rate limit',
    value: '40 RPM',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('gemini-2-5-flash-multimodal')!), {
    label: 'Rate limit',
    value: '15 RPM / 1,500 RPD',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('visual-studio-code')!), {
    label: 'Usage',
    value: 'Unlimited',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('aws-free-tier-cloud-credits')!), {
    label: 'Free credits',
    value: 'Up to $200',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('supabase-free-plan')!), {
    label: 'Database',
    value: '500 MB',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('github-rest-graphql-api')!), {
    label: 'Rate limit',
    value: '5,000 req/hr',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('google-maps-geocoding-api')!), {
    label: 'Auth',
    value: 'API key',
  });
  assert.deepEqual(getCompactLimitPair(bySlug.get('mcp-microsoft-playwright-mcp')!), {
    label: 'Stack',
    value: 'Multi-language',
  });
});

test('getCompactLimitPair bounds length and strips trailing connectors across all catalog offers', () => {
  const offers = loadOffersFromDisk();
  assert.ok(offers.length > 7000);

  for (const offer of offers) {
    const pair = getCompactLimitPair(offer);
    assert.ok(pair.label.length >= 2 && pair.label.length <= 16, `bad label "${pair.label}" on ${offer.identity.slug}`);
    assert.ok(pair.value.length >= 2 && pair.value.length <= 24, `bad value "${pair.value}" on ${offer.identity.slug}`);
    assert.ok(!/[&/-]$/.test(pair.label), `trailing connector in label "${pair.label}" on ${offer.identity.slug}`);
    assert.ok(!/^context\s*window$/i.test(pair.label), `context window leaked on ${offer.identity.slug}`);
  }
});
