import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authz = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authz !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const redis = Redis.fromEnv()
    await redis.set('keepalive:last', new Date().toISOString(), { ex: 60 * 60 * 24 * 30 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[upstash-keepalive] failed:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
