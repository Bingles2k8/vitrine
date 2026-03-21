import { describe, it, expect } from 'vitest'
import {
  checkSlugSchema,
  documentUploadSchema,
  ticketCheckoutSchema,
  stripeCheckoutSchema,
} from '@/lib/validations'

describe('checkSlugSchema', () => {
  it('accepts valid slugs', () => {
    expect(checkSlugSchema.safeParse({ slug: 'my-museum' }).success).toBe(true)
    expect(checkSlugSchema.safeParse({ slug: 'museum123' }).success).toBe(true)
  })

  it('rejects slugs with uppercase letters', () => {
    expect(checkSlugSchema.safeParse({ slug: 'MyMuseum' }).success).toBe(false)
  })

  it('rejects slugs with spaces or special characters', () => {
    expect(checkSlugSchema.safeParse({ slug: 'my museum' }).success).toBe(false)
    expect(checkSlugSchema.safeParse({ slug: 'my_museum' }).success).toBe(false)
  })

  it('rejects empty slugs', () => {
    expect(checkSlugSchema.safeParse({ slug: '' }).success).toBe(false)
  })

  it('rejects slugs over 60 characters', () => {
    expect(checkSlugSchema.safeParse({ slug: 'a'.repeat(61) }).success).toBe(false)
  })
})

describe('documentUploadSchema', () => {
  const validDoc = {
    related_to_type: 'acquisition',
    label: 'Deed of Gift',
    file_url: 'https://example.com/file.pdf',
    file_name: 'deed.pdf',
  }

  it('accepts a valid document upload', () => {
    expect(documentUploadSchema.safeParse(validDoc).success).toBe(true)
  })

  it('accepts optional fields as null or missing', () => {
    const result = documentUploadSchema.safeParse({
      ...validDoc,
      related_to_id: null,
      document_type: null,
      file_size: null,
      mime_type: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing label', () => {
    const { label: _, ...noLabel } = validDoc
    expect(documentUploadSchema.safeParse(noLabel).success).toBe(false)
  })

  it('rejects a non-URL file_url', () => {
    expect(documentUploadSchema.safeParse({ ...validDoc, file_url: 'not-a-url' }).success).toBe(false)
  })

  it('rejects a negative file_size', () => {
    expect(documentUploadSchema.safeParse({ ...validDoc, file_size: -1 }).success).toBe(false)
  })
})

describe('ticketCheckoutSchema', () => {
  const validTicket = {
    eventId: '550e8400-e29b-41d4-a716-446655440001',
    slotId: '550e8400-e29b-41d4-a716-446655440002',
    quantity: 2,
    buyerName: 'Jane Smith',
    buyerEmail: 'jane@example.com',
  }

  it('accepts a valid ticket checkout', () => {
    expect(ticketCheckoutSchema.safeParse(validTicket).success).toBe(true)
  })

  it('rejects quantity of 0', () => {
    expect(ticketCheckoutSchema.safeParse({ ...validTicket, quantity: 0 }).success).toBe(false)
  })

  it('rejects quantity over 10', () => {
    expect(ticketCheckoutSchema.safeParse({ ...validTicket, quantity: 11 }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(ticketCheckoutSchema.safeParse({ ...validTicket, buyerEmail: 'not-an-email' }).success).toBe(false)
  })

  it('rejects an invalid UUID for slotId', () => {
    expect(ticketCheckoutSchema.safeParse({ ...validTicket, slotId: 'not-a-uuid' }).success).toBe(false)
  })
})

describe('stripeCheckoutSchema', () => {
  it('accepts valid paid plan IDs', () => {
    expect(stripeCheckoutSchema.safeParse({ planId: 'hobbyist' }).success).toBe(true)
    expect(stripeCheckoutSchema.safeParse({ planId: 'professional' }).success).toBe(true)
    expect(stripeCheckoutSchema.safeParse({ planId: 'institution' }).success).toBe(true)
  })

  it('rejects community and enterprise (not purchasable via checkout)', () => {
    expect(stripeCheckoutSchema.safeParse({ planId: 'community' }).success).toBe(false)
    expect(stripeCheckoutSchema.safeParse({ planId: 'enterprise' }).success).toBe(false)
  })
})
