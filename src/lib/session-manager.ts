/**
 * RHY Supplier Portal - Session Management System
 * Enterprise-grade session handling with JWT, MFA, and security protocols
 * Supports multi-warehouse operations across US, Japan, EU, Australia
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { 
  generateAccessToken, 
  generateRefreshToken, 
  generateSessionToken,
  verifyAccessToken, 
  verifyRefreshToken, 
  verifySessionToken,
  blacklistToken,
  getTokenFingerprint,
  validateTokenSecurity
} from '@/lib/jwt'
import { RHYSupplierAuthService } from '@/services/rhy/auth/supplier-auth-service'
import { 
  SupplierAuthData, 
  SessionData, 
  AuthState, 
  SecurityContext,
  RateLimitInfo 
} from '@/types/auth'

// Session configuration constants
const SESSION_COOKIE_NAME = 'rhy_session'
const REFRESH_COOKIE_NAME = 'rhy_refresh'
const ACCESS_TOKEN_HEADER = 'authorization'
const SESSION_TIMEOUT_MS = 28800000 // 8 hours
const IDLE_TIMEOUT_MS = 3600000 // 1 hour
const MAX_CONCURRENT_SESSIONS = 5
const RATE_LIMIT_WINDOW_MS = 900000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100

// Enhanced session management class
export class SessionManager {
  private authService: RHYSupplierAuthService
  private activeSessions: Map<string, SessionData> = new Map()
  private rateLimitCache: Map<string, number[]> = new Map()
  private tokenBlacklist: Set<string> = new Set()

  constructor() {
    this.authService = new RHYSupplierAuthService()
    this.startCleanupWorker()
  }

  /**
   * Create new session with comprehensive security
   */
  async createSession(
    supplier: SupplierAuthData,
    context: SecurityContext,
    rememberMe: boolean = false
  ): Promise<{
    sessionId: string
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    try {
      // Rate limiting check
      const isRateLimited = await this.checkRateLimit(
        context.ipAddress || 'unknown',
        'session_creation'
      )
      
      if (isRateLimited) {
        throw new Error('RATE_LIMITED')
      }

      // Clean up old sessions if limit exceeded
      await this.enforceSessionLimits(supplier.id)

      // Generate secure tokens
      const accessToken = generateAccessToken(supplier)
      const refreshToken = generateRefreshToken(supplier.id)
      const sessionId = this.generateSessionId()

      // Create session in database
      const sessionResult = await this.authService.createSession({
        supplierId: supplier.id,
        warehouseLocation: context.warehouse,
        clientIP: context.ipAddress || '',
        userAgent: context.userAgent || '',
        rememberMe
      })

      // Calculate expiration
      const expiresAt = new Date()
      expiresAt.setTime(
        expiresAt.getTime() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : SESSION_TIMEOUT_MS)
      )

      // Store session in memory cache
      const sessionData: SessionData = {
        id: sessionId,
        supplierId: supplier.id,
        token: accessToken,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        warehouse: context.warehouse,
        expiresAt,
        createdAt: new Date(),
        lastUsedAt: new Date()
      }

      this.activeSessions.set(sessionId, sessionData)

      // Update supplier last login
      await this.authService.updateLastLogin(supplier.id)

      // Record session creation audit
      await this.recordSessionAudit({
        supplierId: supplier.id,
        sessionId,
        action: 'SESSION_CREATED',
        context,
        metadata: {
          rememberMe,
          warehouse: context.warehouse,
          tokenFingerprint: getTokenFingerprint(accessToken)
        }
      })

      return {
        sessionId,
        accessToken,
        refreshToken,
        expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      }
    } catch (error) {
      console.error('Session creation failed:', error)
      throw error
    }
  }

  /**
   * Validate session with comprehensive checks
   */
  async validateSession(
    sessionId: string,
    accessToken?: string,
    context?: SecurityContext
  ): Promise<{
    valid: boolean
    supplier?: SupplierAuthData
    session?: SessionData
    needsRefresh?: boolean
    error?: string
  }> {
    try {
      // Check if session exists in memory
      const sessionData = this.activeSessions.get(sessionId)
      if (!sessionData) {
        return { valid: false, error: 'SESSION_NOT_FOUND' }
      }

      // Check session expiration
      if (sessionData.expiresAt < new Date()) {
        this.invalidateSession(sessionId)
        return { valid: false, error: 'SESSION_EXPIRED' }
      }

      // Check idle timeout
      const idleTime = Date.now() - sessionData.lastUsedAt.getTime()
      if (idleTime > IDLE_TIMEOUT_MS) {
        this.invalidateSession(sessionId)
        return { valid: false, error: 'SESSION_IDLE_TIMEOUT' }
      }

      // Verify access token if provided
      if (accessToken) {
        const tokenValidation = validateTokenSecurity(accessToken)
        if (!tokenValidation.valid || this.tokenBlacklist.has(accessToken)) {
          return { valid: false, error: 'INVALID_TOKEN' }
        }

        const tokenPayload = verifyAccessToken(accessToken)
        if (!tokenPayload || tokenPayload.sub !== sessionData.supplierId) {
          return { valid: false, error: 'TOKEN_MISMATCH' }
        }

        // Check if token needs refresh (within 5 minutes of expiry)
        const needsRefresh = tokenPayload.exp && 
          (tokenPayload.exp - Math.floor(Date.now() / 1000)) < 300
      }

      // Validate session in database
      const dbSession = await this.authService.validateSession(
        sessionData.id,
        sessionData.supplierId
      )

      if (!dbSession) {
        this.invalidateSession(sessionId)
        return { valid: false, error: 'SESSION_INVALID_DB' }
      }

      // Get supplier data
      const supplier = await this.authService.getSupplierById(sessionData.supplierId)
      if (!supplier || supplier.status !== 'ACTIVE') {
        this.invalidateSession(sessionId)
        return { valid: false, error: 'SUPPLIER_INACTIVE' }
      }

      // Security context validation
      if (context) {
        const securityCheck = await this.validateSecurityContext(sessionData, context)
        if (!securityCheck.valid) {
          this.invalidateSession(sessionId)
          return { valid: false, error: securityCheck.reason }
        }
      }

      // Update last used timestamp
      sessionData.lastUsedAt = new Date()
      this.activeSessions.set(sessionId, sessionData)
      await this.authService.updateSessionLastUsed(sessionData.id)

      return {
        valid: true,
        supplier: this.mapSupplierData(supplier),
        session: sessionData,
        needsRefresh: accessToken ? this.shouldRefreshToken(accessToken) : false
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      return { valid: false, error: 'VALIDATION_ERROR' }
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(
    refreshToken: string,
    context: SecurityContext
  ): Promise<{
    success: boolean
    accessToken?: string
    refreshToken?: string
    expiresIn?: number
    error?: string
  }> {
    try {
      // Rate limiting for refresh attempts
      const isRateLimited = await this.checkRateLimit(
        context.ipAddress || 'unknown',
        'token_refresh'
      )
      
      if (isRateLimited) {
        return { success: false, error: 'RATE_LIMITED' }
      }

      // Verify refresh token
      const refreshPayload = verifyRefreshToken(refreshToken)
      if (!refreshPayload) {
        return { success: false, error: 'INVALID_REFRESH_TOKEN' }
      }

      // Get supplier data
      const supplier = await this.authService.getSupplierById(refreshPayload.sub)
      if (!supplier || supplier.status !== 'ACTIVE') {
        return { success: false, error: 'SUPPLIER_INACTIVE' }
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(this.mapSupplierData(supplier))
      const newRefreshToken = generateRefreshToken(supplier.id)

      // Blacklist old refresh token
      this.tokenBlacklist.add(refreshToken)

      // Record refresh audit
      await this.recordSessionAudit({
        supplierId: supplier.id,
        sessionId: 'refresh',
        action: 'TOKEN_REFRESHED',
        context,
        metadata: {
          oldTokenFingerprint: getTokenFingerprint(refreshToken),
          newTokenFingerprint: getTokenFingerprint(newAccessToken)
        }
      })

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 // 15 minutes
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      return { success: false, error: 'REFRESH_ERROR' }
    }
  }

  /**
   * Invalidate session with cleanup
   */
  async invalidateSession(
    sessionId: string,
    reason: string = 'LOGOUT',
    context?: SecurityContext
  ): Promise<void> {
    try {
      const sessionData = this.activeSessions.get(sessionId)
      
      if (sessionData) {
        // Blacklist active token
        if (sessionData.token) {
          this.tokenBlacklist.add(sessionData.token)
        }

        // Remove from memory
        this.activeSessions.delete(sessionId)

        // Record logout audit
        await this.recordSessionAudit({
          supplierId: sessionData.supplierId,
          sessionId,
          action: 'SESSION_INVALIDATED',
          context,
          metadata: { reason }
        })
      }

      // Remove from database
      await this.authService.invalidateSession(sessionId)
    } catch (error) {
      console.error('Session invalidation failed:', error)
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(
    identifier: string,
    action: string
  ): Promise<boolean> {
    const key = `${identifier}:${action}`
    const now = Date.now()
    
    // Get existing attempts
    const attempts = this.rateLimitCache.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    )
    
    // Check if rate limited
    if (recentAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
      return true
    }

    // Add current attempt
    recentAttempts.push(now)
    this.rateLimitCache.set(key, recentAttempts)

    return false
  }

  /**
   * Enforce session limits per supplier
   */
  private async enforceSessionLimits(supplierId: string): Promise<void> {
    const supplierSessions = Array.from(this.activeSessions.values())
      .filter(session => session.supplierId === supplierId)
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())

    // Remove oldest sessions if limit exceeded
    if (supplierSessions.length >= MAX_CONCURRENT_SESSIONS) {
      const sessionsToRemove = supplierSessions.slice(MAX_CONCURRENT_SESSIONS - 1)
      
      for (const session of sessionsToRemove) {
        await this.invalidateSession(session.id, 'SESSION_LIMIT_EXCEEDED')
      }
    }
  }

  /**
   * Validate security context for suspicious activity
   */
  private async validateSecurityContext(
    session: SessionData,
    context: SecurityContext
  ): Promise<{ valid: boolean; reason?: string }> {
    // IP address change detection
    if (session.ipAddress && context.ipAddress && 
        session.ipAddress !== context.ipAddress) {
      // In production, this might trigger additional verification
      console.warn(`IP address change detected for session ${session.id}`)
    }

    // User agent change detection
    if (session.userAgent && context.userAgent && 
        session.userAgent !== context.userAgent) {
      console.warn(`User agent change detected for session ${session.id}`)
    }

    // Risk score evaluation (simplified)
    if (context.riskScore && context.riskScore > 80) {
      return { valid: false, reason: 'HIGH_RISK_SCORE' }
    }

    return { valid: true }
  }

  /**
   * Check if token should be refreshed
   */
  private shouldRefreshToken(accessToken: string): boolean {
    try {
      const payload = verifyAccessToken(accessToken)
      if (!payload || !payload.exp) return false

      const secondsUntilExpiry = payload.exp - Math.floor(Date.now() / 1000)
      return secondsUntilExpiry < 300 // Refresh if less than 5 minutes left
    } catch {
      return true
    }
  }

  /**
   * Map supplier data from database to auth format
   */
  private mapSupplierData(supplier: any): SupplierAuthData {
    return {
      id: supplier.id,
      email: supplier.email,
      companyName: supplier.companyName,
      contactName: supplier.contactName,
      phoneNumber: supplier.phoneNumber,
      status: supplier.status,
      tier: supplier.tier,
      warehouseAccess: supplier.warehouseAccess || [],
      mfaEnabled: supplier.mfaEnabled || false,
      lastLoginAt: supplier.lastLoginAt,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2)
    return `rhy_${timestamp}_${randomPart}`
  }

  /**
   * Record session audit events
   */
  private async recordSessionAudit(params: {
    supplierId: string
    sessionId: string
    action: string
    context?: SecurityContext
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      // In production, this would use a dedicated audit service
      console.log('Session audit:', {
        supplierId: params.supplierId,
        sessionId: params.sessionId,
        action: params.action,
        timestamp: new Date().toISOString(),
        ipAddress: params.context?.ipAddress,
        userAgent: params.context?.userAgent,
        warehouse: params.context?.warehouse,
        metadata: params.metadata
      })
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  /**
   * Cleanup worker for expired sessions and tokens
   */
  private startCleanupWorker(): void {
    setInterval(() => {
      this.cleanupExpiredSessions()
      this.cleanupBlacklistedTokens()
      this.cleanupRateLimitCache()
    }, 300000) // Every 5 minutes
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date()
    
    for (const [sessionId, session] of this.activeSessions) {
      if (session.expiresAt < now) {
        this.activeSessions.delete(sessionId)
      }
    }
  }

  /**
   * Clean up blacklisted tokens (remove old ones)
   */
  private cleanupBlacklistedTokens(): void {
    // In production, this would be more sophisticated
    // For now, clear the cache periodically to prevent memory issues
    if (this.tokenBlacklist.size > 10000) {
      this.tokenBlacklist.clear()
    }
  }

  /**
   * Clean up rate limit cache
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now()
    
    for (const [key, attempts] of this.rateLimitCache) {
      const recentAttempts = attempts.filter(
        timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
      )
      
      if (recentAttempts.length === 0) {
        this.rateLimitCache.delete(key)
      } else {
        this.rateLimitCache.set(key, recentAttempts)
      }
    }
  }

  /**
   * Get session statistics for monitoring
   */
  getSessionStats(): {
    activeSessions: number
    blacklistedTokens: number
    rateLimitEntries: number
  } {
    return {
      activeSessions: this.activeSessions.size,
      blacklistedTokens: this.tokenBlacklist.size,
      rateLimitEntries: this.rateLimitCache.size
    }
  }
}

// Singleton instance
let sessionManagerInstance: SessionManager | null = null

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager()
  }
  return sessionManagerInstance
}

// Helper functions for Next.js integration
export async function getServerSession(request: NextRequest): Promise<{
  valid: boolean
  supplier?: SupplierAuthData
  session?: SessionData
  error?: string
}> {
  const sessionManager = getSessionManager()
  
  // Extract session ID from cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  if (!sessionCookie) {
    return { valid: false, error: 'NO_SESSION_COOKIE' }
  }

  // Extract access token from header
  const authHeader = request.headers.get(ACCESS_TOKEN_HEADER)
  const accessToken = authHeader?.replace('Bearer ', '')

  // Create security context
  const context: SecurityContext = {
    ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: new Date()
  }

  return await sessionManager.validateSession(
    sessionCookie.value,
    accessToken,
    context
  )
}

export function setSessionCookies(
  response: NextResponse,
  sessionId: string,
  refreshToken: string,
  rememberMe: boolean = false
): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60 // 30 days or 8 hours
  
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/'
  })

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
    path: '/'
  })
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME)
  response.cookies.delete(REFRESH_COOKIE_NAME)
}