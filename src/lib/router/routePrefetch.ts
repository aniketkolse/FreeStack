import {
  isSaveDataEnabled,
  prefetchOfferDetail,
  prefetchOffersQuery,
} from '../data/resources';

export interface PrefetchPlan {
  routeKey:
    | 'explore'
    | 'categories'
    | 'category'
    | 'offer'
    | 'learning'
    | 'students'
    | 'saved'
    | 'about'
    | 'legal'
    | null;
  offersQuery?: string;
  offerSlug?: string;
}

const DEFAULT_PAGE_SIZE = 24;

export function resolvePrefetchPlan(rawPath: string): PrefetchPlan {
  const clean = (rawPath || '/').trim();
  const [pathnamePart, searchPart = ''] = clean.split('?');
  const pathname = pathnamePart.replace(/\/+$/, '') || '/';

  if (pathname === '/explore' || pathname === '/search') {
    const queryPrefix = searchPart ? `${searchPart}&` : '';
    return {
      routeKey: 'explore',
      offersQuery: `${queryPrefix}limit=${DEFAULT_PAGE_SIZE}&offset=0&facets=1`,
    };
  }

  if (pathname === '/categories') {
    return { routeKey: 'categories' };
  }

  if (pathname.startsWith('/category/')) {
    const slug = pathname.slice('/category/'.length);
    if (slug && !slug.includes('/')) {
      return {
        routeKey: 'category',
        offersQuery: `category=${encodeURIComponent(slug)}&sort=relevance&limit=${DEFAULT_PAGE_SIZE}&offset=0&facets=1`,
      };
    }
    return { routeKey: 'category' };
  }

  if (pathname.startsWith('/offer/')) {
    const slug = pathname.slice('/offer/'.length);
    if (slug && !slug.includes('/')) {
      return {
        routeKey: 'offer',
        offerSlug: decodeURIComponent(slug),
      };
    }
    return { routeKey: 'offer' };
  }

  if (pathname === '/learning') {
    return {
      routeKey: 'learning',
      offersQuery: `learningOnly=1&limit=${DEFAULT_PAGE_SIZE}&offset=0&facets=1`,
    };
  }

  if (pathname === '/students') {
    return {
      routeKey: 'students',
      offersQuery: `category=student-benefits&limit=${DEFAULT_PAGE_SIZE}&offset=0&facets=1`,
    };
  }

  if (pathname === '/saved') {
    return { routeKey: 'saved' };
  }

  if (pathname === '/about') {
    return { routeKey: 'about' };
  }

  if (pathname === '/privacy' || pathname === '/privacy-requests' || pathname === '/terms') {
    return { routeKey: 'legal' };
  }

  return { routeKey: null };
}

const warmedChunks = new Set<string>();

export function prefetchRouteChunk(routeKey: PrefetchPlan['routeKey']): void {
  if (!routeKey || warmedChunks.has(routeKey)) return;
  warmedChunks.add(routeKey);

  switch (routeKey) {
    case 'explore':
      void import('../../pages/ExplorePage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'categories':
      void import('../../pages/CategoriesPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'category':
      void import('../../pages/CategoryDetailPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'offer':
      void import('../../pages/OfferDetailPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'learning':
      void import('../../pages/LearningPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'students':
      void import('../../pages/StudentsPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'saved':
      void import('../../pages/SavedOffersPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'about':
      void import('../../pages/AboutPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
    case 'legal':
      void import('../../pages/LegalCenterPage').catch(() => {
        warmedChunks.delete(routeKey);
      });
      break;
  }
}

export function prefetchRouteWithData(path: string): void {
  const plan = resolvePrefetchPlan(path);
  if (plan.routeKey) {
    prefetchRouteChunk(plan.routeKey);
  }
  if (plan.offersQuery) {
    prefetchOffersQuery(plan.offersQuery);
  }
  if (plan.offerSlug) {
    prefetchOfferDetail(plan.offerSlug);
  }
}
