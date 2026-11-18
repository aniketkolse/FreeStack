import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadOffersFromDisk } from '../data/nodeLoader';
import {
  resolveOfferBrandLogoSrc,
  resolveOfferLogoSrc,
  resolveOfferRemoteBrandUrl,
} from './offerLogos';

test('every cataloged offer resolves to an existing official logo file in public/logos with zero synthetic placeholders', () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  const offers = loadOffersFromDisk();

  assert.ok(
    offers.length >= 6500,
    `Expected at least 6500 offers including awesome-mcp-servers and public-apis, found ${offers.length}`
  );

  const checkedSvgPaths = new Set<string>();
  let brandOrRemoteMatched = 0;

  for (const offer of offers) {
    const logoSrc = resolveOfferLogoSrc(offer);
    assert.ok(logoSrc, `Missing logo mapping for ${offer.identity.slug}`);
    assert.ok(
      /^\/logos\/[a-z0-9-]+\.(svg|png|jpg)$/.test(logoSrc),
      `Expected official /logos/*.{svg,png,jpg} path for ${offer.identity.slug}, got ${logoSrc}`
    );
    const diskPath = path.join(publicDir, logoSrc.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `Logo file missing on disk: ${diskPath}`);
    assert.ok(fs.statSync(diskPath).size > 100, `Logo file unexpectedly empty: ${diskPath}`);

    const brandSrc = resolveOfferBrandLogoSrc(offer);
    const remoteSrc = resolveOfferRemoteBrandUrl(offer);
    if (brandSrc || remoteSrc) {
      brandOrRemoteMatched++;
    }

    if (
      offer.classification.category === 'ai-ml' ||
      offer.classification.category === 'developer-tools' ||
      offer.classification.category === 'design-creative' ||
      offer.classification.category === 'databases-backend' ||
      offer.classification.category === 'security-networking' ||
      offer.classification.category === 'productivity-collaboration' ||
      offer.classification.category === 'cloud-hosting' ||
      offer.classification.category === 'student-benefits'
    ) {
      assert.ok(
        brandSrc,
        `Every AI model, Developer Tool, Frontend & Design Tool, Databases & Backend, Security & Networking, Productivity & Collaboration, Cloud & Hosting, and Student Benefits offer must resolve to a specific official model or company logo: ${offer.identity.slug}`
      );
    }

    if (diskPath.endsWith('.svg') && !checkedSvgPaths.has(diskPath)) {
      checkedSvgPaths.add(diskPath);
      const rawSvg = fs.readFileSync(diskPath, 'utf8');
      assert.ok(
        !/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/.test(rawSvg),
        `Unescaped XML ampersand found in SVG logo: ${diskPath}`
      );
      assert.ok(
        !rawSvg.includes('<rect width="64" height="64" rx="16"'),
        `Synthetic 64x64 placeholder SVG found instead of official brand vector: ${diskPath}`
      );
    }
  }

  assert.equal(
    brandOrRemoteMatched,
    offers.length,
    'Every offer across all categories should resolve to an official model/company logo or official website/GitHub logo'
  );
});

test('specific AI models and 3rd-party company integrations resolve to their exact model or company logos', () => {
  const offers = loadOffersFromDisk();
  const bySlug = new Map(offers.map((o) => [o.identity.slug, o]));

  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('google-ai-studio-gemini-free')!), '/logos/brand-aistudio.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('gemini-3-8-flash-free')!), '/logos/model-gemini.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('gemma-4-31b-it-multimodal')!), '/logos/model-gemma.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('qwen-3-5-397b-a17b-moe-vision')!), '/logos/brand-qwen.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('alibaba-modelscope-dashscope-qwen3-max')!), '/logos/brand-modelscope.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cohere-command-a-reasoning-111b')!), '/logos/model-commanda.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cohere-aya-expanse-32b-multilingual')!), '/logos/brand-aya.svg'.replace('brand-aya', 'model-aya'));
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cohere-north-mini-code-free')!), '/logos/brand-cohere.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('meta-muse-glimmer-step-3-7-vision')!), '/logos/model-muse.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('meta-llama-4-maverick-scout-multimodal')!), '/logos/brand-meta.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cloudflare-workers-ai-free-neurons')!), '/logos/cloudflare.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('cloudflare-pages-workers')!), '/logos/cloudflare.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('baidu-ernie-image-alibaba-z-image')!), '/logos/brand-baidu.svg');
  assert.equal(resolveOfferBrandLogoSrc(bySlug.get('openai-gpt-oss-120b-20b-free')!), '/logos/brand-openai.svg');

  const publicDir = path.resolve(process.cwd(), 'public');
  const openaiSvg = fs.readFileSync(path.join(publicDir, 'logos/brand-openai.svg'), 'utf8');
  assert.ok(openaiSvg.includes('#000000'), 'OpenAI logo must use official #000000 black');

  const cloudflareSvg = fs.readFileSync(path.join(publicDir, 'logos/cloudflare.svg'), 'utf8');
  assert.ok(
    cloudflareSvg.includes('#F38020') && cloudflareSvg.includes('#FCAD32'),
    'Cloudflare logo must use official two-cloud #F38020 and #FCAD32 colors'
  );
});

test('Developer Tools category contains 106 verified strictly developer-tool offers across 10 subcategories with official brand logos', () => {
  const offers = loadOffersFromDisk();
  const devTools = offers.filter((o) => o.classification.category === 'developer-tools');

  assert.equal(devTools.length, 106, `Expected 106 verified Developer Tools offers, found ${devTools.length}`);

  const subcategories = new Set<string>();
  for (const offer of devTools) {
    assert.equal(
      offer.classification.resource_type,
      'developer_tool',
      `Developer tool ${offer.identity.slug} must have resource_type === 'developer_tool'`
    );
    assert.equal(offer.verification.status, 'verified', `Developer tool ${offer.identity.slug} must be verified`);
    assert.ok(offer.classification.subcategory, `Developer tool ${offer.identity.slug} must have a subcategory`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Developer tool ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Developer Tools subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );
});

test('Frontend & Design Tools category contains 104 verified offers across 8 subcategories ordered from Most Popular to Least Popular by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const designTools = offers.filter((o) => o.classification.category === 'design-creative');

  assert.equal(designTools.length, 104, `Expected 104 verified Frontend & Design Tools offers, found ${designTools.length}`);

  const subcategories = new Set<string>();
  for (const offer of designTools) {
    assert.equal(offer.verification.status, 'verified', `Frontend & Design tool ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Frontend & Design tool ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    8,
    `Expected 8 Frontend & Design Tools subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(designTools, {
    ...DEFAULT_FILTER_STATE,
    category: 'design-creative',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 8).map((o) => o.identity.slug),
    [
      'figma-starter-plan',
      'tailwind-css-framework',
      'canva-free-graphic-design',
      'shadcn-ui-component-primitives',
      'google-fonts-open-source-type',
      'bootstrap-5-css-framework',
      'blender-3d-creation-suite',
      'lucide-icons',
    ],
    'Most popular Frontend & Design Tools (Figma, Tailwind CSS, Canva, shadcn/ui, Google Fonts, Bootstrap 5, Blender, Lucide) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'velvetyne-libre-type-foundry',
    'Least popular Frontend & Design Tools offer in the curated 104-item popularity sequence must appear at the bottom (#104)'
  );
});

test('Databases & Backend category contains 125 verified offers across 10 subcategories ordered from Most Popular to Least Popular by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const dbBackend = offers.filter((o) => o.classification.category === 'databases-backend');

  assert.equal(dbBackend.length, 125, `Expected 125 verified Databases & Backend offers, found ${dbBackend.length}`);

  const subcategories = new Set<string>();
  for (const offer of dbBackend) {
    assert.equal(offer.verification.status, 'verified', `Databases & Backend offer ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Databases & Backend offer ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Databases & Backend subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(dbBackend, {
    ...DEFAULT_FILTER_STATE,
    category: 'databases-backend',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 8).map((o) => o.identity.slug),
    [
      'supabase-free-plan',
      'render-free-postgres-redis-backend',
      'railway-backend-databases-trial',
      'aws-free-tier-databases-backend',
      'mongodb-atlas-free-forever-m0',
      'firebase-spark-firestore-baas',
      'neon-serverless-postgres',
      'postgresql-open-source-rdbms',
    ],
    'Most popular Databases & Backend offers (Supabase, Render, Railway, AWS, MongoDB, Firebase, Neon, PostgreSQL) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'manifest-1-file-yaml-backend',
    'Least popular Databases & Backend offer in the curated 125-item popularity sequence must appear at the bottom (#125)'
  );
});

test('Security & Networking category contains 125 verified offers across 10 subcategories ordered from Most Popular to Least Popular by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const secNet = offers.filter((o) => o.classification.category === 'security-networking');

  assert.equal(secNet.length, 125, `Expected 125 verified Security & Networking offers, found ${secNet.length}`);

  const subcategories = new Set<string>();
  for (const offer of secNet) {
    assert.equal(offer.verification.status, 'verified', `Security & Networking offer ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Security & Networking offer ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Security & Networking subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(secNet, {
    ...DEFAULT_FILTER_STATE,
    category: 'security-networking',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 8).map((o) => o.identity.slug),
    [
      'cloudflare-zero-trust-free',
      'tailscale-free-wireguard-mesh-vpn',
      'wireshark-network-protocol-analyzer',
      'nmap-network-mapper-scanner',
      'owasp-zap-zed-attack-proxy',
      'lets-encrypt',
      'burp-suite-community-edition',
      'bitwarden-open-source-password-manager',
    ],
    'Most popular Security & Networking tools (Cloudflare Zero Trust, Tailscale, Wireshark, Nmap, OWASP ZAP, Let\'s Encrypt, Burp Suite, Bitwarden) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'doggo-modern-command-line-dns-client',
    'Least popular Security & Networking offer in the curated 125-item popularity sequence must appear at the bottom (#125)'
  );
});

test('Productivity & Collaboration category contains 125 verified offers across 10 subcategories ordered from Most Popular to Least Popular by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const prodCollab = offers.filter((o) => o.classification.category === 'productivity-collaboration');

  assert.equal(prodCollab.length, 125, `Expected 125 verified Productivity & Collaboration offers, found ${prodCollab.length}`);

  const subcategories = new Set<string>();
  for (const offer of prodCollab) {
    assert.equal(offer.verification.status, 'verified', `Productivity & Collaboration offer ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Productivity & Collaboration offer ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Productivity & Collaboration subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(prodCollab, {
    ...DEFAULT_FILTER_STATE,
    category: 'productivity-collaboration',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 8).map((o) => o.identity.slug),
    [
      'notion-free-plan',
      'linear-free-issue-tracking',
      'slack-free-team-messaging',
      'obsidian-markdown-knowledge-base',
      'excalidraw-whiteboard',
      'n8n-workflow-automation-self-hosted',
      'atlassian-jira-free-plan',
      'miro-free-collaborative-whiteboard',
    ],
    'Most popular Productivity & Collaboration tools (Notion, Linear, Slack, Obsidian, Excalidraw, n8n, Jira, Miro) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'espanso-cross-platform-text-expander',
    'Least popular Productivity & Collaboration offer in the curated 125-item popularity sequence must appear at the bottom (#125)'
  );
});

test('Cloud & Hosting category contains 113 verified offers across 10 subcategories with most popular cloud & hosting platforms at top by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const cloudHosting = offers.filter((o) => o.classification.category === 'cloud-hosting');

  assert.equal(cloudHosting.length, 113, `Expected 113 verified Cloud & Hosting offers, found ${cloudHosting.length}`);

  const subcategories = new Set<string>();
  for (const offer of cloudHosting) {
    assert.equal(offer.verification.status, 'verified', `Cloud & Hosting offer ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Cloud & Hosting offer ${offer.identity.slug} must resolve to an official brand logo`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Cloud & Hosting subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(cloudHosting, {
    ...DEFAULT_FILTER_STATE,
    category: 'cloud-hosting',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 8).map((o) => o.identity.slug),
    [
      'aws-free-tier-cloud-credits',
      'cloudflare-pages-workers',
      'vercel-hobby',
      'google-cloud-free-program-300',
      'microsoft-azure-free-account-200',
      'github-pages-static',
      'netlify-starter-free-hosting',
      'cloudflare-free-cdn-dns-ssl',
    ],
    'Most popular Cloud & Hosting tools (AWS, Cloudflare, Vercel, Google Cloud, Azure, GitHub Pages, Netlify, Cloudflare CDN) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'serv00-free-freebsd-shell-hosting',
    'Least popular Cloud & Hosting offer in the curated 113-item popularity sequence must appear at the bottom (#113)'
  );
});

test('Student Benefits category contains 107 verified offers across 10 subcategories with explicit Student ID vs No Student ID classification and most popular perks at top by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const studentBenefits = offers.filter((o) => o.classification.category === 'student-benefits');

  assert.equal(studentBenefits.length, 107, `Expected 107 verified Student Benefits offers, found ${studentBenefits.length}`);

  const subcategories = new Set<string>();
  let requiresStudentIdCount = 0;
  let noStudentIdRequiredCount = 0;

  for (const offer of studentBenefits) {
    assert.equal(offer.verification.status, 'verified', `Student Benefits offer ${offer.identity.slug} must be verified`);
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Student Benefits offer ${offer.identity.slug} must resolve to an official brand logo`
    );
    assert.ok(
      offer.eligibility.conditions && offer.eligibility.conditions.length > 10,
      `Student Benefits offer ${offer.identity.slug} must explicitly describe its Student ID / verification condition`
    );

    if (offer.eligibility.student_access === 'exclusive') {
      requiresStudentIdCount++;
      assert.equal(
        offer.classification.pricing_model,
        'student_exclusive',
        `Exclusive student benefit ${offer.identity.slug} must use student_exclusive pricing model`
      );
      assert.ok(
        offer.classification.tags.includes('Student ID / .edu Required'),
        `Exclusive student benefit ${offer.identity.slug} must include "Student ID / .edu Required" tag`
      );
    } else if (offer.eligibility.student_access === 'eligible') {
      noStudentIdRequiredCount++;
      assert.ok(
        offer.classification.tags.includes('No Student ID Required'),
        `Open student benefit ${offer.identity.slug} must include "No Student ID Required" tag`
      );
    } else {
      assert.fail(`Unexpected student_access "${offer.eligibility.student_access}" on ${offer.identity.slug}`);
    }
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Student Benefits subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );
  assert.equal(requiresStudentIdCount + noStudentIdRequiredCount, 107);
  assert.ok(requiresStudentIdCount >= 75, `Expected at least 75 Student ID required offers, found ${requiresStudentIdCount}`);
  assert.ok(noStudentIdRequiredCount >= 20, `Expected at least 20 No Student ID required offers, found ${noStudentIdRequiredCount}`);

  const defaultSorted = filterAndSortOffers(studentBenefits, {
    ...DEFAULT_FILTER_STATE,
    category: 'student-benefits',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 8).map((o) => o.identity.slug),
    [
      'github-student-developer-pack',
      'github-copilot-pro-students',
      'jetbrains-educational-pack',
      'figma-education',
      'notion-plus-education',
      'canva-education-free',
      'cursor-pro-student-free',
      'google-one-ai-premium-students',
    ],
    'Most popular Student Benefits (GitHub Student Pack, Copilot Pro, JetBrains, Figma Education, Notion Plus, Canva Education, Cursor Pro, Google Gemini Advanced) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'zyte-scrapy-cloud-student-forever',
    'Least popular Student Benefits offer in the curated 107-item popularity sequence must appear at the bottom (#107)'
  );
});

test('Learning & Study Materials category contains 119 verified offers across 10 subcategories ordered from Most Popular to Least Popular by default', async () => {
  const { filterAndSortOffers, DEFAULT_FILTER_STATE } = await import('../filters/filterOffers');
  const offers = loadOffersFromDisk();
  const learningOffers = offers.filter((o) => o.classification.category === 'learning');

  assert.equal(
    learningOffers.length,
    119,
    `Expected 119 verified Learning & Study Materials offers, found ${learningOffers.length}`
  );

  const subcategories = new Set<string>();
  for (const offer of learningOffers) {
    assert.equal(
      offer.verification.status,
      'verified',
      `Learning & Study Materials offer ${offer.identity.slug} must be verified`
    );
    subcategories.add(offer.classification.subcategory);
    assert.ok(
      resolveOfferBrandLogoSrc(offer),
      `Learning & Study Materials offer ${offer.identity.slug} must resolve to an official brand logo`
    );
    assert.ok(
      offer.learning && offer.learning.topics && offer.learning.topics.length > 0,
      `Learning & Study Materials offer ${offer.identity.slug} must include learning metadata`
    );
  }

  assert.equal(
    subcategories.size,
    10,
    `Expected 10 Learning & Study Materials subcategories, found ${subcategories.size}: ${Array.from(subcategories).join(', ')}`
  );

  const defaultSorted = filterAndSortOffers(learningOffers, {
    ...DEFAULT_FILTER_STATE,
    category: 'learning',
    sortBy: 'relevance',
  });

  assert.deepEqual(
    defaultSorted.slice(0, 10).map((o) => o.identity.slug),
    [
      'freecodecamp-curriculum',
      'mdn-web-docs',
      'harvard-cs50x',
      'roadmap-sh',
      'the-odin-project',
      'leetcode-free-algorithm-practice',
      'mit-ocw-math-cs',
      'khan-academy-computing-math',
      'w3schools-web-tutorials',
      'full-stack-open-helsinki',
    ],
    'Most popular Learning & Study Materials (freeCodeCamp, MDN Web Docs, Harvard CS50x, roadmap.sh, The Odin Project, LeetCode, MIT OCW, Khan Academy, W3Schools, Full Stack Open) must appear at the top by default'
  );

  assert.equal(
    defaultSorted[defaultSorted.length - 1].identity.slug,
    'seeing-theory-brown-probability',
    'Least popular Learning & Study Materials offer in the curated 119-item popularity sequence must appear at the bottom (#119)'
  );
});
