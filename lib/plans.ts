export type PlanId = 'community' | 'professional' | 'institution' | 'enterprise'

export const PLANS: Record<PlanId, {
  label: string
  price: string
  artifacts: number | null  // null = unlimited
  staff: number | null       // null = unlimited
  fullMode: boolean
  analytics: boolean
  compliance: boolean
  features: string[]
}> = {
  community: {
    label: 'Community',
    price: 'Free',
    artifacts: 150,
    staff: null,
    fullMode: false,
    analytics: false,
    compliance: false,
    features: ['Up to 150 collection items', 'Public collection website', 'Basic site customisation'],
  },
  professional: {
    label: 'Professional',
    price: '£79/mo',
    artifacts: 5000,
    staff: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    features: ['Up to 5,000 collection items', 'Full public website', '10 staff accounts', 'Collections compliance tools', 'Analytics'],
  },
  institution: {
    label: 'Institution',
    price: '£349/mo',
    artifacts: 100000,
    staff: null,
    fullMode: true,
    analytics: true,
    compliance: true,
    features: ['Up to 100,000 collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Priority support'],
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Contact us',
    artifacts: null,
    staff: null,
    fullMode: true,
    analytics: true,
    compliance: true,
    features: ['Unlimited collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Dedicated support', 'Custom integrations'],
  },
}

export const PLAN_ORDER: PlanId[] = ['community', 'professional', 'institution', 'enterprise']

export function getPlan(plan: string) {
  return PLANS[plan as PlanId] ?? PLANS.community
}
