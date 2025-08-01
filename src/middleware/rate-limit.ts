/**
 * RHY Supplier Portal - Advanced Rate Limiting Middleware
 * Enterprise-grade rate limiting with Redis backend, adaptive throttling, and multi-warehouse support
 * Implements sliding window, token bucket, and hierarchical rate limiting strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimitErrorResponse, logAPIEvent } from '@/lib/api-response'
import { redisClient } from '@/lib/redis'

// Rate limiting strategy types
export type RateLimitStrategy = 'sliding_window' | 'token_bucket' | 'fixed_window' | 'adaptive'

// Rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number          // Time window in milliseconds
  maxRequests: number       // Maximum requests per window
  strategy: RateLimitStrategy
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: NextRequest) => string
  onLimitReached?: (request: NextRequest, rateLimitInfo: RateLimitInfo) => void
  customRules?: RateLimitRule[]
}

// Individual rate limit rule
export interface RateLimitRule {
  path: string | RegExp
  method?: string
  windowMs: number
  maxRequests: number
  priority: number
}

// Rate limit information
export interface RateLimitInfo {
  totalHits: number
  totalHitsInWindow: number
  remaining: number
  resetTime: Date
  isBlocked: boolean
  retryAfter?: number
}

// Supplier tier rate limits
const SUPPLIER_TIER_LIMITS: Record<string, RateLimitConfig> = {
  DIRECT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
    strategy: 'sliding_window'
  },
  DISTRIBUTOR: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 300,
    strategy: 'sliding_window'
  },
  RETAILER: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 200,
    strategy: 'sliding_window'
  },
  FLEET_MANAGER: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 400,
    strategy: 'sliding_window'
  },
  SERVICE_PARTNER: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 250,
    strategy: 'sliding_window'
  }
}

// Endpoint-specific rate limits
const ENDPOINT_SPECIFIC_LIMITS: RateLimitRule[] = [
  // Authentication endpoints - stricter limits
  {
    path: /^\/api\/auth\/(login|register)/,
    method: 'POST',
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // Only 5 login attempts per 15 minutes
    priority: 10
  },
  {
    path: /^\/api\/auth\/password-reset/,
    method: 'POST',
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,           // Only 3 password reset attempts per hour
    priority: 10
  },
  
  // High-computation endpoints
  {
    path: /^\/api\/analytics/,
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 analytics requests per minute
    priority: 8
  },
  {
    path: /^\/api\/reports/,
    windowMs: 60 * 1000,
    maxRequests: 5,           // 5 report generations per minute
    priority: 8
  },
  
  // Order processing
  {
    path: /^\/api\/orders/,
    method: 'POST',
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 20,          // 20 order submissions per minute
    priority: 7
  },
  
  // Inventory operations
  {
    path: /^\/api\/inventory/,
    windowMs: 60 * 1000,
    maxRequests: 100,         // 100 inventory requests per minute
    priority: 6
  },
  
  // General API endpoints
  {
    path: /^\/api\/products/,
    windowMs: 60 * 1000,
    maxRequests: 200,         // 200 product requests per minute
    priority: 5
  },
  
  // Health checks and monitoring - very liberal
  {
    path: /^\/api\/(health|status)/,
    windowMs: 60 * 1000,
    maxRequests: 1000,        // 1000 health checks per minute
    priority: 1
  }
]

// KV/Redis connection management
class RedisRateLimitStore {
  private fallbackStore: Map<string, any> = new Map()
  private useKV = !!process.env.KV_REST_API_URL

  constructor() {
    console.log(this.useKV ? '✅ Using Vercel KV for rate limiting' : '⚠️ Using in-memory rate limit store')
  }

  async get(key: string): Promise<any> {
    try {
      if (this.useKV) {
        const value = await redisClient.get(key)
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : null
      }
    } catch (error) {
      console.warn('KV get error:', error)
    }
    
    // Fallback to memory store
    return this.fallbackStore.get(key) || null
  }

  async set(key: string, value: any, ttlMs: number): Promise<void> {
    try {
      if (this.useKV) {
        await redisClient.set(key, JSON.stringify(value), 'EX', Math.ceil(ttlMs / 1000))
        return
      }
    } catch (error) {
      console.warn('KV set error:', error)
    }
    
    // Fallback to memory store
    this.fallbackStore.set(key, value)
    setTimeout(() => {
      this.fallbackStore.delete(key)
    }, ttlMs)
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    try {
      if (this.useKV) {
        const result = await redisClient.incr(key)
        await redisClient.expire(key, Math.ceil(ttlMs / 1000))
        return result
      }
    } catch (error) {
      console.warn('KV increment error:', error)
    }
    
    // Fallback to memory store
    const current = this.fallbackStore.get(key) || 0
    const newValue = current + 1
    this.fallbackStore.set(key, newValue)
    setTimeout(() => {
      this.fallbackStore.delete(key)
    }, ttlMs)
    return newValue
  }

  async zadd(key: string, score: number, member: string, ttlMs: number): Promise<void> {
    try {
      if (this.useKV) {
        await redisClient.zadd(key, score, member)
        await redisClient.expire(key, Math.ceil(ttlMs / 1000))
        return
      }
    } catch (error) {
      console.warn('KV zadd error:', error)
    }
    
    // Fallback: simulate with memory store
    const existing = this.fallbackStore.get(key) || []
    existing.push({ score, member })
    this.fallbackStore.set(key, existing)
    setTimeout(() => {
      this.fallbackStore.delete(key)
    }, ttlMs)
  }

  async zcard(key: string): Promise<number> {
    try {
      if (this.useKV) {
        const members = await redisClient.zrange(key, 0, -1)
        return members.length
      }
    } catch (error) {
      console.warn('KV zcard error:', error)
    }
    
    // Fallback
    const existing = this.fallbackStore.get(key) || []
    return existing.length
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<void> {
    try {
      if (this.useKV) {
        // KV doesn't support zremrangebyscore, so we need to workaround
        const members = await redisClient.zrange(key, 0, -1)
        // For now, just log a warning
        console.warn('zremrangebyscore not fully supported in KV')
        return
      }
    } catch (error) {
      console.warn('KV zremrangebyscore error:', error)
    }
    
    // Fallback
    const existing = this.fallbackStore.get(key) || []
    const filtered = existing.filter((item: any) => item.score < min || item.score > max)
    this.fallbackStore.set(key, filtered)
  }
}

// Initialize Redis store
const rateLimitStore = new RedisRateLimitStore()

// Generate rate limit key
function generateRateLimitKey(
  request: NextRequest,
  config: RateLimitConfig,
  context: {
    supplierId?: string
    warehouse?: string
    endpoint?: string
  }
): string {
  if (config.keyGenerator) {
    return config.keyGenerator(request)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const components = [
    'ratelimit',
    context.warehouse || 'default',
    context.endpoint || request.nextUrl.pathname,
    context.supplierId || ip
  ]

  return components.join(':')
}

// Sliding window rate limiting implementation
async function slidingWindowRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitInfo> {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean old entries
  await rateLimitStore.zremrangebyscore(key, 0, windowStart)
  
  // Add current request
  await rateLimitStore.zadd(key, now, `${now}-${Math.random()}`, windowMs)
  
  // Count current requests in window
  const totalHitsInWindow = await rateLimitStore.zcard(key)
  
  const remaining = Math.max(0, maxRequests - totalHitsInWindow)
  const resetTime = new Date(now + windowMs)
  
  return {
    totalHits: totalHitsInWindow,
    totalHitsInWindow,
    remaining,
    resetTime,
    isBlocked: totalHitsInWindow > maxRequests,
    retryAfter: totalHitsInWindow > maxRequests ? Math.ceil(windowMs / 1000) : undefined
  }
}

// Token bucket rate limiting implementation
async function tokenBucketRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitInfo> {
  const now = Date.now()
  const bucketKey = `${key}:bucket`
  
  const bucket = await rateLimitStore.get(bucketKey) || {
    tokens: maxRequests,
    lastRefill: now
  }
  
  // Calculate tokens to add based on time elapsed
  const timePassed = now - bucket.lastRefill
  const tokensToAdd = Math.floor((timePassed / windowMs) * maxRequests)
  
  bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now
  
  const canProceed = bucket.tokens > 0
  if (canProceed) {
    bucket.tokens -= 1
  }
  
  await rateLimitStore.set(bucketKey, bucket, windowMs)
  
  const resetTime = new Date(now + windowMs)
  
  return {
    totalHits: maxRequests - bucket.tokens,
    totalHitsInWindow: maxRequests - bucket.tokens,
    remaining: bucket.tokens,
    resetTime,
    isBlocked: !canProceed,
    retryAfter: !canProceed ? Math.ceil(windowMs / 1000) : undefined
  }
}

// Fixed window rate limiting implementation
async function fixedWindowRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitInfo> {
  const now = Date.now()
  const windowKey = `${key}:${Math.floor(now / windowMs)}`
  
  const currentCount = await rateLimitStore.increment(windowKey, windowMs)
  
  const remaining = Math.max(0, maxRequests - currentCount)
  const resetTime = new Date(Math.ceil(now / windowMs) * windowMs)
  
  return {
    totalHits: currentCount,
    totalHitsInWindow: currentCount,
    remaining,
    resetTime,
    isBlocked: currentCount > maxRequests,
    retryAfter: currentCount > maxRequests ? Math.ceil((resetTime.getTime() - now) / 1000) : undefined
  }
}

// Adaptive rate limiting based on system load
async function adaptiveRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitInfo> {
  // Get system metrics (simplified - in production, integrate with monitoring)
  const systemLoad = await getSystemLoad()
  
  // Adjust limits based on system load
  const adjustedMaxRequests = Math.floor(maxRequests * (1 - systemLoad * 0.5))
  
  return slidingWindowRateLimit(key, windowMs, adjustedMaxRequests)
}

// Get system load (simplified implementation)
async function getSystemLoad(): Promise<number> {
  try {
    // In production, this would check CPU, memory, database connections, etc.
    // For now, return a simulated load between 0 and 1
    return Math.random() * 0.3 // Simulate low to moderate load
  } catch (error) {
    return 0.1 // Default to low load if metrics unavailable
  }
}

// Find applicable rate limit rule for request
function findApplicableRule(
  request: NextRequest,
  customRules: RateLimitRule[] = []
): RateLimitRule | null {
  const path = request.nextUrl.pathname
  const method = request.method
  
  const allRules = [...customRules, ...ENDPOINT_SPECIFIC_LIMITS]
    .sort((a, b) => b.priority - a.priority) // Higher priority first
  
  for (const rule of allRules) {
    let pathMatches = false
    
    if (typeof rule.path === 'string') {
      pathMatches = path === rule.path
    } else {
      pathMatches = rule.path.test(path)
    }
    
    const methodMatches = !rule.method || rule.method === method
    
    if (pathMatches && methodMatches) {
      return rule
    }
  }
  
  return null
}

// Main rate limiting function
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  context: {
    supplierId?: string
    supplierTier?: string
    warehouse?: string
    endpoint?: string
  } = {}
): Promise<{
  success: boolean
  response?: NextResponse
  rateLimitInfo?: RateLimitInfo
}> {
  try {
    // Check for applicable specific rules first
    const specificRule = findApplicableRule(request, config.customRules)
    let effectiveConfig = config
    
    if (specificRule) {
      effectiveConfig = {
        ...config,
        windowMs: specificRule.windowMs,
        maxRequests: specificRule.maxRequests
      }
    }
    
    // Apply supplier tier adjustments
    if (context.supplierTier && SUPPLIER_TIER_LIMITS[context.supplierTier]) {
      const tierConfig = SUPPLIER_TIER_LIMITS[context.supplierTier]
      effectiveConfig = {
        ...effectiveConfig,
        maxRequests: Math.min(effectiveConfig.maxRequests, tierConfig.maxRequests)
      }
    }
    
    const key = generateRateLimitKey(request, effectiveConfig, context)
    
    let rateLimitInfo: RateLimitInfo
    
    // Apply rate limiting strategy
    switch (effectiveConfig.strategy) {
      case 'sliding_window':
        rateLimitInfo = await slidingWindowRateLimit(key, effectiveConfig.windowMs, effectiveConfig.maxRequests)
        break
      case 'token_bucket':
        rateLimitInfo = await tokenBucketRateLimit(key, effectiveConfig.windowMs, effectiveConfig.maxRequests)
        break
      case 'fixed_window':
        rateLimitInfo = await fixedWindowRateLimit(key, effectiveConfig.windowMs, effectiveConfig.maxRequests)
        break
      case 'adaptive':
        rateLimitInfo = await adaptiveRateLimit(key, effectiveConfig.windowMs, effectiveConfig.maxRequests)
        break
      default:
        rateLimitInfo = await slidingWindowRateLimit(key, effectiveConfig.windowMs, effectiveConfig.maxRequests)
    }
    
    // Log rate limit events
    await logAPIEvent(
      rateLimitInfo.isBlocked ? 'RATE_LIMIT_EXCEEDED' : 'RATE_LIMIT_CHECK',
      !rateLimitInfo.isBlocked,
      {
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        warehouse: context.warehouse,
        supplierId: context.supplierId,
        endpoint: context.endpoint || request.nextUrl.pathname,
        method: request.method
      },
      {
        strategy: effectiveConfig.strategy,
        windowMs: effectiveConfig.windowMs,
        maxRequests: effectiveConfig.maxRequests,
        remaining: rateLimitInfo.remaining,
        totalHits: rateLimitInfo.totalHits,
        supplierTier: context.supplierTier,
        ruleApplied: specificRule ? 'specific' : 'default'
      }
    )
    
    // Handle rate limit exceeded
    if (rateLimitInfo.isBlocked) {
      // Call optional callback
      if (effectiveConfig.onLimitReached) {
        effectiveConfig.onLimitReached(request, rateLimitInfo)
      }
      
      return {
        success: false,
        response: createRateLimitErrorResponse(
          rateLimitInfo.remaining,
          rateLimitInfo.resetTime,
          effectiveConfig.maxRequests,
          {
            warehouse: context.warehouse,
            context: {
              ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown',
              warehouse: context.warehouse,
              supplierId: context.supplierId,
              endpoint: context.endpoint || request.nextUrl.pathname,
              method: request.method
            }
          }
        ),
        rateLimitInfo
      }
    }
    
    return {
      success: true,
      rateLimitInfo
    }
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    
    // Log error but don't block request on rate limiting failures
    await logAPIEvent('RATE_LIMIT_ERROR', false, {
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      warehouse: context.warehouse,
      supplierId: context.supplierId,
      endpoint: context.endpoint || request.nextUrl.pathname,
      method: request.method
    }, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    // Allow request to proceed on rate limiting system failure
    return { success: true }
  }
}

// Apply rate limit headers to response
export function applyRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo: RateLimitInfo,
  config: RateLimitConfig
): NextResponse {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime.getTime() / 1000).toString())
  response.headers.set('X-RateLimit-Window', config.windowMs.toString())
  
  if (rateLimitInfo.retryAfter) {
    response.headers.set('Retry-After', rateLimitInfo.retryAfter.toString())
  }
  
  return response
}

// Create default rate limit configurations
export const DEFAULT_RATE_LIMITS = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    strategy: 'sliding_window' as RateLimitStrategy
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    strategy: 'fixed_window' as RateLimitStrategy
  },
  
  // High-computation endpoints
  analytics: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    strategy: 'token_bucket' as RateLimitStrategy
  },
  
  // Real-time endpoints
  realtime: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    strategy: 'adaptive' as RateLimitStrategy
  }
}

// Export rate limiting utilities
export {
  SUPPLIER_TIER_LIMITS,
  ENDPOINT_SPECIFIC_LIMITS,
  rateLimitStore,
  generateRateLimitKey,
  findApplicableRule
}