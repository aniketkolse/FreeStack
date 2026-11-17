import { useCallback, useEffect, useRef, useState } from 'react';
import {
  canGoBackInStack,
  createInitialHistoryState,
  getCurrentHistoryEntry,
  getPreviousUrl,
  pushHistoryEntry,
  replaceHistoryEntry,
  syncPopStateEntry,
  type NavigationStackState,
} from './navigationHistory';

export interface RouteLocation {
  pathname: string;
  search: string;
  params: URLSearchParams;
}

export interface NavigateOptions {
  replace?: boolean;
  scrollTop?: boolean;
}

function readLocation(): RouteLocation {
  const pathname = window.location.pathname || '/';
  const search = window.location.search || '';
  return {
    pathname,
    search,
    params: new URLSearchParams(search),
  };
}

function readFullUrl(): string {
  return (window.location.pathname || '/') + (window.location.search || '');
}

function readStateId(state: unknown): number | undefined {
  if (state && typeof state === 'object' && '__fsIdx' in state) {
    const val = (state as { __fsIdx?: unknown }).__fsIdx;
    if (typeof val === 'number' && Number.isFinite(val)) {
      return val;
    }
  }
  return undefined;
}

function buildHistoryState(fsIdx: number): Record<string, unknown> {
  const current = window.history.state;
  if (current && typeof current === 'object') {
    return { ...(current as Record<string, unknown>), __fsIdx: fsIdx };
  }
  return { __fsIdx: fsIdx };
}

export function useRouter() {
  const [location, setLocation] = useState<RouteLocation>(() => readLocation());
  const stackRef = useRef<NavigationStackState | null>(null);
  if (!stackRef.current) {
    stackRef.current = createInitialHistoryState(
      readFullUrl(),
      readStateId(window.history.state)
    );
  }

  const [previousPath, setPreviousPath] = useState<string | null>(() =>
    getPreviousUrl(stackRef.current!)
  );
  const [canGoBack, setCanGoBack] = useState<boolean>(() =>
    canGoBackInStack(stackRef.current!)
  );

  const syncMetaFromStack = useCallback((nextStack: NavigationStackState) => {
    stackRef.current = nextStack;
    setPreviousPath(getPreviousUrl(nextStack));
    setCanGoBack(canGoBackInStack(nextStack));
  }, []);

  useEffect(() => {
    const initialEntry = getCurrentHistoryEntry(stackRef.current!);
    if (readStateId(window.history.state) !== initialEntry.id) {
      window.history.replaceState(buildHistoryState(initialEntry.id), '', readFullUrl());
    }

    const onPopState = (event: PopStateEvent) => {
      const targetUrl = readFullUrl();
      const stateId = readStateId(event.state);
      const nextStack = syncPopStateEntry(stackRef.current!, targetUrl, stateId);
      syncMetaFromStack(nextStack);
      setLocation(readLocation());

      const restoredScrollY = getCurrentHistoryEntry(nextStack).scrollY;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: restoredScrollY, behavior: 'instant' as ScrollBehavior });
        });
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [syncMetaFromStack]);

  const navigate = useCallback(
    (to: string, options: NavigateOptions = {}) => {
      const { replace = false, scrollTop = true } = options;
      const current = readFullUrl();
      if (to === current) {
        if (scrollTop) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (replace) {
        const nextStack = replaceHistoryEntry(stackRef.current!, to, window.scrollY);
        const entry = getCurrentHistoryEntry(nextStack);
        window.history.replaceState(buildHistoryState(entry.id), '', to);
        syncMetaFromStack(nextStack);
      } else {
        const nextStack = pushHistoryEntry(stackRef.current!, to, window.scrollY);
        const entry = getCurrentHistoryEntry(nextStack);
        window.history.pushState(buildHistoryState(entry.id), '', to);
        syncMetaFromStack(nextStack);
      }

      setLocation(readLocation());

      if (scrollTop) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    },
    [syncMetaFromStack]
  );

  const goBack = useCallback(
    (fallbackPath = '/explore') => {
      if (canGoBackInStack(stackRef.current!)) {
        window.history.back();
        return;
      }
      navigate(fallbackPath);
    },
    [navigate]
  );

  return {
    pathname: location.pathname,
    search: location.search,
    params: location.params,
    previousPath,
    canGoBack,
    navigate,
    goBack,
  };
}
