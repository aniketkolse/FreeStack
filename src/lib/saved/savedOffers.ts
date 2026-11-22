import { useCallback, useEffect, useState } from 'react';
import type { Offer } from '../../types/resource';
import { formatCardRequirement, formatPricingModel, getPrimaryLimitSummary } from '../utils/formatters';

export const SAVED_OFFERS_STORAGE_KEY = 'freestack-saved-offers-v1';
export const MAX_SAVED_OFFERS = 500;
const SAVED_OFFERS_EVENT = 'freestack-saved-updated';
const SAFE_SLUG_REGEX = /^[a-z0-9-]{2,120}$/;

/**
 * Pure parser for stored saved offer slugs from JSON string.
 * Validates slug syntax, deduplicates, and caps at MAX_SAVED_OFFERS (500).
 */
export function parseSavedSlugs(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== 'string' || raw.length > 65536) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (SAFE_SLUG_REGEX.test(trimmed) && !seen.has(trimmed)) {
          seen.add(trimmed);
          result.push(trimmed);
          if (result.length >= MAX_SAVED_OFFERS) break;
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Pure toggle helper that adds or removes an offer slug and returns the updated list + saved state.
 */
export function toggleSavedSlug(
  current: string[],
  slug: string
): { next: string[]; saved: boolean } {
  const normalized = slug.trim();
  if (!SAFE_SLUG_REGEX.test(normalized)) {
    return { next: [...current], saved: false };
  }
  const exists = current.includes(normalized);
  if (exists) {
    return {
      next: current.filter((item) => item !== normalized),
      saved: false,
    };
  }
  return {
    next: [normalized, ...current].slice(0, MAX_SAVED_OFFERS),
    saved: true,
  };
}

/**
 * Pure builder for canonical share title, text summary, and deep link URL for a tool.
 */
export function buildSharePayload(
  offer: Offer,
  origin = 'https://freestack.dev'
): { title: string; text: string; url: string } {
  const cleanOrigin = origin.replace(/\/$/, '');
  const url = `${cleanOrigin}/offer/${encodeURIComponent(offer.identity.slug)}`;
  const pricing = formatPricingModel(offer.classification.pricing_model);
  const card = formatCardRequirement(offer.access.requirements.card_required);
  const primaryLimit = getPrimaryLimitSummary(offer);

  const title = `${offer.identity.name} (${offer.identity.provider}) — FreeStack`;
  const text = `${offer.identity.name} by ${offer.identity.provider}: ${pricing} · ${card} · ${primaryLimit}`;

  return { title, text, url };
}

function readStoredSavedSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseSavedSlugs(window.localStorage.getItem(SAVED_OFFERS_STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeStoredSavedSlugs(slugs: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const bounded = slugs.filter((s) => SAFE_SLUG_REGEX.test(s)).slice(0, MAX_SAVED_OFFERS);
    window.localStorage.setItem(SAVED_OFFERS_STORAGE_KEY, JSON.stringify(bounded));
    window.dispatchEvent(new CustomEvent(SAVED_OFFERS_EVENT));
  } catch {
    // Ignore storage quota or private-browsing errors
  }
}

/**
 * React hook to read and mutate saved tool slugs across all components in real time.
 */
export function useSavedOffers() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setSavedSlugs(readStoredSavedSlugs());
    };
    sync();
    window.addEventListener(SAVED_OFFERS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SAVED_OFFERS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isSaved = useCallback(
    (slug: string) => savedSlugs.includes(slug),
    [savedSlugs]
  );

  const toggleSave = useCallback((slug: string): boolean => {
    const current = readStoredSavedSlugs();
    const { next, saved } = toggleSavedSlug(current, slug);
    writeStoredSavedSlugs(next);
    setSavedSlugs(next);
    return saved;
  }, []);

  const clearSaved = useCallback(() => {
    writeStoredSavedSlugs([]);
    setSavedSlugs([]);
  }, []);

  return {
    savedSlugs,
    savedCount: savedSlugs.length,
    isSaved,
    toggleSave,
    clearSaved,
  };
}

/**
 * Shares an offer via Web Share API when requested or copies its canonical link + summary to clipboard.
 */
export async function shareOrCopyOffer(
  offer: Offer
): Promise<'shared' | 'copied' | 'failed'> {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://freestack.dev';
  const payload = buildSharePayload(offer, origin);

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(`${payload.title}\n${payload.text}\n${payload.url}`);
      return 'copied';
    } catch {
      // Fallback to navigator.share or textarea copy below
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch {
      // Fall through to execCommand fallback
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = `${payload.title}\n${payload.text}\n${payload.url}`;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
