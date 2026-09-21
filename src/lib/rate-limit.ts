// Upstash Redis-based rate limiter
// Uses the REST API to avoid needing the @upstash/ratelimit package

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.warn('Upstash Redis credentials not found. Rate limiting will be disabled.')
}

async function redisCommand(command: string, ...args: (string | number)[]): Promise<any> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('Upstash Redis not configured')
  }

  const response = await fetch(`${UPSTASH_URL}/${command.toLowerCase()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.statusText}`)
  }

  return response.json()
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60000 // 1 minute in milliseconds
): Promise<RateLimitResult> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    // Fallback: allow all requests if Upstash is not configured
    return {
      success: true,
      remaining: limit,
      resetTime: Date.now() + window,
    }
  }

  try {
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    const windowStart = now - window

    // Clean up old entries first
    await redisCommand('ZREMRANGEBYSCORE', key, 0, windowStart)

    // Count current requests in window
    const countResult = await redisCommand('ZCARD', key)
    const currentCount = countResult.result || 0

    if (currentCount >= limit) {
      // Get the oldest entry to calculate reset time
      const oldestResult = await redisCommand('ZRANGE', key, 0, 0, 'WITHSCORES')
      const resetTime = oldestResult.result?.[1] ? Number(oldestResult.result[1]) + window : now + window

      return {
        success: false,
        remaining: 0,
        resetTime,
      }
    }

    // Add current request
    await redisCommand('ZADD', key, now, `${now}-${Math.random()}`)

    // Set expiration
    await redisCommand('EXPIRE', key, Math.ceil(window / 1000))

    return {
      success: true,
      remaining: limit - currentCount - 1,
      resetTime: now + window,
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open: allow request if rate limiting fails
    return {
      success: true,
      remaining: limit,
      resetTime: Date.now() + window,
    }
  }
}

// Helper to get user identifier from request
export function getRateLimitIdentifier(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'
  return ip
}
