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

export const csvImportRowSchema = z.object({
  title: z.string().max(500).optional(),
  artist: z.string().max(500).optional(),
  year: z.string().max(50).optional(),
  medium: z.string().max(500).optional(),
  dimensions: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  accession_no: z.string().max(100).optional(),
  acquisition_method: z.string().max(200).optional(),
  acquisition_date: z.string().max(50).optional(),
  acquisition_source: z.string().max(500).optional(),
  status: z.string().max(50).optional(),
})

const VALID_DOC_RELATED_TYPES = [
  'acquisition', 'loan', 'conservation_treatment', 'condition_assessment',
  'entry_record', 'exit_record', 'valuation', 'insurance', 'risk',
  'damage', 'emergency', 'reproduction', 'rights', 'general',
] as const

export const documentUploadSchema = z.object({
  related_to_type: z.string().min(1).max(100).refine(
    v => VALID_DOC_RELATED_TYPES.includes(v as any) || /^[a-z_]+$/.test(v),
    'Invalid related_to_type'
  ),
  related_to_id: z.string().uuid().nullable().optional(),
  label: z.string().min(1).max(500),
  document_type: z.string().max(100).nullable().optional(),
  file_url: z.string().url().max(2000),
  file_name: z.string().min(1).max(500),
  file_size: z.number().int().positive().nullable().optional(),
  mime_type: z.string().max(200).nullable().optional(),
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
