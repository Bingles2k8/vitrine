import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getMuseumForUser } from '@/lib/get-museum'
import { r2, r2PublicUrl, PutObjectCommand } from '@/lib/r2'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { parseBody, presignSchema } from '@/lib/validations'

export async function POST(req: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(presignSchema, await req.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { bucket, path, contentType } = parsed.data

  const access = await getMuseumForUser(supabase)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!path.startsWith(`${access.museum.id}/`)) {
    return NextResponse.json({ error: 'Path must start with your museum id' }, { status: 403 })
  }

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: bucket, Key: path, ContentType: contentType }),
    { expiresIn: 300 }
  )

  return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(bucket, path) })
}
