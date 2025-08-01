import { z } from 'zod'

// Error Types and Interfaces
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  EXTERNAL_SERVICE = 'external_service',
  UI_COMPONENT = 'ui_component',
  DATA_PROCESSING = 'data_processing',
  WAREHOUSE_OPERATIONS = 'warehouse_operations',
  PAYMENT_PROCESSING = 'payment_processing',
  UNKNOWN = 'unknown'
}

export enum RetryStrategy {
  NONE = 'none',
  IMMEDIATE = 'immediate',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  CUSTOM = 'custom'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  warehouseId?: string
  userRole?: string
  currentPage?: string
  userAgent?: string
  timestamp: string
  requestId?: string
  traceId?: string
  operationId?: string
  businessContext?: {
    orderId?: string
    productSku?: string
    supplierId?: string
    transactionId?: string
    inventoryLocation?: string
  }
  technical?: {
    stackTrace?: string
    componentStack?: string
    sourceMap?: string
    browserInfo?: BrowserInfo
    networkInfo?: NetworkInfo
    performanceInfo?: PerformanceInfo
  }
}

export interface BrowserInfo {
  userAgent: string
  viewport: { width: number; height: number }
  colorDepth: number
  language: string
  cookieEnabled: boolean
  onLine: boolean
  platform: string
}

export interface NetworkInfo {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

export interface PerformanceInfo {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  navigation?: {
    type: number
    redirectCount: number
  }
  timing?: {
    navigationStart: number
    loadEventEnd: number
    domContentLoaded: number
  }
}

export interface RetryConfig {
  maxAttempts: number
  strategy: RetryStrategy
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryCondition?: (error: Error, attempt: number) => boolean
  onRetry?: (error: Error, attempt: number) => void
  timeout?: number
}

export interface ErrorReport {
  id: string
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  code?: string
  context: ErrorContext
  retryCount: number
  resolved: boolean
  acknowledgedAt?: string
  resolvedAt?: string
  escalatedAt?: string
  assignedTo?: string
  internalNotes?: string[]
}

// Custom Error Classes
export class RHYError extends Error {
  public readonly code: string
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly context: ErrorContext
  public readonly timestamp: Date
  public readonly retryable: boolean
  public readonly userMessage: string

  constructor(
    message: string,
    options: {
      code?: string
      severity?: ErrorSeverity
      category?: ErrorCategory
      context?: Partial<ErrorContext>
      retryable?: boolean
      userMessage?: string
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'RHYError'
    this.code = options.code || 'UNKNOWN_ERROR'
    this.severity = options.severity || ErrorSeverity.MEDIUM
    this.category = options.category || ErrorCategory.UNKNOWN
    this.retryable = options.retryable ?? true
    this.userMessage = options.userMessage || this.getDefaultUserMessage()
    this.timestamp = new Date()
    
    this.context = {
      timestamp: this.timestamp.toISOString(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      warehouseId: this.getWarehouseId(),
      userRole: this.getUserRole(),
      currentPage: this.getCurrentPage(),
      userAgent: this.getUserAgent(),
      ...options.context
    }

    if (options.cause) {
      this.cause = options.cause
    }
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return localStorage.getItem('userId') || undefined
    } catch {
      return undefined
    }
  }

  private getSessionId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return sessionStorage.getItem('sessionId') || undefined
    } catch {
      return undefined
    }
  }

  private getWarehouseId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return localStorage.getItem('selectedWarehouse') || 'US-West'
    } catch {
      return undefined
    }
  }

  private getUserRole(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return localStorage.getItem('userRole') || undefined
    } catch {
      return undefined
    }
  }

  private getCurrentPage(): string | undefined {
    if (typeof window === 'undefined') return undefined
    return window.location.pathname
  }

  private getUserAgent(): string | undefined {
    if (typeof window === 'undefined') return undefined
    return navigator.userAgent
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.'
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication required. Please log in to continue.'
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.'
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.'
      case ErrorCategory.WAREHOUSE_OPERATIONS:
        return 'Warehouse operation failed. Please contact support if this continues.'
      case ErrorCategory.PAYMENT_PROCESSING:
        return 'Payment processing error. Please verify your payment information.'
      default:
        return 'An unexpected error occurred. Our team has been notified.'
    }
  }
}

export class NetworkError extends RHYError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof RHYError>[1], 'category'> = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.NETWORK,
      severity: options.severity || ErrorSeverity.MEDIUM
    })
  }
}

export class AuthenticationError extends RHYError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof RHYError>[1], 'category'> = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.AUTHENTICATION,
      severity: options.severity || ErrorSeverity.HIGH,
      retryable: false
    })
  }
}

export class ValidationError extends RHYError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof RHYError>[1], 'category'> = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.VALIDATION,
      severity: options.severity || ErrorSeverity.LOW,
      retryable: false
    })
  }
}

export class WarehouseOperationError extends RHYError {
  constructor(message: string, options: Omit<ConstructorParameters<typeof RHYError>[1], 'category'> = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.WAREHOUSE_OPERATIONS,
      severity: options.severity || ErrorSeverity.HIGH
    })
  }
}

// Enhanced Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorReports: Map<string, ErrorReport> = new Map()
  private errorListeners: Set<(error: ErrorReport) => void> = new Set()
  private retryQueues: Map<string, RetryQueue> = new Map()

  private constructor() {
    this.setupGlobalErrorHandlers()
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      this.handleError(error, {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: { type: 'unhandled_promise_rejection' }
      })
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Handle network errors
    window.addEventListener('offline', () => {
      this.handleError(new NetworkError('Network connection lost'), {
        severity: ErrorSeverity.MEDIUM,
        context: { type: 'network_offline' }
      })
    })
  }

  public handleError(
    error: Error | RHYError,
    options: {
      category?: ErrorCategory
      severity?: ErrorSeverity
      context?: Partial<ErrorContext>
      retryConfig?: Partial<RetryConfig>
      userMessage?: string
    } = {}
  ): ErrorReport {
    const rhyError = error instanceof RHYError ? error : this.createRHYError(error, options)
    const errorReport = this.createErrorReport(rhyError)

    // Store error report
    this.errorReports.set(errorReport.id, errorReport)

    // Log error
    this.logError(rhyError, errorReport)

    // Send to monitoring
    this.sendToMonitoring(errorReport)

    // Notify listeners
    this.notifyListeners(errorReport)

    // Handle retry if configured and error is retryable
    if (options.retryConfig && rhyError.retryable) {
      this.scheduleRetry(rhyError, options.retryConfig)
    }

    return errorReport
  }

  private createRHYError(error: Error, options: any): RHYError {
    return new RHYError(error.message, {
      ...options,
      code: options.code || this.inferErrorCode(error),
      severity: options.severity || this.inferSeverity(error),
      category: options.category || this.inferCategory(error),
      context: {
        ...options.context,
        technical: {
          stackTrace: error.stack,
          ...this.gatherTechnicalContext()
        }
      },
      cause: error
    })
  }

  private inferErrorCode(error: Error): string {
    if (error.message.includes('fetch')) return 'FETCH_ERROR'
    if (error.message.includes('timeout')) return 'TIMEOUT_ERROR'
    if (error.message.includes('unauthorized')) return 'AUTH_ERROR'
    if (error.message.includes('not found')) return 'NOT_FOUND_ERROR'
    if (error.message.includes('validation')) return 'VALIDATION_ERROR'
    return 'UNKNOWN_ERROR'
  }

  private inferSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase()
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.CRITICAL
    if (message.includes('auth') || message.includes('permission')) return ErrorSeverity.HIGH
    if (message.includes('network') || message.includes('timeout')) return ErrorSeverity.MEDIUM
    return ErrorSeverity.LOW
  }

  private inferCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK
    }
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION
    }
    if (message.includes('warehouse') || message.includes('inventory')) {
      return ErrorCategory.WAREHOUSE_OPERATIONS
    }
    if (message.includes('payment') || message.includes('stripe')) {
      return ErrorCategory.PAYMENT_PROCESSING
    }
    return ErrorCategory.UNKNOWN
  }

  private gatherTechnicalContext(): Partial<ErrorContext['technical']> {
    if (typeof window === 'undefined') return {}

    try {
      return {
        browserInfo: {
          userAgent: navigator.userAgent,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          colorDepth: screen.colorDepth,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          platform: navigator.platform
        },
        networkInfo: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
          saveData: (navigator as any).connection.saveData
        } : undefined,
        performanceInfo: {
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          } : undefined,
          navigation: performance.navigation ? {
            type: performance.navigation.type,
            redirectCount: performance.navigation.redirectCount
          } : undefined,
          timing: performance.timing ? {
            navigationStart: performance.timing.navigationStart,
            loadEventEnd: performance.timing.loadEventEnd,
            domContentLoaded: performance.timing.domContentLoadedEventEnd
          } : undefined
        }
      }
    } catch {
      return {}
    }
  }

  private createErrorReport(error: RHYError): ErrorReport {
    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: error.severity,
      category: error.category,
      message: error.message,
      code: error.code,
      context: error.context,
      retryCount: 0,
      resolved: false
    }
  }

  private logError(error: RHYError, report: ErrorReport) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 RHY Error [${error.severity.toUpperCase()}]`)
      console.error('Error:', error)
      console.log('Report:', report)
      console.log('Context:', error.context)
      console.groupEnd()
    }
  }

  private async sendToMonitoring(report: ErrorReport) {
    try {
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          source: 'error_handler',
          environment: process.env.NODE_ENV,
          version: process.env.NEXT_PUBLIC_APP_VERSION,
          buildId: process.env.NEXT_PUBLIC_BUILD_ID
        })
      })
    } catch (error) {
      console.warn('Failed to send error report to monitoring:', error)
      this.storeErrorOffline(report)
    }
  }

  private storeErrorOffline(report: ErrorReport) {
    if (typeof window === 'undefined') return
    
    try {
      const stored = JSON.parse(localStorage.getItem('offlineErrors') || '[]')
      stored.push({ ...report, storedAt: Date.now() })
      localStorage.setItem('offlineErrors', JSON.stringify(stored.slice(-50))) // Keep last 50
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private notifyListeners(report: ErrorReport) {
    this.errorListeners.forEach(listener => {
      try {
        listener(report)
      } catch (error) {
        console.warn('Error listener threw an error:', error)
      }
    })
  }

  private scheduleRetry(error: RHYError, config: Partial<RetryConfig>) {
    const fullConfig: RetryConfig = {
      maxAttempts: 3,
      strategy: RetryStrategy.EXPONENTIAL,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      timeout: 10000,
      ...config
    }

    const queueId = `retry_${error.code}_${Date.now()}`
    const queue = new RetryQueue(fullConfig)
    this.retryQueues.set(queueId, queue)

    // Clean up queue after completion
    queue.onComplete(() => {
      this.retryQueues.delete(queueId)
    })
  }

  // Public API methods
  public subscribe(listener: (error: ErrorReport) => void): () => void {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  public getErrorReport(id: string): ErrorReport | undefined {
    return this.errorReports.get(id)
  }

  public getAllErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values())
  }

  public acknowledgeError(id: string): void {
    const report = this.errorReports.get(id)
    if (report) {
      report.acknowledgedAt = new Date().toISOString()
      this.errorReports.set(id, report)
    }
  }

  public resolveError(id: string): void {
    const report = this.errorReports.get(id)
    if (report) {
      report.resolved = true
      report.resolvedAt = new Date().toISOString()
      this.errorReports.set(id, report)
    }
  }

  public clearErrorReports(): void {
    this.errorReports.clear()
  }

  // Retry utilities
  public async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const fullConfig: RetryConfig = {
      maxAttempts: 3,
      strategy: RetryStrategy.EXPONENTIAL,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      ...config
    }

    let lastError: Error
    
    for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === fullConfig.maxAttempts) break
        
        // Check retry condition
        if (fullConfig.retryCondition && !fullConfig.retryCondition(lastError, attempt)) {
          break
        }

        // Calculate delay
        const delay = this.calculateDelay(fullConfig, attempt)
        
        // Call retry callback
        fullConfig.onRetry?.(lastError, attempt)
        
        // Wait before retry
        await this.delay(delay)
      }
    }

    throw lastError!
  }

  private calculateDelay(config: RetryConfig, attempt: number): number {
    switch (config.strategy) {
      case RetryStrategy.IMMEDIATE:
        return 0
      case RetryStrategy.LINEAR:
        return Math.min(config.baseDelay * attempt, config.maxDelay)
      case RetryStrategy.EXPONENTIAL:
        return Math.min(config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1), config.maxDelay)
      default:
        return config.baseDelay
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Retry Queue Implementation
class RetryQueue {
  private completionCallbacks: Set<() => void> = new Set()

  constructor(private config: RetryConfig) {}

  public onComplete(callback: () => void): void {
    this.completionCallbacks.add(callback)
  }

  private notifyCompletion(): void {
    this.completionCallbacks.forEach(callback => callback())
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Utility functions
export const handleApiError = (error: any): RHYError => {
  if (error.response) {
    // HTTP error
    const status = error.response.status
    const message = error.response.data?.message || error.message
    
    if (status === 401) {
      return new AuthenticationError(message)
    } else if (status === 403) {
      return new RHYError(message, { category: ErrorCategory.AUTHORIZATION })
    } else if (status === 422) {
      return new ValidationError(message)
    } else if (status >= 500) {
      return new RHYError(message, { 
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH 
      })
    }
    
    return new NetworkError(message)
  } else if (error.request) {
    // Network error
    return new NetworkError('Network request failed')
  } else {
    // Other error
    return new RHYError(error.message || 'Unknown error occurred')
  }
}

export const createWarehouseError = (message: string, warehouseId: string, operation: string): WarehouseOperationError => {
  return new WarehouseOperationError(message, {
    context: {
      warehouseId,
      businessContext: { operationId: operation }
    }
  })
}

// React Hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: Error | RHYError, options?: Parameters<typeof errorHandler.handleError>[1]) => {
    return errorHandler.handleError(error, options)
  }

  const withRetry = <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>) => {
    return errorHandler.withRetry(operation, config)
  }

  return { handleError, withRetry }
}