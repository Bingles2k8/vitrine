import { getPlan } from '@/lib/plans'
import type { ProfileNouns } from '@/lib/collectionProfiles'
import type { GroupNouns } from '@/lib/collectionGroups'

/**
 * The dashboard sidebar, as data.
 *
 * This exists for one reason beyond tidiness: the DMCCA easy-exit rules require
 * that cancelling a subscription is reachable within two clicks of the
 * dashboard — one to Plan & Billing, one to "Cancel subscription" on that page.
 * That was previously guaranteed by a comment in the JSX and a regex in
 * __tests__/lib/cancelClickDepth.test.ts that searched the component source for
 * `navItem('/dashboard/plan'`.
 *
 * A regex over markup is a weak guarantee. It matched the string wherever it
 * appeared, including inside the settings panel — the exact regression it was
 * written to prevent — and it would break on any refactor of the sidebar, at
 * which point the tempting fix is to loosen it until it matches nothing real.
 *
 * So the shape of this module is the guarantee:
 *
 *   1. The nav is two levels — groups, and items inside them. There is no third
 *      level, so "billing tucked inside the settings panel" is not a state this
 *      type can express. The settings panel is separate JSX that renders none
 *      of this data.
 *   2. The billing entry carries `easyExit: true`, which is documented as a
 *      legal requirement rather than a style choice.
 *   3. assertEasyExit() checks the built nav and throws in development. It runs
 *      on every sidebar render and in __tests__/lib/nav.test.ts across every
 *      plan tier, so removing the entry fails immediately and loudly.
 *
 * Moving billing out of the top level now means deleting it from this file,
 * which fails the invariant and the test rather than quietly shipping.
 */

export type NavBadge = 'unread'

export interface NavItem {
  href: string
  icon: string
  label: string
  learnKey?: string
  /** Renders a count bubble. Only 'unread' is wired up, on the inbox. */
  badge?: NavBadge
  /** Highlight for any path beneath href, not only an exact match. */
  matchPrefix?: boolean
  /**
   * This destination must stay exactly one click from the dashboard.
   * Required by the DMCCA easy-exit rules — see assertEasyExit below.
   * Do not add or remove without reading that.
   */
  easyExit?: true
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export interface NavContext {
  /**
   * museums.plan. Every plan gate below is derived from this, here, so that the
   * sidebar and its tests read the same logic. Passing pre-computed booleans in
   * would put the gates back in the caller, where a regression is invisible to
   * __tests__/lib/nav.test.ts — which is how Private Shares came to be hidden
   * from every plan that has unlimited links.
   */
  plan: string
  /** museums.ui_mode === 'simple'. Not derived from the plan: it is a column. */
  simple: boolean
  isOwner: boolean
  staffAccess: string | null
  nouns: ProfileNouns
  setNouns: GroupNouns
}

/** The destination that must remain one click from the dashboard. */
export const EASY_EXIT_HREF = '/dashboard/plan'

/**
 * The billing entry, defined once. Kept as a named export so the invariant and
 * the tests refer to the same object the sidebar renders, rather than to a
 * string that has to be kept in sync.
 */
export const BILLING_ITEM: NavItem = {
  href: EASY_EXIT_HREF,
  icon: '◱',
  label: 'Plan & Billing',
  learnKey: 'nav.plan',
  easyExit: true,
}

export function buildSidebarNav(ctx: NavContext): NavGroup[] {
  const { simple, isOwner, staffAccess, nouns, setNouns } = ctx
  const plan = getPlan(ctx.plan)

  const wishlist = plan.wishlist
  const ticketing = plan.ticketing
  // 0 disables, null means unlimited. Never write this as a truthiness check:
  // `?? 0` or `!!` both read null as "off" and disable every unlimited plan.
  const shareLinks = plan.shareLinks !== 0

  const groups: NavGroup[] = []

  // ── Collections ────────────────────────────────────────────────────────
  const collections: NavItem[] = [
    { href: '/dashboard', icon: '⬡', label: `${nouns.collection} Overview`, learnKey: 'nav.objects' },
    // Sets — every tier, unlimited (decision D2), so no plan gate here.
    { href: '/dashboard/sets', icon: '▤', label: setNouns.plural, learnKey: 'nav.sets' },
  ]
  if (wishlist) {
    collections.push({ href: '/dashboard/wanted', icon: '◇', label: 'Wishlist', learnKey: 'nav.wanted' })
  }
  // Inbox — all tiers, all staff can read.
  collections.push({
    href: '/dashboard/inbox', icon: '✉️', label: 'Inbox', badge: 'unread', matchPrefix: true,
  })
  groups.push({ id: 'collections', label: 'Collections', items: collections })

  // ── The object workflow: one group in simple mode, four in full ────────
  if (simple) {
    groups.push({
      id: 'record',
      label: 'Record',
      items: [
        { href: '/dashboard/entry', icon: '🗂', label: nouns.addItem, learnKey: 'nav.entry' },
        { href: '/dashboard/on-loan', icon: '📤', label: 'On Loan', learnKey: 'nav.on-loan' },
      ],
    })
  } else {
    groups.push({
      id: 'lifecycle',
      label: 'Object Lifecycle',
      items: [
        { href: '/dashboard/entry', icon: '🗂', label: 'Object Entry', learnKey: 'nav.entry' },
        { href: '/dashboard/register', icon: '📋', label: 'Accession Register', learnKey: 'nav.register' },
        { href: '/dashboard/loans', icon: '⇄', label: 'Loans Register', learnKey: 'nav.loans' },
        { href: '/dashboard/exits', icon: '↗', label: 'Object Exit', learnKey: 'nav.exits' },
        { href: '/dashboard/disposal', icon: '⊘', label: 'Disposal', learnKey: 'nav.disposal' },
      ],
    })
    groups.push({
      id: 'location',
      label: 'Location & Care',
      items: [
        { href: '/dashboard/locations', icon: '⌖', label: 'Location Register', learnKey: 'nav.locations' },
        { href: '/dashboard/conservation', icon: '⚗', label: 'Conservation', learnKey: 'nav.conservation' },
        { href: '/dashboard/damage', icon: '⚠', label: 'Damage Reports', learnKey: 'nav.damage' },
        { href: '/dashboard/risk', icon: '⚑', label: 'Risk Register', learnKey: 'nav.risk' },
        { href: '/dashboard/emergency', icon: '⚡', label: 'Emergency Plans', learnKey: 'nav.emergency' },
      ],
    })
    groups.push({
      id: 'value',
      label: 'Value & Rights',
      items: [
        { href: '/dashboard/valuation', icon: '◈', label: 'Valuation Register', learnKey: 'nav.valuation' },
        { href: '/dashboard/insurance', icon: '🛡', label: 'Insurance', learnKey: 'nav.insurance' },
        { href: '/dashboard/rights', icon: '§', label: 'Rights Register', learnKey: 'nav.rights' },
        { href: '/dashboard/reproductions', icon: '❐', label: 'Reproductions', learnKey: 'nav.reproductions' },
      ],
    })
    groups.push({
      id: 'accountability',
      label: 'Accountability',
      items: [
        { href: '/dashboard/audit', icon: '◎', label: 'Audit & Inventory', learnKey: 'nav.audit' },
        { href: '/dashboard/collections-use', icon: '⊞', label: 'Use of Collections', learnKey: 'nav.collections-use' },
        { href: '/dashboard/collections-review', icon: '⊡', label: 'Collections Review', learnKey: 'nav.collections-review' },
        { href: '/dashboard/docs', icon: '✓', label: 'Compliance & Documentation', learnKey: 'nav.docs' },
      ],
    })
  }

  // ── Website ────────────────────────────────────────────────────────────
  const website: NavItem[] = [
    { href: '/dashboard/site', icon: '◫', label: 'Site Builder', learnKey: 'nav.site' },
  ]
  if (ticketing) website.push({ href: '/dashboard/events', icon: '◎', label: 'Events', learnKey: 'nav.events' })
  if (shareLinks) website.push({ href: '/dashboard/share', icon: '🔗', label: 'Private Shares', learnKey: 'nav.share' })
  groups.push({ id: 'website', label: 'Website', items: website })

  // ── People — full mode, owners and admins ──────────────────────────────
  if (!simple && (isOwner || staffAccess === 'Admin')) {
    groups.push({
      id: 'people',
      label: 'People',
      items: [{ href: '/dashboard/staff', icon: '◉', label: 'Staff & Roles', learnKey: 'nav.staff' }],
    })
  }

  // ── Data ───────────────────────────────────────────────────────────────
  const data: NavItem[] = [
    { href: '/dashboard/analytics', icon: '▦', label: 'Analytics', learnKey: 'nav.analytics' },
  ]
  if (!simple) data.push({ href: '/dashboard/trash', icon: '🗑', label: 'Deleted Objects', learnKey: 'nav.trash' })
  groups.push({ id: 'data', label: 'Data', items: data })

  // ── Account ────────────────────────────────────────────────────────────
  // Owners only: staff cannot cancel a subscription, so the easy-exit
  // requirement does not apply to them.
  if (isOwner) {
    groups.push({ id: 'account', label: 'Account', items: [BILLING_ITEM] })
  }

  if (isOwner) assertEasyExit(groups)
  return groups
}

/**
 * Throws if the easy-exit destination is not a top-level nav item.
 *
 * Called on every sidebar render for an owner, and in __tests__/lib/nav.test.ts
 * for every plan tier. In production it is a cheap array scan; the throw is what
 * makes a mistake impossible to miss in development or CI.
 */
export function assertEasyExit(groups: NavGroup[]): void {
  const flat = groups.flatMap(g => g.items)
  const entry = flat.find(i => i.href === EASY_EXIT_HREF)

  if (!entry) {
    throw new Error(
      `Sidebar nav is missing ${EASY_EXIT_HREF}. Cancelling a subscription must be ` +
      'reachable within two clicks of the dashboard (DMCCA easy exit). See lib/nav.ts.',
    )
  }
  if (!entry.easyExit) {
    throw new Error(
      `The ${EASY_EXIT_HREF} nav entry has lost its easyExit marker. That flag records a ` +
      'legal requirement, not a style choice. See lib/nav.ts.',
    )
  }
}

/** Every href the sidebar can render, for tests and route checks. */
export function navHrefs(groups: NavGroup[]): string[] {
  return groups.flatMap(g => g.items).map(i => i.href)
}
