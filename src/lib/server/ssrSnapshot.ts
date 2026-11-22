import type { Category, Offer } from '../../types/resource.ts';
import { escapeHtmlAttr, escapeHtmlText } from './securityUtils.ts';

export interface SsrSnapshotContext {
  pathname: string;
  categories: Category[];
  offers: Offer[];
  offerBySlug: Map<string, Offer>;
  categoryBySlug: Map<string, Category>;
  categoryCounts?: Record<string, number>;
}

function renderNavLinks(categories: Category[]): string {
  const primary = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore Free Directory' },
    { href: '/categories', label: 'All Categories' },
    { href: '/learning', label: 'Free Learning Hub' },
    { href: '/students', label: 'Student Benefits' },
    { href: '/about', label: 'About & Verification Policy' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ];

  const primaryHtml = primary
    .map((item) => `<a href="${item.href}">${escapeHtmlText(item.label)}</a>`)
    .join(' ');

  const catHtml = categories
    .map(
      (cat) =>
        `<a href="/category/${encodeURIComponent(cat.slug)}">${escapeHtmlText(cat.name)}</a>`
    )
    .join(' ');

  return `<header><a href="/" aria-label="FreeStack Home"><img src="/favicon.svg" alt="FreeStack verified free developer directory logo" width="32" height="32" /><span>FreeStack</span></a><nav aria-label="Primary Navigation">${primaryHtml}</nav><nav aria-label="Categories">${catHtml}</nav></header>`;
}

function renderFooter(): string {
  return `<footer><p>FreeStack is an independent, open-source directory (AGPL-3.0) cataloging verified free developer tools, AI models, MCP servers, public APIs, cloud tiers, learning materials, and student packs with transparent quotas, payment card requirements, and official source links.</p><nav aria-label="Footer Links"><a href="/explore">Explore All Resources</a> <a href="/categories">Browse Categories</a> <a href="/learning">Learning Hub</a> <a href="/students">Student Benefits</a> <a href="/about">Trust &amp; Verification Policy</a> <a href="/privacy">Privacy Policy</a> <a href="/privacy-requests">Privacy Requests</a> <a href="/terms">Terms of Service</a></nav></footer>`;
}

function renderOfferSummaryList(items: Offer[]): string {
  if (items.length === 0) return '';
  const listItems = items
    .map((offer) => {
      const slug = encodeURIComponent(offer.identity.slug);
      const name = escapeHtmlText(offer.identity.name);
      const provider = escapeHtmlText(offer.identity.provider);
      const desc = escapeHtmlText(offer.description.slice(0, 220));
      const firstLimit = offer.access.free_limits[0];
      const limitText = firstLimit
        ? `${escapeHtmlText(firstLimit.name)}: ${escapeHtmlText(String(firstLimit.value ?? 'Free'))}${
            firstLimit.period ? ` (${escapeHtmlText(firstLimit.period)})` : ''
          }`
        : 'Free access tier';
      return `<li><article><h3><a href="/offer/${slug}">${name}</a></h3><p>Provided by ${provider}. ${desc} Free allowance: ${limitText}.</p></article></li>`;
    })
    .join('');
  return `<ul>${listItems}</ul>`;
}

function renderHomeSnapshot(ctx: SsrSnapshotContext): string {
  const { categories, offers, categoryCounts } = ctx;
  const totalCount = offers.length.toLocaleString('en-US');

  const categoryItems = categories
    .map((cat) => {
      const count = categoryCounts?.[cat.slug] ?? 0;
      return `<li><h3><a href="/category/${encodeURIComponent(cat.slug)}">${escapeHtmlText(cat.name)} (${count} verified offers)</a></h3><p>${escapeHtmlText(cat.description)}</p></li>`;
    })
    .join('');

  const learningHighlights = offers
    .filter((o) => o.classification.category === 'learning')
    .slice(0, 4);

  const featuredTools = offers
    .filter((o) => o.metadata.featured && o.classification.category !== 'learning')
    .slice(0, 8);

  return [
    `<main>`,
    `<h1>Find more. Spend less. Build anything.</h1>`,
    `<p>FreeStack is a verified, login-free directory of ${totalCount} free developer resources across ${categories.length} stack categories. Discover free AI models, Model Context Protocol (MCP) servers, public REST and GraphQL APIs, frontend and design tools, cloud hosting credits, serverless databases, developer tooling, security utilities, productivity apps, open computer science courses, and student developer packs—every single listing backed by cited official documentation, real free-tier quotas, and clear payment card rules.</p>`,
    `<p><strong>Catalog Freshness:</strong> Updated continuously and last audited November 2026 directly from official HTTPS pricing pages and developer documentation.</p>`,
    `<section><h2>Popular Categories</h2><p>Browse verified free developer tools, infrastructure limits, and learning resources organized by technology stack so you can assemble a complete production workflow for zero dollars.</p><ul>${categoryItems}</ul></section>`,
    `<section><h2>Learning Highlights</h2><p>Build software engineering fundamentals without paywalls using full university lecture series, interactive web development curriculums, developer roadmaps, and open-access technical books.</p>${renderOfferSummaryList(learningHighlights)}</section>`,
    `<section><h2>Recently Verified &amp; Featured Resources</h2><p>Each resource listed on FreeStack is checked against official provider pricing pages and developer documentation so you know upfront whether a credit card is required, which usage quotas reset monthly or daily, and whether free access is permanent, open source, or time-limited.</p>${renderOfferSummaryList(featuredTools)}</section>`,
    `<section><h2>Trust Signals &amp; Verification Methodology</h2><ul><li><strong>Primary Official Documentation:</strong> Every verified listing links directly to official HTTPS pricing or documentation pages with timestamped verification dates.</li><li><strong>No Fake Permanent Freebies:</strong> Temporary trials and expiring credits are clearly separated from permanently free developer tiers and open-source licenses.</li><li><strong>Explicit Card &amp; Student Rules:</strong> Unknown card requirements remain labeled unknown rather than guessed, and academic .edu rules are highlighted upfront.</li><li><strong>Zero Login &amp; Open Source (AGPL-3.0):</strong> Local-first bookmarks stay in your browser with no account required. Read our <a href="/about">Trust &amp; Verification Policy</a> and <a href="/privacy">Privacy Policy</a>.</li></ul></section>`,
    `<section><h2>Next Steps to Build Your $0 Stack</h2><p>Ready to assemble a production stack or study track? <a href="/explore">Explore all ${totalCount} verified free resources</a>, <a href="/categories">compare all ${categories.length} developer categories</a>, <a href="/learning">start a free computer science course</a>, or <a href="/students">check eligible student developer packs</a>.</p></section>`,
    `</main>`,
  ].join('');
}

function renderCategorySnapshot(cat: Category, ctx: SsrSnapshotContext): string {
  const catOffers = ctx.offers.filter((o) => o.classification.category === cat.slug);
  const topOffers = catOffers.slice(0, 12);
  const subcatList = cat.subcategories
    .slice(0, 12)
    .map((s) => escapeHtmlText(s.name))
    .join(', ');

  return [
    `<main>`,
    `<h1>${escapeHtmlText(cat.name)}</h1>`,
    `<p>${escapeHtmlText(cat.description)} Explore ${catOffers.length.toLocaleString('en-US')} verified free ${escapeHtmlText(cat.name.toLowerCase())} resources on FreeStack with clear free-tier limits, credit card rules, eligibility details, and direct official links.</p>`,
    subcatList
      ? `<section><h2>Covered Subcategories</h2><p>Browse free offerings across ${subcatList}. Every listing documents real usage quotas, regional availability, and verification status directly from official provider documentation.</p></section>`
      : '',
    `<section><h2>Top Verified ${escapeHtmlText(cat.name)} Offers</h2>${renderOfferSummaryList(topOffers)}</section>`,
    `<section><h2>Compare Limits Without Hidden Trials</h2><p>FreeStack distinguishes permanently free developer tiers and open-source tools from temporary trials and promotional credits. Use the filters on this page to narrow down no-card options, open-source alternatives, and student-eligible perks across the entire ${escapeHtmlText(cat.name)} catalog.</p></section>`,
    `</main>`,
  ].join('');
}

function renderOfferSnapshot(offer: Offer, ctx: SsrSnapshotContext): string {
  const cat = ctx.categoryBySlug.get(offer.classification.category);
  const related = ctx.offers
    .filter(
      (o) =>
        o.classification.category === offer.classification.category &&
        o.identity.slug !== offer.identity.slug
    )
    .slice(0, 6);

  const limitsHtml = offer.access.free_limits
    .map(
      (lim) =>
        `<li><strong>${escapeHtmlText(lim.name)}:</strong> ${escapeHtmlText(
          String(lim.value ?? 'Free')
        )}${lim.period ? ` (${escapeHtmlText(lim.period)})` : ''}</li>`
    )
    .join('');

  const restrictionsHtml = offer.access.restrictions
    .map((r) => `<li>${escapeHtmlText(r)}</li>`)
    .join('');

  const officialHref = escapeHtmlAttr(offer.links.official);
  const verifiedSuffix = offer.verification.last_verified_at
    ? ` (last verified ${escapeHtmlText(offer.verification.last_verified_at)})`
    : '';

  return [
    `<main>`,
    `<h1>${escapeHtmlText(offer.identity.name)}</h1>`,
    `<p>${escapeHtmlText(offer.description)}</p>`,
    `<section><h2>Free Tier Summary &amp; Rules</h2><p>Provider: ${escapeHtmlText(offer.identity.provider)}. Category: ${
      cat
        ? `<a href="/category/${encodeURIComponent(cat.slug)}">${escapeHtmlText(cat.name)}</a>`
        : escapeHtmlText(offer.classification.category)
    } (${escapeHtmlText(offer.classification.subcategory)}). Pricing model: ${escapeHtmlText(
      offer.classification.pricing_model.replace(/_/g, ' ')
    )}. Payment card requirement: ${escapeHtmlText(
      offer.access.requirements.card_required.replace(/_/g, ' ')
    )}. Verification status: ${escapeHtmlText(offer.verification.status)}${verifiedSuffix}.</p>${limitsHtml ? `<ul>${limitsHtml}</ul>` : ''}${
      restrictionsHtml ? `<h3>Key Restrictions &amp; Notes</h3><ul>${restrictionsHtml}</ul>` : ''
    }<p>Official website: <a href="${officialHref}" rel="noopener noreferrer">${escapeHtmlText(
      offer.identity.provider
    )}</a>.</p></section>`,
    related.length > 0
      ? `<section><h2>Related Free ${escapeHtmlText(cat?.name ?? 'Developer')} Alternatives</h2><p>Compare similar verified free tools, APIs, and tiers in the same category on FreeStack to find the best quota and card-free option for your stack.</p>${renderOfferSummaryList(related)}</section>`
      : '',
    `</main>`,
  ].join('');
}

function renderStaticRouteSnapshot(normalizedPath: string, ctx: SsrSnapshotContext): string {
  const { categories, offers } = ctx;
  const totalCount = offers.length.toLocaleString('en-US');

  if (normalizedPath === '/explore') {
    const sample = offers.slice(0, 12);
    return `<main><h1>Explore Free Developer Resources</h1><p>Filter and compare ${totalCount} verified free AI models, MCP servers, public APIs, cloud hosting tiers, serverless databases, developer tools, security utilities, courses, and student packs. Narrow results by payment card rule, pricing model, verification status, or category without creating an account.</p><section><h2>Featured Catalog Listings</h2>${renderOfferSummaryList(sample)}</section></main>`;
  }

  if (normalizedPath === '/categories') {
    const list = categories
      .map((cat) => {
        const count = ctx.categoryCounts?.[cat.slug] ?? 0;
        const subNames = cat.subcategories
          .slice(0, 8)
          .map((s) => escapeHtmlText(s.name))
          .join(', ');
        return `<li><h2><a href="/category/${encodeURIComponent(cat.slug)}">${escapeHtmlText(cat.name)} (${count.toLocaleString('en-US')} resources)</a></h2><p>${escapeHtmlText(cat.description)}${subNames ? ` Covered subcategories include ${subNames}.` : ''}</p></li>`;
      })
      .join('');
    return `<main><h1>All ${categories.length} Free Resource Categories</h1><p>Browse the complete FreeStack taxonomy spanning ${totalCount} verified free developer tools, public REST and GraphQL APIs, AI inference models, Model Context Protocol (MCP) servers, cloud hosting credits, serverless databases, frontend design tools, open computer science learning materials, and student developer benefits. Every category organizes tools by exact pricing model, payment card requirements, and official source documentation so engineers and students can compare free tiers transparently.</p><section><h2>Complete Directory Taxonomy</h2><ul>${list}</ul></section><section><h2>How FreeStack Categorizes Free Tiers</h2><p>Each listing is audited against primary provider pricing pages and assigned to its primary stack category and specialized subcategory. Use any category hub above to filter instantly by no-credit-card options, permanently free quotas, open-source licenses, or academic eligibility.</p></section></main>`;
  }

  if (normalizedPath === '/learning') {
    const learningOffers = offers.filter((o) => o.classification.category === 'learning').slice(0, 12);
    return `<main><h1>Free Learning &amp; Study Materials</h1><p>Curated free computer science courses, interactive tutorials, open-access engineering books, coding practice platforms, and structured career roadmaps with zero paywalls. Filter by format, difficulty level, language, and topic.</p><section><h2>Top Free Courses, Books &amp; Roadmaps</h2>${renderOfferSummaryList(learningOffers)}</section></main>`;
  }

  if (normalizedPath === '/students') {
    const studentOffers = offers
      .filter((o) => o.classification.category === 'student-benefits')
      .slice(0, 12);
    return `<main><h1>Student Benefits &amp; Developer Packs</h1><p>Verified free cloud credits, professional IDEs, design suites, domain names, and AI coding tools available to students. Every listing clearly labels whether a Student ID or academic .edu email is required versus open student-friendly free tiers.</p><section><h2>Popular Student Developer Perks</h2>${renderOfferSummaryList(studentOffers)}</section></main>`;
  }

  if (normalizedPath === '/about') {
    return `<main><h1>About FreeStack &amp; Verification Policy</h1><p>FreeStack is a public, open-source, login-free directory built on one straightforward principle: make free digital resources easier to discover, compare, and trust. Across ${totalCount} verified records spanning ${categories.length} developer stack categories, FreeStack documents exact free-tier quotas, payment card requirements, student eligibility, regional constraints, and expiry terms backed directly by official provider pricing pages and developer documentation.</p><section><h2>Core Verification Principles</h2><p>No fake permanent freebies: temporary trials and promotional cloud credits are never disguised as permanently free tiers. Unknown stays unknown: whenever official provider documentation leaves a credit card requirement or usage cap ambiguous, FreeStack records unknown explicitly instead of guessing. Primary sources only: every record links directly to HTTPS provider documentation and records its last verification date so teams can audit current terms before adopting a service.</p></section><section><h2>Verification Status Definitions</h2><ul><li><strong>Verified:</strong> Checked directly against the official provider pricing page or documentation with clear quota, pricing model, and payment card metadata.</li><li><strong>Partially Verified:</strong> Core free access is confirmed from official sources, while one or more secondary quota or eligibility details remain under review.</li><li><strong>Unverified:</strong> Cataloged from trusted public developer indexes awaiting a manual primary-source check of limits and card rules.</li><li><strong>Changed or Expired:</strong> Flagged when a provider reduces, retires, or alters its free tier so developers are not surprised during onboarding.</li></ul></section><section><h2>Open-Source &amp; Account-Free Architecture</h2><p>FreeStack requires zero account registration, stores bookmarks privately in your browser, and ships with full local-first privacy controls. Explore our full catalog of free AI models, MCP servers, APIs, cloud hosting tiers, databases, learning courses, and student packs using the navigation links above.</p></section></main>`;
  }

  if (normalizedPath === '/privacy') {
    return `<main><h1>Privacy Policy</h1><p>FreeStack is engineered as a local-first, account-free developer directory that minimizes data collection by design and aligns with the European Union General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA and CPRA), and India Digital Personal Data Protection Act (DPDP). You can search, filter, compare, and save free developer tools without creating an account, providing an email address, or accepting cross-site advertising cookies.</p><section><h2>What Stays Strictly on Your Device</h2><p>Your saved developer stack bookmarks, recent filters, and interface preferences are stored exclusively in your browser local storage. FreeStack does not upload your saved bookmarks to remote user profiles, does not sell personal information, and does not run behavioral ad trackers or third-party data brokers.</p></section><section><h2>Server &amp; Operational Logging</h2><p>When you visit FreeStack or query catalog endpoints, standard web server security controls process minimal transient technical metadata such as request paths and rate-limiting counters solely to protect uptime, prevent abuse, and serve accurate catalog responses. Outbound links open official third-party provider websites, which operate under their own independent privacy policies.</p></section><section><h2>Your Data Rights &amp; Self-Service Controls</h2><p>Under GDPR, CCPA/CPRA, and India DPDP, you have the right to inspect, export, and erase your local data at any time. Visit the <a href="/privacy-requests">Privacy Requests &amp; Local Data Controls</a> page to download a structured copy of your locally saved FreeStack state or permanently clear it with one click.</p></section></main>`;
  }

  if (normalizedPath === '/privacy-requests') {
    return `<main><h1>Privacy Requests &amp; Local Data Controls</h1><p>FreeStack operates without user accounts, cloud profile syncing, or behavioral tracking cookies, which means your saved tool bookmarks and directory preferences reside directly inside your own web browser. This self-service privacy portal lets you exercise your data access, portability, and deletion rights immediately without waiting for manual ticket review or identity verification emails.</p><section><h2>Inspect, Export &amp; Erase Local State</h2><p>From this page you can inspect every local storage key created by FreeStack, review the exact list of bookmarked developer tools and saved filter preferences stored on your device, export a complete JSON archive of your saved free developer stack for portability or backup across browsers, or permanently erase all locally stored bookmarks and preferences from your browser in a single step.</p></section><section><h2>Regulatory Alignment (GDPR, CCPA &amp; India DPDP)</h2><p>Our local-first architecture supports data minimization, purpose limitation, storage limitation, and transparent user control across global privacy frameworks including the European Union General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA and CPRA), and the India Digital Personal Data Protection Act (DPDP). Because FreeStack never collects passwords, payment details, or cross-site tracking identifiers, clearing local browser storage removes all client-side state immediately. Review our full <a href="/privacy">Privacy Policy</a>, <a href="/about">Verification Policy</a>, and <a href="/terms">Terms of Service</a> for complete details on how FreeStack handles operational security and outbound third-party provider links.</p></section></main>`;
  }

  if (normalizedPath === '/terms') {
    return `<main><h1>Terms of Service &amp; Disclaimers</h1><p>FreeStack is an independent, community-oriented informational directory released under the GNU Affero General Public License v3.0 (AGPL-3.0). By browsing, searching, or using FreeStack, you acknowledge that all listed free tiers, API quotas, AI model limits, cloud credits, student developer packs, and open learning platforms are provided by independent third-party organizations that are not affiliated with, sponsored by, or endorsed by FreeStack.</p><section><h2>Accuracy of Free Tiers &amp; Pricing Changes</h2><p>Technology providers frequently update usage quotas, rate limits, regional eligibility, credit card verification rules, and free-tier availability without advance notice. Although FreeStack verifies offers against official documentation and records verification timestamps and evidence links, you should always review the provider's official pricing page and terms of service before signing up, deploying production workloads, or entering billing credentials.</p></section><section><h2>Intellectual Property, Liability &amp; Third-Party Trademarks</h2><p>All product names, company logos, and trademarks displayed in the directory remain the property of their respective owners and are used strictly for factual identification and comparison. FreeStack is provided on an as-is and as-available basis without warranties of uninterrupted availability, merchantability, or commercial fitness for a particular purpose. Under no circumstances is FreeStack liable for third-party billing charges, quota changes, or service interruptions. Review our <a href="/about">Verification Policy</a>, <a href="/privacy">Privacy Policy</a>, and <a href="/privacy-requests">Privacy Requests</a> pages for additional governance details.</p></section></main>`;
  }

  if (normalizedPath === '/search') {
    return `<main><h1>Search FreeStack Resources</h1><p>Search across ${totalCount} verified free AI models, MCP servers, public APIs, cloud tiers, databases, developer tools, learning resources, and student benefits.</p></main>`;
  }

  if (normalizedPath === '/saved') {
    return `<main><h1>Saved Developer Stack</h1><p>Review and organize your locally saved free developer tools, APIs, cloud credits, and learning guides stored privately in your browser.</p></main>`;
  }

  if (normalizedPath === '/design-system') {
    return `<main><h1>FreeStack Design System</h1><p>Explore the color tokens, typography scale, accessible focus styles, and tactile card primitives powering the FreeStack directory across ${totalCount} verified free developer resources and ${categories.length} structured stack categories. The FreeStack interface emphasizes crisp WCAG AA contrast ratios, keyboard-first navigation, legible monospace quota labels, and fast zero-layout-shift rendering on both desktop and mobile viewports.</p><section><h2>Core Design &amp; Accessibility Principles</h2><p>Every component follows accessible contrast guidelines, predictable focus outlines, clean semantic heading hierarchy, and concise information density so developers can compare free usage limits and payment card rules at a glance without visual clutter or marketing distractions. Surface tokens pair warm off-white daylight cards with deep charcoal ink and category-coded pastel accents for AI models, MCP servers, APIs, cloud hosting, learning courses, and student packs.</p></section></main>`;
  }

  return `<main><h1>Page Not Found</h1><p>The requested FreeStack page could not be found. Explore our ${totalCount} verified free developer resources across ${categories.length} categories from the navigation links above.</p></main>`;
}

export function buildHomeSsrAsideHtml(ctx: { categories: Category[]; offers: Offer[] }): string {
  const { categories, offers } = ctx;
  const totalCount = offers.length.toLocaleString('en-US');

  return [
    `<aside data-freestack-ssr="true" data-freestack-ssr-context="true" class="fs-ssr-only" aria-label="Catalog verification summary">`,
    `<img src="/favicon.svg" alt="FreeStack verified free developer directory logo" width="32" height="32" />`,
    `<h2>About FreeStack Catalog (${totalCount} Verified Free Resources)</h2>`,
    `<p>FreeStack is a verified, login-free directory of ${totalCount} free developer resources across ${categories.length} stack categories, backed by cited official HTTPS pricing pages, real free-tier quotas, and clear payment card rules.</p>`,
    `<p><strong>Catalog Freshness:</strong> Updated continuously and last audited November 2026 directly from official HTTPS pricing pages and developer documentation.</p>`,
    `<h2>Trust Signals &amp; Verification Methodology</h2>`,
    `<ul>`,
    `<li><strong>Primary Official Documentation:</strong> Every verified listing links directly to official HTTPS pricing or documentation pages with timestamped verification dates.</li>`,
    `<li><strong>No Fake Permanent Freebies:</strong> Temporary trials and expiring credits are clearly separated from permanently free developer tiers and open-source licenses.</li>`,
    `<li><strong>Explicit Card &amp; Student Rules:</strong> Unknown card requirements remain labeled unknown rather than guessed, and academic .edu rules are highlighted upfront.</li>`,
    `<li><strong>Zero Login &amp; Open Source (AGPL-3.0):</strong> Local-first bookmarks stay in your browser with no account required. Read our <a href="/about">Trust &amp; Verification Policy</a> and <a href="/privacy">Privacy Policy</a>.</li>`,
    `</ul>`,
    `<h2>Next Steps to Build Your $0 Stack</h2>`,
    `<p>Ready to assemble a production stack or study track? <a href="/explore">Explore all ${totalCount} verified free resources</a>, <a href="/categories">compare all ${categories.length} developer categories</a>, <a href="/learning">start a free computer science course</a>, or <a href="/students">check eligible student developer packs</a>.</p>`,
    `</aside>`,
  ].join('');
}

/**
 * Generates semantic, crawlable, route-specific HTML for search engines and AI crawlers.
 * Wrapped in `.fs-ssr-only` (visually hidden via inline head CSS) so users never see an
 * unstyled pre-hydration flash while crawlers receive exact H1, 300+ words, and internal links.
 * React replaces `#root`'s children completely upon mount.
 */
export function buildRouteSsrSnapshot(ctx: SsrSnapshotContext): string {
  const normalizedPath = ctx.pathname === '/' ? '/' : ctx.pathname.replace(/\/+$/, '');

  let bodyHtml: string;
  if (normalizedPath === '/' || normalizedPath === '') {
    bodyHtml = renderHomeSnapshot(ctx);
  } else if (normalizedPath.startsWith('/category/')) {
    const slug = normalizedPath.slice('/category/'.length);
    const cat = ctx.categoryBySlug.get(slug);
    bodyHtml = cat
      ? renderCategorySnapshot(cat, ctx)
      : renderStaticRouteSnapshot(normalizedPath, ctx);
  } else if (normalizedPath.startsWith('/offer/')) {
    const slug = normalizedPath.slice('/offer/'.length);
    const offer = ctx.offerBySlug.get(slug);
    bodyHtml = offer
      ? renderOfferSnapshot(offer, ctx)
      : renderStaticRouteSnapshot(normalizedPath, ctx);
  } else {
    bodyHtml = renderStaticRouteSnapshot(normalizedPath, ctx);
  }

  return `<div data-freestack-ssr="true" class="fs-ssr-only">${renderNavLinks(ctx.categories)}${bodyHtml}${renderFooter()}</div>`;
}
