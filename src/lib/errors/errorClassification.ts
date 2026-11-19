export type ErrorPageVariant = 'offline' | 'load_error' | 'not_found';

export interface ErrorClassificationInput {
  isOnline?: boolean;
  errorMessage?: string | null;
  notFound?: boolean;
  explicitVariant?: ErrorPageVariant;
}

export interface ErrorPageMeta {
  variant: ErrorPageVariant;
  code: '404' | 'OFFLINE' | '503';
  kicker: string;
  headline: string;
  description: string;
  primaryActionLabel: string;
}

const NETWORK_ERROR_PATTERNS = [
  /failed to fetch/i,
  /network\s*error/i,
  /networkerror/i,
  /load failed/i,
  /err_internet_disconnected/i,
  /err_network_changed/i,
  /timed?\s*out/i,
  /abort/i,
  /chunk/i,
  /dynamically imported module/i,
];

export function isLikelyNetworkOrLoadMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function classifyLoadError(input: ErrorClassificationInput): ErrorPageMeta {
  const { isOnline = true, errorMessage = null, notFound = false, explicitVariant } = input;

  if (explicitVariant === 'offline' || !isOnline) {
    return {
      variant: 'offline',
      code: '404',
      kicker: 'Connection Lost · Offline',
      headline: 'Looks like your signal drifted away.',
      description:
        'Your device appears to be offline or blocked from reaching FreeStack. Reconnect to Wi-Fi or mobile data and we will snap your stack right back together.',
      primaryActionLabel: 'Check connection & retry',
    };
  }

  if (
    explicitVariant === 'load_error' ||
    (errorMessage && isLikelyNetworkOrLoadMessage(errorMessage)) ||
    Boolean(errorMessage && !notFound)
  ) {
    return {
      variant: 'load_error',
      code: '404',
      kicker: 'Loading Hiccup · Temporary Error',
      headline: 'Something tripped while loading this stack.',
      description: 'This page could not be loaded right now. Please retry or head back home.',
      primaryActionLabel: 'Retry loading',
    };
  }

  return {
    variant: 'not_found',
    code: '404',
    kicker: 'Error 404 · Uncharted Stack',
    headline: 'Whoops — this stack wandered off the shelf.',
    description:
      'The page or free resource you asked for does not exist at this address (or moved to a new category). Let’s get you back to verified $0 tools.',
    primaryActionLabel: 'Back to safety',
  };
}
