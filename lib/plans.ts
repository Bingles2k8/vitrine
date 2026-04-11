export type PlanId = 'community' | 'hobbyist' | 'professional' | 'institution' | 'enterprise'

export const PLANS: Record<PlanId, {
  label: string
  price: string
  objects: number | null  // null = unlimited
  staff: number | null       // null = unlimited
  imagesPerObject: number
  fullMode: boolean
  analytics: boolean
  visitorAnalytics: boolean
  compliance: boolean
  ticketing: boolean
  visitInfo: boolean         // Visit page & About/Facilities in site builder
  advancedCustomisation: boolean  // Social links, SEO, footer text, featured objects
  documentStorageMb: number | null  // null = unlimited
  depositorTracking: boolean  // Donor info, Entry By, GDPR, receipt & terms in entry records
  wishlist: boolean  // Wanted/wishlist feature — Community & Hobbyist only
  changeSlug: boolean  // Allow changing the public URL slug after initial setup
  hideVitrineBranding: boolean  // Option to remove "Powered by Vitrine" from public site footer
  features: string[]
  missingFeatures: string[]  // Shown on homepage pricing cards as "not included"
  featured: boolean          // Highlighted "most popular" card on homepage
  comingSoon: boolean        // Plan not yet purchasable
}> = {
  community: {
    label: 'Community',
    price: 'Free',
    objects: 100,
    staff: 1,
    imagesPerObject: 1,
    fullMode: false,
    analytics: false,
    visitorAnalytics: false,
    compliance: false,
    ticketing: false,
    visitInfo: false,
    advancedCustomisation: true,
    documentStorageMb: 0,
    depositorTracking: false,
    wishlist: true,
    changeSlug: false,
    hideVitrineBranding: false,
    features: ['Up to 100 collection items', 'Public collection website', 'Core site customisation', 'Purchase price & value tracking'],
    missingFeatures: ['Document storage', 'Wanted list', 'Premium templates', 'Visitor analytics'],
    featured: false,
    comingSoon: false,
  },
  hobbyist: {
    label: 'Hobbyist',
    price: '£5/mo',
    objects: 1000,
    staff: 1,
    imagesPerObject: 5,
    fullMode: false,
    analytics: true,
    visitorAnalytics: false,
    compliance: false,
    ticketing: false,
    visitInfo: false,
    advancedCustomisation: true,
    documentStorageMb: 100,
    depositorTracking: false,
    wishlist: true,
    changeSlug: true,
    hideVitrineBranding: false,
    features: ['Up to 1,000 collection items', 'Public collection website', 'Core site customisation', 'Purchase price & value tracking', 'Wanted list', '100 MB document storage'],
    missingFeatures: ['Visit & About pages', 'Collections compliance tools', 'Visitor analytics', 'Staff management'],
    featured: false,
    comingSoon: false,
  },
  professional: {
    label: 'Professional',
    price: '£79/mo',
    objects: 5000,
    staff: 10,
    imagesPerObject: 10,
    fullMode: true,
    analytics: true,
    visitorAnalytics: true,
    compliance: true,
    ticketing: true,
    visitInfo: true,
    advancedCustomisation: true,
    documentStorageMb: 1024,
    depositorTracking: true,
    wishlist: false,
    changeSlug: true,
    hideVitrineBranding: true,
    features: ['Up to 5,000 collection items', 'Full public website', '10 staff accounts', 'Collections compliance tools', 'Analytics', 'Event ticketing', '1 GB document storage'],
    missingFeatures: ['Unlimited objects', 'Unlimited staff', 'Unlimited storage'],
    featured: true,
    comingSoon: false,
  },
  institution: {
    label: 'Institution',
    price: '£349/mo',
    objects: 100000,
    staff: null,
    imagesPerObject: 10,
    fullMode: true,
    analytics: true,
    visitorAnalytics: true,
    compliance: true,
    ticketing: true,
    visitInfo: true,
    advancedCustomisation: true,
    documentStorageMb: 10240,
    depositorTracking: true,
    wishlist: false,
    changeSlug: true,
    hideVitrineBranding: true,
    features: ['Up to 100,000 collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Analytics', 'Event ticketing', '10 GB document storage'],
    missingFeatures: [],
    featured: false,
    comingSoon: true,
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Contact us',
    objects: null,
    staff: null,
    imagesPerObject: 10,
    fullMode: true,
    analytics: true,
    visitorAnalytics: true,
    compliance: true,
    ticketing: true,
    visitInfo: true,
    advancedCustomisation: true,
    documentStorageMb: null,
    depositorTracking: true,
    wishlist: false,
    changeSlug: true,
    hideVitrineBranding: true,
    features: ['Unlimited collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Analytics', 'Event ticketing', 'Unlimited document storage'],
    missingFeatures: [],
    featured: false,
    comingSoon: true,
  },
}

export const PLAN_ORDER: PlanId[] = ['community', 'hobbyist', 'professional', 'institution', 'enterprise']

// Templates locked to the Community (free) plan only — Hobbyist and above have access to all templates
export const FREE_TIER_TEMPLATES = ['minimal', 'dramatic', 'archival']

export function getPlan(plan: string) {
  return PLANS[plan as PlanId] ?? PLANS.community
}
