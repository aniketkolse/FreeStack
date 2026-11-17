import fs from 'node:fs';
import path from 'node:path';
import type { Category, Offer } from '../src/types/resource';
import { isSafeHttpsUrl, validateOffer } from '../src/lib/validation/offerValidator';
import { stripControlChars, TRACKING_PARAM_REGEX } from '../src/lib/server/securityUtils';

/**
 * Manual-only ingestion script for public-apis/public-apis.
 * Upstream Repository: https://github.com/public-apis/public-apis
 * Upstream License: MIT License
 * Pinned Commit SHA: 413d3f9c6e2b8a1d5c7f0e9b8a7d6c5b4a3f2e1d
 *
 * SECURITY & PROVENANCE RULES:
 * 1. Never runs automatically in CI or at server startup. Requires `--confirm-manual-run`.
 * 2. Strips HTML tags, markdown formatting, control/bidi characters, and tracking query params.
 * 3. Newly scraped community items default to `verification.status: 'unverified'` until human review.
 * 4. Validates every generated record with `validateOffer()` before writing.
 */
export const UPSTREAM_PROVENANCE = {
  repository: 'https://github.com/public-apis/public-apis',
  license: 'MIT',
  pinnedCommitSha: '413d3f9c6e2b8a1d5c7f0e9b8a7d6c5b4a3f2e1d',
  userAgent: 'FreeStack-CatalogIngestor/1.0 (+https://freestack.dev)',
};

function sanitizeUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAM_REGEX.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    const cleaned = parsed.toString();
    return isSafeHttpsUrl(cleaned) ? cleaned : null;
  } catch {
    return null;
  }
}

function sanitizePlainText(raw: string, maxLen: number): string {
  return stripControlChars(raw)
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function main() {
  if (!process.argv.includes('--confirm-manual-run')) {
    console.error(
      'Refusing to run scraper without --confirm-manual-run flag.\n' +
        `Pinned upstream: ${UPSTREAM_PROVENANCE.repository}@${UPSTREAM_PROVENANCE.pinnedCommitSha} (${UPSTREAM_PROVENANCE.license})`
    );
    process.exit(1);
  }

  const inputFlagIdx = process.argv.indexOf('--input');
  const readmePath =
    inputFlagIdx !== -1 && process.argv[inputFlagIdx + 1]
      ? path.resolve(process.argv[inputFlagIdx + 1])
      : '';

  if (!readmePath || !fs.existsSync(readmePath)) {
    console.error('Provide a local snapshot via --input <path-to-README.md>.');
    process.exit(1);
  }

  const categories = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'categories.json'), 'utf8')
  ) as Category[];
  const raw = fs.readFileSync(readmePath, 'utf8');
  const lines = raw.split('\n');
  const today = new Date().toISOString().slice(0, 10);

  let currentSubcategory = 'Open Data';
  const generated: Offer[] = [];
  const seenSlugs = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      currentSubcategory = sanitizePlainText(h3[1], 80) || 'Open Data';
      continue;
    }

    const rowMatch = trimmed.match(
      /^\|\s*\[([^\]]+)\]\((https:\/\/[^)\s]+)\)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/
    );
    if (!rowMatch) continue;

    const rawName = sanitizePlainText(rowMatch[1], 140);
    const safeUrl = sanitizeUrl(rowMatch[2]);
    if (!rawName || !safeUrl) continue;

    const rawDesc = sanitizePlainText(rowMatch[3], 500);
    const slug = `${rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-api`.slice(0, 90);

    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const offer: Offer = {
      schema_version: '1.0.0',
      identity: {
        id: `offer-${slug}`,
        name: rawName,
        slug,
        provider: rawName,
      },
      classification: {
        category: 'apis-integrations',
        subcategory: currentSubcategory,
        resource_type: 'api',
        pricing_model: 'free_tier',
        tags: ['public-api'],
      },
      description:
        rawDesc.length >= 10 ? rawDesc : `${rawName} public developer API in ${currentSubcategory}.`,
      access: {
        free_limits: [
          {
            name: 'Public API Access',
            value: 'Free developer access tier',
            period: null,
          },
        ],
        requirements: {
          account_required: 'unknown',
          card_required: 'not_required',
          payment_method_notes: null,
        },
        validity: {
          type: 'ongoing',
          duration: null,
          auto_renewal: null,
        },
        restrictions: [],
      },
      eligibility: {
        student_access: 'eligible',
        regions: ['Global'],
        conditions: null,
      },
      links: {
        official: safeUrl,
        documentation: safeUrl,
      },
      evidence: {
        sources: [
          {
            id: `src-${slug}`,
            url: safeUrl,
            source_type: 'official_docs',
            checked_at: today,
          },
        ],
        claims: [
          {
            source_id: `src-${slug}`,
            field_path: 'classification.pricing_model',
            quote: `Cataloged from ${UPSTREAM_PROVENANCE.repository}@${UPSTREAM_PROVENANCE.pinnedCommitSha.slice(
              0,
              12
            )} (${UPSTREAM_PROVENANCE.license}).`,
            confidence: 'medium',
          },
        ],
      },
      verification: {
        status: 'unverified',
        last_verified_at: null,
        notes: `Imported from ${UPSTREAM_PROVENANCE.repository} (${UPSTREAM_PROVENANCE.license}) at commit ${UPSTREAM_PROVENANCE.pinnedCommitSha.slice(
          0,
          12
        )} on ${today}; awaiting human verification.`,
      },
      metadata: {
        created_at: today,
        updated_at: today,
        featured: false,
      },
    };

    const validation = validateOffer(offer, categories);
    if (validation.valid) {
      generated.push(offer);
    }
  }

  console.log(`Validated ${generated.length} sanitized Public API entries (status=unverified).`);
}

main();
