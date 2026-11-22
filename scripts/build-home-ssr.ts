import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App.tsx';

const rootDir = process.cwd();
const outPath = path.join(rootDir, 'src', 'lib', 'server', 'homeSsrBody.html');
const html = renderToString(React.createElement(App));

if (!html || !html.includes('Find more.')) {
  throw new Error('[build-home-ssr] Rendered HTML is unexpectedly empty or missing hero copy.');
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf-8');

const kb = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(2);
console.log(`[build-home-ssr] Wrote ${outPath} (${kb} KB)`);
