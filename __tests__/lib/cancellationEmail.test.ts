import { describe, it, expect } from 'vitest'
import { renderCancellationEmail } from '@/lib/billing/cancellationEmail'

const base = {
  museumName: 'Whitby Museum',
  effectiveAt: '2026-09-01T00:00:00.000Z',
  mode: 'period_end' as const,
  retentionDays: 180,
  initiatedBy: 'self_serve' as const,
  siteUrl: 'https://vitrinecms.com',
}

describe('renderCancellationEmail', () => {
  it('states the date service ends, in the subject and the body', () => {
    const { subject, html } = renderCancellationEmail(base)
    expect(subject).toContain('1 September 2026')
    expect(html).toContain('1 September 2026')
  })

  it('states what happens to the data and for how long', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).toMatch(/Nothing is deleted/i)
    expect(html).toContain('180')
  })

  it('gives a working export route', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).toContain('https://vitrinecms.com/api/account/export')
  })

  it('uses the shorter retention window for a trial-only account', () => {
    const { html } = renderCancellationEmail({ ...base, retentionDays: 30 })
    expect(html).toContain('30')
  })

  it('does not mention a refund when none is due', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).not.toMatch(/refund/i)
  })

  it('states the refund amount in the charged currency when one is due', () => {
    const { html } = renderCancellationEmail({
      ...base,
      mode: 'immediate',
      refundAmount: 7110,
      currency: 'gbp',
    })
    expect(html).toContain('£71.10')
  })

  it('formats a non-GBP refund in its own currency', () => {
    const { html } = renderCancellationEmail({
      ...base,
      mode: 'immediate',
      refundAmount: 9500,
      currency: 'eur',
    })
    expect(html).toMatch(/€95\.00/)
  })

  it('treats zero-decimal currencies as whole units', () => {
    const { html } = renderCancellationEmail({
      ...base,
      mode: 'immediate',
      refundAmount: 14000,
      currency: 'isk',
    })
    // 14000 ISK, not 140.00
    expect(html).toMatch(/14,000/)
  })

  it('flags a support-initiated cancellation so an unexpected one is obvious', () => {
    const { html } = renderCancellationEmail({ ...base, initiatedBy: 'support' })
    expect(html).toMatch(/actioned by the Vitrine team/i)
    expect(html).toMatch(/did not ask for it/i)
  })

  it('does not flag a self-serve cancellation as support-initiated', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).not.toMatch(/actioned by the Vitrine team/i)
  })

  it('says the paid plan has already ended for an immediate cancellation', () => {
    const { subject, html } = renderCancellationEmail({ ...base, mode: 'immediate' })
    expect(subject).toMatch(/has been cancelled/i)
    expect(html).toMatch(/paid plan ended/i)
    expect(html).toMatch(/has moved to the free Community plan/)
  })

  it('says the museum moves to Community, not that it is locked', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).toMatch(/moves to the free Community plan/)
    expect(html).not.toMatch(/locked|read-only|stops being visible/i)
  })

  it('lists what is over Community’s limits and when it is deleted', () => {
    const { html } = renderCancellationEmail({
      ...base,
      overageLines: ['12 objects, the most recently added (Community allows 100)'],
    })
    expect(html).toContain('12 objects, the most recently added')
    expect(html).toMatch(/<strong>180 days<\/strong> after your plan ends is permanently deleted/)
    expect(html).toMatch(/added most recently/)
  })

  it('says nothing will be deleted when everything fits within Community', () => {
    const { html } = renderCancellationEmail({ ...base, overageLines: [] })
    expect(html).toMatch(/nothing will be deleted/)
    expect(html).not.toMatch(/permanently deleted/)
  })

  it('states Community’s limits when the overage could not be measured', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).toMatch(/100 objects, 1 photo per object, no document storage/)
  })

  it('escapes a museum name containing HTML', () => {
    const { html } = renderCancellationEmail({
      ...base,
      museumName: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('contains no em dashes, per the house style', () => {
    const { subject, html } = renderCancellationEmail(base)
    expect(subject).not.toContain('—')
    expect(html).not.toContain('—')
  })

  it('uses British spelling', () => {
    const { html } = renderCancellationEmail(base)
    expect(html).not.toMatch(/\bcanceled\b/)
    expect(html).toMatch(/cancelled/)
  })
})
