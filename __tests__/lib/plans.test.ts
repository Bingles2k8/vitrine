import { describe, it, expect } from 'vitest'
import { getPlan, PLANS } from '@/lib/plans'

describe('getPlan', () => {
  it('returns the correct plan for a valid plan ID', () => {
    expect(getPlan('professional').label).toBe('Professional')
    expect(getPlan('hobbyist').label).toBe('Hobbyist')
    expect(getPlan('institution').label).toBe('Institution')
  })

  it('falls back to community for an unknown plan ID', () => {
    expect(getPlan('unknown').label).toBe('Community')
    expect(getPlan('').label).toBe('Community')
  })

  it('community plan has zero document storage', () => {
    expect(getPlan('community').documentStorageMb).toBe(0)
    expect(getPlan('hobbyist').documentStorageMb).toBe(0)
  })

  it('paid plans have document storage limits', () => {
    expect(getPlan('professional').documentStorageMb).toBe(1024)
    expect(getPlan('institution').documentStorageMb).toBe(10240)
  })

  it('enterprise plan has unlimited document storage (null)', () => {
    expect(getPlan('enterprise').documentStorageMb).toBeNull()
  })

  it('community and hobbyist are not full mode', () => {
    expect(getPlan('community').fullMode).toBe(false)
    expect(getPlan('hobbyist').fullMode).toBe(false)
  })

  it('professional and above are full mode', () => {
    expect(getPlan('professional').fullMode).toBe(true)
    expect(getPlan('institution').fullMode).toBe(true)
    expect(getPlan('enterprise').fullMode).toBe(true)
  })

  it('all plan IDs in PLANS are valid and self-consistent', () => {
    for (const [id, plan] of Object.entries(PLANS)) {
      expect(getPlan(id)).toBe(plan)
    }
  })
})
