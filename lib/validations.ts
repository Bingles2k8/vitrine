import { NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

// --- Schemas ---

export const checkSlugSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
})

export const inviteStaffSchema = z.object({
  staffId: z.string().uuid(),
  email: z.string().email().max(320),
})

export const stripeCheckoutSchema = z.object({
  planId: z.enum(['hobbyist', 'professional', 'institution']),
})

export const ticketCheckoutSchema = z.object({
  eventId: z.string().uuid(),
  slotId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  buyerName: z.string().min(1).max(200),
  buyerEmail: z.string().email().max(320),
})

// --- Helper ---

export function parseBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: result.data }
}
