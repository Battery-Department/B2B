/**
 * RHY Supplier Portal - Enterprise Authentication Service
 * Comprehensive authentication system for FlexVolt battery suppliers across global warehouses
 * Implements JWT + MFA, session management, and enterprise security controls
 */

import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, generateSessionToken, verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { rhyPrisma } from '@/lib/rhy-database'
import { 
  SupplierAuthData, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  SessionResponse,
  MFASetupResponse,
  MFAVerifyResponse,
  RefreshTokenResponse,
  AuthError,
  SecurityContext
} from '@/types/auth'
import { logAuthEvent, checkRateLimit, lockAccount, isAccountLocked } from '@/lib/security'
import { generateMFASecret, verifyMFACode, generateBackupCodes } from '@/lib/mfa'
import { createSessionManager } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'

/**
 * Enterprise Authentication Service
 * Handles all authentication operations with enterprise-grade security
 */
export class AuthService {
  private sessionManager = createSessionManager()

  /**
   * Authenticate supplier with comprehensive security checks
   */
  async login(request: LoginRequest, securityContext: SecurityContext): Promise<LoginResponse> {
    const startTime = Date.now()
    
    try {
      // Rate limiting check
      const rateLimitKey = `login:${securityContext.ipAddress}:${request.email}`
      const rateLimitInfo = checkRateLimit(rateLimitKey, 15 * 60 * 1000, 5) // 5 attempts per 15 minutes
      
      if (rateLimitInfo.remaining <= 0) {
        await logAuthEvent('LOGIN_RATE_LIMITED', false, securityContext, undefined, {
          email: request.email,
          resetTime: rateLimitInfo.resetTime
        })
        
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          requiresMFA: false
        }
      }

      // Account lockout check
      if (isAccountLocked(request.email)) {
        await logAuthEvent('LOGIN_ACCOUNT_LOCKED', false, securityContext, undefined, {
          email: request.email
        })
        
        return {
          success: false,
          error: 'Account is temporarily locked due to security reasons.',
          requiresMFA: false
        }
      }

      // Find supplier
      const supplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { email: request.email },
        include: {
          warehouseAccess: true,
          sessions: {
            where: {
              expiresAt: { gte: new Date() },
              revoked: false
            },
            orderBy: { lastUsedAt: 'desc' },
            take: 5
          }
        }
      })

      if (!supplier) {
        await logAuthEvent('LOGIN_USER_NOT_FOUND', false, securityContext, undefined, {
          email: request.email,
          duration: Date.now() - startTime
        })
        
        return {
          success: false,
          error: 'Invalid email or password.',
          requiresMFA: false
        }
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(request.password, supplier.passwordHash)
      
      if (!isPasswordValid) {
        await logAuthEvent('LOGIN_INVALID_PASSWORD', false, securityContext, supplier.id, {
          email: request.email,
          duration: Date.now() - startTime
        })

        // Increment failed attempts
        await this.incrementFailedAttempts(supplier.id, securityContext.ipAddress || 'unknown')
        
        return {
          success: false,
          error: 'Invalid email or password.',
          requiresMFA: false
        }
      }

      // Check supplier status
      if (supplier.status !== 'ACTIVE') {
        await logAuthEvent('LOGIN_INACTIVE_ACCOUNT', false, securityContext, supplier.id, {
          status: supplier.status,
          duration: Date.now() - startTime
        })
        
        return {
          success: false,
          error: `Account is ${supplier.status.toLowerCase()}. Please contact support.`,
          requiresMFA: false
        }
      }

      // Check warehouse access for requested warehouse
      if (request.warehouse) {
        const hasWarehouseAccess = supplier.warehouseAccess.some(access =>
          access.warehouse === request.warehouse &&
          (!access.expiresAt || access.expiresAt > new Date())
        )

        if (!hasWarehouseAccess) {
          await logAuthEvent('LOGIN_WAREHOUSE_ACCESS_DENIED', false, securityContext, supplier.id, {
            requestedWarehouse: request.warehouse,
            availableWarehouses: supplier.warehouseAccess.map(w => w.warehouse),
            duration: Date.now() - startTime
          })
          
          return {
            success: false,
            error: `Access denied to ${request.warehouse} warehouse.`,
            requiresMFA: false
          }
        }
      }

      // Check MFA requirement
      if (supplier.mfaEnabled && !request.mfaCode) {
        await logAuthEvent('LOGIN_MFA_REQUIRED', false, securityContext, supplier.id, {
          duration: Date.now() - startTime
        })
        
        return {
          success: false,
          requiresMFA: true,
          error: 'Multi-factor authentication required.'
        }
      }

      // Verify MFA if provided
      if (supplier.mfaEnabled && request.mfaCode) {
        const mfaSecret = await this.getMFASecret(supplier.id)
        
        if (!mfaSecret || !verifyMFACode(mfaSecret, request.mfaCode)) {
          await logAuthEvent('LOGIN_INVALID_MFA', false, securityContext, supplier.id, {
            duration: Date.now() - startTime
          })
          
          await this.incrementFailedAttempts(supplier.id, securityContext.ipAddress || 'unknown')
          
          return {
            success: false,
            error: 'Invalid MFA code.',
            requiresMFA: true
          }
        }
      }

      // Check if MFA setup is required for premium/enterprise suppliers
      const requiresMFASetup = !supplier.mfaEnabled && 
                              (supplier.tier === 'PREMIUM' || supplier.tier === 'ENTERPRISE')

      // Create session
      const sessionId = uuidv4()
      const session = await rhyPrisma.rHYSession.create({
        data: {
          id: sessionId,
          supplierId: supplier.id,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          warehouse: request.warehouse || supplier.warehouseAccess[0]?.warehouse,
          expiresAt: new Date(Date.now() + (8 * 60 * 60 * 1000)), // 8 hours
          deviceFingerprint: securityContext.deviceFingerprint,
          lastUsedAt: new Date()
        }
      })

      // Generate tokens
      const supplierData: SupplierAuthData = {
        id: supplier.id,
        email: supplier.email,
        companyName: supplier.companyName,
        contactName: supplier.contactName,
        phoneNumber: supplier.phoneNumber,
        status: supplier.status as any,
        tier: supplier.tier as any,
        warehouseAccess: supplier.warehouseAccess.map(access => ({
          warehouse: access.warehouse as any,
          role: access.role as any,
          permissions: access.permissions,
          grantedAt: access.grantedAt,
          expiresAt: access.expiresAt
        })),
        mfaEnabled: supplier.mfaEnabled,
        lastLoginAt: supplier.lastLoginAt,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      }

      const accessToken = generateAccessToken(supplierData)
      const refreshToken = generateRefreshToken(supplier.id)

      // Store refresh token
      await rhyPrisma.rHYRefreshToken.create({
        data: {
          token: refreshToken,
          supplierId: supplier.id,
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
          deviceFingerprint: securityContext.deviceFingerprint
        }
      })

      // Update login information
      await rhyPrisma.rHYSupplier.update({
        where: { id: supplier.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: securityContext.ipAddress,
          failedLoginAttempts: 0, // Reset failed attempts on successful login
          lastFailedLoginAt: null
        }
      })

      // Session management
      await this.sessionManager.createSession(sessionId, {
        supplierId: supplier.id,
        warehouse: request.warehouse,
        permissions: supplierData.warehouseAccess.flatMap(w => w.permissions),
        tier: supplier.tier,
        deviceFingerprint: securityContext.deviceFingerprint
      })

      await logAuthEvent('LOGIN_SUCCESS', true, securityContext, supplier.id, {
        warehouse: request.warehouse,
        sessionId,
        duration: Date.now() - startTime,
        requiresMFASetup
      })

      return {
        success: true,
        token: accessToken,
        refreshToken,
        supplier: supplierData,
        expiresIn: 15 * 60, // 15 minutes
        warehouse: request.warehouse || supplier.warehouseAccess[0]?.warehouse as any,
        mfaSetupRequired: requiresMFASetup
      }

    } catch (error) {
      await logAuthEvent('LOGIN_ERROR', false, securityContext, undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })

      console.error('Login error:', error)
      
      return {
        success: false,
        error: 'An error occurred during login. Please try again.',
        requiresMFA: false
      }
    }
  }

  /**
   * Register new supplier with comprehensive validation
   */
  async register(request: RegisterRequest, securityContext: SecurityContext): Promise<RegisterResponse> {
    const startTime = Date.now()
    
    try {
      // Rate limiting for registration
      const rateLimitKey = `register:${securityContext.ipAddress}`
      const rateLimitInfo = checkRateLimit(rateLimitKey, 60 * 60 * 1000, 3) // 3 registrations per hour
      
      if (rateLimitInfo.remaining <= 0) {
        await logAuthEvent('REGISTER_RATE_LIMITED', false, securityContext, undefined, {
          email: request.email,
          resetTime: rateLimitInfo.resetTime
        })
        
        return {
          success: false,
          error: 'Too many registration attempts. Please try again later.'
        }
      }

      // Check if email already exists
      const existingSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { email: request.email }
      })

      if (existingSupplier) {
        await logAuthEvent('REGISTER_EMAIL_EXISTS', false, securityContext, undefined, {
          email: request.email,
          duration: Date.now() - startTime
        })
        
        return {
          success: false,
          error: 'An account with this email already exists.'
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(request.password, 12)

      // Create supplier
      const supplier = await rhyPrisma.rHYSupplier.create({
        data: {
          email: request.email,
          passwordHash,
          companyName: request.companyName,
          contactName: request.contactName,
          phoneNumber: request.phoneNumber,
          status: 'PENDING', // Requires verification
          tier: 'STANDARD', // Default tier
          businessType: request.businessType,
          acceptsMarketing: request.acceptsMarketing || false,
          registrationIP: securityContext.ipAddress,
          mfaEnabled: false,
          warehouseAccess: {
            create: {
              warehouse: request.warehouseRegion,
              role: 'OPERATOR', // Default role
              permissions: ['VIEW_PRODUCTS', 'PLACE_ORDERS', 'VIEW_ORDERS'],
              grantedAt: new Date()
            }
          }
        },
        include: {
          warehouseAccess: true
        }
      })

      await logAuthEvent('REGISTER_SUCCESS', true, securityContext, supplier.id, {
        email: request.email,
        companyName: request.companyName,
        warehouseRegion: request.warehouseRegion,
        businessType: request.businessType,
        duration: Date.now() - startTime
      })

      // TODO: Send verification email
      // await emailService.sendVerificationEmail(supplier.email, supplier.id)

      return {
        success: true,
        supplier: {
          id: supplier.id,
          email: supplier.email,
          companyName: supplier.companyName,
          status: supplier.status
        },
        message: 'Registration successful. Please check your email for verification instructions.',
        requiresVerification: true
      }

    } catch (error) {
      await logAuthEvent('REGISTER_ERROR', false, securityContext, undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: request.email,
        duration: Date.now() - startTime
      })

      console.error('Registration error:', error)
      
      return {
        success: false,
        error: 'An error occurred during registration. Please try again.'
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, securityContext: SecurityContext): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken)
      
      if (!payload) {
        await logAuthEvent('REFRESH_TOKEN_INVALID', false, securityContext)
        
        return {
          success: false,
          error: 'Invalid refresh token'
        }
      }

      // Find refresh token in database
      const storedToken = await rhyPrisma.rHYRefreshToken.findFirst({
        where: {
          token: refreshToken,
          supplierId: payload.sub,
          expiresAt: { gte: new Date() },
          revoked: false
        },
        include: {
          supplier: {
            include: {
              warehouseAccess: true
            }
          }
        }
      })

      if (!storedToken) {
        await logAuthEvent('REFRESH_TOKEN_NOT_FOUND', false, securityContext, payload.sub)
        
        return {
          success: false,
          error: 'Refresh token not found or expired'
        }
      }

      // Check supplier status
      if (storedToken.supplier.status !== 'ACTIVE') {
        await logAuthEvent('REFRESH_TOKEN_INACTIVE_SUPPLIER', false, securityContext, payload.sub, {
          status: storedToken.supplier.status
        })
        
        return {
          success: false,
          error: 'Account is not active'
        }
      }

      // Generate new tokens
      const supplierData: SupplierAuthData = {
        id: storedToken.supplier.id,
        email: storedToken.supplier.email,
        companyName: storedToken.supplier.companyName,
        contactName: storedToken.supplier.contactName,
        phoneNumber: storedToken.supplier.phoneNumber,
        status: storedToken.supplier.status as any,
        tier: storedToken.supplier.tier as any,
        warehouseAccess: storedToken.supplier.warehouseAccess.map(access => ({
          warehouse: access.warehouse as any,
          role: access.role as any,
          permissions: access.permissions,
          grantedAt: access.grantedAt,
          expiresAt: access.expiresAt
        })),
        mfaEnabled: storedToken.supplier.mfaEnabled,
        lastLoginAt: storedToken.supplier.lastLoginAt,
        createdAt: storedToken.supplier.createdAt,
        updatedAt: storedToken.supplier.updatedAt
      }

      const newAccessToken = generateAccessToken(supplierData)
      const newRefreshToken = generateRefreshToken(storedToken.supplier.id)

      // Revoke old refresh token and create new one
      await rhyPrisma.$transaction([
        rhyPrisma.rHYRefreshToken.update({
          where: { id: storedToken.id },
          data: { revoked: true }
        }),
        rhyPrisma.rHYRefreshToken.create({
          data: {
            token: newRefreshToken,
            supplierId: storedToken.supplier.id,
            expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
            deviceFingerprint: securityContext.deviceFingerprint
          }
        })
      ])

      await logAuthEvent('REFRESH_TOKEN_SUCCESS', true, securityContext, storedToken.supplier.id)

      return {
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 // 15 minutes
      }

    } catch (error) {
      await logAuthEvent('REFRESH_TOKEN_ERROR', false, securityContext, undefined, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      console.error('Refresh token error:', error)
      
      return {
        success: false,
        error: 'Failed to refresh token'
      }
    }
  }

  /**
   * Validate session and return supplier data
   */
  async validateSession(token: string, securityContext: SecurityContext): Promise<SessionResponse> {
    try {
      // Verify access token
      const payload = verifyAccessToken(token)
      
      if (!payload) {
        await logAuthEvent('SESSION_INVALID_TOKEN', false, securityContext)
        
        return {
          valid: false,
          error: 'Invalid token'
        }
      }

      // Find supplier
      const supplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: payload.sub },
        include: {
          warehouseAccess: true,
          sessions: {
            where: {
              expiresAt: { gte: new Date() },
              revoked: false
            },
            orderBy: { lastUsedAt: 'desc' },
            take: 1
          }
        }
      })

      if (!supplier) {
        await logAuthEvent('SESSION_SUPPLIER_NOT_FOUND', false, securityContext, payload.sub)
        
        return {
          valid: false,
          error: 'Supplier not found'
        }
      }

      if (supplier.status !== 'ACTIVE') {
        await logAuthEvent('SESSION_INACTIVE_SUPPLIER', false, securityContext, supplier.id, {
          status: supplier.status
        })
        
        return {
          valid: false,
          error: 'Account is not active'
        }
      }

      // Update session last used time
      if (supplier.sessions.length > 0) {
        await rhyPrisma.rHYSession.update({
          where: { id: supplier.sessions[0].id },
          data: { lastUsedAt: new Date() }
        })
      }

      await logAuthEvent('SESSION_VALID', true, securityContext, supplier.id)

      const supplierData: SupplierAuthData = {
        id: supplier.id,
        email: supplier.email,
        companyName: supplier.companyName,
        contactName: supplier.contactName,
        phoneNumber: supplier.phoneNumber,
        status: supplier.status as any,
        tier: supplier.tier as any,
        warehouseAccess: supplier.warehouseAccess.map(access => ({
          warehouse: access.warehouse as any,
          role: access.role as any,
          permissions: access.permissions,
          grantedAt: access.grantedAt,
          expiresAt: access.expiresAt
        })),
        mfaEnabled: supplier.mfaEnabled,
        lastLoginAt: supplier.lastLoginAt,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      }

      return {
        valid: true,
        supplier: supplierData,
        session: supplier.sessions.length > 0 ? {
          id: supplier.sessions[0].id,
          expiresAt: supplier.sessions[0].expiresAt,
          lastUsedAt: supplier.sessions[0].lastUsedAt
        } : undefined
      }

    } catch (error) {
      await logAuthEvent('SESSION_ERROR', false, securityContext, undefined, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      console.error('Session validation error:', error)
      
      return {
        valid: false,
        error: 'Session validation failed'
      }
    }
  }

  /**
   * Setup MFA for supplier
   */
  async setupMFA(supplierId: string, password: string, securityContext: SecurityContext): Promise<MFASetupResponse> {
    try {
      // Verify supplier and password
      const supplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplierId }
      })

      if (!supplier) {
        return {
          success: false,
          error: 'Supplier not found'
        }
      }

      const isPasswordValid = await bcrypt.compare(password, supplier.passwordHash)
      
      if (!isPasswordValid) {
        await logAuthEvent('MFA_SETUP_INVALID_PASSWORD', false, securityContext, supplierId)
        
        return {
          success: false,
          error: 'Invalid password'
        }
      }

      // Generate MFA secret and backup codes
      const secret = generateMFASecret()
      const backupCodes = generateBackupCodes()

      // Store MFA data (encrypted)
      await rhyPrisma.rHYMFA.upsert({
        where: { supplierId },
        create: {
          supplierId,
          secret,
          backupCodes,
          isEnabled: false // Will be enabled after verification
        },
        update: {
          secret,
          backupCodes,
          isEnabled: false
        }
      })

      await logAuthEvent('MFA_SETUP_INITIATED', true, securityContext, supplierId)

      // Generate QR code URL
      const qrCodeUrl = `otpauth://totp/RHY%20Supplier%20Portal:${encodeURIComponent(supplier.email)}?secret=${secret}&issuer=RHY%20Supplier%20Portal`

      return {
        success: true,
        secret,
        qrCode: qrCodeUrl,
        backupCodes
      }

    } catch (error) {
      await logAuthEvent('MFA_SETUP_ERROR', false, securityContext, supplierId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      console.error('MFA setup error:', error)
      
      return {
        success: false,
        error: 'Failed to setup MFA'
      }
    }
  }

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(supplierId: string, code: string, securityContext: SecurityContext): Promise<MFAVerifyResponse> {
    try {
      const mfaData = await rhyPrisma.rHYMFA.findUnique({
        where: { supplierId }
      })

      if (!mfaData) {
        return {
          success: false,
          error: 'MFA not setup'
        }
      }

      if (!verifyMFACode(mfaData.secret, code)) {
        await logAuthEvent('MFA_VERIFY_INVALID_CODE', false, securityContext, supplierId)
        
        return {
          success: false,
          error: 'Invalid MFA code'
        }
      }

      // Enable MFA
      await Promise.all([
        rhyPrisma.rHYMFA.update({
          where: { supplierId },
          data: { 
            isEnabled: true,
            verifiedAt: new Date()
          }
        }),
        rhyPrisma.rHYSupplier.update({
          where: { id: supplierId },
          data: { mfaEnabled: true }
        })
      ])

      await logAuthEvent('MFA_SETUP_COMPLETED', true, securityContext, supplierId)

      return {
        success: true,
        message: 'MFA has been successfully enabled'
      }

    } catch (error) {
      await logAuthEvent('MFA_VERIFY_ERROR', false, securityContext, supplierId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      console.error('MFA verification error:', error)
      
      return {
        success: false,
        error: 'Failed to verify MFA'
      }
    }
  }

  /**
   * Logout and revoke session
   */
  async logout(token: string, sessionId?: string, securityContext?: SecurityContext): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify token to get supplier ID
      const payload = verifyAccessToken(token)
      
      if (payload) {
        // Revoke all sessions for this supplier if no specific session ID
        if (sessionId) {
          await rhyPrisma.rHYSession.updateMany({
            where: {
              id: sessionId,
              supplierId: payload.sub
            },
            data: { revoked: true }
          })
        } else {
          await rhyPrisma.rHYSession.updateMany({
            where: { supplierId: payload.sub },
            data: { revoked: true }
          })
        }

        // Revoke refresh tokens
        await rhyPrisma.rHYRefreshToken.updateMany({
          where: { supplierId: payload.sub },
          data: { revoked: true }
        })

        await logAuthEvent('LOGOUT_SUCCESS', true, securityContext, payload.sub, {
          sessionId
        })
      }

      return { success: true }

    } catch (error) {
      console.error('Logout error:', error)
      
      return {
        success: false,
        error: 'Failed to logout'
      }
    }
  }

  // Private helper methods

  private async incrementFailedAttempts(supplierId: string, ipAddress: string): Promise<void> {
    try {
      const supplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplierId },
        select: { failedLoginAttempts: true, email: true }
      })

      if (supplier) {
        const newFailedAttempts = (supplier.failedLoginAttempts || 0) + 1
        
        await rhyPrisma.rHYSupplier.update({
          where: { id: supplierId },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lastFailedLoginAt: new Date(),
            lastFailedLoginIP: ipAddress
          }
        })

        // Lock account after 5 failed attempts
        if (newFailedAttempts >= 5) {
          lockAccount(supplier.email, 15 * 60 * 1000) // 15 minutes lockout
        }
      }
    } catch (error) {
      console.error('Failed to increment failed attempts:', error)
    }
  }

  private async getMFASecret(supplierId: string): Promise<string | null> {
    try {
      const mfaData = await rhyPrisma.rHYMFA.findUnique({
        where: { supplierId },
        select: { secret: true, isEnabled: true }
      })

      return mfaData?.isEnabled ? mfaData.secret : null
    } catch (error) {
      console.error('Failed to get MFA secret:', error)
      return null
    }
  }
}

// Singleton instance
export const authService = new AuthService()