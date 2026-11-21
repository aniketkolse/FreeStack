# Contributing to FreeStack

Thank you for helping keep FreeStack accurate, verifiable, and safe for developers, students, and builders!

Every catalog entry in FreeStack lives in Git under `data/offers/<category>/*.json` and is validated against `schema/offer.schema.json` and `data/sources/registry.json`.

---

## 1. Core Contribution Rules

1. **Official HTTPS Sources Only**:
   - Every offer link (`official`, `signup`, `pricing`, `documentation`) and every `evidence.sources[].url` must use `https://` and point to the provider's official domain or official GitHub repository.
   - No URL shorteners (`bit.ly`, `t.co`, `tinyurl.com`, etc.), no affiliate/referral parameters (`?ref=`, `?aff=`, `utm_*`), no credentials in URLs, and no IP literals or localhost addresses.
2. **Honest Pricing & Card Classification**:
   - Never classify a time-limited free trial (`free_trial_credit`) as an always-free tier (`free_tier`).
   - Set `access.requirements.card_required` accurately (`not_required`, `required`, `conditional`, or `unknown`). Never guess—use `"unknown"` if the official documentation does not state whether a payment card is required.
3. **Verifiable Evidence Quotes**:
   - Entries marked `"status": "verified"` must cite at least one official source in `evidence.sources` and include verbatim or factual claims in `evidence.claims` with an ISO date (`YYYY-MM-DD`).
   - Bulk-imported or community-scraped entries without human verification of pricing/quotas must be marked `"status": "unverified"` or `"status": "needs_review"`.
4. **Plain Text Only in Catalog Fields**:
   - Do not include raw HTML tags (`<script>`, `<img>`, `<iframe>`, etc.), control characters, zero-width characters, or bidirectional override characters in `name`, `provider`, `description`, `free_limits`, or `claims`.

---

## 2. What Gets Rejected Automatically

Pull requests will be rejected by CI (`npm run validate:data`) or maintainers if they contain:
- Affiliate links, referral codes, sponsored placements, or tracking query strings (`utm_*`, `ref=`, `aff=`, `partner=`).
- Non-HTTPS URLs (`http://`, `javascript:`, `data:`), punycode homograph domains (`xn--` unless explicitly allowlisted), or URL shorteners.
- Tools that require paid subscriptions upfront with no genuine free tier, open-source edition, or verified student benefit.
- Unofficial wrappers, pirated keys, leaked credentials, or services that violate third-party Terms of Service.
- Modifications that break `npm run verify` (`lint`, `test`, `validate:data`, `build`).

---

## 3. Local Development & Validation Workflow

### Prerequisites
- **Node.js**: `>= 24.0.0` (see `.nvmrc`)
- **npm**: Use `npm ci` with `package-lock.json` (do not commit alternative lockfiles).

### Running Checks Before Opening a Pull Request

```bash
# 1. Install dependencies cleanly
npm ci

# 2. Validate all catalog JSON files, schemas, URLs, and source registry rules
npm run validate:data

# 3. Run TypeScript typechecking and unit/security tests
npm run lint
npm test

# 4. Run the full verification suite (lint + test + validate:data + build)
npm run verify
```

---

## 4. Submitting Changes

1. Fork the repository and create a descriptive branch (e.g., `catalog/update-supabase-quotas` or `fix/filter-accessibility`).
2. Make your changes and run `npm run verify`.
3. Open a Pull Request completing all sections of `.github/pull_request_template.md`, including the official HTTPS pricing/docs URLs used to verify your change.

By submitting a contribution to FreeStack, you agree that your contribution is licensed under the project's [FreeStack Source-Available Non-Commercial License v1.0](./LICENSE) and that you will abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
