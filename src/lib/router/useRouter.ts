import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import {
  canGoBackInStack,
  createInitialHistoryState,
  getCurrentHistoryEntry,
  getPreviousUrl,
  popHistoryEntry,
  pushHistoryEntry,
  replaceHistoryEntry,
  sanitizeInternalPath,
  syncPopStateEntry,
  type HistoryEntry,
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
  if (typeof window === 'undefined') {
    return {
      pathname: '/',
      search: '',
      params: new URLSearchParams(),
    };
  }
  const pathname = sanitizeInternalPath(window.location.pathname || '/', '/');
  const rawSearch = window.location.search || '';
  const search = rawSearch.length <= 512 ? rawSearch : rawSearch.slice(0, 512);
  return {
    pathname,
    search,
    params: new URLSearchParams(search),
  };
}

function readFullUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return sanitizeInternalPath(
    (window.location.pathname || '/') + (window.location.search || ''),
    '/'
  );
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

function restoreScrollPosition(scrollY: number) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: Math.max(0, scrollY), behavior: 'instant' as ScrollBehavior });
    });
  });
}

export function useRouter() {
  const [location, setLocation] = useState<RouteLocation>(() => readLocation());
  const stackRef = useRef<NavigationStackState | null>(null);
  if (!stackRef.current) {
    stackRef.current = createInitialHistoryState(
      readFullUrl(),
      typeof window !== 'undefined' ? readStateId(window.history.state) : undefined
    );
  }

  const navSeqRef = useRef<number>(0);
  const backFailsafeTimerRef = useRef<number | null>(null);
  const pendingBackRef = useRef<{
    fromUrl: string;
    nextState: NavigationStackState;
    targetEntry: HistoryEntry;
  } | null>(null);

  const [previousPath, setPreviousPath] = useState<string | null>(() =>
    getPreviousUrl(stackRef.current!)
  );
  const [canGoBack, setCanGoBack] = useState<boolean>(() =>
    canGoBackInStack(stackRef.current!)
  );

  const clearPendingBack = useCallback(() => {
    if (backFailsafeTimerRef.current !== null) {
      window.clearTimeout(backFailsafeTimerRef.current);
      backFailsafeTimerRef.current = null;
    }
    pendingBackRef.current = null;
  }, []);

  const syncMetaFromStack = useCallback((nextStack: NavigationStackState) => {
    stackRef.current = nextStack;
    setPreviousPath(getPreviousUrl(nextStack));
    setCanGoBack(canGoBackInStack(nextStack));
  }, []);

  const applyDeterministicPop = useCallback(
    (nextState: NavigationStackState, targetEntry: HistoryEntry) => {
      clearPendingBack();
      navSeqRef.current += 1;
      window.history.replaceState(buildHistoryState(targetEntry.id), '', targetEntry.url);
      syncMetaFromStack(nextState);
      startTransition(() => {
        setLocation(readLocation());
      });
      restoreScrollPosition(targetEntry.scrollY);
    },
    [clearPendingBack, syncMetaFromStack]
  );

  useEffect(() => {
    const initialEntry = getCurrentHistoryEntry(stackRef.current!);
    if (readStateId(window.history.state) !== initialEntry.id) {
      window.history.replaceState(buildHistoryState(initialEntry.id), '', readFullUrl());
    }

    const onPopState = (event: PopStateEvent) => {
      const pending = pendingBackRef.current;
      const targetUrl = readFullUrl();

      // If browser history popped onto the exact same URL we were trying to leave,
      // force-resolve to the distinct previous entry so Back never stalls.
      if (pending && targetUrl === pending.fromUrl) {
        applyDeterministicPop(pending.nextState, pending.targetEntry);
        return;
      }

      clearPendingBack();
      navSeqRef.current += 1;

      const stateId = readStateId(event.state);
      const nextStack = syncPopStateEntry(stackRef.current!, targetUrl, stateId);
      syncMetaFromStack(nextStack);
      startTransition(() => {
        setLocation(readLocation());
      });

      const restoredScrollY = getCurrentHistoryEntry(nextStack).scrollY;
      restoreScrollPosition(restoredScrollY);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      clearPendingBack();
    };
  }, [applyDeterministicPop, clearPendingBack, syncMetaFromStack]);

  const navigate = useCallback(
    (to: string, options: NavigateOptions = {}) => {
      const { replace = false, scrollTop = true } = options;
      const safeTarget = sanitizeInternalPath(to, '/');
      const current = readFullUrl();
      if (safeTarget === current) {
        if (scrollTop) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      clearPendingBack();
      navSeqRef.current += 1;

      if (replace) {
        const nextStack = replaceHistoryEntry(stackRef.current!, safeTarget, window.scrollY);
        const entry = getCurrentHistoryEntry(nextStack);
        window.history.replaceState(buildHistoryState(entry.id), '', safeTarget);
        syncMetaFromStack(nextStack);
      } else {
        const nextStack = pushHistoryEntry(stackRef.current!, safeTarget, window.scrollY);
        const entry = getCurrentHistoryEntry(nextStack);
        window.history.pushState(buildHistoryState(entry.id), '', safeTarget);
        syncMetaFromStack(nextStack);
      }

      startTransition(() => {
        setLocation(readLocation());
      });

      if (scrollTop) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    },
    [clearPendingBack, syncMetaFromStack]
  );

  const goBack = useCallback(
    (fallbackPath = '/explore') => {
      clearPendingBack();
      const { nextState, targetEntry, delta } = popHistoryEntry(stackRef.current!);
      if (!targetEntry || delta === 0) {
        navigate(sanitizeInternalPath(fallbackPath, '/explore'));
        return;
      }

      const fromUrl = readFullUrl();
      const seqBefore = navSeqRef.current;
      pendingBackRef.current = { fromUrl, nextState, targetEntry };

      try {
        window.history.go(delta);
      } catch {
        applyDeterministicPop(nextState, targetEntry);
        return;
      }

      // Safeguard: if browser history is sandboxed/desynced and popstate does not fire,
      // resolve deterministically so the Back button never freezes or silently drops clicks.
      backFailsafeTimerRef.current = window.setTimeout(() => {
        if (navSeqRef.current === seqBefore) {
          applyDeterministicPop(nextState, targetEntry);
        }
      }, 110);
    },
    [applyDeterministicPop, clearPendingBack, navigate]
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
