import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getMuseumForUser } from '@/lib/get-museum'
import { r2, r2PathFromUrl, DeleteObjectCommand } from '@/lib/r2'
import { parseBody, storageDeleteSchema } from '@/lib/validations'

export async function POST(req: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(storageDeleteSchema, await req.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { bucket, url } = parsed.data

  const access = await getMuseumForUser(supabase)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const key = r2PathFromUrl(bucket, url)
  if (!key.startsWith(`${access.museum.id}/`) || key.includes('..') || key.includes('\0')) {
    return NextResponse.json({ error: 'Path must belong to your museum' }, { status: 403 })
  }

  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))

  return NextResponse.json({ ok: true })
}
