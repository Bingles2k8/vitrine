import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { r2, r2PublicUrl, PutObjectCommand } from '@/lib/r2'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ALLOWED_BUCKETS = ['object-documents', 'object-images', 'museum-assets']

export async function POST(req: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bucket, path, contentType } = await req.json()
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: bucket, Key: path, ContentType: contentType }),
    { expiresIn: 300 }
  )

  return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(bucket, path) })
}
