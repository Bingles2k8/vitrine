import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      STRIPE_SECRET_KEY: 'sk_test_dummy',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_HOBBYIST: 'price_hobbyist_test',
      STRIPE_PRICE_PROFESSIONAL: 'price_professional_test',
      STRIPE_PRICE_INSTITUTION: 'price_institution_test',
      RESEND_API_KEY: 'test-resend-key',
      NEXT_PUBLIC_SITE_URL: 'https://vitrinecms.com',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
