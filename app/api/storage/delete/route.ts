import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { r2, r2PathFromUrl, DeleteObjectCommand } from '@/lib/r2'

const ALLOWED_BUCKETS = ['object-documents', 'object-images', 'museum-assets']

export async function POST(req: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bucket, url } = await req.json()
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const key = r2PathFromUrl(bucket, url)
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))

  return NextResponse.json({ ok: true })
}
