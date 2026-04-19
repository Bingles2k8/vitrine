import { describe, it, expect } from 'vitest'
import { getCollectionValue } from '@/lib/collectionValue'

describe('getCollectionValue', () => {
  it('returns zero for an empty collection', () => {
    const r = getCollectionValue([], [])
    expect(r.total).toBe(0)
    expect(r.counted).toBe(0)
  })

  it('falls back to estimated_value when no valuation exists', () => {
    const r = getCollectionValue(
      [{ id: 'a', estimated_value: '100', estimated_value_currency: 'GBP' }],
      []
    )
    expect(r.total).toBe(100)
    expect(r.currency).toBe('GBP')
    expect(r.counted).toBe(1)
  })

  it('falls back to acquisition_value when estimated is absent', () => {
    const r = getCollectionValue(
      [{ id: 'a', acquisition_value: '50', acquisition_currency: 'USD' }],
      []
    )
    expect(r.total).toBe(50)
    expect(r.currency).toBe('USD')
  })

  it('prefers latest valuation over estimated and acquisition', () => {
    const r = getCollectionValue(
      [{ id: 'a', estimated_value: '100', acquisition_value: '50' }],
      [
        { object_id: 'a', value: '200', currency: 'GBP', valuation_date: '2025-01-01' },
        { object_id: 'a', value: '300', currency: 'GBP', valuation_date: '2026-01-01' },
      ]
    )
    expect(r.total).toBe(300)
  })

  it('skips objects with no value recorded anywhere', () => {
    const r = getCollectionValue(
      [
        { id: 'a', estimated_value: '100' },
        { id: 'b' },
        { id: 'c', acquisition_value: '25' },
      ],
      []
    )
    expect(r.total).toBe(125)
    expect(r.counted).toBe(2)
  })

  it('picks the dominant currency from valued objects', () => {
    const r = getCollectionValue(
      [
        { id: 'a', estimated_value: '100', estimated_value_currency: 'USD' },
        { id: 'b', estimated_value: '100', estimated_value_currency: 'GBP' },
        { id: 'c', estimated_value: '100', estimated_value_currency: 'GBP' },
      ],
      []
    )
    expect(r.currency).toBe('GBP')
  })

  it('ignores valuation rows with zero or blank value', () => {
    const r = getCollectionValue(
      [{ id: 'a', estimated_value: '100' }],
      [{ object_id: 'a', value: '0', valuation_date: '2026-01-01' }]
    )
    expect(r.total).toBe(100)
  })
})
