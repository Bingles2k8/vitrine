import { NextResponse } from 'next/server'
import { requireAuthedMuseum } from '@/lib/auth-guards'
import { r2, r2PublicUrl, PutObjectCommand } from '@/lib/r2'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import {
  ATTACHMENT_BUCKET,
  MAX_ATTACHMENT_BYTES,
  isAllowedAttachmentType,
} from '@/lib/messaging'

const schema = z.object({
  filename: z.string().min(1).max(300),
  contentType: z.string().min(1).max(200).refine(isAllowedAttachmentType, 'Unsupported file type'),
  sizeBytes: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES),
})

// POST /api/messages/attachment — presign an R2 upload for a message attachment.
// Resolves the caller's museum server-side so the public compose form only sends
// file metadata. Path is namespaced under the sender museum id.
export async function POST(request: Request) {
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return gate
  const { museum } = gate

  const parsed = parseBody(schema, await request.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { filename, contentType, sizeBytes } = parsed.data

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  const stamp = Date.now()
  const path = `${museum.id}/messages/${stamp}-${safeName}`

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: ATTACHMENT_BUCKET, Key: path, ContentType: contentType }),
    { expiresIn: 300 }
  )

  return NextResponse.json({
    uploadUrl,
    publicUrl: r2PublicUrl(ATTACHMENT_BUCKET, path),
    filename: safeName,
    sizeBytes,
    mimeType: contentType,
  })
}
