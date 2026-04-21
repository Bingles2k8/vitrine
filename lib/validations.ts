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

export const STAFF_ACCESS_LEVELS = ['Admin', 'Editor', 'Viewer'] as const
export const STAFF_DEPARTMENTS = ['Curatorial', 'Conservation', 'Education', 'Operations', 'Finance', 'Marketing'] as const

export const createStaffMemberSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  role: z.string().min(1).max(200),
  department: z.enum(STAFF_DEPARTMENTS),
  access: z.enum(STAFF_ACCESS_LEVELS),
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

export const OBJECT_STATUSES = ['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration', 'Deaccessioned'] as const

export const objectCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).nullable().optional(),
  artist: z.string().max(500).nullable().optional(),
  maker_name: z.string().max(500).nullable().optional(),
  year: z.string().max(50).nullable().optional(),
  production_date: z.string().max(50).nullable().optional(),
  medium: z.string().max(500).nullable().optional(),
  physical_materials: z.string().max(500).nullable().optional(),
  dimensions: z.string().max(200).nullable().optional(),
  accession_no: z.string().max(100).nullable().optional(),
  object_type: z.string().max(100).nullable().optional(),
  condition_grade: z.string().max(100).nullable().optional(),
  status: z.enum(OBJECT_STATUSES).optional(),
  emoji: z.string().max(20).optional(),
  acquisition_method: z.string().max(200).nullable().optional(),
  acquisition_date: z.string().max(50).nullable().optional(),
  acquisition_source: z.string().max(500).nullable().optional(),
  acquisition_source_contact: z.string().max(500).nullable().optional(),
  acquisition_object_count: z.number().int().min(1).max(100000).nullable().optional(),
  acquisition_value: z.coerce.number().nullable().optional(),
  number_of_parts: z.number().int().min(1).max(100000).nullable().optional(),
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
  purchase_price: z.coerce.number().optional(),
  acquired_from: z.string().max(500).optional(),
  condition: z.string().max(100).optional(),
  purchase_date: z.string().max(50).optional(),
})

const VALID_DOC_RELATED_TYPES = [
  'acquisition', 'loan', 'conservation_treatment', 'condition_assessment',
  'entry_record', 'exit_record', 'valuation', 'insurance', 'risk',
  'damage', 'emergency', 'reproduction', 'rights', 'general', 'provenance',
] as const

export const trackViewSchema = z.object({
  museum_id: z.string().uuid(),
  object_id: z.string().uuid().nullable().optional(),
  page_type: z.enum(['home', 'object', 'events', 'visit', 'embed']),
})

export const STORAGE_BUCKETS = ['object-documents', 'object-images', 'museum-assets'] as const

export const presignSchema = z.object({
  bucket: z.enum(STORAGE_BUCKETS),
  path: z.string()
    .min(1)
    .max(500)
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//, 'Path must start with museum UUID prefix')
    .refine(p => !p.includes('..') && !p.startsWith('/') && !p.includes('\0'), 'Invalid path characters'),
  contentType: z.string().min(1).max(200).regex(/^[\w.+-]+\/[\w.+-]+$/, 'Invalid content type'),
})

export const storageDeleteSchema = z.object({
  bucket: z.enum(STORAGE_BUCKETS),
  url: z.string().url().max(2000),
})

export const wantedItemSchema = z.object({
  title: z.string().min(1).max(500),
  year: z.string().max(50).nullable().optional(),
  medium: z.string().max(500).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
})

export const objectComponentSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(5000).nullable().optional(),
  part_number_label: z.string().max(100).nullable().optional(),
})

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
