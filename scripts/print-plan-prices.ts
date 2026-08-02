// Dev utility: prints the computed multi-currency plan price table for manual
// review before pushing amounts to Stripe. Run with: npx tsx scripts/print-plan-prices.ts
import { PLAN_PRICES, FX_SNAPSHOT, GBP_BASE_PRICE } from '../lib/planPricing'
import { BILLING_CURRENCIES } from '../lib/countryCurrency'

for (const plan of Object.keys(GBP_BASE_PRICE) as (keyof typeof GBP_BASE_PRICE)[]) {
  console.log(`\n${plan.toUpperCase()} (base £${GBP_BASE_PRICE[plan]})`)
  for (const currency of BILLING_CURRENCIES) {
    const amount = PLAN_PRICES[plan][currency]
    const gbpEquivalent = amount / FX_SNAPSHOT[currency]
    const ok = gbpEquivalent >= GBP_BASE_PRICE[plan] ? 'OK' : 'FAIL'
    console.log(
      `  ${currency.padEnd(4)} ${String(amount).padStart(7)}   (≈ £${gbpEquivalent.toFixed(2).padStart(7)})  ${ok}`
    )
  }
}
