import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ASSETS_DIR = path.resolve(process.cwd(), 'dist/assets');

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log('[precompress] dist/assets not found, skipping.');
    return;
  }

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => /\.(js|css|svg|json)$/i.test(f) && !f.endsWith('.gz') && !f.endsWith('.br'));

  let count = 0;
  for (const file of files) {
    const fullPath = path.join(ASSETS_DIR, file);
    const raw = fs.readFileSync(fullPath);
    if (raw.byteLength < 256) continue;

    const gz = zlib.gzipSync(raw, { level: 9 });
    fs.writeFileSync(`${fullPath}.gz`, gz);

    const br = zlib.brotliCompressSync(raw, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });
    fs.writeFileSync(`${fullPath}.br`, br);
    count++;
  }

  console.log(`[precompress] Generated .gz and .br files for ${count} assets in dist/assets.`);
}

main();
