import { describe, it, expect } from 'vitest'
import { buildSidebarNav, assertEasyExit, navHrefs, EASY_EXIT_HREF, BILLING_ITEM, type NavContext } from '@/lib/nav'
import { PLANS, PLAN_ORDER, getPlan, type PlanId } from '@/lib/plans'
import { NEUTRAL_NOUNS } from '@/lib/collectionProfiles'
import { DEFAULT_GROUP_NOUNS } from '@/lib/collectionGroups'

/**
 * The sidebar is data (lib/nav.ts) so that the DMCCA easy-exit requirement can
 * be asserted against what the sidebar actually renders, rather than against a
 * regex over its JSX. See the header comment in lib/nav.ts.
 */

function ctxFor(planId: PlanId, over: Partial<NavContext> = {}): NavContext {
  // Only the plan id and ui_mode go in. Every feature gate is derived inside
  // buildSidebarNav, so these tests exercise the real gating rather than a
  // copy of it — see the NavContext comment in lib/nav.ts.
  return {
    plan: planId,
    simple: !getPlan(planId).fullMode,
    isOwner: true,
    staffAccess: null,
    nouns: NEUTRAL_NOUNS,
    setNouns: DEFAULT_GROUP_NOUNS,
    ...over,
  }
}

describe('sidebar nav data', () => {
  it('builds a non-empty nav for every plan (guards the tests below from passing vacuously)', () => {
    for (const planId of PLAN_ORDER) {
      const groups = buildSidebarNav(ctxFor(planId))
      expect(groups.length, `${planId} produced no nav groups`).toBeGreaterThan(2)
      expect(navHrefs(groups).length, `${planId} produced no nav items`).toBeGreaterThan(5)
    }
  })

  it('every item has an href, an icon and a label', () => {
    for (const planId of PLAN_ORDER) {
      for (const item of buildSidebarNav(ctxFor(planId)).flatMap(g => g.items)) {
        expect(item.href, `${planId}: item with no href`).toMatch(/^\/dashboard/)
        expect(item.icon?.length, `${planId}: ${item.href} has no icon`).toBeGreaterThan(0)
        expect(item.label?.trim(), `${planId}: ${item.href} has no label`).toBeTruthy()
      }
    }
  })

  it('never renders the same destination twice', () => {
    for (const planId of PLAN_ORDER) {
      const hrefs = navHrefs(buildSidebarNav(ctxFor(planId)))
      expect(new Set(hrefs).size, `${planId} has duplicate nav hrefs`).toBe(hrefs.length)
    }
  })
})

/**
 * The nav was lifted out of Sidebar.tsx's JSX into lib/nav.ts. These two lists
 * are the order and membership that JSX produced, transcribed before the move.
 * They exist so the extraction cannot have silently dropped, added or reordered
 * a destination — the one regression a refactor like that invites.
 */
describe('the extraction preserved the nav exactly', () => {
  it('simple mode, owner (Hobbyist)', () => {
    const groups = buildSidebarNav(ctxFor('hobbyist'))

    expect(groups.map(g => g.label)).toEqual([
      'Collections', 'Record', 'Website', 'Data', 'Account',
    ])
    expect(navHrefs(groups)).toEqual([
      '/dashboard',
      '/dashboard/sets',
      '/dashboard/wanted',
      '/dashboard/inbox',
      '/dashboard/entry',
      '/dashboard/on-loan',
      '/dashboard/site',
      '/dashboard/share',
      '/dashboard/analytics',
      '/dashboard/plan',
    ])
  })

  /**
   * Private share links are a paid feature from Hobbyist up, which is what the
   * plan copy has always said — Community's feature list never mentioned them,
   * while Hobbyist's promises "Unlimited private share links".
   *
   * The code disagreed with the copy in both directions. Community carried
   * shareLinks: 1, and the sidebar gate was `(shareLinks ?? 0) !== 0`, which
   * coerces null to zero — so every plan with UNLIMITED links hid the nav item
   * and the only plan that showed it was the free one. Both are fixed: the gate
   * is `shareLinks !== 0`, and Community is 0.
   *
   * Checked before shipping: production held zero share links, so no museum
   * lost access to links it had already made.
   */
  it('private share links are paid-only, on every tier above Community', () => {
    const shows = (p: PlanId) => navHrefs(buildSidebarNav(ctxFor(p))).includes('/dashboard/share')

    expect(shows('community'), 'Community should not reach private share links').toBe(false)
    expect(shows('hobbyist'), 'Hobbyist has unlimited links and should see the page').toBe(true)
    expect(shows('professional')).toBe(true)
    expect(shows('institution')).toBe(true)
    expect(shows('enterprise')).toBe(true)
  })

  it('the plan data backs that up, so the gate cannot drift from the copy', () => {
    // 0 disables, null is unlimited. Guards against the gate being rewritten
    // as a truthiness check, which would disable every unlimited plan again.
    expect(PLANS.community.shareLinks, 'Community is disabled').toBe(0)
    for (const planId of PLAN_ORDER.filter(p => p !== 'community')) {
      expect(PLANS[planId].shareLinks, `${planId} should be unlimited`).toBeNull()
    }
  })

  it('full mode, owner (Institution)', () => {
    const groups = buildSidebarNav(ctxFor('institution'))

    expect(groups.map(g => g.label)).toEqual([
      'Collections', 'Object Lifecycle', 'Location & Care', 'Value & Rights',
      'Accountability', 'Website', 'People', 'Data', 'Account',
    ])
    expect(navHrefs(groups)).toEqual([
      '/dashboard',
      '/dashboard/sets',
      '/dashboard/inbox',
      '/dashboard/entry',
      '/dashboard/register',
      '/dashboard/loans',
      '/dashboard/exits',
      '/dashboard/disposal',
      '/dashboard/locations',
      '/dashboard/conservation',
      '/dashboard/damage',
      '/dashboard/risk',
      '/dashboard/emergency',
      '/dashboard/valuation',
      '/dashboard/insurance',
      '/dashboard/rights',
      '/dashboard/reproductions',
      '/dashboard/audit',
      '/dashboard/collections-use',
      '/dashboard/collections-review',
      '/dashboard/docs',
      '/dashboard/site',
      '/dashboard/events',
      '/dashboard/share',
      '/dashboard/staff',
      '/dashboard/analytics',
      '/dashboard/trash',
      '/dashboard/plan',
    ])
  })

  it('the inbox is the only prefix-matched entry, and the only badged one', () => {
    const items = buildSidebarNav(ctxFor('hobbyist')).flatMap(g => g.items)
    expect(items.filter(i => i.matchPrefix).map(i => i.href)).toEqual(['/dashboard/inbox'])
    expect(items.filter(i => i.badge).map(i => i.href)).toEqual(['/dashboard/inbox'])
  })
})

describe('DMCCA easy exit: cancelling stays two clicks from the dashboard', () => {
  it('click one — Plan & Billing is a top-level nav item on every plan', () => {
    for (const planId of PLAN_ORDER) {
      const groups = buildSidebarNav(ctxFor(planId))
      expect(navHrefs(groups), `${planId} cannot reach ${EASY_EXIT_HREF} in one click`)
        .toContain(EASY_EXIT_HREF)
    }
  })

  it('the billing entry keeps its easyExit marker', () => {
    expect(BILLING_ITEM.easyExit).toBe(true)
    expect(BILLING_ITEM.href).toBe(EASY_EXIT_HREF)

    for (const planId of PLAN_ORDER) {
      const entry = buildSidebarNav(ctxFor(planId))
        .flatMap(g => g.items)
        .find(i => i.href === EASY_EXIT_HREF)
      expect(entry?.easyExit, `${planId} lost the easyExit marker`).toBe(true)
    }
  })

  it('the nav shape cannot nest an item below a group', () => {
    // Two levels only. If a third ever appears, billing could be hidden inside
    // it and the assertions above would still pass, so this is the canary for
    // the structure the guarantee rests on.
    for (const planId of PLAN_ORDER) {
      for (const group of buildSidebarNav(ctxFor(planId))) {
        for (const item of group.items) {
          expect(Object.keys(item), `${planId}: ${item.href} has nested children`)
            .not.toContain('items')
        }
      }
    }
  })

  it('assertEasyExit throws when the billing entry is removed', () => {
    const groups = buildSidebarNav(ctxFor('hobbyist'))
    const stripped = groups
      .map(g => ({ ...g, items: g.items.filter(i => i.href !== EASY_EXIT_HREF) }))
      .filter(g => g.items.length > 0)

    expect(() => assertEasyExit(stripped)).toThrow(/easy exit|missing/i)
  })

  it('assertEasyExit throws when the marker is stripped but the link remains', () => {
    const groups = buildSidebarNav(ctxFor('hobbyist')).map(g => ({
      ...g,
      items: g.items.map(i => (i.href === EASY_EXIT_HREF ? { ...i, easyExit: undefined } : i)),
    }))

    expect(() => assertEasyExit(groups)).toThrow(/easyExit marker/)
  })

  it('building a nav for an owner runs the invariant', () => {
    // buildSidebarNav calls assertEasyExit for owners, so a future edit that
    // drops billing fails at render in development, not only in this file.
    expect(() => buildSidebarNav(ctxFor('community'))).not.toThrow()
  })

  it('does not require the exit for staff, who cannot cancel anyway', () => {
    const groups = buildSidebarNav(ctxFor('institution', { isOwner: false, staffAccess: 'Admin' }))
    expect(navHrefs(groups)).not.toContain(EASY_EXIT_HREF)
  })
})

describe('plan gating still holds after the extraction', () => {
  it('wishlist appears only where the plan allows it', () => {
    for (const planId of PLAN_ORDER) {
      const hrefs = navHrefs(buildSidebarNav(ctxFor(planId)))
      expect(hrefs.includes('/dashboard/wanted'), `${planId} wishlist gate`)
        .toBe(PLANS[planId].wishlist)
    }
  })

  it('simple mode shows the short workflow, full mode the registers', () => {
    const simple = navHrefs(buildSidebarNav(ctxFor('hobbyist')))
    expect(simple).toContain('/dashboard/on-loan')
    expect(simple).not.toContain('/dashboard/register')
    expect(simple).not.toContain('/dashboard/trash')

    const full = navHrefs(buildSidebarNav(ctxFor('institution')))
    expect(full).toContain('/dashboard/register')
    expect(full).toContain('/dashboard/trash')
    expect(full).not.toContain('/dashboard/on-loan')
  })

  it('staff management is full mode, owners and admins only', () => {
    expect(navHrefs(buildSidebarNav(ctxFor('institution')))).toContain('/dashboard/staff')
    expect(navHrefs(buildSidebarNav(ctxFor('hobbyist')))).not.toContain('/dashboard/staff')
    expect(
      navHrefs(buildSidebarNav(ctxFor('institution', { isOwner: false, staffAccess: 'Staff' }))),
    ).not.toContain('/dashboard/staff')
  })
})
