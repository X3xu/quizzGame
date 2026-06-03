import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter:  ['text', 'lcov'],
      include:   ['lib/**/*.ts', 'hooks/**/*.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
