import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', '.next', 'scripts', 'dist', 'build'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'scripts/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types/',
      ],
      thresholds: {
        // Security-critical areas require higher coverage
        'src/lib/auth/': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
        'src/lib/posts/permissions.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
