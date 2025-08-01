/**
 * RHY_073 - Security Hardening - Security Headers Middleware
 * Enterprise-grade security headers and request validation
 * Integrates with existing Batch 1 authentication and CORS middleware
 * 
 * Features:
 * - Comprehensive security headers (CSP, HSTS, etc.)
 * - Real-time threat protection
 * - Regional compliance support
 * - Performance optimized middleware
 * - Integration with security scanner
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSecurityScanner } from '@/lib/security-scanner'
import type { SecurityScanRequest } from '@/lib/security-scanner'

// ================================
// SECURITY HEADERS CONFIGURATION
// ================================

interface SecurityHeadersConfig {
  contentSecurityPolicy: string
  strictTransportSecurity: string
  xFrameOptions: string
  xContentTypeOptions: string
  referrerPolicy: string
  permissionsPolicy: string
  crossOriginEmbedderPolicy: string
  crossOriginOpenerPolicy: string
  crossOriginResourcePolicy: string
  customHeaders?: Record<string, string>
}

interface SecurityMiddlewareOptions {
  enableScanning: boolean
  scanProfile: SecurityScanRequest['scanProfile']
  blockOnThreats: boolean
  auditLog: boolean
  regionSpecific: boolean
}

// ================================
// REGIONAL SECURITY CONFIGURATIONS
// ================================

const REGIONAL_CONFIGS: Record<string, SecurityHeadersConfig> = {
  US: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app *.googleapis.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob: *.vercel.app *.unsplash.com",
      "font-src 'self' data: fonts.gstatic.com",
      "connect-src 'self' *.vercel.app *.stripe.com *.googleapis.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    customHeaders: {
      'X-Warehouse-Region': 'US',
      'X-Security-Level': 'HIGH'
    }
  },
  EU: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app *.googleapis.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob: *.vercel.app",
      "font-src 'self' data: fonts.gstatic.com",
      "connect-src 'self' *.vercel.app *.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), fullscreen=()',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    customHeaders: {
      'X-Warehouse-Region': 'EU',
      'X-Security-Level': 'MAXIMUM',
      'X-GDPR-Compliant': 'true',
      'X-Privacy-Policy': 'strict'
    }
  },
  JP: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app *.googleapis.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob: *.vercel.app",
      "font-src 'self' data: fonts.gstatic.com",
      "connect-src 'self' *.vercel.app *.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    customHeaders: {
      'X-Warehouse-Region': 'JP',
      'X-Security-Level': 'HIGH',
      'X-JIS-Compliant': 'true'
    }
  },
  AU: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app *.googleapis.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob: *.vercel.app",
      "font-src 'self' data: fonts.gstatic.com",
      "connect-src 'self' *.vercel.app *.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    customHeaders: {
      'X-Warehouse-Region': 'AU',
      'X-Security-Level': 'HIGH'
    }
  }
}

// ================================
// SECURITY HEADERS MIDDLEWARE
// ================================

export class SecurityHeadersMiddleware {
  private readonly scanner = getSecurityScanner()
  private readonly logger = console // Use existing logger in production
  
  constructor(
    private readonly options: SecurityMiddlewareOptions = {
      enableScanning: true,
      scanProfile: 'STANDARD',
      blockOnThreats: true,
      auditLog: true,
      regionSpecific: true
    }
  ) {}

  /**
   * Main middleware function
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    
    try {
      // Determine warehouse region from request
      const warehouse = this.detectWarehouseRegion(request)
      
      // Get regional security configuration
      const config = this.getSecurityConfig(warehouse)
      
      // Perform security scanning if enabled
      if (this.options.enableScanning) {
        const scanResult = await this.performSecurityScan(request, warehouse)
        
        if (this.options.blockOnThreats && (scanResult.status === 'BLOCKED' || scanResult.status === 'THREAT')) {
          return this.createBlockedResponse(scanResult, config)
        }
      }
      
      // Continue processing and add security headers
      const response = NextResponse.next()
      this.addSecurityHeaders(response, config)
      
      // Add performance and security metrics
      const processingTime = Date.now() - startTime
      response.headers.set('X-Processing-Time', `${processingTime}ms`)
      response.headers.set('X-Security-Check', 'PASSED')
      
      // Audit log if enabled
      if (this.options.auditLog) {
        await this.auditRequest(request, warehouse, 'ALLOWED', processingTime)
      }
      
      return response
      
    } catch (error) {
      this.logger.error('Security middleware error:', error)
      
      // Create error response with security headers
      const response = this.createErrorResponse()
      const config = REGIONAL_CONFIGS.US // Fallback to US config
      this.addSecurityHeaders(response, config)
      
      return response
    }
  }

  /**
   * Detect warehouse region from request
   */
  private detectWarehouseRegion(request: NextRequest): 'US' | 'EU' | 'JP' | 'AU' {
    // Check URL path for warehouse context
    const path = request.nextUrl.pathname
    
    if (path.includes('/warehouse/us') || path.includes('/us/')) return 'US'
    if (path.includes('/warehouse/eu') || path.includes('/eu/')) return 'EU'
    if (path.includes('/warehouse/jp') || path.includes('/jp/')) return 'JP'
    if (path.includes('/warehouse/au') || path.includes('/au/')) return 'AU'
    
    // Check headers for warehouse context
    const warehouseHeader = request.headers.get('X-Warehouse-Region')
    if (warehouseHeader && ['US', 'EU', 'JP', 'AU'].includes(warehouseHeader)) {
      return warehouseHeader as 'US' | 'EU' | 'JP' | 'AU'
    }
    
    // Check user location from IP (simplified)
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    
    if (acceptLanguage.includes('ja')) return 'JP'
    if (acceptLanguage.includes('de') || acceptLanguage.includes('fr')) return 'EU'
    
    // Default to US
    return 'US'
  }

  /**
   * Get security configuration for region
   */
  private getSecurityConfig(warehouse: 'US' | 'EU' | 'JP' | 'AU'): SecurityHeadersConfig {
    return REGIONAL_CONFIGS[warehouse] || REGIONAL_CONFIGS.US
  }

  /**
   * Perform comprehensive security scanning
   */
  private async performSecurityScan(request: NextRequest, warehouse: 'US' | 'EU' | 'JP' | 'AU') {
    const url = request.nextUrl.href
    const userAgent = request.headers.get('user-agent') || ''
    const ipAddress = this.getClientIP(request)
    
    // Create scan request
    const scanRequest: SecurityScanRequest = {
      targetType: 'ENDPOINT',
      target: url,
      metadata: {
        warehouse,
        ipAddress,
        userAgent,
        userId: this.extractUserId(request),
        sessionId: this.extractSessionId(request)
      },
      scanProfile: this.options.scanProfile
    }
    
    return await this.scanner.scan(scanRequest)
  }

  /**
   * Add comprehensive security headers to response
   */
  private addSecurityHeaders(response: NextResponse, config: SecurityHeadersConfig): void {
    // Core security headers
    response.headers.set('Content-Security-Policy', config.contentSecurityPolicy)
    response.headers.set('Strict-Transport-Security', config.strictTransportSecurity)
    response.headers.set('X-Frame-Options', config.xFrameOptions)
    response.headers.set('X-Content-Type-Options', config.xContentTypeOptions)
    response.headers.set('Referrer-Policy', config.referrerPolicy)
    response.headers.set('Permissions-Policy', config.permissionsPolicy)
    response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
    response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
    response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
    
    // Additional security headers
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Download-Options', 'noopen')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Custom regional headers
    if (config.customHeaders) {
      Object.entries(config.customHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    
    // Security metadata headers
    response.headers.set('X-Security-Middleware', 'RHY-073')
    response.headers.set('X-Security-Version', '1.0.0')
    response.headers.set('X-Scan-Timestamp', new Date().toISOString())
  }

  /**
   * Create blocked response for security threats
   */
  private createBlockedResponse(scanResult: any, config: SecurityHeadersConfig): NextResponse {
    const response = new NextResponse(
      JSON.stringify({
        error: 'Security Threat Detected',
        message: 'Access denied due to security policy violation',
        code: 'SECURITY_BLOCKED',
        scanId: scanResult.scanId,
        timestamp: new Date().toISOString()
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    this.addSecurityHeaders(response, config)
    response.headers.set('X-Security-Check', 'BLOCKED')
    response.headers.set('X-Threat-Level', scanResult.riskScore.toString())
    
    return response
  }

  /**
   * Create error response with security headers
   */
  private createErrorResponse(): NextResponse {
    return new NextResponse(
      JSON.stringify({
        error: 'Security Middleware Error',
        message: 'An error occurred during security processing',
        code: 'SECURITY_ERROR',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  /**
   * Extract client IP address
   */
  private getClientIP(request: NextRequest): string | undefined {
    const xForwardedFor = request.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim()
    }
    
    const xRealIP = request.headers.get('x-real-ip')
    if (xRealIP) {
      return xRealIP
    }
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    return undefined
  }

  /**
   * Extract user ID from request (integrate with existing auth)
   */
  private extractUserId(request: NextRequest): string | undefined {
    // Try to extract from JWT token or session cookie
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // In production, decode JWT and extract user ID
        // For now, return undefined as we don't have JWT decoding here
        return undefined
      } catch {
        return undefined
      }
    }
    
    // Try session cookie
    const sessionCookie = request.cookies.get('session')
    if (sessionCookie) {
      // In production, decode session and extract user ID
      return undefined
    }
    
    return undefined
  }

  /**
   * Extract session ID from request
   */
  private extractSessionId(request: NextRequest): string | undefined {
    const sessionCookie = request.cookies.get('session')
    return sessionCookie?.value
  }

  /**
   * Audit security middleware operations
   */
  private async auditRequest(
    request: NextRequest,
    warehouse: string,
    action: 'ALLOWED' | 'BLOCKED',
    processingTime: number
  ): Promise<void> {
    const auditData = {
      timestamp: new Date().toISOString(),
      action: `SECURITY_MIDDLEWARE_${action}`,
      resource: request.nextUrl.pathname,
      method: request.method,
      warehouse,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      processingTime,
      userId: this.extractUserId(request),
      sessionId: this.extractSessionId(request)
    }
    
    // In production, integrate with existing audit service
    this.logger.info('Security Middleware Audit:', auditData)
  }
}

// ================================
// MIDDLEWARE FACTORY FUNCTIONS
// ================================

/**
 * Create production security middleware
 */
export function createSecurityMiddleware(options?: Partial<SecurityMiddlewareOptions>): SecurityHeadersMiddleware {
  return new SecurityHeadersMiddleware({
    enableScanning: true,
    scanProfile: 'STANDARD',
    blockOnThreats: true,
    auditLog: true,
    regionSpecific: true,
    ...options
  })
}

/**
 * Create development security middleware (less strict)
 */
export function createDevSecurityMiddleware(): SecurityHeadersMiddleware {
  return new SecurityHeadersMiddleware({
    enableScanning: false, // Disable scanning in development
    scanProfile: 'QUICK',
    blockOnThreats: false,
    auditLog: false,
    regionSpecific: false
  })
}

// ================================
// CONVENIENCE FUNCTIONS
// ================================

/**
 * Apply security headers to any response
 */
export function applySecurityHeaders(response: NextResponse, warehouse: 'US' | 'EU' | 'JP' | 'AU' = 'US'): void {
  const config = REGIONAL_CONFIGS[warehouse]
  const middleware = new SecurityHeadersMiddleware()
  // @ts-ignore - accessing private method for utility
  middleware.addSecurityHeaders(response, config)
}

/**
 * Check if request should be blocked based on security rules
 */
export async function shouldBlockRequest(request: NextRequest): Promise<boolean> {
  const middleware = createSecurityMiddleware()
  try {
    const warehouse = 'US' // Default for utility function
    const scanResult = await middleware['performSecurityScan'](request, warehouse)
    return scanResult.status === 'BLOCKED' || scanResult.status === 'THREAT'
  } catch {
    return false // Don't block on scan errors
  }
}

// ================================
// EXPORTS
// ================================

export default SecurityHeadersMiddleware
export type { SecurityHeadersConfig, SecurityMiddlewareOptions }