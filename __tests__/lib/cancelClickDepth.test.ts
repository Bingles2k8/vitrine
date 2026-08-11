import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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
 */

const root = join(__dirname, '..', '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

const sidebar = read('components/Sidebar.tsx')
const planPage = read('app/dashboard/plan/page.tsx')
const cancelComponent = read('components/billing/CancelSubscription.tsx')

/**
 * Comments explain why the forbidden patterns are forbidden, and so contain
 * the very words we are banning. The rules are about what a customer sees, so
 * the content checks run against the source with comments stripped.
 */
const cancelMarkup = stripComments(cancelComponent)

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and JSDoc
    .replace(/^\s*\/\/.*$/gm, '')     // whole-line double slash
}

describe('cancellation is reachable within two clicks of the dashboard', () => {
  it('click one: the plan page is a top-level sidebar nav item', () => {
    // Not inside the settings panel, which would make it click two and push
    // the cancel control to click three.
    expect(sidebar).toMatch(/navItem\(\s*['"]\/dashboard\/plan['"]/)
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
  it('both are buttons with identical styling', () => {
    // Extract the className of each. They must be character-identical, so one
    // cannot quietly become a filled primary and the other a muted text link.
    const keep = extractClass(cancelMarkup, 'Keep my subscription')
    const cancel = extractClass(cancelMarkup, 'cancel-subscription-confirm')

    expect(keep).toBeTruthy()
    expect(cancel).toBeTruthy()
    expect(keep).toBe(cancel)
  })

  it('neither is a bare text link', () => {
    const dialogue = cancelMarkup.slice(cancelMarkup.indexOf('Keep my subscription') - 600)
    expect(dialogue).not.toMatch(/Keep my subscription[\s\S]{0,200}<a\s/)
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
    expect(cancelMarkup).toMatch(/onClick=\{submit\}/)
    // window.confirm would be a second dialogue on top of this one.
    expect(cancelMarkup).not.toMatch(/window\.confirm|confirm\(/)
  })
})

/**
 * Pull the className string from the button containing `marker`, which may be
 * either the visible label or the test id.
 */
function extractClass(source: string, marker: string): string | null {
  const idx = source.indexOf(marker)
  if (idx === -1) return null
  // Search backwards to the opening <button, then forward for its className.
  const open = source.lastIndexOf('<button', idx)
  const segment = source.slice(open, source.indexOf('</button>', idx))
  const match = segment.match(/className="([^"]+)"/)
  return match ? match[1] : null
}
