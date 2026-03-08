export type PlanId = 'community' | 'hobbyist' | 'professional' | 'institution' | 'enterprise'

export const PLANS: Record<PlanId, {
  label: string
  price: string
  artifacts: number | null  // null = unlimited
  staff: number | null       // null = unlimited
  imagesPerArtifact: number
  fullMode: boolean
  analytics: boolean
  compliance: boolean
  ticketing: boolean
  features: string[]
}> = {
  community: {
    label: 'Community',
    price: 'Free',
    artifacts: 100,
    staff: 1,
    imagesPerArtifact: 1,
    fullMode: false,
    analytics: false,
    compliance: false,
    ticketing: false,
    features: ['Up to 100 collection items', 'Public collection website', 'Basic site customisation'],
  },
  hobbyist: {
    label: 'Hobbyist',
    price: '£5/mo',
    artifacts: 500,
    staff: 1,
    imagesPerArtifact: 3,
    fullMode: false,
    analytics: false,
    compliance: false,
    ticketing: false,
    features: ['Up to 500 collection items', 'Public collection website', 'Full site customisation'],
  },
  professional: {
    label: 'Professional',
    price: '£79/mo',
    artifacts: 5000,
    staff: 10,
    imagesPerArtifact: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    ticketing: true,
    features: ['Up to 5,000 collection items', 'Full public website', '10 staff accounts', 'Collections compliance tools', 'Analytics', 'Event ticketing'],
  },
  institution: {
    label: 'Institution',
    price: '£349/mo',
    artifacts: 100000,
    staff: null,
    imagesPerArtifact: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    ticketing: true,
    features: ['Up to 100,000 collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Event ticketing', 'Priority support'],
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Contact us',
    artifacts: null,
    staff: null,
    imagesPerArtifact: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    ticketing: true,
    features: ['Unlimited collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Event ticketing', 'Dedicated support', 'Custom integrations'],
  },
}

export const PLAN_ORDER: PlanId[] = ['community', 'hobbyist', 'professional', 'institution', 'enterprise']

export function getPlan(plan: string) {
  return PLANS[plan as PlanId] ?? PLANS.community
}
