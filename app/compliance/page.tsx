import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const metadata = buildPageMetadata({
  title: 'Collection Compliance Tools – Vitrine Professional',
  description:
    'Vitrine Professional and Institution plans include built-in tools for every recognised collection management standard. Browse all 21 procedures, data fields, and where to find them in the app.',
  path: '/compliance',
  keywords: [
    'museum collection management compliance',
    'collection management standards',
    'museum cataloguing software',
    'collection compliance tools',
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

type Tier = 'professional' | 'institution' | 'split'

interface Procedure {
  id: number
  name: string
  description: string
  fields: string[]
  location: string
  dashboardLink: string
  dashboardLabel: string
  tier: Tier
}

const PRIMARY: Procedure[] = [
  {
    id: 1,
    name: 'Object Entry',
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
    id: 2,
    name: 'Acquisition & Accessioning',
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
    id: 3,
    name: 'Location & Movement Control',
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
    id: 4,
    name: 'Inventory',
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
    tier: 'institution',
  },
  {
    id: 5,
    name: 'Cataloguing',
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
    location: 'Object detail → Overview tab (basic on Professional; full attribution fields on Institution)',
    dashboardLink: '/dashboard/objects',
    dashboardLabel: 'Object Records',
    tier: 'split',
  },
  {
    id: 6,
    name: 'Object Exit',
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
    id: 7,
    name: 'Loans In',
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
    id: 8,
    name: 'Loans Out',
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
]

const SECONDARY: Procedure[] = [
  {
    id: 9,
    name: 'Documentation Planning',
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
    tier: 'institution',
  },
  {
    id: 10,
    name: 'Use of Collections',
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
    tier: 'institution',
  },
  {
    id: 11,
    name: 'Condition Checking',
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
    id: 12,
    name: 'Conservation & Collections Care',
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
    id: 13,
    name: 'Valuation',
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
    id: 14,
    name: 'Insurance & Indemnity',
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
    id: 15,
    name: 'Emergency Planning',
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
    id: 16,
    name: 'Loss & Damage Reporting',
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
    id: 17,
    name: 'Disposal & Deaccession',
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
    tier: 'institution',
  },
  {
    id: 18,
    name: 'Rights Management',
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
    tier: 'institution',
  },
  {
    id: 19,
    name: 'Reproduction Rights',
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
    tier: 'institution',
  },
  {
    id: 20,
    name: 'Collections Review',
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
    tier: 'institution',
  },
  {
    id: 21,
    name: 'Audit Exercises',
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
    tier: 'institution',
  },
]

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === 'institution') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border bg-white/5 text-stone-300 border-white/10">
        Institution
      </span>
    )
  }
  if (tier === 'split') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
        Professional+ <span className="text-stone-500">/ Institution (full)</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
      Professional+
    </span>
  )
}

function ProcedureCard({ proc }: { proc: Procedure }) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-stone-500 block mb-1">{String(proc.id).padStart(2, '0')}</span>
          <h3 className="text-lg font-medium text-white leading-snug">{proc.name}</h3>
        </div>
        <TierBadge tier={proc.tier} />
      </div>

      <p className="text-stone-400 text-sm leading-relaxed">{proc.description}</p>

      <div>
        <p className="font-mono text-xs text-stone-500 uppercase tracking-wider mb-2">Data fields</p>
        <ul className="space-y-1">
          {proc.fields.map((field) => (
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
          {proc.location}
        </p>
        <Link
          href={proc.dashboardLink}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-500 hover:text-amber-400 transition-colors"
        >
          Open {proc.dashboardLabel} →
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
            Collection compliance,{' '}
            <span className="text-amber-500">built in.</span>
          </h1>
          <p className="text-xl text-stone-300 leading-relaxed border-l-2 border-amber-500/40 pl-5 mb-6">
            Vitrine Professional and Institution plans include purpose-built tools for all 21 procedures in recognised collection management standards — from object entry through to audit exercises.
          </p>
          <p className="text-stone-400 leading-relaxed">
            Every procedure is mapped to specific data fields and UI screens inside the app. This page lists each procedure, its fields, and exactly where to find it in your dashboard.
          </p>
        </div>

        {/* Tier legend */}
        <div className="mb-16 flex flex-wrap gap-4 items-center p-5 border border-white/5 rounded-xl bg-white/2">
          <span className="text-sm text-stone-400 font-mono uppercase tracking-wider shrink-0">Plan key:</span>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <TierBadge tier="professional" />
              <span className="text-sm text-stone-400">Included from Professional plan and above</span>
            </div>
            <div className="flex items-center gap-2">
              <TierBadge tier="institution" />
              <span className="text-sm text-stone-400">Institution plan only</span>
            </div>
          </div>
          <Link href="/plans" className="ml-auto font-mono text-xs text-stone-500 hover:text-stone-300 transition-colors shrink-0">
            Compare plans →
          </Link>
        </div>

        {/* Primary procedures */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-white mb-2">Primary procedures</h2>
            <p className="text-stone-400">The eight core collection management workflows — available on all Professional and Institution plans.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PRIMARY.map((proc) => (
              <ProcedureCard key={proc.id} proc={proc} />
            ))}
          </div>
        </section>

        {/* Secondary procedures */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-white mb-2">Secondary procedures</h2>
            <p className="text-stone-400">Specialist workflows for compliance, rights, risk, and governance. Most require the Institution plan.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SECONDARY.map((proc) => (
              <ProcedureCard key={proc.id} proc={proc} />
            ))}
          </div>
        </section>

        {/* Supporting infrastructure */}
        <section className="mb-20">
          <h2 className="text-2xl font-medium text-white mb-6">Supporting infrastructure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Document attachments',
                description: 'Every procedure supports document uploads — agreements, reports, photographs, certificates. Gated to Professional+.',
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
                description: 'A dedicated risk register tracks risks by severity, status, and due date — linked to the relevant objects and procedures.',
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
            Try Vitrine free — no credit card required. Professional plan starts at £12/month and includes all 16 primary and secondary procedures.
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
              href="/plans"
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
