import { describe, it, expect } from 'vitest'
import {
  buildKeyContractInfo,
  addMonths,
  keyContractInfoAsText,
  KEY_CONTRACT_INFO_VERSION,
} from '@/lib/billing/keyContractInfo'
import { renderPreContractEmail } from '@/lib/billing/preContractEmail'
import { VAT_REGISTERED } from '@/lib/billing/config'

const start = new Date('2026-08-11T10:00:00.000Z')

function build(overrides: Parameters<typeof buildKeyContractInfo>[0] extends infer T ? Partial<T> : never = {}) {
  return buildKeyContractInfo({
    planId: 'professional',
    currency: 'GBP',
    startsAt: start,
    ...overrides,
  } as Parameters<typeof buildKeyContractInfo>[0])
}

const labels = (terms: { label: string }[]) => terms.map((t) => t.label)
const valueFor = (terms: { label: string; value: string }[], label: string) =>
  terms.find((t) => t.label === label)?.value ?? ''

describe('addMonths', () => {
  it('adds a month in the ordinary case', () => {
    expect(addMonths(new Date('2026-08-11T10:00:00Z'), 1).toISOString()).toBe('2026-09-11T10:00:00.000Z')
  })

  it('clamps 31 January to the end of February rather than spilling into March', () => {
    expect(addMonths(new Date('2026-01-31T10:00:00Z'), 1).toISOString()).toBe('2026-02-28T10:00:00.000Z')
  })

  it('handles a leap year', () => {
    expect(addMonths(new Date('2028-01-31T10:00:00Z'), 1).toISOString()).toBe('2028-02-29T10:00:00.000Z')
  })

  it('rolls the year over in December', () => {
    expect(addMonths(new Date('2026-12-15T10:00:00Z'), 1).toISOString()).toBe('2027-01-15T10:00:00.000Z')
  })
})

describe('the required facts are all present', () => {
  const info = build()

  it('covers every item the regulations name', () => {
    const l = labels(info.terms)
    expect(l).toContain('Price')
    expect(l).toContain('Billing frequency')
    expect(l).toContain('First charge')
    expect(l).toContain('First renewal')
    expect(l).toContain('Does it renew automatically?')
    expect(l).toContain('Minimum term')
    expect(l).toContain('How to cancel')
    expect(l).toContain('Your right to change your mind')
  })

  it('states that there is no minimum term rather than leaving it unsaid', () => {
    expect(valueFor(info.terms, 'Minimum term')).toMatch(/no minimum term/i)
  })

  it('states plainly that it auto-renews', () => {
    expect(valueFor(info.terms, 'Does it renew automatically?')).toMatch(/^Yes/)
  })

  it('gives the 14 day cooling-off right and all three of its triggers', () => {
    const v = valueFor(info.terms, 'Your right to change your mind')
    expect(v).toContain('14 days')
    expect(v).toMatch(/first subscribe/i)
    expect(v).toMatch(/trial converts/i)
    expect(v).toMatch(/every renewal/i)
  })

  it('stamps the content version so we can prove what was shown', () => {
    expect(info.version).toBe(KEY_CONTRACT_INFO_VERSION)
  })

  it('describes what the plan provides', () => {
    expect(info.provides.length).toBeGreaterThan(0)
  })
})

describe('VAT is not claimed while unregistered', () => {
  it('the constant is currently false', () => {
    expect(VAT_REGISTERED).toBe(false)
  })

  it('the price says nothing about VAT', () => {
    const info = build()
    expect(valueFor(info.terms, 'Price')).not.toMatch(/vat/i)
  })

  it('no part of the panel mentions VAT', () => {
    expect(keyContractInfoAsText(build())).not.toMatch(/vat/i)
  })

  it('no part of the email mentions VAT', () => {
    const { html, subject } = renderPreContractEmail({
      info: build(),
      museumName: 'Whitby Museum',
      siteUrl: 'https://vitrinecms.com',
    })
    expect(html).not.toMatch(/vat/i)
    expect(subject).not.toMatch(/vat/i)
  })
})

describe('charge dates', () => {
  it('charges today when there is no trial', () => {
    const info = build()
    expect(valueFor(info.terms, 'First charge')).toContain('11 August 2026')
    expect(valueFor(info.terms, 'First renewal')).toContain('11 September 2026')
  })

  it('defers the first charge to the end of a trial', () => {
    const info = build({ trialDays: 30 })
    expect(valueFor(info.terms, 'First charge')).toContain('10 September 2026')
    expect(valueFor(info.terms, 'First charge')).toMatch(/free trial ends/i)
    // Renewal is a month after the first charge, not a month after signing up.
    expect(valueFor(info.terms, 'First renewal')).toContain('10 October 2026')
  })
})

describe('trial terms', () => {
  it('are absent when there is no trial', () => {
    expect(build().trial).toBeNull()
  })

  it('give the length, the exact end date, the amount and how to get out', () => {
    const info = build({ trialDays: 30 })
    expect(info.trial).not.toBeNull()
    const t = info.trial!
    expect(valueFor(t, 'Free trial')).toContain('30 days')
    expect(valueFor(t, 'Your trial ends')).toBe('10 September 2026')
    expect(valueFor(t, 'What you are charged then')).toMatch(/£79/)
    expect(valueFor(t, 'Cancelling before you are charged')).toMatch(/will not be charged at all/i)
  })

  it('promises the 7 and 2 day reminders on a long trial', () => {
    const info = build({ trialDays: 30 })
    expect(valueFor(info.trial!, 'Cancelling before you are charged')).toContain('7 days and 2 days')
  })

  it('promises the midpoint and 24 hour reminders on a short trial', () => {
    const info = build({ trialDays: 5 })
    expect(valueFor(info.trial!, 'Cancelling before you are charged')).toContain('partway through and 24 hours')
  })
})

describe('introductory pricing', () => {
  it('is absent when none applies', () => {
    expect(build().introductoryPrice).toBeNull()
  })

  it('shows the discounted price, its duration and the price afterwards together', () => {
    const info = build({
      introductory: { amount: '£39.00', months: 3, thenAmount: '£79.00' },
    })
    const intro = info.introductoryPrice!
    expect(valueFor(intro, 'Introductory price')).toContain('£39.00')
    expect(valueFor(intro, 'Introductory price')).toContain('3 months')
    expect(valueFor(intro, 'Price after that')).toContain('£79.00')
  })
})

describe('the email carries the same facts as the panel', () => {
  it('includes every term from the panel', () => {
    const info = build({ trialDays: 30 })
    const { html } = renderPreContractEmail({
      info,
      museumName: 'Whitby Museum',
      siteUrl: 'https://vitrinecms.com',
    })
    for (const term of [...info.terms, ...(info.trial ?? [])]) {
      expect(html).toContain(term.label)
    }
  })

  it('carries the version as a reference the customer can quote', () => {
    const { html } = renderPreContractEmail({
      info: build(),
      museumName: null,
      siteUrl: 'https://vitrinecms.com',
    })
    expect(html).toContain(KEY_CONTRACT_INFO_VERSION)
  })

  it('escapes a hostile museum name', () => {
    const { html } = renderPreContractEmail({
      info: build(),
      museumName: '<script>alert(1)</script>',
      siteUrl: 'https://vitrinecms.com',
    })
    expect(html).not.toContain('<script>')
  })

  it('contains no em dashes, per the house style', () => {
    const { html, subject } = renderPreContractEmail({
      info: build({ trialDays: 30 }),
      museumName: 'Whitby Museum',
      siteUrl: 'https://vitrinecms.com',
    })
    expect(html).not.toContain('—')
    expect(subject).not.toContain('—')
  })
})
