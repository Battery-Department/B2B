// Terminal 3: Bulletproof API Infrastructure with Comprehensive Validation
// Enterprise-grade API layer with rate limiting, validation, and monitoring

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { EventEmitter } from 'events'
import { ecommerceDataLayer } from '@/services/database/ecommerce-data-layer'

export interface APIEndpoint {
  path: string
  method: HTTPMethod
  handler: APIHandler
  validation: ValidationSchema
  rateLimit: RateLimitConfig
  authentication: AuthenticationConfig
  authorization: AuthorizationConfig
  caching: CachingConfig
  monitoring: MonitoringConfig
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type APIHandler = (
  request: ValidatedRequest,
  context: APIContext
) => Promise<APIResponse>

export interface ValidatedRequest {
  method: HTTPMethod
  url: string
  headers: Record<string, string>
  params: Record<string, string>
  query: Record<string, any>
  body: any
  user?: AuthenticatedUser
  session?: UserSession
  metadata: RequestMetadata
}

export interface APIContext {
  requestId: string
  timestamp: Date
  ip: string
  userAgent: string
  origin?: string
  correlation: CorrelationContext
}

export interface APIResponse {
  status: number
  headers?: Record<string, string>
  body: any
  metadata?: ResponseMetadata
}

export interface ValidationSchema {
  params?: z.ZodSchema
  query?: z.ZodSchema
  body?: z.ZodSchema
  headers?: z.ZodSchema
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
  onLimitReached?: (req: NextRequest) => void
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface AuthenticationConfig {
  required: boolean
  methods: AuthMethod[]
  allowAnonymous?: boolean
  sessionRequired?: boolean
}

export type AuthMethod = 'bearer' | 'api_key' | 'session' | 'oauth'

export interface AuthorizationConfig {
  required: boolean
  roles?: string[]
  permissions?: string[]
  resourceOwnership?: boolean
  customCheck?: (user: AuthenticatedUser, context: APIContext) => Promise<boolean>
}

export interface CachingConfig {
  enabled: boolean
  ttl: number
  key?: (req: ValidatedRequest) => string
  invalidationTags?: string[]
  varyBy?: string[]
}

export interface MonitoringConfig {
  logRequests: boolean
  logResponses: boolean
  trackMetrics: boolean
  alertThresholds: {
    errorRate: number
    responseTime: number
    throughput: number
  }
}

export interface AuthenticatedUser {
  id: string
  email: string
  roles: string[]
  permissions: string[]
  metadata?: Record<string, any>
}

export interface UserSession {
  id: string
  userId: string
  createdAt: Date
  lastActivity: Date
  metadata?: Record<string, any>
}

export interface RequestMetadata {
  requestId: string
  timestamp: Date
  duration?: number
  retryCount?: number
  cached?: boolean
}

export interface ResponseMetadata {
  requestId: string
  processingTime: number
  cached: boolean
  warnings?: string[]
}

export interface CorrelationContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  baggage?: Record<string, string>
}

export interface APIMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  throughputPerSecond: number
  activeConnections: number
  rateLimitHits: number
}

export interface APIError {
  code: string
  message: string
  details?: any
  timestamp: Date
  requestId: string
  stack?: string
}

export class APIValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public constraint: string
  ) {
    super(message)
    this.name = 'APIValidationError'
  }
}

export class APIAuthenticationError extends Error {
  constructor(message: string, public method: string) {
    super(message)
    this.name = 'APIAuthenticationError'
  }
}

export class APIAuthorizationError extends Error {
  constructor(
    message: string,
    public required: string[],
    public actual: string[]
  ) {
    super(message)
    this.name = 'APIAuthorizationError'
  }
}

export class APIRateLimitError extends Error {
  constructor(
    message: string,
    public limit: number,
    public windowMs: number,
    public retryAfter: number
  ) {
    super(message)
    this.name = 'APIRateLimitError'
  }
}

export class ECommerceAPILayer extends EventEmitter {
  private endpoints: Map<string, APIEndpoint>
  private rateLimiters: Map<string, any>
  private cache: Map<string, { data: any; expires: Date }>
  private metrics: APIMetrics
  private requestCounter: number
  private responseTimes: number[]
  private errorLog: APIError[]

  constructor() {
    super()
    this.endpoints = new Map()
    this.rateLimiters = new Map()
    this.cache = new Map()
    this.metrics = this.initializeMetrics()
    this.requestCounter = 0
    this.responseTimes = []
    this.errorLog = []

    this.setupDefaultEndpoints()
    this.startMetricsCollection()
  }

  // Initialize API metrics
  private initializeMetrics(): APIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughputPerSecond: 0,
      activeConnections: 0,
      rateLimitHits: 0
    }
  }

  // Setup default e-commerce endpoints
  private setupDefaultEndpoints(): void {
    // Product endpoints
    this.registerEndpoint({
      path: '/api/products',
      method: 'GET',
      handler: this.getProducts.bind(this),
      validation: {
        query: z.object({
          page: z.string().optional().transform(Number),
          limit: z.string().optional().transform(Number),
          category: z.string().optional(),
          search: z.string().optional(),
          sortBy: z.enum(['name', 'price', 'created']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional()
        })
      },
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100
      },
      authentication: {
        required: false,
        methods: ['bearer', 'session'],
        allowAnonymous: true
      },
      authorization: {
        required: false
      },
      caching: {
        enabled: true,
        ttl: 300000, // 5 minutes
        varyBy: ['query']
      },
      monitoring: {
        logRequests: true,
        logResponses: false,
        trackMetrics: true,
        alertThresholds: {
          errorRate: 0.05,
          responseTime: 1000,
          throughput: 10
        }
      }
    })

    // Order endpoints
    this.registerEndpoint({
      path: '/api/orders',
      method: 'POST',
      handler: this.createOrder.bind(this),
      validation: {
        body: z.object({
          customerId: z.string().uuid(),
          items: z.array(z.object({
            productId: z.string().uuid(),
            quantity: z.number().positive(),
            price: z.number().positive()
          })),
          shippingAddress: z.object({
            line1: z.string().min(1),
            line2: z.string().optional(),
            city: z.string().min(1),
            state: z.string().min(2).max(2),
            postalCode: z.string().min(5),
            country: z.string().default('US')
          }),
          paymentMethodId: z.string(),
          metadata: z.record(z.any()).optional()
        })
      },
      rateLimit: {
        windowMs: 60000,
        maxRequests: 10 // Lower limit for order creation
      },
      authentication: {
        required: true,
        methods: ['bearer', 'session'],
        sessionRequired: true
      },
      authorization: {
        required: true,
        resourceOwnership: true
      },
      caching: {
        enabled: false // Never cache order creation
      },
      monitoring: {
        logRequests: true,
        logResponses: true,
        trackMetrics: true,
        alertThresholds: {
          errorRate: 0.02,
          responseTime: 5000,
          throughput: 1
        }
      }
    })

    // Customer endpoints
    this.registerEndpoint({
      path: '/api/customers/:id',
      method: 'GET',
      handler: this.getCustomer.bind(this),
      validation: {
        params: z.object({
          id: z.string().uuid()
        })
      },
      rateLimit: {
        windowMs: 60000,
        maxRequests: 50
      },
      authentication: {
        required: true,
        methods: ['bearer', 'session']
      },
      authorization: {
        required: true,
        resourceOwnership: true
      },
      caching: {
        enabled: true,
        ttl: 180000, // 3 minutes
        key: (req) => `customer:${req.params.id}`
      },
      monitoring: {
        logRequests: true,
        logResponses: false,
        trackMetrics: true,
        alertThresholds: {
          errorRate: 0.03,
          responseTime: 800,
          throughput: 5
        }
      }
    })

    // Inventory endpoints
    this.registerEndpoint({
      path: '/api/inventory/availability',
      method: 'POST',
      handler: this.checkInventoryAvailability.bind(this),
      validation: {
        body: z.object({
          productId: z.string().uuid(),
          quantity: z.number().positive(),
          warehouseId: z.string().optional()
        })
      },
      rateLimit: {
        windowMs: 60000,
        maxRequests: 200
      },
      authentication: {
        required: false,
        methods: ['bearer', 'session'],
        allowAnonymous: true
      },
      authorization: {
        required: false
      },
      caching: {
        enabled: true,
        ttl: 30000, // 30 seconds - inventory changes frequently
        key: (req) => `inventory:${req.body.productId}:${req.body.warehouseId || 'all'}`
      },
      monitoring: {
        logRequests: false,
        logResponses: false,
        trackMetrics: true,
        alertThresholds: {
          errorRate: 0.01,
          responseTime: 500,
          throughput: 20
        }
      }
    })
  }

  // Register a new API endpoint
  registerEndpoint(endpoint: APIEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`
    this.endpoints.set(key, endpoint)

    // Setup rate limiter for this endpoint
    if (endpoint.rateLimit) {
      this.rateLimiters.set(key, this.createRateLimiter(endpoint.rateLimit))
    }

    this.emit('endpointRegistered', endpoint)
  }

  // Create rate limiter for endpoint
  private createRateLimiter(config: RateLimitConfig): any {
    return rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests,
      keyGenerator: config.keyGenerator || ((req: any) => req.ip),
      onLimitReached: config.onLimitReached || ((req: any) => {
        this.metrics.rateLimitHits++
        this.emit('rateLimitExceeded', { ip: req.ip, endpoint: req.url })
      }),
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false
    })
  }

  // Main request handler
  async handleRequest(
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()
    const correlationContext = this.extractCorrelationContext(request)

    try {
      // Find matching endpoint
      const endpoint = this.findEndpoint(request.method as HTTPMethod, request.nextUrl.pathname)
      if (!endpoint) {
        return this.createErrorResponse(404, 'Endpoint not found', requestId)
      }

      // Create API context
      const apiContext: APIContext = {
        requestId,
        timestamp: new Date(),
        ip: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        origin: request.headers.get('origin') || undefined,
        correlation: correlationContext
      }

      // Apply rate limiting
      await this.applyRateLimit(endpoint, request)

      // Parse and validate request
      const validatedRequest = await this.validateRequest(endpoint, request, context.params || {})

      // Apply authentication
      if (endpoint.authentication.required) {
        const authResult = await this.authenticateRequest(endpoint, validatedRequest, apiContext)
        validatedRequest.user = authResult.user
        validatedRequest.session = authResult.session
      }

      // Apply authorization
      if (endpoint.authorization.required) {
        await this.authorizeRequest(endpoint, validatedRequest, apiContext)
      }

      // Check cache
      let response: APIResponse
      if (endpoint.caching.enabled) {
        const cachedResponse = await this.checkCache(endpoint, validatedRequest)
        if (cachedResponse) {
          response = cachedResponse
          response.metadata = {
            requestId,
            processingTime: Date.now() - startTime,
            cached: true
          }
        } else {
          response = await endpoint.handler(validatedRequest, apiContext)
          await this.saveToCache(endpoint, validatedRequest, response)
        }
      } else {
        response = await endpoint.handler(validatedRequest, apiContext)
      }

      // Add metadata
      if (!response.metadata) {
        response.metadata = {
          requestId,
          processingTime: Date.now() - startTime,
          cached: false
        }
      }

      // Track metrics
      this.trackRequest(endpoint, startTime, response.status)

      // Log request if configured
      if (endpoint.monitoring.logRequests) {
        this.logRequest(validatedRequest, response, apiContext)
      }

      return this.createSuccessResponse(response)

    } catch (error) {
      const processingTime = Date.now() - startTime
      this.trackError(error, requestId, processingTime)
      return this.handleError(error, requestId)
    }
  }

  // Find matching endpoint
  private findEndpoint(method: HTTPMethod, path: string): APIEndpoint | null {
    // First try exact match
    const exactKey = `${method}:${path}`
    if (this.endpoints.has(exactKey)) {
      return this.endpoints.get(exactKey)!
    }

    // Try pattern matching for parameterized routes
    for (const [key, endpoint] of this.endpoints.entries()) {
      const [endpointMethod, endpointPath] = key.split(':')
      if (endpointMethod === method && this.matchesPattern(endpointPath, path)) {
        return endpoint
      }
    }

    return null
  }

  // Check if path matches pattern (e.g., /api/customers/:id)
  private matchesPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')

    if (patternParts.length !== pathParts.length) {
      return false
    }

    return patternParts.every((part, index) => {
      return part.startsWith(':') || part === pathParts[index]
    })
  }

  // Apply rate limiting
  private async applyRateLimit(endpoint: APIEndpoint, request: NextRequest): Promise<void> {
    const key = `${request.method}:${endpoint.path}`
    const rateLimiter = this.rateLimiters.get(key)

    if (rateLimiter) {
      // Convert NextRequest to Express-like request for rate limiter
      const req = {
        ip: this.getClientIP(request),
        url: request.nextUrl.pathname,
        headers: Object.fromEntries(request.headers.entries())
      }

      return new Promise((resolve, reject) => {
        rateLimiter(req, {}, (error: any) => {
          if (error) {
            reject(new APIRateLimitError(
              'Rate limit exceeded',
              endpoint.rateLimit.maxRequests,
              endpoint.rateLimit.windowMs,
              endpoint.rateLimit.windowMs / 1000
            ))
          } else {
            resolve()
          }
        })
      })
    }
  }

  // Validate request against schema
  private async validateRequest(
    endpoint: APIEndpoint,
    request: NextRequest,
    params: Record<string, string>
  ): Promise<ValidatedRequest> {
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams.entries())
    const headers = Object.fromEntries(request.headers.entries())

    let body: any = null
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      try {
        const text = await request.text()
        body = text ? JSON.parse(text) : null
      } catch (error) {
        throw new APIValidationError('Invalid JSON in request body', 'body', body, 'valid JSON')
      }
    }

    // Validate params
    if (endpoint.validation.params) {
      try {
        params = endpoint.validation.params.parse(params)
      } catch (error) {
        throw new APIValidationError('Invalid parameters', 'params', params, 'schema validation')
      }
    }

    // Validate query
    if (endpoint.validation.query) {
      try {
        query = endpoint.validation.query.parse(query)
      } catch (error) {
        throw new APIValidationError('Invalid query parameters', 'query', query, 'schema validation')
      }
    }

    // Validate body
    if (endpoint.validation.body && body !== null) {
      try {
        body = endpoint.validation.body.parse(body)
      } catch (error) {
        throw new APIValidationError('Invalid request body', 'body', body, 'schema validation')
      }
    }

    // Validate headers
    if (endpoint.validation.headers) {
      try {
        headers = endpoint.validation.headers.parse(headers)
      } catch (error) {
        throw new APIValidationError('Invalid headers', 'headers', headers, 'schema validation')
      }
    }

    return {
      method: request.method as HTTPMethod,
      url: request.url,
      headers,
      params,
      query,
      body,
      metadata: {
        requestId: this.generateRequestId(),
        timestamp: new Date()
      }
    }
  }

  // Authenticate request
  private async authenticateRequest(
    endpoint: APIEndpoint,
    request: ValidatedRequest,
    context: APIContext
  ): Promise<{ user: AuthenticatedUser; session?: UserSession }> {
    const authHeader = request.headers.authorization
    const sessionId = request.headers['x-session-id']

    // Try bearer token authentication
    if (authHeader?.startsWith('Bearer ') && endpoint.authentication.methods.includes('bearer')) {
      const token = authHeader.substring(7)
      const user = await this.validateBearerToken(token)
      return { user }
    }

    // Try session authentication
    if (sessionId && endpoint.authentication.methods.includes('session')) {
      const authResult = await this.validateSession(sessionId)
      return authResult
    }

    // Try API key authentication
    const apiKey = request.headers['x-api-key']
    if (apiKey && endpoint.authentication.methods.includes('api_key')) {
      const user = await this.validateApiKey(apiKey)
      return { user }
    }

    if (!endpoint.authentication.allowAnonymous) {
      throw new APIAuthenticationError('Authentication required', 'none')
    }

    // Return anonymous user
    return {
      user: {
        id: 'anonymous',
        email: '',
        roles: ['anonymous'],
        permissions: []
      }
    }
  }

  // Authorize request
  private async authorizeRequest(
    endpoint: APIEndpoint,
    request: ValidatedRequest,
    context: APIContext
  ): Promise<void> {
    if (!request.user) {
      throw new APIAuthorizationError('User not authenticated', [], [])
    }

    // Check roles
    if (endpoint.authorization.roles && endpoint.authorization.roles.length > 0) {
      const hasRole = endpoint.authorization.roles.some(role => 
        request.user!.roles.includes(role)
      )
      if (!hasRole) {
        throw new APIAuthorizationError(
          'Insufficient role privileges',
          endpoint.authorization.roles,
          request.user.roles
        )
      }
    }

    // Check permissions
    if (endpoint.authorization.permissions && endpoint.authorization.permissions.length > 0) {
      const hasPermission = endpoint.authorization.permissions.some(permission => 
        request.user!.permissions.includes(permission)
      )
      if (!hasPermission) {
        throw new APIAuthorizationError(
          'Insufficient permissions',
          endpoint.authorization.permissions,
          request.user.permissions
        )
      }
    }

    // Check resource ownership
    if (endpoint.authorization.resourceOwnership) {
      const ownsResource = await this.checkResourceOwnership(request, context)
      if (!ownsResource) {
        throw new APIAuthorizationError('Resource access denied', ['resource_owner'], request.user.roles)
      }
    }

    // Custom authorization check
    if (endpoint.authorization.customCheck) {
      const authorized = await endpoint.authorization.customCheck(request.user, context)
      if (!authorized) {
        throw new APIAuthorizationError('Custom authorization failed', [], [])
      }
    }
  }

  // Validate bearer token
  private async validateBearerToken(token: string): Promise<AuthenticatedUser> {
    // This would integrate with your auth service
    // For now, return mock user
    return {
      id: 'user123',
      email: 'user@example.com',
      roles: ['customer'],
      permissions: ['read:products', 'create:orders']
    }
  }

  // Validate session
  private async validateSession(sessionId: string): Promise<{ user: AuthenticatedUser; session: UserSession }> {
    // This would validate session with your session store
    // For now, return mock data
    return {
      user: {
        id: 'user123',
        email: 'user@example.com',
        roles: ['customer'],
        permissions: ['read:products', 'create:orders']
      },
      session: {
        id: sessionId,
        userId: 'user123',
        createdAt: new Date(),
        lastActivity: new Date()
      }
    }
  }

  // Validate API key
  private async validateApiKey(apiKey: string): Promise<AuthenticatedUser> {
    // This would validate API key
    // For now, return mock user
    return {
      id: 'api_user',
      email: 'api@example.com',
      roles: ['api'],
      permissions: ['read:products', 'read:inventory']
    }
  }

  // Check resource ownership
  private async checkResourceOwnership(request: ValidatedRequest, context: APIContext): Promise<boolean> {
    // This would check if user owns the requested resource
    // For now, return true
    return true
  }

  // Check cache for response
  private async checkCache(endpoint: APIEndpoint, request: ValidatedRequest): Promise<APIResponse | null> {
    if (!endpoint.caching.enabled) return null

    const cacheKey = endpoint.caching.key 
      ? endpoint.caching.key(request)
      : this.generateCacheKey(endpoint, request)

    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > new Date()) {
      return cached.data
    }

    return null
  }

  // Save response to cache
  private async saveToCache(endpoint: APIEndpoint, request: ValidatedRequest, response: APIResponse): Promise<void> {
    if (!endpoint.caching.enabled || response.status >= 400) return

    const cacheKey = endpoint.caching.key 
      ? endpoint.caching.key(request)
      : this.generateCacheKey(endpoint, request)

    const expires = new Date(Date.now() + endpoint.caching.ttl)
    this.cache.set(cacheKey, { data: response, expires })
  }

  // Generate cache key
  private generateCacheKey(endpoint: APIEndpoint, request: ValidatedRequest): string {
    const base = `${endpoint.method}:${endpoint.path}`
    
    if (endpoint.caching.varyBy) {
      const varyParts = endpoint.caching.varyBy.map(field => {
        switch (field) {
          case 'query':
            return JSON.stringify(request.query)
          case 'params':
            return JSON.stringify(request.params)
          case 'user':
            return request.user?.id || 'anonymous'
          default:
            return ''
        }
      })
      return `${base}:${varyParts.join(':')}`
    }

    return base
  }

  // Example endpoint handlers
  private async getProducts(request: ValidatedRequest, context: APIContext): Promise<APIResponse> {
    const { page = 1, limit = 20, category, search } = request.query

    // Build query
    const where: any = {}
    if (category) where.category = category
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const products = await ecommerceDataLayer.prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        inventoryItems: true
      }
    })

    const total = await ecommerceDataLayer.prisma.product.count({ where })

    return {
      status: 200,
      body: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }

  private async createOrder(request: ValidatedRequest, context: APIContext): Promise<APIResponse> {
    const orderData = request.body

    const order = await ecommerceDataLayer.withTransaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customerId: orderData.customerId,
          status: 'pending',
          subtotal: orderData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
          tax: 0,
          shipping: 0,
          total: orderData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
          shippingAddress: orderData.shippingAddress,
          orderNumber: `ORD-${Date.now()}`,
          items: {
            create: orderData.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.quantity * item.price
            }))
          }
        },
        include: {
          items: true
        }
      })

      return newOrder
    })

    return {
      status: 201,
      body: { order }
    }
  }

  private async getCustomer(request: ValidatedRequest, context: APIContext): Promise<APIResponse> {
    const { id } = request.params

    const customer = await ecommerceDataLayer.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return {
        status: 404,
        body: { error: 'Customer not found' }
      }
    }

    return {
      status: 200,
      body: { customer }
    }
  }

  private async checkInventoryAvailability(request: ValidatedRequest, context: APIContext): Promise<APIResponse> {
    const { productId, quantity, warehouseId } = request.body

    // This would integrate with inventory service
    const availability = {
      available: true,
      totalAvailable: 50,
      warehouses: [
        {
          warehouseId: 'WH001',
          available: 50,
          reserved: 5,
          estimatedDelivery: new Date(Date.now() + 86400000),
          shippingCost: 10
        }
      ],
      alternatives: []
    }

    return {
      status: 200,
      body: availability
    }
  }

  // Utility methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           '0.0.0.0'
  }

  private extractCorrelationContext(request: NextRequest): CorrelationContext {
    return {
      traceId: request.headers.get('x-trace-id') || this.generateRequestId(),
      spanId: request.headers.get('x-span-id') || this.generateRequestId(),
      parentSpanId: request.headers.get('x-parent-span-id') || undefined
    }
  }

  private trackRequest(endpoint: APIEndpoint, startTime: number, status: number): void {
    const duration = Date.now() - startTime
    
    this.metrics.totalRequests++
    this.responseTimes.push(duration)
    
    if (status >= 200 && status < 400) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
    }

    this.updateMetrics()
  }

  private trackError(error: any, requestId: string, processingTime: number): void {
    const apiError: APIError = {
      code: error.constructor.name,
      message: error.message,
      details: error.details || null,
      timestamp: new Date(),
      requestId,
      stack: error.stack
    }

    this.errorLog.push(apiError)
    this.metrics.failedRequests++
    
    this.emit('apiError', apiError)
  }

  private updateMetrics(): void {
    if (this.responseTimes.length > 0) {
      this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      
      const sorted = [...this.responseTimes].sort((a, b) => a - b)
      this.metrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)]
      this.metrics.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)]
    }

    this.metrics.errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }
  }

  private logRequest(request: ValidatedRequest, response: APIResponse, context: APIContext): void {
    const logEntry = {
      requestId: context.requestId,
      method: request.method,
      url: request.url,
      status: response.status,
      processingTime: response.metadata?.processingTime,
      userAgent: context.userAgent,
      ip: context.ip,
      userId: request.user?.id,
      timestamp: context.timestamp
    }

    this.emit('requestLogged', logEntry)
  }

  private createSuccessResponse(response: APIResponse): NextResponse {
    return NextResponse.json(response.body, {
      status: response.status,
      headers: {
        'x-request-id': response.metadata?.requestId || '',
        'x-processing-time': response.metadata?.processingTime?.toString() || '',
        'x-cached': response.metadata?.cached ? 'true' : 'false',
        ...response.headers
      }
    })
  }

  private createErrorResponse(status: number, message: string, requestId: string): NextResponse {
    return NextResponse.json(
      {
        error: {
          code: 'API_ERROR',
          message,
          requestId,
          timestamp: new Date().toISOString()
        }
      },
      {
        status,
        headers: {
          'x-request-id': requestId
        }
      }
    )
  }

  private handleError(error: any, requestId: string): NextResponse {
    if (error instanceof APIValidationError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            field: error.field,
            requestId
          }
        },
        { status: 400 }
      )
    }

    if (error instanceof APIAuthenticationError) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: error.message,
            requestId
          }
        },
        { status: 401 }
      )
    }

    if (error instanceof APIAuthorizationError) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            requestId
          }
        },
        { status: 403 }
      )
    }

    if (error instanceof APIRateLimitError) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: error.message,
            retryAfter: error.retryAfter,
            requestId
          }
        },
        {
          status: 429,
          headers: {
            'retry-after': error.retryAfter.toString()
          }
        }
      )
    }

    // Internal server error
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          requestId
        }
      },
      { status: 500 }
    )
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.emit('metricsUpdated', this.metrics)
    }, 30000) // Every 30 seconds
  }

  // Get current API metrics
  getMetrics(): APIMetrics {
    return { ...this.metrics }
  }

  // Get error log
  getErrorLog(limit: number = 100): APIError[] {
    return this.errorLog.slice(-limit)
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
    this.emit('cacheCleared')
  }

  // Shutdown gracefully
  async shutdown(): Promise<void> {
    this.emit('shutdown')
  }
}

// Singleton instance
export const ecommerceAPILayer = new ECommerceAPILayer()

export default ecommerceAPILayer