import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest configuration for React projects
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test.setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'e2e/',
        '**/*.test.ts',
        '**/*.e2e.ts',
        '**/*.config.*',
        '**/test.setup.ts',
        '**/vite-env.d.ts',
        '**/main.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
