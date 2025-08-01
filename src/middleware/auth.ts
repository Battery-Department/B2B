/**
 * Authentication Middleware - Production Ready
 * Provides authentication verification for API routes
 */

import { NextRequest } from 'next/server'
import { authService } from '@/services/auth/AuthService'

export interface AuthContext {
  isAuthenticated: boolean
  user?: {
    id: string
    email?: string
    role: string
  }
  session?: {
    id: string
    expiresAt: Date
    isValid: boolean
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean
  allowedRoles?: string[]
  skipVerification?: boolean
}

/**
 * Extract bearer token from request headers
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove "Bearer " prefix
}

/**
 * Verify authentication token and return auth context
 */
export async function verifyAuth(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<{ success: boolean; context?: AuthContext; response?: Response }> {
  
  // Skip verification if requested (for public endpoints)
  if (options.skipVerification) {
    return {
      success: true,
      context: {
        isAuthenticated: false
      }
    }
  }

  const token = extractBearerToken(request)

  // Handle missing token
  if (!token) {
    if (options.required !== false) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            success: false,
            error: 'Authentication required',
            message: 'Missing or invalid authorization token'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return {
      success: true,
      context: {
        isAuthenticated: false
      }
    }
  }

  try {
    // Validate session using auth service
    const sessionResult = await authService.validateSession(token, {
      checkExpiry: true,
      updateLastActivity: true
    })

    if (!sessionResult.valid) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid session',
            message: 'Session has expired or is invalid'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Check user role permissions if specified
    if (options.allowedRoles && sessionResult.metadata?.role) {
      const userRole = sessionResult.metadata.role
      if (!options.allowedRoles.includes(userRole)) {
        return {
          success: false,
          response: new Response(
            JSON.stringify({
              success: false,
              error: 'Insufficient permissions',
              message: 'User role not authorized for this endpoint'
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }
    }

    // Build auth context
    const authContext: AuthContext = {
      isAuthenticated: true,
      user: {
        id: sessionResult.metadata?.userId || '',
        email: sessionResult.metadata?.email,
        role: sessionResult.metadata?.role || 'user'
      },
      session: {
        id: sessionResult.sessionId || '',
        expiresAt: sessionResult.expiresAt || new Date(),
        isValid: sessionResult.valid
      }
    }

    return {
      success: true,
      context: authContext
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication error',
          message: 'Unable to verify authentication'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await verifyAuth(request, options)
    
    if (!authResult.success) {
      return authResult.response!
    }

    return handler(request, authResult.context!)
  }
}

/**
 * Role-based access control middleware
 */
export function withRole(
  allowedRoles: string[],
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withAuth(handler, { required: true, allowedRoles })
}

/**
 * Admin-only middleware
 */
export function withAdmin(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withRole(['admin', 'super_admin'], handler)
}

/**
 * Supplier-only middleware
 */
export function withSupplier(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withRole(['supplier', 'admin', 'super_admin'], handler)
}

/**
 * Customer or higher middleware
 */
export function withCustomer(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withRole(['customer', 'supplier', 'admin', 'super_admin'], handler)
}

/**
 * Public endpoint (no authentication required)
 */
export function withPublic(
  handler: (request: NextRequest, context?: AuthContext) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await verifyAuth(request, { 
      required: false, 
      skipVerification: false 
    })
    
    // Always succeed for public endpoints, but provide context if available
    return handler(request, authResult.context)
  }
}

export type { AuthMiddlewareOptions }

// Additional exports for compatibility
export const validateAuth = verifyAuth