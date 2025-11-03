import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/**/*.spec.ts'],

    // Timeout settings for browser tests
    testTimeout: 30000,
    hookTimeout: 30000,

    // Global setup that runs once before all tests
    globalSetup: ['./tests/helpers/global-setup.ts'],

    // Setup file that runs before each test file
    setupFiles: ['./tests/helpers/setup.ts'],

    // Console output
    reporters: ['verbose'],
  },
});
