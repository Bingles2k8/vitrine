import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// downgrade.ts imports the R2 client. Nothing here touches storage.
vi.mock('@/lib/r2', () => ({ r2: { send: vi.fn() }, r2Locate: vi.fn(), DeleteObjectsCommand: vi.fn() }))

import {
  COMPLIMENTARY_PLANS,
  COMPLIMENTARY_RETENTION_DAYS,
  grantComplimentaryUpdate,
  isComplimentaryPlan,
  revokeComplimentaryUpdate,
} from '@/lib/billing/complimentary'
import { renderDowngradeEmail } from '@/lib/billing/downgradeEmail'
import { PLANS } from '@/lib/plans'

describe('complimentary plans', () => {
  it('can only be paid plans, never Community', () => {
    expect(isComplimentaryPlan('community')).toBe(false)
    expect(isComplimentaryPlan('free')).toBe(false)
    expect(isComplimentaryPlan(null)).toBe(false)
    for (const id of COMPLIMENTARY_PLANS) {
      expect(isComplimentaryPlan(id)).toBe(true)
      expect(PLANS[id], `${id} is not a plan in lib/plans.ts`).toBeDefined()
    }
  })

  it('granting sets the plan itself, which is what every gate reads', () => {
    const update = grantComplimentaryUpdate('professional')
    expect(update).toMatchObject({
      plan: 'professional',
      complimentary_plan: 'professional',
      ui_mode: 'full',
    })
    expect(grantComplimentaryUpdate('hobbyist')).toMatchObject({ plan: 'hobbyist', ui_mode: 'simple' })
  })

  it('granting cancels any pending downgrade, lock or scheduled deletion', () => {
    expect(grantComplimentaryUpdate('institution')).toMatchObject({
      pending_downgrade_plan: null,
      pending_downgrade_date: null,
      payment_past_due: false,
      locked_at: null,
      read_only_until: null,
      scheduled_deletion_at: null,
      over_limit_purge_at: null,
      purge_warning_30d_sent_at: null,
      purge_warning_7d_sent_at: null,
    })
  })

  it('removing moves to Community with the 180-day window, like a paid plan ending', () => {
    expect(COMPLIMENTARY_RETENTION_DAYS).toBe(180)
    const now = new Date('2026-10-12T12:00:00Z')
    const purgeAt = new Date('2027-04-10T12:00:00Z')
    expect(revokeComplimentaryUpdate({ now, purgeAt })).toMatchObject({
      plan: 'community',
      complimentary_plan: null,
      over_limit_purge_at: purgeAt.toISOString(),
      // 180 days leaves room for the 30-day reminder, so it is not pre-marked.
      purge_warning_30d_sent_at: null,
    })
    expect(revokeComplimentaryUpdate({ now, purgeAt: null })).toMatchObject({ over_limit_purge_at: null })
  })

  it('the removal email says the complimentary plan ended, not a subscription', () => {
    const { html } = renderDowngradeEmail({
      museumName: 'Test Museum',
      trialOnly: false,
      complimentaryPlanLabel: 'Professional',
      overageLines: [],
      purgeAt: null,
      siteUrl: 'https://vitrinecms.com',
    })
    expect(html).toContain('complimentary Professional plan')
    expect(html).not.toMatch(/subscription for/)
    expect(html).toContain('Choose a plan')
  })
})

describe('the complimentary-plan SQL matches the code', () => {
  const sql = readFileSync(join(__dirname, '..', '..', 'supabase', 'complimentary-plan-2026-10-12.sql'), 'utf8')

  it('allows exactly the plans the code can grant', () => {
    const check = sql.match(/CHECK \(complimentary_plan IN \(([^)]+)\)\)/)
    expect(check, 'CHECK constraint not found').not.toBeNull()
    const allowed = check![1].split(',').map(s => s.trim().replace(/'/g, ''))
    expect(allowed.sort()).toEqual([...COMPLIMENTARY_PLANS].sort())
  })

  it('keeps the column out of the owner\'s reach on insert and update', () => {
    expect(sql).toMatch(/NEW\.complimentary_plan IS NOT NULL/)
    expect(sql).toMatch(/NEW\.complimentary_plan IS DISTINCT FROM OLD\.complimentary_plan/)
  })
})
