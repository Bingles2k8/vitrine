import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// In-memory fallback used when Redis/Upstash is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryRateCheck(identifier: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memoryStore.get(identifier)
  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

const redis = Redis.fromEnv()

// 5 requests per 60 seconds — for sensitive operations (delete account)
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'rl:auth',
})

// 20 requests per 60 seconds — for standard API operations
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'rl:api',
})

// 30 requests per 60 seconds — for public endpoints
export const publicLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'rl:public',
})

export async function rateLimit(
  limiter: Ratelimit,
  identifier: string,
  fallbackMax = 10,
  fallbackWindowMs = 60_000
): Promise<NextResponse | null> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  } catch (e) {
    // Redis unavailable — fall back to in-memory rate limiting so protection is maintained
    console.error('[rate-limit] Redis unavailable — using in-memory fallback:', e)
    if (!memoryRateCheck(identifier, fallbackMax, fallbackWindowMs)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }
  return null
}
