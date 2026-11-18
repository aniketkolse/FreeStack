import type { Offer } from '../../types/resource.ts';

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'for',
  'to',
  'of',
  'in',
  'on',
  'with',
  'without',
  'and',
  'or',
  'is',
  'are',
  'can',
  'i',
  'where',
  'find',
  'best',
  'what',
  'which',
  'me',
  'my',
  'help',
  'build',
  'free',
  'resources',
  'resource',
  'tools',
  'tool',
]);

const SYNONYM_MAP: Record<string, string[]> = {
  llm: ['ai', 'model', 'gemini', 'llama', 'inference', 'gpt'],
  ai: ['llm', 'ml', 'model', 'inference', 'machine learning'],
  postgres: ['postgresql', 'sql', 'database', 'supabase', 'neon'],
  postgresql: ['postgres', 'sql', 'database', 'supabase', 'neon'],
  db: ['database', 'databases', 'sql', 'sqlite', 'postgresql'],
  database: ['databases', 'postgresql', 'sqlite', 'sql', 'backend'],
  host: ['hosting', 'deploy', 'cloud', 'serverless', 'vps'],
  hosting: ['host', 'deploy', 'cloud', 'serverless', 'pages', 'vercel', 'cloudflare'],
  student: ['students', 'academic', 'education', 'edu', 'university'],
  students: ['student', 'academic', 'education', 'edu'],
  learn: ['learning', 'course', 'courses', 'tutorial', 'study', 'curriculum', 'roadmap'],
  learning: ['learn', 'course', 'courses', 'study', 'documentation'],
  ide: ['editor', 'vscode', 'jetbrains', 'code'],
  mcp: ['model context protocol', 'mcp_server', 'context', 'agent', 'inspector'],
  frontend: ['css', 'ui', 'design', 'tailwind', 'icons', 'figma', 'penpot', 'components'],
  api: ['apis', 'rest', 'graphql', 'webhook', 'endpoint', 'sdk'],
  card: ['no card', 'credit card', 'card_required'],
  nocard: ['no card', 'no credit card'],
};

export interface ScoredOffer {
  offer: Offer;
  score: number;
}

export function tokenizeQuery(rawQuery: string): string[] {
  const cleaned = rawQuery
    .toLowerCase()
    .replace(/c\+\+/g, 'cpp')
    .replace(/[^a-z0-9.\s-]/g, ' ')
    .trim();

  if (!cleaned) return [];

  const tokens = cleaned
    .split(/\s+/)
    .map((t) => (t === 'cpp' ? 'c++' : t))
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));

  return Array.from(new Set(tokens));
}

export function scoreOfferRelevance(offer: Offer, rawQuery: string): number {
  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) return 1;

  const tokens = tokenizeQuery(rawQuery);
  const nameLower = offer.identity.name.toLowerCase();
  const providerLower = offer.identity.provider.toLowerCase();
  const descLower = offer.description.toLowerCase();
  const subcatLower = offer.classification.subcategory.toLowerCase();
  const categoryLower = offer.classification.category.toLowerCase();
  const typeLower = offer.classification.resource_type.toLowerCase();
  const pricingLower = offer.classification.pricing_model.toLowerCase();
  const tagsLower = offer.classification.tags.map((t) => t.toLowerCase());
  const learningTopicsLower = (offer.learning?.topics ?? []).map((t) => t.toLowerCase());
  const limitsText = offer.access.free_limits
    .map((l) => `${l.name} ${l.value ?? ''} ${l.period ?? ''}`.toLowerCase())
    .join(' ');
  const conditionsLower = (offer.eligibility.conditions ?? '').toLowerCase();

  let score = 0;

  if (nameLower === trimmed) score += 120;
  else if (nameLower.includes(trimmed)) score += 60;
  if (providerLower.includes(trimmed)) score += 35;
  if (descLower.includes(trimmed)) score += 25;

  if (
    /no\s*(credit)?\s*card/i.test(trimmed) &&
    offer.access.requirements.card_required === 'not_required'
  ) {
    score += 35;
  }
  if (/student|edu|academic/i.test(trimmed) && offer.eligibility.student_access === 'exclusive') {
    score += 30;
  }
  if (
    /local|offline/i.test(trimmed) &&
    tagsLower.some((t) => t.includes('local') || t.includes('offline'))
  ) {
    score += 30;
  }

  if (tokens.length === 0) {
    return score > 0 ? score : 1;
  }

  let matchedTokenCount = 0;

  for (const token of tokens) {
    const candidates = [token, ...(SYNONYM_MAP[token] ?? [])];
    let tokenScore = 0;

    for (const term of candidates) {
      const weightMultiplier = term === token ? 1 : 0.55;

      if (nameLower.includes(term)) tokenScore = Math.max(tokenScore, 40 * weightMultiplier);
      if (tagsLower.some((t) => t === term) || learningTopicsLower.some((t) => t === term)) {
        tokenScore = Math.max(tokenScore, 36 * weightMultiplier);
      } else if (
        tagsLower.some((t) => t.includes(term)) ||
        learningTopicsLower.some((t) => t.includes(term))
      ) {
        tokenScore = Math.max(tokenScore, 24 * weightMultiplier);
      }
      if (subcatLower.includes(term)) tokenScore = Math.max(tokenScore, 26 * weightMultiplier);
      if (categoryLower.includes(term) || typeLower.includes(term) || pricingLower.includes(term)) {
        tokenScore = Math.max(tokenScore, 20 * weightMultiplier);
      }
      if (providerLower.includes(term)) tokenScore = Math.max(tokenScore, 22 * weightMultiplier);
      if (descLower.includes(term)) tokenScore = Math.max(tokenScore, 16 * weightMultiplier);
      if (limitsText.includes(term)) tokenScore = Math.max(tokenScore, 14 * weightMultiplier);
      if (conditionsLower.includes(term)) tokenScore = Math.max(tokenScore, 12 * weightMultiplier);
    }

    if (tokenScore > 0) {
      matchedTokenCount += 1;
      score += tokenScore;
    }
  }

  if (matchedTokenCount === 0 && score === 0) {
    return 0;
  }

  if (matchedTokenCount === tokens.length && tokens.length > 1) {
    score += 25;
  }

  if (offer.metadata.featured) {
    score += 20;
  }

  if (offer.verification.status === 'verified') {
    score += 4;
  }

  return score;
}

export function searchOffers(offers: Offer[], query: string): ScoredOffer[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return offers.map((offer) => ({ offer, score: 1 }));
  }

  return offers
    .map((offer) => ({
      offer,
      score: scoreOfferRelevance(offer, trimmed),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.offer.identity.name.localeCompare(b.offer.identity.name));
}
