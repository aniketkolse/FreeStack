import type {
  CategorySlug,
  FilterState,
  Offer,
  PricingModel,
  RequirementState,
  ResourceType,
  SortOption,
  StudentAccessState,
  VerificationStatus,
} from '../../types/resource';
import { searchOffers } from '../search/searchOffers';
import { getAiContextWindow } from '../ai/aiModelMetadata';

export const DEFAULT_FILTER_STATE: FilterState = {
  query: '',
  category: 'all',
  subcategory: 'all',
  pricingModels: [],
  cardRequired: 'all',
  studentAccess: 'all',
  resourceType: 'all',
  region: 'all',
  verificationStatus: 'all',
  sortBy: 'relevance',
};

export function filterAndSortOffers(offers: Offer[], filters: FilterState): Offer[] {
  const scored = searchOffers(offers, filters.query);

  const filtered = scored.filter(({ offer }) => {
    if (filters.category !== 'all' && offer.classification.category !== filters.category) {
      return false;
    }

    if (
      filters.subcategory !== 'all' &&
      offer.classification.subcategory.toLowerCase() !== filters.subcategory.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.pricingModels.length > 0 &&
      !filters.pricingModels.includes(offer.classification.pricing_model)
    ) {
      return false;
    }

    // Strict tri-state matching: unknown NEVER matches not_required or required
    if (
      filters.cardRequired !== 'all' &&
      offer.access.requirements.card_required !== filters.cardRequired
    ) {
      return false;
    }

    if (
      filters.studentAccess !== 'all' &&
      offer.eligibility.student_access !== filters.studentAccess
    ) {
      return false;
    }

    if (
      filters.resourceType !== 'all' &&
      offer.classification.resource_type !== filters.resourceType
    ) {
      return false;
    }

    if (filters.region !== 'all') {
      const regionMatch = offer.eligibility.regions.some((r) =>
        r.toLowerCase().includes(filters.region.toLowerCase())
      );
      if (!regionMatch) return false;
    }

    if (
      filters.verificationStatus !== 'all' &&
      offer.verification.status !== filters.verificationStatus
    ) {
      return false;
    }

    return true;
  });

  if (filters.sortBy === 'relevance' && filters.query.trim().length > 0) {
    return filtered.map((entry) => entry.offer);
  }

  const list = filtered.map((entry) => entry.offer);

  if (filters.sortBy === 'context_desc') {
    return [...list].sort((a, b) => {
      const ctxA = getAiContextWindow(a)?.tokens ?? 0;
      const ctxB = getAiContextWindow(b)?.tokens ?? 0;
      if (ctxB !== ctxA) return ctxB - ctxA;
      const fa = a.metadata.featured ? 1 : 0;
      const fb = b.metadata.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'recently_verified') {
    return [...list].sort((a, b) => {
      const da = a.verification.last_verified_at ?? '';
      const db = b.verification.last_verified_at ?? '';
      return db.localeCompare(da) || a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'recently_added') {
    return [...list].sort((a, b) => {
      const da = a.metadata.created_at ?? '';
      const db = b.metadata.created_at ?? '';
      return db.localeCompare(da) || a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'use_case') {
    const subCounts = new Map<string, number>();
    for (const item of list) {
      const s = item.classification.subcategory;
      subCounts.set(s, (subCounts.get(s) ?? 0) + 1);
    }
    return [...list].sort((a, b) => {
      const countA = subCounts.get(a.classification.subcategory) ?? 0;
      const countB = subCounts.get(b.classification.subcategory) ?? 0;
      if (countB !== countA) return countB - countA;
      const subCmp = a.classification.subcategory.localeCompare(b.classification.subcategory);
      if (subCmp !== 0) return subCmp;
      const fa = a.metadata.featured ? 1 : 0;
      const fb = b.metadata.featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      const ctxA = getAiContextWindow(a)?.tokens ?? 0;
      const ctxB = getAiContextWindow(b)?.tokens ?? 0;
      if (ctxB !== ctxA) return ctxB - ctxA;
      return a.identity.name.localeCompare(b.identity.name);
    });
  }

  if (filters.sortBy === 'name_asc') {
    return [...list].sort((a, b) => a.identity.name.localeCompare(b.identity.name));
  }

  // Default relevance when query is empty: pinned top defaults first, then featured, then recently verified
  const PINNED_DEFAULT_SLUGS: Record<string, number> = {
    // Frontend & Design Tools pinned defaults
    'gradientdeck-ui-design-md': 1,
    'getdesign-md-website-library': 2,
    'kombai-ai-design-engineer': 3,
    // Databases & Backend pinned defaults
    'supabase-free-plan': 1,
    'render-free-postgres-redis-backend': 2,
    'railway-backend-databases-trial': 3,
    'aws-free-tier-databases-backend': 4,
    'mongodb-atlas-free-forever-m0': 5,
    // Security & Networking pinned defaults (most popular at top)
    'cloudflare-zero-trust-free': 1,
    'tailscale-free-wireguard-mesh-vpn': 2,
    'wireshark-network-protocol-analyzer': 3,
    'nmap-network-mapper-scanner': 4,
    'owasp-zap-zed-attack-proxy': 5,
    'lets-encrypt': 6,
    'burp-suite-community-edition': 7,
    'bitwarden-open-source-password-manager': 8,
    // Productivity & Collaboration pinned defaults (most popular at top)
    'notion-free-plan': 1,
    'linear-free-issue-tracking': 2,
    'slack-free-team-messaging': 3,
    'obsidian-markdown-knowledge-base': 4,
    'excalidraw-whiteboard': 5,
    'n8n-workflow-automation-self-hosted': 6,
    'atlassian-jira-free-plan': 7,
    'miro-free-collaborative-whiteboard': 8,
    // Cloud & Hosting pinned defaults (most popular at top)
    'cloudflare-pages-workers': 1,
    'vercel-hobby': 2,
    'aws-free-tier-cloud-credits': 3,
    'google-cloud-free-program-300': 4,
    'oracle-cloud-always-free': 5,
    'microsoft-azure-free-account-200': 6,
    'netlify-starter-free-hosting': 7,
    'render-free-web-services-static': 8,
    'fly-io-machines-app-hosting': 9,
    'github-pages-static': 10,
    // Student Benefits pinned defaults (most popular at top)
    'github-student-developer-pack': 1,
    'jetbrains-educational-pack': 2,
    'azure-for-students': 3,
    'github-copilot-pro-students': 4,
    'cursor-pro-student-free': 5,
    'figma-education': 6,
    'notion-plus-education': 7,
    'google-one-ai-premium-students': 8,
    'autodesk-education-free-plan': 9,
    'aws-educate-cloud-skills': 10,
    'namecheap-nc-me-student-domain': 11,
    'canva-education-free': 12,
  };

  return [...list].sort((a, b) => {
    const pinA = PINNED_DEFAULT_SLUGS[a.identity.slug] ?? 999;
    const pinB = PINNED_DEFAULT_SLUGS[b.identity.slug] ?? 999;
    if (pinA !== pinB) return pinA - pinB;

    const fa = a.metadata.featured ? 1 : 0;
    const fb = b.metadata.featured ? 1 : 0;
    if (fb !== fa) return fb - fa;
    const da = a.verification.last_verified_at ?? '';
    const db = b.verification.last_verified_at ?? '';
    return db.localeCompare(da) || a.identity.name.localeCompare(b.identity.name);
  });
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.category !== 'all') count += 1;
  if (filters.subcategory !== 'all') count += 1;
  if (filters.pricingModels.length > 0) count += filters.pricingModels.length;
  if (filters.cardRequired !== 'all') count += 1;
  if (filters.studentAccess !== 'all') count += 1;
  if (filters.resourceType !== 'all') count += 1;
  if (filters.region !== 'all') count += 1;
  if (filters.verificationStatus !== 'all') count += 1;
  return count;
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.subcategory !== 'all') params.set('subcategory', filters.subcategory);
  if (filters.pricingModels.length > 0) {
    params.set('pricing', filters.pricingModels.join(','));
  }
  if (filters.cardRequired !== 'all') params.set('card', filters.cardRequired);
  if (filters.studentAccess !== 'all') params.set('student', filters.studentAccess);
  if (filters.resourceType !== 'all') params.set('type', filters.resourceType);
  if (filters.region !== 'all') params.set('region', filters.region);
  if (filters.verificationStatus !== 'all') params.set('status', filters.verificationStatus);
  if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
  return params;
}

export function searchParamsToFilters(params: URLSearchParams): FilterState {
  const query = params.get('q') ?? '';
  const category = (params.get('category') as CategorySlug | 'all') || 'all';
  const subcategory = params.get('subcategory') || 'all';

  const pricingRaw = params.get('pricing') ?? '';
  const pricingModels = pricingRaw
    ? (pricingRaw.split(',').filter(Boolean) as PricingModel[])
    : [];

  // Normalize legacy ?card=no_card | card_required aliases gracefully
  const cardParam = params.get('card') ?? 'all';
  let cardRequired: RequirementState | 'all' = 'all';
  if (cardParam === 'no_card' || cardParam === 'not_required') cardRequired = 'not_required';
  else if (cardParam === 'card_required' || cardParam === 'required') cardRequired = 'required';
  else if (cardParam === 'unknown') cardRequired = 'unknown';

  const studentParam = params.get('student') ?? 'all';
  let studentAccess: StudentAccessState | 'all' = 'all';
  if (studentParam === 'student_only' || studentParam === 'exclusive') studentAccess = 'exclusive';
  else if (studentParam === 'eligible' || studentParam === 'not_eligible' || studentParam === 'unknown') {
    studentAccess = studentParam;
  }

  const resourceType = (params.get('type') as ResourceType | 'all') || 'all';
  const region = params.get('region') || 'all';
  const verificationStatus =
    (params.get('status') as VerificationStatus | 'all') || 'all';

  const sortParam = params.get('sort') || 'relevance';
  const sortBy: SortOption =
    sortParam === 'recent' ? 'recently_verified' : (sortParam as SortOption);

  return {
    query,
    category,
    subcategory,
    pricingModels,
    cardRequired,
    studentAccess,
    resourceType,
    region,
    verificationStatus,
    sortBy,
  };
}
