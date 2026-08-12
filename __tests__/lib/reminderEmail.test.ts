import { describe, it, expect } from 'vitest'
import { renderReminderEmail, REMINDER_CONTENT_VERSION } from '@/lib/billing/reminderEmail'
import type { NoticeType } from '@/lib/billing/notices'

const base = {
  museumName: 'Whitby Museum',
  planLabel: 'Professional',
  amount: '£79.00',
  eventAt: '2026-09-01T00:00:00.000Z',
  siteUrl: 'https://vitrinecms.com',
}

const ALL: NoticeType[] = [
  'trial_ending_7d',
  'trial_ending_2d',
  'trial_ending_mid',
  'trial_ending_24h',
  'renewal_30d',
  'renewal_7d',
  'periodic_6m',
]

describe('every reminder meets the baseline requirements', () => {
  for (const noticeType of ALL) {
    describe(noticeType, () => {
      const { subject, html } = renderReminderEmail({ ...base, noticeType })

      it('states the amount', () => {
        expect(html).toContain('£79.00')
      })

      it('states the date', () => {
        expect(html).toContain('1 September 2026')
      })

      it('gives a direct route to cancel', () => {
        expect(html).toContain('https://vitrinecms.com/dashboard/plan')
        expect(html).toMatch(/cancel/i)
      })

      it('carries a content version for the evidence trail', () => {
        expect(html).toContain(REMINDER_CONTENT_VERSION)
      })

      it('has a subject that says something', () => {
        expect(subject.length).toBeGreaterThan(10)
      })

      it('uses no em dashes', () => {
        expect(html).not.toContain('—')
        expect(subject).not.toContain('—')
      })

      it('claims nothing about VAT', () => {
        expect(html).not.toMatch(/vat/i)
      })
    })
  }
})

describe('wording differs by notice type', () => {
  it('the trial reminders say the customer will be charged', () => {
    const { html } = renderReminderEmail({ ...base, noticeType: 'trial_ending_7d' })
    expect(html).toMatch(/free trial for/i)
    expect(html).toMatch(/ends on/i)
    expect(html).toMatch(/unless you cancel/i)
  })

  it('the final trial reminder is explicit that it is the last one', () => {
    const { html } = renderReminderEmail({ ...base, noticeType: 'trial_ending_2d' })
    expect(html).toMatch(/final reminder/i)
  })

  it('the 30 day renewal notice says why it arrived so early', () => {
    const { html } = renderReminderEmail({ ...base, noticeType: 'renewal_30d' })
    expect(html).toMatch(/30 days in advance/i)
  })

  it('the six monthly reminder explains its own cadence', () => {
    const { html } = renderReminderEmail({ ...base, noticeType: 'periodic_6m' })
    expect(html).toMatch(/every six months/i)
  })
})

describe('price change notices', () => {
  const { subject, html } = renderReminderEmail({
    ...base,
    noticeType: 'price_change_30d',
    priceChange: {
      oldAmount: '£79.00',
      newAmount: '£89.00',
      effectiveAt: '2026-10-01T00:00:00.000Z',
    },
  })

  it('states the old price, the new price and the effective date', () => {
    expect(html).toContain('£79.00')
    expect(html).toContain('£89.00')
    expect(html).toContain('1 October 2026')
  })

  it('says the notice period was honoured', () => {
    expect(html).toMatch(/at least 30 days/i)
  })

  it('gives a route to cancel before the new price applies', () => {
    expect(html).toContain('https://vitrinecms.com/dashboard/plan')
  })

  it('has a subject that names the change', () => {
    expect(subject).toMatch(/price/i)
  })
})

describe('escaping', () => {
  it('escapes a hostile museum name', () => {
    const { html } = renderReminderEmail({
      ...base,
      museumName: '<script>alert(1)</script>',
      noticeType: 'renewal_7d',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('copes with no museum name', () => {
    const { html } = renderReminderEmail({ ...base, museumName: null, noticeType: 'renewal_7d' })
    expect(html).toContain('your museum')
  })
})
