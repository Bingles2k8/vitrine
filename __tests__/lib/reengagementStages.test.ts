import { describe, it, expect } from 'vitest'
import { dueOrphanStage, ORPHAN_KIND, DAY, COOLDOWN } from '@/lib/email/reengagementStages'

const SIGNUP = '2026-08-01T12:00:00.000Z'
/** `days` after signup, as an epoch ms the selector can be pinned to. */
const at = (days: number) => Date.parse(SIGNUP) + days * DAY
const none = () => new Set<string>()

describe('dueOrphanStage', () => {
  it('sends nothing before day 3', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(0))).toBeNull()
    expect(dueOrphanStage(SIGNUP, none(), null, at(2.9))).toBeNull()
  })

  it('sends each stage on its day', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(3))).toBe('c3')
    expect(dueOrphanStage(SIGNUP, none(), null, at(7))).toBe('c7')
    expect(dueOrphanStage(SIGNUP, none(), null, at(30))).toBe('c30')
  })

  // The catch window is the whole reason a missed cron day is survivable.
  it('still fires a stage the day after it was due', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(4.5))).toBe('c3')
    expect(dueOrphanStage(SIGNUP, none(), null, at(8.5))).toBe('c7')
  })

  it('gives up on a stage once its window has closed', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(5.1))).toBeNull()
    expect(dueOrphanStage(SIGNUP, none(), null, at(20))).toBeNull()
  })

  it('sends nothing at all after the last stage', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(60))).toBeNull()
    expect(dueOrphanStage(SIGNUP, none(), null, at(400))).toBeNull()
  })

  // The idempotency guarantee. Without this the cron re-sends every day of the
  // two-day window, which is the failure that reaches real inboxes.
  it('does not repeat a stage already recorded as sent', () => {
    const sent = new Set([ORPHAN_KIND.c3])
    expect(dueOrphanStage(SIGNUP, sent, null, at(3))).toBeNull()
    expect(dueOrphanStage(SIGNUP, sent, null, at(4.5))).toBeNull()
    // ...but the next stage is unaffected.
    expect(dueOrphanStage(SIGNUP, sent, null, at(7))).toBe('c7')
  })

  // A late first run should not walk someone through the whole series.
  it('picks the stage due now, not the earliest unsent one', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(30))).toBe('c30')
    expect(dueOrphanStage(SIGNUP, none(), null, at(7))).toBe('c7')
  })

  it('sends nothing once every stage has been sent', () => {
    const all = new Set(Object.values(ORPHAN_KIND))
    for (const day of [3, 7, 30, 31]) {
      expect(dueOrphanStage(SIGNUP, all, null, at(day))).toBeNull()
    }
  })

  it('returns null for an unparseable signup date rather than emailing on NaN', () => {
    expect(dueOrphanStage('not a date', none(), null, at(7))).toBeNull()
  })
})

// The rule that stops the cron landing on top of a nudge an admin sent by hand.
// The stage flags cannot see a manual send — it is recorded under a different
// kind — so without a cooldown the two arrive a day apart.
describe('cooldown after any recent email', () => {
  const iso = (days: number) => new Date(at(days)).toISOString()

  it('suppresses a stage that would land right after a manual nudge', () => {
    // Nudged by hand on day 2, c3 falls due on day 3.
    expect(dueOrphanStage(SIGNUP, none(), iso(2), at(3))).toBeNull()
  })

  it('suppresses a stage right after another stage', () => {
    const sent = new Set([ORPHAN_KIND.c3])
    expect(dueOrphanStage(SIGNUP, sent, iso(3), at(3.5))).toBeNull()
  })

  it('lets the stage through once the cooldown has passed', () => {
    // Same nudge, but the cron reaches them at the end of c3's catch window.
    expect(dueOrphanStage(SIGNUP, none(), iso(2), at(4.5))).toBe('c3')
  })

  // The property that makes 2 days safe to choose: the tightest legitimate gap
  // between two stages is c3 at the very end of its window and c7 on time.
  it('never suppresses a genuinely due stage at the tightest legal gap', () => {
    const gap = 7 - (3 + 2 - 0.1)
    expect(gap).toBeGreaterThan(COOLDOWN)
    const sent = new Set([ORPHAN_KIND.c3])
    expect(dueOrphanStage(SIGNUP, sent, iso(4.9), at(7))).toBe('c7')
  })

  it('ignores an unparseable timestamp rather than suppressing forever', () => {
    expect(dueOrphanStage(SIGNUP, none(), 'not a date', at(3))).toBe('c3')
  })

  it('treats never-emailed as no cooldown', () => {
    expect(dueOrphanStage(SIGNUP, none(), null, at(3))).toBe('c3')
  })
})
