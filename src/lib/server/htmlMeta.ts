import type { Category, Offer } from '../../types/resource.ts';
import {
  escapeHtmlAttr,
  escapeHtmlText,
  safeJsonLdSerialize,
} from './securityUtils.ts';

export interface RouteMetaResult {
  status: 200 | 404;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index, follow' | 'noindex, follow';
  jsonLd: Record<string, unknown> | null;
}

const STATIC_ROUTES: Record<string, { title: string; description: string; noindex?: boolean }> = {
  '/': {
    title: 'FreeStack — Free Developer Tools, AI Models, MCP & APIs',
    description:
      'Discover 7,800+ verified free AI models, MCP servers, APIs, cloud tiers, courses, and student packs with clear limits and payment card rules.',
  },
  '/explore': {
    title: 'Explore Free Developer Tools, AI & APIs — FreeStack',
    description:
      'Filter and compare 7,800+ verified free AI models, MCP servers, APIs, cloud hosting, databases, and dev tools by card rules and pricing model.',
  },
  '/search': {
    title: 'Search Free Developer Resources — FreeStack',
    description:
      'Search the FreeStack catalog of verified free AI models, MCP servers, APIs, cloud tiers, databases, courses, and student developer packs.',
    noindex: true,
  },
  '/categories': {
    title: 'All 11 Free Developer Tool Categories — FreeStack',
    description:
      'Browse all 11 verified categories in FreeStack, from AI models, MCP servers, and APIs to cloud hosting, databases, security, and student packs.',
  },
  '/learning': {
    title: 'Free Coding Courses, Books & Roadmaps — FreeStack',
    description:
      'Curated free computer science lectures, interactive web curriculums, technical e-books, interview practice, and roadmaps with zero paywalls.',
  },
  '/students': {
    title: 'Free Student Developer Packs & Credits — FreeStack',
    description:
      'Verified free cloud credits, pro IDEs, design tools, domains, and AI plans for students, clearly labeled by Student ID and .edu requirements.',
  },
  '/saved': {
    title: 'Saved Free Developer Stack — FreeStack',
    description:
      'Review your locally saved free developer tools, AI models, APIs, cloud tiers, and learning guides stored privately in your browser.',
    noindex: true,
  },
  '/about': {
    title: 'About FreeStack & Verification Policy — FreeStack',
    description:
      'Learn how FreeStack verifies 7,800+ free developer tools, usage quotas, payment card rules, and official HTTPS documentation sources.',
  },
  '/privacy': {
    title: 'Privacy Policy (GDPR, CCPA & DPDP) — FreeStack',
    description:
      'Read FreeStack privacy practices, local-first zero-account storage architecture, and data protection rights under GDPR, CCPA, and India DPDP.',
  },
  '/privacy-requests': {
    title: 'Privacy Requests & Data Controls — FreeStack',
    description:
      'Inspect, export, or erase local FreeStack browser preferences and saved bookmarks anytime with full local-first privacy controls.',
  },
  '/terms': {
    title: 'Terms of Service & Disclaimers — FreeStack',
    description:
      'Read FreeStack AGPL-3.0 terms of use, independent directory disclaimers, third-party trademark notices, and quota verification notes.',
  },
  '/design-system': {
    title: 'FreeStack UI Design System & Tokens — FreeStack',
    description:
      'Explore the color tokens, typography scale, accessible focus styles, and tactile card primitives powering the FreeStack directory.',
  },
};

function clampText(input: string, maxLen: number): string {
  const clean = input.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${base.replace(/[.,;:\-–—]+$/, '').trimEnd()}…`;
}

function buildClampedTitle(prefix: string, suffix: string, maxLen = 60): string {
  const full = `${prefix}${suffix}`;
  if (full.length <= maxLen) return full;
  const available = Math.max(12, maxLen - suffix.length);
  return `${clampText(prefix, available)}${suffix}`;
}

export function resolveRouteMeta(
  pathname: string,
  hasQueryParams: boolean,
  siteUrl: string,
  offerBySlug: Map<string, Offer>,
  categoryBySlug: Map<string, Category>
): RouteMetaResult {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (Object.prototype.hasOwnProperty.call(STATIC_ROUTES, normalizedPath)) {
    const spec = STATIC_ROUTES[normalizedPath];
    const shouldNoIndex = Boolean(spec.noindex) || (normalizedPath === '/explore' && hasQueryParams);
    return {
      status: 200,
      title: spec.title,
      description: spec.description,
      canonicalUrl: `${cleanSiteUrl}${normalizedPath}`,
      robots: shouldNoIndex ? 'noindex, follow' : 'index, follow',
      jsonLd:
        normalizedPath === '/'
          ? {
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: 'FreeStack',
                  url: `${cleanSiteUrl}/`,
                  description: spec.description,
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: `${cleanSiteUrl}/search?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  name: 'FreeStack',
                  url: `${cleanSiteUrl}/`,
                  logo: `${cleanSiteUrl}/favicon.svg`,
                },
              ],
            }
          : null,
    };
  }

  if (normalizedPath.startsWith('/category/')) {
    const slug = normalizedPath.slice('/category/'.length);
    if (/^[a-z0-9-]{1,80}$/.test(slug)) {
      const cat = Map.prototype.get.call(categoryBySlug, slug) as Category | undefined;
      if (cat) {
        const canonicalUrl = `${cleanSiteUrl}/category/${encodeURIComponent(cat.slug)}`;
        const categorySuffix =
          cat.name.length <= 16
            ? ' — Free Developer Tools | FreeStack'
            : ' — Free Tools | FreeStack';
        const title = buildClampedTitle(cat.name, categorySuffix, 60);
        const description = clampText(
          `${cat.description} Compare verified free ${cat.name.toLowerCase()} quotas, card rules, and official sources on FreeStack.`,
          156
        );
        return {
          status: 200,
          title,
          description,
          canonicalUrl,
          robots: hasQueryParams ? 'noindex, follow' : 'index, follow',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${cat.name} — FreeStack`,
            description,
            url: canonicalUrl,
          },
        };
      }
    }
  }

  if (normalizedPath.startsWith('/offer/')) {
    const slug = normalizedPath.slice('/offer/'.length);
    if (/^[a-z0-9-]{1,120}$/.test(slug)) {
      const offer = Map.prototype.get.call(offerBySlug, slug) as Offer | undefined;
      if (offer) {
        const canonicalUrl = `${cleanSiteUrl}/offer/${encodeURIComponent(offer.identity.slug)}`;
        const offerSuffix =
          offer.identity.name.length <= 12
            ? ' — Free Tier & Limits | FreeStack'
            : ' Free Limits | FreeStack';
        const title = buildClampedTitle(offer.identity.name, offerSuffix, 60);
        const rawDesc = offer.description.trim();
        const enrichedDesc =
          rawDesc.length < 75
            ? `${rawDesc.replace(/\.$/, '')}. Compare verified free limits, payment card rules, and official docs on FreeStack.`
            : rawDesc;
        const description = clampText(enrichedDesc, 156);
        return {
          status: 200,
          title,
          description,
          canonicalUrl,
          robots: hasQueryParams ? 'noindex, follow' : 'index, follow',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: offer.identity.name,
            applicationCategory: offer.classification.category,
            operatingSystem: 'Web, Cross-platform',
            description,
            url: canonicalUrl,
            author: {
              '@type': 'Organization',
              name: offer.identity.provider,
            },
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          },
        };
      }
    }
  }

  return {
    status: 404,
    title: 'Page Not Found (404) — FreeStack',
    description:
      'The requested page or resource could not be found in the FreeStack catalog of verified free developer tools and learning materials.',
    canonicalUrl: `${cleanSiteUrl}/`,
    robots: 'noindex, follow',
    jsonLd: null,
  };
}

export interface InjectHtmlMetaOptions {
  isHomeSsr?: boolean;
  ssrAsideHtml?: string;
}

export function injectHtmlMeta(
  rawHtml: string,
  meta: RouteMetaResult,
  ssrBodyHtml?: string,
  options?: InjectHtmlMetaOptions
): string {
  const safeTitle = escapeHtmlText(meta.title);
  const safeTitleAttr = escapeHtmlAttr(meta.title);
  const safeDescAttr = escapeHtmlAttr(meta.description);
  const safeCanonicalAttr = escapeHtmlAttr(meta.canonicalUrl);
  const safeRobotsAttr = escapeHtmlAttr(meta.robots);
  const canonicalOrigin = new URL(meta.canonicalUrl).origin;
  const safeOgImageAttr = escapeHtmlAttr(`${canonicalOrigin}/og-image.png`);

  let html = rawHtml
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="description" content="${safeDescAttr}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:title" content="${safeTitleAttr}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:description" content="${safeDescAttr}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:image" content="${safeOgImageAttr}" />`
    )
    .replace(
      /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:image:alt" content="${safeTitleAttr}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:title" content="${safeTitleAttr}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:description" content="${safeDescAttr}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:image" content="${safeOgImageAttr}" />`
    )
    .replace(
      /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:image:alt" content="${safeTitleAttr}" />`
    );

  const extraTags = [
    `<link rel="canonical" href="${safeCanonicalAttr}" />`,
    `<meta property="og:url" content="${safeCanonicalAttr}" />`,
    `<meta name="robots" content="${safeRobotsAttr}" />`,
  ];

  if (!/property="og:site_name"/i.test(html)) {
    extraTags.push(`<meta property="og:site_name" content="FreeStack" />`);
  }
  if (!/property="og:image"/i.test(html)) {
    extraTags.push(`<meta property="og:image" content="${safeOgImageAttr}" />`);
    extraTags.push(`<meta property="og:image:width" content="1200" />`);
    extraTags.push(`<meta property="og:image:height" content="630" />`);
    extraTags.push(`<meta property="og:image:alt" content="${safeTitleAttr}" />`);
  }
  if (!/name="twitter:card"/i.test(html)) {
    extraTags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  }
  if (!/name="twitter:title"/i.test(html)) {
    extraTags.push(`<meta name="twitter:title" content="${safeTitleAttr}" />`);
  }
  if (!/name="twitter:description"/i.test(html)) {
    extraTags.push(`<meta name="twitter:description" content="${safeDescAttr}" />`);
  }
  if (!/name="twitter:image"/i.test(html)) {
    extraTags.push(`<meta name="twitter:image" content="${safeOgImageAttr}" />`);
    extraTags.push(`<meta name="twitter:image:alt" content="${safeTitleAttr}" />`);
  }

  if (meta.jsonLd) {
    extraTags.push(
      `<script type="application/ld+json">${safeJsonLdSerialize(meta.jsonLd)}</script>`
    );
  }

  html = html.replace('</head>', () => `  ${extraTags.join('\n    ')}\n  </head>`);

  if (ssrBodyHtml) {
    const rootReplacement = options?.isHomeSsr
      ? `<div id="root" data-freestack-home-ssr="true">${ssrBodyHtml}</div>${options.ssrAsideHtml ?? ''}`
      : `<div id="root">${ssrBodyHtml}</div>`;
    html = html.replace('<div id="root"></div>', () => rootReplacement);
  }

  return html;
}
