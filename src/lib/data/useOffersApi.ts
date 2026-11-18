import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Offer } from '../../types/resource';
import {
  fetchOfferDetailApi,
  fetchOffersApi,
  getCachedOfferDetail,
  getCachedOffersQuery,
  getFullOfferBySlug,
  getOfferBySlug,
  getRelatedOffers,
  type OffersApiResponse,
} from './resources';

export function useDebouncedValue<T>(value: T, delayMs = 150): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (Object.is(value, debounced)) return;
    const timer = globalThis.setTimeout(() => {
      startTransition(() => {
        setDebounced(value);
      });
    }, delayMs);
    return () => globalThis.clearTimeout(timer);
  }, [value, delayMs, debounced]);

  return useDeferredValue(debounced);
}

export interface PaginatedOffersState {
  items: Offer[];
  total: number;
  hasMore: boolean;
  facets: OffersApiResponse['facets'];
  isInitialLoading: boolean;
  isFetchingMore: boolean;
  isTransitioning: boolean;
  error: string | null;
  loadMore: () => void;
  retry: () => void;
}

export function usePaginatedOffersQuery(
  filterQueryString: string,
  pageSize = 24
): PaginatedOffersState {
  const firstPageKey = `${filterQueryString}${filterQueryString ? '&' : ''}limit=${pageSize}&offset=0&facets=1`;
  const initialCached = getCachedOffersQuery(firstPageKey);

  const [items, setItems] = useState<Offer[]>(() => initialCached?.items ?? []);
  const [total, setTotal] = useState<number>(() => initialCached?.total ?? 0);
  const [facets, setFacets] = useState<OffersApiResponse['facets']>(
    () => initialCached?.facets
  );
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => !initialCached);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState<number>(0);

  const activeFilterKeyRef = useRef<string>(filterQueryString);
  activeFilterKeyRef.current = filterQueryString;

  useEffect(() => {
    const key = `${filterQueryString}${filterQueryString ? '&' : ''}limit=${pageSize}&offset=0&facets=1`;
    const cached = getCachedOffersQuery(key);
    if (cached) {
      startTransition(() => {
        setItems(cached.items);
        setTotal(cached.total);
        if (cached.facets) setFacets(cached.facets);
        setIsInitialLoading(false);
        setIsTransitioning(false);
        setError(null);
      });
      return;
    }

    const controller = new AbortController();
    setError(null);
    setIsTransitioning(true);

    fetchOffersApi(key, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        startTransition(() => {
          setItems(res.items);
          setTotal(res.total);
          if (res.facets) setFacets(res.facets);
          setIsInitialLoading(false);
          setIsTransitioning(false);
          setError(null);
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        setIsInitialLoading(false);
        setIsTransitioning(false);
        setError(err instanceof Error ? err.message : 'Unable to load resources');
      });

    return () => {
      controller.abort();
    };
  }, [filterQueryString, pageSize, retryCounter]);

  const loadMore = useCallback(() => {
    if (isFetchingMore || isTransitioning || items.length >= total) return;
    const offset = items.length;
    const currentFilter = activeFilterKeyRef.current;
    const nextKey = `${currentFilter}${currentFilter ? '&' : ''}limit=${pageSize}&offset=${offset}`;

    const cached = getCachedOffersQuery(nextKey);
    if (cached) {
      startTransition(() => {
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.identity.slug));
          const appended = cached.items.filter((i) => !seen.has(i.identity.slug));
          return [...prev, ...appended];
        });
      });
      return;
    }

    setIsFetchingMore(true);
    fetchOffersApi(nextKey)
      .then((res) => {
        if (activeFilterKeyRef.current !== currentFilter) return;
        startTransition(() => {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.identity.slug));
            const appended = res.items.filter((i) => !seen.has(i.identity.slug));
            return [...prev, ...appended];
          });
          setTotal(res.total);
          setIsFetchingMore(false);
        });
      })
      .catch(() => {
        setIsFetchingMore(false);
      });
  }, [isFetchingMore, isTransitioning, items.length, total, pageSize]);

  const retry = useCallback(() => {
    setRetryCounter((c) => c + 1);
  }, []);

  return {
    items,
    total,
    hasMore: items.length < total,
    facets,
    isInitialLoading,
    isFetchingMore,
    isTransitioning,
    error,
    loadMore,
    retry,
  };
}

export interface OfferDetailState {
  offer: Offer | undefined;
  related: Offer[];
  isLoading: boolean;
  notFound: boolean;
  error: string | null;
  retry: () => void;
}

export function useOfferDetailQuery(slug: string): OfferDetailState {
  const initialCached = getCachedOfferDetail(slug);
  const initialFull = getFullOfferBySlug(slug);

  const [offer, setOffer] = useState<Offer | undefined>(
    () => initialCached?.offer ?? initialFull ?? getOfferBySlug(slug)
  );
  const [related, setRelated] = useState<Offer[]>(
    () => initialCached?.related ?? (initialFull ? getRelatedOffers(initialFull, 3) : [])
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialCached && !initialFull);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState<number>(0);

  useEffect(() => {
    const cached = getCachedOfferDetail(slug);
    if (cached) {
      setOffer(cached.offer);
      setRelated(cached.related);
      setIsLoading(false);
      setNotFound(false);
      setError(null);
      return;
    }

    const partial = getOfferBySlug(slug);
    if (partial) {
      setOffer(partial);
    }

    const controller = new AbortController();
    setIsLoading(true);
    setNotFound(false);
    setError(null);

    fetchOfferDetailApi(slug, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setOffer(res.offer);
        setRelated(res.related);
        setIsLoading(false);
        setNotFound(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        setIsLoading(false);
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          setOffer(undefined);
          setNotFound(true);
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to load offer details');
      });

    return () => {
      controller.abort();
    };
  }, [slug, retryCounter]);

  const retry = useCallback(() => {
    setRetryCounter((c) => c + 1);
  }, []);

  return {
    offer,
    related,
    isLoading,
    notFound,
    error,
    retry,
  };
}

export function useSavedOffersBatch(slugs: string[]) {
  const [offers, setOffers] = useState<Offer[]>(() =>
    slugs
      .map((s) => getOfferBySlug(s))
      .filter((o): o is Offer => Boolean(o))
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (slugs.length === 0) return false;
    return slugs.some((s) => !getOfferBySlug(s));
  });
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState<number>(0);

  const slugsKey = slugs.join(',');

  useEffect(() => {
    if (slugs.length === 0) {
      setOffers([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const allKnown = slugs
      .map((s) => getOfferBySlug(s))
      .filter((o): o is Offer => Boolean(o));

    if (allKnown.length === slugs.length) {
      setOffers(allKnown);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(allKnown.length === 0);
    setError(null);

    const qs = new URLSearchParams({
      slugs: slugs.slice(0, 100).join(','),
      limit: String(Math.min(slugs.length, 100)),
    }).toString();

    fetchOffersApi(qs, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        const map = new Map(res.items.map((i) => [i.identity.slug, i]));
        const ordered = slugs
          .map((s) => map.get(s) ?? getOfferBySlug(s))
          .filter((o): o is Offer => Boolean(o));
        setOffers(ordered);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Unable to load saved resources');
      });

    return () => {
      controller.abort();
    };
  }, [slugsKey, slugs, retryCounter]);

  const retry = useCallback(() => {
    setRetryCounter((c) => c + 1);
  }, []);

  return { offers, isLoading, error, retry };
}
