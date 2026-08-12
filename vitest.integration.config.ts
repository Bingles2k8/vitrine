import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Integration tests that talk to real external services.
 *
 * Separate from vitest.config.ts so `npm test` stays offline and fast. These
 * hit the Stripe API, drive test clocks, and take minutes rather than
 * milliseconds, which is unusable in a watch loop.
 *
 * Run with: npm run test:refund
 *
 * The real credentials are read from .env.local by the tests themselves. The
 * dummy values below exist only so module-level singletons construct without
 * throwing; nothing here is used to talk to anything. The Stripe client used
 * for actual calls is injected by the test.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['integration/**/*.integration.ts'],
    // A test clock advance can take a minute on its own.
    testTimeout: 300_000,
    hookTimeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      STRIPE_SECRET_KEY: 'sk_test_dummy',
      NEXT_PUBLIC_SITE_URL: 'https://vitrinecms.com',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
