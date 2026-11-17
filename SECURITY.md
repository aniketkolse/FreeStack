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

**Please do not open a public GitHub Issue or Pull Request for security vulnerabilities.**

If you discover a potential security issue (such as an open redirect, XSS, SSRF, path traversal, injection flaw, rate-limit bypass, or compromised/malicious catalog link), please report it privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting (Preferred)**: Use the **Security → Advisories → Report a vulnerability** button in this repository (`https://github.com/aniketkolse/FreeStack/security/advisories/new`).
2. **Direct Security Contact**: Send details to **`aniketkolse07@gmail.com`** with the subject line `[SECURITY] FreeStack Vulnerability Report`.

### What to Include

To help us investigate and resolve the issue quickly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions, proof-of-concept request/payload, and affected endpoint or file path.
- Any relevant browser, Node.js, or environment details.

### Disclosure & Response Timeline

| Stage | Target SLA |
| :--- | :--- |
| **Initial Acknowledgement** | Within **48 hours** |
| **Triage & Severity Assessment** | Within **5 business days** |
| **Critical / High Fix Release** | Within **7–14 days** |
| **Medium / Low Fix Release** | Within **30 days** |

Once a fix is merged and verified, we will coordinate public disclosure via a GitHub Security Advisory and credit you (unless you prefer to remain anonymous).

---

## Scope

### In Scope
- The Express server (`server.ts` and `src/lib/server/*`), including `/go/:slug` outbound redirects, `/api/offers`, `/api/reports`, `/sitemap.xml`, `/robots.txt`, and static/SPA routing.
- The React frontend (`src/*`), including client-side routing, URL rendering, JSON-LD / meta tag generation, and `localStorage` handling.
- The catalog validation and link-checking scripts (`scripts/*` and `src/lib/validation/*`).
- Malicious, phishing, or compromised URLs in `data/offers/**`.

### Out of Scope
- Vulnerabilities on **third-party provider websites** linked from the directory (please report those directly to the respective provider's security team; if a linked URL is compromised or malicious, report it to us so we can immediately quarantine or remove the listing).
- Volumetric denial-of-service (DoS/DDoS) attacks or automated scanner noise without a demonstrable exploit.
- Social engineering of project maintainers or contributors.

---

## Safe Harbor

We support safe harbor for good-faith security researchers:

- If you conduct security research in compliance with this policy—acting in good faith, avoiding privacy violations, service disruption, or data destruction, and reporting findings privately before public disclosure—we consider your research **authorized**.
- We will not initiate legal action or law-enforcement referral against you for good-faith testing that adheres to this policy.
- If a third party initiates legal action against you for activities conducted in accordance with this policy, we will take steps to make known that your actions were conducted in compliance with this Security Policy.
