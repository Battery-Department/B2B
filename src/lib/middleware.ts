/**
 * RHY Supplier Portal - Security Middleware
 * Enterprise-grade middleware for authentication, authorization, and security enforcement
 * Implements comprehensive security controls for multi-warehouse operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, verifySessionToken, extractTokenFromHeader } from './jwt'
import { 
  checkRateLimit, 
  isAccountLocked, 
  logAuthEvent, 
  getSecurityHeaders,
  validateIPAddress,
  isPrivateIP,
  generateDeviceFingerprint,
  lockAccount
} from './security'
import { rhyPrisma } from './rhy-database'
import { SecurityContext, SupplierAuthData } from '@/types/auth'

// Enhanced middleware for authentication verification
export async function withAuth(
  request: NextRequest,
  requiredPermissions: string[] = [],
  allowedWarehouses: string[] = []
): Promise<{
  success: boolean
  supplier?: SupplierAuthData
  error?: string
  response?: NextResponse
}> {
  const securityContext: SecurityContext = {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date(),
    deviceFingerprint: generateDeviceFingerprint(
      request.headers.get('user-agent'),
      request.headers.get('x-forwarded-for')?.split(',')[0]
    )
  }

  try {
    // Extract token
    let token: string | null = null
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      token = extractTokenFromHeader(authHeader)
    }
    
    // Fallback to session cookie
    if (!token) {
      const sessionCookie = request.cookies.get('rhy_session')
      if (sessionCookie) {
        token = sessionCookie.value
      }
    }

    if (!token) {
      await logAuthEvent('MIDDLEWARE_NO_TOKEN', false, securityContext)
      return {
        success: false,
        error: 'Authentication required',
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401, headers: getSecurityHeaders() }
        )
      }
    }

    // Verify token
    let supplierId: string | null = null
    let tokenType: string = 'unknown'

    const accessTokenPayload = verifyAccessToken(token)
    if (accessTokenPayload) {
      supplierId = accessTokenPayload.sub
      tokenType = 'access_token'
    } else {
      const sessionTokenPayload = verifySessionToken(token)
      if (sessionTokenPayload) {
        supplierId = sessionTokenPayload.sub
        tokenType = 'session_token'
      }
    }

    if (!supplierId) {
      await logAuthEvent('MIDDLEWARE_INVALID_TOKEN', false, securityContext)
      return {
        success: false,
        error: 'Invalid token',
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401, headers: getSecurityHeaders() }
        )
      }
    }

    // Fetch supplier with warehouse access
    const supplier = await rhyPrisma.rHYSupplier.findUnique({
      where: { id: supplierId },
      include: {
        warehouseAccess: true
      }
    })

    if (!supplier) {
      await logAuthEvent('MIDDLEWARE_SUPPLIER_NOT_FOUND', false, securityContext, supplierId)
      return {
        success: false,
        error: 'Supplier not found',
        response: NextResponse.json(
          { error: 'Account not found' },
          { status: 401, headers: getSecurityHeaders() }
        )
      }
    }

    // Check supplier status
    if (supplier.status !== 'ACTIVE') {
      await logAuthEvent('MIDDLEWARE_INACTIVE_SUPPLIER', false, securityContext, supplier.id, {
        status: supplier.status
      })
      return {
        success: false,
        error: 'Account not active',
        response: NextResponse.json(
          { error: 'Account is not active' },
          { status: 403, headers: getSecurityHeaders() }
        )
      }
    }

    // Check warehouse access if required
    if (allowedWarehouses.length > 0) {
      const hasWarehouseAccess = supplier.warehouseAccess.some(access =>
        allowedWarehouses.includes(access.warehouse) &&
        (!access.expiresAt || access.expiresAt > new Date())
      )

      if (!hasWarehouseAccess) {
        await logAuthEvent('MIDDLEWARE_WAREHOUSE_ACCESS_DENIED', false, securityContext, supplier.id, {
          allowedWarehouses,
          userWarehouses: supplier.warehouseAccess.map(w => w.warehouse)
        })
        return {
          success: false,
          error: 'Warehouse access denied',
          response: NextResponse.json(
            { error: 'Access denied to required warehouse' },
            { status: 403, headers: getSecurityHeaders() }
          )
        }
      }
    }

    // Check permissions if required
    if (requiredPermissions.length > 0) {
      const userPermissions = supplier.warehouseAccess.flatMap(access => access.permissions)
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      )

      if (!hasRequiredPermissions) {
        await logAuthEvent('MIDDLEWARE_PERMISSION_DENIED', false, securityContext, supplier.id, {
          requiredPermissions,
          userPermissions
        })
        return {
          success: false,
          error: 'Insufficient permissions',
          response: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403, headers: getSecurityHeaders() }
          )
        }
      }
    }

    // Success - prepare supplier data
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

    await logAuthEvent('MIDDLEWARE_AUTH_SUCCESS', true, securityContext, supplier.id, {
      tokenType,
      permissions: requiredPermissions,
      warehouses: allowedWarehouses
    })

    return {
      success: true,
      supplier: supplierData
    }

  } catch (error) {
    console.error('Authentication middleware error:', error)
    await logAuthEvent('MIDDLEWARE_ERROR', false, securityContext, undefined, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return {
      success: false,
      error: 'Authentication failed',
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }
  }
}

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
): Promise<{
  success: boolean
  response?: NextResponse
  remaining?: number
}> {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  'unknown'

  const rateLimitInfo = checkRateLimit(
    `api:${clientIP}`,
    windowMs,
    maxRequests
  )

  if (rateLimitInfo.remaining <= 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitInfo.resetTime.getTime() / 1000).toString(),
            'Retry-After': Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }

  return {
    success: true,
    remaining: rateLimitInfo.remaining
  }
}

// Security headers middleware
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders()
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// IP validation middleware
export async function withIPValidation(
  request: NextRequest,
  allowPrivateIPs: boolean = true
): Promise<{
  success: boolean
  response?: NextResponse
}> {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  'unknown'

  if (!validateIPAddress(clientIP)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }
  }

  if (!allowPrivateIPs && isPrivateIP(clientIP)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Private IP addresses not allowed' },
        { status: 403, headers: getSecurityHeaders() }
      )
    }
  }

  return { success: true }
}

// Account lockout middleware
export async function withAccountLockout(
  request: NextRequest,
  identifier: string
): Promise<{
  success: boolean
  response?: NextResponse
}> {
  if (isAccountLocked(identifier)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Account is temporarily locked' },
        { status: 423, headers: getSecurityHeaders() }
      )
    }
  }

  return { success: true }
}

// Combined security middleware
export async function withSecurity(
  request: NextRequest,
  options: {
    requireAuth?: boolean
    requiredPermissions?: string[]
    allowedWarehouses?: string[]
    rateLimit?: {
      windowMs: number
      maxRequests: number
    }
    allowPrivateIPs?: boolean
  } = {}
): Promise<{
  success: boolean
  supplier?: SupplierAuthData
  response?: NextResponse
  rateLimitRemaining?: number
}> {
  // IP validation
  const ipValidation = await withIPValidation(
    request,
    options.allowPrivateIPs ?? true
  )
  if (!ipValidation.success) {
    return { success: false, response: ipValidation.response }
  }

  // Rate limiting
  if (options.rateLimit) {
    const rateLimitCheck = await withRateLimit(
      request,
      options.rateLimit.windowMs,
      options.rateLimit.maxRequests
    )
    if (!rateLimitCheck.success) {
      return { success: false, response: rateLimitCheck.response }
    }
  }

  // Authentication
  if (options.requireAuth !== false) {
    const authCheck = await withAuth(
      request,
      options.requiredPermissions,
      options.allowedWarehouses
    )
    if (!authCheck.success) {
      return { 
        success: false, 
        response: authCheck.response,
        supplier: authCheck.supplier
      }
    }
    
    return { 
      success: true, 
      supplier: authCheck.supplier 
    }
  }

  return { success: true }
}

// Helper function to create error responses
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      code,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: getSecurityHeaders()
    }
  )
}

// Helper function to create success responses
export function createSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    {
      status,
      headers: getSecurityHeaders()
    }
  )
}

// Additional exports for compatibility
export { checkRateLimit as rateLimit } from './security'
export const validateRequest = withSecurity
export const verifySupplierAuth = withAuth