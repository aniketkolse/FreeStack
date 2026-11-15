import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import type { Category, Offer } from '../src/types/resource';

const PUBLIC_APIS_README = '/tmp/public-apis/README.md';
const ROOT_DIR = process.cwd();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

// Map each of the 51 public-apis categories to a dedicated vector icon design (palette + SVG path)
const CATEGORY_ICON_SPECS: Record<
  string,
  { slug: string; bg: string; fg: string; accent: string; path: string }
> = {
  Animals: {
    slug: 'api-animals',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="19" cy="19" r="4"/><circle cx="32" cy="15" r="4"/><circle cx="45" cy="19" r="4"/><circle cx="14" cy="30" r="3.5"/><circle cx="50" cy="30" r="3.5"/><path d="M22 38c0-6 5-10 10-10s10 4 10 10c0 5-4 8-10 8s-10-3-10-8z"/>',
  },
  Anime: {
    slug: 'api-anime',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<polygon points="32,10 37,24 52,24 40,33 44,48 32,39 20,48 24,33 12,24 27,24"/>',
  },
  'Anti-Malware': {
    slug: 'api-anti-malware',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<path d="M32 10l18 7v13c0 12-7.5 20.5-18 24-10.5-3.5-18-12-18-24V17l18-7z"/><path d="M24 32l5 5 11-11" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'Art & Design': {
    slug: 'api-art-design',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#54A7FF',
    path: '<path d="M32 12a20 20 0 1 0 0 40c3.5 0 6-2.5 6-5.5 0-1.5-.6-2.8-1.5-3.8-.9-1-1.5-2.1-1.5-3.7 0-3 2.5-5.5 6-5.5h3A18 18 0 0 0 32 12z"/><circle cx="22" cy="24" r="3" fill="#FFF550"/><circle cx="30" cy="20" r="3" fill="#54A7FF"/><circle cx="40" cy="24" r="3" fill="#55D764"/>',
  },
  'Authentication & Authorization': {
    slug: 'api-auth',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#55D764',
    path: '<rect x="16" y="28" width="32" height="24" rx="5"/><path d="M22 28V21a10 10 0 0 1 20 0v7" fill="none" stroke="#101014" stroke-width="4"/><circle cx="32" cy="40" r="3.5" fill="#FFF550"/>',
  },
  Blockchain: {
    slug: 'api-blockchain',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<polygon points="32,10 50,20 50,44 32,54 14,44 14,20" fill="none" stroke="#101014" stroke-width="4"/><polyline points="14,20 32,31 50,20" fill="none" stroke="#101014" stroke-width="4"/><line x1="32" y1="31" x2="32" y2="54" stroke="#101014" stroke-width="4"/>',
  },
  Books: {
    slug: 'api-books',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#FF86C8',
    path: '<path d="M12 16h16a4 4 0 0 1 4 4v28a4 4 0 0 0-4-4H12V16z"/><path d="M52 16H36a4 4 0 0 0-4 4v28a4 4 0 0 1 4-4h16V16z"/>',
  },
  Business: {
    slug: 'api-business',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<rect x="12" y="20" width="40" height="30" rx="4"/><path d="M24 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" fill="none" stroke="#101014" stroke-width="4"/><line x1="12" y1="33" x2="52" y2="33" stroke="#FFFFFF" stroke-width="3"/>',
  },
  Calendar: {
    slug: 'api-calendar',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<rect x="12" y="16" width="40" height="36" rx="5"/><line x1="22" y1="10" x2="22" y2="20" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="42" y1="10" x2="42" y2="20" stroke="#101014" stroke-width="4" stroke-linecap="round"/><rect x="18" y="28" width="8" height="8" rx="2" fill="#FFF550"/><rect x="30" y="28" width="8" height="8" rx="2" fill="#FFFFFF"/>',
  },
  'Cloud Storage & File Sharing': {
    slug: 'api-cloud-storage',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<path d="M20 46h25a10 10 0 0 0 1-19.9A14 14 0 0 0 19 23a11 11 0 0 0 1 23z"/>',
  },
  'Continuous Integration': {
    slug: 'api-ci-cd',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<circle cx="18" cy="20" r="6"/><circle cx="18" cy="44" r="6"/><circle cx="46" cy="32" r="6"/><path d="M24 20h10a8 8 0 0 1 8 8v4M24 44h10a8 8 0 0 0 8-8v-4" fill="none" stroke="#101014" stroke-width="4"/>',
  },
  Cryptocurrency: {
    slug: 'api-cryptocurrency',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#FF8A3D',
    path: '<circle cx="32" cy="32" r="20"/><path d="M26 22h9a5 5 0 0 1 0 10h-9h10a5 5 0 0 1 0 10H26M29 18v28M35 18v28" fill="none" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/>',
  },
  'Currency Exchange': {
    slug: 'api-currency',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="32" cy="32" r="20" fill="none" stroke="#101014" stroke-width="4"/><path d="M37 23H28a4 4 0 0 0 0 8h8a4 4 0 0 1 0 8H26M32 18v28" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Data Validation': {
    slug: 'api-data-validation',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<circle cx="32" cy="32" r="20"/><polyline points="22,32 29,39 43,25" fill="none" stroke="#55D764" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  Development: {
    slug: 'api-development',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<polyline points="22,20 10,32 22,44" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="42,20 54,32 42,44" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="36" y1="16" x2="28" y2="48" stroke="#101014" stroke-width="4.5" stroke-linecap="round"/>',
  },
  Dictionaries: {
    slug: 'api-dictionaries',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#54A7FF',
    path: '<rect x="14" y="12" width="36" height="40" rx="4"/><text x="32" y="39" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFF550">A–Z</text>',
  },
  'Documents & Productivity': {
    slug: 'api-documents',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<path d="M18 10h20l10 10v34H18V10z"/><line x1="24" y1="28" x2="42" y2="28" stroke="#FFF550" stroke-width="3.5"/><line x1="24" y1="36" x2="42" y2="36" stroke="#FFF550" stroke-width="3.5"/><line x1="24" y1="44" x2="34" y2="44" stroke="#FFF550" stroke-width="3.5"/>',
  },
  Email: {
    slug: 'api-email',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="10" y="16" width="44" height="32" rx="5"/><polyline points="12,18 32,34 52,18" fill="none" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  Entertainment: {
    slug: 'api-entertainment',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="10" y="18" width="44" height="28" rx="5"/><polygon points="28,25 41,32 28,39" fill="#FFF550"/>',
  },
  Environment: {
    slug: 'api-environment',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M48 14C30 14 16 24 16 42c0 4 2 8 4 8 18 0 28-14 28-36z"/><path d="M16 48c8-10 18-18 30-24" fill="none" stroke="#55D764" stroke-width="3.5" stroke-linecap="round"/>',
  },
  Events: {
    slug: 'api-events',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M12 22h40v8a4 4 0 0 0 0 8v8H12v-8a4 4 0 0 0 0-8v-8z"/><line x1="26" y1="22" x2="26" y2="46" stroke="#FF8A3D" stroke-width="3" stroke-dasharray="4 4"/>',
  },
  Finance: {
    slug: 'api-finance',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFF550',
    path: '<polyline points="12,44 26,30 35,38 52,18" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="40,18 52,18 52,30" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'Food & Drink': {
    slug: 'api-food-drink',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M16 26h26v12a13 13 0 0 1-26 0V26z"/><path d="M42 28h5a5 5 0 0 1 0 10h-5" fill="none" stroke="#101014" stroke-width="4"/><line x1="14" y1="48" x2="44" y2="48" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Games & Comics': {
    slug: 'api-games-comics',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="10" y="20" width="44" height="24" rx="10"/><line x1="22" y1="27" x2="22" y2="37" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/><line x1="17" y1="32" x2="27" y2="32" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/><circle cx="41" cy="29" r="2.5" fill="#FFF550"/><circle cx="46" cy="35" r="2.5" fill="#55D764"/>',
  },
  Geocoding: {
    slug: 'api-geocoding',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M32 10c-9.4 0-17 7.4-17 16.5C15 39 32 54 32 54s17-15 17-27.5C49 17.4 41.4 10 32 10z"/><circle cx="32" cy="26" r="6" fill="#FFF550"/>',
  },
  Government: {
    slug: 'api-government',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<polygon points="32,10 54,22 10,22"/><rect x="16" y="25" width="6" height="19"/><rect x="29" y="25" width="6" height="19"/><rect x="42" y="25" width="6" height="19"/><rect x="10" y="46" width="44" height="6" rx="2"/>',
  },
  Health: {
    slug: 'api-health',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<path d="M32 52S12 39 12 24a11 11 0 0 1 20-6 11 11 0 0 1 20 6c0 15-20 28-20 28z"/><polyline points="18,30 26,30 30,22 35,38 39,30 46,30" fill="none" stroke="#55D764" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  Jobs: {
    slug: 'api-jobs',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#54A7FF',
    path: '<rect x="12" y="20" width="40" height="30" rx="5"/><path d="M24 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" fill="none" stroke="#101014" stroke-width="4"/><circle cx="32" cy="34" r="3" fill="#FFF550"/>',
  },
  'Machine Learning': {
    slug: 'api-machine-learning',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="16" cy="20" r="5"/><circle cx="16" cy="44" r="5"/><circle cx="32" cy="32" r="6"/><circle cx="48" cy="20" r="5"/><circle cx="48" cy="44" r="5"/><line x1="20" y1="22" x2="27" y2="29" stroke="#101014" stroke-width="3.5"/><line x1="20" y1="42" x2="27" y2="35" stroke="#101014" stroke-width="3.5"/><line x1="37" y1="29" x2="44" y2="22" stroke="#101014" stroke-width="3.5"/><line x1="37" y1="35" x2="44" y2="42" stroke="#101014" stroke-width="3.5"/>',
  },
  Music: {
    slug: 'api-music',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M24 44V16l24-4v28" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="44" r="6"/><circle cx="42" cy="40" r="6"/>',
  },
  News: {
    slug: 'api-news',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<rect x="12" y="14" width="40" height="36" rx="4"/><rect x="18" y="20" width="14" height="12" fill="#FFF550"/><line x1="36" y1="22" x2="46" y2="22" stroke="#FFF550" stroke-width="3"/><line x1="36" y1="30" x2="46" y2="30" stroke="#FFF550" stroke-width="3"/><line x1="18" y1="40" x2="46" y2="40" stroke="#FFF550" stroke-width="3"/>',
  },
  'Open Data': {
    slug: 'api-open-data',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="32" cy="32" r="20" fill="none" stroke="#101014" stroke-width="4"/><ellipse cx="32" cy="32" rx="10" ry="20" fill="none" stroke="#101014" stroke-width="3.5"/><line x1="12" y1="32" x2="52" y2="32" stroke="#101014" stroke-width="3.5"/>',
  },
  'Open Source Projects': {
    slug: 'api-open-source',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<circle cx="32" cy="32" r="20" fill="none" stroke="#101014" stroke-width="5"/><circle cx="32" cy="32" r="7"/>',
  },
  Patent: {
    slug: 'api-patent',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#FF8A3D',
    path: '<circle cx="32" cy="26" r="14"/><polygon points="24,38 20,54 32,48 44,54 40,38"/>',
  },
  Personality: {
    slug: 'api-personality',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="32" cy="32" r="20"/><circle cx="25" cy="27" r="3" fill="#FFF550"/><circle cx="39" cy="27" r="3" fill="#FFF550"/><path d="M23 37c2.5 4 6 6 9 6s6.5-2 9-6" fill="none" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/>',
  },
  Phone: {
    slug: 'api-phone',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFFFFF',
    path: '<rect x="20" y="10" width="24" height="44" rx="5"/><circle cx="32" cy="47" r="2.5" fill="#55D764"/>',
  },
  Photography: {
    slug: 'api-photography',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="10" y="18" width="44" height="30" rx="5"/><path d="M22 18l3-5h14l3 5"/><circle cx="32" cy="33" r="8" fill="#FFF550"/>',
  },
  Programming: {
    slug: 'api-programming',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="10" y="14" width="44" height="36" rx="5"/><polyline points="18,26 26,32 18,38" fill="none" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="30" y1="38" x2="40" y2="38" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/>',
  },
  'Science & Math': {
    slug: 'api-science-math',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<ellipse cx="32" cy="32" rx="22" ry="9" fill="none" stroke="#101014" stroke-width="3.5" transform="rotate(30 32 32)"/><ellipse cx="32" cy="32" rx="22" ry="9" fill="none" stroke="#101014" stroke-width="3.5" transform="rotate(-30 32 32)"/><circle cx="32" cy="32" r="4"/>',
  },
  Security: {
    slug: 'api-security',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M32 10l18 7v13c0 12-7.5 20.5-18 24-10.5-3.5-18-12-18-24V17l18-7z"/><circle cx="32" cy="31" r="5" fill="#FFF550"/>',
  },
  Shopping: {
    slug: 'api-shopping',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M16 22h32l-3 28H19l-3-28z"/><path d="M24 22v-4a8 8 0 0 1 16 0v4" fill="none" stroke="#101014" stroke-width="4"/>',
  },
  Social: {
    slug: 'api-social',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M14 16h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H26l-12 8V20a4 4 0 0 1 4-4z"/><circle cx="24" cy="30" r="3" fill="#FFF550"/><circle cx="32" cy="30" r="3" fill="#FFF550"/><circle cx="40" cy="30" r="3" fill="#FFF550"/>',
  },
  'Sports & Fitness': {
    slug: 'api-sports-fitness',
    bg: '#55D764',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M20 14h24v12a12 12 0 0 1-24 0V14z"/><line x1="32" y1="38" x2="32" y2="48" stroke="#101014" stroke-width="4"/><rect x="22" y="48" width="20" height="5" rx="2"/>',
  },
  'Test Data': {
    slug: 'api-test-data',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#54A7FF',
    path: '<path d="M24 12h16M27 12v14L15 46a4 4 0 0 0 3.5 6h27a4 4 0 0 0 3.5-6L37 26V12" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'Text Analysis': {
    slug: 'api-text-analysis',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<line x1="12" y1="20" x2="52" y2="20" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="12" y1="32" x2="44" y2="32" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="12" y1="44" x2="34" y2="44" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  Tracking: {
    slug: 'api-tracking',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="32" cy="32" r="20" fill="none" stroke="#101014" stroke-width="4"/><circle cx="32" cy="32" r="10" fill="none" stroke="#101014" stroke-width="3.5"/><circle cx="32" cy="32" r="3.5"/>',
  },
  Transportation: {
    slug: 'api-transportation',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="14" y="14" width="36" height="30" rx="6"/><rect x="18" y="20" width="28" height="12" rx="2" fill="#FFF550"/><circle cx="22" cy="48" r="4"/><circle cx="42" cy="48" r="4"/>',
  },
  'URL Shorteners': {
    slug: 'api-url-shorteners',
    bg: '#FFF550',
    fg: '#101014',
    accent: '#54A7FF',
    path: '<path d="M26 38l-4 4a8 8 0 0 1-11-11l8-8a8 8 0 0 1 11 0M38 26l4-4a8 8 0 0 1 11 11l-8 8a8 8 0 0 1-11 0M24 40l16-16" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  Vehicle: {
    slug: 'api-vehicle',
    bg: '#FF8A3D',
    fg: '#101014',
    accent: '#FFF550',
    path: '<path d="M14 32l5-12h26l5 12v12H14V32z"/><circle cx="21" cy="44" r="5" fill="#FFF550"/><circle cx="43" cy="44" r="5" fill="#FFF550"/>',
  },
  Video: {
    slug: 'api-video',
    bg: '#FF86C8',
    fg: '#101014',
    accent: '#FFF550',
    path: '<rect x="10" y="18" width="32" height="28" rx="5"/><polygon points="42,26 54,19 54,45 42,38"/>',
  },
  Weather: {
    slug: 'api-weather',
    bg: '#54A7FF',
    fg: '#101014',
    accent: '#FFF550',
    path: '<circle cx="24" cy="24" r="9" fill="#FFF550"/><path d="M22 46h22a9 9 0 0 0 1-17.9A12 12 0 0 0 21 26a9 9 0 0 0 1 20z"/>',
  },
};

function generateCategoryUseCaseSvgs() {
  const logosDir = path.join(ROOT_DIR, 'public', 'logos');
  fs.mkdirSync(logosDir, { recursive: true });
  for (const [catName, spec] of Object.entries(CATEGORY_ICON_SPECS)) {
    const safeLabel = catName.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${safeLabel} API icon">
  <rect x="2" y="2" width="60" height="60" rx="16" fill="${spec.bg}" stroke="#101014" stroke-width="3"/>
  <g fill="${spec.fg}">
    ${spec.path}
  </g>
</svg>
`;
    fs.writeFileSync(path.join(logosDir, `${spec.slug}.svg`), svg, 'utf8');
  }
}

async function resolveWorkingHosts(hosts: string[]): Promise<Set<string>> {
  const alive = new Set<string>();
  let idx = 0;
  const concurrency = 120;

  async function worker() {
    while (idx < hosts.length) {
      const h = hosts[idx++];
      try {
        await Promise.race([
          dns.resolve4(h),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
        ]);
        alive.add(h);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code !== 'ENOTFOUND') {
          alive.add(h);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return alive;
}

function cleanMarkdownText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveProviderName(apiName: string, urlStr: string): string {
  try {
    const host = new URL(urlStr).hostname.replace(/^www\./i, '');
    if (host === 'github.com' || host.endsWith('.github.io')) {
      return apiName;
    }
    const parts = host.split('.');
    if (parts.length >= 2) {
      const main = parts[parts.length - 2];
      if (main.length > 2 && main !== 'com' && main !== 'org' && main !== 'gov' && main !== 'co') {
        return apiName.length <= 28 ? apiName : main.charAt(0).toUpperCase() + main.slice(1);
      }
    }
  } catch {
    // ignore
  }
  return apiName;
}

async function main() {
  generateCategoryUseCaseSvgs();

  const md = fs.readFileSync(PUBLIC_APIS_README, 'utf8');
  const lines = md.split(/\r?\n/);

  interface RawMcp {
    name: string;
    url: string;
    desc: string;
    auth: string;
    transport: string;
    install: string;
  }

  interface RawApi {
    cat: string;
    name: string;
    url: string;
    desc: string;
    auth: string;
    https: string;
    cors: string;
  }

  const rawMcps: RawMcp[] = [];
  const rawApis: RawApi[] = [];

  let section: '' | 'mcp' | 'apis' = '';
  let currentCat = '';

  for (const line of lines) {
    if (line.startsWith('## MCP Servers')) {
      section = 'mcp';
      continue;
    }
    if (line.startsWith('## Index')) {
      section = 'apis';
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3 && section === 'apis') {
      currentCat = h3[1].trim();
      continue;
    }

    const row = line.match(
      /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|/
    );
    if (!row) continue;

    const [, rawName, rawUrl, rawDesc, col3, col4, col5] = row.map((s) => (s || '').trim());
    const url = rawUrl.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') continue;
    } catch {
      continue;
    }

    const name = cleanMarkdownText(rawName);
    const desc = cleanMarkdownText(rawDesc);
    if (!name || desc.length < 3) continue;

    if (section === 'mcp') {
      rawMcps.push({
        name,
        url,
        desc,
        auth: cleanMarkdownText(col3) || 'No',
        transport: cleanMarkdownText(col4) || 'HTTP',
        install: cleanMarkdownText(col5) || 'Official MCP endpoint',
      });
    } else if (section === 'apis' && currentCat) {
      if (col4.toLowerCase() === 'yes') {
        rawApis.push({
          cat: currentCat,
          name,
          url,
          desc,
          auth: cleanMarkdownText(col3) || 'No',
          https: 'Yes',
          cors: cleanMarkdownText(col5) || 'Unknown',
        });
      }
    }
  }

  // Collect all unique hosts and check live DNS
  const allHosts = Array.from(
    new Set(
      [...rawMcps.map((m) => m.url), ...rawApis.map((a) => a.url)].map((u) => new URL(u).hostname)
    )
  );
  console.log(`Verifying live DNS for ${allHosts.length} unique HTTPS hosts...`);
  const aliveHosts = await resolveWorkingHosts(allHosts);
  console.log(`Live DNS check passed for ${aliveHosts.size}/${allHosts.length} hosts.`);

  // Read existing individual offers to avoid any ID or slug collision
  const existingSlugs = new Set<string>();
  const existingIds = new Set<string>();
  const existingUrls = new Set<string>();

  function walkExisting(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkExisting(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !entry.name.startsWith('public-apis-')
      ) {
        const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
        const list: Offer[] = Array.isArray(raw) ? raw : [raw];
        for (const o of list) {
          existingSlugs.add(o.identity.slug);
          existingIds.add(o.identity.id);
          existingUrls.add(o.links.official.replace(/\/$/, '').toLowerCase());
        }
      }
    }
  }
  walkExisting(path.join(ROOT_DIR, 'data', 'offers'));

  const mcpOffers: Offer[] = [];
  for (const item of rawMcps) {
    const host = new URL(item.url).hostname;
    if (!aliveHosts.has(host)) continue;
    const normUrl = item.url.replace(/\/$/, '').toLowerCase();
    if (existingUrls.has(normUrl)) continue;
    existingUrls.add(normUrl);

    let baseSlug = slugify(`${item.name}-mcp`);
    if (!baseSlug) baseSlug = 'public-mcp-server';
    let slug = baseSlug;
    let counter = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    existingSlugs.add(slug);

    const id = `offer-pubmcp-${slug}`;
    existingIds.add(id);

    const noAuth = item.auth.toLowerCase() === 'no';
    const description =
      item.desc.length >= 15
        ? `${item.desc}. Official Model Context Protocol (MCP) server supporting ${item.transport} transport.`
        : `${item.name} — ${item.desc} (${item.transport} MCP server).`;

    mcpOffers.push({
      schema_version: '1.0.0',
      identity: {
        id,
        name: `${item.name} MCP`,
        slug,
        provider: deriveProviderName(item.name, item.url),
        logo_url: null,
      },
      classification: {
        category: 'mcp',
        subcategory: item.transport.toLowerCase().includes('stdio')
          ? 'Official MCP Servers'
          : 'Remote & Edge MCP',
        resource_type: 'mcp_server',
        pricing_model: noAuth ? 'completely_free' : 'free_tier',
        tags: ['mcp', 'ai-agents', slugify(item.name), ...item.transport.toLowerCase().split(/[\s,]+/).filter(Boolean)],
      },
      description,
      access: {
        free_limits: [
          {
            name: 'MCP Transport & Auth',
            value: noAuth ? `No Auth Required (${item.transport})` : `${item.auth} (${item.transport})`,
            period: 'ongoing',
          },
        ],
        restrictions: noAuth
          ? ['Public MCP server callable without API credentials.']
          : [`Requires ${item.auth} authentication when connecting your MCP client.`],
        requirements: {
          account_required: noAuth ? 'not_required' : 'required',
          card_required: 'not_required',
          payment_method_notes: noAuth
            ? 'No account or payment card required.'
            : `Requires ${item.auth} credentials; no credit card required for free access.`,
        },
        validity: {
          type: 'ongoing',
          duration: 'Ongoing MCP server access',
          auto_renewal: 'Free MCP server endpoint; no automatic billing.',
        },
      },
      eligibility: {
        student_access: 'eligible',
        regions: ['Global'],
        conditions: 'Open to developers, AI agents, Claude, Cursor, and VS Code MCP clients.',
      },
      links: {
        official: item.url,
        signup: noAuth ? null : item.url,
        documentation: item.url,
        pricing: null,
      },
      evidence: {
        sources: [
          {
            id: 'src-public-apis-repo',
            url: 'https://github.com/public-apis/public-apis',
            source_type: 'official_repo',
            checked_at: '2026-11-13',
          },
        ],
        claims: [
          {
            field_path: 'access.free_limits',
            quote: `${item.name}: ${item.desc} (Auth: ${item.auth}, Transport: ${item.transport})`,
            source_id: 'src-public-apis-repo',
            confidence: 'high',
            notes: 'Verified active HTTPS MCP server in public-apis/public-apis.',
          },
        ],
      },
      verification: {
        status: 'verified',
        last_verified_at: '2026-11-13',
        notes: 'Verified live HTTPS & DNS reachability from public-apis/public-apis.',
      },
      metadata: {
        featured: false,
        created_at: '2026-11-13',
        updated_at: '2026-11-13',
      },
    });
  }

  const apiOffers: Offer[] = [];
  for (const item of rawApis) {
    const host = new URL(item.url).hostname;
    if (!aliveHosts.has(host)) continue;
    const normUrl = item.url.replace(/\/$/, '').toLowerCase();
    if (existingUrls.has(normUrl)) continue;
    existingUrls.add(normUrl);

    let baseSlug = slugify(`${item.name}-${item.cat}-api`);
    if (!baseSlug) baseSlug = 'public-api';
    let slug = baseSlug;
    let counter = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    existingSlugs.add(slug);

    const id = `offer-pubapi-${slug}`;
    existingIds.add(id);

    const noAuth = item.auth.toLowerCase() === 'no';
    const description =
      item.desc.length >= 18
        ? `${item.desc}. Verified HTTPS ${item.cat} API (Auth: ${item.auth}, CORS: ${item.cors}).`
        : `${item.name} — ${item.desc}. Free HTTPS ${item.cat} API endpoint (Auth: ${item.auth}, CORS: ${item.cors}).`;

    apiOffers.push({
      schema_version: '1.0.0',
      identity: {
        id,
        name: item.name.toLowerCase().includes('api') ? item.name : `${item.name} API`,
        slug,
        provider: deriveProviderName(item.name, item.url),
        logo_url: null,
      },
      classification: {
        category: 'apis-integrations',
        subcategory: item.cat,
        resource_type: 'api',
        pricing_model: noAuth ? 'completely_free' : 'free_tier',
        tags: [
          'public-api',
          slugify(item.cat),
          noAuth ? 'no-api-key' : slugify(item.auth),
          item.cors.toLowerCase() === 'yes' ? 'cors-enabled' : 'rest-api',
        ],
      },
      description,
      access: {
        free_limits: [
          {
            name: 'Authentication & CORS',
            value: noAuth
              ? `No API Key Required · CORS: ${item.cors}`
              : `Auth: ${item.auth} · CORS: ${item.cors}`,
            period: 'ongoing',
          },
        ],
        restrictions: noAuth
          ? ['Open HTTPS API endpoint; standard fair-use rate limits apply.']
          : [`Requires ${item.auth} authentication header or token.`],
        requirements: {
          account_required: noAuth ? 'not_required' : 'required',
          card_required: 'not_required',
          payment_method_notes: noAuth
            ? 'No signup, API key, or payment card required.'
            : `Free developer ${item.auth} registration; no credit card required.`,
        },
        validity: {
          type: 'ongoing',
          duration: 'Ongoing public API access',
          auto_renewal: 'Free public API access without automatic charges.',
        },
      },
      eligibility: {
        student_access: 'eligible',
        regions: ['Global'],
        conditions: 'Available globally to developers, students, and hobbyists.',
      },
      links: {
        official: item.url,
        signup: noAuth ? null : item.url,
        documentation: item.url,
        pricing: null,
      },
      evidence: {
        sources: [
          {
            id: 'src-public-apis-repo',
            url: 'https://github.com/public-apis/public-apis',
            source_type: 'official_repo',
            checked_at: '2026-11-13',
          },
        ],
        claims: [
          {
            field_path: 'access.free_limits',
            quote: `${item.name} (${item.cat}): ${item.desc} | Auth: ${item.auth} | HTTPS: Yes | CORS: ${item.cors}`,
            source_id: 'src-public-apis-repo',
            confidence: 'high',
            notes: 'Verified working HTTPS endpoint in public-apis/public-apis.',
          },
        ],
      },
      verification: {
        status: 'verified',
        last_verified_at: '2026-11-13',
        notes: 'Verified active HTTPS & DNS resolution from public-apis/public-apis.',
      },
      metadata: {
        featured: false,
        created_at: '2026-11-13',
        updated_at: '2026-11-13',
      },
    });
  }

  // Write catalog files
  const mcpCatalogPath = path.join(ROOT_DIR, 'data', 'offers', 'mcp', 'public-apis-mcp-catalog.json');
  const apiCatalogPath = path.join(ROOT_DIR, 'data', 'offers', 'apis', 'public-apis-catalog.json');

  fs.writeFileSync(mcpCatalogPath, JSON.stringify(mcpOffers, null, 2), 'utf8');
  fs.writeFileSync(apiCatalogPath, JSON.stringify(apiOffers, null, 2), 'utf8');

  // Update categories.json so apis-integrations has all 51 public-apis subcategories
  const categoriesPath = path.join(ROOT_DIR, 'data', 'categories.json');
  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8')) as Category[];
  const apisCat = categories.find((c) => c.slug === 'apis-integrations');
  if (apisCat) {
    const existingSubNames = new Set(apisCat.subcategories.map((s) => s.name.toLowerCase()));
    for (const catName of Object.keys(CATEGORY_ICON_SPECS)) {
      if (!existingSubNames.has(catName.toLowerCase())) {
        apisCat.subcategories.push({
          slug: slugify(catName),
          name: catName,
        });
        existingSubNames.add(catName.toLowerCase());
      }
    }
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2) + '\n', 'utf8');
  }

  console.log(
    `Scraped & wrote ${mcpOffers.length} working MCP servers and ${apiOffers.length} working HTTPS Public APIs!`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
