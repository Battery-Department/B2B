import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, z } from 'zod'

export interface APIConfig {
  version: string
  environment: 'development' | 'staging' | 'production'
  baseUrl: string
  timeout: number
  maxRetries: number
  rateLimits: {
    windowMs: number
    max: number
    skipSuccessfulRequests: boolean
  }
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
  meta?: {
    timestamp: string
    version: string
    requestId: string
    executionTime: number
  }
}

export interface RequestContext {
  requestId: string
  userId?: string
  userAgent: string
  ip: string
  timestamp: Date
  endpoint: string
  method: string
}

export class APIInfrastructure {
  private config: APIConfig
  private logger: APILogger
  private metrics: APIMetrics
  private security: APISecurity

  constructor(config: APIConfig) {
    this.config = config
    this.logger = new APILogger()
    this.metrics = new APIMetrics()
    this.security = new APISecurity()
  }

  // Standardized API wrapper with comprehensive validation
  async handleRequest<T, R>(
    request: NextRequest,
    handler: (data: T, context: RequestContext) => Promise<R>,
    schema?: ZodSchema<T>,
    options: {
      requireAuth?: boolean
      rateLimit?: boolean
      logResponse?: boolean
      validateInput?: boolean
    } = {}
  ): Promise<NextResponse<APIResponse<R>>> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()
    
    try {
      // Create request context
      const context: RequestContext = {
        requestId,
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: this.getClientIP(request),
        timestamp: new Date(),
        endpoint: request.nextUrl.pathname,
        method: request.method
      }

      // Security validation
      if (options.requireAuth) {
        const authResult = await this.security.validateAuthentication(request)
        if (!authResult.valid) {
          return this.errorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId)
        }
        if (authResult.userId) {
          context.userId = authResult.userId
        }
      }

      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = await this.security.checkRateLimit(context)
        if (!rateLimitResult.allowed) {
          return this.errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, requestId)
        }
      }

      // Input validation
      let validatedData: T | undefined
      if (schema && options.validateInput) {
        try {
          const rawData = await this.extractRequestData(request)
          validatedData = schema.parse(rawData)
        } catch (error) {
          this.logger.logError('Input validation failed', error, context)
          return this.errorResponse(
            'VALIDATION_ERROR', 
            'Invalid request data', 
            400, 
            requestId,
            error
          )
        }
      }

      // Execute handler
      const result = await handler(validatedData as T, context)

      // Log success
      const executionTime = Date.now() - startTime
      this.logger.logSuccess(context, executionTime, options.logResponse ? result : undefined)
      this.metrics.recordRequest(context, executionTime, 'success')

      return this.successResponse(result, requestId, executionTime)

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.logError('Request handler failed', error, { requestId })
      this.metrics.recordRequest({ requestId } as RequestContext, executionTime, 'error')
      
      return this.errorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred',
        500,
        requestId,
        this.config.environment === 'development' ? error : undefined
      )
    }
  }

  // Standardized success response
  private successResponse<T>(
    data: T, 
    requestId: string, 
    executionTime: number
  ): NextResponse<APIResponse<T>> {
    const response: APIResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.config.version,
        requestId,
        executionTime
      }
    }

    return NextResponse.json(response, { status: 200 })
  }

  // Standardized error response
  private errorResponse(
    code: string,
    message: string,
    status: number,
    requestId: string,
    details?: any
  ): NextResponse<APIResponse> {
    const response: APIResponse = {
      success: false,
      error: {
        code,
        message,
        details: this.config.environment === 'development' ? details : undefined,
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status })
  }

  // Extract request data from different sources
  private async extractRequestData(request: NextRequest): Promise<any> {
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      return await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      return Object.fromEntries(formData)
    } else if (request.method === 'GET') {
      const url = new URL(request.url)
      return Object.fromEntries(url.searchParams)
    }
    
    return {}
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    const cloudflare = request.headers.get('cf-connecting-ip')
    
    return cloudflare || real || forwarded?.split(',')[0] || 'unknown'
  }

  // Health check endpoint
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    version: string
    uptime: number
    checks: Record<string, boolean>
  }> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      email: await this.checkEmailService(),
      storage: await this.checkStorage(),
      thirdParty: await this.checkThirdPartyServices()
    }

    const allHealthy = Object.values(checks).every(check => check)
    const someHealthy = Object.values(checks).some(check => check)

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: this.config.version,
      uptime: process.uptime(),
      checks
    }
  }

  // Service health checks
  private async checkDatabase(): Promise<boolean> {
    try {
      // In production, implement actual database connectivity check
      return true
    } catch {
      return false
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      // In production, implement actual Redis connectivity check
      return true
    } catch {
      return false
    }
  }

  private async checkEmailService(): Promise<boolean> {
    try {
      // In production, implement actual email service check
      return true
    } catch {
      return false
    }
  }

  private async checkStorage(): Promise<boolean> {
    try {
      // In production, implement actual storage service check
      return true
    } catch {
      return false
    }
  }

  private async checkThirdPartyServices(): Promise<boolean> {
    try {
      // In production, implement actual third-party service checks
      return true
    } catch {
      return false
    }
  }
}

// API Logging System
export class APILogger {
  logSuccess(
    context: RequestContext, 
    executionTime: number, 
    response?: any
  ): void {
    console.log(`[API SUCCESS] ${context.method} ${context.endpoint}`, {
      requestId: context.requestId,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      executionTime: `${executionTime}ms`,
      timestamp: context.timestamp.toISOString(),
      responseData: response ? JSON.stringify(response).length + ' bytes' : 'N/A'
    })
  }

  logError(
    message: string, 
    error: any, 
    context: Partial<RequestContext>
  ): void {
    console.error(`[API ERROR] ${message}`, {
      requestId: context.requestId,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })
  }

  logWarning(
    message: string, 
    context: Partial<RequestContext>,
    data?: any
  ): void {
    console.warn(`[API WARNING] ${message}`, {
      requestId: context.requestId,
      data,
      timestamp: new Date().toISOString()
    })
  }
}

// API Metrics Collection
export class APIMetrics {
  private metrics: Map<string, any> = new Map()

  recordRequest(
    context: RequestContext, 
    executionTime: number, 
    status: 'success' | 'error'
  ): void {
    const key = `${context.method}:${context.endpoint}`
    const existing = this.metrics.get(key) || {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      avgExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
      lastRequest: null
    }

    existing.totalRequests++
    existing[status === 'success' ? 'successCount' : 'errorCount']++
    existing.avgExecutionTime = (existing.avgExecutionTime * (existing.totalRequests - 1) + executionTime) / existing.totalRequests
    existing.minExecutionTime = Math.min(existing.minExecutionTime, executionTime)
    existing.maxExecutionTime = Math.max(existing.maxExecutionTime, executionTime)
    existing.lastRequest = context.timestamp

    this.metrics.set(key, existing)
  }

  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics)
  }

  getEndpointMetrics(endpoint: string): any {
    return Object.fromEntries(
      Array.from(this.metrics.entries())
        .filter(([key]) => key.includes(endpoint))
    )
  }
}

// API Security Layer
export class APISecurity {
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map()

  async validateAuthentication(request: NextRequest): Promise<{
    valid: boolean
    userId?: string
    error?: string
  }> {
    try {
      const authHeader = request.headers.get('authorization')
      const apiKey = request.headers.get('x-api-key')

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // In production, implement JWT validation
        return { valid: true, userId: 'user123' }
      }

      if (apiKey) {
        // In production, implement API key validation
        return { valid: true, userId: 'api_user' }
      }

      return { valid: false, error: 'No valid authentication provided' }
    } catch (error) {
      return { valid: false, error: 'Authentication validation failed' }
    }
  }

  async checkRateLimit(context: RequestContext): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const key = `${context.ip}:${context.endpoint}`
    const now = Date.now()
    const windowMs = 60000 // 1 minute
    const maxRequests = 100

    const current = this.rateLimitStore.get(key)
    
    if (!current || now > current.resetTime) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      }
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      }
    }

    current.count++
    this.rateLimitStore.set(key, current)

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    }
  }

  validateInput(data: any, schema: ZodSchema): { valid: boolean; errors?: any } {
    try {
      schema.parse(data)
      return { valid: true }
    } catch (error) {
      return { valid: false, errors: error }
    }
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 1000)
  }
}

// Common validation schemas
export const ValidationSchemas = {
  user: z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    phone: z.string().optional()
  }),
  
  order: z.object({
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive()
    })),
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string()
    }),
    paymentMethod: z.string()
  }),

  product: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000),
    price: z.number().positive(),
    category: z.string(),
    inStock: z.boolean()
  })
}

// Export singleton instance
export const apiInfrastructure = new APIInfrastructure({
  version: '1.0.0',
  environment: (process.env['NODE_ENV'] as any) || 'development',
  baseUrl: process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000',
  timeout: 30000,
  maxRetries: 3,
  rateLimits: {
    windowMs: 60000,
    max: 100,
    skipSuccessfulRequests: false
  }
})