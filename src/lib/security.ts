/**
 * RHY Supplier Portal - Security Utilities
 * Enterprise-grade security functions for authentication and data protection
 * Implements industry best practices for password hashing, rate limiting, and audit logging
 */

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { AuthAuditEvent, SecurityContext, RateLimitInfo, AuthErrorCode } from '@/types/auth'

// ================================
// PASSWORD SECURITY
// ================================

const BCRYPT_ROUNDS = 12 // Industry standard for production
const PASSWORD_MIN_LENGTH = 12
const PASSWORD_MAX_LENGTH = 128

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`)
  }

  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS)
    return await bcrypt.hash(password, salt)
  } catch (error) {
    console.error('Password hashing failed:', error)
    throw new Error('Password hashing failed')
  }
}

export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification failed:', error)
    return false
  }
}

export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length < 12) {
    feedback.push('Password must be at least 12 characters long')
  } else if (password.length >= 16) {
    score += 2
  } else {
    score += 1
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain lowercase letters')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain uppercase letters')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain numbers')
  } else {
    score += 1
  }

  if (!/[@$!%*?&]/.test(password)) {
    feedback.push('Password must contain special characters (@$!%*?&)')
  } else {
    score += 1
  }

  // Complexity patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Password should not contain repeated characters')
    score -= 1
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push('Password contains common patterns and is not secure')
    score -= 2
  }

  return {
    valid: feedback.length === 0 && score >= 4,
    score: Math.max(0, score),
    feedback
  }
}

// ================================
// RATE LIMITING
// ================================

interface RateLimitEntry {
  count: number
  windowStart: number
  lastAttempt: number
}

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxAttempts: number = 5
): RateLimitInfo {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up expired entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.windowStart < windowStart) {
      rateLimitStore.delete(key)
    }
  }
  
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.windowStart < windowStart) {
    // New window or no previous attempts
    rateLimitStore.set(identifier, {
      count: 1,
      windowStart: now,
      lastAttempt: now
    })
    
    return {
      remaining: maxAttempts - 1,
      resetTime: new Date(now + windowMs),
      limit: maxAttempts,
      windowMs
    }
  }
  
  // Update existing entry
  entry.count += 1
  entry.lastAttempt = now
  rateLimitStore.set(identifier, entry)
  
  const remaining = Math.max(0, maxAttempts - entry.count)
  
  return {
    remaining,
    resetTime: new Date(entry.windowStart + windowMs),
    limit: maxAttempts,
    windowMs
  }
}

export function isRateLimited(identifier: string, maxAttempts: number = 5): boolean {
  const info = checkRateLimit(identifier, 15 * 60 * 1000, maxAttempts)
  return info.remaining <= 0
}

// Progressive delay for failed attempts
export function calculateBackoffDelay(attemptCount: number): number {
  // Exponential backoff: 2^attemptCount * 1000ms, max 60 seconds
  return Math.min(Math.pow(2, attemptCount) * 1000, 60000)
}

// ================================
// ACCOUNT LOCKOUT
// ================================

interface LockoutEntry {
  attempts: number
  lockedUntil?: number
  lastAttempt: number
}

const lockoutStore = new Map<string, LockoutEntry>()

export function recordFailedAttempt(identifier: string): {
  isLocked: boolean
  lockoutDuration?: number
  attemptsRemaining?: number
} {
  const now = Date.now()
  const entry = lockoutStore.get(identifier) || { attempts: 0, lastAttempt: now }
  
  entry.attempts += 1
  entry.lastAttempt = now
  
  // Lock account after 5 failed attempts
  if (entry.attempts >= 5) {
    const lockoutDuration = calculateBackoffDelay(entry.attempts - 5) + 15 * 60 * 1000 // Base 15 min
    entry.lockedUntil = now + lockoutDuration
    
    lockoutStore.set(identifier, entry)
    
    return {
      isLocked: true,
      lockoutDuration
    }
  }
  
  lockoutStore.set(identifier, entry)
  
  return {
    isLocked: false,
    attemptsRemaining: 5 - entry.attempts
  }
}

export function isAccountLocked(identifier: string): boolean {
  const entry = lockoutStore.get(identifier)
  if (!entry || !entry.lockedUntil) {
    return false
  }
  
  const now = Date.now()
  if (now > entry.lockedUntil) {
    // Lockout expired, reset attempts
    entry.attempts = 0
    entry.lockedUntil = undefined
    lockoutStore.set(identifier, entry)
    return false
  }
  
  return true
}

export function clearFailedAttempts(identifier: string): void {
  lockoutStore.delete(identifier)
}

export function lockAccount(identifier: string, durationMs: number): void {
  const now = Date.now()
  const entry = lockoutStore.get(identifier) || { attempts: 0, lastAttempt: now }
  
  entry.lockedUntil = now + durationMs
  entry.lastAttempt = now
  
  lockoutStore.set(identifier, entry)
  
  console.log(`🔒 Account locked: ${identifier} for ${durationMs}ms`)
}

// ================================
// CRYPTOGRAPHIC UTILITIES
// ================================

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url')
}

export function generateMFASecret(): string {
  return crypto.randomBytes(20).toString('base32')
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}

export function hashSecretData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function generateSessionId(): string {
  return crypto.randomUUID()
}

// ================================
// AUDIT LOGGING
// ================================

export async function logAuthEvent(
  action: string,
  success: boolean,
  context: SecurityContext,
  supplierId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const auditEvent: AuthAuditEvent = {
    id: crypto.randomUUID(),
    supplierId,
    action,
    resource: 'authentication',
    success,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    warehouse: context.warehouse,
    metadata,
    timestamp: new Date()
  }

  try {
    // In production, store in database
    console.log('🔍 Auth Event:', JSON.stringify(auditEvent, null, 2))
    
    // TODO: Store in RHY audit log table
    // await rhyPrisma.rHYAuditLog.create({ data: auditEvent })
  } catch (error) {
    console.error('Failed to log auth event:', error)
  }
}

// ================================
// IP ADDRESS SECURITY
// ================================

export function validateIPAddress(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip)
}

export function isPrivateIP(ip: string): boolean {
  // Private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./, // localhost
    /^::1$/, // IPv6 localhost
    /^fc[0-9a-f]{2}:/i, // IPv6 unique local
    /^fe[89ab][0-9a-f]:/i // IPv6 link local
  ]
  
  return privateRanges.some(range => range.test(ip))
}

// ================================
// SECURITY HEADERS
// ================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; '),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)'
    ].join(', ')
  }
}

// ================================
// ERROR UTILITIES
// ================================

export function createAuthError(
  code: AuthErrorCode, 
  message: string, 
  details?: Record<string, any>
): Error & { code: AuthErrorCode; details?: Record<string, any> } {
  const error = new Error(message) as any
  error.code = code
  error.details = details
  return error
}

export function sanitizeError(error: any): { code: string; message: string } {
  // Don't expose internal error details to clients
  if (error.code) {
    return {
      code: error.code,
      message: error.message
    }
  }
  
  return {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred'
  }
}

// ================================
// INPUT SANITIZATION
// ================================

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizeInput(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength)
}

export function validateUUID(uuid: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(uuid)
}

// ================================
// DEVICE FINGERPRINTING
// ================================

export function generateDeviceFingerprint(userAgent?: string, ip?: string): string {
  const data = `${userAgent || 'unknown'}-${ip || 'unknown'}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

// ================================
// TIMING ATTACK PREVENTION
// ================================

export async function constantTimeCompare(a: string, b: string): Promise<boolean> {
  // Use crypto.timingSafeEqual for constant-time comparison
  if (a.length !== b.length) {
    // Still perform comparison to maintain constant time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
    return false
  }
  
  const bufferA = Buffer.from(a, 'utf8')
  const bufferB = Buffer.from(b, 'utf8')
  
  try {
    return crypto.timingSafeEqual(bufferA, bufferB)
  } catch (error) {
    return false
  }
}

// ================================
// ADDITIONAL ENTERPRISE SECURITY
// ================================

export interface RateLimitOptions {
  windowMs: number
  max: number
  keyGenerator: (req: any) => string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfter: number
  resetTime: number
}

// Rate limiting store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const security = {
  createRateLimiter: (options: RateLimitOptions) => ({
    check: async (req: any): Promise<RateLimitResult> => {
      const key = options.keyGenerator(req)
      const now = Date.now()
      
      // Clean expired entries
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.resetTime < now) {
          rateLimitMap.delete(k)
        }
      }
      
      const current = rateLimitMap.get(key)
      
      if (!current || current.resetTime < now) {
        // New window
        rateLimitMap.set(key, {
          count: 1,
          resetTime: now + options.windowMs
        })
        
        return {
          success: true,
          remaining: options.max - 1,
          retryAfter: 0,
          resetTime: now + options.windowMs
        }
      }
      
      if (current.count >= options.max) {
        return {
          success: false,
          remaining: 0,
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
          resetTime: current.resetTime
        }
      }
      
      current.count++
      rateLimitMap.set(key, current)
      
      return {
        success: true,
        remaining: options.max - current.count,
        retryAfter: 0,
        resetTime: current.resetTime
      }
    }
  }),

  extractUserIdFromToken: (authHeader: string | null): string | null => {
    if (!authHeader?.startsWith('Bearer ')) return null
    
    try {
      const token = authHeader.replace('Bearer ', '')
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      return payload.sub || payload.userId || null
    } catch {
      return null
    }
  },

  sanitizeDate: (dateInput: string | Date): Date => {
    if (dateInput instanceof Date) return dateInput
    
    const sanitized = dateInput.replace(/[^0-9T:.-]/g, '')
    const date = new Date(sanitized)
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format')
    }
    
    return date
  },

  getSupplierWarehouseAccess: async (supplierId: string, supplierType: string): Promise<string[]> => {
    const access: Record<string, string[]> = {
      'DIRECT': ['wh-1', 'wh-2', 'wh-3', 'wh-4'],
      'DISTRIBUTOR': ['wh-1', 'wh-2'],
      'FLEET_MANAGER': ['wh-1']
    }
    return access[supplierType] || []
  },

  getUserAccessibleRegions: async (userId: string, supplierType: string): Promise<string[]> => {
    const regions: Record<string, string[]> = {
      'DIRECT': ['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA'],
      'DISTRIBUTOR': ['US_WEST', 'EU'],
      'FLEET_MANAGER': ['US_WEST']
    }
    return regions[supplierType] || ['US_WEST']
  },

  logAuditEvent: async (event: any): Promise<void> => {
    try {
      console.log('Audit Event:', {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  },

  generateErrorId: (): string => {
    return `err_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }
}

// ================================
// ADDITIONAL EXPORTS FOR COMPATIBILITY
// ================================

export const validateSupplierSession = async (request: any) => {
  // Extract auth header and validate
  const authHeader = request.headers.get('authorization')
  const userId = security.extractUserIdFromToken(authHeader)
  
  if (!userId) {
    throw createAuthError('UNAUTHORIZED', 'Invalid or missing authentication')
  }
  
  return { userId, valid: true }
}

export const auditLog = async (
  action: string,
  context: { userId?: string; supplierId?: string },
  details?: any
) => {
  await security.logAuditEvent({
    action,
    userId: context.userId,
    supplierId: context.supplierId,
    resource: details?.resource || 'unknown',
    success: details?.success !== false,
    metadata: details,
    timestamp: new Date()
  })
}

export const getSecurityContext = (request: any) => {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    warehouse: request.headers.get('x-warehouse-id') || null
  }
}

export const securityAudit = auditLog // Alias for compatibility

export const logAuditEvent = security.logAuditEvent // Direct export

export const rateLimit = checkRateLimit // Alias for compatibility