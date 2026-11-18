import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGETS = {
  maxFirstLoadJsGzipKB: 150,
  maxCssGzipKB: 40,
  maxSingleChunkGzipKB: 250,
  maxFirstLoadDataGzipKB: 100,
  maxCriticalFontsKB: 100,
  maxSingleLogoBytes: 5120,
};

function gzipSizeKB(buf: Buffer): number {
  return Number((zlib.gzipSync(buf, { level: 9 }).byteLength / 1024).toFixed(2));
}

function main() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const assetsDir = path.join(distDir, 'assets');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath) || !fs.existsSync(assetsDir)) {
    console.error('[perf:check] dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  const failures: string[] = [];
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  // 1. Check all JS and CSS chunks in dist/assets
  const assetFiles = fs
    .readdirSync(assetsDir)
    .filter(
      (f) =>
        !f.endsWith('.gz') &&
        !f.endsWith('.br') &&
        fs.statSync(path.join(assetsDir, f)).isFile()
    );

  let totalCssGzipKB = 0;
  let maxChunkName = '';
  let maxChunkGzipKB = 0;

  for (const file of assetFiles) {
    const buf = fs.readFileSync(path.join(assetsDir, file));
    const gzKB = gzipSizeKB(buf);
    if (file.endsWith('.css')) {
      totalCssGzipKB += gzKB;
    }
    if (file.endsWith('.js') || file.endsWith('.css')) {
      if (gzKB > maxChunkGzipKB) {
        maxChunkGzipKB = gzKB;
        maxChunkName = file;
      }
      if (gzKB > BUDGETS.maxSingleChunkGzipKB) {
        failures.push(
          `Chunk ${file} (${gzKB} KB gzip) exceeds single-chunk budget (${BUDGETS.maxSingleChunkGzipKB} KB gzip)`
        );
      }
    }
  }

  // 2. Check Home first-load JS (entry module + any modulepreload links in index.html)
  const initialJsMatches = Array.from(
    indexHtml.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)
  ).map((m) => m[1]);
  const uniqueInitialJs = Array.from(new Set(initialJsMatches));

  let firstLoadJsGzipKB = 0;
  for (const jsFile of uniqueInitialJs) {
    const p = path.join(assetsDir, jsFile);
    if (fs.existsSync(p)) {
      firstLoadJsGzipKB += gzipSizeKB(fs.readFileSync(p));
    }
  }
  firstLoadJsGzipKB = Number(firstLoadJsGzipKB.toFixed(2));
  totalCssGzipKB = Number(totalCssGzipKB.toFixed(2));

  if (firstLoadJsGzipKB > BUDGETS.maxFirstLoadJsGzipKB) {
    failures.push(
      `Home first-load JS (${firstLoadJsGzipKB} KB gzip) exceeds budget (${BUDGETS.maxFirstLoadJsGzipKB} KB gzip)`
    );
  }
  if (totalCssGzipKB > BUDGETS.maxCssGzipKB) {
    failures.push(
      `Total CSS (${totalCssGzipKB} KB gzip) exceeds budget (${BUDGETS.maxCssGzipKB} KB gzip)`
    );
  }

  // 3. Check Home bootstrap data payload
  const bootstrapPath = path.resolve(process.cwd(), 'src/lib/data/homeBootstrap.json');
  const bootstrapGzipKB = fs.existsSync(bootstrapPath)
    ? gzipSizeKB(fs.readFileSync(bootstrapPath))
    : 0;
  if (bootstrapGzipKB > BUDGETS.maxFirstLoadDataGzipKB) {
    failures.push(
      `Home bootstrap data (${bootstrapGzipKB} KB gzip) exceeds budget (${BUDGETS.maxFirstLoadDataGzipKB} KB gzip)`
    );
  }

  // 4. Check critical preloaded fonts in index.html
  const preloadFontMatches = Array.from(
    indexHtml.matchAll(/<link[^>]+rel="preload"[^>]+href="([^"]+\.woff2)"/gi)
  ).map((m) => m[1]);
  let criticalFontsKB = 0;
  for (const fontHref of preloadFontMatches) {
    const diskFontPath = path.join(process.cwd(), 'public', fontHref.replace(/^\//, ''));
    if (fs.existsSync(diskFontPath)) {
      criticalFontsKB += fs.statSync(diskFontPath).size / 1024;
    }
  }
  criticalFontsKB = Number(criticalFontsKB.toFixed(2));
  if (criticalFontsKB > BUDGETS.maxCriticalFontsKB) {
    failures.push(
      `Critical preloaded fonts (${criticalFontsKB} KB) exceed budget (${BUDGETS.maxCriticalFontsKB} KB)`
    );
  }

  // 5. Check all logos in public/logos <= 5 KB
  const logosDir = path.resolve(process.cwd(), 'public/logos');
  const logoFiles = fs.readdirSync(logosDir).filter((f) => /\.(svg|png|jpg)$/i.test(f));
  let oversizedLogos = 0;
  let largestLogo = { name: '', bytes: 0 };
  for (const file of logoFiles) {
    const bytes = fs.statSync(path.join(logosDir, file)).size;
    if (bytes > largestLogo.bytes) largestLogo = { name: file, bytes };
    if (bytes > BUDGETS.maxSingleLogoBytes) {
      oversizedLogos++;
    }
  }
  if (oversizedLogos > 0) {
    failures.push(
      `${oversizedLogos} logo(s) in public/logos exceed ${BUDGETS.maxSingleLogoBytes} bytes (largest: ${largestLogo.name} at ${largestLogo.bytes} B)`
    );
  }

  console.log('=== FreeStack Performance Budget Check ===');
  console.log(
    `  Home First-Load JS (gzip): ${firstLoadJsGzipKB} KB / ${BUDGETS.maxFirstLoadJsGzipKB} KB`
  );
  console.log(`  Total CSS (gzip):          ${totalCssGzipKB} KB / ${BUDGETS.maxCssGzipKB} KB`);
  console.log(
    `  Largest Chunk (gzip):      ${maxChunkGzipKB} KB (${maxChunkName}) / ${BUDGETS.maxSingleChunkGzipKB} KB`
  );
  console.log(
    `  Home Data Payload (gzip):  ${bootstrapGzipKB} KB / ${BUDGETS.maxFirstLoadDataGzipKB} KB`
  );
  console.log(
    `  Critical Fonts (raw woff2): ${criticalFontsKB} KB / ${BUDGETS.maxCriticalFontsKB} KB`
  );
  console.log(
    `  Max Logo Size:             ${largestLogo.bytes} B (${largestLogo.name}) / ${BUDGETS.maxSingleLogoBytes} B (${oversizedLogos} over 5KB)`
  );

  if (failures.length > 0) {
    console.error('\n[perf:check] FAILED:');
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log('\n[perf:check] PASSED all performance budgets.');
}

main();
