import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSidebarNav, navHrefs, EASY_EXIT_HREF } from '@/lib/nav'
import { PLAN_ORDER, getPlan, type PlanId } from '@/lib/plans'
import { NEUTRAL_NOUNS } from '@/lib/collectionProfiles'
import { DEFAULT_GROUP_NOUNS } from '@/lib/collectionGroups'

/**
 * Guards the DMCCA easy-exit rules against a future redesign.
 *
 * The brief asks for an end-to-end test asserting the click depth. There is no
 * browser test runner in this repo, and adding Playwright is a new dependency
 * that has not been agreed, so this asserts the same invariants structurally
 * over the source instead. It is weaker than driving a real browser, but it
 * fails loudly if someone moves the cancel control back behind the settings
 * panel or reintroduces a survey, which is the regression that matters.
 *
 * If Playwright is ever added, replace this with a real click-depth walk.
 *
 * Two things were hardened after a review found the original version could pass
 * while the requirement was broken:
 *
 *   1. Click one is now asserted against lib/nav.ts — the data the sidebar
 *      actually renders — instead of a regex searching Sidebar.tsx for
 *      `navItem('/dashboard/plan'`. That regex matched the string wherever it
 *      appeared, including inside the settings panel, which is the exact
 *      regression this file exists to prevent.
 *
 *   2. Most assertions below are negative (`not.toMatch`). Eighteen of them
 *      passed against an empty string, so a renamed or moved component would
 *      have turned the whole suite green while checking nothing. The canaries
 *      in the first describe block run before any of them and fail if the
 *      source did not load or no longer looks like the component under test.
 */

const root = join(__dirname, '..', '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

const planPage = read('app/dashboard/plan/page.tsx')
const cancelComponent = read('components/billing/CancelSubscription.tsx')
const balancedChoice = read('components/billing/BalancedChoice.tsx')

/**
 * Comments explain why the forbidden patterns are forbidden, and so contain
 * the very words we are banning. The rules are about what a customer sees, so
 * the content checks run against the source with comments stripped.
 */
const cancelMarkup = stripComments(cancelComponent)
const choiceMarkup = stripComments(balancedChoice)

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and JSDoc
    .replace(/^\s*\/\/.*$/gm, '')     // whole-line double slash
}

function ctxFor(planId: PlanId) {
  return {
    plan: planId,
    simple: !getPlan(planId).fullMode,
    isOwner: true,
    staffAccess: null,
    nouns: NEUTRAL_NOUNS,
    setNouns: DEFAULT_GROUP_NOUNS,
  }
}

/**
 * Everything below this block is a negative assertion, and a negative assertion
 * against an empty string always passes. These run first and fail if the source
 * we are about to search is missing, empty, or no longer the component we think
 * it is — the same guard learnKeys.test.ts uses on its regex scan.
 */
describe('the sources under test actually loaded', () => {
  it('reads a substantial cancel component', () => {
    expect(cancelComponent.length).toBeGreaterThan(1000)
    expect(cancelMarkup.length).toBeGreaterThan(500)
  })

  it('the stripped markup still contains the anchors the checks rely on', () => {
    // If any of these disappear, the negative assertions below are searching
    // something other than the cancel dialogue and prove nothing.
    expect(cancelMarkup).toContain('Keep my subscription')
    expect(cancelMarkup).toContain('cancel-subscription-confirm')
    expect(cancelMarkup).toContain('BalancedChoice')
    expect(cancelMarkup).toMatch(/fetch\(/)
  })

  it('stripComments removes commentary without eating the markup', () => {
    expect(stripComments('// gone\nkept')).toBe('\nkept')
    expect(stripComments('/* gone */kept')).toBe('kept')
    // A guard against the regex ever becoming greedy enough to blank the file.
    expect(cancelMarkup.length).toBeGreaterThan(cancelComponent.length * 0.4)
  })

  it('reads the plan page and the shared choice component', () => {
    expect(planPage.length).toBeGreaterThan(500)
    expect(balancedChoice.length).toBeGreaterThan(500)
    // The choice component's own checks are negative too, so they need the
    // same guard: prove the stripped source still holds its two buttons.
    expect(choiceMarkup).toContain('CHOICE_CLASS')
    expect(choiceMarkup.match(/<button/g) ?? []).toHaveLength(2)
  })
})

describe('cancellation is reachable within two clicks of the dashboard', () => {
  it('click one: the plan page is a top-level sidebar nav item on every plan', () => {
    // Asserted against the nav data the sidebar renders, not a regex over its
    // JSX. Nesting is not expressible in that structure, so presence here means
    // top-level. See lib/nav.ts and __tests__/lib/nav.test.ts.
    for (const planId of PLAN_ORDER) {
      expect(navHrefs(buildSidebarNav(ctxFor(planId))), `${planId} cannot reach billing in one click`)
        .toContain(EASY_EXIT_HREF)
    }
  })

  it('click two: the cancel control is rendered directly on the plan page', () => {
    expect(planPage).toContain('CancelSubscription')
    expect(planPage).toMatch(/import CancelSubscription from '@\/components\/billing\/CancelSubscription'/)
  })

  it('the cancel trigger opens the confirmation directly, with nothing in between', () => {
    // The trigger sets `open` and does nothing else. Any redirect, upsell step
    // or intermediate route would show up here.
    expect(cancelMarkup).toMatch(/onClick=\{\(\) => setOpen\(true\)\}/)
    expect(cancelMarkup).not.toMatch(/router\.push|window\.location|<a\s+href/)
  })
})

describe('no exit survey and no save offer', () => {
  const forbidden = [
    /survey/i,
    /why are you (leaving|cancelling)/i,
    /reason for cancel/i,
    /tell us why/i,
    /before you go/i,
    /special offer/i,
    /discount/i,
    /\bpause\b.*subscription/i,
  ]

  for (const pattern of forbidden) {
    it(`the cancel flow contains nothing matching ${pattern}`, () => {
      expect(cancelMarkup).not.toMatch(pattern)
    })
  }
})

describe('the keep and cancel controls carry equal visual weight', () => {
  /**
   * This used to compare the two hand-written className strings and fail once
   * they drifted apart. They now come from a single constant inside
   * BalancedChoice, so drift is not possible — what needs guarding is that the
   * component keeps that shape and that the dialogue keeps using it.
   */
  it('the dialogue renders the shared choice component', () => {
    expect(cancelMarkup).toMatch(/<BalancedChoice/)
    expect(cancelMarkup).toMatch(/import BalancedChoice from '@\/components\/billing\/BalancedChoice'/)
  })

  it('both choice labels are passed to the shared component, not hand-rolled', () => {
    // The file legitimately contains other buttons — the dialogue trigger,
    // which is itself labelled "Cancel subscription", and the radio-style
    // refund option picker. So this isolates the BalancedChoice element and
    // asserts both labels live inside it.
    const start = cancelMarkup.indexOf('<BalancedChoice')
    expect(start, 'the dialogue no longer renders BalancedChoice').toBeGreaterThan(-1)
    const end = cancelMarkup.indexOf('/>', start)
    expect(end, 'could not find the end of the BalancedChoice element').toBeGreaterThan(start)

    const element = cancelMarkup.slice(start, end)
    expect(element).toContain('Keep my subscription')
    expect(element).toContain('Cancel subscription')
    // No button may be opened inside the element — the props are labels only.
    expect(element).not.toMatch(/<button/)
  })

  it('both choices are styled from one constant, applied identically', () => {
    const applications = choiceMarkup.match(/className=\{CHOICE_CLASS\}/g) ?? []
    expect(applications).toHaveLength(2)
    // No second style, and no escape hatch for callers to restyle one side.
    expect(choiceMarkup).not.toMatch(/className="[^"]*flex-1/)
    expect(choiceMarkup).not.toMatch(/className\?:|classNames?:/)
  })

  it('neither is a bare text link', () => {
    expect(choiceMarkup).not.toMatch(/<a\s/)
    expect(choiceMarkup.match(/<button/g) ?? []).toHaveLength(2)
  })

  it('uses no confirmshaming language', () => {
    const shaming = [
      /no thanks,? i/i,
      /i (like|prefer) paying/i,
      /i don'?t (want|care) (to save|about)/i,
      /give up/i,
      /lose everything/i,
    ]
    for (const pattern of shaming) {
      expect(cancelMarkup).not.toMatch(pattern)
    }
  })
})

describe('exactly one confirmation step', () => {
  it('submits straight from the dialogue with no second are-you-sure', () => {
    // One fetch to the cancel endpoint, called directly by the confirm button.
    const fetchCalls = cancelMarkup.match(/fetch\(/g) ?? []
    expect(fetchCalls).toHaveLength(1)
    expect(cancelMarkup).toMatch(/onClick: submit|onClick=\{submit\}/)
    // window.confirm would be a second dialogue on top of this one.
    expect(cancelMarkup).not.toMatch(/window\.confirm|confirm\(/)
  })
})
