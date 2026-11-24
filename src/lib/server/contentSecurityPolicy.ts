import crypto from 'node:crypto';

/**
 * Builds the Content-Security-Policy header used by both the production app and the
 * Vite dev server.
 *
 * Inline styles and scripts are allowed through SHA-256 hashes rather than
 * 'unsafe-inline'. The production build inlines the compiled stylesheet and every
 * page carries an inline JSON-LD block, so each HTML response advertises the hashes
 * of the exact inline blocks it contains. Hashes are stable for a rendered page,
 * which keeps the pre-rendered HTML cache and its precompressed buffers valid.
 */

export interface InlineCspHashes {
  scriptHashes: string[];
  styleHashes: string[];
}

export interface ContentSecurityPolicyOptions {
  isProduction: boolean;
  denyFraming: boolean;
  scriptHashes?: string[];
  styleHashes?: string[];
}

const INLINE_SCRIPT_RE = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const INLINE_STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

function hashInlineContent(content: string): string {
  const digest = crypto.createHash('sha256').update(content, 'utf8').digest('base64');
  return `'sha256-${digest}'`;
}

export function extractInlineCspHashes(html: string): InlineCspHashes {
  const scriptHashes = new Set<string>();
  const styleHashes = new Set<string>();

  for (const match of html.matchAll(INLINE_SCRIPT_RE)) {
    if (match[1].length > 0) scriptHashes.add(hashInlineContent(match[1]));
  }
  for (const match of html.matchAll(INLINE_STYLE_RE)) {
    if (match[1].length > 0) styleHashes.add(hashInlineContent(match[1]));
  }

  return { scriptHashes: [...scriptHashes], styleHashes: [...styleHashes] };
}

export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions): string {
  const scriptSrc = ["'self'", ...(options.scriptHashes ?? [])];
  const styleSrc = ["'self'", ...(options.styleHashes ?? [])];

  if (!options.isProduction) {
    // Vite injects the React refresh preamble and runtime <style> tags during development.
    scriptSrc.push("'unsafe-inline'");
    styleSrc.push("'unsafe-inline'");
  }

  const connectSrc = options.isProduction ? "'self'" : "'self' ws: wss:";

  // frame-ancestors intentionally lists exact origins only. Wildcard subdomains
  // (for example https://*.run.app) would allow any tenant of that domain to frame
  // the app and are flagged by security scanners as a CSP wildcard weakness.
  const frameAncestors = options.denyFraming
    ? "'none'"
    : "'self' https://aistudio.google.com";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    // React sets layout values through the style attribute; CSP3 keeps that working
    // without re-enabling unsafe inline <style> blocks.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    ...(options.isProduction ? ['upgrade-insecure-requests'] : []),
  ];

  return directives.join(';');
}
