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
    ],
  },
  test: {
    name: '@vulog/create-bo-widget',
    // Only the generator: the tests of the templates run in the generated projects (CI job).
    include: ['src/**/*.test.ts'],
  },
});
