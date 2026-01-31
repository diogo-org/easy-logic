import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test.setup.ts'],
    fileParallelism: false, // Run test files sequentially to avoid file handle issues on Windows
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/main.tsx',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
})
