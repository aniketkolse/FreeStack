export interface HistoryEntry {
  id: number;
  url: string;
  scrollY: number;
}

export interface NavigationStackState {
  entries: HistoryEntry[];
  cursor: number;
  nextId: number;
}

export interface BackLabelResolvers {
  getCategoryName?: (slug: string) => string | undefined;
  getOfferName?: (slug: string) => string | undefined;
}

export interface BackNavigationMeta {
  targetHref: string;
  label: string;
}

/**
 * Ensures any client-side navigation target is a safe, same-origin internal path
 * starting with a single `/` (never `//`, `/\`, `http:`, `javascript:`, `data:`, or control chars).
 */
export function sanitizeInternalPath(rawPath: string | null | undefined, fallback = '/'): string {
  if (!rawPath || typeof rawPath !== 'string') return fallback;
  const cleaned = rawPath.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned || cleaned.length > 512) return fallback;
  if (!cleaned.startsWith('/')) return fallback;
  if (cleaned.startsWith('//') || cleaned.startsWith('/\\')) return fallback;

  const lower = cleaned.toLowerCase();
  if (
    lower.startsWith('/%2f') ||
    lower.startsWith('/%5c') ||
    /^[a-z][a-z0-9+.-]*:/i.test(cleaned)
  ) {
    return fallback;
  }

  return cleaned;
}

export function createInitialHistoryState(
  initialUrl: string,
  existingStateId?: number
): NavigationStackState {
  const id = typeof existingStateId === 'number' && Number.isFinite(existingStateId)
    ? existingStateId
    : 0;
  return {
    entries: [{ id, url: sanitizeInternalPath(initialUrl, '/'), scrollY: 0 }],
    cursor: 0,
    nextId: id + 1,
  };
}

export function pushHistoryEntry(
  state: NavigationStackState,
  toUrl: string,
  currentScrollY = 0
): NavigationStackState {
  const safeUrl = sanitizeInternalPath(toUrl, '/');
  const truncated = state.entries.slice(0, state.cursor + 1).map((entry, idx) =>
    idx === state.cursor ? { ...entry, scrollY: Math.max(0, currentScrollY) } : entry
  );

  const nextId = state.nextId;
  const nextEntries: HistoryEntry[] = [
    ...truncated,
    { id: nextId, url: safeUrl, scrollY: 0 },
  ];

  return {
    entries: nextEntries,
    cursor: nextEntries.length - 1,
    nextId: nextId + 1,
  };
}

export function replaceHistoryEntry(
  state: NavigationStackState,
  toUrl: string,
  currentScrollY?: number
): NavigationStackState {
  const safeUrl = sanitizeInternalPath(toUrl, '/');
  const nextEntries = state.entries.map((entry, idx) => {
    if (idx !== state.cursor) return entry;
    return {
      ...entry,
      url: safeUrl,
      scrollY:
        typeof currentScrollY === 'number'
          ? Math.max(0, currentScrollY)
          : entry.scrollY,
    };
  });

  return {
    ...state,
    entries: nextEntries,
  };
}

export function syncPopStateEntry(
  state: NavigationStackState,
  targetUrl: string,
  historyStateId?: number
): NavigationStackState {
  const safeUrl = sanitizeInternalPath(targetUrl, '/');
  if (typeof historyStateId === 'number' && Number.isFinite(historyStateId)) {
    const matchedById = state.entries.findIndex((entry) => entry.id === historyStateId);
    if (matchedById !== -1) {
      const nextEntries = state.entries.map((entry, idx) =>
        idx === matchedById ? { ...entry, url: safeUrl } : entry
      );
      return {
        ...state,
        entries: nextEntries,
        cursor: matchedById,
      };
    }
  }

  for (let i = state.cursor - 1; i >= 0; i--) {
    if (state.entries[i].url === safeUrl) {
      return {
        ...state,
        cursor: i,
      };
    }
  }

  for (let i = state.cursor + 1; i < state.entries.length; i++) {
    if (state.entries[i].url === safeUrl) {
      return {
        ...state,
        cursor: i,
      };
    }
  }

  const nextId = state.nextId;
  return {
    entries: [...state.entries, { id: nextId, url: safeUrl, scrollY: 0 }],
    cursor: state.entries.length,
    nextId: nextId + 1,
  };
}

export function canGoBackInStack(state: NavigationStackState): boolean {
  return state.cursor > 0;
}

export function getPreviousUrl(state: NavigationStackState): string | null {
  if (state.cursor <= 0) return null;
  return state.entries[state.cursor - 1]?.url ?? null;
}

export function getCurrentHistoryEntry(state: NavigationStackState): HistoryEntry {
  return state.entries[state.cursor] ?? { id: 0, url: '/', scrollY: 0 };
}

export function getBackNavigationMeta(
  previousPath: string | null | undefined,
  fallbackPath: string,
  resolvers: BackLabelResolvers = {}
): BackNavigationMeta {
  const safeFallback = sanitizeInternalPath(fallbackPath, '/explore');
  const targetHref =
    previousPath && previousPath.trim()
      ? sanitizeInternalPath(previousPath, safeFallback)
      : safeFallback;
  const pathname = targetHref.split(/[?#]/)[0] || '/';

  if (pathname === '/' || pathname === '') {
    return { targetHref, label: 'Back to Home' };
  }
  if (pathname === '/explore') {
    return { targetHref, label: 'Back to Explore' };
  }
  if (pathname === '/search') {
    return { targetHref, label: 'Back to Search Results' };
  }
  if (pathname === '/categories') {
    return { targetHref, label: 'Back to Categories' };
  }
  if (pathname.startsWith('/category/')) {
    const slug = pathname.replace('/category/', '').replace(/\/$/, '');
    const catName = resolvers.getCategoryName?.(slug);
    return {
      targetHref,
      label: catName ? `Back to ${catName}` : 'Back to Category',
    };
  }
  if (pathname.startsWith('/offer/')) {
    const slug = pathname.replace('/offer/', '').replace(/\/$/, '');
    const offerName = resolvers.getOfferName?.(slug);
    return {
      targetHref,
      label: offerName ? `Back to ${offerName}` : 'Back to Previous Offer',
    };
  }
  if (pathname === '/learning') {
    return { targetHref, label: 'Back to Learning' };
  }
  if (pathname === '/students') {
    return { targetHref, label: 'Back to Student Benefits' };
  }
  if (pathname === '/saved') {
    return { targetHref, label: 'Back to Saved Tools' };
  }
  if (pathname === '/about') {
    return { targetHref, label: 'Back to About' };
  }
  if (pathname === '/privacy') {
    return { targetHref, label: 'Back to Privacy Policy' };
  }
  if (pathname === '/privacy-requests') {
    return { targetHref, label: 'Back to Privacy Requests' };
  }
  if (pathname === '/terms') {
    return { targetHref, label: 'Back to Terms' };
  }
  if (pathname === '/design-system') {
    return { targetHref, label: 'Back to Design System' };
  }

  return { targetHref, label: 'Back' };
}
