/**
 * Enterprise Logging Middleware for RHY Supplier Portal
 * 
 * @fileoverview Comprehensive request/response logging middleware with advanced
 * features including correlation tracking, performance monitoring, security event
 * logging, and integration with the enterprise metrics system.
 * 
 * @author RHY Development Team
 * @version 1.0.0
 * @since 2025-06-24
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLogger, createRequestLogger, Logger } from '@/lib/logger'
import { trackAPICall, timer, counter, gauge, metrics } from '@/lib/metrics'
import { z } from 'zod'

const middlewareLogger = getLogger('middleware')

/**
 * Configuration for logging middleware
 * 
 * Comprehensive configuration interface for controlling all aspects
 * of request/response logging, performance monitoring, and security tracking.
 */
export interface LoggingConfig {
  /** Whether to log incoming requests */
  logRequests: boolean
  /** Whether to log outgoing responses */
  logResponses: boolean
  /** Whether to include request body in logs (use carefully for privacy) */
  logRequestBody: boolean
  /** Whether to include response body in logs (use carefully for privacy) */
  logResponseBody: boolean
  
  /** Enable performance tracking and timing */
  trackPerformance: boolean
  /** Performance alert thresholds */
  performanceThresholds: {
    /** Threshold for slow request warning (milliseconds) */
    slow: number
    /** Threshold for critical performance alert (milliseconds) */
    critical: number
  }
  
  /** Enable security event logging */
  logSecurityEvents: boolean
  /** Track failed authentication attempts */
  trackFailedAuth: boolean
  /** Enable suspicious activity detection */
  detectSuspiciousActivity: boolean
  
  /** Headers to mask in logs for privacy */
  sensitiveHeaders: string[]
  /** Whether to sanitize request/response bodies */
  sanitizeBody: boolean
  /** Field names to mask in bodies */
  maskFields: string[]
  
  /** Request paths to exclude from logging */
  excludePaths: string[]
  /** User agents to exclude from logging */
  excludeUserAgents: string[]
  /** Log levels for different response types */
  logLevels: {
    /** Log level for successful requests (2xx) */
    success: 'info' | 'debug'
    /** Log level for client errors (4xx) */
    clientError: 'warn' | 'error'
    /** Log level for server errors (5xx) */
    serverError: 'error' | 'fatal'
  }
  
  /** Enable correlation ID tracking */
  enableCorrelation: boolean
  /** Header name for correlation ID */
  correlationHeader: string
  
  /** Sampling rate for logging (0-1, where 1 = log all requests) */
  samplingRate: number
}

/**
 * Default logging configuration
 * 
 * Production-ready defaults with security and privacy considerations.
 * Adjust these settings based on your specific requirements.
 */
export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  logRequests: true,
  logResponses: true,
  logRequestBody: false, // Only enable for debugging
  logResponseBody: false, // Only enable for debugging
  
  trackPerformance: true,
  performanceThresholds: {
    slow: 1000, // 1 second
    critical: 5000 // 5 seconds
  },
  
  logSecurityEvents: true,
  trackFailedAuth: true,
  detectSuspiciousActivity: true,
  
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-session-token',
    'authentication'
  ],
  
  sanitizeBody: true,
  maskFields: [
    'password',
    'token',
    'secret',
    'key',
    'ssn',
    'creditcard',
    'cvv',
    'pin'
  ],
  
  excludePaths: [
    '/favicon.ico',
    '/robots.txt',
    '/_next/',
    '/static/',
    '/health',
    '/ping'
  ],
  
  excludeUserAgents: [
    'bot',
    'crawler',
    'spider',
    'monitoring'
  ],
  
  logLevels: {
    success: 'info',
    clientError: 'warn',
    serverError: 'error'
  },
  
  enableCorrelation: true,
  correlationHeader: 'x-correlation-id',
  
  samplingRate: 1.0 // Log all requests by default
}

/**
 * Request context for logging
 */
export interface RequestContext {
  requestId: string
  correlationId?: string
  method: string
  url: string
  userAgent?: string
  ipAddress: string
  userId?: string
  supplierId?: string
  warehouseId?: string
  sessionId?: string
  referer?: string
  startTime: number
  headers: Record<string, string>
  body?: any
  route?: string
  apiVersion?: string
}

/**
 * Response context for logging
 */
export interface ResponseContext {
  statusCode: number
  headers: Record<string, string>
  body?: any
  contentLength?: number
  responseTime: number
  errorCode?: string
  errorMessage?: string
  cacheStatus?: 'hit' | 'miss' | 'bypass'
}

/**
 * Security event context
 */
export interface SecurityEventContext {
  eventType: 'auth_failure' | 'suspicious_activity' | 'rate_limit' | 'injection_attempt' | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, any>
  threatIndicators?: string[]
  action?: 'block' | 'monitor' | 'alert'
}

/**
 * Performance metrics for requests
 */
export interface PerformanceMetrics {
  requestTime: number
  responseTime: number
  databaseTime?: number
  cacheTime?: number
  externalApiTime?: number
  memoryUsage?: number
  cpuUsage?: number
}

/**
 * Main logging middleware class
 */
export class LoggingMiddleware {
  private config: LoggingConfig
  private requestTimer = timer('http_request_duration', 'HTTP request duration')
  private requestCounter = counter('http_requests_total', 'Total HTTP requests')
  private errorCounter = counter('http_errors_total', 'HTTP errors')
  private securityEventCounter = counter('security_events_total', 'Security events')
  private activeRequestsGauge = gauge('http_active_requests', 'Active HTTP requests')

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = { ...DEFAULT_LOGGING_CONFIG, ...config }
  }

  /**
   * Main middleware function for Next.js
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    
    // Check if request should be logged
    if (!this.shouldLogRequest(request)) {
      return NextResponse.next()
    }

    // Generate request context
    const requestContext = this.createRequestContext(request, startTime)
    
    // Create request-scoped logger
    const requestLogger = createRequestLogger('api', requestContext.requestId, {
      correlationId: requestContext.correlationId,
      user: {
        userId: requestContext.userId,
        supplierId: requestContext.supplierId,
        sessionId: requestContext.sessionId,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent
      },
      request: {
        requestId: requestContext.requestId,
        method: requestContext.method,
        url: requestContext.url,
        headers: this.sanitizeHeaders(requestContext.headers)
      }
    })

    // Track active requests
    this.activeRequestsGauge.inc()

    try {
      // Log request if enabled
      if (this.config.logRequests) {
        await this.logRequest(requestLogger, requestContext)
      }

      // Process request and get response
      const response = await this.processRequest(request, requestContext, requestLogger)
      
      // Calculate response time
      const responseTime = Date.now() - startTime
      
      // Create response context
      const responseContext = this.createResponseContext(response, responseTime)
      
      // Log response if enabled
      if (this.config.logResponses) {
        await this.logResponse(requestLogger, requestContext, responseContext)
      }

      // Track performance metrics
      if (this.config.trackPerformance) {
        await this.trackPerformance(requestContext, responseContext)
      }

      // Check for security events
      if (this.config.logSecurityEvents) {
        await this.checkSecurityEvents(requestLogger, requestContext, responseContext)
      }

      // Add correlation headers to response
      if (this.config.enableCorrelation && requestContext.correlationId) {
        response.headers.set(this.config.correlationHeader, requestContext.correlationId)
        response.headers.set('x-request-id', requestContext.requestId)
      }

      return response

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      await this.logError(requestLogger, requestContext, error as Error, responseTime)
      
      // Re-throw error to be handled by Next.js
      throw error
      
    } finally {
      // Always decrement active requests
      this.activeRequestsGauge.dec()
    }
  }

  /**
   * Check if request should be logged based on configuration
   */
  private shouldLogRequest(request: NextRequest): boolean {
    const url = request.nextUrl
    const userAgent = request.headers.get('user-agent') || ''

    // Check sampling rate
    if (Math.random() > this.config.samplingRate) {
      return false
    }

    // Check excluded paths
    for (const excludePath of this.config.excludePaths) {
      if (url.pathname.startsWith(excludePath)) {
        return false
      }
    }

    // Check excluded user agents
    for (const excludeUserAgent of this.config.excludeUserAgents) {
      if (userAgent.toLowerCase().includes(excludeUserAgent.toLowerCase())) {
        return false
      }
    }

    return true
  }

  /**
   * Create request context from Next.js request
   */
  private createRequestContext(request: NextRequest, startTime: number): RequestContext {
    const url = request.nextUrl
    const headers = this.extractHeaders(request)
    
    // Generate or extract correlation ID
    let correlationId = request.headers.get(this.config.correlationHeader)
    if (!correlationId && this.config.enableCorrelation) {
      correlationId = this.generateCorrelationId()
    }

    // Extract IP address
    const ipAddress = this.extractIPAddress(request)
    
    // Extract user context from headers/cookies
    const { userId, supplierId, sessionId } = this.extractUserContext(request)

    return {
      requestId: this.generateRequestId(),
      correlationId,
      method: request.method,
      url: url.href,
      userAgent: headers['user-agent'],
      ipAddress,
      userId,
      supplierId,
      sessionId,
      referer: headers.referer,
      startTime,
      headers,
      route: this.extractRoute(url.pathname),
      apiVersion: headers['x-api-version']
    }
  }

  /**
   * Create response context
   */
  private createResponseContext(response: NextResponse, responseTime: number): ResponseContext {
    return {
      statusCode: response.status,
      headers: this.extractResponseHeaders(response),
      responseTime,
      contentLength: parseInt(response.headers.get('content-length') || '0', 10),
      cacheStatus: response.headers.get('x-cache-status') as any
    }
  }

  /**
   * Process the request and return response
   */
  private async processRequest(
    request: NextRequest, 
    context: RequestContext, 
    logger: Logger
  ): Promise<NextResponse> {
    // Log request body if enabled and safe
    if (this.config.logRequestBody && this.isBodyLoggingSafe(request)) {
      try {
        const body = await this.extractRequestBody(request)
        context.body = this.sanitizeBody(body)
      } catch (error) {
        logger.warn('Failed to extract request body', { error })
      }
    }

    // Continue with the request
    return NextResponse.next()
  }

  /**
   * Log the incoming request
   */
  private async logRequest(logger: Logger, context: RequestContext): Promise<void> {
    const message = `${context.method} ${context.url}`
    
    await logger.request(
      context.method,
      context.url,
      0, // Status not known yet
      0, // Response time not known yet
      {
        requestId: context.requestId,
        userId: context.userId,
        headers: this.sanitizeHeaders(context.headers),
        body: context.body,
        metadata: {
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          referer: context.referer,
          route: context.route,
          apiVersion: context.apiVersion
        }
      }
    )
  }

  /**
   * Log the response
   */
  private async logResponse(
    logger: Logger, 
    requestContext: RequestContext, 
    responseContext: ResponseContext
  ): Promise<void> {
    const logLevel = this.getLogLevel(responseContext.statusCode)
    const message = `${requestContext.method} ${requestContext.url} ${responseContext.statusCode} ${responseContext.responseTime}ms`

    await logger.request(
      requestContext.method,
      requestContext.url,
      responseContext.statusCode,
      responseContext.responseTime,
      {
        requestId: requestContext.requestId,
        userId: requestContext.userId,
        headers: this.sanitizeHeaders(responseContext.headers),
        body: responseContext.body,
        errorCode: responseContext.errorCode,
        metadata: {
          contentLength: responseContext.contentLength,
          cacheStatus: responseContext.cacheStatus,
          userAgent: requestContext.userAgent,
          ipAddress: requestContext.ipAddress
        }
      }
    )

    // Track metrics
    this.requestCounter.inc({
      method: requestContext.method,
      endpoint: requestContext.route || requestContext.url,
      status: responseContext.statusCode.toString(),
      warehouse: requestContext.warehouseId
    })

    this.requestTimer.observe(responseContext.responseTime, {
      method: requestContext.method,
      endpoint: requestContext.route || requestContext.url
    })

    // Track errors
    if (responseContext.statusCode >= 400) {
      this.errorCounter.inc({
        endpoint: requestContext.route || requestContext.url,
        error_code: responseContext.statusCode.toString(),
        method: requestContext.method
      })
    }
  }

  /**
   * Log errors
   */
  private async logError(
    logger: Logger,
    requestContext: RequestContext,
    error: Error,
    responseTime: number
  ): Promise<void> {
    await logger.error(
      `Request failed: ${requestContext.method} ${requestContext.url}`,
      error,
      {
        request: {
          requestId: requestContext.requestId,
          method: requestContext.method,
          url: requestContext.url,
          responseTime
        },
        user: {
          userId: requestContext.userId,
          supplierId: requestContext.supplierId,
          ipAddress: requestContext.ipAddress
        },
        metadata: {
          userAgent: requestContext.userAgent,
          route: requestContext.route
        }
      }
    )

    // Track error metrics
    this.errorCounter.inc({
      endpoint: requestContext.route || requestContext.url,
      error_code: 'EXCEPTION',
      method: requestContext.method
    })
  }

  /**
   * Track performance metrics
   */
  private async trackPerformance(
    requestContext: RequestContext,
    responseContext: ResponseContext
  ): Promise<void> {
    // Track API call performance
    trackAPICall(
      requestContext.method,
      requestContext.route || requestContext.url,
      responseContext.responseTime,
      responseContext.statusCode
    )

    // Check performance thresholds
    if (responseContext.responseTime > this.config.performanceThresholds.critical) {
      middlewareLogger.warn('Critical response time detected', {
        performance: {
          operationType: 'api_request',
          duration: responseContext.responseTime
        },
        request: {
          requestId: requestContext.requestId,
          method: requestContext.method,
          url: requestContext.url
        },
        metadata: {
          threshold: this.config.performanceThresholds.critical
        },
        tags: ['PERFORMANCE', 'CRITICAL']
      })
    } else if (responseContext.responseTime > this.config.performanceThresholds.slow) {
      middlewareLogger.info('Slow response time detected', {
        performance: {
          operationType: 'api_request',
          duration: responseContext.responseTime
        },
        request: {
          requestId: requestContext.requestId,
          method: requestContext.method,
          url: requestContext.url
        },
        metadata: {
          threshold: this.config.performanceThresholds.slow
        },
        tags: ['PERFORMANCE', 'SLOW']
      })
    }
  }

  /**
   * Check for security events
   */
  private async checkSecurityEvents(
    logger: Logger,
    requestContext: RequestContext,
    responseContext: ResponseContext
  ): Promise<void> {
    // Track authentication failures
    if (this.config.trackFailedAuth && this.isAuthFailure(requestContext, responseContext)) {
      await this.logSecurityEvent(logger, requestContext, {
        eventType: 'auth_failure',
        severity: 'medium',
        details: {
          statusCode: responseContext.statusCode,
          endpoint: requestContext.url
        }
      })
    }

    // Detect suspicious activity
    if (this.config.detectSuspiciousActivity) {
      const suspiciousIndicators = this.detectSuspiciousActivity(requestContext, responseContext)
      if (suspiciousIndicators.length > 0) {
        await this.logSecurityEvent(logger, requestContext, {
          eventType: 'suspicious_activity',
          severity: 'high',
          details: {
            indicators: suspiciousIndicators,
            statusCode: responseContext.statusCode
          },
          threatIndicators: suspiciousIndicators
        })
      }
    }

    // Check for injection attempts
    const injectionAttempt = this.detectInjectionAttempt(requestContext)
    if (injectionAttempt) {
      await this.logSecurityEvent(logger, requestContext, {
        eventType: 'injection_attempt',
        severity: 'critical',
        details: {
          suspectedPayload: injectionAttempt.payload,
          injectionType: injectionAttempt.type
        },
        threatIndicators: [injectionAttempt.type],
        action: 'block'
      })
    }
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(
    logger: Logger,
    requestContext: RequestContext,
    securityContext: SecurityEventContext
  ): Promise<void> {
    await logger.security(
      securityContext.eventType,
      `Security event: ${securityContext.eventType}`,
      securityContext.severity,
      {
        userId: requestContext.userId,
        threatIndicators: securityContext.threatIndicators,
        countermeasures: securityContext.action ? [securityContext.action] : undefined,
        metadata: {
          ...securityContext.details,
          ipAddress: requestContext.ipAddress,
          userAgent: requestContext.userAgent,
          url: requestContext.url,
          method: requestContext.method
        }
      }
    )

    // Track security metrics
    this.securityEventCounter.inc({
      type: securityContext.eventType,
      severity: securityContext.severity,
      warehouse: requestContext.warehouseId
    })
  }

  /**
   * Utility methods
   */

  private generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now().toString(36)
  }

  private generateCorrelationId(): string {
    return 'corr_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now().toString(36)
  }

  private extractHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
    return headers
  }

  private extractResponseHeaders(response: NextResponse): Record<string, string> {
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })
    return headers
  }

  private extractIPAddress(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-client-ip') ||
      'unknown'
    )
  }

  private extractUserContext(request: NextRequest): {
    userId?: string
    supplierId?: string
    sessionId?: string
  } {
    // Extract from JWT tokens or session cookies
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('rhy_session')?.value
    
    // This would normally decode JWT tokens to extract user info
    // For now, return placeholder extraction
    return {
      userId: request.headers.get('x-user-id') || undefined,
      supplierId: request.headers.get('x-supplier-id') || undefined,
      sessionId: sessionCookie || undefined
    }
  }

  private extractRoute(pathname: string): string {
    // Extract API route pattern
    const apiMatch = pathname.match(/^\/api\/([^\/]+)/)
    if (apiMatch) {
      return `/api/${apiMatch[1]}`
    }
    return pathname
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(headers)) {
      if (this.config.sensitiveHeaders.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  private sanitizeBody(body: any): any {
    if (!this.config.sanitizeBody || !body || typeof body !== 'object') {
      return body
    }

    const sanitized = { ...body }
    
    for (const field of this.config.maskFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  private async extractRequestBody(request: NextRequest): Promise<any> {
    try {
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        return await request.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        const body: Record<string, any> = {}
        formData.forEach((value, key) => {
          body[key] = value
        })
        return body
      } else if (contentType.includes('text/')) {
        return await request.text()
      }
      
      return null
    } catch {
      return null
    }
  }

  private isBodyLoggingSafe(request: NextRequest): boolean {
    const contentType = request.headers.get('content-type') || ''
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    
    // Don't log large bodies or binary content
    return (
      contentLength < 10000 && // Less than 10KB
      (contentType.includes('application/json') || 
       contentType.includes('application/x-www-form-urlencoded') ||
       contentType.includes('text/'))
    )
  }

  private getLogLevel(statusCode: number): 'info' | 'warn' | 'error' {
    if (statusCode >= 500) {
      return this.config.logLevels.serverError
    } else if (statusCode >= 400) {
      return this.config.logLevels.clientError
    } else {
      return this.config.logLevels.success
    }
  }

  private isAuthFailure(requestContext: RequestContext, responseContext: ResponseContext): boolean {
    return (
      (requestContext.url.includes('/auth/') || requestContext.url.includes('/login')) &&
      (responseContext.statusCode === 401 || responseContext.statusCode === 403)
    )
  }

  private detectSuspiciousActivity(
    requestContext: RequestContext, 
    responseContext: ResponseContext
  ): string[] {
    const indicators: string[] = []

    // Multiple error responses
    if (responseContext.statusCode >= 400) {
      indicators.push('error_response')
    }

    // Suspicious user agent
    const userAgent = requestContext.userAgent?.toLowerCase() || ''
    if (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('scanner')) {
      indicators.push('suspicious_user_agent')
    }

    // High frequency requests (would need rate limiting data)
    // This would be implemented with Redis or in-memory tracking

    // Unusual request patterns
    if (requestContext.url.includes('..') || requestContext.url.includes('%2e%2e')) {
      indicators.push('path_traversal_attempt')
    }

    return indicators
  }

  private detectInjectionAttempt(requestContext: RequestContext): {
    type: string
    payload: string
  } | null {
    const url = requestContext.url.toLowerCase()
    const body = JSON.stringify(requestContext.body || {}).toLowerCase()
    
    // SQL injection patterns
    const sqlPatterns = [
      'union select',
      'drop table',
      'insert into',
      'delete from',
      'update set',
      '1=1',
      '1 or 1',
      'sleep(',
      'waitfor delay'
    ]

    for (const pattern of sqlPatterns) {
      if (url.includes(pattern) || body.includes(pattern)) {
        return {
          type: 'sql_injection',
          payload: pattern
        }
      }
    }

    // XSS patterns
    const xssPatterns = [
      '<script',
      'javascript:',
      'onload=',
      'onerror=',
      'onclick=',
      'eval(',
      'alert('
    ]

    for (const pattern of xssPatterns) {
      if (url.includes(pattern) || body.includes(pattern)) {
        return {
          type: 'xss_attempt',
          payload: pattern
        }
      }
    }

    return null
  }
}

/**
 * Create logging middleware with custom configuration
 */
export function createLoggingMiddleware(config?: Partial<LoggingConfig>): LoggingMiddleware {
  return new LoggingMiddleware(config)
}

/**
 * Default logging middleware instance
 */
export const loggingMiddleware = new LoggingMiddleware()

/**
 * Convenience function for Next.js middleware
 */
export async function withLogging(
  request: NextRequest,
  config?: Partial<LoggingConfig>
): Promise<NextResponse> {
  const middleware = config ? createLoggingMiddleware(config) : loggingMiddleware
  return middleware.middleware(request)
}

/**
 * Enhanced logging middleware with custom handlers
 */
export function withAdvancedLogging(
  handlers: {
    onRequest?: (context: RequestContext) => void | Promise<void>
    onResponse?: (requestContext: RequestContext, responseContext: ResponseContext) => void | Promise<void>
    onError?: (requestContext: RequestContext, error: Error) => void | Promise<void>
    onSecurityEvent?: (requestContext: RequestContext, securityContext: SecurityEventContext) => void | Promise<void>
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const middleware = new LoggingMiddleware()
    
    // Add custom handlers here if needed
    // This could be extended to support middleware composition
    
    return middleware.middleware(request)
  }
}

// Export types for external use
export type {
  LoggingConfig,
  RequestContext,
  ResponseContext,
  SecurityEventContext,
  PerformanceMetrics
}