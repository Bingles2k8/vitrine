import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const metadata = buildPageMetadata({
  title: 'Collections Documentation Registers – Vitrine Professional',
  description:
    'Vitrine Professional and Institution plans include the documentation registers a working museum relies on — entry, acquisition, loans, condition, conservation, valuation, disposal and audit. See every register, its fields, and where to find it in the app.',
  path: '/compliance',
  keywords: [
    'museum collection documentation',
    'museum cataloguing software',
    'collections documentation registers',
    'museum accession register software',
    'professional collection management',
  ],
})

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Compliance', item: `${SITE_URL}/compliance` },
  ],
}

type Tier = 'professional'
type Group = 'Everyday records' | 'Loans & access' | 'Care & risk' | 'Governance & review'

const GROUP_ORDER: Group[] = ['Everyday records', 'Loans & access', 'Care & risk', 'Governance & review']

const GROUP_BLURB: Record<Group, string> = {
  'Everyday records': 'The day-to-day backbone — what arrived, what it is, where it lives, and when it left.',
  'Loans & access': 'Objects moving in and out on loan, plus who may use, copy, or reproduce them.',
  'Care & risk': 'The physical wellbeing of the collection, and what it would cost to put right.',
  'Governance & review': 'The oversight layer — planning, review, audit, and responsible disposal.',
}

interface Register {
  name: string
  group: Group
  description: string
  fields: string[]
  location: string
  dashboardLink: string
  dashboardLabel: string
  tier: Tier
}

const REGISTERS: Register[] = [
  {
    name: 'Object Entry',
    group: 'Everyday records',
    description: 'Record every object arriving at your institution, capturing depositor details, condition at arrival, and receipts.',
    fields: [
      'Entry number (auto-generated)',
      'Entry date & reason',
      'Entry method',
      'Scheduled return date',
      'Condition on entry',
      'Depositor name & contact',
      'GDPR consent & consent date',
      'Object description & count',
      'Legal owner',
      'Received by',
      'Terms accepted & date',
      'Receipt issued & date',
      'Quarantine required flag',
      'Risk notes',
      'Outcome',
      'Depositor signature (in-person or digital)',
    ],
    location: 'Object detail → Entry tab; Central entry register',
    dashboardLink: '/dashboard/entry',
    dashboardLabel: 'Entry Register',
    tier: 'professional',
  },
  {
    name: 'Acquisition & Accessioning',
    group: 'Everyday records',
    description: 'Formally accession objects into the permanent collection with full acquisition provenance and legal documentation.',
    fields: [
      'Accession number & date',
      'Acquisition method (Purchase / Gift / Bequest / Loan / etc.)',
      'Acquisition source',
      'Acquisition justification',
      'Documentation reference',
      'Acquisition value & currency',
      'Conditions attached to acquisition',
      'Donor acknowledgement sent flag',
      'Formally accessioned flag',
      'Non-accession reason (if applicable)',
    ],
    location: 'Object detail → Overview tab (Acquisition section)',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'professional',
  },
  {
    name: 'Location & Movement Control',
    group: 'Everyday records',
    description: 'Maintain a full audit trail of where every object is and has been, with hierarchical location codes.',
    fields: [
      'Location code (unique, required)',
      'Location name',
      'Parent location (hierarchy)',
      'Movement date & time',
      'Moved by (staff)',
      'Move type (Permanent / Temporary / Return)',
      'Expected return date',
      'Movement notes',
    ],
    location: 'Object detail → Overview tab; Central movement register with tabs for Current Locations and Movement History',
    dashboardLink: '/dashboard/locations',
    dashboardLabel: 'Locations',
    tier: 'professional',
  },
  {
    name: 'Inventory',
    group: 'Everyday records',
    description: 'Plan and record inventory exercises, tracking which objects have been physically verified and when.',
    fields: [
      'Inventory exercise management',
      'Object checked date',
      'Checked by (staff)',
      'Location confirmed flag',
      'Condition noted',
      'Discrepancy noted flag',
      'Notes',
      'Objects never inventoried (stat)',
      'Objects overdue >12 months (stat)',
    ],
    location: 'Audit dashboard → inventory statistics and object grid',
    dashboardLink: '/dashboard/audit',
    dashboardLabel: 'Audit & Inventory',
    tier: 'professional',
  },
  {
    name: 'Cataloguing',
    group: 'Everyday records',
    description: 'Capture the full catalogue record for each object, from basic identification through to attribution and record completeness.',
    fields: [
      'Title, maker name & role',
      'Production date range & qualifier',
      'Production place',
      'Physical materials & technique',
      'School / style / period',
      'Colour, shape, surface treatment',
      'Alternative names/titles',
      'Full catalogue description',
      'Dimensions (H/W/D) & weight',
      'Object type & culture',
      'Provenance narrative & date range',
      'Field collection information',
      'Marks & inscriptions',
      'Historical context',
      'Associated person, organisation, place',
      'Credit line',
      'Number of parts',
      'Record source & attribution',
      'Attribution notes',
      'Record completeness level',
    ],
    location: 'Object detail → Overview tab',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'professional',
  },
  {
    name: 'Object Exit',
    group: 'Everyday records',
    description: 'Log every object leaving the institution, with transport details, authorisation, and return expectations.',
    fields: [
      'Exit number (auto-generated)',
      'Exit date & reason',
      'Recipient name & address',
      'Transport method',
      'Insurance / indemnity confirmed flag',
      'Packing notes',
      'Condition at exit',
      'Signed receipt obtained flag',
      'Expected return date',
      'Authorised by',
    ],
    location: 'Object detail → Exits tab',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'professional',
  },
  {
    name: 'Loans In',
    group: 'Loans & access',
    description: 'Manage incoming loans from other institutions, from initial request through to return.',
    fields: [
      'Loan number (auto-generated)',
      'Lending institution',
      'Contact name & email',
      'Loan start date & expected return date',
      'Purpose',
      'Insurance value',
      'Borrower address',
      'Agreement reference & signed date',
      'Facility report reference',
      'Environmental & display requirements',
      'Courier arrangements',
      'Condition at arrival',
      'Special conditions',
      'Status (Requested / Agreed / Active / Returned)',
    ],
    location: 'Loans register (filtered by direction); Object detail → Loans tab',
    dashboardLink: '/dashboard/loans',
    dashboardLabel: 'Loans',
    tier: 'professional',
  },
  {
    name: 'Loans Out',
    group: 'Loans & access',
    description: 'Manage outgoing loans to other institutions, tracking the full lifecycle including return condition.',
    fields: [
      'All Loans In fields (shared record format)',
      'Borrowing institution',
      'Condition at return',
      'Return location',
      'End loan workflow',
    ],
    location: 'Loans register (filtered by direction); Object detail → Loans tab',
    dashboardLink: '/dashboard/loans',
    dashboardLabel: 'Loans',
    tier: 'professional',
  },
  {
    name: 'Documentation Planning',
    group: 'Governance & review',
    description: 'Plan and manage documentation programmes, tracking backlogs of uncatalogued objects.',
    fields: [
      'Plan title & scope',
      'Target completion date',
      'Responsible staff',
      'Backlog (objects not yet catalogued)',
    ],
    location: 'Dashboard administration settings',
    dashboardLink: '/dashboard/audit',
    dashboardLabel: 'Audit & Inventory',
    tier: 'professional',
  },
  {
    name: 'Use of Collections',
    group: 'Loans & access',
    description: 'Track requests to access or use collection objects, from research visits to photography.',
    fields: [
      'Use reference (auto-generated)',
      'Use type (Research / Exhibition / Photography / etc.)',
      'Requester name & contact',
      'Purpose',
      'Use start & end dates',
      'Approval status workflow',
      'Approved by',
      'Location of use',
      'Information generated',
      'Linked reproduction request (if applicable)',
    ],
    location: 'Collections Use dashboard',
    dashboardLink: '/dashboard/collections-use',
    dashboardLabel: 'Collections Use',
    tier: 'professional',
  },
  {
    name: 'Condition Checking',
    group: 'Care & risk',
    description: 'Record formal condition assessments for objects, including hazard notes and next-check scheduling.',
    fields: [
      'Assessment reference',
      'Assessed by',
      'Assessment date',
      'Condition grade (Good / Fair / Poor / Critical)',
      'Full condition description',
      'Specific issues noted',
      'Hazard / handling note',
      'Recommendations',
      'Next check date',
    ],
    location: 'Object detail → Condition tab',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'professional',
  },
  {
    name: 'Conservation & Collections Care',
    group: 'Care & risk',
    description: 'Log conservation treatments with before/after documentation, costs, and future care recommendations.',
    fields: [
      'Treatment reference (auto-generated)',
      'Treatment type',
      'Conservator',
      'Start & end dates',
      'Condition before & after',
      'Materials used',
      'Cost & currency',
      'Future care recommendations',
      'Before image',
      'After image',
      'Status (Active / Completed / Cancelled)',
    ],
    location: 'Object detail → Conservation tab; Central conservation register',
    dashboardLink: '/dashboard/conservation',
    dashboardLabel: 'Conservation',
    tier: 'professional',
  },
  {
    name: 'Valuation',
    group: 'Care & risk',
    description: 'Maintain a dated valuation history for each object with multiple bases (insurance, market, replacement).',
    fields: [
      'Valuation reference',
      'Valuation date',
      'Valuer',
      'Valuation basis (Insurance / Market / Replacement / etc.)',
      'Value & currency',
      'Validity date',
      'Notes',
      'Object-level insured value',
    ],
    location: 'Object detail → Valuation tab; Central valuation register',
    dashboardLink: '/dashboard/valuation',
    dashboardLabel: 'Valuation',
    tier: 'professional',
  },
  {
    name: 'Insurance & Indemnity',
    group: 'Care & risk',
    description: 'Manage insurance policies and link them to specific collection objects, with renewal alerts.',
    fields: [
      'Policy number',
      'Provider',
      'Coverage amount & currency',
      'Deductible',
      'Start, end & renewal dates',
      'Covers loans flag',
      'Covers transit flag',
      'Covers exhibitions flag',
      'Insurer contact name & email',
      'Exclusions',
      'Claims procedure',
      'Status (Active / Pending Renewal / Expired / Cancelled)',
      'Policy–object links (many-to-many)',
    ],
    location: 'Insurance dashboard; object-level insured value in Overview tab',
    dashboardLink: '/dashboard/insurance',
    dashboardLabel: 'Insurance',
    tier: 'professional',
  },
  {
    name: 'Emergency Planning',
    group: 'Care & risk',
    description: 'Maintain emergency response plans, ranked salvage priorities, and a log of incidents with affected objects.',
    fields: [
      'Plan title & type (Fire / Flood / Theft / etc.)',
      'Plan status (Draft / Active / Under Review / Archived)',
      'Plan description & contact list',
      'Salvage priority ranking (objects)',
      'Incident: event type & date',
      'Incident description',
      'Response taken',
      'Damage summary',
      'Affected objects (linked)',
    ],
    location: 'Emergency plans dashboard; Incident register',
    dashboardLink: '/dashboard/emergency',
    dashboardLabel: 'Emergency',
    tier: 'professional',
  },
  {
    name: 'Loss & Damage Reporting',
    group: 'Care & risk',
    description: 'Record damage and loss incidents with severity, repair estimates, and governance notifications.',
    fields: [
      'Report date',
      'Damage type (Loss / Theft / Vandalism / Accidental / etc.)',
      'Description',
      'Severity (Low / Medium / High / Critical)',
      'Repair estimate',
      'Police report reference',
      'Insurance claim outcome',
      'Reported to governing body flag',
      'Status (Open / In Progress / Resolved / Closed)',
    ],
    location: 'Object detail → Damage tab; Central damage register',
    dashboardLink: '/dashboard/damage',
    dashboardLabel: 'Damage Reports',
    tier: 'professional',
  },
  {
    name: 'Disposal & Deaccession',
    group: 'Governance & review',
    description: 'Manage the full deaccession workflow from proposal through governance approval to completion.',
    fields: [
      'Disposal method (Sale / Donation / Destruction / Transfer / etc.)',
      'Disposal reason & justification',
      'Deaccession date',
      'Authorised by',
      'Proceeds (if sold)',
      'Governance approval flag',
      'Public notice given flag',
      'Status (Proposed / Approved / Completed)',
      'Object-level deaccession-protected flag',
    ],
    location: 'Disposal dashboard',
    dashboardLink: '/dashboard/disposal',
    dashboardLabel: 'Disposal',
    tier: 'professional',
  },
  {
    name: 'Rights Management',
    group: 'Loans & access',
    description: 'Track copyright, licences, and rights status for each object, with per-object rights summaries.',
    fields: [
      'Rights reference (auto-generated)',
      'Rights type (Copyright / Moral Rights / Licence / etc.)',
      'Rights status (Cleared / Pending / Unknown / Restricted)',
      'Rights holder',
      'Expiry date',
      'Licence terms',
      'Usage restrictions',
      'Object-level: rights-in obtained flag',
      'Object-level: rights-out granted flag',
      'Rights holder contact',
    ],
    location: 'Object detail → Rights tab',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'professional',
  },
  {
    name: 'Reproduction Rights',
    group: 'Loans & access',
    description: 'Handle requests to reproduce collection objects, with decision tracking and fee management.',
    fields: [
      'Requester name & contact',
      'Reproduction type (Digital / Print / Broadcast / etc.)',
      'Stated purpose',
      'Decision (Approved / Refused / Pending)',
      'Decision date',
      'Terms issued flag',
      'Fee charged',
      'Linked collections use record (if applicable)',
    ],
    location: 'Object detail → Rights tab (alongside rights records)',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'professional',
  },
  {
    name: 'Collections Review',
    group: 'Governance & review',
    description: 'Plan and record formal collections review programmes, with governance reporting and disposal recommendations.',
    fields: [
      'Review reference (auto-generated)',
      'Review title & scope',
      'Reviewer',
      'Review criteria',
      'Start & end dates',
      'Objects reviewed count',
      'Disposal recommendations',
      'Governance body notified flag',
      'Status (In Progress / Completed)',
    ],
    location: 'Collections Review dashboard',
    dashboardLink: '/dashboard/collections-review',
    dashboardLabel: 'Collections Review',
    tier: 'professional',
  },
  {
    name: 'Audit Exercises',
    group: 'Governance & review',
    description: 'Conduct and document formal audit exercises with full governance reporting and actions tracking.',
    fields: [
      'Audit reference (auto-generated)',
      'Audit title & method',
      'Start & end dates',
      'Conducted by',
      'Objects audited count',
      'Discrepancies found',
      'Governance reported flag',
      'Actions required',
      'Actions completed flag',
      'Overall audit report',
      'Status (In Progress / Completed)',
    ],
    location: 'Audit dashboard',
    dashboardLink: '/dashboard/audit',
    dashboardLabel: 'Audit & Inventory',
    tier: 'professional',
  },
]

function TierBadge({ tier: _ }: { tier: Tier }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
      Professional+
    </span>
  )
}

function RegisterCard({ reg }: { reg: Register }) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-medium text-white leading-snug">{reg.name}</h3>
        <TierBadge tier={reg.tier} />
      </div>

      <p className="text-stone-400 text-sm leading-relaxed">{reg.description}</p>

      <div>
        <p className="font-mono text-xs text-stone-500 uppercase tracking-wider mb-2">Data fields</p>
        <ul className="space-y-1">
          {reg.fields.map((field) => (
            <li key={field} className="flex items-start gap-2 text-stone-300 text-sm">
              <span className="text-amber-500/50 mt-0.5 shrink-0">—</span>
              <span>{field}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 border-t border-white/5 mt-auto">
        <p className="text-xs text-stone-500 mb-3">
          <span className="font-mono uppercase tracking-wider">Located in: </span>
          {reg.location}
        </p>
        <Link
          href={reg.dashboardLink}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-500 hover:text-amber-400 transition-colors"
        >
          Open {reg.dashboardLabel} →
        </Link>
      </div>
    </div>
  )
}

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={breadcrumbSchema} />
      <PublicNav />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">Compliance</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="mb-12 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl italic font-normal leading-tight mb-6">
            Every register a museum needs,{' '}
            <span className="text-amber-500">built in.</span>
          </h1>
          <p className="text-xl text-stone-300 leading-relaxed border-l-2 border-amber-500/40 pl-5 mb-6">
            Vitrine Professional and Institution plans include purpose-built records for the full documentation lifecycle — from an object arriving at your door through to audit and disposal.
          </p>
          <p className="text-stone-400 leading-relaxed">
            Each register has its own fields and its own screen inside the app. This page lists what Vitrine records, and exactly where to find it in your dashboard.
          </p>
          <p className="text-stone-400 leading-relaxed mt-4">
            Want to try one before signing up? Our{' '}
            <Link href="/tools/condition-report" className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
              free condition report generator
            </Link>
            {' '}produces a full condition report — with a visual damage map — straight from your browser.
          </p>
        </div>

        {/* Tier legend */}
        <div className="mb-16 flex flex-wrap gap-4 items-center p-5 border border-white/5 rounded-xl bg-white/2">
          <span className="text-sm text-stone-400 font-mono uppercase tracking-wider shrink-0">Plan key:</span>
          <div className="flex items-center gap-2">
            <TierBadge tier="professional" />
            <span className="text-sm text-stone-400">Included from Professional plan and above</span>
          </div>
          <Link href="/#pricing" className="ml-auto font-mono text-xs text-stone-500 hover:text-stone-300 transition-colors shrink-0">
            Compare plans →
          </Link>
        </div>

        {/* Registers, by area */}
        {GROUP_ORDER.map((group) => (
          <section key={group} className="mb-20">
            <div className="mb-8">
              <h2 className="text-2xl font-medium text-white mb-2">{group}</h2>
              <p className="text-stone-400">{GROUP_BLURB[group]}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {REGISTERS.filter((reg) => reg.group === group).map((reg) => (
                <RegisterCard key={reg.name} reg={reg} />
              ))}
            </div>
          </section>
        ))}

        {/* Supporting infrastructure */}
        <section className="mb-20">
          <h2 className="text-2xl font-medium text-white mb-6">Supporting infrastructure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Document attachments',
                description: 'Every register supports document uploads — agreements, reports, photographs, certificates. Gated to Professional+.',
              },
              {
                title: 'Activity log',
                description: 'All changes are recorded with staff attribution and timestamps, providing a complete audit trail.',
              },
              {
                title: 'Multi-currency support',
                description: 'Valuations, insurance, acquisition costs, and treatment costs all support configurable currency codes.',
              },
              {
                title: 'Risk register',
                description: 'A dedicated risk register tracks risks by severity, status, and due date — linked to the relevant objects and records.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/3 border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
                <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="p-8 border border-white/10 rounded-lg">
          <h2 className="text-xl font-medium text-white mb-2">Ready to get started?</h2>
          <p className="text-stone-400 mb-6 max-w-xl">
            Try Vitrine free — no credit card required. Professional plan starts at £79/month and includes every register on this page.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Start for free →
            </Link>
            <Link
              href="/guide/professional"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Read the guide
            </Link>
            <Link
              href="/#pricing"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Compare plans
            </Link>
            <Link
              href="/blog"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Visit the blog
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
