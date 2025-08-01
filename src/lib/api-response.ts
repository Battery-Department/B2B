/**
 * RHY Supplier Portal - API Response Infrastructure
 * Enterprise-grade standardized response handling for multi-warehouse operations
 * Implements comprehensive error tracking, audit logging, and performance monitoring
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Core response types for type safety
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
    timestamp: string
    traceId?: string
    field?: string
  }
  metadata?: {
    timestamp: string
    version: string
    warehouse?: string
    region?: string
    requestId?: string
    processingTime?: number
    rateLimit?: {
      remaining: number
      resetTime: string
      limit: number
    }
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Enterprise error codes for consistent error handling
export enum APIErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_VALUE = 'DUPLICATE_VALUE',
  
  // Business Logic
  WAREHOUSE_ACCESS_DENIED = 'WAREHOUSE_ACCESS_DENIED',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  ORDER_LIMIT_EXCEEDED = 'ORDER_LIMIT_EXCEEDED',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Unknown
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// HTTP status code mappings for consistent responses
export const STATUS_CODES = {
  [APIErrorCode.AUTH_REQUIRED]: 401,
  [APIErrorCode.AUTH_INVALID]: 401,
  [APIErrorCode.AUTH_EXPIRED]: 401,
  [APIErrorCode.PERMISSION_DENIED]: 403,
  [APIErrorCode.ACCOUNT_LOCKED]: 423,
  [APIErrorCode.MFA_REQUIRED]: 403,
  [APIErrorCode.VALIDATION_ERROR]: 400,
  [APIErrorCode.MISSING_FIELD]: 400,
  [APIErrorCode.INVALID_FORMAT]: 400,
  [APIErrorCode.DUPLICATE_VALUE]: 409,
  [APIErrorCode.WAREHOUSE_ACCESS_DENIED]: 403,
  [APIErrorCode.INSUFFICIENT_INVENTORY]: 409,
  [APIErrorCode.ORDER_LIMIT_EXCEEDED]: 429,
  [APIErrorCode.COMPLIANCE_VIOLATION]: 422,
  [APIErrorCode.DATABASE_ERROR]: 500,
  [APIErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [APIErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [APIErrorCode.MAINTENANCE_MODE]: 503,
  [APIErrorCode.NOT_FOUND]: 404,
  [APIErrorCode.ALREADY_EXISTS]: 409,
  [APIErrorCode.RESOURCE_LOCKED]: 423,
  [APIErrorCode.QUOTA_EXCEEDED]: 429,
  [APIErrorCode.INTERNAL_ERROR]: 500,
  [APIErrorCode.UNKNOWN_ERROR]: 500
} as const

// Security headers for enterprise compliance
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
} as const

// Performance monitoring interface
interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  memoryUsage?: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
}

// Request context for audit logging
interface RequestContext {
  warehouse?: string
  region?: string
  supplierId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  endpoint?: string
  method?: string
}

// Audit logging function for compliance
async function logAPIEvent(
  event: string,
  success: boolean,
  context: RequestContext,
  details?: any,
  performanceMetrics?: PerformanceMetrics
): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      success,
      context,
      details,
      performanceMetrics,
      environment: process.env.NODE_ENV || 'unknown'
    }

    // In production, this would integrate with enterprise logging service
    if (process.env.NODE_ENV === 'development') {
      console.log('API Audit Log:', JSON.stringify(logEntry, null, 2))
    }

    // TODO: Integrate with enterprise logging service (Datadog, Splunk, etc.)
    // await enterpriseLogger.log(logEntry)
  } catch (error) {
    console.error('Failed to log API event:', error)
  }
}

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `rhy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get memory usage for performance monitoring
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage()
  }
  return undefined
}

// Success response builder with enterprise features
export function createSuccessResponse<T>(
  data: T,
  options: {
    status?: number
    warehouse?: string
    region?: string
    requestId?: string
    processingTime?: number
    pagination?: APIResponse<T>['pagination']
    rateLimit?: APIResponse<T>['metadata']['rateLimit']
    context?: RequestContext
  } = {}
): NextResponse<APIResponse<T>> {
  const requestId = options.requestId || generateRequestId()
  const timestamp = new Date().toISOString()

  const response: APIResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp,
      version: '1.0.0',
      warehouse: options.warehouse,
      region: options.region,
      requestId,
      processingTime: options.processingTime,
      rateLimit: options.rateLimit
    },
    pagination: options.pagination
  }

  // Log successful API response
  if (options.context) {
    logAPIEvent('API_SUCCESS', true, {
      ...options.context,
      requestId
    }, {
      status: options.status || 200,
      dataSize: JSON.stringify(data).length
    })
  }

  return NextResponse.json(response, {
    status: options.status || 200,
    headers: {
      ...SECURITY_HEADERS,
      'X-Request-ID': requestId,
      'X-Processing-Time': options.processingTime?.toString() || '0'
    }
  })
}

// Error response builder with comprehensive error handling
export function createErrorResponse(
  message: string,
  code: APIErrorCode = APIErrorCode.UNKNOWN_ERROR,
  options: {
    details?: any
    field?: string
    traceId?: string
    warehouse?: string
    region?: string
    requestId?: string
    context?: RequestContext
    originalError?: Error
  } = {}
): NextResponse<APIResponse<never>> {
  const requestId = options.requestId || generateRequestId()
  const timestamp = new Date().toISOString()
  const status = STATUS_CODES[code] || 500

  const response: APIResponse<never> = {
    success: false,
    error: {
      message,
      code,
      details: options.details,
      timestamp,
      traceId: options.traceId || requestId,
      field: options.field
    },
    metadata: {
      timestamp,
      version: '1.0.0',
      warehouse: options.warehouse,
      region: options.region,
      requestId
    }
  }

  // Log error for monitoring and debugging
  if (options.context) {
    logAPIEvent('API_ERROR', false, {
      ...options.context,
      requestId
    }, {
      errorCode: code,
      errorMessage: message,
      errorDetails: options.details,
      originalError: options.originalError?.message,
      status
    })
  }

  // Enhanced error logging for development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      code,
      message,
      details: options.details,
      originalError: options.originalError,
      context: options.context
    })
  }

  return NextResponse.json(response, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'X-Request-ID': requestId,
      'X-Error-Code': code
    }
  })
}

// Validation error handler for Zod integration
export function createValidationErrorResponse(
  error: ZodError,
  options: {
    warehouse?: string
    region?: string
    requestId?: string
    context?: RequestContext
  } = {}
): NextResponse<APIResponse<never>> {
  const firstError = error.errors[0]
  const field = firstError?.path?.join('.') || 'unknown'
  
  return createErrorResponse(
    firstError?.message || 'Validation failed',
    APIErrorCode.VALIDATION_ERROR,
    {
      ...options,
      field,
      details: {
        validationErrors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
  )
}

// Database error handler
export function createDatabaseErrorResponse(
  error: Error,
  options: {
    warehouse?: string
    region?: string
    requestId?: string
    context?: RequestContext
  } = {}
): NextResponse<APIResponse<never>> {
  // Don't expose internal database errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Database operation failed'
    : `Database error: ${error.message}`

  return createErrorResponse(
    message,
    APIErrorCode.DATABASE_ERROR,
    {
      ...options,
      originalError: error,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    }
  )
}

// Rate limit error handler
export function createRateLimitErrorResponse(
  remaining: number,
  resetTime: Date,
  limit: number,
  options: {
    warehouse?: string
    region?: string
    requestId?: string
    context?: RequestContext
  } = {}
): NextResponse<APIResponse<never>> {
  const response = createErrorResponse(
    'Rate limit exceeded',
    APIErrorCode.RATE_LIMIT_EXCEEDED,
    {
      ...options,
      details: {
        remaining,
        resetTime: resetTime.toISOString(),
        limit
      }
    }
  )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000).toString())
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('Retry-After', Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString())

  return response
}

// Paginated response builder
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  options: {
    warehouse?: string
    region?: string
    requestId?: string
    processingTime?: number
    context?: RequestContext
  } = {}
): NextResponse<APIResponse<T[]>> {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return createSuccessResponse(data, {
    ...options,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    }
  })
}

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context: RequestContext
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now()
    const memoryBefore = getMemoryUsage()
    
    try {
      const result = await handler(...args)
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Add performance headers
      result.headers.set('X-Processing-Time', processingTime.toFixed(2))
      
      // Log performance metrics
      await logAPIEvent('API_PERFORMANCE', true, context, {
        processingTime,
        memoryBefore,
        memoryAfter: getMemoryUsage()
      })
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      await logAPIEvent('API_PERFORMANCE_ERROR', false, context, {
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        memoryBefore,
        memoryAfter: getMemoryUsage()
      })
      
      throw error
    }
  }) as T
}

// Warehouse context builder for multi-warehouse operations
export function createWarehouseContext(
  warehouse: string,
  region: string,
  supplierId?: string
): RequestContext {
  return {
    warehouse,
    region,
    supplierId,
    requestId: generateRequestId()
  }
}

// Enterprise compliance headers
export function getComplianceHeaders(region: string): Record<string, string> {
  const baseHeaders = { ...SECURITY_HEADERS }
  
  // Regional compliance adjustments
  switch (region) {
    case 'EU':
      baseHeaders['X-GDPR-Compliant'] = 'true'
      break
    case 'US':
      baseHeaders['X-OSHA-Compliant'] = 'true'
      break
    case 'JP':
      baseHeaders['X-JIS-Compliant'] = 'true'
      break
    case 'AU':
      baseHeaders['X-AU-Standards-Compliant'] = 'true'
      break
  }
  
  return baseHeaders
}

// Export all response builders and utilities
export {
  logAPIEvent,
  generateRequestId,
  getMemoryUsage,
  SECURITY_HEADERS
}