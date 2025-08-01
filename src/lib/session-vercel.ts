/**
 * RHY Supplier Portal - Session Management System (Vercel KV)
 * Enterprise-grade session management with Vercel KV caching and database persistence
 * Supports multi-warehouse operations and comprehensive session analytics
 */

import { kv } from '@vercel/kv'
import { rhyPrisma } from './rhy-database'
import { generateSessionId } from './security'
import { logAuthEvent } from './security'
import { SecurityContext } from '@/types/auth'
import { v4 as uuidv4 } from 'uuid'

// ================================
// TYPES & INTERFACES
// ================================

export interface SessionData {
  id: string
  supplierId: string
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  permissions: string[]
  tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
  deviceFingerprint?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  lastUsedAt: Date
  expiresAt: Date
  metadata?: Record<string, any>
}

export interface SessionManager {
  createSession(sessionId: string, data: Partial<SessionData>): Promise<void>
  getSession(sessionId: string): Promise<SessionData | null>
  updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void>
  deleteSession(sessionId: string): Promise<void>
  deleteSessions(supplierId: string): Promise<void>
  refreshSession(sessionId: string): Promise<SessionData | null>
  getActiveSessions(supplierId: string): Promise<SessionData[]>
  cleanup(): Promise<void>
  getSessionStats(): Promise<SessionStats>
}

export interface SessionStats {
  totalSessions: number
  activeSessions: number
  sessionsToday: number
  avgSessionDuration: number
  sessionsByWarehouse: Record<string, number>
  sessionsByTier: Record<string, number>
  peakConcurrentSessions: number
}

// ================================
// KV SESSION CONFIGURATION
// ================================

const SESSION_PREFIX = 'session:'
const USER_SESSIONS_PREFIX = 'user_sessions:'
const SESSION_STATS_KEY = 'session_stats'

const SESSION_DEFAULTS = {
  duration: 24 * 60 * 60, // 24 hours
  maxPerUser: 5,
  cleanupInterval: 60 * 60, // 1 hour
  slidingExpiration: true
}

// ================================
// KV SESSION MANAGER IMPLEMENTATION
// ================================

class KVSessionManager implements SessionManager {
  private cleanupTimer?: NodeJS.Timer

  constructor() {
    // Start cleanup timer
    if (process.env.NODE_ENV === 'production') {
      this.startCleanupTimer()
    }
  }

  async createSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const now = new Date()
    const session: SessionData = {
      id: sessionId,
      supplierId: data.supplierId || '',
      warehouse: data.warehouse,
      permissions: data.permissions || [],
      tier: data.tier || 'STANDARD',
      deviceFingerprint: data.deviceFingerprint,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DEFAULTS.duration * 1000),
      metadata: data.metadata || {}
    }

    try {
      // Store in KV
      await kv.setex(
        `${SESSION_PREFIX}${sessionId}`,
        SESSION_DEFAULTS.duration,
        JSON.stringify(session)
      )

      // Add to user's session set
      await kv.sadd(`${USER_SESSIONS_PREFIX}${session.supplierId}`, sessionId)

      // Update stats
      await this.updateStats('create', session)

      // Log event
      await logAuthEvent('SESSION_CREATED', {
        sessionId,
        supplierId: session.supplierId,
        warehouse: session.warehouse
      })
    } catch (error) {
      console.error('Failed to create session:', error)
      throw new Error('Session creation failed')
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const data = await kv.get(`${SESSION_PREFIX}${sessionId}`)
      if (!data) return null

      const session = JSON.parse(data as string) as SessionData
      
      // Check expiration
      if (new Date(session.expiresAt) < new Date()) {
        await this.deleteSession(sessionId)
        return null
      }

      // Update last used if sliding expiration is enabled
      if (SESSION_DEFAULTS.slidingExpiration) {
        await this.refreshSession(sessionId)
      }

      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error('Session not found')

    const updated = { ...session, ...updates, lastUsedAt: new Date() }
    
    try {
      const ttl = Math.max(
        Math.floor((new Date(updated.expiresAt).getTime() - Date.now()) / 1000),
        1
      )
      
      await kv.setex(
        `${SESSION_PREFIX}${sessionId}`,
        ttl,
        JSON.stringify(updated)
      )
    } catch (error) {
      console.error('Failed to update session:', error)
      throw new Error('Session update failed')
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId)
      if (session) {
        await kv.del(`${SESSION_PREFIX}${sessionId}`)
        await kv.srem(`${USER_SESSIONS_PREFIX}${session.supplierId}`, sessionId)
        
        await this.updateStats('delete', session)
        
        await logAuthEvent('SESSION_DELETED', {
          sessionId,
          supplierId: session.supplierId
        })
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  async deleteSessions(supplierId: string): Promise<void> {
    try {
      const sessionIds = await kv.smembers(`${USER_SESSIONS_PREFIX}${supplierId}`)
      
      for (const sessionId of sessionIds) {
        await this.deleteSession(sessionId as string)
      }
      
      await kv.del(`${USER_SESSIONS_PREFIX}${supplierId}`)
    } catch (error) {
      console.error('Failed to delete user sessions:', error)
    }
  }

  async refreshSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.getSession(sessionId)
    if (!session) return null

    const now = new Date()
    session.lastUsedAt = now
    session.expiresAt = new Date(now.getTime() + SESSION_DEFAULTS.duration * 1000)

    await this.updateSession(sessionId, session)
    return session
  }

  async getActiveSessions(supplierId: string): Promise<SessionData[]> {
    try {
      const sessionIds = await kv.smembers(`${USER_SESSIONS_PREFIX}${supplierId}`)
      const sessions: SessionData[] = []

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId as string)
        if (session) {
          sessions.push(session)
        }
      }

      return sessions
    } catch (error) {
      console.error('Failed to get active sessions:', error)
      return []
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup is handled by KV TTL automatically
    console.log('Session cleanup triggered')
  }

  async getSessionStats(): Promise<SessionStats> {
    try {
      const stats = await kv.get(SESSION_STATS_KEY) as SessionStats
      return stats || {
        totalSessions: 0,
        activeSessions: 0,
        sessionsToday: 0,
        avgSessionDuration: 0,
        sessionsByWarehouse: {},
        sessionsByTier: {},
        peakConcurrentSessions: 0
      }
    } catch (error) {
      console.error('Failed to get session stats:', error)
      return {
        totalSessions: 0,
        activeSessions: 0,
        sessionsToday: 0,
        avgSessionDuration: 0,
        sessionsByWarehouse: {},
        sessionsByTier: {},
        peakConcurrentSessions: 0
      }
    }
  }

  private async updateStats(action: 'create' | 'delete', session: SessionData) {
    try {
      const stats = await this.getSessionStats()
      
      if (action === 'create') {
        stats.totalSessions++
        stats.activeSessions++
        stats.sessionsToday++
        stats.sessionsByWarehouse[session.warehouse || 'GLOBAL'] = 
          (stats.sessionsByWarehouse[session.warehouse || 'GLOBAL'] || 0) + 1
        stats.sessionsByTier[session.tier] = 
          (stats.sessionsByTier[session.tier] || 0) + 1
        
        if (stats.activeSessions > stats.peakConcurrentSessions) {
          stats.peakConcurrentSessions = stats.activeSessions
        }
      } else {
        stats.activeSessions = Math.max(0, stats.activeSessions - 1)
      }
      
      await kv.set(SESSION_STATS_KEY, JSON.stringify(stats))
    } catch (error) {
      console.error('Failed to update session stats:', error)
    }
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error)
    }, SESSION_DEFAULTS.cleanupInterval * 1000)
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
  }
}

// ================================
// IN-MEMORY FALLBACK FOR DEVELOPMENT
// ================================

class InMemorySessionManager implements SessionManager {
  private sessions = new Map<string, SessionData>()
  private userSessions = new Map<string, Set<string>>()

  async createSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const now = new Date()
    const session: SessionData = {
      id: sessionId,
      supplierId: data.supplierId || '',
      warehouse: data.warehouse,
      permissions: data.permissions || [],
      tier: data.tier || 'STANDARD',
      deviceFingerprint: data.deviceFingerprint,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DEFAULTS.duration * 1000),
      metadata: data.metadata || {}
    }

    this.sessions.set(sessionId, session)
    
    if (!this.userSessions.has(session.supplierId)) {
      this.userSessions.set(session.supplierId, new Set())
    }
    this.userSessions.get(session.supplierId)!.add(sessionId)
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(sessionId)
      return null
    }

    return session
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    this.sessions.set(sessionId, { ...session, ...updates, lastUsedAt: new Date() })
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.delete(sessionId)
      this.userSessions.get(session.supplierId)?.delete(sessionId)
    }
  }

  async deleteSessions(supplierId: string): Promise<void> {
    const sessionIds = this.userSessions.get(supplierId)
    if (sessionIds) {
      for (const sessionId of sessionIds) {
        this.sessions.delete(sessionId)
      }
      this.userSessions.delete(supplierId)
    }
  }

  async refreshSession(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const now = new Date()
    session.lastUsedAt = now
    session.expiresAt = new Date(now.getTime() + SESSION_DEFAULTS.duration * 1000)

    return session
  }

  async getActiveSessions(supplierId: string): Promise<SessionData[]> {
    const sessionIds = this.userSessions.get(supplierId)
    if (!sessionIds) return []

    const sessions: SessionData[] = []
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId)
      if (session) sessions.push(session)
    }

    return sessions
  }

  async cleanup(): Promise<void> {
    const now = new Date()
    for (const [sessionId, session] of this.sessions) {
      if (new Date(session.expiresAt) < now) {
        await this.deleteSession(sessionId)
      }
    }
  }

  async getSessionStats(): Promise<SessionStats> {
    return {
      totalSessions: this.sessions.size,
      activeSessions: this.sessions.size,
      sessionsToday: this.sessions.size,
      avgSessionDuration: 0,
      sessionsByWarehouse: {},
      sessionsByTier: {},
      peakConcurrentSessions: this.sessions.size
    }
  }
}

// ================================
// EXPORT SESSION MANAGER
// ================================

const useKV = !!process.env.KV_REST_API_URL

console.log(useKV ? '✅ Using Vercel KV for sessions' : '⚠️ Using in-memory session storage')

export const sessionManager: SessionManager = useKV 
  ? new KVSessionManager()
  : new InMemorySessionManager()

// ================================
// HELPER FUNCTIONS
// ================================

export async function createSupplierSession(
  supplierId: string,
  context: SecurityContext,
  metadata?: Record<string, any>
): Promise<string> {
  const sessionId = generateSessionId()
  
  await sessionManager.createSession(sessionId, {
    supplierId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata
  })
  
  return sessionId
}

export async function validateSession(
  sessionId: string
): Promise<SessionData | null> {
  return sessionManager.getSession(sessionId)
}

export async function terminateSession(sessionId: string): Promise<void> {
  return sessionManager.deleteSession(sessionId)
}

export async function terminateAllSessions(supplierId: string): Promise<void> {
  return sessionManager.deleteSessions(supplierId)
}

// For compatibility with existing code
export function createSessionManager() {
  return sessionManager
}