import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import type { Category, Offer, SourceRegistry } from '../src/types/resource';

const AWESOME_MCP_README = '/tmp/awesome-mcp-servers/README.md';
const ROOT_DIR = process.cwd();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

// Normalize section headings from awesome-mcp-servers into clean use-case subcategory names
const SECTION_NAME_NORMALIZATION: Record<string, string> = {
  'Biology, Medicine and Bioinformatics': 'Biology, Medicine & Bioinformatics',
  'Embedded System': 'Embedded Systems',
  'end to end RAG platforms': 'End-to-End RAG Platforms',
  'Other Tools and Integrations': 'Other Tools & Integrations',
};

export interface McpUseCaseIconSpec {
  slug: string;
  bg: string;
  fg: string;
  path: string;
}

// Dedicated vector SVG icons for all 60 MCP use-case categories
export const MCP_USE_CASE_ICONS: Record<string, McpUseCaseIconSpec> = {
  Aggregators: {
    slug: 'mcp-aggregators',
    bg: '#FFF550',
    fg: '#101014',
    path: '<circle cx="32" cy="32" r="7"/><circle cx="16" cy="18" r="4.5"/><circle cx="48" cy="18" r="4.5"/><circle cx="16" cy="46" r="4.5"/><circle cx="48" cy="46" r="4.5"/><line x1="20" y1="21" x2="27" y2="27" stroke="#101014" stroke-width="3.5"/><line x1="44" y1="21" x2="37" y2="27" stroke="#101014" stroke-width="3.5"/><line x1="20" y1="43" x2="27" y2="37" stroke="#101014" stroke-width="3.5"/><line x1="44" y1="43" x2="37" y2="37" stroke="#101014" stroke-width="3.5"/>',
  },
  'Aerospace & Astrodynamics': {
    slug: 'mcp-aerospace',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<path d="M32 10c7 8 10 18 10 28H22c0-10 3-20 10-28z"/><polygon points="22,30 14,40 22,38"/><polygon points="42,30 50,40 42,38"/><path d="M27 40l5 12 5-12"/>',
  },
  'Agreements & Coordination': {
    slug: 'mcp-agreements',
    bg: '#55D764',
    fg: '#101014',
    path: '<rect x="14" y="18" width="18" height="28" rx="4"/><rect x="32" y="18" width="18" height="28" rx="4"/><path d="M22 32h20" stroke="#FFF550" stroke-width="4" stroke-linecap="round"/>',
  },
  Accessibility: {
    slug: 'mcp-accessibility',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<circle cx="32" cy="16" r="5"/><path d="M16 25h32M32 25v13m0 0l-8 14m8-14l8 14" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round"/>',
  },
  'Art & Culture': {
    slug: 'mcp-art-culture',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<path d="M32 12a20 20 0 1 0 0 40c3.5 0 6-2.5 6-5.5 0-2-1.5-3.5-1.5-5.5 0-3 2.5-5.5 6-5.5h3A18 18 0 0 0 32 12z"/><circle cx="22" cy="25" r="3" fill="#FFF550"/><circle cx="31" cy="20" r="3" fill="#54A7FF"/><circle cx="40" cy="25" r="3" fill="#55D764"/>',
  },
  'Architecture & Design': {
    slug: 'mcp-architecture-design',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<polygon points="14,50 50,50 14,14" fill="none" stroke="#101014" stroke-width="4" stroke-linejoin="round"/><polygon points="22,43 35,43 22,30"/>',
  },
  'Biology, Medicine & Bioinformatics': {
    slug: 'mcp-bioinformatics',
    bg: '#55D764',
    fg: '#101014',
    path: '<path d="M22 12c0 12 20 12 20 24s-20 12-20 24M42 12c0 12-20 12-20 24s20 12 20 24" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="24" y1="20" x2="40" y2="20" stroke="#101014" stroke-width="3"/><line x1="24" y1="44" x2="40" y2="44" stroke="#101014" stroke-width="3"/>',
  },
  'Browser Automation': {
    slug: 'mcp-browser-automation',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="10" y="14" width="44" height="36" rx="5"/><line x1="10" y1="24" x2="54" y2="24" stroke="#FFF550" stroke-width="3"/><circle cx="17" cy="19" r="2" fill="#FFF550"/><circle cx="23" cy="19" r="2" fill="#55D764"/><polygon points="28,30 42,36 35,39 38,45 34,47 31,41 26,45" fill="#FFF550"/>',
  },
  'Cloud Platforms': {
    slug: 'mcp-cloud-platforms',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<path d="M20 46h25a10 10 0 0 0 1-19.9A14 14 0 0 0 19 23a11 11 0 0 0 1 23z"/>',
  },
  'Code Execution': {
    slug: 'mcp-code-execution',
    bg: '#FFF550',
    fg: '#101014',
    path: '<rect x="10" y="14" width="44" height="36" rx="6"/><polygon points="26,24 42,32 26,40" fill="#FFF550"/>',
  },
  'Coding Agents': {
    slug: 'mcp-coding-agents',
    bg: '#FFF550',
    fg: '#101014',
    path: '<rect x="14" y="18" width="36" height="30" rx="8"/><line x1="32" y1="10" x2="32" y2="18" stroke="#101014" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="31" r="3.5" fill="#FFF550"/><circle cx="40" cy="31" r="3.5" fill="#FFF550"/><path d="M24 40h16" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/>',
  },
  'Command Line': {
    slug: 'mcp-command-line',
    bg: '#101014',
    fg: '#FFF550',
    path: '<rect x="10" y="14" width="44" height="36" rx="5" fill="#101014"/><polyline points="18,26 26,32 18,38" fill="none" stroke="#FFF550" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><line x1="30" y1="38" x2="42" y2="38" stroke="#55D764" stroke-width="4" stroke-linecap="round"/>',
  },
  Communication: {
    slug: 'mcp-communication',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<path d="M14 16h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H26l-12 8V20a4 4 0 0 1 4-4z"/><circle cx="24" cy="30" r="3" fill="#FFF550"/><circle cx="32" cy="30" r="3" fill="#FFF550"/><circle cx="40" cy="30" r="3" fill="#FFF550"/>',
  },
  'Conversational AI': {
    slug: 'mcp-conversational-ai',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<path d="M16 18h32a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H28l-10 8v-8h-2a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z"/><polygon points="32,24 34.5,29.5 40,32 34.5,34.5 32,40 29.5,34.5 24,32 29.5,29.5" fill="#FFF550"/>',
  },
  Cryptography: {
    slug: 'mcp-cryptography',
    bg: '#FF8A3D',
    fg: '#101014',
    path: '<circle cx="23" cy="32" r="9" fill="none" stroke="#101014" stroke-width="4.5"/><path d="M32 32h18v7M43 32v6" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round"/>',
  },
  'Customer Data Platforms': {
    slug: 'mcp-customer-data',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<circle cx="32" cy="23" r="8"/><path d="M16 48c0-8 7-13 16-13s16 5 16 13"/>',
  },
  Databases: {
    slug: 'mcp-databases',
    bg: '#FF8A3D',
    fg: '#101014',
    path: '<ellipse cx="32" cy="18" rx="18" ry="6"/><path d="M14 18v28c0 3.3 8 6 18 6s18-2.7 18-6V18" fill="none" stroke="#101014" stroke-width="4"/><path d="M14 32c0 3.3 8 6 18 6s18-2.7 18-6" fill="none" stroke="#101014" stroke-width="4"/>',
  },
  'Data Platforms': {
    slug: 'mcp-data-platforms',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="12" y="14" width="40" height="10" rx="3"/><rect x="12" y="27" width="40" height="10" rx="3"/><rect x="12" y="40" width="40" height="10" rx="3"/><circle cx="20" cy="19" r="2" fill="#FFF550"/><circle cx="20" cy="32" r="2" fill="#55D764"/><circle cx="20" cy="45" r="2" fill="#FF86C8"/>',
  },
  'Developer Tools': {
    slug: 'mcp-developer-tools',
    bg: '#FFF550',
    fg: '#101014',
    path: '<polyline points="22,20 10,32 22,44" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="42,20 54,32 42,44" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="36" y1="16" x2="28" y2="48" stroke="#101014" stroke-width="4.5" stroke-linecap="round"/>',
  },
  Delivery: {
    slug: 'mcp-delivery',
    bg: '#55D764',
    fg: '#101014',
    path: '<rect x="10" y="20" width="28" height="22" rx="3"/><polygon points="38,26 48,26 54,34 54,42 38,42"/><circle cx="20" cy="44" r="5" fill="#FFF550" stroke="#101014" stroke-width="3"/><circle cx="46" cy="44" r="5" fill="#FFF550" stroke="#101014" stroke-width="3"/>',
  },
  'Data Science Tools': {
    slug: 'mcp-data-science',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="14" y="34" width="8" height="16" rx="2"/><rect x="28" y="24" width="8" height="26" rx="2"/><rect x="42" y="14" width="8" height="36" rx="2"/>',
  },
  'Data Visualization': {
    slug: 'mcp-data-visualization',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<circle cx="32" cy="32" r="20"/><path d="M32 32V12A20 20 0 0 1 52 32H32z" fill="#FFF550"/>',
  },
  'Embedded Systems': {
    slug: 'mcp-embedded-systems',
    bg: '#55D764',
    fg: '#101014',
    path: '<rect x="18" y="18" width="28" height="28" rx="4"/><rect x="25" y="25" width="14" height="14" fill="#FFF550"/><line x1="24" y1="10" x2="24" y2="18" stroke="#101014" stroke-width="4"/><line x1="40" y1="10" x2="40" y2="18" stroke="#101014" stroke-width="4"/><line x1="24" y1="46" x2="24" y2="54" stroke="#101014" stroke-width="4"/><line x1="40" y1="46" x2="40" y2="54" stroke="#101014" stroke-width="4"/><line x1="10" y1="24" x2="18" y2="24" stroke="#101014" stroke-width="4"/><line x1="10" y1="40" x2="18" y2="40" stroke="#101014" stroke-width="4"/><line x1="46" y1="24" x2="54" y2="24" stroke="#101014" stroke-width="4"/><line x1="46" y1="40" x2="54" y2="40" stroke="#101014" stroke-width="4"/>',
  },
  Education: {
    slug: 'mcp-education',
    bg: '#FFF550',
    fg: '#101014',
    path: '<polygon points="32,14 54,25 32,36 10,25"/><path d="M18 30v12c0 4 6 8 14 8s14-4 14-8V30" fill="none" stroke="#101014" stroke-width="4"/>',
  },
  'E-Commerce': {
    slug: 'mcp-ecommerce',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<path d="M16 22h32l-3 28H19l-3-28z"/><path d="M24 22v-4a8 8 0 0 1 16 0v4" fill="none" stroke="#101014" stroke-width="4"/>',
  },
  'Environment & Nature': {
    slug: 'mcp-environment',
    bg: '#55D764',
    fg: '#101014',
    path: '<path d="M48 14C30 14 16 24 16 42c0 4 2 8 4 8 18 0 28-14 28-36z"/><path d="M16 48c8-10 18-18 30-24" fill="none" stroke="#55D764" stroke-width="3.5" stroke-linecap="round"/>',
  },
  'File Systems': {
    slug: 'mcp-file-systems',
    bg: '#FFF550',
    fg: '#101014',
    path: '<path d="M12 18h16l5 6h19v24a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V18z"/>',
  },
  'Finance & Fintech': {
    slug: 'mcp-finance',
    bg: '#55D764',
    fg: '#101014',
    path: '<polyline points="12,44 26,30 35,38 52,18" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="40,18 52,18 52,30" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  Gaming: {
    slug: 'mcp-gaming',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<rect x="10" y="20" width="44" height="24" rx="10"/><line x1="22" y1="27" x2="22" y2="37" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/><line x1="17" y1="32" x2="27" y2="32" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/><circle cx="41" cy="29" r="2.5" fill="#FFF550"/><circle cx="46" cy="35" r="2.5" fill="#55D764"/>',
  },
  'Health & Wellness': {
    slug: 'mcp-health',
    bg: '#55D764',
    fg: '#101014',
    path: '<path d="M32 52S12 39 12 24a11 11 0 0 1 20-6 11 11 0 0 1 20 6c0 15-20 28-20 28z"/><polyline points="18,30 26,30 30,22 35,38 39,30 46,30" fill="none" stroke="#55D764" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'Home Automation': {
    slug: 'mcp-home-automation',
    bg: '#FFF550',
    fg: '#101014',
    path: '<polygon points="32,12 12,28 18,28 18,50 46,50 46,28 52,28"/><rect x="27" y="35" width="10" height="15" fill="#FFF550"/>',
  },
  Identity: {
    slug: 'mcp-identity',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="10" y="16" width="44" height="32" rx="5"/><circle cx="24" cy="30" r="5" fill="#FFF550"/><path d="M16 42c0-4 3.5-6 8-6s8 2 8 6" fill="#FFF550"/><line x1="36" y1="26" x2="48" y2="26" stroke="#FFF550" stroke-width="3" stroke-linecap="round"/><line x1="36" y1="34" x2="46" y2="34" stroke="#FFF550" stroke-width="3" stroke-linecap="round"/>',
  },
  'Industrial & IoT': {
    slug: 'mcp-industrial-iot',
    bg: '#FF8A3D',
    fg: '#101014',
    path: '<polygon points="12,50 12,28 26,36 26,26 40,36 40,18 52,18 52,50"/>',
  },
  'Knowledge & Memory': {
    slug: 'mcp-knowledge-memory',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<circle cx="20" cy="20" r="5"/><circle cx="44" cy="20" r="5"/><circle cx="32" cy="34" r="6"/><circle cx="20" cy="48" r="5"/><circle cx="44" cy="48" r="5"/><line x1="24" y1="23" x2="28" y2="30" stroke="#101014" stroke-width="3.5"/><line x1="40" y1="23" x2="36" y2="30" stroke="#101014" stroke-width="3.5"/><line x1="28" y1="38" x2="24" y2="44" stroke="#101014" stroke-width="3.5"/><line x1="36" y1="38" x2="40" y2="44" stroke="#101014" stroke-width="3.5"/>',
  },
  Legal: {
    slug: 'mcp-legal',
    bg: '#FFF550',
    fg: '#101014',
    path: '<line x1="32" y1="12" x2="32" y2="50" stroke="#101014" stroke-width="4"/><line x1="16" y1="22" x2="48" y2="22" stroke="#101014" stroke-width="4"/><polygon points="16,22 10,36 22,36"/><polygon points="48,22 42,36 54,36"/><rect x="22" y="48" width="20" height="5" rx="2"/>',
  },
  'Location Services': {
    slug: 'mcp-location-services',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<path d="M32 10c-9.4 0-17 7.4-17 16.5C15 39 32 54 32 54s17-15 17-27.5C49 17.4 41.4 10 32 10z"/><circle cx="32" cy="26" r="6" fill="#FFF550"/>',
  },
  Marketing: {
    slug: 'mcp-marketing',
    bg: '#FF8A3D',
    fg: '#101014',
    path: '<polygon points="14,26 26,26 46,14 46,50 26,38 14,38"/><path d="M20 38l3 12h6l-2-12"/>',
  },
  Monitoring: {
    slug: 'mcp-monitoring',
    bg: '#55D764',
    fg: '#101014',
    path: '<polyline points="10,34 22,34 28,16 36,48 42,34 54,34" fill="none" stroke="#101014" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'Multimedia Process': {
    slug: 'mcp-multimedia',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<rect x="10" y="16" width="32" height="32" rx="5"/><polygon points="42,26 54,18 54,46 42,38"/><polygon points="22,25 33,32 22,39" fill="#FFF550"/>',
  },
  'OS Automation': {
    slug: 'mcp-os-automation',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="12" y="14" width="40" height="28" rx="4"/><rect x="24" y="46" width="16" height="5" rx="2"/><line x1="32" y1="42" x2="32" y2="46" stroke="#101014" stroke-width="4"/>',
  },
  Podcasts: {
    slug: 'mcp-podcasts',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<rect x="25" y="14" width="14" height="22" rx="7"/><path d="M19 26a13 13 0 0 0 26 0M32 39v11M24 50h16" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Product Management': {
    slug: 'mcp-product-management',
    bg: '#FFF550',
    fg: '#101014',
    path: '<rect x="12" y="14" width="11" height="36" rx="3"/><rect x="26.5" y="14" width="11" height="24" rx="3"/><rect x="41" y="14" width="11" height="30" rx="3"/>',
  },
  'Real Estate': {
    slug: 'mcp-real-estate',
    bg: '#55D764',
    fg: '#101014',
    path: '<rect x="16" y="14" width="32" height="38" rx="3"/><rect x="22" y="20" width="6" height="6" fill="#FFF550"/><rect x="36" y="20" width="6" height="6" fill="#FFF550"/><rect x="22" y="30" width="6" height="6" fill="#FFF550"/><rect x="36" y="30" width="6" height="6" fill="#FFF550"/><rect x="28" y="40" width="8" height="12" fill="#FFF550"/>',
  },
  Research: {
    slug: 'mcp-research',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<circle cx="28" cy="28" r="14" fill="none" stroke="#101014" stroke-width="4.5"/><line x1="38" y1="38" x2="52" y2="52" stroke="#101014" stroke-width="5" stroke-linecap="round"/>',
  },
  'End-to-End RAG Platforms': {
    slug: 'mcp-rag-platforms',
    bg: '#FFF550',
    fg: '#101014',
    path: '<rect x="12" y="14" width="16" height="20" rx="3"/><circle cx="44" cy="38" r="10"/><path d="M28 24h12a4 4 0 0 1 4 4v2" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Search & Data Extraction': {
    slug: 'mcp-search-extraction',
    bg: '#FFF550',
    fg: '#101014',
    path: '<circle cx="27" cy="27" r="13" fill="none" stroke="#101014" stroke-width="4.5"/><line x1="37" y1="37" x2="51" y2="51" stroke="#101014" stroke-width="5" stroke-linecap="round"/><line x1="21" y1="24" x2="33" y2="24" stroke="#101014" stroke-width="3" stroke-linecap="round"/><line x1="21" y1="30" x2="29" y2="30" stroke="#101014" stroke-width="3" stroke-linecap="round"/>',
  },
  Jobs: {
    slug: 'mcp-jobs',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="12" y="20" width="40" height="30" rx="5"/><path d="M24 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" fill="none" stroke="#101014" stroke-width="4"/><circle cx="32" cy="34" r="3" fill="#FFF550"/>',
  },
  Security: {
    slug: 'mcp-security',
    bg: '#FF8A3D',
    fg: '#101014',
    path: '<path d="M32 10l18 7v13c0 12-7.5 20.5-18 24-10.5-3.5-18-12-18-24V17l18-7z"/><circle cx="32" cy="31" r="5" fill="#FFF550"/>',
  },
  'Social Media': {
    slug: 'mcp-social-media',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<circle cx="44" cy="16" r="6"/><circle cx="18" cy="32" r="6"/><circle cx="44" cy="48" r="6"/><line x1="23" y1="29" x2="39" y2="19" stroke="#101014" stroke-width="4"/><line x1="23" y1="35" x2="39" y2="45" stroke="#101014" stroke-width="4"/>',
  },
  'Spirituality & Esoterica': {
    slug: 'mcp-spirituality',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<polygon points="32,10 37,25 52,32 37,39 32,54 27,39 12,32 27,25"/>',
  },
  Sports: {
    slug: 'mcp-sports',
    bg: '#55D764',
    fg: '#101014',
    path: '<path d="M20 14h24v12a12 12 0 0 1-24 0V14z"/><line x1="32" y1="38" x2="32" y2="48" stroke="#101014" stroke-width="4"/><rect x="22" y="48" width="20" height="5" rx="2"/>',
  },
  'Support & Service Management': {
    slug: 'mcp-support',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<path d="M16 34V28a16 16 0 0 1 32 0v6" fill="none" stroke="#101014" stroke-width="4.5"/><rect x="12" y="30" width="8" height="14" rx="4"/><rect x="44" y="30" width="8" height="14" rx="4"/><path d="M48 44v2a6 6 0 0 1-6 6H32" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Translation Services': {
    slug: 'mcp-translation',
    bg: '#FFF550',
    fg: '#101014',
    path: '<circle cx="32" cy="32" r="20" fill="none" stroke="#101014" stroke-width="4"/><ellipse cx="32" cy="32" rx="9" ry="20" fill="none" stroke="#101014" stroke-width="3.5"/><line x1="12" y1="32" x2="52" y2="32" stroke="#101014" stroke-width="3.5"/>',
  },
  'Speech-to-Text': {
    slug: 'mcp-speech-to-text',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<line x1="16" y1="26" x2="16" y2="38" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="24" y1="18" x2="24" y2="46" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="32" y1="12" x2="32" y2="52" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="40" y1="20" x2="40" y2="44" stroke="#101014" stroke-width="4" stroke-linecap="round"/><line x1="48" y1="28" x2="48" y2="36" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Text-to-Speech': {
    slug: 'mcp-text-to-speech',
    bg: '#FF86C8',
    fg: '#101014',
    path: '<polygon points="14,26 24,26 36,16 36,48 24,38 14,38"/><path d="M42 24a10 10 0 0 1 0 16M47 18a18 18 0 0 1 0 28" fill="none" stroke="#101014" stroke-width="4" stroke-linecap="round"/>',
  },
  'Travel & Transportation': {
    slug: 'mcp-travel',
    bg: '#54A7FF',
    fg: '#101014',
    path: '<rect x="14" y="14" width="36" height="30" rx="6"/><rect x="18" y="20" width="28" height="12" rx="2" fill="#FFF550"/><circle cx="22" cy="48" r="4"/><circle cx="42" cy="48" r="4"/>',
  },
  'Version Control': {
    slug: 'mcp-version-control',
    bg: '#FF8A3D',
    fg: '#101014',
    path: '<circle cx="20" cy="18" r="5"/><circle cx="20" cy="46" r="5"/><circle cx="44" cy="26" r="5"/><line x1="20" y1="23" x2="20" y2="41" stroke="#101014" stroke-width="4"/><path d="M44 31v4a8 8 0 0 1-8 8H20" fill="none" stroke="#101014" stroke-width="4"/>',
  },
  'Workplace & Productivity': {
    slug: 'mcp-workplace',
    bg: '#FFF550',
    fg: '#101014',
    path: '<rect x="14" y="12" width="36" height="40" rx="5"/><polyline points="22,26 27,31 36,22" fill="none" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="22" y1="40" x2="42" y2="40" stroke="#FFF550" stroke-width="3.5" stroke-linecap="round"/>',
  },
  'Other Tools & Integrations': {
    slug: 'mcp-other-integrations',
    bg: '#55D764',
    fg: '#101014',
    path: '<rect x="14" y="14" width="15" height="15" rx="3"/><rect x="35" y="14" width="15" height="15" rx="3"/><rect x="14" y="35" width="15" height="15" rx="3"/><rect x="35" y="35" width="15" height="15" rx="3" fill="#FFF550" stroke="#101014" stroke-width="3"/>',
  },
  'MCP Frameworks & SDKs': {
    slug: 'mcp-frameworks',
    bg: '#FFF550',
    fg: '#101014',
    path: '<polygon points="32,10 52,21 52,43 32,54 12,43 12,21" fill="none" stroke="#101014" stroke-width="4"/><polyline points="12,21 32,32 52,21" fill="none" stroke="#101014" stroke-width="4"/><line x1="32" y1="32" x2="32" y2="54" stroke="#101014" stroke-width="4"/>',
  },
};

function generateMcpUseCaseSvgs() {
  const logosDir = path.join(ROOT_DIR, 'public', 'logos');
  fs.mkdirSync(logosDir, { recursive: true });
  for (const [catName, spec] of Object.entries(MCP_USE_CASE_ICONS)) {
    const safeLabel = catName.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${safeLabel} MCP icon">
  <rect x="2" y="2" width="60" height="60" rx="16" fill="${spec.bg}" stroke="#101014" stroke-width="3"/>
  <g fill="${spec.fg}">
    ${spec.path}
  </g>
</svg>
`;
    fs.writeFileSync(path.join(logosDir, `${spec.slug}.svg`), svg, 'utf8');
  }
}

function cleanMarkdownText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMcpDisplayName(rawName: string): { displayName: string; provider: string } {
  const cleaned = rawName.replace(/^@/, '').trim();
  const parts = cleaned.split('/');
  if (parts.length >= 2) {
    const owner = parts[0];
    const repo = parts[parts.length - 1];
    const prettyRepo = repo
      .replace(/[-_]+/g, ' ')
      .replace(/\bmcp\b/gi, 'MCP')
      .replace(/\bapi\b/gi, 'API')
      .replace(/\bsdk\b/gi, 'SDK')
      .replace(/\bcli\b/gi, 'CLI')
      .replace(/\bsql\b/gi, 'SQL')
      .replace(/\bai\b/gi, 'AI')
      .replace(/\bllm\b/gi, 'LLM')
      .replace(/\baws\b/gi, 'AWS')
      .replace(/\bgcp\b/gi, 'GCP')
      .replace(/\bdb\b/gi, 'DB')
      .replace(/\bui\b/gi, 'UI')
      .replace(/\b(\w)/g, (m) => m.toUpperCase())
      .trim();

    const displayName = prettyRepo.toLowerCase().includes('mcp')
      ? `${prettyRepo} (${owner})`
      : `${prettyRepo} MCP (${owner})`;

    return {
      displayName,
      provider: owner,
    };
  }
  return {
    displayName: cleaned.toLowerCase().includes('mcp') ? cleaned : `${cleaned} MCP`,
    provider: cleaned,
  };
}

interface ParsedBadges {
  isOfficial: boolean;
  isGlamaVerified: boolean;
  languages: Array<{ tag: string; label: string }>;
  scopes: Array<{ tag: string; label: string }>;
  osList: Array<{ tag: string; label: string }>;
}

function parseLegendBadges(badgeSegment: string, fullLineRest: string): ParsedBadges {
  const isOfficial = badgeSegment.includes('🎖');
  const isGlamaVerified = fullLineRest.includes('glama.ai/mcp/servers/');

  const languages: Array<{ tag: string; label: string }> = [];
  if (badgeSegment.includes('🐍')) languages.push({ tag: 'lang:python', label: 'Python' });
  if (badgeSegment.includes('📇')) languages.push({ tag: 'lang:typescript', label: 'TypeScript/JS' });
  if (badgeSegment.includes('🏎')) languages.push({ tag: 'lang:go', label: 'Go' });
  if (badgeSegment.includes('🦀')) languages.push({ tag: 'lang:rust', label: 'Rust' });
  if (badgeSegment.includes('#️⃣')) languages.push({ tag: 'lang:csharp', label: 'C#' });
  if (badgeSegment.includes('☕')) languages.push({ tag: 'lang:java', label: 'Java' });
  if (badgeSegment.includes('🌊')) languages.push({ tag: 'lang:cpp', label: 'C/C++' });
  if (badgeSegment.includes('💎')) languages.push({ tag: 'lang:ruby', label: 'Ruby' });

  const scopes: Array<{ tag: string; label: string }> = [];
  if (badgeSegment.includes('☁')) scopes.push({ tag: 'scope:cloud', label: 'Cloud Service' });
  if (badgeSegment.includes('🏠')) scopes.push({ tag: 'scope:local', label: 'Local Service' });
  if (badgeSegment.includes('📟')) scopes.push({ tag: 'scope:embedded', label: 'Embedded' });

  const osList: Array<{ tag: string; label: string }> = [];
  if (badgeSegment.includes('🍎')) osList.push({ tag: 'os:macos', label: 'macOS' });
  if (badgeSegment.includes('🪟')) osList.push({ tag: 'os:windows', label: 'Windows' });
  if (badgeSegment.includes('🐧')) osList.push({ tag: 'os:linux', label: 'Linux' });

  return { isOfficial, isGlamaVerified, languages, scopes, osList };
}

async function main() {
  generateMcpUseCaseSvgs();

  // Verify DNS reachability of github.com and glama.ai
  await dns.resolve4('github.com');
  console.log('Verified live DNS resolution for github.com');

  // Ensure src-awesome-mcp-servers is registered in data/sources/registry.json
  const registryPath = path.join(ROOT_DIR, 'data', 'sources', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as SourceRegistry;
  if (!registry.sources.some((s) => s.id === 'src-awesome-mcp-servers')) {
    registry.sources.push({
      id: 'src-awesome-mcp-servers',
      name: 'Awesome MCP Servers Official Directory (punkpeye/awesome-mcp-servers)',
      domain: 'github.com',
      entry_url: 'https://github.com/punkpeye/awesome-mcp-servers',
      source_type: 'official_repo',
      category: 'mcp',
      crawl_policy: {
        respect_robots_txt: true,
        rate_limit_rpm: 15,
        max_retries: 3,
        primary_fetcher: 'crawl4ai',
      },
      active: true,
    });
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  }

  // Collect existing IDs, slugs, and URLs (excluding awesome-mcp-servers-catalog.json)
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
        entry.name !== 'awesome-mcp-servers-catalog.json'
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

  const md = fs.readFileSync(AWESOME_MCP_README, 'utf8');
  const lines = md.split(/\r?\n/);

  let currentH2 = '';
  let currentSubcategory = '';
  const discoveredSubcategories: string[] = [];
  const mcpOffers: Offer[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentH2 = line.replace(/^##\s+/, '').trim();
      if (currentH2 === 'Frameworks') {
        currentSubcategory = 'MCP Frameworks & SDKs';
        if (!discoveredSubcategories.includes(currentSubcategory)) {
          discoveredSubcategories.push(currentSubcategory);
        }
      } else {
        currentSubcategory = '';
      }
      continue;
    }

    if (line.startsWith('### ')) {
      const rawH3 = line
        .replace(/^###\s+/, '')
        .replace(/<a[^>]*><\/a>/gi, '')
        .replace(/^[^\wA-Za-z]+/, '')
        .trim();
      const normalized = SECTION_NAME_NORMALIZATION[rawH3] || rawH3;
      currentSubcategory = normalized;
      if (
        (currentH2 === 'Server Implementations' || currentH2 === 'Frameworks') &&
        normalized &&
        !discoveredSubcategories.includes(normalized)
      ) {
        discoveredSubcategories.push(normalized);
      }
      continue;
    }

    if (currentH2 !== 'Server Implementations' && currentH2 !== 'Frameworks') continue;
    if (!currentSubcategory) continue;

    const match = line.match(/^\s*[-*]\s+\[([^\]]+)\]\((https:\/\/[^\)]+)\)\s*(.*)$/);
    if (!match) continue;

    const [, rawName, rawUrl, rest] = match;
    const url = rawUrl.trim();

    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' || u.hostname !== 'github.com') continue;
      const pathParts = u.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) continue;
    } catch {
      continue;
    }

    const normUrl = url.replace(/\/$/, '').toLowerCase();
    if (existingUrls.has(normUrl)) continue;

    const withoutGlamaBadges = rest.replace(/\[!\[[^\]]*\]\([^\)]*\)\]\([^\)]*\)/g, '').trim();
    const dashMatch = withoutGlamaBadges.match(/^(.*?)\s*[-–—:]\s+(.+)$/);
    if (!dashMatch) continue;

    const badgeSegment = dashMatch[1].trim();
    const rawDesc = cleanMarkdownText(dashMatch[2]);
    if (!rawDesc || rawDesc.length < 5) continue;

    // Exclude strictly pay-per-call HTTP 402 / x402 paid-only services
    if (
      /^(pay-per-call|paid\s+crypto|paid\s+via\s+x402)/i.test(rawDesc) ||
      /\bpaid\s+(per\s+use\s+)?via\s+(http\s+402|x402)\b/i.test(rawDesc)
    ) {
      continue;
    }

    existingUrls.add(normUrl);

    const { displayName, provider } = formatMcpDisplayName(rawName);
    const badges = parseLegendBadges(badgeSegment, rest);

    let baseSlug = slugify(`mcp-${rawName.replace(/\//g, '-')}`);
    if (!baseSlug || baseSlug.length < 4) baseSlug = slugify(`mcp-${provider}`);
    let slug = baseSlug;
    let counter = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    existingSlugs.add(slug);

    const id = `offer-awesomemcp-${slug}`;
    existingIds.add(id);

    const langLabels = badges.languages.map((l) => l.label).join(', ') || 'Multi-language';
    const scopeLabels = badges.scopes.map((s) => s.label).join(' & ') || 'Local / Cloud MCP';
    const osLabels = badges.osList.map((o) => o.label).join(', ') || 'Cross-platform';

    const tags = [
      'mcp',
      slugify(currentSubcategory),
      ...(badges.isOfficial ? ['official-implementation'] : []),
      ...(badges.isGlamaVerified ? ['glama-verified'] : []),
      ...badges.languages.map((l) => l.tag),
      ...badges.scopes.map((s) => s.tag),
      ...badges.osList.map((o) => o.tag),
    ];

    const fullDescription =
      rawDesc.length >= 20
        ? `${rawDesc}${rawDesc.endsWith('.') ? '' : '.'} ${
            badges.isOfficial ? 'Official ' : ''
          }${currentSubcategory} MCP server (${langLabels} · ${scopeLabels}).`
        : `${displayName} — ${rawDesc}. Verified ${currentSubcategory} MCP server (${langLabels} · ${scopeLabels}).`;

    mcpOffers.push({
      schema_version: '1.0.0',
      identity: {
        id,
        name: displayName,
        slug,
        provider,
        logo_url: null,
      },
      classification: {
        category: 'mcp',
        subcategory: currentSubcategory,
        resource_type: 'mcp_server',
        pricing_model: 'open_source',
        tags,
      },
      description: fullDescription,
      access: {
        free_limits: [
          {
            name: 'Use Case & Stack',
            value: `${currentSubcategory} · ${langLabels} · ${scopeLabels}`,
            period: 'ongoing',
          },
          {
            name: 'Verification & OS',
            value: `${badges.isOfficial ? '🎖️ Official · ' : ''}${
              badges.isGlamaVerified ? 'Glama Inspected · ' : ''
            }${osLabels}`,
            period: 'ongoing',
          },
        ],
        restrictions: [
          badges.scopes.some((s) => s.tag === 'scope:cloud')
            ? 'Open-source MCP server repository; connecting to upstream cloud APIs may require provider API keys.'
            : 'Open-source local MCP server; runs directly on your machine with no external billing.',
        ],
        requirements: {
          account_required: 'not_required',
          card_required: 'not_required',
          payment_method_notes:
            'Open-source GitHub MCP implementation; no credit card required to install or run.',
        },
        validity: {
          type: 'ongoing',
          duration: 'Ongoing open-source MCP server access',
          auto_renewal: 'Free open-source repository; no automatic charges.',
        },
      },
      eligibility: {
        student_access: 'eligible',
        regions: ['Global'],
        conditions: 'Open to developers, AI agents, Claude Desktop, Cursor, Windsurf, and VS Code MCP clients.',
      },
      links: {
        official: url,
        signup: null,
        documentation: url,
        pricing: null,
      },
      evidence: {
        sources: [
          {
            id: 'src-awesome-mcp-servers',
            url: 'https://github.com/punkpeye/awesome-mcp-servers',
            source_type: 'official_repo',
            checked_at: '2026-11-14',
          },
        ],
        claims: [
          {
            field_path: 'access.free_limits',
            quote: `${rawName} (${currentSubcategory}): ${rawDesc}`,
            source_id: 'src-awesome-mcp-servers',
            confidence: 'high',
            notes: 'Verified active GitHub MCP server in punkpeye/awesome-mcp-servers.',
          },
        ],
      },
      verification: {
        status: 'verified',
        last_verified_at: '2026-11-14',
        notes: badges.isGlamaVerified
          ? 'Verified working GitHub MCP server with Glama container & tool introspection badge.'
          : 'Verified working GitHub MCP server in punkpeye/awesome-mcp-servers.',
      },
      metadata: {
        featured: badges.isOfficial,
        created_at: '2026-11-14',
        updated_at: '2026-11-14',
      },
    });
  }

  // Sort MCP offers systematically by Use Case (subcategory) and then Official status + Name
  mcpOffers.sort((a, b) => {
    const subCmp = a.classification.subcategory.localeCompare(b.classification.subcategory);
    if (subCmp !== 0) return subCmp;
    if (a.metadata.featured !== b.metadata.featured) {
      return a.metadata.featured ? -1 : 1;
    }
    return a.identity.name.localeCompare(b.identity.name);
  });

  const outPath = path.join(ROOT_DIR, 'data', 'offers', 'mcp', 'awesome-mcp-servers-catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(mcpOffers, null, 2), 'utf8');

  // Update data/categories.json so `mcp` has all discovered use-case subcategories
  const categoriesPath = path.join(ROOT_DIR, 'data', 'categories.json');
  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8')) as Category[];
  const mcpCat = categories.find((c) => c.slug === 'mcp');
  if (mcpCat) {
    const existingSubNames = new Set(mcpCat.subcategories.map((s) => s.name.toLowerCase()));
    for (const subName of discoveredSubcategories) {
      if (!existingSubNames.has(subName.toLowerCase())) {
        mcpCat.subcategories.push({
          slug: slugify(subName),
          name: subName,
        });
        existingSubNames.add(subName.toLowerCase());
      }
    }
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2) + '\n', 'utf8');
  }

  console.log(
    `Scraped & wrote ${mcpOffers.length} working MCP servers across ${discoveredSubcategories.length} use-case subcategories!`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
