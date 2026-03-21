import { describe, it, expect } from 'vitest'
import { generateTicketCode } from '@/lib/ticket-utils'

describe('generateTicketCode', () => {
  it('produces a code with the VIT- prefix followed by 32 uppercase hex characters', () => {
    expect(generateTicketCode()).toMatch(/^VIT-[0-9A-F]{32}$/)
  })

  it('generates unique codes across many calls', () => {
    const codes = Array.from({ length: 200 }, generateTicketCode)
    expect(new Set(codes).size).toBe(200)
  })
})
