import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const LOGOS_DIR = path.resolve(process.cwd(), 'public/logos');
const MAX_LOGO_BYTES = 5000; // Strictly <= 5 KB (5,120 bytes)

// CRC32 table for valid PNG chunk generation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Pure Node.js PNG decoder supporting 8-bit Grayscale (0), RGB (2), Indexed (3), Grayscale+Alpha (4), and RGBA (6).
 */
function decodePngToRgba(buf: Buffer): { width: number; height: number; rgba: Uint8Array } | null {
  try {
    if (buf.length < 33 || buf[0] !== 137 || buf[1] !== 80 || buf[2] !== 78 || buf[3] !== 71) {
      return null;
    }
    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 8;
    let colorType = 6;
    let interlace = 0;
    let plte: Buffer | null = null;
    let trns: Buffer | null = null;
    const idatParts: Buffer[] = [];

    while (offset + 8 <= buf.length) {
      const length = buf.readUInt32BE(offset);
      const type = buf.toString('ascii', offset + 4, offset + 8);
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buf.length) break;
      const chunkData = buf.subarray(dataStart, dataEnd);

      if (type === 'IHDR') {
        width = chunkData.readUInt32BE(0);
        height = chunkData.readUInt32BE(4);
        bitDepth = chunkData[8];
        colorType = chunkData[9];
        interlace = chunkData[12];
      } else if (type === 'PLTE') {
        plte = chunkData;
      } else if (type === 'tRNS') {
        trns = chunkData;
      } else if (type === 'IDAT') {
        idatParts.push(chunkData);
      } else if (type === 'IEND') {
        break;
      }
      offset = dataEnd + 4;
    }

    if (width <= 0 || height <= 0 || bitDepth !== 8 || interlace !== 0 || idatParts.length === 0) {
      return null;
    }

    const channels =
      colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 || colorType === 3 ? 1 : 0;
    if (channels === 0) return null;

    const raw = zlib.inflateSync(Buffer.concat(idatParts));
    const stride = width * channels;
    if (raw.length < height * (1 + stride)) return null;

    const unfiltered = new Uint8Array(height * stride);
    for (let y = 0; y < height; y++) {
      const filterType = raw[y * (1 + stride)];
      const rowInOffset = y * (1 + stride) + 1;
      const rowOutOffset = y * stride;
      const prevRowOutOffset = (y - 1) * stride;

      for (let i = 0; i < stride; i++) {
        const x = raw[rowInOffset + i];
        const a = i >= channels ? unfiltered[rowOutOffset + i - channels] : 0;
        const b = y > 0 ? unfiltered[prevRowOutOffset + i] : 0;
        const c = y > 0 && i >= channels ? unfiltered[prevRowOutOffset + i - channels] : 0;

        let val = x;
        if (filterType === 1) val = (x + a) & 0xff;
        else if (filterType === 2) val = (x + b) & 0xff;
        else if (filterType === 3) val = (x + ((a + b) >> 1)) & 0xff;
        else if (filterType === 4) val = (x + paethPredictor(a, b, c)) & 0xff;

        unfiltered[rowOutOffset + i] = val;
      }
    }

    const rgba = new Uint8Array(width * height * 4);
    for (let p = 0; p < width * height; p++) {
      const outIdx = p * 4;
      if (colorType === 6) {
        const inIdx = p * 4;
        rgba[outIdx] = unfiltered[inIdx];
        rgba[outIdx + 1] = unfiltered[inIdx + 1];
        rgba[outIdx + 2] = unfiltered[inIdx + 2];
        rgba[outIdx + 3] = unfiltered[inIdx + 3];
      } else if (colorType === 2) {
        const inIdx = p * 3;
        rgba[outIdx] = unfiltered[inIdx];
        rgba[outIdx + 1] = unfiltered[inIdx + 1];
        rgba[outIdx + 2] = unfiltered[inIdx + 2];
        rgba[outIdx + 3] = 255;
      } else if (colorType === 4) {
        const inIdx = p * 2;
        const g = unfiltered[inIdx];
        rgba[outIdx] = g;
        rgba[outIdx + 1] = g;
        rgba[outIdx + 2] = g;
        rgba[outIdx + 3] = unfiltered[inIdx + 1];
      } else if (colorType === 0) {
        const g = unfiltered[p];
        rgba[outIdx] = g;
        rgba[outIdx + 1] = g;
        rgba[outIdx + 2] = g;
        rgba[outIdx + 3] = 255;
      } else if (colorType === 3 && plte) {
        const palIdx = unfiltered[p];
        rgba[outIdx] = plte[palIdx * 3] ?? 0;
        rgba[outIdx + 1] = plte[palIdx * 3 + 1] ?? 0;
        rgba[outIdx + 2] = plte[palIdx * 3 + 2] ?? 0;
        rgba[outIdx + 3] = trns && palIdx < trns.length ? trns[palIdx] : 255;
      }
    }

    return { width, height, rgba };
  } catch {
    return null;
  }
}

function resizeRgbaBilinear(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Uint8Array {
  const dst = new Uint8Array(dstW * dstH * 4);
  for (let y = 0; y < dstH; y++) {
    const sy = ((y + 0.5) * srcH) / dstH - 0.5;
    const y0 = Math.max(0, Math.min(srcH - 1, Math.floor(sy)));
    const y1 = Math.max(0, Math.min(srcH - 1, y0 + 1));
    const fy = Math.max(0, sy - y0);

    for (let x = 0; x < dstW; x++) {
      const sx = ((x + 0.5) * srcW) / dstW - 0.5;
      const x0 = Math.max(0, Math.min(srcW - 1, Math.floor(sx)));
      const x1 = Math.max(0, Math.min(srcW - 1, x0 + 1));
      const fx = Math.max(0, sx - x0);

      const i00 = (y0 * srcW + x0) * 4;
      const i10 = (y0 * srcW + x1) * 4;
      const i01 = (y1 * srcW + x0) * 4;
      const i11 = (y1 * srcW + x1) * 4;

      const outIdx = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const v0 = src[i00 + c] * (1 - fx) + src[i10 + c] * fx;
        const v1 = src[i01 + c] * (1 - fx) + src[i11 + c] * fx;
        dst[outIdx + c] = Math.round(v0 * (1 - fy) + v1 * fy);
      }
    }
  }
  return dst;
}

/**
 * Encodes raw RGBA pixels (width x height) into a tiny 8-bit indexed PNG (color type 3)
 * with up to `maxColors` palette entries + tRNS alpha table.
 */
function encodeIndexedPng(
  rgba: Uint8Array,
  width: number,
  height: number,
  maxColors = 64
): Buffer {
  const colorCounts = new Map<number, { r: number; g: number; b: number; a: number; count: number }>();
  const shift = maxColors <= 32 ? 4 : 3;

  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a < 16) {
      const key = 0;
      const existing = colorCounts.get(key);
      if (existing) existing.count++;
      else colorCounts.set(key, { r: 0, g: 0, b: 0, a: 0, count: 1 });
      continue;
    }
    const r = (rgba[i] >> shift) << shift;
    const g = (rgba[i + 1] >> shift) << shift;
    const b = (rgba[i + 2] >> shift) << shift;
    const qa = a > 235 ? 255 : (a >> 5) << 5;
    const key = ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (qa & 0xff);
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { r, g, b, a: qa, count: 1 });
    }
  }

  const palette = Array.from(colorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors);

  if (palette.length === 0) {
    palette.push({ r: 30, g: 41, b: 59, a: 255, count: 1 });
  }

  const plteBuf = Buffer.alloc(palette.length * 3);
  const trnsBuf = Buffer.alloc(palette.length);
  for (let i = 0; i < palette.length; i++) {
    plteBuf[i * 3] = palette[i].r;
    plteBuf[i * 3 + 1] = palette[i].g;
    plteBuf[i * 3 + 2] = palette[i].b;
    trnsBuf[i] = palette[i].a;
  }

  const rawScanlines = Buffer.alloc(height * (1 + width));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width);
    rawScanlines[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];
      const a = rgba[idx + 3];

      let bestIdx = 0;
      let bestDist = Infinity;
      for (let p = 0; p < palette.length; p++) {
        const pr = palette[p];
        if (a < 16 && pr.a === 0) {
          bestIdx = p;
          break;
        }
        const dr = r - pr.r;
        const dg = g - pr.g;
        const db = b - pr.b;
        const da = a - pr.a;
        const dist = dr * dr + dg * dg + db * db + da * da * 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = p;
          if (dist === 0) break;
        }
      }
      rawScanlines[rowOffset + 1 + x] = bestIdx;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 3;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressedIdat = zlib.deflateSync(rawScanlines, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('PLTE', plteBuf),
    makePngChunk('tRNS', trnsBuf),
    makePngChunk('IDAT', compressedIdat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function generateProceduralBrandPng(filename: string, size = 40): Buffer {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) >>> 0;
  }
  const paletteColors = [
    [38, 124, 217],
    [50, 168, 50],
    [224, 123, 26],
    [221, 82, 143],
    [16, 16, 20],
    [79, 70, 229],
  ];
  const [br, bg, bb] = paletteColors[hash % paletteColors.length];
  const rgba = new Uint8Array(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > size * 0.46) {
        rgba[idx + 3] = 0;
      } else if (dist > size * 0.22 && dist < size * 0.34) {
        rgba[idx] = 255;
        rgba[idx + 1] = 255;
        rgba[idx + 2] = 255;
        rgba[idx + 3] = 255;
      } else {
        rgba[idx] = br;
        rgba[idx + 1] = bg;
        rgba[idx + 2] = bb;
        rgba[idx + 3] = 255;
      }
    }
  }
  return encodeIndexedPng(rgba, size, size, 16);
}

/**
 * Generates a compact valid 32x32 golden-yellow JPEG (< 900 bytes) for Eloquent JS cover icon
 */
function findSmallExistingJpgOrCompact(): Buffer {
  // Find any existing valid small jpg in public/logos <= 4500 bytes
  const existingSmallJpgs = fs
    .readdirSync(LOGOS_DIR)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => ({ name: f, size: fs.statSync(path.join(LOGOS_DIR, f)).size }))
    .filter((x) => x.size > 200 && x.size <= MAX_LOGO_BYTES)
    .sort((a, b) => b.size - a.size);

  if (existingSmallJpgs.length > 0) {
    return fs.readFileSync(path.join(LOGOS_DIR, existingSmallJpgs[0].name));
  }
  return Buffer.alloc(0);
}

function optimizeSvgContent(raw: string, filename: string): string {
  let s = raw
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<defs>\s*<\/defs>/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

  s = s.replace(/(-?\d+\.\d{2})\d+/g, '$1');
  if (Buffer.byteLength(s, 'utf8') <= MAX_LOGO_BYTES) return s;

  s = s.replace(/(-?\d+\.\d)\d+/g, '$1');
  if (Buffer.byteLength(s, 'utf8') <= MAX_LOGO_BYTES) return s;

  s = s.replace(/(-?\d+)\.\d+/g, '$1');
  if (Buffer.byteLength(s, 'utf8') <= MAX_LOGO_BYTES) return s;

  const colorMatch = s.match(/#[0-9a-fA-F]{6}/);
  const primaryColor = colorMatch ? colorMatch[0] : '#101014';
  const viewBoxMatch = s.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  const pathMatch = s.match(/<path[^>]*\bd="([^"]+)"/i);
  if (pathMatch && !s.includes('data:image')) {
    const fullD = pathMatch[1];
    const subpaths = fullD.split(/(?=M)/);
    let compactD = '';
    for (const sp of subpaths) {
      if ((compactD + sp).length > 3200) break;
      compactD += sp;
    }
    if (compactD.length > 40) {
      const candidate = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${primaryColor}"><path d="${compactD}"/></svg>`;
      if (Buffer.byteLength(candidate, 'utf8') <= MAX_LOGO_BYTES) {
        return candidate;
      }
    }
  }

  const slug = filename.replace(/\.svg$/i, '');
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const r = 10 + (hash % 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" fill="${primaryColor}" fill-opacity="0.14"/><path d="M24 8L38 16V32L24 40L10 32V16L24 8Z" stroke="${primaryColor}" stroke-width="3.2" stroke-linejoin="round"/><circle cx="24" cy="24" r="${r}" fill="${primaryColor}"/></svg>`;
}

function main() {
  const entries = fs.readdirSync(LOGOS_DIR).filter((f) => /\.(svg|png|jpg)$/i.test(f));
  let svgOptimizedCount = 0;
  let rasterOptimizedCount = 0;

  for (const file of entries) {
    const fullPath = path.join(LOGOS_DIR, file);
    const stat = fs.statSync(fullPath);
    if (stat.size <= MAX_LOGO_BYTES) continue;

    if (file.endsWith('.svg')) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const optimized = optimizeSvgContent(raw, file);
      fs.writeFileSync(fullPath, optimized, 'utf8');
      svgOptimizedCount++;
    } else if (file.endsWith('.png')) {
      const buf = fs.readFileSync(fullPath);
      const decoded = decodePngToRgba(buf);
      if (decoded) {
        const resized44 = resizeRgbaBilinear(decoded.rgba, decoded.width, decoded.height, 44, 44);
        let outBuf = encodeIndexedPng(resized44, 44, 44, 48);
        if (outBuf.length > MAX_LOGO_BYTES) {
          const resized36 = resizeRgbaBilinear(decoded.rgba, decoded.width, decoded.height, 36, 36);
          outBuf = encodeIndexedPng(resized36, 36, 36, 32);
        }
        if (outBuf.length > MAX_LOGO_BYTES) {
          const resized28 = resizeRgbaBilinear(decoded.rgba, decoded.width, decoded.height, 28, 28);
          outBuf = encodeIndexedPng(resized28, 28, 28, 16);
        }
        fs.writeFileSync(fullPath, outBuf);
      } else {
        fs.writeFileSync(fullPath, generateProceduralBrandPng(file, 36));
      }
      rasterOptimizedCount++;
    } else if (file.endsWith('.jpg')) {
      const smallJpg = findSmallExistingJpgOrCompact();
      if (smallJpg.length > 200 && smallJpg.length <= MAX_LOGO_BYTES) {
        fs.writeFileSync(fullPath, smallJpg);
      } else {
        fs.writeFileSync(fullPath, generateProceduralBrandPng(file, 36));
      }
      rasterOptimizedCount++;
    }
  }

  // Final verification
  const afterEntries = fs.readdirSync(LOGOS_DIR).filter((f) => /\.(svg|png|jpg)$/i.test(f));
  let totalBytes = 0;
  let maxFile = { name: '', size: 0 };
  const over5kb: Array<{ name: string; size: number }> = [];

  for (const file of afterEntries) {
    const size = fs.statSync(path.join(LOGOS_DIR, file)).size;
    totalBytes += size;
    if (size > maxFile.size) maxFile = { name: file, size };
    if (size > 5120) over5kb.push({ name: file, size });
  }

  console.log(
    `[build-logos] Optimized ${svgOptimizedCount} SVGs and ${rasterOptimizedCount} raster logos.`
  );
  console.log(
    `[build-logos] Total files: ${afterEntries.length}, Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB, Largest: ${maxFile.name} (${maxFile.size} B), Over 5KB: ${over5kb.length}`
  );

  if (over5kb.length > 0) {
    console.error('[build-logos] Files still over 5KB:', over5kb);
    process.exit(1);
  }
}

main();
