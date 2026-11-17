import dns from 'node:dns';
import fs from 'node:fs';
import net from 'node:net';
import { loadOffersFromDisk } from '../src/lib/data/nodeLoader';
import { isSafeHttpsUrl } from '../src/lib/validation/offerValidator';

const TIMEOUT_MS = 8_000;
const CONCURRENCY = 5;
const MAX_REDIRECT_HOPS = 5;
const USER_AGENT = 'FreeStack-LinkChecker/1.0 (+https://freestack.dev/about)';

function isPrivateOrReservedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const parts = ip.split('.').map((p) => Number.parseInt(p, 10));
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // Multicast / reserved
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('::ffff:127.') ||
      lower.startsWith('::ffff:10.') ||
      lower.startsWith('::ffff:169.254.') ||
      lower.startsWith('::ffff:192.168.')
    ) {
      return true;
    }
    return false;
  }
  return true;
}

async function assertHostResolvesToPublicIp(hostname: string): Promise<void> {
  const records = await dns.promises.lookup(hostname, { all: true });
  if (!records || records.length === 0) {
    throw new Error(`DNS lookup returned no addresses for ${hostname}`);
  }
  for (const rec of records) {
    if (isPrivateOrReservedIp(rec.address)) {
      throw new Error(`SSRF blocked: ${hostname} resolved to private/reserved IP ${rec.address}`);
    }
  }
}

async function checkUrlWithManualRedirects(
  initialUrl: string
): Promise<{ url: string; ok: boolean; status: number; finalUrl?: string; error?: string }> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    if (!isSafeHttpsUrl(currentUrl)) {
      return {
        url: initialUrl,
        ok: false,
        status: 0,
        error: `Blocked unsafe or non-HTTPS URL at hop ${hop}: ${currentUrl}`,
      };
    }

    const parsed = new URL(currentUrl);
    try {
      await assertHostResolvesToPublicIp(parsed.hostname);
    } catch (err) {
      return {
        url: initialUrl,
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : 'DNS validation failed',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return {
            url: initialUrl,
            ok: false,
            status: response.status,
            error: `Redirect (${response.status}) missing Location header`,
          };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const ok = response.status >= 200 && response.status < 400;
      return {
        url: initialUrl,
        ok,
        status: response.status,
        finalUrl: currentUrl,
      };
    } catch (err) {
      clearTimeout(timer);
      return {
        url: initialUrl,
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : 'Unknown fetch error',
      };
    }
  }

  return {
    url: initialUrl,
    ok: false,
    status: 0,
    error: `Exceeded maximum redirect hops (${MAX_REDIRECT_HOPS})`,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArgIdx = args.indexOf('--limit');
  const maxUrls =
    limitArgIdx !== -1 && args[limitArgIdx + 1]
      ? Number.parseInt(args[limitArgIdx + 1], 10)
      : 50;
  const outputArgIdx = args.indexOf('--output');
  const outputPath =
    outputArgIdx !== -1 && args[outputArgIdx + 1] ? args[outputArgIdx + 1] : null;

  const offers = loadOffersFromDisk();
  const uniqueUrls = new Set<string>();

  for (const offer of offers) {
    uniqueUrls.add(offer.links.official);
    if (offer.links.pricing) uniqueUrls.add(offer.links.pricing);
    if (offer.links.documentation) uniqueUrls.add(offer.links.documentation);
    for (const src of offer.evidence.sources) {
      uniqueUrls.add(src.url);
    }
  }

  const allUrls = Array.from(uniqueUrls);

  if (dryRun) {
    console.log(
      `[dry-run] Validated ${allUrls.length} unique HTTPS URLs across ${offers.length} offers.`
    );
    const nonHttps = allUrls.filter((u) => !isSafeHttpsUrl(u));
    if (nonHttps.length > 0) {
      console.error(`Found ${nonHttps.length} unsafe URLs!`);
      process.exit(1);
    }
    console.log('[dry-run] 100% of URLs pass strict HTTPS + SSRF host syntax check.');
    return;
  }

  const urlList = allUrls.slice(0, maxUrls);
  console.log(
    `Checking ${urlList.length} of ${allUrls.length} unique URLs (concurrency=${CONCURRENCY}, maxHops=${MAX_REDIRECT_HOPS})...`
  );

  const results: Awaited<ReturnType<typeof checkUrlWithManualRedirects>>[] = [];
  for (let i = 0; i < urlList.length; i += CONCURRENCY) {
    const batch = urlList.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.all(batch.map((u) => checkUrlWithManualRedirects(u)));
    results.push(...batchRes);
  }

  const failures = results.filter((r) => !r.ok);
  if (outputPath) {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          checked: results.length,
          totalCatalogUrls: allUrls.length,
          failures,
        },
        null,
        2
      ),
      'utf-8'
    );
  }

  for (const res of results) {
    if (res.ok) {
      console.log(`  [OK ${res.status}] ${res.url}`);
    } else {
      console.warn(`  [WARN ${res.status}] ${res.url} (${res.error ?? 'Non-2xx status'})`);
    }
  }

  if (failures.length > 0) {
    console.warn(
      `\n${failures.length} of ${results.length} checked URL(s) were unreachable or failed redirect validation.`
    );
    process.exit(1);
  }
}

main();
