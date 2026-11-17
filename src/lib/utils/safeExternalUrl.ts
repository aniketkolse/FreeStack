import { isSafeHttpsUrl } from '../validation/offerValidator';

/**
 * Validates an external URL before rendering it into an anchor `href`.
 * Returns the normalized https:// URL string if safe, or null if unsafe.
 */
export function safeExternalUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!isSafeHttpsUrl(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
