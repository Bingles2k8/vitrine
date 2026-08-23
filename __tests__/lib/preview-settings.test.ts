import { describe, it, expect } from 'vitest'
import { encodePreview, decodePreview, applyPreview, pickPreviewable } from '@/lib/previewSettings'

describe('preview settings', () => {
  it('round-trips the presentation fields', () => {
    const settings = { template: 'verso', accent_color: '#c9a75c', grid_columns: 3, dark_mode: true }
    expect(decodePreview(encodePreview(settings))).toEqual(settings)
  })

  it('round-trips template options, which are nested', () => {
    const settings = { template: 'northlight', template_options: { northlight: { lighting: 'night', perShelf: '4' } } }
    expect(decodePreview(encodePreview(settings))).toEqual(settings)
  })

  it('refuses anything that is not presentation', () => {
    const picked = pickPreviewable({
      template: 'flip',
      plan: 'enterprise',
      stripe_customer_id: 'cus_evil',
      owner_id: 'someone-else',
      hide_money_values: false,
    })
    expect(picked).toEqual({ template: 'flip' })
    expect(picked).not.toHaveProperty('plan')
    expect(picked).not.toHaveProperty('stripe_customer_id')
    expect(picked).not.toHaveProperty('owner_id')
  })

  it('drops non-presentation keys even when they arrive encoded', () => {
    const raw = Buffer.from(JSON.stringify({ template: 'foil', plan: 'enterprise' }), 'utf8')
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodePreview(raw)).toEqual({ template: 'foil' })
  })

  it('returns null for junk rather than throwing', () => {
    for (const bad of ['', 'not-base64!!', 'eyJ', undefined, null, 'x'.repeat(9000)]) {
      expect(decodePreview(bad as string)).toBeNull()
    }
  })

  it('leaves the row untouched when there is nothing to apply', () => {
    const row = { template: 'minimal', plan: 'hobbyist' }
    expect(applyPreview(row, null)).toBe(row)
    expect(applyPreview(row, { template: 'flip' })).toEqual({ template: 'flip', plan: 'hobbyist' })
  })
})
