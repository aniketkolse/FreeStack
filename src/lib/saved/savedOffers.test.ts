import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseSavedSlugs,
  toggleSavedSlug,
  buildSharePayload,
} from './savedOffers.ts';
import type { Offer } from '../../types/resource.ts';

describe('savedOffers pure helpers', () => {
  it('parses valid JSON arrays of slugs and deduplicates entries', () => {
    const raw = JSON.stringify(['groq-cloud-free-api', 'cloudflare-pages', 'groq-cloud-free-api', '', 42]);
    const parsed = parseSavedSlugs(raw);
    assert.deepEqual(parsed, ['groq-cloud-free-api', 'cloudflare-pages']);
  });

  it('returns empty array for malformed or null input', () => {
    assert.deepEqual(parseSavedSlugs(null), []);
    assert.deepEqual(parseSavedSlugs(undefined), []);
    assert.deepEqual(parseSavedSlugs('{invalid-json'), []);
    assert.deepEqual(parseSavedSlugs('{"not":"an-array"}'), []);
  });

  it('toggles a slug on and off cleanly', () => {
    const step1 = toggleSavedSlug([], 'github-student-developer-pack');
    assert.equal(step1.saved, true);
    assert.deepEqual(step1.next, ['github-student-developer-pack']);

    const step2 = toggleSavedSlug(step1.next, 'supabase-free-tier');
    assert.equal(step2.saved, true);
    assert.deepEqual(step2.next, ['supabase-free-tier', 'github-student-developer-pack']);

    const step3 = toggleSavedSlug(step2.next, 'github-student-developer-pack');
    assert.equal(step3.saved, false);
    assert.deepEqual(step3.next, ['supabase-free-tier']);
  });

  it('builds a clean canonical share payload for an offer', () => {
    const offerPath = path.resolve(
      process.cwd(),
      'data/offers/apis/github-rest-graphql-api.json'
    );
    const sampleOffer = JSON.parse(fs.readFileSync(offerPath, 'utf8')) as Offer;
    const payload = buildSharePayload(sampleOffer, 'https://freestack.example.com/');
    assert.ok(payload.title.includes(sampleOffer.identity.name));
    assert.ok(payload.text.includes(sampleOffer.identity.provider));
    assert.equal(
      payload.url,
      `https://freestack.example.com/offer/${encodeURIComponent(sampleOffer.identity.slug)}`
    );
  });
});

