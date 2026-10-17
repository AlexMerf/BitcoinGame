import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base keeps the build portable for GitHub Pages, Vercel,
  // Netlify, or simply opening dist/index.html from a static host.
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
