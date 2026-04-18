export type PlanId = 'community' | 'hobbyist' | 'professional' | 'institution' | 'enterprise'

// Used by the homepage pricing section for grouped, annotated feature lists.
// Other pages (onboarding, /dashboard/plan) use the flat `features` array.
export type FeatureGroup = {
  title?: string       // Optional section header
  items: string[]
  note?: string        // Optional small note rendered below the items
  muted?: boolean      // Renders items greyed-out (used for "Not included" groups)
}

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
  featureGroups: FeatureGroup[]  // Rich grouped feature list for homepage pricing cards
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
    features: ['Up to 100 collection items', 'Public collection website', 'Core site customisation', 'Purchase price & value tracking', 'Wanted list'],
    missingFeatures: ['Document storage', 'Premium templates', 'Analytics'],
    featureGroups: [
      { items: [
        'Up to 100 objects',
        'Public collection website',
        'Per-object pages & QR codes',
        'Wanted list',
        'Value & condition tracking',
        'Opt in to Vitrine Discover',
      ]},
      { muted: true, items: [
        'Analytics',
        'CSV import & export',
      ]},
    ],
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
    hideVitrineBranding: true,
    features: ['Up to 1,000 collection items', 'Public collection website', 'Full site customisation', 'Purchase price & value tracking', 'Wanted list', '100 MB document storage'],
    missingFeatures: ['Visit & About pages', '21 collection management procedures', 'Visitor analytics', 'Staff management'],
    featureGroups: [
      { items: [
        'Up to 1,000 objects, 5 photos each',
        'Collection analytics',
        'CSV bulk import & export',
        '100 MB document storage',
        'All site templates',
      ]},
      { muted: true, items: [
        'Custom domain (coming soon)',
        'Compliance tooling',
      ]},
    ],
    featured: true,
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
    features: ['Up to 5,000 collection items', 'Full public website', '10 staff accounts', '21 collection management procedures', 'Analytics', 'Event ticketing', '1 GB document storage'],
    missingFeatures: ['Over 5,000 collection items', 'Unlimited staff accounts'],
    featureGroups: [
      { items: [
        'Up to 5,000 objects, 10 staff accounts',
        '21 Spectrum-aligned procedures',
        'Event ticketing — free & paid',
        'Plan your visit page',
        'Visitor & collection analytics',
        'Donor & depositor tracking',
        '1 GB document storage',
      ]},
      { muted: true, items: [
        'Unlimited staff',
        'Over 5,000 objects',
      ]},
    ],
    featured: false,
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
    features: ['Up to 100,000 collection items', 'Full public website', 'Unlimited staff accounts', '21 collection management procedures', 'Analytics', 'Event ticketing', '10 GB document storage'],
    missingFeatures: [],
    featureGroups: [
      { items: [
        'Up to 100,000 objects',
        'Unlimited staff accounts',
        '10 GB document storage',
        'All Professional features included',
      ]},
      { muted: true, items: [
        'Unlimited objects',
        'Custom domain (coming soon)',
      ]},
    ],
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
    features: ['Unlimited collection items', 'Full public website', 'Unlimited staff accounts', '21 collection management procedures', 'Analytics', 'Event ticketing', 'Unlimited document storage'],
    missingFeatures: [],
    featureGroups: [
      { items: [
        'Unlimited objects, staff & storage',
        'SSO & enterprise authentication',
        'Dedicated support & SLA',
        'Custom contract & PO invoicing',
        'Bespoke development',
      ]},
    ],
    featured: false,
    comingSoon: false,
  },
}

export const PLAN_ORDER: PlanId[] = ['community', 'hobbyist', 'professional', 'institution', 'enterprise']

// Templates locked to the Community (free) plan only — Hobbyist and above have access to all templates
export const FREE_TIER_TEMPLATES = ['minimal', 'dramatic', 'archival']

export function getPlan(plan: string) {
  return PLANS[plan as PlanId] ?? PLANS.community
}
