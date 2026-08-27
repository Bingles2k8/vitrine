import { describe, it, expect } from 'vitest'
import { renderNudgeEmail, nudgeVariant, describeGap } from '@/lib/email/nudge'

const NOW = Date.parse('2026-08-25T12:00:00.000Z')

const base = {
  museumName: 'Whitby Museum',
  createdAt: '2026-05-25T12:00:00.000Z',
  lastSignInAt: '2026-06-25T12:00:00.000Z',
  siteUrl: 'https://vitrinecms.com',
  unsubscribeUrl: 'https://vitrinecms.com/api/reengagement/unsubscribe?token=abc',
  now: NOW,
}

describe('nudgeVariant', () => {
  it('treats a never-signed-in owner as never returned', () => {
    expect(nudgeVariant('2026-05-25T12:00:00.000Z', null)).toBe('never_returned')
  })

  it('treats the signup auto-login as not coming back', () => {
    // Same-day session, an hour after signing up.
    expect(nudgeVariant('2026-05-25T12:00:00.000Z', '2026-05-25T13:00:00.000Z')).toBe('never_returned')
  })

  it('treats a later session as coming back', () => {
    expect(nudgeVariant('2026-05-25T12:00:00.000Z', '2026-06-25T12:00:00.000Z')).toBe('dormant')
  })
})

describe('describeGap', () => {
  it('rounds to something a person would say', () => {
    expect(describeGap(4)).toBe('a few days')
    expect(describeGap(15)).toBe('a couple of weeks')
    expect(describeGap(31)).toBe('about a month')
    expect(describeGap(90)).toBe('about 3 months')
    expect(describeGap(400)).toBe('about a year')
    expect(describeGap(800)).toBe('about 2 years')
  })
})

describe('renderNudgeEmail', () => {
  it('dates the signup for a never-returned owner, and does not claim they have a collection', () => {
    const { subject, html } = renderNudgeEmail({ ...base, variant: 'never_returned' })
    expect(subject).toBe('Your Vitrine museum')
    expect(html).toContain('about 3 months ago')
    expect(html).not.toMatch(/your collection/i)
    // Offers the appeal rather than reassuring about cost or permanence.
    expect(html).not.toMatch(/takes a minute|nothing is (final|permanent)/i)
  })

  it('tells a dormant owner how long it has been, by name', () => {
    const { subject, html } = renderNudgeEmail({ ...base, variant: 'dormant' })
    expect(subject).toContain('Whitby Museum')
    expect(html).toContain('Whitby Museum')
    expect(html).toContain('about 2 months')
  })

  it('drops the museum name from the dormant copy rather than printing a blank', () => {
    const { subject, html } = renderNudgeEmail({ ...base, variant: 'dormant', museumName: '  ' })
    expect(subject).toBe('Your Vitrine museum')
    expect(html).not.toContain('<strong></strong>')
  })

  it('escapes a museum name containing markup', () => {
    const { html } = renderNudgeEmail({ ...base, variant: 'dormant', museumName: '<script>x</script>' })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('carries an unsubscribe link in both parts', () => {
    const { html, text } = renderNudgeEmail({ ...base, variant: 'dormant' })
    expect(html).toContain(base.unsubscribeUrl)
    expect(text).toContain(base.unsubscribeUrl)
  })

  it('reads as a person wrote it', () => {
    for (const variant of ['never_returned', 'dormant'] as const) {
      const { subject, text } = renderNudgeEmail({ ...base, variant })
      // Em and en dashes are the giveaway, and there are no lists in this email.
      expect(text).not.toMatch(/[—–]/)
      expect(subject).not.toMatch(/[—–]/)
      expect(text).not.toMatch(/<li>|^\s*[-*•]\s/m)
    }
  })

  it('carries no sign-off', () => {
    for (const variant of ['never_returned', 'dormant'] as const) {
      const { html, text } = renderNudgeEmail({ ...base, variant })
      expect(text).not.toMatch(/\bMatt\b|Best wishes|Kind regards|Thanks,|Cheers/i)
      expect(html).not.toMatch(/\bMatt\b/)
      // The button is the whole of the ask, so it is the last thing in the body.
      expect(text.trim().split('\n\n').at(-1)).toMatch(/^Unsubscribe/)
    }
  })

  it('is styled to the site rather than to a default mail template', () => {
    const { html } = renderNudgeEmail({ ...base, variant: 'dormant' })
    expect(html).toContain('#0c0a09') // stone-950 header band
    expect(html).toContain('#f59e0b') // amber-500 accent and button
    expect(html).toContain('Vitrine<span style="color:#f59e0b">.</span>')
    expect(html).toMatch(/font-style:italic/) // serif italic wordmark
    // Outlook ignores divs often enough that the layout has to be tables.
    expect(html).toContain('role="presentation"')
    expect(html).not.toMatch(/Georgia,serif;max-width/) // the old house style
  })

  it('stays a nudge rather than asking for a conversation', () => {
    for (const variant of ['never_returned', 'dormant'] as const) {
      const { text } = renderNudgeEmail({ ...base, variant })
      expect(text).not.toMatch(/reply|hear from you|let me know|get in touch|tell me/i)
      // Two sentences and a link. Anything longer has started editorialising.
      const body = text.split('Open your museum')[0]
      expect(body.split('.').filter(s => s.trim()).length).toBeLessThanOrEqual(3)
    }
  })
})

describe('renderNudgeEmail, no-museum variant', () => {
  // Someone who abandoned onboarding can go and look. Every claim the other
  // two variants make about a museum is false for them, so none may appear.
  const orphan = { ...base, variant: 'no_museum' as const, museumName: null }

  it('dates the signup and never claims they have a museum or a collection', () => {
    const { subject, html, text } = renderNudgeEmail(orphan)
    expect(subject).toBe('One step from your museum')
    expect(html).toContain('about 3 months ago')
    expect(html).not.toMatch(/your collection/i)
    expect(html).not.toMatch(/still set up/i)
    expect(text).not.toMatch(/your museum is/i)
  })

  it('sends them to the dashboard, which is the gate that routes them onward', () => {
    // Not /onboarding: that page is not behind the auth gate, so a logged-out
    // reader would fill the form in before discovering it could not save.
    const { html, text } = renderNudgeEmail(orphan)
    expect(html).toContain('https://vitrinecms.com/dashboard"')
    expect(html).toContain('Name your museum')
    expect(text).toContain('Name your museum: https://vitrinecms.com/dashboard')
  })

  it('ignores a museum name if one is somehow passed', () => {
    const { subject, html } = renderNudgeEmail({ ...orphan, museumName: 'Whitby Museum' })
    expect(subject).toBe('One step from your museum')
    expect(html).not.toContain('Whitby Museum')
  })

  it('still carries the unsubscribe link', () => {
    const { html } = renderNudgeEmail(orphan)
    expect(html).toContain(base.unsubscribeUrl)
  })
})
