/**
 * Public editorial policy for the verification catalog.
 * Keep lastReviewed in sync with the date shown on /about and in its JSON-LD.
 */
export const EDITORIAL_POLICY = {
  maintainer: 'FreeStack project, maintained in the open by @aniketkolse and contributors',
  contactUrl: 'https://github.com/aniketkolse/FreeStack/issues/new',
  issuesUrl: 'https://github.com/aniketkolse/FreeStack/issues',
  lastReviewed: '2026-11-25',
  methodology: [
    'Find the limit, card rule, or eligibility claim in the provider’s own pricing or developer documentation.',
    'Record a verbatim quote, the official HTTPS source URL, and the date the check was performed.',
    'Publish the quota with its period and card requirement; leave unknowns labeled unknown.',
    'Recheck on a rolling basis and flag a listing as changed or expired when terms move.',
  ],
} as const;
