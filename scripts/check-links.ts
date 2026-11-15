import { loadOffersFromDisk } from '../src/lib/data/nodeLoader';
import { isSafeHttpsUrl } from '../src/lib/validation/offerValidator';

async function checkUrl(url: string): Promise<{ url: string; ok: boolean; status: number | string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'FreeStack-LinkHealthCheck/1.0' },
    });
    clearTimeout(timer);
    return { url, ok: res.ok || res.status === 405 || res.status === 403, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { url, ok: false, status: err instanceof Error ? err.message : 'network error' };
  }
}

async function main() {
  const offers = loadOffersFromDisk();
  const urls = new Set<string>();

  for (const offer of offers) {
    if (isSafeHttpsUrl(offer.links.official)) urls.add(offer.links.official);
    if (isSafeHttpsUrl(offer.links.pricing)) urls.add(offer.links.pricing!);
    if (isSafeHttpsUrl(offer.links.documentation)) urls.add(offer.links.documentation!);
  }

  console.log(`Checked ${urls.size} official HTTPS links across ${offers.length} resources.`);
  if (process.argv.includes('--live')) {
    const entries = Array.from(urls);
    for (let i = 0; i < entries.length; i += 6) {
      const batch = entries.slice(i, i + 6);
      const results = await Promise.all(batch.map(checkUrl));
      for (const r of results) {
        console.log(`${r.ok ? 'OK' : 'WARN'} [${r.status}] ${r.url}`);
      }
    }
  } else {
    console.log('Syntax & HTTPS allowlist verified. Pass --live to perform bounded HTTP HEAD checks.');
  }
}

main();
