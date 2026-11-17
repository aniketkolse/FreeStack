import crypto from 'node:crypto';
import net from 'node:net';
import type { Offer } from '../../types/resource';

export const SHORTENER_HOSTS = new Set([
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

export const ALLOWLISTED_PUNYCODE_HOSTS = new Set([
  'xn--shknhintanyt-gcb8w.org',
  'www.xn--shknhintanyt-gcb8w.org',
  'xn--80aesfpebagmfblc0a.xn--p1ai',
  'xn--d1acpjx3f.xn--p1ai',
]);

export const ALLOWLISTED_SHORTENER_DOC_URLS = new Set([
  'https://cutt.ly/api-documentation/cuttly-links-api',
  'https://tinyurl.com/app/dev',
]);

export const TRACKING_PARAM_REGEX =
  /^(?:utm_[a-z0-9_]+|ref|aff|affiliate|affiliate_id|partner|partner_id|click_id|fbclid|gclid|msclkid|mc_eid|yclid)$/i;

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const BIDI_AND_ZERO_WIDTH_REGEX = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS_REGEX, '').replace(BIDI_AND_ZERO_WIDTH_REGEX, '');
}

export function isIpLiteralOrPrivateHost(hostname: string): boolean {
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

  // Reject any IPv4 or IPv6 literal in external URLs
  if (net.isIP(clean) !== 0) {
    return true;
  }

  // Also catch octal/hex/decimal integer IPv4 encodings (e.g. 2130706433 or 0x7f000001 or 127.1)
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(clean)) {
    return true;
  }
  if (/^\d+(?:\.\d+){1,3}$/.test(clean)) {
    return true;
  }

  // Must have at least one dot and a valid alphabetic TLD
  const parts = clean.split('.');
  if (parts.length < 2) return true;
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) {
    return true;
  }

  return false;
}

export interface SafeUrlOptions {
  allowPunycode?: boolean;
  rejectTrackingParams?: boolean;
  maxLength?: number;
}

export function isSafeExternalHttpsUrl(
  rawUrl: string | null | undefined,
  options: SafeUrlOptions = {}
): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const maxLength = options.maxLength ?? 2048;
  if (rawUrl.length > maxLength) return false;

  // Reject raw whitespace or control characters anywhere in the URL string
  if (/[\s\u0000-\u001F\u007F]/.test(rawUrl)) return false;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;
  if (parsed.username !== '' || parsed.password !== '') return false;
  if (parsed.port !== '' && parsed.port !== '443') return false;

  const host = parsed.hostname.toLowerCase();
  if (isIpLiteralOrPrivateHost(host)) return false;
  if (SHORTENER_HOSTS.has(host) && !ALLOWLISTED_SHORTENER_DOC_URLS.has(parsed.toString())) {
    return false;
  }

  if (!options.allowPunycode && host.includes('xn--') && !ALLOWLISTED_PUNYCODE_HOSTS.has(host)) {
    return false;
  }

  if (options.rejectTrackingParams) {
    for (const key of parsed.searchParams.keys()) {
      if (TRACKING_PARAM_REGEX.test(key)) {
        return false;
      }
    }
  }

  return true;
}

export function getRegistrableDomainHint(hostname: string): string {
  const clean = hostname.toLowerCase().replace(/^www\./, '');
  const parts = clean.split('.');
  if (parts.length <= 2) return clean;
  return parts.slice(-2).join('.');
}

export function isSafeRedirectDestination(
  destinationUrl: string | null | undefined,
  offer: Offer
): boolean {
  if (!isSafeExternalHttpsUrl(destinationUrl)) return false;

  let destHost: string;
  try {
    destHost = new URL(destinationUrl!).hostname.toLowerCase();
  } catch {
    return false;
  }

  const allowedHosts = new Set<string>();
  const candidateUrls = [
    offer.links.official,
    offer.links.signup,
    offer.links.documentation,
    offer.links.pricing,
    ...offer.evidence.sources.map((s) => s.url),
  ].filter(Boolean) as string[];

  for (const candidate of candidateUrls) {
    try {
      const h = new URL(candidate).hostname.toLowerCase();
      allowedHosts.add(h);
      allowedHosts.add(getRegistrableDomainHint(h));
    } catch {
      // Ignore malformed candidate
    }
  }

  return (
    allowedHosts.has(destHost) ||
    allowedHosts.has(getRegistrableDomainHint(destHost))
  );
}

export function validateSiteUrl(
  rawSiteUrl: string | undefined,
  isProduction: boolean,
  strictSiteUrl = false
): string {
  const cleaned = (rawSiteUrl ?? '').trim().replace(/\/+$/, '');
  const candidate = cleaned === 'MY_APP_URL' ? '' : cleaned;

  if (!candidate) {
    if (isProduction && strictSiteUrl) {
      throw new Error(
        'FATAL: SITE_URL environment variable is required in production and must be a valid https:// origin.'
      );
    }
    return isProduction ? 'https://freestack.dev' : 'http://localhost:3000';
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    if (strictSiteUrl) {
      throw new Error(`FATAL: Invalid SITE_URL "${candidate}". Must be a valid origin URL.`);
    }
    return isProduction ? 'https://freestack.dev' : 'http://localhost:3000';
  }

  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error(`FATAL: SITE_URL must use https:// in production (got "${parsed.protocol}").`);
  }

  return parsed.origin;
}

export function hasPollutedQuery(
  query: Record<string, unknown>,
  rawUrl?: string
): boolean {
  if (rawUrl) {
    const qIdx = rawUrl.indexOf('?');
    if (qIdx !== -1) {
      const rawSearch = rawUrl.slice(qIdx + 1);
      // Reject bracket notation like q[a]=b or __proto__
      if (/\[|\]|%5b|%5d|__proto__|constructor|prototype/i.test(rawSearch)) {
        return true;
      }
      const seenKeys = new Set<string>();
      for (const pair of rawSearch.split('&')) {
        if (!pair) continue;
        const eqIdx = pair.indexOf('=');
        const key = decodeURIComponent(eqIdx === -1 ? pair : pair.slice(0, eqIdx));
        if (seenKeys.has(key)) {
          return true;
        }
        seenKeys.add(key);
      }
    }
  }

  for (const [key, val] of Object.entries(query)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (Array.isArray(val) || (val !== null && typeof val === 'object')) {
      return true;
    }
  }

  return false;
}

export function verifyBearerAdminToken(
  authorizationHeader: string | undefined,
  configuredAdminToken: string | undefined
): boolean {
  if (!configuredAdminToken || configuredAdminToken.trim().length < 32) {
    return false;
  }
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return false;
  }
  const provided = authorizationHeader.slice('Bearer '.length).trim();
  if (!provided) return false;

  const expectedHash = crypto.createHash('sha256').update(configuredAdminToken.trim(), 'utf8').digest();
  const providedHash = crypto.createHash('sha256').update(provided, 'utf8').digest();
  return crypto.timingSafeEqual(expectedHash, providedHash);
}

export function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Safely serializes an object into JSON-LD suitable for embedding inside <script type="application/ld+json">,
 * escaping <, >, &, U+2028, and U+2029 so no payload like "</script><img src=x onerror=alert(1)>" can break out.
 */
export function safeJsonLdSerialize(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
