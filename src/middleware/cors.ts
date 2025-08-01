/**
 * RHY Supplier Portal - CORS Middleware
 * Enterprise-grade Cross-Origin Resource Sharing configuration
 * Implements multi-warehouse, multi-region CORS policies with security controls
 */

import { NextRequest, NextResponse } from 'next/server'
import { logAPIEvent } from '@/lib/api-response'

// CORS configuration interface
export interface CORSConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
  preflightContinue: boolean
  optionsSuccessStatus: number
}

// Regional CORS configurations for multi-warehouse operations
const REGIONAL_CORS_CONFIGS: Record<string, CORSConfig> = {
  // US West Coast warehouse
  US_WEST: {
    allowedOrigins: [
      'https://rhy-supplier-portal.com',
      'https://supplier.rhy-batteries.com',
      'https://us-west.rhy-portal.com',
      'https://*.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'X-Warehouse',
      'X-Supplier-ID',
      'X-Request-ID',
      'X-Client-Version',
      'X-Device-ID',
      'X-Timezone',
      'Cache-Control'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Processing-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Warehouse',
      'X-Region',
      'X-Version',
      'X-Pagination-Total',
      'X-Pagination-Page'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Japan warehouse with specific compliance requirements
  JAPAN: {
    allowedOrigins: [
      'https://jp.rhy-supplier-portal.com',
      'https://supplier-jp.rhy-batteries.com',
      'https://japan.rhy-portal.com',
      'https://*.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'X-Warehouse',
      'X-Supplier-ID',
      'X-Request-ID',
      'X-Client-Version',
      'X-Device-ID',
      'X-Timezone',
      'X-JIS-Compliance',
      'Cache-Control'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Processing-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Warehouse',
      'X-Region',
      'X-Version',
      'X-JIS-Compliant',
      'X-Pagination-Total',
      'X-Pagination-Page'
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // EU warehouse with GDPR compliance
  EU: {
    allowedOrigins: [
      'https://eu.rhy-supplier-portal.com',
      'https://supplier-eu.rhy-batteries.com',
      'https://europe.rhy-portal.com',
      'https://*.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'X-Warehouse',
      'X-Supplier-ID',
      'X-Request-ID',
      'X-Client-Version',
      'X-Device-ID',
      'X-Timezone',
      'X-GDPR-Consent',
      'Cache-Control'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Processing-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Warehouse',
      'X-Region',
      'X-Version',
      'X-GDPR-Compliant',
      'X-Pagination-Total',
      'X-Pagination-Page'
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Australia warehouse
  AUSTRALIA: {
    allowedOrigins: [
      'https://au.rhy-supplier-portal.com',
      'https://supplier-au.rhy-batteries.com',
      'https://australia.rhy-portal.com',
      'https://*.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'X-Warehouse',
      'X-Supplier-ID',
      'X-Request-ID',
      'X-Client-Version',
      'X-Device-ID',
      'X-Timezone',
      'X-AU-Standards',
      'Cache-Control'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Processing-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Warehouse',
      'X-Region',
      'X-Version',
      'X-AU-Standards-Compliant',
      'X-Pagination-Total',
      'X-Pagination-Page'
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Default/development configuration
  DEFAULT: {
    allowedOrigins: [
      'https://*.rhy-portal.com',
      'https://*.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'X-Warehouse',
      'X-Supplier-ID',
      'X-Request-ID',
      'X-Client-Version',
      'X-Device-ID',
      'X-Timezone',
      'Cache-Control'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Processing-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Warehouse',
      'X-Region',
      'X-Version',
      'X-Pagination-Total',
      'X-Pagination-Page'
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
}

// Security patterns for origin validation
const SECURITY_PATTERNS = {
  // Block suspicious patterns
  BLOCKED_PATTERNS: [
    /.*\.onion$/i,           // Tor domains
    /.*\.bit$/i,             // Namecoin domains
    /localhost:\d{5,}$/i,    // High port localhost
    /\d+\.\d+\.\d+\.\d+$/,   // Raw IP addresses (except localhost)
    /.*\.local$/i,           // Local development domains
    /.*debug.*/i,            // Debug environments
    /.*test.*/i              // Test environments in production
  ],

  // Allow trusted development patterns
  DEVELOPMENT_PATTERNS: [
    /^http:\/\/localhost:(3000|3001|8080)$/,
    /^http:\/\/127\.0\.0\.1:(3000|3001|8080)$/,
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/
  ]
}

// Origin validation with security checks
function validateOrigin(origin: string, warehouse: string, isDevelopment: boolean): boolean {
  if (!origin) return false

  // Get appropriate CORS config
  const config = REGIONAL_CORS_CONFIGS[warehouse] || REGIONAL_CORS_CONFIGS.DEFAULT

  // In production, block development patterns
  if (!isDevelopment) {
    const isDevelopmentOrigin = SECURITY_PATTERNS.DEVELOPMENT_PATTERNS.some(pattern => 
      pattern.test(origin)
    )
    if (isDevelopmentOrigin && !origin.includes('.vercel.app')) {
      return false
    }
  }

  // Block suspicious patterns
  const isSuspicious = SECURITY_PATTERNS.BLOCKED_PATTERNS.some(pattern => 
    pattern.test(origin)
  )
  if (isSuspicious) {
    return false
  }

  // Check against allowed origins (supports wildcards)
  return config.allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*')
      return new RegExp(`^${pattern}$`).test(origin)
    }
    return allowed === origin
  })
}

// Get warehouse from request context
function getWarehouseFromRequest(request: NextRequest): string {
  // Try header first
  const warehouseHeader = request.headers.get('X-Warehouse')
  if (warehouseHeader) return warehouseHeader

  // Try subdomain detection
  const host = request.headers.get('host') || ''
  if (host.includes('us-west') || host.includes('usa')) return 'US_WEST'
  if (host.includes('jp') || host.includes('japan')) return 'JAPAN'
  if (host.includes('eu') || host.includes('europe')) return 'EU'
  if (host.includes('au') || host.includes('australia')) return 'AUSTRALIA'

  // Default fallback
  return 'DEFAULT'
}

// Main CORS middleware function
export async function withCORS(
  request: NextRequest,
  options: {
    warehouse?: string
    allowCustomOrigin?: boolean
    strictMode?: boolean
  } = {}
): Promise<{
  success: boolean
  response?: NextResponse
  corsHeaders?: Record<string, string>
}> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const warehouse = options.warehouse || getWarehouseFromRequest(request)
  const config = REGIONAL_CORS_CONFIGS[warehouse] || REGIONAL_CORS_CONFIGS.DEFAULT
  
  const origin = request.headers.get('origin')
  const method = request.method
  const requestHeaders = request.headers.get('access-control-request-headers')

  // Prepare CORS headers
  const corsHeaders: Record<string, string> = {}

  // Handle preflight requests (OPTIONS)
  if (method === 'OPTIONS') {
    // Validate origin for preflight
    if (origin && !validateOrigin(origin, warehouse, isDevelopment)) {
      await logAPIEvent('CORS_PREFLIGHT_ORIGIN_REJECTED', false, {
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        warehouse,
        endpoint: request.nextUrl.pathname,
        method: request.method
      }, {
        origin,
        reason: 'Origin not allowed for warehouse'
      })

      return {
        success: false,
        response: new NextResponse(null, {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': 'null',
            'Content-Type': 'text/plain'
          }
        })
      }
    }

    // Set preflight headers
    if (origin && validateOrigin(origin, warehouse, isDevelopment)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin
    }
    
    corsHeaders['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ')
    corsHeaders['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ')
    corsHeaders['Access-Control-Max-Age'] = config.maxAge.toString()
    
    if (config.credentials) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true'
    }

    // Log successful preflight
    await logAPIEvent('CORS_PREFLIGHT_SUCCESS', true, {
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      warehouse,
      endpoint: request.nextUrl.pathname,
      method: request.method
    }, {
      origin,
      requestedHeaders: requestHeaders
    })

    return {
      success: true,
      response: new NextResponse(null, {
        status: config.optionsSuccessStatus,
        headers: corsHeaders
      }),
      corsHeaders
    }
  }

  // Handle actual requests
  if (origin) {
    if (!validateOrigin(origin, warehouse, isDevelopment)) {
      await logAPIEvent('CORS_ORIGIN_REJECTED', false, {
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        warehouse,
        endpoint: request.nextUrl.pathname,
        method: request.method
      }, {
        origin,
        reason: 'Origin not allowed for warehouse'
      })

      return {
        success: false,
        response: new NextResponse(
          JSON.stringify({ error: 'CORS policy violation' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': 'null'
            }
          }
        )
      }
    }

    // Set response headers for allowed origins
    corsHeaders['Access-Control-Allow-Origin'] = origin
    corsHeaders['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ')
    
    if (config.credentials) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true'
    }

    // Add security headers
    corsHeaders['Vary'] = 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
    corsHeaders['X-Content-Type-Options'] = 'nosniff'
    corsHeaders['X-Frame-Options'] = 'DENY'
  }

  // Log successful CORS validation
  await logAPIEvent('CORS_VALIDATION_SUCCESS', true, {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    warehouse,
    endpoint: request.nextUrl.pathname,
    method: request.method
  }, {
    origin,
    corsHeadersSet: Object.keys(corsHeaders)
  })

  return {
    success: true,
    corsHeaders
  }
}

// Apply CORS headers to an existing response
export function applyCORSHeaders(
  response: NextResponse,
  corsHeaders: Record<string, string>
): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Validate if a request is from an allowed origin
export function isOriginAllowed(
  origin: string,
  warehouse: string = 'DEFAULT'
): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return validateOrigin(origin, warehouse, isDevelopment)
}

// Get CORS configuration for a specific warehouse
export function getCORSConfig(warehouse: string): CORSConfig {
  return REGIONAL_CORS_CONFIGS[warehouse] || REGIONAL_CORS_CONFIGS.DEFAULT
}

// Create a CORS-enabled response
export function createCORSResponse(
  data: any,
  status: number = 200,
  warehouse: string = 'DEFAULT',
  origin?: string
): NextResponse {
  const config = getCORSConfig(warehouse)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (origin && isOriginAllowed(origin, warehouse)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ')
    
    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }
  }

  return NextResponse.json(data, {
    status,
    headers
  })
}

// Enterprise CORS audit logging
export async function auditCORSViolation(
  request: NextRequest,
  violation: {
    type: 'ORIGIN_BLOCKED' | 'METHOD_NOT_ALLOWED' | 'HEADER_NOT_ALLOWED'
    origin?: string
    method?: string
    header?: string
    warehouse: string
  }
): Promise<void> {
  await logAPIEvent('CORS_SECURITY_VIOLATION', false, {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    warehouse: violation.warehouse,
    endpoint: request.nextUrl.pathname,
    method: request.method
  }, violation)
}

// Export utilities and configurations
export {
  REGIONAL_CORS_CONFIGS,
  SECURITY_PATTERNS,
  validateOrigin,
  getWarehouseFromRequest
}