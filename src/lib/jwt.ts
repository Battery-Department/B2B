/**
 * RHY Supplier Portal - JWT Management
 * Enterprise-grade JWT token handling with security best practices
 * Supports multi-warehouse authentication and session management
 */

import jsonwebtoken from 'jsonwebtoken'
import { JWTPayload, SupplierAuthData } from '@/types/auth'

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production'
const JWT_ISSUER = 'rhy-supplier-portal'
const JWT_AUDIENCE = 'rhy-suppliers'

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 15 minutes for security
const REFRESH_TOKEN_EXPIRES_IN = '7d' // 7 days
const SESSION_TOKEN_EXPIRES_IN = '8h' // 8 hours for session tokens

// Enhanced JWT generation with security features
export function generateAccessToken(supplier: SupplierAuthData): string {
  const payload: JWTPayload = {
    sub: supplier.id,
    email: supplier.email,
    companyName: supplier.companyName,
    tier: supplier.tier,
    warehouses: supplier.warehouseAccess.map(w => w.warehouse),
    permissions: supplier.warehouseAccess.flatMap(w => w.permissions),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  }

  return jsonwebtoken.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  })
}

export function generateRefreshToken(supplierId: string): string {
  const payload = {
    sub: supplierId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  }

  return jsonwebtoken.sign(payload, JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  })
}

export function generateSessionToken(
  supplierId: string, 
  sessionId: string,
  warehouse?: string
): string {
  const payload = {
    sub: supplierId,
    sessionId,
    warehouse,
    type: 'session',
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  }

  return jsonwebtoken.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: SESSION_TOKEN_EXPIRES_IN
  })
}

// Token verification with comprehensive error handling
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as JWTPayload

    // Additional validation
    if (!decoded.sub || !decoded.email || !decoded.iss || !decoded.aud) {
      console.error('Invalid token payload structure')
      return null
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.warn('Token has expired')
      return null
    }

    return decoded
  } catch (error) {
    if (error instanceof jsonwebtoken.TokenExpiredError) {
      console.warn('JWT token expired')
    } else if (error instanceof jsonwebtoken.JsonWebTokenError) {
      console.error('JWT verification failed:', error.message)
    } else {
      console.error('Unexpected JWT error:', error)
    }
    return null
  }
}

export function verifyRefreshToken(token: string): { sub: string; type: string } | null {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_REFRESH_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as any

    if (decoded.type !== 'refresh' || !decoded.sub) {
      console.error('Invalid refresh token payload')
      return null
    }

    return decoded
  } catch (error) {
    if (error instanceof jsonwebtoken.TokenExpiredError) {
      console.warn('Refresh token expired')
    } else if (error instanceof jsonwebtoken.JsonWebTokenError) {
      console.error('Refresh token verification failed:', error.message)
    }
    return null
  }
}

export function verifySessionToken(token: string): { 
  sub: string; 
  sessionId: string; 
  warehouse?: string;
  type: string 
} | null {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as any

    if (decoded.type !== 'session' || !decoded.sub || !decoded.sessionId) {
      console.error('Invalid session token payload')
      return null
    }

    return decoded
  } catch (error) {
    if (error instanceof jsonwebtoken.TokenExpiredError) {
      console.warn('Session token expired')
    } else if (error instanceof jsonwebtoken.JsonWebTokenError) {
      console.error('Session token verification failed:', error.message)
    }
    return null
  }
}

// Token extraction from Authorization header
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  // Support both "Bearer token" and "token" formats
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (match) {
    return match[1]
  }

  // Fallback to raw token (for compatibility)
  if (authHeader.length > 0 && !authHeader.includes(' ')) {
    return authHeader
  }

  return null
}

// Token blacklisting for logout security
const tokenBlacklist = new Set<string>()

export function blacklistToken(token: string): void {
  tokenBlacklist.add(token)
  
  // Clean up expired tokens periodically
  if (tokenBlacklist.size > 10000) {
    // In production, use Redis or database for blacklist
    console.warn('Token blacklist is growing large, consider using external storage')
  }
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token)
}

// Token refresh functionality
export interface TokenRefreshResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export function refreshTokens(
  refreshToken: string,
  supplier: SupplierAuthData
): TokenRefreshResult | null {
  const refreshPayload = verifyRefreshToken(refreshToken)
  
  if (!refreshPayload || refreshPayload.sub !== supplier.id) {
    return null
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(supplier)
  const newRefreshToken = generateRefreshToken(supplier.id)

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  }
}

// Security utilities
export function getTokenFingerprint(token: string): string {
  // Create a hash of the token for tracking without storing the full token
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16)
}

export function validateTokenSecurity(token: string): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Check token length (should be reasonable for JWT)
  if (token.length < 100) {
    warnings.push('Token appears too short for a valid JWT')
  }
  
  if (token.length > 2048) {
    warnings.push('Token is unusually long')
  }
  
  // Check for proper JWT structure
  const parts = token.split('.')
  if (parts.length !== 3) {
    warnings.push('Token does not have proper JWT structure')
  }
  
  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    warnings.push('Token has been revoked')
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  }
}

// Development utilities
export function decodeTokenPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    )
    
    return payload
  } catch (error) {
    console.error('Failed to decode token payload:', error)
    return null
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = decodeTokenPayload(token)
    if (payload && payload.exp) {
      return new Date(payload.exp * 1000)
    }
    return null
  } catch (error) {
    return null
  }
}

// Export jwt object for compatibility
export const jwt = {
  generateAccessToken,
  generateRefreshToken,
  generateSessionToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySessionToken,
  extractTokenFromHeader,
  blacklistToken,
  isTokenBlacklisted,
  refreshTokens,
  getTokenFingerprint,
  validateTokenSecurity,
  decodeTokenPayload,
  getTokenExpiration
}