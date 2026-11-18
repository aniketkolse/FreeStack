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
    title: 'FreeStack — Verified Directory of Free Developer Tools, AI Models, MCP Servers & APIs',
    description:
      'Discover 7,800+ free developer tools, AI models, MCP servers, public APIs, cloud tiers, learning materials, and student benefits with real quotas, card rules, and official HTTPS sources.',
  },
  '/explore': {
    title: 'Explore Free Developer Resources — FreeStack',
    description:
      'Filter and compare free AI models, MCP servers, APIs, cloud hosting, databases, and developer tools by payment card requirement and pricing model.',
  },
  '/search': {
    title: 'Search Results — FreeStack',
    description: 'Search the FreeStack catalog of verified free developer resources.',
    noindex: true,
  },
  '/categories': {
    title: 'All Categories — FreeStack',
    description:
      'Browse all 11 developer categories in FreeStack, from AI Models and MCP Servers to Databases, Security, and Student Benefits.',
  },
  '/learning': {
    title: 'Free Learning & Study Materials — FreeStack',
    description:
      'Curated free computer science courses, interactive tutorials, technical books, and engineering roadmaps.',
  },
  '/students': {
    title: 'Verified Student & Academic Developer Benefits — FreeStack',
    description:
      'Free cloud credits, professional IDEs, design tools, and AI access available with a student ID or academic email.',
  },
  '/saved': {
    title: 'Saved Developer Stack — FreeStack',
    description: 'Your locally saved free developer tools and resources.',
    noindex: true,
  },
  '/about': {
    title: 'About & Verification Policy — FreeStack',
    description:
      'How FreeStack verifies free developer resources, payment card rules, and official HTTPS source evidence.',
  },
  '/privacy': {
    title: 'Privacy Policy — FreeStack',
    description:
      'FreeStack privacy practices, local-first storage architecture, and data protection rights.',
  },
  '/privacy-requests': {
    title: 'Privacy Requests & Local Data Inspector — FreeStack',
    description:
      'Inspect or erase local browser data and submit privacy inquiries.',
  },
  '/terms': {
    title: 'Terms of Service & Disclaimers — FreeStack',
    description:
      'Terms of use, third-party trademark fair-use notices, and verification disclaimers for FreeStack.',
  },
  '/design-system': {
    title: 'Design System — FreeStack',
    description: 'Typography, color tokens, and tactile UI primitives powering FreeStack.',
  },
};

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
              '@type': 'WebSite',
              name: 'FreeStack',
              url: `${cleanSiteUrl}/`,
              description: spec.description,
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
        return {
          status: 200,
          title: `${cat.name} — Free Developer Resources | FreeStack`,
          description: cat.description,
          canonicalUrl,
          robots: hasQueryParams ? 'noindex, follow' : 'index, follow',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${cat.name} — FreeStack`,
            description: cat.description,
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
        return {
          status: 200,
          title: `${offer.identity.name} by ${offer.identity.provider} — Free Limits & Card Rules | FreeStack`,
          description: offer.description.slice(0, 260),
          canonicalUrl,
          robots: hasQueryParams ? 'noindex, follow' : 'index, follow',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: offer.identity.name,
            applicationCategory: offer.classification.category,
            operatingSystem: 'Web, Cross-platform',
            description: offer.description,
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
    description: 'The requested page or resource could not be found in the FreeStack directory.',
    canonicalUrl: `${cleanSiteUrl}/`,
    robots: 'noindex, follow',
    jsonLd: null,
  };
}

export function injectHtmlMeta(rawHtml: string, meta: RouteMetaResult): string {
  const safeTitle = escapeHtmlText(meta.title);
  const safeTitleAttr = escapeHtmlAttr(meta.title);
  const safeDescAttr = escapeHtmlAttr(meta.description);
  const safeCanonicalAttr = escapeHtmlAttr(meta.canonicalUrl);
  const safeRobotsAttr = escapeHtmlAttr(meta.robots);

  let html = rawHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDescAttr}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safeTitleAttr}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDescAttr}" />`
    );

  const extraTags = [
    `<link rel="canonical" href="${safeCanonicalAttr}" />`,
    `<meta property="og:url" content="${safeCanonicalAttr}" />`,
    `<meta name="robots" content="${safeRobotsAttr}" />`,
  ];

  if (meta.jsonLd) {
    extraTags.push(
      `<script type="application/ld+json">${safeJsonLdSerialize(meta.jsonLd)}</script>`
    );
  }

  html = html.replace('</head>', `  ${extraTags.join('\n    ')}\n  </head>`);
  return html;
}
