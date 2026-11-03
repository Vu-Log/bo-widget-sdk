import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

const sdkSource = (path: string): string =>
  fileURLToPath(new URL(`../bo-widget-sdk/src/${path}`, import.meta.url));

export default defineProject({
  // Tests run against the SDK sources, so that they do not need the SDK to be built first.
  resolve: {
    alias: [
      { find: /^@vulog\/bo-widget-sdk\/manifest$/, replacement: sdkSource('manifest/index.ts') },
      { find: /^@vulog\/bo-widget-sdk$/, replacement: sdkSource('index.ts') },
    ],
  },
  test: {
    name: '@vulog/bo-widget-vite',
    // Each test builds or serves a real Vite project.
    testTimeout: 30_000,
  },
});
