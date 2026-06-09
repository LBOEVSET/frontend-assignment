import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/index.ts',   // pure type declarations — no runtime statements
        'src/**/*.module.css',
      ],
      thresholds: {
        lines:      80,
        functions:  80,
        statements: 80,
        branches:   65,   // branch coverage is naturally lower in UI code
      },
    },
  },
});
