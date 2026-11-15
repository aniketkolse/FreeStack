import type { Category, CategorySlug, Offer } from '../../types/resource';

export interface PrimaryTypeGroup {
  id: string;
  label: string;
  subcategories: string[];
}

export interface PopulatedPrimaryTypeGroup extends PrimaryTypeGroup {
  count: number;
  populatedSubcategories: Array<{
    slug: string;
    name: string;
    count: number;
  }>;
}

/**
 * Systematic macro-groups ("Important Types") for large categories
 * so users see 7-8 clear primary types on Row 1 and matching subtypes on Row 2.
 */
export const MACRO_TYPE_GROUPS: Partial<Record<CategorySlug, PrimaryTypeGroup[]>> = {
  mcp: [
    {
      id: 'dev-code',
      label: 'Dev & Code',
      subcategories: [
        'Developer Tools',
        'Coding Agents',
        'Code Execution',
        'Command Line',
        'Version Control',
        'File Systems',
        'MCP SDKs & Inspector',
        'MCP Frameworks & SDKs',
        'Aggregators',
      ],
    },
    {
      id: 'data-dbs',
      label: 'Data & DBs',
      subcategories: [
        'Databases',
        'Database & Data MCP',
        'Data Platforms',
        'Data Science Tools',
        'Data Visualization',
        'Customer Data Platforms',
      ],
    },
    {
      id: 'web-search-rag',
      label: 'Search & Web',
      subcategories: [
        'Browser Automation',
        'Search & Data Extraction',
        'Knowledge & Memory',
        'End-to-End RAG Platforms',
        'Research',
      ],
    },
    {
      id: 'cloud-os-iot',
      label: 'Cloud & OS',
      subcategories: [
        'Cloud Platforms',
        'Remote & Edge MCP',
        'Official MCP Servers',
        'OS Automation',
        'Monitoring',
        'Embedded Systems',
        'Home Automation',
        'Industrial & IoT',
        'Aerospace & Astrodynamics',
      ],
    },
    {
      id: 'ai-voice-media',
      label: 'AI & Media',
      subcategories: [
        'Conversational AI',
        'Multimedia Process',
        'Art & Culture',
        'Gaming',
        'Speech-to-Text',
        'Text-to-Speech',
        'Translation Services',
        'Podcasts',
      ],
    },
    {
      id: 'productivity-comms',
      label: 'Productivity',
      subcategories: [
        'Workplace & Productivity',
        'Communication',
        'Product Management',
        'Support & Service Management',
        'Social Media',
        'Agreements & Coordination',
        'Architecture & Design',
        'Accessibility',
        'Other Tools & Integrations',
      ],
    },
    {
      id: 'finance-commerce',
      label: 'Finance & Biz',
      subcategories: [
        'Finance & Fintech',
        'E-Commerce',
        'Marketing',
        'Real Estate',
        'Delivery',
        'Jobs',
        'Legal',
      ],
    },
    {
      id: 'security-science',
      label: 'Security & Sci',
      subcategories: [
        'Security',
        'Identity',
        'Cryptography',
        'Biology, Medicine & Bioinformatics',
        'Health & Wellness',
        'Education',
        'Environment & Nature',
        'Location Services',
        'Travel & Transportation',
        'Sports',
        'Spirituality & Esoterica',
      ],
    },
  ],
  'apis-integrations': [
    {
      id: 'dev-cloud-ai',
      label: 'Dev & AI',
      subcategories: [
        'Development',
        'Programming',
        'Open Source Projects',
        'Machine Learning',
        'Text Analysis',
        'Continuous Integration',
        'Cloud Storage & File Sharing',
        'Data Validation',
        'Test Data',
        'Testing APIs',
        'URL Shorteners',
        'Public APIs',
        'SDKs & Webhooks',
      ],
    },
    {
      id: 'finance-crypto',
      label: 'Finance & Crypto',
      subcategories: [
        'Finance',
        'Cryptocurrency',
        'Currency Exchange',
        'Blockchain',
        'Payment Sandboxes',
        'Business',
        'Shopping',
      ],
    },
    {
      id: 'geo-weather-travel',
      label: 'Geo & Weather',
      subcategories: [
        'Geocoding',
        'Maps & Location APIs',
        'Weather',
        'Environment',
        'Transportation',
        'Vehicle',
        'Tracking',
      ],
    },
    {
      id: 'media-games',
      label: 'Media & Games',
      subcategories: [
        'Music',
        'Video',
        'Photography',
        'Art & Design',
        'Entertainment',
        'Anime',
        'Games & Comics',
        'Personality',
      ],
    },
    {
      id: 'data-books-news',
      label: 'Data & Books',
      subcategories: [
        'Open Data',
        'Government',
        'Science & Math',
        'Books',
        'Dictionaries',
        'News',
        'Patent',
      ],
    },
    {
      id: 'social-comms-work',
      label: 'Social & Work',
      subcategories: [
        'Social',
        'Email',
        'Phone',
        'Calendar',
        'Documents & Productivity',
        'Events',
        'Jobs',
      ],
    },
    {
      id: 'security-auth',
      label: 'Security & Auth',
      subcategories: [
        'Security',
        'Anti-Malware',
        'Authentication & Authorization',
      ],
    },
    {
      id: 'health-food-life',
      label: 'Health & Life',
      subcategories: [
        'Health',
        'Food & Drink',
        'Sports & Fitness',
        'Animals',
      ],
    },
  ],
};

/**
 * Returns whether a category uses macro-type groups (Row 1 = Macro Types, Row 2 = Subcategories)
 * vs standard categories (Row 1 = Subcategories, Row 2 = Specific Tag Subtypes & Refine).
 */
export function hasMacroTypeGroups(slug: CategorySlug): boolean {
  return Boolean(MACRO_TYPE_GROUPS[slug]);
}

/**
 * Builds populated Primary Type Groups for a category with accurate offer counts
 * and sorted subtypes. Any unmapped subcategory is automatically placed into the last group.
 */
export function getPopulatedPrimaryTypes(
  category: Category,
  offers: Offer[]
): PopulatedPrimaryTypeGroup[] {
  const subCountMap = new Map<string, number>();
  for (const offer of offers) {
    const sub = offer.classification.subcategory;
    subCountMap.set(sub, (subCountMap.get(sub) ?? 0) + 1);
  }

  const macroGroups = MACRO_TYPE_GROUPS[category.slug];
  if (!macroGroups) {
    // For standard categories (<= 6 subcategories), each subcategory is an Important Type
    return category.subcategories
      .map((sub) => {
        const count = subCountMap.get(sub.name) ?? 0;
        return {
          id: sub.slug,
          label: sub.name,
          subcategories: [sub.name],
          count,
          populatedSubcategories: count > 0 ? [{ ...sub, count }] : [],
        };
      })
      .filter((g) => g.count > 0);
  }

  const subSlugMap = new Map<string, string>();
  for (const sub of category.subcategories) {
    subSlugMap.set(sub.name, sub.slug);
  }

  const assignedSubs = new Set<string>();
  const result: PopulatedPrimaryTypeGroup[] = macroGroups.map((group) => {
    const populatedSubcategories = group.subcategories
      .map((name) => {
        assignedSubs.add(name);
        return {
          slug: subSlugMap.get(name) ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          count: subCountMap.get(name) ?? 0,
        };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const count = populatedSubcategories.reduce((acc, s) => acc + s.count, 0);
    return {
      ...group,
      count,
      populatedSubcategories,
    };
  });

  // Catch any unmapped subcategories so no offer is ever orphaned
  const unassigned = category.subcategories.filter((s) => !assignedSubs.has(s.name));
  if (unassigned.length > 0 && result.length > 0) {
    const targetGroup = result[result.length - 1];
    for (const sub of unassigned) {
      const count = subCountMap.get(sub.name) ?? 0;
      targetGroup.subcategories.push(sub.name);
      if (count > 0) {
        targetGroup.populatedSubcategories.push({ ...sub, count });
        targetGroup.count += count;
      }
    }
    targetGroup.populatedSubcategories.sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
  }

  return result.filter((g) => g.count > 0);
}

/**
 * Finds the Primary Type Group ID that owns a given subcategory name.
 */
export function findPrimaryTypeForSubcategory(
  groups: PopulatedPrimaryTypeGroup[],
  subcategoryName: string
): string | undefined {
  if (!subcategoryName || subcategoryName === 'all') return undefined;
  const match = groups.find((g) => g.subcategories.includes(subcategoryName));
  return match?.id;
}

/**
 * Extracts clean, human-readable subtype tags for standard categories (<= 6 subcategories)
 * so Row 2 ("Subtypes") always provides meaningful sub-topic pills under the active Important Type.
 */
export function getTagSubtypesForOffers(
  offers: Offer[],
  limit = 10
): Array<{ tag: string; label: string; count: number }> {
  const IGNORED_TAGS = new Set([
    'free-tier',
    'completely-free',
    'open-source',
    'verified',
    'official-implementation',
    'mcp',
    'api',
    'public-api',
  ]);

  const counts = new Map<string, number>();
  for (const offer of offers) {
    for (const rawTag of offer.classification.tags) {
      if (
        IGNORED_TAGS.has(rawTag) ||
        rawTag.startsWith('lang:') ||
        rawTag.startsWith('scope:') ||
        rawTag.startsWith('os:') ||
        rawTag.startsWith('auth:') ||
        rawTag.startsWith('cors:') ||
        rawTag.startsWith('modality:') ||
        rawTag.startsWith('ctx:')
      ) {
        continue;
      }
      counts.set(rawTag, (counts.get(rawTag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({
      tag,
      label: tag
        .split('-')
        .map((part) =>
          part.length <= 3 && /^(ai|ml|ui|ux|db|sql|cli|sdk|api|llm|rag|gpu|cpu|ide|iot|cdn|dns|ssh|tls|jwt|css|ssr)$/i.test(part)
            ? part.toUpperCase()
            : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join(' '),
      count,
    }));
}
