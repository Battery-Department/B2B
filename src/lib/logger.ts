/**
 * Enterprise-Grade Logger for RHY Supplier Portal
 * 
 * @fileoverview Comprehensive logging system supporting structured logging, 
 * multiple log levels, audit trails, and enterprise compliance requirements.
 * Designed for multi-warehouse operations with global compliance.
 * 
 * @author RHY Development Team
 * @version 1.0.0
 * @since 2025-06-24
 */

import { z } from 'zod'

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

/**
 * Log level labels for display
 */
export const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
}

/**
 * Warehouse context for multi-region logging
 */
export interface WarehouseContext {
  warehouseId: string
  region: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA'
  timezone: string
  complianceLevel: 'STANDARD' | 'GDPR' | 'STRICT'
}

/**
 * User context for audit logging
 */
export interface UserContext {
  userId?: string
  supplierId?: string
  email?: string
  role?: string
  sessionId?: string
  deviceFingerprint?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Request context for API logging
 */
export interface RequestContext {
  requestId: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: any
  responseTime?: number
  statusCode?: number
  errorCode?: string
}

/**
 * Business context for domain-specific logging
 */
export interface BusinessContext {
  action: string
  entity: string
  entityId?: string
  previousState?: any
  newState?: any
  reason?: string
  impact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

/**
 * Security context for security events
 */
export interface SecurityContext {
  eventType: 'AUTH' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'SECURITY_VIOLATION' | 'COMPLIANCE'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  threatIndicators?: string[]
  countermeasures?: string[]
}

/**
 * Performance context for performance logging
 */
export interface PerformanceContext {
  operationType: string
  duration: number
  resourceUsage?: {
    memory?: number
    cpu?: number
    database?: number
  }
  cacheHit?: boolean
  optimizations?: string[]
}

/**
 * Comprehensive log entry structure
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  correlationId?: string
  traceId?: string
  spanId?: string
  source: string
  warehouse?: WarehouseContext
  user?: UserContext
  request?: RequestContext
  business?: BusinessContext
  security?: SecurityContext
  performance?: PerformanceContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
    cause?: any
  }
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Log transport interface for extensibility
 */
export interface LogTransport {
  name: string
  level: LogLevel
  format: 'JSON' | 'TEXT' | 'STRUCTURED'
  write(entry: LogEntry): Promise<void>
  flush?(): Promise<void>
  close?(): Promise<void>
}

/**
 * Console transport for development
 */
export class ConsoleTransport implements LogTransport {
  public readonly name = 'console'
  public readonly level: LogLevel
  public readonly format: 'JSON' | 'TEXT' | 'STRUCTURED'

  constructor(level: LogLevel = LogLevel.DEBUG, format: 'JSON' | 'TEXT' | 'STRUCTURED' = 'TEXT') {
    this.level = level
    this.format = format
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) return

    const timestamp = new Date(entry.timestamp).toISOString()
    const levelLabel = LOG_LEVEL_LABELS[entry.level]
    
    if (this.format === 'JSON') {
      console.log(JSON.stringify(entry, null, 2))
    } else if (this.format === 'STRUCTURED') {
      const structured = `[${timestamp}] ${levelLabel} [${entry.source}] ${entry.message}`
      const context = this.formatContext(entry)
      console.log(structured + (context ? '\n' + context : ''))
    } else {
      // TEXT format
      const prefix = `[${timestamp}] ${levelLabel.padEnd(5)} [${entry.source}]`
      const message = `${prefix} ${entry.message}`
      
      switch (entry.level) {
        case LogLevel.TRACE:
        case LogLevel.DEBUG:
          console.debug(message)
          break
        case LogLevel.INFO:
          console.info(message)
          break
        case LogLevel.WARN:
          console.warn(message)
          break
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(message)
          if (entry.error?.stack) {
            console.error(entry.error.stack)
          }
          break
      }
    }
  }

  private formatContext(entry: LogEntry): string {
    const context: string[] = []
    
    if (entry.user) {
      context.push(`User: ${entry.user.email || entry.user.userId || 'anonymous'}`)
    }
    
    if (entry.request) {
      context.push(`Request: ${entry.request.method} ${entry.request.url}`)
      if (entry.request.responseTime) {
        context.push(`Duration: ${entry.request.responseTime}ms`)
      }
    }
    
    if (entry.warehouse) {
      context.push(`Warehouse: ${entry.warehouse.region}/${entry.warehouse.warehouseId}`)
    }
    
    if (entry.business) {
      context.push(`Business: ${entry.business.action} on ${entry.business.entity}`)
    }
    
    if (entry.security) {
      context.push(`Security: ${entry.security.eventType} (${entry.security.riskLevel})`)
    }

    if (entry.correlationId) {
      context.push(`CorrelationId: ${entry.correlationId}`)
    }

    return context.length > 0 ? '  ' + context.join(' | ') : ''
  }
}

/**
 * File transport for production logging
 */
export class FileTransport implements LogTransport {
  public readonly name = 'file'
  public readonly level: LogLevel
  public readonly format: 'JSON' | 'TEXT' | 'STRUCTURED'
  private filePath: string
  private writeQueue: LogEntry[] = []
  private isWriting = false

  constructor(
    filePath: string, 
    level: LogLevel = LogLevel.INFO, 
    format: 'JSON' | 'TEXT' | 'STRUCTURED' = 'JSON'
  ) {
    this.filePath = filePath
    this.level = level
    this.format = format
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) return

    this.writeQueue.push(entry)
    if (!this.isWriting) {
      await this.flushQueue()
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) return

    this.isWriting = true
    try {
      const entries = [...this.writeQueue]
      this.writeQueue = []

      const lines = entries.map(entry => {
        if (this.format === 'JSON') {
          return JSON.stringify(entry)
        } else {
          const timestamp = new Date(entry.timestamp).toISOString()
          const levelLabel = LOG_LEVEL_LABELS[entry.level]
          return `[${timestamp}] ${levelLabel} [${entry.source}] ${entry.message}`
        }
      }).join('\n') + '\n'

      // In a real implementation, this would write to file system
      // For demo purposes, we'll log to console with file prefix
      console.log(`[FILE:${this.filePath}] ${lines}`)
    } finally {
      this.isWriting = false
    }
  }

  async flush(): Promise<void> {
    await this.flushQueue()
  }

  async close(): Promise<void> {
    await this.flush()
  }
}

/**
 * HTTP transport for centralized logging
 */
export class HttpTransport implements LogTransport {
  public readonly name = 'http'
  public readonly level: LogLevel
  public readonly format: 'JSON' | 'TEXT' | 'STRUCTURED' = 'JSON'
  private endpoint: string
  private headers: Record<string, string>
  private batchSize: number
  private flushInterval: number
  private buffer: LogEntry[] = []
  private timer?: NodeJS.Timeout

  constructor(
    endpoint: string, 
    level: LogLevel = LogLevel.INFO,
    options: {
      headers?: Record<string, string>
      batchSize?: number
      flushInterval?: number
    } = {}
  ) {
    this.endpoint = endpoint
    this.level = level
    this.headers = options.headers || {}
    this.batchSize = options.batchSize || 100
    this.flushInterval = options.flushInterval || 5000

    // Start flush timer
    this.timer = setInterval(() => this.flush(), this.flushInterval)
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) return

    this.buffer.push(entry)
    
    if (this.buffer.length >= this.batchSize) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const batch = [...this.buffer]
    this.buffer = []

    try {
      // In production, this would send to actual logging service
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: JSON.stringify({ logs: batch })
      })

      if (!response.ok) {
        console.error(`Failed to send logs to ${this.endpoint}: ${response.status}`)
        // In production, you might want to retry or store in dead letter queue
      }
    } catch (error) {
      console.error(`Error sending logs to ${this.endpoint}:`, error)
      // In production, you might want to retry or store in dead letter queue
    }
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
    }
    await this.flush()
  }
}

/**
 * Main Logger class with enterprise features
 */
export class Logger {
  private source: string
  private transports: LogTransport[] = []
  private correlationId?: string
  private defaultContext: Partial<LogEntry> = {}

  constructor(source: string, options: {
    correlationId?: string
    warehouse?: WarehouseContext
    user?: UserContext
  } = {}) {
    this.source = source
    this.correlationId = options.correlationId
    
    if (options.warehouse) {
      this.defaultContext.warehouse = options.warehouse
    }
    
    if (options.user) {
      this.defaultContext.user = options.user
    }
  }

  /**
   * Add a transport for log output
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  /**
   * Remove a transport
   */
  removeTransport(transportName: string): void {
    this.transports = this.transports.filter(t => t.name !== transportName)
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId
  }

  /**
   * Set default context that will be included in all log entries
   */
  setDefaultContext(context: Partial<LogEntry>): void {
    this.defaultContext = { ...this.defaultContext, ...context }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<LogEntry>): Logger {
    const childLogger = new Logger(this.source, { correlationId: this.correlationId })
    childLogger.transports = this.transports
    childLogger.defaultContext = { ...this.defaultContext, ...context }
    return childLogger
  }

  /**
   * Log at specified level
   */
  async log(
    level: LogLevel, 
    message: string, 
    context: Partial<LogEntry> = {}
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: this.source,
      correlationId: this.correlationId,
      ...this.defaultContext,
      ...context
    }

    // Generate trace/span IDs if not provided
    if (!entry.traceId) {
      entry.traceId = this.generateTraceId()
    }
    if (!entry.spanId) {
      entry.spanId = this.generateSpanId()
    }

    // Write to all transports
    await Promise.all(
      this.transports.map(transport => 
        transport.write(entry).catch(error => 
          console.error(`Transport ${transport.name} failed:`, error)
        )
      )
    )
  }

  /**
   * Convenience methods for different log levels
   */
  async trace(message: string, context?: Partial<LogEntry>): Promise<void> {
    await this.log(LogLevel.TRACE, message, context)
  }

  async debug(message: string, context?: Partial<LogEntry>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context)
  }

  async info(message: string, context?: Partial<LogEntry>): Promise<void> {
    await this.log(LogLevel.INFO, message, context)
  }

  async warn(message: string, context?: Partial<LogEntry>): Promise<void> {
    await this.log(LogLevel.WARN, message, context)
  }

  async error(message: string, error?: Error, context?: Partial<LogEntry>): Promise<void> {
    const errorContext: Partial<LogEntry> = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        cause: (error as any).cause
      } : undefined
    }
    await this.log(LogLevel.ERROR, message, errorContext)
  }

  async fatal(message: string, error?: Error, context?: Partial<LogEntry>): Promise<void> {
    const errorContext: Partial<LogEntry> = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        cause: (error as any).cause
      } : undefined
    }
    await this.log(LogLevel.FATAL, message, errorContext)
  }

  /**
   * Specialized logging methods for different contexts
   */

  /**
   * Log business operations with audit trail
   */
  async audit(
    action: string,
    entity: string,
    entityId: string,
    context: {
      userId?: string
      previousState?: any
      newState?: any
      reason?: string
      impact?: BusinessContext['impact']
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    await this.info(`AUDIT: ${action} performed on ${entity}`, {
      business: {
        action,
        entity,
        entityId,
        previousState: context.previousState,
        newState: context.newState,
        reason: context.reason,
        impact: context.impact || 'MEDIUM'
      },
      user: context.userId ? { userId: context.userId } : undefined,
      metadata: context.metadata,
      tags: ['AUDIT', 'COMPLIANCE']
    })
  }

  /**
   * Log security events
   */
  async security(
    eventType: SecurityContext['eventType'],
    message: string,
    riskLevel: SecurityContext['riskLevel'],
    context: {
      userId?: string
      threatIndicators?: string[]
      countermeasures?: string[]
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    const level = riskLevel === 'CRITICAL' ? LogLevel.FATAL : 
                  riskLevel === 'HIGH' ? LogLevel.ERROR : 
                  riskLevel === 'MEDIUM' ? LogLevel.WARN : LogLevel.INFO

    await this.log(level, `SECURITY: ${message}`, {
      security: {
        eventType,
        riskLevel,
        threatIndicators: context.threatIndicators,
        countermeasures: context.countermeasures
      },
      user: context.userId ? { userId: context.userId } : undefined,
      metadata: context.metadata,
      tags: ['SECURITY', eventType]
    })
  }

  /**
   * Log performance metrics
   */
  async performance(
    operationType: string,
    duration: number,
    context: {
      resourceUsage?: PerformanceContext['resourceUsage']
      cacheHit?: boolean
      optimizations?: string[]
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    await this.info(`PERFORMANCE: ${operationType} completed in ${duration}ms`, {
      performance: {
        operationType,
        duration,
        resourceUsage: context.resourceUsage,
        cacheHit: context.cacheHit,
        optimizations: context.optimizations
      },
      metadata: context.metadata,
      tags: ['PERFORMANCE']
    })
  }

  /**
   * Log API requests and responses
   */
  async request(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context: {
      requestId?: string
      userId?: string
      headers?: Record<string, string>
      body?: any
      errorCode?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO

    await this.log(level, `API: ${method} ${url} ${statusCode} ${responseTime}ms`, {
      request: {
        requestId: context.requestId || this.generateRequestId(),
        method,
        url,
        responseTime,
        statusCode,
        headers: context.headers,
        body: context.body,
        errorCode: context.errorCode
      },
      user: context.userId ? { userId: context.userId } : undefined,
      metadata: context.metadata,
      tags: ['API', method]
    })
  }

  /**
   * Flush all transports
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.transports
        .filter(transport => transport.flush)
        .map(transport => transport.flush!())
    )
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    await Promise.all(
      this.transports
        .filter(transport => transport.close)
        .map(transport => transport.close!())
    )
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 16) + Date.now().toString(36)
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 8)
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substr(2, 12)
  }
}

/**
 * Global logger factory with enterprise configuration
 */
export class LoggerFactory {
  private static instance: LoggerFactory
  private defaultTransports: LogTransport[] = []
  private loggers: Map<string, Logger> = new Map()

  private constructor() {
    this.setupDefaultTransports()
  }

  public static getInstance(): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory()
    }
    return LoggerFactory.instance
  }

  private setupDefaultTransports(): void {
    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      this.defaultTransports.push(
        new ConsoleTransport(LogLevel.DEBUG, 'STRUCTURED')
      )
    }

    // File transport for production
    if (process.env.NODE_ENV === 'production') {
      this.defaultTransports.push(
        new FileTransport('/var/log/rhy-supplier-portal.log', LogLevel.INFO)
      )
    }

    // HTTP transport for centralized logging
    if (process.env.LOG_ENDPOINT) {
      this.defaultTransports.push(
        new HttpTransport(
          process.env.LOG_ENDPOINT,
          LogLevel.WARN,
          {
            headers: {
              'Authorization': `Bearer ${process.env.LOG_API_KEY}`,
              'X-Service': 'rhy-supplier-portal'
            }
          }
        )
      )
    }
  }

  /**
   * Get or create a logger for a source
   */
  getLogger(source: string, context?: {
    correlationId?: string
    warehouse?: WarehouseContext
    user?: UserContext
  }): Logger {
    const key = `${source}:${context?.correlationId || 'default'}`
    
    if (!this.loggers.has(key)) {
      const logger = new Logger(source, context)
      this.defaultTransports.forEach(transport => logger.addTransport(transport))
      this.loggers.set(key, logger)
    }

    return this.loggers.get(key)!
  }

  /**
   * Add a default transport that will be used by all new loggers
   */
  addDefaultTransport(transport: LogTransport): void {
    this.defaultTransports.push(transport)
    // Add to existing loggers
    this.loggers.forEach(logger => logger.addTransport(transport))
  }

  /**
   * Flush all loggers
   */
  async flushAll(): Promise<void> {
    await Promise.all(
      Array.from(this.loggers.values()).map(logger => logger.flush())
    )
  }

  /**
   * Close all loggers
   */
  async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.loggers.values()).map(logger => logger.close())
    )
    this.loggers.clear()
  }
}

// Export singleton factory and convenience functions
export const loggerFactory = LoggerFactory.getInstance()

/**
 * Get a logger instance for a source
 */
export function getLogger(source: string, context?: {
  correlationId?: string
  warehouse?: WarehouseContext
  user?: UserContext
}): Logger {
  return loggerFactory.getLogger(source, context)
}

/**
 * Create a request-scoped logger with correlation ID
 */
export function createRequestLogger(
  source: string, 
  requestId: string, 
  context?: Partial<LogEntry>
): Logger {
  return loggerFactory.getLogger(source, { 
    correlationId: requestId,
    ...context 
  })
}

// Default application logger
export const logger = getLogger('rhy-supplier-portal')

// Export types for external use
export type {
  LogEntry,
  LogTransport,
  WarehouseContext,
  UserContext,
  RequestContext,
  BusinessContext,
  SecurityContext,
  PerformanceContext
}