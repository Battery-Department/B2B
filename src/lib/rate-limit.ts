/**
 * Rate Limiting Utilities - Production Ready
 * Implements rate limiting for API endpoints
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: Request) => string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

class RateLimiter {
  private requests = new Map<string, number[]>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(request: Request): Promise<RateLimitResult> {
    const key = this.config.keyGenerator ? 
      this.config.keyGenerator(request) : 
      this.getDefaultKey(request)

    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get or create request timestamps for this key
    let timestamps = this.requests.get(key) || []
    
    // Remove old requests outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart)
    
    // Update the map
    this.requests.set(key, timestamps)

    const resetTime = now + this.config.windowMs
    const remaining = Math.max(0, this.config.maxRequests - timestamps.length)

    if (timestamps.length >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime
      }
    }

    // Add current request
    timestamps.push(now)
    this.requests.set(key, timestamps)

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: remaining - 1,
      resetTime
    }
  }

  private getDefaultKey(request: Request): string {
    const url = new URL(request.url)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `${ip}:${url.pathname}`
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        timestamp => timestamp > now - this.config.windowMs
      )
      
      if (validTimestamps.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validTimestamps)
      }
    }
  }
}

// Default rate limiters
export const createRateLimiter = (config: RateLimitConfig) => new RateLimiter(config)

// Common rate limit configurations
export const rateLimitConfigs = {
  // General API endpoints
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Authentication endpoints
  auth: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Analytics endpoints (higher limit)
  analytics: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Strict limiting for sensitive operations
  strict: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
}

// Pre-configured rate limiters
export const apiRateLimiter = createRateLimiter(rateLimitConfigs.api)
export const authRateLimiter = createRateLimiter(rateLimitConfigs.auth)
export const analyticsRateLimiter = createRateLimiter(rateLimitConfigs.analytics)
export const strictRateLimiter = createRateLimiter(rateLimitConfigs.strict)

// Middleware helper for Next.js API routes
export async function withRateLimit(
  request: Request,
  rateLimiter: RateLimiter = apiRateLimiter
): Promise<{ success: boolean; response?: Response }> {
  const result = await rateLimiter.check(request)

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }

  return { success: true }
}

// Cleanup task - should be run periodically
export function startRateLimitCleanup(intervalMs: number = 60000): () => void {
  const cleanup = () => {
    apiRateLimiter.cleanup()
    authRateLimiter.cleanup()
    analyticsRateLimiter.cleanup()
    strictRateLimiter.cleanup()
  }

  const interval = setInterval(cleanup, intervalMs)
  
  return () => clearInterval(interval)
}

export type { RateLimitConfig, RateLimitResult }

// Export rateLimit function for compatibility
export const rateLimit = withRateLimit