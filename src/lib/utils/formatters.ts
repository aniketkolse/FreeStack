import type {
  LearningDifficulty,
  LearningFormat,
  Offer,
  PricingModel,
  RequirementState,
  ResourceType,
  StudentAccessState,
  ValidityType,
  VerificationStatus,
} from '../../types/resource';
import { isSafeHttpsUrl } from '../validation/offerValidator';

export function formatPricingModel(model: PricingModel): string {
  switch (model) {
    case 'completely_free':
      return 'Completely free';
    case 'free_tier':
      return 'Free tier';
    case 'free_credits':
      return 'Free credits';
    case 'student_exclusive':
      return 'Student exclusive';
    case 'open_source':
      return 'Open source';
    case 'free_learning_material':
      return 'Free learning material';
    case 'free_trial':
      return 'Free trial';
    case 'freemium':
      return 'Freemium';
  }
}

export function formatResourceType(type: ResourceType): string {
  switch (type) {
    case 'software':
      return 'Software';
    case 'ai_model':
      return 'AI Model';
    case 'mcp_server':
      return 'MCP Server';
    case 'api':
      return 'API';
    case 'course':
      return 'Course';
    case 'book':
      return 'Book';
    case 'documentation':
      return 'Documentation';
    case 'tutorial':
      return 'Tutorial';
    case 'roadmap':
      return 'Roadmap';
    case 'dataset':
      return 'Dataset';
    case 'cloud_service':
      return 'Cloud Service';
    case 'developer_tool':
      return 'Developer Tool';
    case 'student_benefit':
      return 'Student Benefit';
    case 'practice':
      return 'Practice';
    case 'other':
      return 'Resource';
  }
}

export function formatVerificationStatus(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'needs_review':
      return 'Needs review';
    case 'expired':
      return 'Expired';
    case 'unavailable':
      return 'Unavailable';
    case 'unverified':
      return 'Unverified';
  }
}

export function formatCardRequirement(state: RequirementState): string {
  switch (state) {
    case 'not_required':
      return 'No credit card required';
    case 'required':
      return 'Credit card required';
    case 'unknown':
      return 'Unknown (card rule)';
  }
}

export function formatAccountRequirement(state: RequirementState): string {
  switch (state) {
    case 'not_required':
      return 'No account needed';
    case 'required':
      return 'Free account required';
    case 'unknown':
      return 'Unknown';
  }
}

export function formatStudentAccess(state: StudentAccessState): string {
  switch (state) {
    case 'exclusive':
      return 'Students only (academic verification required)';
    case 'eligible':
      return 'Open to students and general public';
    case 'not_eligible':
      return 'Not eligible for students';
    case 'unknown':
      return 'Student eligibility unknown';
  }
}

export function formatValidityType(type: ValidityType): string {
  switch (type) {
    case 'ongoing':
      return 'Ongoing / no fixed expiry';
    case 'fixed_period':
      return 'Fixed period (renewable)';
    case 'credit_based':
      return 'Credit-based validity';
    case 'trial_period':
      return 'Time-limited trial';
    case 'unknown':
      return 'Unknown validity';
  }
}

export function formatLearningFormat(format: LearningFormat): string {
  switch (format) {
    case 'course':
      return 'Course';
    case 'book':
      return 'Book';
    case 'documentation':
      return 'Documentation';
    case 'tutorial':
      return 'Tutorial';
    case 'roadmap':
      return 'Roadmap';
    case 'video':
      return 'Video Lectures';
    case 'practice':
      return 'Practice';
    case 'challenge':
      return 'Challenge';
    case 'other':
      return 'Other';
  }
}

export function formatLearningDifficulty(diff: LearningDifficulty): string {
  switch (diff) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    case 'all_levels':
      return 'All levels';
    case 'unknown':
      return 'Level unknown';
  }
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return 'Not yet verified';
  const parsed = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function getPrimaryLimitSummary(offer: Offer): string {
  const first = offer.access.free_limits[0];
  if (!first) return 'Limits not specified';
  if (first.value === null) return `${first.name}: Unknown`;
  return `${first.name}: ${first.value}${first.period ? ` ${first.period}` : ''}`;
}

function compactPeriodSuffix(period: string | null | undefined): string {
  if (!period) return '';
  const p = period.trim().toLowerCase();
  if (
    !p ||
    p === 'ongoing' ||
    p === 'forever' ||
    p === 'forever free' ||
    p === 'one_time' ||
    p === 'one-time' ||
    p === 'local hardware' ||
    p === 'unlimited' ||
    p.includes('open source') ||
    p.includes('while ') ||
    p.includes('hobby') ||
    p.includes('personal') ||
    p.includes('per project')
  ) {
    return '';
  }
  if (/gb\s+per\s+month/i.test(p)) return ' GB/mo';
  if (/mb\s+per\s+month/i.test(p)) return ' MB/mo';
  if (/^gb\b/i.test(p)) return ' GB';
  if (/^mb\b/i.test(p)) return ' MB';
  if (/^tb\b/i.test(p)) return ' TB';
  if (/per\s+hour/i.test(p)) return '/hr';
  if (/per\s+minute|rpm/i.test(p)) return '/min';
  if (/per\s+day|rpd/i.test(p)) return '/day';
  if (/per\s+month|monthly/i.test(p)) return '/mo';
  if (/per\s+second/i.test(p)) return '/sec';
  if (/per\s+year|yearly|annual/i.test(p)) return '/yr';
  const daysMatch = p.match(/(\d+)\s*days?/i);
  if (daysMatch) return ` (${daysMatch[1]}d)`;
  if (p === 'users' || p === 'seats') return ` ${p}`;
  return '';
}

function shortenLimitLabel(rawName: string): string {
  const name = rawName.replace(/\([^)]*\)/g, '').trim();
  if (/best free rate limit|rate\s*limit|requests\s+per|authenticated\s+rest\s+api|api\s+requests/i.test(name)) {
    return 'Rate limit';
  }
  if (/credit/i.test(name)) return 'Free credits';
  if (/bandwidth|data\s+transfer/i.test(name)) return 'Bandwidth';
  if (/database/i.test(name)) return 'Database';
  if (/storage|disk/i.test(name)) return 'Storage';
  if (/compute|instance|web\s+service|hours/i.test(name)) return 'Free compute';
  if (/seat|member|collaborator|users?\b/i.test(name)) return 'Users';
  if (/repo/i.test(name)) return 'Repositories';
  if (/completion/i.test(name)) return 'Completions';
  if (/personal\s*&\s*commercial|local\s+inference|usage/i.test(name)) return 'Usage';
  if (/protocol\s+dissectors/i.test(name)) return 'Protocols';
  if (/domain/i.test(name)) return 'Domain';
  if (/binary|sdk|framework|engine|component|license|open\s+source/i.test(name)) return 'License';
  if (/plan|tier|pack|subscription/i.test(name)) return 'Free plan';
  if (/drafts/i.test(name)) return 'Drafts';
  if (/pages|blocks/i.test(name)) return 'Pages & blocks';
  if (/vaults|notes/i.test(name)) return 'Local vaults';
  if (/canvas|whiteboard/i.test(name)) return 'Canvases';
  if (/scanning/i.test(name)) return 'Scanning';
  if (/font/i.test(name)) return 'Font families';
  if (/icons?/i.test(name)) return 'Icons';
  if (/design\s*&\s*figjam|files/i.test(name)) return 'Design files';

  const firstClause = name.split(/,\s+|[+·–—]/)[0].trim();
  const cleanTrailing = (s: string) =>
    s.replace(/(?:\s+(?:and|of|for|with|to|in)|[\s&/-]+)$/i, '').trim();
  if (firstClause.length >= 3 && firstClause.length <= 16) return cleanTrailing(firstClause) || 'Free limit';
  const words = firstClause.split(/\s+/).filter(Boolean);
  let out = '';
  for (const w of words) {
    const candidate = out ? `${out} ${w}` : w;
    if (candidate.length > 16) break;
    out = candidate;
  }
  const finalLabel = cleanTrailing(out || firstClause.slice(0, 16).trim());
  return finalLabel.length >= 3 ? finalLabel : 'Free limit';
}

function shortenLimitValue(rawValue: string | number | null, period: string | null | undefined): string {
  if (rawValue === null) return 'Varies';
  const raw = String(rawValue).trim();
  if (!raw) return 'Included';

  if (/^unlimited\b/i.test(raw)) {
    return 'Unlimited';
  }
  if (/^100%\s*(?:free\s*&\s*)?open\s*source/i.test(raw)) {
    return 'Open source';
  }
  if (/rate[- ]limited\s+by\s+model/i.test(raw)) {
    return 'Varies by model';
  }

  // Extract crisp rate limit or dollar/storage quota from long descriptive strings
  if (raw.length > 24) {
    const rpmMatch = raw.match(/\b(\d[\d,.]*\s*(?:RPM|RPD|TPM|TPD)(?:\s*\/\s*\d[\d,.]*\s*(?:RPM|RPD|TPM|TPD))?)\b/i);
    if (rpmMatch) return rpmMatch[1];

    const hoursMatch = raw.match(/\b(\d[\d,.]*)\s*(?:free\s+)?(?:instance\s+)?hours?\/(?:month|mo)\b/i);
    if (hoursMatch) return `${hoursMatch[1]} hrs/mo`;

    const dollarMatch = raw.match(/(?:up\s+to\s+)?\$\d+(?:\.\d{2})?(?:\/(?:mo|month))?/i);
    if (dollarMatch) {
      const amt = dollarMatch[0]
        .replace(/\.00\b/, '')
        .replace(/^up\s+to\b/i, 'Up to');
      return /credit/i.test(raw) && !/\/mo/i.test(amt) ? `${amt} credit` : amt;
    }

    const storageMatch = raw.match(/\b(\d[\d,.]*\s*(?:GB|MB|TB))\b/i);
    if (storageMatch) return storageMatch[1];

    const templatesMatch = raw.match(/\b(\d[\d,]*\+?)\s*(?:free\s+)?templates/i);
    if (templatesMatch) return `${templatesMatch[1].replace(',000', 'K')} templates`;
  }

  // Strip parenthetical qualifiers when a clean base value remains
  const withoutParens = raw.replace(/\s*\([^)]*\)/g, '').trim();
  let cleaned = withoutParens.length >= 2 ? withoutParens : raw;

  // Compact verbose units
  cleaned = cleaned
    .replace(/\brequests?\b/i, 'req')
    .replace(/\b100%\s*free\b/i, 'Free')
    .replace(/\s+/g, ' ')
    .trim();

  if (typeof rawValue === 'number' || /^\d[\d,.]*$/.test(cleaned)) {
    const suffix = compactPeriodSuffix(period);
    if (suffix) return `${cleaned}${suffix}`;
  } else if (cleaned.length <= 16) {
    const suffix = compactPeriodSuffix(period);
    if (suffix && !cleaned.toLowerCase().includes(suffix.trim().toLowerCase())) {
      const combined = `${cleaned}${suffix}`;
      if (combined.length <= 22) return combined;
    }
  }

  if (cleaned.length <= 24) return cleaned;

  const firstClause = cleaned.split(/,\s+|[+·–—]/)[0].trim();
  if (firstClause.length >= 3 && firstClause.length <= 24) return firstClause;
  return `${firstClause.slice(0, 22).trim()}…`;
}

export function getCompactLimitPair(offer: Offer): { label: string; value: string } {
  const limits = offer.access.free_limits;
  const nonContextLimits = limits.filter((l) => !/^context\s*window$/i.test(l.name.trim()));
  const pool = nonContextLimits.length > 0 ? nonContextLimits : limits;

  const chosen =
    offer.classification.category === 'ai-ml'
      ? pool.find((l) => /rate\s*limit|requests|quota|neurons|local|tokens|credits|generations/i.test(l.name)) ??
        pool[0]
      : pool[0];

  if (!chosen) {
    return { label: 'Free limit', value: 'Varies' };
  }

  // Structured MCP "Use Case & Stack"
  if (/^use\s*case\s*&\s*stack$/i.test(chosen.name.trim()) && typeof chosen.value === 'string') {
    const parts = chosen.value.split('·').map((s) => s.trim()).filter(Boolean);
    const stack = parts[1] ?? parts[0] ?? 'Open source';
    return {
      label: 'Stack',
      value: stack.length <= 22 ? stack : `${stack.slice(0, 20).trim()}…`,
    };
  }

  // Structured API "Authentication & CORS"
  if (/^authentication\s*&\s*cors$/i.test(chosen.name.trim()) && typeof chosen.value === 'string') {
    const authMatch = chosen.value.match(/Auth:\s*([^·]+)/i);
    const rawAuth = (authMatch?.[1] ?? 'Open').trim();
    const cleanAuth =
      /^no$|^none$/i.test(rawAuth)
        ? 'No auth'
        : /^apikey$|^x-mashape-key$/i.test(rawAuth)
          ? 'API key'
          : rawAuth;
    return { label: 'Auth', value: cleanAuth };
  }

  // Structured MCP "MCP Transport & Auth"
  if (/transport\s*&\s*auth/i.test(chosen.name) && typeof chosen.value === 'string') {
    const shortAuth = chosen.value.replace(/No Auth Required/i, 'No auth').trim();
    return { label: 'Auth', value: shortAuth.length <= 22 ? shortAuth : `${shortAuth.slice(0, 20).trim()}…` };
  }

  return {
    label: shortenLimitLabel(chosen.name),
    value: shortenLimitValue(chosen.value, chosen.period),
  };
}

export function getSafeGoUrl(slug: string, officialUrl: string | null | undefined): string | null {
  if (!isSafeHttpsUrl(officialUrl)) return null;
  return `/go/${encodeURIComponent(slug)}`;
}
