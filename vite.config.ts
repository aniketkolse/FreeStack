import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function inlineBuiltCssPlugin(): Plugin {
  return {
    name: 'freestack-inline-built-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = bundle['index.html'];
      if (!htmlAsset || htmlAsset.type !== 'asset' || typeof htmlAsset.source !== 'string') {
        return;
      }

      let html = htmlAsset.source;
      const inlinedFiles: string[] = [];

      html = html.replace(
        /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']\/?(assets\/[^"']+\.css)["'][^>]*>/gi,
        (match, cssPath: string) => {
          const cssAsset = bundle[cssPath];
          if (!cssAsset || cssAsset.type !== 'asset') {
            return match;
          }
          const rawCss =
            typeof cssAsset.source === 'string'
              ? cssAsset.source
              : Buffer.from(cssAsset.source).toString('utf8');
          const safeCss = rawCss.replace(/<\/style/gi, '<\\/style');
          inlinedFiles.push(cssPath);
          return `<style>${safeCss}</style>`;
        }
      );

      if (inlinedFiles.length > 0) {
        htmlAsset.source = html;
        for (const file of inlinedFiles) {
          delete bundle[file];
        }
      }
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }

  return {
    plugins: [react(), tailwindcss(), inlineBuiltCssPlugin()],
    define:
      command === 'build'
        ? {
            'process.env.NODE_ENV': JSON.stringify('production'),
          }
        : undefined,
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 400,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
