# Security Policy

FreeStack takes the security of our application, catalog data, and users seriously. We appreciate responsible disclosure from the security and open-source community.

---

## Supported Versions

Security fixes are applied to the latest release on the `main` branch.

| Version / Branch | Supported |
| :--- | :---: |
| `main` (Latest) | ✅ |
| Older snapshots / forks | ❌ |

---

## Reporting a Vulnerability

**Please do not open a public GitHub Issue for security vulnerabilities.**

If you discover a potential security issue (such as an open redirect, XSS, SSRF, arbitrary file access, injection flaw, or malicious catalog link), please report it privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting**: Use the **Security → Advisories → Report a vulnerability** button in this repository (recommended).
2. **Direct Email**: Send details to **`aniketkolse07@gmail.com`** with the subject line `[SECURITY] FreeStack Vulnerability Report`.

### What to Include

To help us investigate and resolve the issue quickly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions, proof-of-concept request/payload, or affected endpoint/file path.
- Any relevant browser, Node.js, or environment details.

### Disclosure & Response Timeline

- **Acknowledgement**: Within **48 hours** of receiving your report.
- **Triage & Assessment**: Within **5 business days**, confirming severity and reproduction.
- **Remediation**: Critical and high-severity issues are prioritized for immediate patching on `main`.
- **Coordinated Disclosure**: Once a fix is merged and verified, we will coordinate public disclosure and credit you (unless you prefer to remain anonymous).

---

## Built-In Security Controls

FreeStack enforces the following architectural safeguards across the server, client, and catalog pipeline:

1. **Allowlisted Outbound Redirects (`/go/:slug`)**:
   - Outbound links only resolve from pre-validated offer entries in `data/offers/` (`official`, `signup`, `docs`, `pricing`).
   - Every destination URL is checked with `isSafeHttpsUrl()` to enforce `https://` and prevent open redirects, `javascript:` URIs, or arbitrary query redirection.
   - Responses set `Referrer-Policy: strict-origin-when-cross-origin` and `X-Robots-Tag: noindex`.
2. **Strict Catalog URL & Schema Validation (`npm run validate:data`)**:
   - Every offer JSON file is validated against `schema/offer.schema.json` to ensure official links, logo paths, and source evidence URLs use HTTPS or local safe asset paths.
3. **API Payload & Input Bounds (`server.ts`)**:
   - `express.json({ limit: '64kb' })` caps request payload sizes.
   - `POST /api/reports` enforces strict length limits (`offerName` 2–160 chars, `details` 8–2000 chars), allowlisted `reportType` enums, and `isSafeHttpsUrl()` checks on optional source URLs.
4. **Zero Runtime Secrets for Public Browsing**:
   - Public browsing requires no user login, no database credentials, and no client-exposed API keys. User bookmarks (`Saved`) and theme preferences stay strictly client-side in `localStorage`.
5. **Escaped XML Sitemap Output**:
   - Dynamic `/sitemap.xml` generation escapes all XML entities (`&`, `<`, `>`, `"`, `'`).

---

## Out-of-Scope Issues

- Vulnerabilities on **third-party provider websites** linked from the directory (please report those directly to the respective provider's security team; if a linked URL is compromised or malicious, let us know immediately so we can delist or quarantine it).
- Automated scanner noise or missing HTTP headers that do not demonstrate an exploitable vulnerability.
- Denial-of-service / volumetric load testing against hosted preview URLs.
