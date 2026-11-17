# FreeStack — Production Deployment & Security Operations Guide

This guide covers building, hardening, deploying, and operating **FreeStack** on the public internet.

---

## 1. Runtime Prerequisites

- **Node.js**: `>= 24.0.0` (Active LTS; pinned in `.nvmrc` and `package.json#engines`)
- **Package Manager**: `npm` (single lockfile: `package-lock.json`)
- **Reverse Proxy / Edge**: Cloudflare, Nginx, Caddy, or a managed cloud load balancer terminating TLS (`HTTPS` with TLS 1.2 / 1.3)

---

## 2. Build & Verification Pipeline

Run the full verification gate before every production deployment:

```bash
# Install exact locked dependencies
npm ci

# Run TypeScript check, 65 unit/security tests, 7,881-offer schema validation, and production build
npm run verify

# Audit production dependencies for high/critical CVEs
npm run audit:prod
```

`npm run build` outputs:
- `dist/` — compiled static frontend bundle, self-hosted variable fonts, and local provider logos
- `dist-server/server.js` — compiled Express server bundle (via `esbuild`)

---

## 3. Production Environment Variables

Configure the following environment variables in your hosting platform or systemd unit:

| Variable | Required in Prod | Default | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `development` | Must be set to `production` |
| `SITE_URL` | **Yes** | — | Canonical `https://` origin (e.g., `https://freestack.dev`). Server fails fast on startup if missing or non-HTTPS in production. |
| `PORT` | No | `3000` | Port the Express server listens on |
| `HOST` | No | `0.0.0.0` | Network interface to bind (`127.0.0.1` if co-located with Nginx/Caddy) |
| `TRUST_PROXY` | Recommended | `false` | Set to `1` when behind a single reverse proxy/load balancer so `express-rate-limit` and `x-forwarded-proto` read the true client IP/protocol |
| `REPORTS_PATH` | No | `./data/reports.json` | File path for the community report queue (place on a persistent volume outside the web root) |
| `ADMIN_TOKEN` | Optional | *(disabled)* | High-entropy secret (`>= 32` characters) for `Authorization: Bearer <token>` on `GET /api/reports`. Leave empty to keep `GET /api/reports` completely disabled (`404`). |

Start the compiled production server:

```bash
NODE_ENV=production SITE_URL=https://your-domain.example.com TRUST_PROXY=1 npm run start:prod
```

---

## 4. Reverse Proxy, TLS, HSTS & WAF Configuration

1. **Enforce HTTPS & HSTS**:
   - Redirect all port `80` (`HTTP`) requests to `HTTPS` (`301`) at the edge proxy.
   - FreeStack also enforces `301` redirects in production whenever `x-forwarded-proto: http` is received and sends `Strict-Transport-Security: max-age=15552000; includeSubDomains`.
   - Enable `preload` only after verifying every subdomain supports HTTPS.
2. **Edge WAF & Rate Limiting**:
   - Put Cloudflare (or equivalent WAF) in front of the origin server.
   - Restrict origin firewall ingress on port `3000` / `443` strictly to your proxy/Cloudflare IP ranges.
   - FreeStack enforces application-layer rate limits (`240 req/min` global, `60 req/min` on `/go/:slug`, and `5 req/hour` + `200/day` global cap on `POST /api/reports`).
3. **Graceful Shutdown**:
   - `server.ts` handles `SIGINT` and `SIGTERM` with a 10-second connection drain timeout and logs fatal `unhandledRejection` / `uncaughtException` events before exiting with code `1`.

---

## 5. Exporting & Backing Up Community Reports

Community correction reports submitted via `POST /api/reports` are stored atomically in `REPORTS_PATH` (`0600` file permissions, capped at 2 MB / 500 entries).

- **Local CLI Export**:
  ```bash
  npm run export:reports -- ./backups/reports-$(date +%F).json
  ```
- **Authenticated HTTP Export** (only if `ADMIN_TOKEN` is configured):
  ```bash
  curl -fsSL -H "Authorization: Bearer $ADMIN_TOKEN" https://your-domain.example.com/api/reports
  ```

---

## 6. Note on Large Catalog JSON Files (`> 1 MB`)

Two aggregated catalog files exceed 1 MB on disk:
- `data/offers/mcp/awesome-mcp-servers-catalog.json` (~3.8 MB)
- `data/offers/apis/public-apis-catalog.json` (~5.9 MB)

Both files are validated in memory at server startup. If repository clone size grows over time, maintainers can either split those two catalog files into smaller alphabetical shards under `data/offers/mcp/` and `data/offers/apis/` (`loadOffersFromDisk()` automatically loads all `.json` files in each category subfolder) or track them with Git LFS.

---

## 7. Pre-Launch & Post-Launch 20-Point Security Gate

### Part 1 — Before Launch (10 Checks)

| # | Check | Priority | Applicability to FreeStack | Implementation / Verification Status |
| :-: | :--- | :---: | :--- | :--- |
| 1 | **Enforce HTTPS Everywhere With HSTS** | Critical | **Applicable** | Enforced via production `SITE_URL` (`https://`) fail-fast check, `301` redirect on `x-forwarded-proto: http`, and `Strict-Transport-Security: max-age=15552000; includeSubDomains`. |
| 2 | **Set Security Headers** | Important | **Applicable** | Explicit `helmet` CSP (`default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and `Permissions-Policy`. |
| 3 | **Validate Every Input & Encode Every Output** | Critical | **Applicable** | Strict Zod schemas on `/api/offers` and `/api/reports`, query pollution blocker, `safeJsonLdSerialize` + HTML attribute escaping on server-rendered tags, and `sanitizeExternalHttpsUrl` on outbound links. |
| 4 | **Protect Sessions With CSRF Tokens & Secure Cookies** | Important | **N/A — Not Forced** | FreeStack is a public, zero-login directory that sets **zero cookies** and maintains **zero user sessions**. `POST /api/reports` enforces `Sec-Fetch-Site` / `Origin` same-origin checks and `Content-Type: application/json`. |
| 5 | **Lock Down Logins** | Critical | **N/A — Not Forced (Public UI) / Hardened (Admin API)** | No user accounts or password logins exist. Maintainer read access to `GET /api/reports` is disabled by default (`404`) and requires a 32+ char `ADMIN_TOKEN` verified with constant-time SHA-256 comparison (`crypto.timingSafeEqual`). |
| 6 | **Apply Least Privilege & RBAC** | Critical | **N/A — Not Forced (No User Roles) / Enforced (Server & CI)** | No multi-tenant user roles exist. On the server and in GitHub Actions, least privilege is enforced via `permissions: contents: read`, dotfile/source route blocking (`404`), and GET-only `/api/offers`. |
| 7 | **Keep Secrets & Configuration Clean** | Critical | **Applicable** | Zero API keys or secrets in git history or client bundle; `.env*` ignored in `.gitignore`; `.env.example` uses safe placeholders; Gitleaks runs in CI. |
| 8 | **Patch Dependencies & Frameworks** | Important | **Applicable** | Single `package-lock.json`, `npm run audit:prod` (`0` vulnerabilities), weekly grouped `.github/dependabot.yml`, and CodeQL scanning. |
| 9 | **Turn Off Debug Mode & Verbose Errors** | Important | **Applicable** | `app.disable('x-powered-by')`; central Express error middleware returns generic JSON (`{"error":"Internal server error"}`) without stack traces or file paths. |
| 10 | **Test Backups & Recovery** | Critical | **Applicable** | Catalog (`7,881` offers) is Git-versioned and validated in CI; runtime reports queue uses atomic temp-file-and-rename writes (`0600`) and exports via `npm run export:reports`. |

### Part 2 — After Launch (10 Operational Checks)

| # | Check | Priority | Applicability to FreeStack | Operational Procedure |
| :-: | :--- | :---: | :--- | :--- |
| 11 | **Put a WAF, Rate Limiting & DDoS Protection in Front** | Important | **Applicable** | Application-layer rate limiters active (`express-rate-limit`); enable Cloudflare proxy/WAF in front of origin before announcing publicly. |
| 12 | **Centralise Logs & Set Up Alerts** | Important | **Applicable** | Route stdout/stderr from `dist-server/server.js` and edge proxy logs to your log sink; alert on `5xx` spikes or `429` rate-limit bursts. |
| 13 | **Monitor Uptime, SSL Expiry & Domain Changes** | Nice to have | **Applicable** | Point an uptime monitor at `GET /api/health` (`200 OK`) and configure TLS certificate & domain expiration alerts. |
| 14 | **Lock Down Email With SPF, DKIM & DMARC** | Important | **Applicable (If Custom Domain Sends Mail)** | Configure SPF, DKIM, and DMARC (`p=quarantine` or `p=reject`) on your domain DNS even if the web app itself sends no automated emails. |
| 15 | **Audit Third-Party Scripts & Tag Managers** | Important | **Applicable (Zero Third-Party Scripts)** | FreeStack loads **zero** third-party scripts, fonts, or favicons (`script-src 'self'`, `font-src 'self'`, `img-src 'self' data:`). Keep CSP strict if adding analytics later. |
| 16 | **Run Automated Vulnerability Scans on a Schedule** | Important | **Applicable** | Automated via `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `.github/workflows/gitleaks.yml`, and `.github/workflows/link-check.yml`. |
| 17 | **Review Access & Admin Accounts Quarterly** | Important | **Applicable** | Audit GitHub repo collaborators, branch protection rules on `main`, and rotate `ADMIN_TOKEN` quarterly if enabled. |
| 18 | **Verify Privacy & Cookie Compliance in Real Browsers** | Important | **Applicable** | Verified in headless Chromium: `0` cookies set, `0` third-party network requests, local storage ledger & eraser accurate on `/privacy` and `/privacy-requests`. |
| 19 | **Write a One-Page Incident Response Plan** | Nice to have | **Applicable** | Documented in `SECURITY.md` and `/.well-known/security.txt` (48h acknowledgement, 7d triage, 30d remediation target). |
| 20 | **Schedule Periodic Penetration Tests** | Nice to have | **Applicable** | Run `npm run verify` on every PR and schedule annual external review if hosting sensitive integrations in the future. |
