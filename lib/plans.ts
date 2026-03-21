export type PlanId = 'community' | 'hobbyist' | 'professional' | 'institution' | 'enterprise'

export const PLANS: Record<PlanId, {
  label: string
  price: string
  objects: number | null  // null = unlimited
  staff: number | null       // null = unlimited
  imagesPerObject: number
  fullMode: boolean
  analytics: boolean
  compliance: boolean
  ticketing: boolean
  visitInfo: boolean         // Visit page & About/Facilities in site builder
  advancedCustomisation: boolean  // Social links, SEO, footer text, featured objects
  documentStorageMb: number | null  // null = unlimited
  depositorTracking: boolean  // Donor info, Entry By, GDPR, receipt & terms in entry records
  features: string[]
}> = {
  community: {
    label: 'Community',
    price: 'Free',
    objects: 100,
    staff: 1,
    imagesPerObject: 1,
    fullMode: false,
    analytics: false,
    compliance: false,
    ticketing: false,
    visitInfo: false,
    advancedCustomisation: true,
    documentStorageMb: 0,
    depositorTracking: false,
    features: ['Up to 100 collection items', 'Public collection website', 'Core site customisation'],
  },
  hobbyist: {
    label: 'Hobbyist',
    price: '£5/mo',
    objects: 500,
    staff: 1,
    imagesPerObject: 3,
    fullMode: false,
    analytics: false,
    compliance: false,
    ticketing: false,
    visitInfo: false,
    advancedCustomisation: true,
    documentStorageMb: 0,
    depositorTracking: false,
    features: ['Up to 500 collection items', 'Public collection website', 'Core site customisation'],
  },
  professional: {
    label: 'Professional',
    price: '£79/mo',
    objects: 5000,
    staff: 10,
    imagesPerObject: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    ticketing: true,
    visitInfo: true,
    advancedCustomisation: true,
    documentStorageMb: 1024,
    depositorTracking: true,
    features: ['Up to 5,000 collection items', 'Full public website', '10 staff accounts', 'Collections compliance tools', 'Analytics', 'Event ticketing', '1 GB document storage'],
  },
  institution: {
    label: 'Institution',
    price: '£349/mo',
    objects: 100000,
    staff: null,
    imagesPerObject: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    ticketing: true,
    visitInfo: true,
    advancedCustomisation: true,
    documentStorageMb: 10240,
    depositorTracking: true,
    features: ['Up to 100,000 collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Event ticketing', 'Priority support', '10 GB document storage'],
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Contact us',
    objects: null,
    staff: null,
    imagesPerObject: 10,
    fullMode: true,
    analytics: true,
    compliance: true,
    ticketing: true,
    visitInfo: true,
    advancedCustomisation: true,
    documentStorageMb: null,
    depositorTracking: true,
    features: ['Unlimited collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Event ticketing', 'Dedicated support', 'Custom integrations', 'Unlimited document storage'],
  },
}

export const PLAN_ORDER: PlanId[] = ['community', 'hobbyist', 'professional', 'institution', 'enterprise']

export const FREE_TIER_TEMPLATES = ['minimal', 'dramatic', 'archival']

export function getPlan(plan: string) {
  return PLANS[plan as PlanId] ?? PLANS.community
}
