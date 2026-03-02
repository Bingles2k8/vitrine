import Stripe from 'stripe'
import type { PlanId } from './plans'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

export const STRIPE_PRICE_MAP: Partial<Record<PlanId, string>> = {
  hobbyist: process.env.STRIPE_PRICE_HOBBYIST!,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL!,
  institution: process.env.STRIPE_PRICE_INSTITUTION!,
}

// Reverse lookup: Stripe price ID -> PlanId
export const PRICE_TO_PLAN: Record<string, PlanId> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_MAP)
    .filter(([, v]) => v)
    .map(([k, v]) => [v, k as PlanId])
)
