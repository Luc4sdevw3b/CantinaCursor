import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'threads',
    include: ['tests/{unit,integration}/**/*.test.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
});
