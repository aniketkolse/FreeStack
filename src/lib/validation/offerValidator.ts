import type {
  Category,
  DataQualityReport,
  Offer,
  SourceRegistry,
} from '../../types/resource.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const VALID_CATEGORIES = new Set([
  'ai-ml',
  'mcp',
  'cloud-hosting',
  'developer-tools',
  'databases-backend',
  'learning',
  'student-benefits',
  'apis-integrations',
  'design-creative',
  'security-networking',
  'productivity-collaboration',
]);

export const VALID_PRICING_MODELS = new Set([
  'completely_free',
  'free_tier',
  'free_credits',
  'student_exclusive',
  'open_source',
  'free_learning_material',
  'free_trial',
  'freemium',
]);

export const VALID_RESOURCE_TYPES = new Set([
  'software',
  'ai_model',
  'mcp_server',
  'api',
  'course',
  'book',
  'documentation',
  'tutorial',
  'roadmap',
  'dataset',
  'cloud_service',
  'developer_tool',
  'student_benefit',
  'practice',
  'other',
]);

export const VALID_REQUIREMENT_STATES = new Set(['required', 'not_required', 'unknown']);

export const VALID_VALIDITY_TYPES = new Set([
  'ongoing',
  'fixed_period',
  'credit_based',
  'trial_period',
  'unknown',
]);

export const VALID_STUDENT_ACCESS = new Set([
  'eligible',
  'exclusive',
  'not_eligible',
  'unknown',
]);

export const VALID_STATUSES = new Set([
  'verified',
  'needs_review',
  'expired',
  'unavailable',
  'unverified',
]);

export const VALID_LEARNING_FORMATS = new Set([
  'course',
  'book',
  'documentation',
  'tutorial',
  'roadmap',
  'video',
  'practice',
  'challenge',
  'other',
]);

export const VALID_LEARNING_DIFFICULTIES = new Set([
  'beginner',
  'intermediate',
  'advanced',
  'all_levels',
  'unknown',
]);

export const LEARNING_RESOURCE_TYPES = new Set([
  'course',
  'book',
  'documentation',
  'tutorial',
  'roadmap',
  'practice',
]);

const VALID_CONFIDENCES = new Set(['high', 'medium', 'low']);

export const DISALLOWED_URL_SHORTENERS = new Set([
  'bit.ly',
  'www.bit.ly',
  't.co',
  'www.t.co',
  'tinyurl.com',
  'www.tinyurl.com',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
  'rb.gy',
  'tiny.cc',
  'bitly.com',
  'bl.ink',
  'lnkd.in',
  's.id',
  'v.gd',
]);

export const ALLOWLISTED_PUNYCODE_DOMAINS = new Set([
  'xn--shknhintanyt-gcb8w.org',
  'www.xn--shknhintanyt-gcb8w.org',
  'xn--80aesfpebagmfblc0a.xn--p1ai',
  'xn--d1acpjx3f.xn--p1ai',
]);

export const ALLOWLISTED_SHORTENER_DOC_URLS = new Set([
  'https://cutt.ly/api-documentation/cuttly-links-api',
  'https://tinyurl.com/app/dev',
]);

const TRACKING_QUERY_PARAM_REGEX =
  /^(?:utm_[a-z0-9_]+|ref|aff|affiliate|affiliate_id|partner|partner_id|click_id|fbclid|gclid|msclkid|mc_eid|yclid)$/i;

const CONTROL_OR_BIDI_CHAR_REGEX =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;

const DANGEROUS_HTML_OR_XSS_REGEX =
  /<\s*\/?\s*(?:script|iframe|object|embed|svg|img|style|link|meta|base|form|input|button|textarea|applet|frame|frameset)\b|javascript\s*:|on(?:error|load|click|mouseover|focus)\s*=/i;

export function hasUnsafeTextContent(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  if (CONTROL_OR_BIDI_CHAR_REGEX.test(value)) {
    return 'contains disallowed control, zero-width, or bidirectional override characters';
  }
  if (DANGEROUS_HTML_OR_XSS_REGEX.test(value)) {
    return 'contains disallowed HTML tags or script/event handler patterns';
  }
  return null;
}

export function isPrivateOrLiteralHost(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!clean) return true;

  if (
    clean === 'localhost' ||
    clean.endsWith('.localhost') ||
    clean.endsWith('.local') ||
    clean.endsWith('.internal') ||
    clean.endsWith('.home.arpa') ||
    clean.endsWith('.arpa') ||
    clean.endsWith('.lan')
  ) {
    return true;
  }

  // IPv6 literal
  if (clean.includes(':')) {
    return true;
  }

  // IPv4 dotted quad or numeric IP encoding
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(clean)) {
    return true;
  }
  if (/^\d+(?:\.\d+){1,3}$/.test(clean)) {
    return true;
  }

  const parts = clean.split('.');
  if (parts.length < 2) return true;
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) {
    return true;
  }

  return false;
}

/**
 * Validates that a URL is a safe, public HTTPS URL without credentials,
 * IP literals, localhost/private hosts, URL shorteners, unallowlisted punycode,
 * or affiliate/tracking query parameters.
 */
export function isSafeHttpsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 2048) return false;
  if (/[\s\u0000-\u001F\u007F]/.test(url)) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username !== '' || parsed.password !== '') return false;
    if (parsed.port !== '' && parsed.port !== '443') return false;

    const host = parsed.hostname.toLowerCase();
    if (isPrivateOrLiteralHost(host)) return false;
    if (
      DISALLOWED_URL_SHORTENERS.has(host) &&
      !ALLOWLISTED_SHORTENER_DOC_URLS.has(parsed.toString())
    ) {
      return false;
    }
    if (host.includes('xn--') && !ALLOWLISTED_PUNYCODE_DOMAINS.has(host)) {
      return false;
    }

    for (const key of parsed.searchParams.keys()) {
      if (TRACKING_QUERY_PARAM_REGEX.test(key)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function isIsoDateString(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function validateOffer(
  offer: Offer,
  categoriesRegistry?: Category[]
): ValidationResult {
  const errors: string[] = [];

  if (!offer || typeof offer !== 'object') {
    return { valid: false, errors: ['Offer record must be an object'] };
  }

  if (offer.schema_version !== '1.0.0') {
    errors.push(`Invalid schema_version: ${String(offer.schema_version)}`);
  }

  // Identity
  if (!offer.identity || typeof offer.identity !== 'object') {
    errors.push('Missing identity block');
  } else {
    if (!offer.identity.id || offer.identity.id.trim().length < 2 || offer.identity.id.length > 140) {
      errors.push('Missing or out-of-bounds identity.id (2..140 chars)');
    }
    if (
      !offer.identity.name ||
      offer.identity.name.trim().length < 2 ||
      offer.identity.name.length > 180
    ) {
      errors.push('Missing or out-of-bounds identity.name (2..180 chars)');
    } else {
      const nameIssue = hasUnsafeTextContent(offer.identity.name);
      if (nameIssue) errors.push(`identity.name ${nameIssue}`);
    }

    if (
      !offer.identity.slug ||
      offer.identity.slug.length < 2 ||
      offer.identity.slug.length > 120 ||
      !/^[a-z0-9-]+$/.test(offer.identity.slug)
    ) {
      errors.push(`Invalid identity.slug format: ${String(offer.identity.slug)}`);
    }

    if (
      !offer.identity.provider ||
      offer.identity.provider.trim().length < 1 ||
      offer.identity.provider.length > 140
    ) {
      errors.push('Missing or out-of-bounds identity.provider (1..140 chars)');
    } else {
      const providerIssue = hasUnsafeTextContent(offer.identity.provider);
      if (providerIssue) errors.push(`identity.provider ${providerIssue}`);
    }

    if (
      offer.identity.logo_url !== undefined &&
      offer.identity.logo_url !== null &&
      !isSafeHttpsUrl(offer.identity.logo_url)
    ) {
      errors.push(`identity.logo_url must be valid HTTPS when provided: ${offer.identity.logo_url}`);
    }
  }

  // Classification
  if (!offer.classification || typeof offer.classification !== 'object') {
    errors.push('Missing classification block');
  } else {
    if (!VALID_CATEGORIES.has(offer.classification.category)) {
      errors.push(`Invalid classification.category: ${String(offer.classification.category)}`);
    }
    if (!offer.classification.subcategory || offer.classification.subcategory.trim().length < 2) {
      errors.push('Missing or short classification.subcategory');
    }
    if (categoriesRegistry && categoriesRegistry.length > 0) {
      const cat = categoriesRegistry.find((c) => c.slug === offer.classification.category);
      if (!cat) {
        errors.push(`Category "${offer.classification.category}" missing in categories registry`);
      } else {
        const subMatch = cat.subcategories.some(
          (sub) =>
            sub.name.toLowerCase() === offer.classification.subcategory.toLowerCase() ||
            sub.slug.toLowerCase() === offer.classification.subcategory.toLowerCase()
        );
        if (!subMatch) {
          errors.push(
            `Subcategory "${offer.classification.subcategory}" not registered under category "${cat.slug}"`
          );
        }
      }
    }
    if (!VALID_RESOURCE_TYPES.has(offer.classification.resource_type)) {
      errors.push(`Invalid classification.resource_type: ${String(offer.classification.resource_type)}`);
    }
    if (!VALID_PRICING_MODELS.has(offer.classification.pricing_model)) {
      errors.push(`Invalid classification.pricing_model: ${String(offer.classification.pricing_model)}`);
    }
    if (!Array.isArray(offer.classification.tags)) {
      errors.push('classification.tags must be an array');
    }
  }

  // Description
  if (
    !offer.description ||
    offer.description.trim().length < 10 ||
    offer.description.length > 2000
  ) {
    errors.push('Description must be between 10 and 2000 characters');
  } else {
    const descIssue = hasUnsafeTextContent(offer.description);
    if (descIssue) errors.push(`description ${descIssue}`);
  }

  // Access
  if (!offer.access || typeof offer.access !== 'object') {
    errors.push('Missing access block');
  } else {
    if (!Array.isArray(offer.access.free_limits)) {
      errors.push('access.free_limits must be an array');
    } else {
      for (const lim of offer.access.free_limits) {
        const limIssue = hasUnsafeTextContent(lim.name) || hasUnsafeTextContent(String(lim.value ?? ''));
        if (limIssue) errors.push(`access.free_limits ${limIssue}`);
      }
    }
    if (!Array.isArray(offer.access.restrictions)) {
      errors.push('access.restrictions must be an array');
    }
    if (!offer.access.requirements || typeof offer.access.requirements !== 'object') {
      errors.push('Missing access.requirements');
    } else {
      if (!VALID_REQUIREMENT_STATES.has(offer.access.requirements.account_required)) {
        errors.push(
          `Invalid access.requirements.account_required: ${String(
            offer.access.requirements.account_required
          )}`
        );
      }
      if (!VALID_REQUIREMENT_STATES.has(offer.access.requirements.card_required)) {
        errors.push(
          `Invalid access.requirements.card_required: ${String(
            offer.access.requirements.card_required
          )}`
        );
      }
      if (offer.access.requirements.payment_method_notes === undefined) {
        errors.push('access.requirements.payment_method_notes is required (may be null)');
      }
    }
    if (!offer.access.validity || typeof offer.access.validity !== 'object') {
      errors.push('Missing access.validity');
    } else {
      if (!VALID_VALIDITY_TYPES.has(offer.access.validity.type)) {
        errors.push(`Invalid access.validity.type: ${String(offer.access.validity.type)}`);
      }
      if (offer.access.validity.auto_renewal === undefined) {
        errors.push('access.validity.auto_renewal is required (may be null)');
      }
    }
  }

  // Eligibility
  if (!offer.eligibility || typeof offer.eligibility !== 'object') {
    errors.push('Missing eligibility block');
  } else {
    if (!VALID_STUDENT_ACCESS.has(offer.eligibility.student_access)) {
      errors.push(`Invalid eligibility.student_access: ${String(offer.eligibility.student_access)}`);
    }
    if (!Array.isArray(offer.eligibility.regions)) {
      errors.push('eligibility.regions must be an array');
    }
    if (offer.eligibility.conditions === undefined) {
      errors.push('eligibility.conditions is required (may be null)');
    }
  }

  // Links
  if (!offer.links || typeof offer.links !== 'object') {
    errors.push('Missing links block');
  } else {
    if (!isSafeHttpsUrl(offer.links.official)) {
      errors.push(`links.official must be valid safe HTTPS URL: ${String(offer.links.official)}`);
    }
    for (const key of ['signup', 'documentation', 'pricing'] as const) {
      const val = offer.links[key];
      if (val !== undefined && val !== null && !isSafeHttpsUrl(val)) {
        errors.push(`links.${key} must be valid safe HTTPS URL when provided: ${val}`);
      }
    }
  }

  // Cross-field rules
  if (
    offer.classification?.pricing_model === 'free_trial' &&
    offer.access?.validity?.type !== 'trial_period'
  ) {
    errors.push('free_trial pricing_model must use access.validity.type === "trial_period"');
  }

  if (
    offer.classification?.pricing_model === 'student_exclusive' &&
    offer.eligibility?.student_access !== 'exclusive'
  ) {
    errors.push('student_exclusive pricing_model must use eligibility.student_access === "exclusive"');
  }

  // Learning metadata checks
  if (
    offer.classification &&
    LEARNING_RESOURCE_TYPES.has(offer.classification.resource_type) &&
    !offer.learning
  ) {
    errors.push(
      `Resource type "${offer.classification.resource_type}" requires a learning metadata block`
    );
  }

  if (offer.learning) {
    if (!VALID_LEARNING_FORMATS.has(offer.learning.format)) {
      errors.push(`Invalid learning.format: ${String(offer.learning.format)}`);
    }
    if (!VALID_LEARNING_DIFFICULTIES.has(offer.learning.difficulty)) {
      errors.push(`Invalid learning.difficulty: ${String(offer.learning.difficulty)}`);
    }
    if (!Array.isArray(offer.learning.topics)) {
      errors.push('learning.topics must be an array');
    }
    if (offer.learning.language === undefined) {
      errors.push('learning.language is required (may be null)');
    }
  }

  // Evidence & Claims
  const sourceIds = new Set<string>();
  if (!offer.evidence || typeof offer.evidence !== 'object') {
    errors.push('Missing evidence block');
  } else {
    if (!Array.isArray(offer.evidence.sources)) {
      errors.push('evidence.sources must be an array');
    } else {
      for (const src of offer.evidence.sources) {
        if (!src.id || src.id.trim().length < 1) {
          errors.push('Evidence source missing id');
        } else {
          sourceIds.add(src.id);
        }
        if (!isSafeHttpsUrl(src.url)) {
          errors.push(`Evidence source "${src.id}" URL must be safe HTTPS: ${String(src.url)}`);
        }
        if (!isIsoDateString(src.checked_at)) {
          errors.push(`Evidence source "${src.id}" checked_at must be YYYY-MM-DD`);
        }
      }
    }

    if (!Array.isArray(offer.evidence.claims)) {
      errors.push('evidence.claims must be an array');
    } else {
      for (const claim of offer.evidence.claims) {
        if (!sourceIds.has(claim.source_id)) {
          errors.push(
            `Evidence claim for "${claim.field_path}" references missing source_id "${claim.source_id}"`
          );
        }
        if (!claim.quote || claim.quote.trim().length < 3) {
          errors.push(`Evidence claim for "${claim.field_path}" requires a supporting quote`);
        } else {
          const quoteIssue = hasUnsafeTextContent(claim.quote);
          if (quoteIssue) errors.push(`Evidence claim quote ${quoteIssue}`);
        }
        if (!VALID_CONFIDENCES.has(claim.confidence)) {
          errors.push(`Invalid claim confidence: ${String(claim.confidence)}`);
        }
      }
    }
  }

  // Verification rules
  if (!offer.verification || typeof offer.verification !== 'object') {
    errors.push('Missing verification block');
  } else {
    if (!VALID_STATUSES.has(offer.verification.status)) {
      errors.push(`Invalid verification.status: ${String(offer.verification.status)}`);
    }
    if (offer.verification.notes === undefined) {
      errors.push('verification.notes is required (may be null)');
    }
    if (
      offer.verification.last_verified_at !== null &&
      !isIsoDateString(offer.verification.last_verified_at)
    ) {
      errors.push(
        `verification.last_verified_at must be null or YYYY-MM-DD: ${String(
          offer.verification.last_verified_at
        )}`
      );
    }
    if (offer.verification.status === 'verified') {
      if (
        !offer.evidence ||
        offer.evidence.sources.length === 0 ||
        offer.evidence.claims.length === 0
      ) {
        errors.push('Verified record must have at least one evidence source and one claim');
      }
      if (!offer.verification.last_verified_at) {
        errors.push('Verified record must include verification.last_verified_at');
      }
    }
    if (
      offer.verification.status === 'expired' &&
      (!offer.evidence ||
        (offer.evidence.sources.length === 0 && offer.evidence.claims.length === 0))
    ) {
      errors.push('Expired record requires supporting evidence');
    }
  }

  // Metadata dates
  if (!offer.metadata || typeof offer.metadata !== 'object') {
    errors.push('Missing metadata block');
  } else {
    if (!isIsoDateString(offer.metadata.created_at)) {
      errors.push(`Invalid metadata.created_at: ${String(offer.metadata.created_at)}`);
    }
    if (!isIsoDateString(offer.metadata.updated_at)) {
      errors.push(`Invalid metadata.updated_at: ${String(offer.metadata.updated_at)}`);
    }
    if (
      isIsoDateString(offer.metadata.created_at) &&
      isIsoDateString(offer.metadata.updated_at) &&
      offer.metadata.updated_at < offer.metadata.created_at
    ) {
      errors.push(
        `metadata.updated_at (${offer.metadata.updated_at}) precedes created_at (${offer.metadata.created_at})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCatalog(
  offers: Offer[],
  categoriesRegistry?: Category[]
): ValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const offer of offers) {
    const id = offer?.identity?.id ?? 'unknown';
    const slug = offer?.identity?.slug ?? '';

    if (seenIds.has(id)) {
      errors.push(`Duplicate offer identity.id: ${id}`);
    }
    seenIds.add(id);

    if (slug && seenSlugs.has(slug)) {
      errors.push(`Duplicate offer identity.slug: ${slug}`);
    }
    if (slug) seenSlugs.add(slug);

    const res = validateOffer(offer, categoriesRegistry);
    if (!res.valid) {
      errors.push(...res.errors.map((e) => `[${id}] ${e}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSourceRegistry(registry: SourceRegistry): ValidationResult {
  const errors: string[] = [];
  if (!registry || typeof registry !== 'object') {
    return { valid: false, errors: ['Source registry must be an object'] };
  }
  if (registry.schema_version !== '1.0.0') {
    errors.push(`Invalid source registry schema_version: ${String(registry.schema_version)}`);
  }
  if (!Array.isArray(registry.sources) || registry.sources.length === 0) {
    errors.push('Source registry must contain at least one source');
    return { valid: false, errors };
  }

  const seenIds = new Set<string>();
  for (const src of registry.sources) {
    if (!src.id || !/^[a-z0-9-]+$/.test(src.id)) {
      errors.push(`Invalid source registry id: ${String(src.id)}`);
    } else if (seenIds.has(src.id)) {
      errors.push(`Duplicate source registry id: ${src.id}`);
    } else {
      seenIds.add(src.id);
    }

    if (!isSafeHttpsUrl(src.entry_url)) {
      errors.push(`Source "${src.id}" entry_url must be safe HTTPS: ${String(src.entry_url)}`);
    }
    if (!VALID_CATEGORIES.has(src.category)) {
      errors.push(`Source "${src.id}" has invalid category: ${String(src.category)}`);
    }
    if (!src.crawl_policy || src.crawl_policy.respect_robots_txt !== true) {
      errors.push(`Source "${src.id}" must enforce crawl_policy.respect_robots_txt === true`);
    }
    if (
      !src.crawl_policy ||
      typeof src.crawl_policy.rate_limit_rpm !== 'number' ||
      src.crawl_policy.rate_limit_rpm < 1 ||
      src.crawl_policy.rate_limit_rpm > 30
    ) {
      errors.push(`Source "${src.id}" must set bounded rate_limit_rpm (1..30)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateDataQualityReport(
  offers: Offer[],
  categories: Category[]
): DataQualityReport {
  const validation = validateCatalog(offers, categories);
  let verifiedCount = 0;
  let needsReviewCount = 0;
  let unverifiedCount = 0;
  let expiredCount = 0;
  let unavailableCount = 0;
  let noCardCount = 0;
  let studentExclusiveCount = 0;
  let learningCount = 0;
  let totalEvidenceSources = 0;
  let totalEvidenceClaims = 0;
  let highConfidenceClaims = 0;
  let latestVerificationDate: string | null = null;

  for (const offer of offers) {
    if (offer.verification.status === 'verified') verifiedCount += 1;
    else if (offer.verification.status === 'needs_review') needsReviewCount += 1;
    else if (offer.verification.status === 'unverified') unverifiedCount += 1;
    else if (offer.verification.status === 'expired') expiredCount += 1;
    else if (offer.verification.status === 'unavailable') unavailableCount += 1;

    if (offer.access.requirements.card_required === 'not_required') noCardCount += 1;
    if (offer.eligibility.student_access === 'exclusive') studentExclusiveCount += 1;
    if (offer.classification.category === 'learning' || Boolean(offer.learning)) learningCount += 1;

    totalEvidenceSources += offer.evidence.sources.length;
    totalEvidenceClaims += offer.evidence.claims.length;
    for (const claim of offer.evidence.claims) {
      if (claim.confidence === 'high') highConfidenceClaims += 1;
    }

    const vDate = offer.verification.last_verified_at;
    if (vDate && (!latestVerificationDate || vDate > latestVerificationDate)) {
      latestVerificationDate = vDate;
    }
  }

  return {
    totalOffers: offers.length,
    totalCategories: categories.length,
    verifiedCount,
    needsReviewCount,
    unverifiedCount,
    expiredCount,
    unavailableCount,
    noCardCount,
    studentExclusiveCount,
    learningCount,
    totalEvidenceSources,
    totalEvidenceClaims,
    highConfidenceClaims,
    schemaValid: validation.valid,
    validationErrors: validation.errors,
    latestVerificationDate,
  };
}
