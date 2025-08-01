/**
 * =============================================================================
 * RHY_008: ENTERPRISE DATABASE CONNECTION CONFIGURATION
 * =============================================================================
 * Production-ready database connection management for RHY Supplier Portal
 * Features: Connection pooling, health monitoring, failover, performance optimization
 * Multi-warehouse support: US, Japan, EU, Australia
 * Enhanced security and comprehensive logging
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig } from '@/config/database'
import { logger } from './logger'

// ===================================
// TYPES AND INTERFACES
// ===================================

export type DatabaseEnvironment = 'development' | 'staging' | 'production' | 'test'
export type WarehouseLocation = 'US' | 'JP' | 'EU' | 'AU'

export interface ConnectionStatus {
  isConnected: boolean
  connectionCount: number
  lastHealthCheck: Date | null
  errors: string[]
  latency: number | null
  activeQueries: number
  slowQueries: number
  connectionPool: {
    size: number
    used: number
    available: number
  }
  performance: {
    averageQueryTime: number
    totalQueries: number
    errorRate: number
  }
}

export interface ConnectionOptions {
  maxRetries?: number
  retryDelay?: number
  connectionTimeout?: number
  queryTimeout?: number
  enableLogging?: boolean
  warehouse?: WarehouseLocation
  environment?: DatabaseEnvironment
  poolSize?: number
  slowQueryThreshold?: number
  healthCheckInterval?: number
}

export interface DatabaseMetrics {
  totalConnections: number
  activeConnections: number
  queryCount: number
  slowQueryCount: number
  errorCount: number
  averageResponseTime: number
  uptime: number
  lastHealthCheck: Date | null
  warehouse?: WarehouseLocation
}

export interface QueryMetadata {
  query: string
  duration: number
  timestamp: Date
  warehouse?: WarehouseLocation
  userId?: string
  success: boolean
}

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager | null = null
  private client: PrismaClient | null = null
  private isConnecting = false
  private metrics: DatabaseMetrics
  private queryHistory: QueryMetadata[] = []
  private healthCheckTimer: NodeJS.Timeout | null = null
  private connectionStartTime: Date = new Date()
  
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    connectionCount: 0,
    lastHealthCheck: null,
    errors: [],
    latency: null,
    activeQueries: 0,
    slowQueries: 0,
    connectionPool: {
      size: 0,
      used: 0,
      available: 0
    },
    performance: {
      averageQueryTime: 0,
      totalQueries: 0,
      errorRate: 0
    }
  }

  private readonly maxRetries: number
  private readonly retryDelay: number
  private readonly connectionTimeout: number
  private readonly queryTimeout: number
  private readonly enableLogging: boolean
  private readonly warehouse?: WarehouseLocation
  private readonly environment: DatabaseEnvironment
  private readonly poolSize: number
  private readonly slowQueryThreshold: number
  private readonly healthCheckInterval: number

  private constructor(options: ConnectionOptions = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.connectionTimeout = options.connectionTimeout || 30000
    this.queryTimeout = options.queryTimeout || 50000
    this.enableLogging = options.enableLogging ?? (process.env.NODE_ENV === 'development')
    this.warehouse = options.warehouse
    this.environment = options.environment || (process.env.NODE_ENV as DatabaseEnvironment) || 'development'
    this.poolSize = options.poolSize || parseInt(process.env.DB_POOL_SIZE || '20')
    this.slowQueryThreshold = options.slowQueryThreshold || parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '100')
    this.healthCheckInterval = options.healthCheckInterval || 30000 // 30 seconds

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      queryCount: 0,
      slowQueryCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      uptime: 0,
      lastHealthCheck: null,
      warehouse: this.warehouse
    }

    // Setup graceful shutdown
    this.setupGracefulShutdown()
  }

  /**
   * Get singleton instance of DatabaseConnectionManager
   */
  static getInstance(options?: ConnectionOptions): DatabaseConnectionManager {
    if (!this.instance) {
      this.instance = new DatabaseConnectionManager(options)
    }
    return this.instance
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info('Received shutdown signal, closing database connections...', { signal })
      
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer)
      }
      
      await this.disconnect()
      process.exit(0)
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2')) // Nodemon restart
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        logger.warn('Scheduled health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          warehouse: this.warehouse
        })
      }
    }, this.healthCheckInterval)
  }

  /**
   * Establish database connection with comprehensive monitoring and enterprise features
   */
  async connect(): Promise<PrismaClient> {
    if (this.client && this.connectionStatus.isConnected) {
      return this.client
    }

    if (this.isConnecting) {
      // Wait for ongoing connection attempt
      await this.waitForConnection()
      if (this.client && this.connectionStatus.isConnected) {
        return this.client
      }
    }

    this.isConnecting = true

    try {
      logger.info('Initiating database connection', {
        warehouse: this.warehouse,
        environment: this.environment,
        poolSize: this.poolSize,
        attempt: this.metrics.totalConnections + 1
      })

      await this.establishConnection()
      this.isConnecting = false
      
      // Start health monitoring
      this.startHealthChecks()
      
      logger.info('Database connection established successfully', {
        warehouse: this.warehouse,
        connectionTime: Date.now() - this.connectionStartTime.getTime(),
        latency: this.connectionStatus.latency
      })
      
      return this.client!
    } catch (error) {
      this.isConnecting = false
      this.handleConnectionError(error)
      throw error
    }
  }

  /**
   * Establish new Prisma client connection with enterprise configuration
   */
  private async establishConnection(): Promise<void> {
    const config = getDatabaseConfig()
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info('Attempting database connection', {
          attempt,
          maxRetries: this.maxRetries,
          warehouse: this.warehouse,
          environment: this.environment
        })

        const startTime = Date.now()

        // Create Prisma client with enterprise configuration
        this.client = new PrismaClient({
          datasources: {
            db: {
              url: config.url
            }
          },
          log: this.enableLogging ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'info', emit: 'stdout' }
          ] : ['error'],
          errorFormat: 'pretty'
        })

        // Setup comprehensive query monitoring
        this.setupQueryMonitoring()

        // Test connection with timeout
        await Promise.race([
          this.client.$connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout)
          )
        ])

        // Perform comprehensive health check
        await this.performHealthCheck()

        // Update connection metrics
        const latency = Date.now() - startTime
        this.metrics.totalConnections++
        this.metrics.activeConnections++
        
        this.connectionStatus = {
          ...this.connectionStatus,
          isConnected: true,
          connectionCount: this.connectionStatus.connectionCount + 1,
          lastHealthCheck: new Date(),
          errors: [],
          latency,
          connectionPool: {
            size: this.poolSize,
            used: 1,
            available: this.poolSize - 1
          }
        }

        logger.info('Database connection established', {
          latency,
          attempt,
          warehouse: this.warehouse,
          connectionCount: this.connectionStatus.connectionCount,
          poolSize: this.poolSize
        })

        return

      } catch (error) {
        this.metrics.errorCount++
        
        logger.error('Connection attempt failed', {
          attempt,
          maxRetries: this.maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error',
          warehouse: this.warehouse,
          stack: error instanceof Error ? error.stack : undefined
        })

        if (this.client) {
          try {
            await this.client.$disconnect()
          } catch (disconnectError) {
            logger.error('Error disconnecting failed client', {
              error: disconnectError instanceof Error ? disconnectError.message : 'Unknown error'
            })
          }
          this.client = null
        }

        if (attempt === this.maxRetries) {
          const finalError = new Error(`Failed to connect after ${this.maxRetries} attempts: ${error}`)
          logger.error('All connection attempts failed', {
            attempts: this.maxRetries,
            finalError: finalError.message,
            warehouse: this.warehouse
          })
          throw finalError
        }

        // Exponential backoff with jitter
        const baseDelay = this.retryDelay * Math.pow(2, attempt - 1)
        const jitter = Math.random() * 1000 // Add up to 1 second of jitter
        const delay = Math.min(baseDelay + jitter, 30000) // Cap at 30 seconds
        
        logger.info('Retrying connection after delay', {
          delay,
          nextAttempt: attempt + 1,
          warehouse: this.warehouse
        })
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * Setup comprehensive query monitoring and logging
   */
  private setupQueryMonitoring(): void {
    if (!this.client) return

    this.client.$on('query', (event) => {
      const duration = Number(event.duration)
      const isSlowQuery = duration > this.slowQueryThreshold
      
      // Record query metrics
      this.recordQueryMetrics({
        query: event.query,
        duration,
        timestamp: new Date(),
        warehouse: this.warehouse,
        success: true
      })

      if (isSlowQuery) {
        this.metrics.slowQueryCount++
        this.connectionStatus.slowQueries++
        
        logger.warn('Slow query detected', {
          query: event.query.substring(0, 200) + (event.query.length > 200 ? '...' : ''),
          duration,
          params: event.params,
          warehouse: this.warehouse,
          threshold: this.slowQueryThreshold
        })
      }

      // Log queries in development mode
      if (this.enableLogging && this.environment === 'development') {
        logger.debug('Database query executed', {
          query: event.query.substring(0, 100) + (event.query.length > 100 ? '...' : ''),
          duration,
          timestamp: event.timestamp,
          warehouse: this.warehouse
        })
      }
    })

    this.client.$on('error', (event) => {
      this.metrics.errorCount++
      this.connectionStatus.errors.push(`${new Date().toISOString()}: ${event.message}`)
      
      logger.error('Database error occurred', {
        message: event.message,
        target: event.target,
        warehouse: this.warehouse,
        timestamp: new Date()
      })
    })

    this.client.$on('warn', (event) => {
      logger.warn('Database warning', {
        message: event.message,
        target: event.target,
        warehouse: this.warehouse,
        timestamp: new Date()
      })
    })
  }

  /**
   * Record query metrics for performance monitoring
   */
  private recordQueryMetrics(metadata: QueryMetadata): void {
    this.metrics.queryCount++
    this.queryHistory.push(metadata)
    
    // Keep only recent query history (last 1000 queries)
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000)
    }
    
    // Calculate average response time
    const recentQueries = this.queryHistory.slice(-100) // Last 100 queries
    this.metrics.averageResponseTime = recentQueries.reduce(
      (sum, query) => sum + query.duration, 0
    ) / recentQueries.length
    
    // Calculate error rate
    const errorQueries = recentQueries.filter(q => !q.success).length
    this.metrics.errorRate = (errorQueries / recentQueries.length) * 100
    
    // Update connection status performance metrics
    this.connectionStatus.performance = {
      averageQueryTime: this.metrics.averageResponseTime,
      totalQueries: this.metrics.queryCount,
      errorRate: this.metrics.errorRate
    }
  }

  /**
   * Perform comprehensive database health check
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.client) {
      throw new Error('No client available for health check')
    }

    const startTime = Date.now()
    
    try {
      // Basic connectivity test
      await this.client.$queryRaw`SELECT 1 as health_check`
      
      // Get database performance metrics
      const dbMetrics = await this.client.$queryRaw<Array<{
        active_connections: number
        max_connections: number
        database_size_mb: number
      }>>`
        SELECT 
          COUNT(*) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0, 2) as database_size_mb
        FROM pg_stat_activity 
        WHERE application_name LIKE 'Prisma%'
      `
      
      const latency = Date.now() - startTime
      
      // Update connection status with detailed metrics
      this.connectionStatus.latency = latency
      this.connectionStatus.lastHealthCheck = new Date()
      this.metrics.lastHealthCheck = new Date()
      this.metrics.uptime = Date.now() - this.connectionStartTime.getTime()
      
      if (dbMetrics && dbMetrics.length > 0) {
        const metrics = dbMetrics[0]
        this.connectionStatus.connectionPool = {
          size: Number(metrics.max_connections),
          used: Number(metrics.active_connections),
          available: Number(metrics.max_connections) - Number(metrics.active_connections)
        }
        
        this.metrics.activeConnections = Number(metrics.active_connections)
        
        // Log warnings for high connection usage
        const utilization = (Number(metrics.active_connections) / Number(metrics.max_connections)) * 100
        if (utilization > 80) {
          logger.warn('High database connection utilization', {
            utilization: utilization.toFixed(1),
            activeConnections: metrics.active_connections,
            maxConnections: metrics.max_connections,
            warehouse: this.warehouse
          })
        }
        
        // Log database size if significant
        if (Number(metrics.database_size_mb) > 1000) {
          logger.info('Database size check', {
            sizeGb: (Number(metrics.database_size_mb) / 1024).toFixed(2),
            warehouse: this.warehouse
          })
        }
      }
      
      // Warn on slow response
      if (latency > 100) {
        logger.warn('Slow database health check response', {
          latency,
          warehouse: this.warehouse,
          threshold: 100
        })
      }

      logger.debug('Database health check completed', {
        latency,
        warehouse: this.warehouse,
        activeConnections: this.metrics.activeConnections,
        uptime: this.metrics.uptime
      })

    } catch (error) {
      this.metrics.errorCount++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('Database health check failed', {
        error: errorMessage,
        latency: Date.now() - startTime,
        warehouse: this.warehouse
      })
      
      throw new Error(`Health check failed: ${errorMessage}`)
    }
  }

  /**
   * Wait for ongoing connection attempt
   */
  private async waitForConnection(): Promise<void> {
    const maxWait = 10000 // 10 seconds
    const checkInterval = 100
    let waited = 0

    while (this.isConnecting && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      waited += checkInterval
    }

    if (this.isConnecting) {
      throw new Error('Connection attempt timed out')
    }
  }

  /**
   * Handle connection errors with detailed logging
   */
  private handleConnectionError(error: any): void {
    const errorMessage = error?.message || 'Unknown connection error'
    const timestamp = new Date().toISOString()

    this.connectionStatus.errors.push(`${timestamp}: ${errorMessage}`)
    this.connectionStatus.isConnected = false

    // Log specific error types
    if (errorMessage.includes('ECONNREFUSED')) {
      console.error('🚫 Database server is not running or not accessible')
    } else if (errorMessage.includes('timeout')) {
      console.error('⏱️ Database connection timed out')
    } else if (errorMessage.includes('authentication')) {
      console.error('🔐 Database authentication failed')
    } else {
      console.error('💥 Unexpected database error:', error)
    }
  }

  /**
   * Execute database operation with comprehensive error handling and retry logic
   */
  async executeQuery<T>(
    operation: (client: PrismaClient) => Promise<T>,
    options?: {
      timeout?: number
      retries?: number
      userId?: string
      warehouse?: WarehouseLocation
    }
  ): Promise<T> {
    const client = await this.connect()
    const timeout = options?.timeout || this.queryTimeout
    const retries = options?.retries || 1
    const userId = options?.userId
    const warehouse = options?.warehouse || this.warehouse

    this.connectionStatus.activeQueries++
    const startTime = Date.now()
    let lastError: Error

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          operation(client),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout)
          )
        ])

        // Record successful query
        const duration = Date.now() - startTime
        this.recordQueryMetrics({
          query: 'ExecuteQuery-Success',
          duration,
          timestamp: new Date(),
          warehouse,
          userId,
          success: true
        })

        this.connectionStatus.activeQueries--
        return result

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const duration = Date.now() - startTime
        
        // Record failed query
        this.recordQueryMetrics({
          query: 'ExecuteQuery-Error',
          duration,
          timestamp: new Date(),
          warehouse,
          userId,
          success: false
        })

        logger.error('Query execution failed', {
          attempt,
          maxRetries: retries,
          error: lastError.message,
          duration,
          warehouse,
          userId,
          stack: lastError.stack
        })
        
        // Handle connection errors
        if (this.isConnectionError(lastError)) {
          this.connectionStatus.isConnected = false
          logger.warn('Connection error detected, triggering reconnection', {
            error: lastError.message,
            warehouse,
            attempt
          })
          
          await this.disconnect()
          
          // For connection errors, retry with new connection
          if (attempt < retries) {
            logger.info('Retrying operation after connection reset', {
              attempt: attempt + 1,
              warehouse
            })
            
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Progressive delay
            continue
          }
        }

        // Don't retry non-connection errors
        if (attempt >= retries) {
          break
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      }
    }

    this.connectionStatus.activeQueries--
    
    logger.error('Query execution failed after all retries', {
      retries,
      finalError: lastError.message,
      warehouse,
      userId
    })
    
    throw lastError
  }

  /**
   * Check if error indicates connection loss
   */
  private isConnectionError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || ''
    return errorMessage.includes('connection') ||
           errorMessage.includes('disconnected') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('econnrefused')
  }

  /**
   * Get current connection status with comprehensive metrics
   */
  getStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  /**
   * Get detailed database metrics
   */
  getMetrics(): DatabaseMetrics {
    this.metrics.uptime = Date.now() - this.connectionStartTime.getTime()
    return { ...this.metrics }
  }

  /**
   * Get recent query history for analysis
   */
  getQueryHistory(limit: number = 100): QueryMetadata[] {
    return this.queryHistory.slice(-limit)
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    slowQueries: QueryMetadata[]
    errorQueries: QueryMetadata[]
    averageResponseTime: number
    queryDistribution: Record<string, number>
    peakTimes: Array<{ hour: number; queryCount: number }>
  } {
    const recentQueries = this.queryHistory.slice(-1000)
    const slowQueries = recentQueries.filter(q => q.duration > this.slowQueryThreshold)
    const errorQueries = recentQueries.filter(q => !q.success)
    
    // Query distribution by hour
    const hourlyDistribution: Record<number, number> = {}
    recentQueries.forEach(query => {
      const hour = query.timestamp.getHours()
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
    })
    
    const peakTimes = Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), queryCount: count }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 5)
    
    // Query type distribution
    const queryDistribution: Record<string, number> = {}
    recentQueries.forEach(query => {
      const type = query.query.split(' ')[0].toUpperCase()
      queryDistribution[type] = (queryDistribution[type] || 0) + 1
    })

    return {
      slowQueries,
      errorQueries,
      averageResponseTime: this.metrics.averageResponseTime,
      queryDistribution,
      peakTimes
    }
  }

  /**
   * Perform comprehensive health check with detailed reporting
   */
  async healthCheck(): Promise<ConnectionStatus> {
    try {
      if (this.client && this.connectionStatus.isConnected) {
        await this.performHealthCheck()
      } else {
        await this.connect()
      }
      
      logger.info('Health check completed successfully', {
        warehouse: this.warehouse,
        latency: this.connectionStatus.latency,
        activeConnections: this.metrics.activeConnections,
        queryCount: this.metrics.queryCount
      })
    } catch (error) {
      this.handleConnectionError(error)
      
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        warehouse: this.warehouse
      })
    }

    return this.getStatus()
  }

  /**
   * Get database client (connects if necessary)
   */
  async getClient(): Promise<PrismaClient> {
    return await this.connect()
  }

  /**
   * Gracefully disconnect from database with comprehensive cleanup
   */
  async disconnect(): Promise<void> {
    logger.info('Initiating database disconnection', {
      warehouse: this.warehouse,
      uptime: Date.now() - this.connectionStartTime.getTime(),
      totalQueries: this.metrics.queryCount
    })

    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    if (this.client) {
      try {
        // Wait for active queries to complete (with timeout)
        const maxWait = 5000 // 5 seconds
        const startWait = Date.now()
        
        while (this.connectionStatus.activeQueries > 0 && (Date.now() - startWait) < maxWait) {
          logger.info('Waiting for active queries to complete', {
            activeQueries: this.connectionStatus.activeQueries,
            warehouse: this.warehouse
          })
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (this.connectionStatus.activeQueries > 0) {
          logger.warn('Forcing disconnect with active queries', {
            activeQueries: this.connectionStatus.activeQueries,
            warehouse: this.warehouse
          })
        }

        await this.client.$disconnect()
        
        logger.info('Database disconnected successfully', {
          warehouse: this.warehouse,
          finalMetrics: this.getMetrics()
        })
      } catch (error) {
        logger.error('Error during database disconnect', {
          error: error instanceof Error ? error.message : 'Unknown error',
          warehouse: this.warehouse
        })
      } finally {
        this.client = null
        this.connectionStatus.isConnected = false
        this.connectionStatus.activeQueries = 0
        this.metrics.activeConnections = 0
      }
    }
  }

  /**
   * Reset connection (disconnect and clear instance)
   */
  static async reset(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect()
      this.instance = null
    }
  }
}

// Global connection manager instance
let globalConnectionManager: DatabaseConnectionManager | null = null

// ===================================
// CONVENIENCE FUNCTIONS
// ===================================

/**
 * Get the global database connection manager with enterprise features
 */
export function getConnectionManager(options?: ConnectionOptions): DatabaseConnectionManager {
  if (!globalConnectionManager) {
    globalConnectionManager = DatabaseConnectionManager.getInstance(options)
  }
  return globalConnectionManager
}

/**
 * Quick access to database client with automatic connection management
 */
export async function getDatabase(): Promise<PrismaClient> {
  const manager = getConnectionManager()
  return await manager.getClient()
}

/**
 * Execute database operation with comprehensive error handling and monitoring
 */
export async function withDatabase<T>(
  operation: (client: PrismaClient) => Promise<T>,
  options?: {
    timeout?: number
    retries?: number
    userId?: string
    warehouse?: WarehouseLocation
  }
): Promise<T> {
  const manager = getConnectionManager()
  return await manager.executeQuery(operation, options)
}

/**
 * Get comprehensive database health status
 */
export async function getDatabaseHealth(): Promise<ConnectionStatus> {
  const manager = getConnectionManager()
  return await manager.healthCheck()
}

/**
 * Get detailed database performance metrics
 */
export function getDatabaseMetrics(): DatabaseMetrics {
  const manager = getConnectionManager()
  return manager.getMetrics()
}

/**
 * Get database performance analytics for monitoring
 */
export function getDatabaseAnalytics() {
  const manager = getConnectionManager()
  return manager.getPerformanceAnalytics()
}

/**
 * Initialize database connection for specific warehouse
 */
export async function initializeWarehouseDatabase(
  warehouse: WarehouseLocation,
  environment?: DatabaseEnvironment
): Promise<DatabaseConnectionManager> {
  const options: ConnectionOptions = {
    warehouse,
    environment: environment || (process.env.NODE_ENV as DatabaseEnvironment) || 'development',
    enableLogging: process.env.NODE_ENV === 'development',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '100')
  }
  
  const manager = DatabaseConnectionManager.getInstance(options)
  await manager.connect()
  
  logger.info('Warehouse database initialized', {
    warehouse,
    environment: options.environment,
    poolSize: options.poolSize
  })
  
  return manager
}

/**
 * Execute operation with specific warehouse context
 */
export async function withWarehouseDatabase<T>(
  warehouse: WarehouseLocation,
  operation: (client: PrismaClient) => Promise<T>,
  options?: {
    timeout?: number
    retries?: number
    userId?: string
  }
): Promise<T> {
  const manager = getConnectionManager({ warehouse })
  return await manager.executeQuery(operation, { ...options, warehouse })
}

/**
 * Gracefully close all database connections with proper cleanup
 */
export async function closeDatabaseConnections(): Promise<void> {
  logger.info('Closing all database connections...')
  
  if (globalConnectionManager) {
    await globalConnectionManager.disconnect()
    globalConnectionManager = null
  }
  
  await DatabaseConnectionManager.reset()
  
  logger.info('All database connections closed successfully')
}

export default DatabaseConnectionManager