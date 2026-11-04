import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'scripts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**', 'scripts/**/*.mjs'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.test.mjs',
        'scripts/**/__fixtures__/**',
        'scripts/vitest.config.mjs',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
