'use client'

import { toast } from 'react-hot-toast'

// API Response types
export interface APIResponse<T = any> {
  data: T
  success: boolean
  message: string
  timestamp: number
  requestId: string
}

export interface APIError {
  code: string
  message: string
  details?: any
  retryable: boolean
  timestamp: number
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  cache?: boolean
  offline?: boolean
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors: string[]
}

// Global API configuration
interface UIAPIClientConfig {
  baseURL: string
  timeout: number
  retryConfig: RetryConfig
  authTokenKey: string
  enableLogging: boolean
  enableOfflineQueue: boolean
  enableOptimisticUpdates: boolean
}

const DEFAULT_CONFIG: UIAPIClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000, // 30 seconds
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'],
  },
  authTokenKey: 'auth_token',
  enableLogging: process.env.NODE_ENV === 'development',
  enableOfflineQueue: true,
  enableOptimisticUpdates: true,
}

// Request queue for offline support
interface QueuedRequest {
  id: string
  url: string
  config: RequestConfig
  timestamp: number
  retryCount: number
}

export class UIAPIClient {
  private config: UIAPIClientConfig
  private requestQueue: QueuedRequest[] = []
  private isOnline: boolean = true
  private pendingRequests: Map<string, AbortController> = new Map()
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private loadingStates: Map<string, boolean> = new Map()

  constructor(config?: Partial<UIAPIClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupNetworkMonitoring()
    this.processOfflineQueue()
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = { method: 'GET' }
  ): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId()
    const url = this.buildURL(endpoint)
    const fullConfig = { ...config, headers: await this.buildHeaders(config.headers) }

    // Set loading state
    this.setLoadingState(endpoint, true)

    try {
      // Check cache first for GET requests
      if (config.method === 'GET' && config.cache !== false) {
        const cached = this.getCachedResponse<T>(url)
        if (cached) {
          this.log(`Cache hit for ${endpoint}`)
          return cached
        }
      }

      // If offline and request is not critical, queue it
      if (!this.isOnline && config.offline !== false) {
        await this.queueRequest(url, fullConfig)
        throw new APIError({
          code: 'OFFLINE',
          message: 'Request queued for when connection is restored',
          retryable: true,
          timestamp: Date.now(),
        })
      }

      // Make the request with retry logic
      const response = await this.makeRequestWithRetry<T>(url, fullConfig, requestId)
      
      // Cache successful GET responses
      if (config.method === 'GET' && response.success) {
        this.setCachedResponse(url, response, 300000) // 5 minutes TTL
      }

      this.log(`✅ ${config.method} ${endpoint} - ${response.message}`)
      return response

    } catch (error) {
      this.handleRequestError(error, endpoint, fullConfig)
      throw error
    } finally {
      this.setLoadingState(endpoint, false)
      this.pendingRequests.delete(requestId)
    }
  }

  // HTTP method shortcuts
  async get<T = any>(endpoint: string, config?: Partial<RequestConfig>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T = any>(endpoint: string, body?: any, config?: Partial<RequestConfig>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body })
  }

  async put<T = any>(endpoint: string, body?: any, config?: Partial<RequestConfig>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body })
  }

  async patch<T = any>(endpoint: string, body?: any, config?: Partial<RequestConfig>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body })
  }

  async delete<T = any>(endpoint: string, config?: Partial<RequestConfig>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // Core request logic with retry
  private async makeRequestWithRetry<T>(
    url: string,
    config: RequestConfig,
    requestId: string
  ): Promise<APIResponse<T>> {
    const { retryConfig } = this.config
    let lastError: any

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Setup abort controller for timeout
        const controller = new AbortController()
        this.pendingRequests.set(requestId, controller)

        const timeoutId = setTimeout(() => {
          controller.abort()
        }, config.timeout || this.config.timeout)

        // Make the actual request
        const response = await fetch(url, {
          method: config.method,
          headers: config.headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Parse response
        const result = await this.parseResponse<T>(response, requestId)
        
        if (result.success) {
          return result
        } else {
          throw new APIError({
            code: 'API_ERROR',
            message: result.message,
            retryable: this.isRetryableError(response.status),
            timestamp: Date.now(),
          })
        }

      } catch (error) {
        lastError = error
        
        // Don't retry if not retryable or last attempt
        if (!this.shouldRetry(error, attempt, retryConfig.maxAttempts)) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
          retryConfig.maxDelay
        )

        this.log(`🔄 Retry attempt ${attempt}/${retryConfig.maxAttempts} for ${url} in ${delay}ms`)
        await this.delay(delay)
      }
    }

    throw this.normalizeError(lastError)
  }

  // Response parsing
  private async parseResponse<T>(response: Response, requestId: string): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type')
    const isJSON = contentType?.includes('application/json')

    try {
      const data = isJSON ? await response.json() : await response.text()

      return {
        data,
        success: response.ok,
        message: response.statusText || (response.ok ? 'Success' : 'Request failed'),
        timestamp: Date.now(),
        requestId,
      }
    } catch (error) {
      throw new APIError({
        code: 'PARSE_ERROR',
        message: 'Failed to parse response',
        details: error,
        retryable: false,
        timestamp: Date.now(),
      })
    }
  }

  // Error handling
  private handleRequestError(error: any, endpoint: string, config: RequestConfig): void {
    const normalizedError = this.normalizeError(error)
    
    this.log(`❌ ${config.method} ${endpoint} - ${normalizedError.message}`)

    // Show user-friendly error notifications
    if (normalizedError.code === 'NETWORK_ERROR') {
      toast.error('Network connection error. Please check your internet connection.')
    } else if (normalizedError.code === 'TIMEOUT') {
      toast.error('Request timed out. Please try again.')
    } else if (normalizedError.code === 'AUTH_ERROR') {
      toast.error('Authentication required. Please log in.')
      this.handleAuthError()
    } else if (normalizedError.code === 'SERVER_ERROR') {
      toast.error('Server error. Our team has been notified.')
    } else if (normalizedError.retryable) {
      toast.error('Request failed. Retrying automatically...')
    } else {
      toast.error(normalizedError.message || 'An unexpected error occurred.')
    }

    // Report error to monitoring service
    this.reportError(normalizedError, endpoint, config)
  }

  // Authentication handling
  private async buildHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      'X-Request-Source': 'ui-client',
      ...customHeaders,
    }

    // Add auth token if available
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.config.authTokenKey)
  }

  private handleAuthError(): void {
    // Clear auth token
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.config.authTokenKey)
    }
    
    // Redirect to login or emit auth event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:required'))
    }
  }

  // Caching
  private getCachedResponse<T>(url: string): APIResponse<T> | null {
    const cached = this.cache.get(url)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(url)
      return null
    }

    return cached.data
  }

  private setCachedResponse<T>(url: string, response: APIResponse<T>, ttl: number): void {
    this.cache.set(url, {
      data: response,
      timestamp: Date.now(),
      ttl,
    })

    // Clean up expired cache entries periodically
    this.cleanupCache()
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [url, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(url)
      }
    }
  }

  // Offline support
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return

    const updateOnlineStatus = () => {
      const wasOffline = !this.isOnline
      this.isOnline = navigator.onLine

      if (wasOffline && this.isOnline) {
        this.log('🌐 Connection restored - processing queued requests')
        this.processOfflineQueue()
        toast.success('Connection restored. Syncing data...')
      } else if (!this.isOnline) {
        this.log('🔌 Connection lost - entering offline mode')
        toast.error('Connection lost. Requests will be queued.')
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    this.isOnline = navigator.onLine
  }

  private async queueRequest(url: string, config: RequestConfig): Promise<void> {
    if (!this.config.enableOfflineQueue) return

    const queuedRequest: QueuedRequest = {
      id: this.generateRequestId(),
      url,
      config,
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.requestQueue.push(queuedRequest)
    this.log(`📫 Queued request: ${config.method} ${url}`)
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) return

    const queue = [...this.requestQueue]
    this.requestQueue = []

    for (const queuedRequest of queue) {
      try {
        await this.makeRequestWithRetry(
          queuedRequest.url,
          queuedRequest.config,
          queuedRequest.id
        )
        this.log(`✅ Processed queued request: ${queuedRequest.config.method} ${queuedRequest.url}`)
      } catch (error) {
        // Re-queue if retryable
        if (queuedRequest.retryCount < 3 && this.shouldRetry(error, 1, 3)) {
          queuedRequest.retryCount++
          this.requestQueue.push(queuedRequest)
          this.log(`🔄 Re-queued failed request: ${queuedRequest.config.method} ${queuedRequest.url}`)
        } else {
          this.log(`❌ Dropped failed request: ${queuedRequest.config.method} ${queuedRequest.url}`)
        }
      }
    }
  }

  // Loading state management
  private setLoadingState(endpoint: string, loading: boolean): void {
    this.loadingStates.set(endpoint, loading)
    
    // Emit loading state events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:loading', {
        detail: { endpoint, loading }
      }))
    }
  }

  isLoading(endpoint?: string): boolean {
    if (endpoint) {
      return this.loadingStates.get(endpoint) || false
    }
    return Array.from(this.loadingStates.values()).some(loading => loading)
  }

  // Utility methods
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith('http')) return endpoint
    return `${this.config.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) return false
    
    const normalizedError = this.normalizeError(error)
    return this.config.retryConfig.retryableErrors.includes(normalizedError.code)
  }

  private isRetryableError(status: number): boolean {
    return status >= 500 || status === 408 || status === 429
  }

  private normalizeError(error: any): APIError {
    if (error instanceof APIError) return error

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return new APIError({
        code: 'TIMEOUT',
        message: 'Request timed out',
        retryable: true,
        timestamp: Date.now(),
      })
    }

    if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
      return new APIError({
        code: 'NETWORK_ERROR',
        message: 'Network connection error',
        retryable: true,
        timestamp: Date.now(),
      })
    }

    if (error.status === 401 || error.status === 403) {
      return new APIError({
        code: 'AUTH_ERROR',
        message: 'Authentication required',
        retryable: false,
        timestamp: Date.now(),
      })
    }

    if (error.status >= 500) {
      return new APIError({
        code: 'SERVER_ERROR',
        message: 'Server error',
        retryable: true,
        timestamp: Date.now(),
      })
    }

    return new APIError({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      retryable: false,
      timestamp: Date.now(),
    })
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[UIAPIClient] ${message}`)
    }
  }

  private reportError(error: APIError, endpoint: string, config: RequestConfig): void {
    // Report to monitoring service (Sentry, DataDog, etc.)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: { error, endpoint, config }
      }))
    }
  }

  // Public utility methods
  clearCache(): void {
    this.cache.clear()
    this.log('🧹 Cache cleared')
  }

  cancelRequest(requestId: string): void {
    const controller = this.pendingRequests.get(requestId)
    if (controller) {
      controller.abort()
      this.pendingRequests.delete(requestId)
      this.log(`🛑 Cancelled request: ${requestId}`)
    }
  }

  cancelAllRequests(): void {
    for (const [requestId, controller] of this.pendingRequests) {
      controller.abort()
    }
    this.pendingRequests.clear()
    this.log('🛑 Cancelled all pending requests')
  }

  getQueueStatus(): { pending: number; failed: number } {
    return {
      pending: this.requestQueue.length,
      failed: this.requestQueue.filter(req => req.retryCount > 0).length,
    }
  }
}

// Custom error class
export class APIError extends Error {
  public code: string
  public retryable: boolean
  public timestamp: number
  public details?: any

  constructor(error: Omit<APIError, keyof Error>) {
    super(error.message)
    this.name = 'APIError'
    this.code = error.code
    this.retryable = error.retryable
    this.timestamp = error.timestamp
    this.details = error.details
  }
}

// Global instance
export const apiClient = new UIAPIClient()

// React hooks for API integration
export function useAPIClient() {
  return apiClient
}

export function useAPILoading(endpoint?: string) {
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const handleLoadingChange = (event: CustomEvent) => {
      if (!endpoint || event.detail.endpoint === endpoint) {
        setLoading(event.detail.loading)
      }
    }

    window.addEventListener('api:loading', handleLoadingChange as EventListener)
    return () => window.removeEventListener('api:loading', handleLoadingChange as EventListener)
  }, [endpoint])

  return loading
}