import { hash, compare } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { randomBytes, createHash } from 'crypto'

export interface SecurityConfig {
  jwtSecret: string
  jwtExpiry: string
  bcryptRounds: number
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  passwordPolicy: PasswordPolicy
  mfaEnabled: boolean
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventReuse: number
  maxAge: number
}

export interface User {
  id: string
  email: string
  passwordHash: string
  role: UserRole
  mfaEnabled: boolean
  mfaSecret?: string
  loginAttempts: number
  lockedUntil?: Date
  lastLogin?: Date
  passwordHistory: string[]
  sessionToken?: string
  sessionExpiry?: Date
}

export interface SecurityAuditLog {
  id: string
  userId?: string
  action: string
  resource: string
  outcome: 'success' | 'failure' | 'warning'
  ipAddress: string
  userAgent: string
  timestamp: Date
  details: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
  ANALYST = 'analyst'
}

export class SecurityCore {
  private config: SecurityConfig
  private auditLogs: SecurityAuditLog[] = []
  private activeSessions: Map<string, any> = new Map()
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(config: SecurityConfig) {
    this.config = config
    this.initializeSecurityPolicies()
  }

  private initializeSecurityPolicies() {
    // Set up security headers
    this.setupSecurityHeaders()
    
    // Initialize rate limiting
    this.initializeRateLimiting()
    
    // Start session cleanup
    this.startSessionCleanup()
  }

  // Authentication System
  async authenticateUser(email: string, password: string, ipAddress: string, userAgent: string): Promise<{
    success: boolean
    user?: User
    token?: string
    mfaRequired?: boolean
    error?: string
  }> {
    try {
      // Rate limiting check
      if (this.isRateLimited(ipAddress)) {
        await this.logSecurityEvent({
          action: 'login_rate_limited',
          resource: 'authentication',
          outcome: 'failure',
          ipAddress,
          userAgent,
          details: { email },
          riskLevel: 'high'
        })
        return { success: false, error: 'Rate limit exceeded' }
      }

      // Find user
      const user = await this.findUserByEmail(email)
      if (!user) {
        await this.logSecurityEvent({
          action: 'login_user_not_found',
          resource: 'authentication',
          outcome: 'failure',
          ipAddress,
          userAgent,
          details: { email },
          riskLevel: 'medium'
        })
        return { success: false, error: 'Invalid credentials' }
      }

      // Check if account is locked
      if (this.isAccountLocked(user)) {
        await this.logSecurityEvent({
          userId: user.id,
          action: 'login_account_locked',
          resource: 'authentication',
          outcome: 'failure',
          ipAddress,
          userAgent,
          details: { email },
          riskLevel: 'high'
        })
        return { success: false, error: 'Account is locked' }
      }

      // Verify password
      const passwordValid = await compare(password, user.passwordHash)
      if (!passwordValid) {
        await this.handleFailedLogin(user, ipAddress, userAgent)
        return { success: false, error: 'Invalid credentials' }
      }

      // Check if MFA is required
      if (user.mfaEnabled) {
        await this.logSecurityEvent({
          userId: user.id,
          action: 'login_mfa_required',
          resource: 'authentication',
          outcome: 'success',
          ipAddress,
          userAgent,
          details: { email },
          riskLevel: 'low'
        })
        return { success: true, mfaRequired: true, user }
      }

      // Successful login
      const token = await this.createSecureSession(user, ipAddress, userAgent)
      await this.handleSuccessfulLogin(user, ipAddress, userAgent)

      return { success: true, user, token }
    } catch (error) {
      await this.logSecurityEvent({
        action: 'login_error',
        resource: 'authentication',
        outcome: 'failure',
        ipAddress,
        userAgent,
        details: { email, error: error.message },
        riskLevel: 'critical'
      })
      return { success: false, error: 'Authentication error' }
    }
  }

  async verifyMFA(userId: string, mfaCode: string, ipAddress: string, userAgent: string): Promise<{
    success: boolean
    token?: string
    error?: string
  }> {
    try {
      const user = await this.findUserById(userId)
      if (!user || !user.mfaSecret) {
        return { success: false, error: 'MFA not configured' }
      }

      const isValidCode = this.verifyTOTP(user.mfaSecret, mfaCode)
      if (!isValidCode) {
        await this.logSecurityEvent({
          userId,
          action: 'mfa_verification_failed',
          resource: 'authentication',
          outcome: 'failure',
          ipAddress,
          userAgent,
          details: { mfaCode },
          riskLevel: 'high'
        })
        return { success: false, error: 'Invalid MFA code' }
      }

      // Create secure session
      const token = await this.createSecureSession(user, ipAddress, userAgent)
      await this.handleSuccessfulLogin(user, ipAddress, userAgent)

      await this.logSecurityEvent({
        userId,
        action: 'mfa_verification_success',
        resource: 'authentication',
        outcome: 'success',
        ipAddress,
        userAgent,
        details: {},
        riskLevel: 'low'
      })

      return { success: true, token }
    } catch (error) {
      await this.logSecurityEvent({
        userId,
        action: 'mfa_verification_error',
        resource: 'authentication',
        outcome: 'failure',
        ipAddress,
        userAgent,
        details: { error: error.message },
        riskLevel: 'critical'
      })
      return { success: false, error: 'MFA verification error' }
    }
  }

  // Session Management
  async createSecureSession(user: User, ipAddress: string, userAgent: string): Promise<string> {
    const sessionId = this.generateSecureToken()
    const token = sign(
      {
        userId: user.id,
        sessionId,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiry }
    )

    // Store session
    const sessionData = {
      userId: user.id,
      sessionId,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    }

    this.activeSessions.set(sessionId, sessionData)

    await this.logSecurityEvent({
      userId: user.id,
      action: 'session_created',
      resource: 'session',
      outcome: 'success',
      ipAddress,
      userAgent,
      details: { sessionId },
      riskLevel: 'low'
    })

    return token
  }

  async validateSession(token: string, ipAddress: string, userAgent: string): Promise<{
    valid: boolean
    user?: User
    error?: string
  }> {
    try {
      const decoded = verify(token, this.config.jwtSecret) as any
      const session = this.activeSessions.get(decoded.sessionId)

      if (!session || !session.isActive) {
        return { valid: false, error: 'Invalid session' }
      }

      // Check for session hijacking
      if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
        await this.logSecurityEvent({
          userId: decoded.userId,
          action: 'session_hijack_detected',
          resource: 'session',
          outcome: 'failure',
          ipAddress,
          userAgent,
          details: {
            sessionId: decoded.sessionId,
            originalIp: session.ipAddress,
            originalUserAgent: session.userAgent
          },
          riskLevel: 'critical'
        })
        await this.invalidateSession(decoded.sessionId)
        return { valid: false, error: 'Session security violation' }
      }

      // Update last activity
      session.lastActivity = new Date()

      const user = await this.findUserById(decoded.userId)
      return { valid: true, user }
    } catch (error) {
      return { valid: false, error: 'Token validation failed' }
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.isActive = false
      await this.logSecurityEvent({
        userId: session.userId,
        action: 'session_invalidated',
        resource: 'session',
        outcome: 'success',
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        details: { sessionId },
        riskLevel: 'low'
      })
    }
  }

  // Password Management
  async changePassword(userId: string, currentPassword: string, newPassword: string, ipAddress: string, userAgent: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await this.findUserById(userId)
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const currentPasswordValid = await compare(currentPassword, user.passwordHash)
      if (!currentPasswordValid) {
        await this.logSecurityEvent({
          userId,
          action: 'password_change_invalid_current',
          resource: 'password',
          outcome: 'failure',
          ipAddress,
          userAgent,
          details: {},
          riskLevel: 'medium'
        })
        return { success: false, error: 'Current password is incorrect' }
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword, user.passwordHistory)
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error }
      }

      // Hash new password
      const newPasswordHash = await hash(newPassword, this.config.bcryptRounds)

      // Update password history
      const updatedHistory = [user.passwordHash, ...user.passwordHistory].slice(0, this.config.passwordPolicy.preventReuse)

      // Update user
      await this.updateUser(userId, {
        passwordHash: newPasswordHash,
        passwordHistory: updatedHistory,
        lastPasswordChange: new Date()
      })

      await this.logSecurityEvent({
        userId,
        action: 'password_changed',
        resource: 'password',
        outcome: 'success',
        ipAddress,
        userAgent,
        details: {},
        riskLevel: 'low'
      })

      return { success: true }
    } catch (error) {
      await this.logSecurityEvent({
        userId,
        action: 'password_change_error',
        resource: 'password',
        outcome: 'failure',
        ipAddress,
        userAgent,
        details: { error: error.message },
        riskLevel: 'critical'
      })
      return { success: false, error: 'Password change failed' }
    }
  }

  // Access Control
  hasPermission(user: User, resource: string, action: string): boolean {
    const permissions = this.getRolePermissions(user.role)
    return permissions.some(p => 
      (p.resource === '*' || p.resource === resource) &&
      (p.actions.includes('*') || p.actions.includes(action))
    )
  }

  private getRolePermissions(role: UserRole) {
    const permissionMap = {
      [UserRole.CUSTOMER]: [
        { resource: 'profile', actions: ['read', 'update'] },
        { resource: 'orders', actions: ['read', 'create'] },
        { resource: 'cart', actions: ['*'] },
        { resource: 'products', actions: ['read'] }
      ],
      [UserRole.SUPPORT]: [
        { resource: 'customers', actions: ['read', 'update'] },
        { resource: 'orders', actions: ['read', 'update'] },
        { resource: 'tickets', actions: ['*'] }
      ],
      [UserRole.ANALYST]: [
        { resource: 'analytics', actions: ['*'] },
        { resource: 'reports', actions: ['*'] },
        { resource: 'customers', actions: ['read'] }
      ],
      [UserRole.ADMIN]: [
        { resource: 'users', actions: ['*'] },
        { resource: 'products', actions: ['*'] },
        { resource: 'orders', actions: ['*'] },
        { resource: 'system', actions: ['read', 'update'] }
      ],
      [UserRole.SUPER_ADMIN]: [
        { resource: '*', actions: ['*'] }
      ]
    }

    return permissionMap[role] || []
  }

  // Security Utilities
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex')
  }

  private verifyTOTP(secret: string, token: string): boolean {
    // Implementation would use a proper TOTP library like 'otplib'
    // This is a simplified version for demonstration
    const timeWindow = Math.floor(Date.now() / 30000)
    const expectedToken = createHash('sha1')
      .update(secret + timeWindow.toString())
      .digest('hex')
      .slice(0, 6)
    
    return token === expectedToken
  }

  private validatePassword(password: string, passwordHistory: string[]): { valid: boolean; error?: string } {
    const policy = this.config.passwordPolicy

    if (password.length < policy.minLength) {
      return { valid: false, error: `Password must be at least ${policy.minLength} characters` }
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain uppercase letters' }
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain lowercase letters' }
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      return { valid: false, error: 'Password must contain numbers' }
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, error: 'Password must contain special characters' }
    }

    // Check password history
    for (const oldHash of passwordHistory) {
      if (compare(password, oldHash)) {
        return { valid: false, error: 'Password has been used recently' }
      }
    }

    return { valid: true }
  }

  private isAccountLocked(user: User): boolean {
    return user.lockedUntil && user.lockedUntil > new Date()
  }

  private isRateLimited(key: string): boolean {
    const limit = this.rateLimiter.get(key)
    if (!limit) return false

    if (Date.now() > limit.resetTime) {
      this.rateLimiter.delete(key)
      return false
    }

    return limit.count >= 5 // Max 5 attempts per minute
  }

  private async handleFailedLogin(user: User, ipAddress: string, userAgent: string): Promise<void> {
    user.loginAttempts++

    if (user.loginAttempts >= this.config.maxLoginAttempts) {
      user.lockedUntil = new Date(Date.now() + this.config.lockoutDuration)
      await this.logSecurityEvent({
        userId: user.id,
        action: 'account_locked',
        resource: 'authentication',
        outcome: 'warning',
        ipAddress,
        userAgent,
        details: { attempts: user.loginAttempts },
        riskLevel: 'high'
      })
    }

    await this.logSecurityEvent({
      userId: user.id,
      action: 'login_failed',
      resource: 'authentication',
      outcome: 'failure',
      ipAddress,
      userAgent,
      details: { attempts: user.loginAttempts },
      riskLevel: 'medium'
    })

    // Update rate limiting
    const key = ipAddress
    const existing = this.rateLimiter.get(key)
    if (existing) {
      existing.count++
    } else {
      this.rateLimiter.set(key, { count: 1, resetTime: Date.now() + 60000 })
    }
  }

  private async handleSuccessfulLogin(user: User, ipAddress: string, userAgent: string): Promise<void> {
    user.loginAttempts = 0
    user.lockedUntil = undefined
    user.lastLogin = new Date()

    await this.logSecurityEvent({
      userId: user.id,
      action: 'login_success',
      resource: 'authentication',
      outcome: 'success',
      ipAddress,
      userAgent,
      details: {},
      riskLevel: 'low'
    })
  }

  private async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: SecurityAuditLog = {
      id: this.generateSecureToken(),
      timestamp: new Date(),
      ...event
    }

    this.auditLogs.push(auditLog)

    // In production, this would write to a secure log system
    console.log(`[SECURITY AUDIT] ${auditLog.timestamp.toISOString()} - ${auditLog.action} - ${auditLog.outcome}`)

    // Alert on high/critical risk events
    if (auditLog.riskLevel === 'high' || auditLog.riskLevel === 'critical') {
      await this.alertSecurityTeam(auditLog)
    }
  }

  private async alertSecurityTeam(event: SecurityAuditLog): Promise<void> {
    // Implementation would send alerts via email, Slack, etc.
    console.log(`[SECURITY ALERT] ${event.riskLevel.toUpperCase()}: ${event.action}`)
  }

  private setupSecurityHeaders(): void {
    // Implementation would configure security headers
    // X-Frame-Options, X-XSS-Protection, Content-Security-Policy, etc.
  }

  private initializeRateLimiting(): void {
    // Clean up rate limiting data periodically
    setInterval(() => {
      const now = Date.now()
      for (const [key, limit] of this.rateLimiter.entries()) {
        if (now > limit.resetTime) {
          this.rateLimiter.delete(key)
        }
      }
    }, 60000)
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions
    setInterval(() => {
      const now = Date.now()
      for (const [sessionId, session] of this.activeSessions.entries()) {
        const sessionAge = now - session.lastActivity.getTime()
        if (sessionAge > this.config.sessionTimeout) {
          this.invalidateSession(sessionId)
        }
      }
    }, 60000)
  }

  // Mock database operations (would be replaced with real database calls)
  private async findUserByEmail(email: string): Promise<User | null> {
    // Mock implementation
    return null
  }

  private async findUserById(id: string): Promise<User | null> {
    // Mock implementation
    return null
  }

  private async updateUser(id: string, updates: Partial<User>): Promise<void> {
    // Mock implementation
  }

  // Public API for audit logs
  getAuditLogs(filters?: {
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    riskLevel?: string
  }): SecurityAuditLog[] {
    let logs = this.auditLogs

    if (filters) {
      logs = logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false
        if (filters.action && log.action !== filters.action) return false
        if (filters.startDate && log.timestamp < filters.startDate) return false
        if (filters.endDate && log.timestamp > filters.endDate) return false
        if (filters.riskLevel && log.riskLevel !== filters.riskLevel) return false
        return true
      })
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getSecurityMetrics(): {
    totalSessions: number
    activeSessions: number
    failedLoginAttempts: number
    lockedAccounts: number
    securityEvents: number
    riskDistribution: Record<string, number>
  } {
    const failedLogins = this.auditLogs.filter(log => log.action === 'login_failed').length
    const riskDistribution = this.auditLogs.reduce((acc, log) => {
      acc[log.riskLevel] = (acc[log.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalSessions: this.activeSessions.size,
      activeSessions: Array.from(this.activeSessions.values()).filter(s => s.isActive).length,
      failedLoginAttempts: failedLogins,
      lockedAccounts: 0, // Would be calculated from database
      securityEvents: this.auditLogs.length,
      riskDistribution
    }
  }
}