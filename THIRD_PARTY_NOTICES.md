# Third-Party Notices & License Inventory

FreeStack is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](./LICENSE) (Copyright © 2026 Aniket Kolse). All production runtime dependencies and upstream open-source data sources use permissive licenses (MIT, ISC, BSD-2-Clause, OFL-1.1) whose original copyright notices and terms remain preserved below.

---

## 1. Production Runtime Dependencies (`package.json`)

| Package | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| `react` | `^19.0.1` | MIT | Frontend UI library |
| `react-dom` | `^19.0.1` | MIT | DOM rendering for React |
| `express` | `^4.21.2` | MIT | HTTP server for API, `/go/:slug` redirects, and static assets |
| `helmet` | `^8.3.0` | MIT | Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) |
| `express-rate-limit` | `^8.7.4` | MIT | IP rate limiting for API, report queue, and outbound redirects |
| `zod` | `^4.6.7` | MIT | Server-side schema validation for query strings and JSON bodies |
| `lucide-react` | `^0.546.0` | ISC | UI icons |
| `motion` | `^12.23.24` | MIT | UI transitions and spring animations |
| `dotenv` | `^17.2.3` | BSD-2-Clause | Environment configuration loader |
| `@fontsource-variable/inter` | `^5.3.0` | OFL-1.1 | Self-hosted Inter variable font |
| `@fontsource-variable/plus-jakarta-sans` | `^5.3.0` | OFL-1.1 | Self-hosted Plus Jakarta Sans variable font |
| `@fontsource-variable/jetbrains-mono` | `^5.3.0` | OFL-1.1 | Self-hosted JetBrains Mono variable font |

---

## 2. Upstream Catalog Data Sources

| Dataset | Upstream Repository | License | Attribution |
| :--- | :--- | :--- | :--- |
| **Public APIs** | [`public-apis/public-apis`](https://github.com/public-apis/public-apis) | MIT | Copyright (c) Public APIs Contributors |
| **Awesome MCP Servers** | [`punkpeye/awesome-mcp-servers`](https://github.com/punkpeye/awesome-mcp-servers) | MIT | Copyright (c) Frank Fiegel (punkpeye) and Contributors |
| **FreeStack Curated Offers** | `data/offers/**` | AGPL-3.0 | Copyright © 2026 Aniket Kolse — verified against official provider documentation & pricing pages |

---

## 3. Trademarks & Nominative Fair Use

All third-party company names, service marks, and logos in `public/logos/` remain the property of their respective owners. Their inclusion in FreeStack is strictly for nominative identification of the listed developer tool or service and does not imply affiliation, sponsorship, or endorsement.
