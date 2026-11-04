import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'scripts',
    environment: 'node',
    include: ['**/*.test.mjs'],
    // The CLI tests spawn node processes.
    testTimeout: 20_000,
  },
});
