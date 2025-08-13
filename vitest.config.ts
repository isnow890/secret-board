import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/setup.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    env: {
      NODE_ENV: 'test',
    },
    include: ['tests/unit/**/*.test.ts', 'tests/utils/**/*.test.ts', 'tests/api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        'tests/**',
        'e2e/**',
        'node_modules/**'
      ]
    }
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),
      '@': path.resolve(__dirname, '.')
    }
  }
})