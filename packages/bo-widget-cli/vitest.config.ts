import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

const source = (path: string): string => fileURLToPath(new URL(`../${path}`, import.meta.url));

export default defineProject({
  // Tests run against the sources of the other packages, so that they need no build first.
  resolve: {
    alias: [
      {
        find: /^@vulog\/bo-widget-sdk\/manifest$/,
        replacement: source('bo-widget-sdk/src/manifest/index.ts'),
      },
      { find: /^@vulog\/bo-widget-sdk$/, replacement: source('bo-widget-sdk/src/index.ts') },
      { find: /^@vulog\/bo-widget-vite$/, replacement: source('bo-widget-vite/src/index.ts') },
    ],
  },
  test: {
    name: '@vulog/bo-widget-cli',
    // The integration test builds a real Vite project.
    testTimeout: 30_000,
  },
});
