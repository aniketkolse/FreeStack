import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadOffersFromDisk } from '../data/nodeLoader';
import { searchOffers } from './searchOffers';

const OFFERS = loadOffersFromDisk();

describe('searchOffers (Section 9 schema)', () => {
  it('matches natural-language Python LLM API query to Gemini & Groq', () => {
    const results = searchOffers(OFFERS, 'free LLM API for Python');
    const slugs = results.slice(0, 5).map((r) => r.offer.identity.slug);
    assert.ok(slugs.includes('google-ai-studio-gemini-free'));
    assert.ok(slugs.includes('groq-cloud-free-tier'));
  });

  it('matches PostgreSQL hosting query to Supabase & Neon', () => {
    const results = searchOffers(OFFERS, 'free PostgreSQL hosting');
    const slugs = results.slice(0, 5).map((r) => r.offer.identity.slug);
    assert.ok(slugs.includes('supabase-free-plan'));
    assert.ok(slugs.includes('neon-serverless-postgres'));
  });

  it('matches React learning resources query', () => {
    const results = searchOffers(OFFERS, 'free React learning resources');
    const slugs = results.slice(0, 5).map((r) => r.offer.identity.slug);
    assert.ok(
      slugs.includes('freecodecamp-curriculum') || slugs.includes('the-odin-project')
    );
  });

  it('matches student cloud credits query', () => {
    const results = searchOffers(OFFERS, 'student cloud credits');
    const slugs = results.slice(0, 5).map((r) => r.offer.identity.slug);
    assert.ok(slugs.includes('azure-for-students'));
  });
});
