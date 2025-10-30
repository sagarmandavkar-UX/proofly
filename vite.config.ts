import path from 'node:path';
import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest.config.js';
import { name, version } from './package.json';

export default defineConfig(({ command }) => ({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  build: {
    target: 'esnext',
    outDir: command === 'serve' ? 'dev' : 'dist',
  },
  plugins: [
    crx({ manifest }),
    zip({
      outDir: 'release',
      outFileName: `crx-${name.toLowerCase()}-${version}.zip`,
    }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
  logLevel: 'info',
}));
