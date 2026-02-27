import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug || slug.length > 60 || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false })
  }

  const supabase = await createServerSideClient()

  const { data } = await supabase
    .from('museums')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
