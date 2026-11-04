import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

const sdkSource = (path: string): string =>
  fileURLToPath(new URL(`../bo-widget-sdk/src/${path}`, import.meta.url));

export default defineProject({
  // Tests run against the SDK sources, so that they do not need the SDK to be built first.
  resolve: {
    alias: [{ find: /^@vulog\/bo-widget-sdk$/, replacement: sdkSource('index.ts') }],
  },
  test: {
    name: '@vulog/bo-widget-react',
    environment: 'happy-dom',
  },
});
