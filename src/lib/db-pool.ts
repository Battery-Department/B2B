/**
 * =============================================================================
 * RHY_008: ENTERPRISE DATABASE CONNECTION POOL CONFIGURATION
 * =============================================================================
 * Production-ready connection pooling for RHY Supplier Portal
 * Features: Multi-warehouse pooling, dynamic scaling, performance monitoring
 * Optimized for global operations: US, Japan, EU, Australia
 * Enhanced security and comprehensive health monitoring
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig } from '@/config/database'
import { logger } from './logger'

// ===================================
// TYPES AND INTERFACES
// ===================================

export type WarehouseLocation = 'US' | 'JP' | 'EU' | 'AU'
export type DatabaseEnvironment = 'development' | 'staging' | 'production' | 'test'

export interface PoolConnection {
  id: string
  client: PrismaClient
  isActive: boolean
  createdAt: Date
  lastUsed: Date
  queryCount: number
  errorCount: number
  warehouseRegion?: WarehouseLocation
  activeQueries: number
  slowQueries: number
  health: {
    isHealthy: boolean
    lastCheck: Date
    responseTime: number
  }
}

export interface PoolMetrics {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  averageQueryTime: number
  totalQueries: number
  errorRate: number
  lastUpdate: Date
  warehouseRegion?: WarehouseLocation
  performance: {
    slowQueryCount: number
    averageAcquireTime: number
    connectionUtilization: number
    healthScore: number
  }
  security: {
    failedConnections: number
    suspiciousActivity: number
    lastSecurityCheck: Date
  }
}

export interface PoolConfiguration {
  minConnections: number
  maxConnections: number
  acquireTimeout: number
  idleTimeout: number
  maxLifetime: number
  healthCheckInterval: number
  enableMetrics: boolean
  warehouseRegion?: WarehouseLocation
  environment: DatabaseEnvironment
  slowQueryThreshold: number
  enableSecurityMonitoring: boolean
  maxRetries: number
  retryDelay: number
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool | null = null
  private connections: Map<string, PoolConnection> = new Map()
  private waitingQueue: Array<{
    resolve: (connection: PoolConnection) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }> = []

  private metrics: PoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    averageQueryTime: 0,
    totalQueries: 0,
    errorRate: 0,
    lastUpdate: new Date(),
    performance: {
      slowQueryCount: 0,
      averageAcquireTime: 0,
      connectionUtilization: 0,
      healthScore: 100
    },
    security: {
      failedConnections: 0,
      suspiciousActivity: 0,
      lastSecurityCheck: new Date()
    }
  }

  private config: PoolConfiguration
  private healthCheckTimer: NodeJS.Timeout | null = null
  private securityTimer: NodeJS.Timeout | null = null
  private isShuttingDown = false
  private poolStartTime = new Date()
  private queryHistory: Array<{ duration: number; timestamp: Date; warehouse?: WarehouseLocation }> = []

  private constructor(config: Partial<PoolConfiguration> = {}) {
    this.config = {
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || config.minConnections?.toString() || '2'),
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || config.maxConnections?.toString() || '20'),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || config.acquireTimeout?.toString() || '30000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || config.idleTimeout?.toString() || '300000'), // 5 minutes
      maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || config.maxLifetime?.toString() || '3600000'), // 1 hour
      healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || config.healthCheckInterval?.toString() || '60000'), // 1 minute
      enableMetrics: process.env.DB_ENABLE_METRICS !== 'false' && (config.enableMetrics ?? true),
      warehouseRegion: config.warehouseRegion,
      environment: (process.env.NODE_ENV as DatabaseEnvironment) || config.environment || 'development',
      slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || config.slowQueryThreshold?.toString() || '100'),
      enableSecurityMonitoring: process.env.DB_ENABLE_SECURITY !== 'false' && (config.enableSecurityMonitoring ?? true),
      maxRetries: parseInt(process.env.DB_MAX_RETRIES || config.maxRetries?.toString() || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || config.retryDelay?.toString() || '1000')
    }

    this.metrics.warehouseRegion = this.config.warehouseRegion
    this.initialize()
  }

  /**
   * Get singleton instance of DatabaseConnectionPool
   */
  static getInstance(config?: Partial<PoolConfiguration>): DatabaseConnectionPool {
    if (!this.instance) {
      this.instance = new DatabaseConnectionPool(config)
    }
    return this.instance
  }

  /**
   * Initialize the connection pool with enterprise features
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing enterprise database connection pool', {
        warehouseRegion: this.config.warehouseRegion,
        environment: this.config.environment,
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections
      })
      
      // Create minimum connections with error handling
      const connectionPromises = []
      for (let i = 0; i < this.config.minConnections; i++) {
        connectionPromises.push(
          this.createConnection().catch(error => {
            logger.warn('Failed to create initial connection', {
              connectionIndex: i + 1,
              warehouseRegion: this.config.warehouseRegion,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            this.metrics.security.failedConnections++
          })
        )
      }
      
      await Promise.allSettled(connectionPromises)

      // Start monitoring systems
      if (this.config.enableMetrics) {
        this.startHealthCheck()
      }
      
      if (this.config.enableSecurityMonitoring) {
        this.startSecurityMonitoring()
      }
      
      // Setup graceful shutdown
      this.setupGracefulShutdown()

      logger.info('Enterprise connection pool initialized successfully', {
        warehouseRegion: this.config.warehouseRegion,
        initialConnections: this.connections.size,
        targetMinConnections: this.config.minConnections
      })
    } catch (error) {
      logger.error('Failed to initialize connection pool', {
        warehouseRegion: this.config.warehouseRegion,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Create a new database connection with enhanced monitoring
   */
  private async createConnection(warehouseRegion?: WarehouseLocation): Promise<PoolConnection> {
    const config = getDatabaseConfig()
    const connectionId = this.generateConnectionId()
    const startTime = Date.now()

    try {
      const targetWarehouse = warehouseRegion || this.config.warehouseRegion
      
      const client = new PrismaClient({
        datasources: {
          db: {
            url: targetWarehouse ? this.getWarehouseUrl(config.url, targetWarehouse) : config.url
          }
        },
        log: this.config.environment === 'development' ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' }
        ] : ['error'],
        errorFormat: 'pretty'
      })

      // Setup query monitoring for this client
      this.setupClientMonitoring(client, connectionId, targetWarehouse)

      // Test connection with timeout
      await Promise.race([
        client.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), this.config.acquireTimeout)
        )
      ])

      // Perform initial health check
      const healthStartTime = Date.now()
      await client.$queryRaw`SELECT 1 as health_check`
      const healthResponseTime = Date.now() - healthStartTime

      const connection: PoolConnection = {
        id: connectionId,
        client,
        isActive: false,
        createdAt: new Date(),
        lastUsed: new Date(),
        queryCount: 0,
        errorCount: 0,
        warehouseRegion: targetWarehouse,
        activeQueries: 0,
        slowQueries: 0,
        health: {
          isHealthy: true,
          lastCheck: new Date(),
          responseTime: healthResponseTime
        }
      }

      this.connections.set(connectionId, connection)
      this.updateMetrics()

      const connectionTime = Date.now() - startTime

      logger.info('Database connection created successfully', {
        connectionId,
        warehouseRegion: targetWarehouse,
        connectionTime,
        healthResponseTime,
        totalConnections: this.connections.size
      })
      
      return connection
    } catch (error) {
      this.metrics.security.failedConnections++
      
      logger.error('Failed to create database connection', {
        connectionId,
        warehouseRegion: warehouseRegion || this.config.warehouseRegion,
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionTime: Date.now() - startTime
      })
      
      throw error
    }
  }

  /**
   * Setup monitoring for individual Prisma client
   */
  private setupClientMonitoring(client: PrismaClient, connectionId: string, warehouse?: WarehouseLocation): void {
    client.$on('query', (event) => {
      const duration = Number(event.duration)
      
      // Record query history
      this.queryHistory.push({
        duration,
        timestamp: new Date(),
        warehouse
      })
      
      // Keep only recent history
      if (this.queryHistory.length > 1000) {
        this.queryHistory = this.queryHistory.slice(-1000)
      }
      
      // Track slow queries
      if (duration > this.config.slowQueryThreshold) {
        const connection = this.connections.get(connectionId)
        if (connection) {
          connection.slowQueries++
        }
        this.metrics.performance.slowQueryCount++
        
        logger.warn('Slow query detected', {
          connectionId,
          duration,
          threshold: this.config.slowQueryThreshold,
          warehouse,
          query: event.query.substring(0, 200)
        })
      }
    })

    client.$on('error', (event) => {
      const connection = this.connections.get(connectionId)
      if (connection) {
        connection.errorCount++
        connection.health.isHealthy = false
      }
      
      logger.error('Database client error', {
        connectionId,
        error: event.message,
        target: event.target,
        warehouse
      })
    })

    client.$on('warn', (event) => {
      logger.warn('Database client warning', {
        connectionId,
        message: event.message,
        target: event.target,
        warehouse
      })
    })
  }

  /**
   * Start security monitoring system
   */
  private startSecurityMonitoring(): void {
    this.securityTimer = setInterval(() => {
      this.performSecurityCheck()
    }, 300000) // Every 5 minutes
  }

  /**
   * Perform security checks on the pool
   */
  private performSecurityCheck(): void {
    const now = Date.now()
    let suspiciousActivity = 0
    
    // Check for unusual connection patterns
    const recentFailures = this.metrics.security.failedConnections
    if (recentFailures > 10) {
      suspiciousActivity++
      logger.warn('High number of failed connections detected', {
        failedConnections: recentFailures,
        warehouseRegion: this.config.warehouseRegion
      })
    }
    
    // Check for excessive error rates
    if (this.metrics.errorRate > 10) {
      suspiciousActivity++
      logger.warn('High error rate detected', {
        errorRate: this.metrics.errorRate,
        warehouseRegion: this.config.warehouseRegion
      })
    }
    
    // Check for connections that have been active too long
    for (const connection of this.connections.values()) {
      if (connection.isActive && 
          (now - connection.lastUsed.getTime()) > 600000) { // 10 minutes
        suspiciousActivity++
        logger.warn('Connection active for extended period', {
          connectionId: connection.id,
          activeDuration: now - connection.lastUsed.getTime(),
          warehouseRegion: connection.warehouseRegion
        })
      }
    }
    
    this.metrics.security.suspiciousActivity = suspiciousActivity
    this.metrics.security.lastSecurityCheck = new Date()
    
    if (suspiciousActivity > 0) {
      logger.warn('Security monitoring detected issues', {
        suspiciousActivityCount: suspiciousActivity,
        warehouseRegion: this.config.warehouseRegion
      })
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info('Received shutdown signal, closing connection pool...', {
        signal,
        warehouseRegion: this.config.warehouseRegion
      })
      
      await this.shutdown()
      process.exit(0)
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2'))
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get warehouse-specific database URL for global operations
   */
  private getWarehouseUrl(baseUrl: string, warehouseRegion: WarehouseLocation): string {
    // Enterprise multi-warehouse database routing
    const warehouseUrls: Record<WarehouseLocation, string> = {
      'US': process.env.RHY_DATABASE_URL_US || process.env.RHY_DATABASE_URL_US_WEST || baseUrl,
      'JP': process.env.RHY_DATABASE_URL_JP || process.env.RHY_DATABASE_URL_JAPAN || baseUrl,
      'EU': process.env.RHY_DATABASE_URL_EU || baseUrl,
      'AU': process.env.RHY_DATABASE_URL_AU || process.env.RHY_DATABASE_URL_AUSTRALIA || baseUrl
    }

    const warehouseUrl = warehouseUrls[warehouseRegion] || baseUrl
    
    if (warehouseUrl !== baseUrl) {
      logger.info('Using warehouse-specific database URL', {
        warehouseRegion,
        hasCustomUrl: true
      })
    }

    return warehouseUrl
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(warehouseRegion?: string): Promise<PoolConnection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down')
    }

    // Try to find an idle connection for the specific warehouse
    let connection = this.findIdleConnection(warehouseRegion)

    if (connection) {
      connection.isActive = true
      connection.lastUsed = new Date()
      this.updateMetrics()
      return connection
    }

    // If no idle connection and under max limit, create new one
    if (this.connections.size < this.config.maxConnections) {
      try {
        connection = await this.createConnection(warehouseRegion)
        connection.isActive = true
        this.updateMetrics()
        return connection
      } catch (error) {
        console.error('Failed to create new connection:', error)
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve)
        if (index !== -1) {
          this.waitingQueue.splice(index, 1)
        }
        reject(new Error(`Connection acquisition timeout after ${this.config.acquireTimeout}ms`))
      }, this.config.acquireTimeout)

      this.waitingQueue.push({ resolve, reject, timeout })
    })
  }

  /**
   * Find an idle connection for a specific warehouse
   */
  private findIdleConnection(warehouseRegion?: string): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive && 
          (!warehouseRegion || connection.warehouseRegion === warehouseRegion)) {
        return connection
      }
    }
    return null
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: PoolConnection): void {
    if (!this.connections.has(connection.id)) {
      console.warn(`⚠️ Attempted to release unknown connection ${connection.id}`)
      return
    }

    connection.isActive = false
    connection.lastUsed = new Date()
    this.updateMetrics()

    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!
      clearTimeout(waiter.timeout)
      
      connection.isActive = true
      waiter.resolve(connection)
      return
    }

    console.log(`🔄 Released connection ${connection.id}`)
  }

  /**
   * Execute a query using pool connection
   */
  async executeQuery<T>(
    operation: (client: PrismaClient) => Promise<T>,
    warehouseRegion?: string
  ): Promise<T> {
    const connection = await this.acquire(warehouseRegion)
    const startTime = Date.now()

    try {
      const result = await operation(connection.client)
      
      connection.queryCount++
      
      // Update average query time
      const queryTime = Date.now() - startTime
      if (this.config.enableMetrics) {
        this.updateQueryMetrics(queryTime)
      }

      return result
    } catch (error) {
      connection.errorCount++
      console.error(`Query failed on connection ${connection.id}:`, error)
      
      // Check if connection is still healthy
      if (this.isConnectionError(error)) {
        await this.removeConnection(connection.id)
      }
      
      throw error
    } finally {
      this.release(connection)
    }
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(queryTime: number): void {
    this.metrics.totalQueries++
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + queryTime) / 
      this.metrics.totalQueries
    
    this.metrics.errorRate = this.calculateErrorRate()
    this.metrics.lastUpdate = new Date()
  }

  /**
   * Calculate error rate across all connections
   */
  private calculateErrorRate(): number {
    let totalQueries = 0
    let totalErrors = 0

    for (const connection of this.connections.values()) {
      totalQueries += connection.queryCount
      totalErrors += connection.errorCount
    }

    return totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0
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
   * Remove and destroy a connection
   */
  private async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return
    }

    try {
      await connection.client.$disconnect()
      console.log(`🗑️ Removed unhealthy connection ${connectionId}`)
    } catch (error) {
      console.error(`Error disconnecting connection ${connectionId}:`, error)
    } finally {
      this.connections.delete(connectionId)
      this.updateMetrics()
    }

    // Create replacement connection if below minimum
    if (this.connections.size < this.config.minConnections && !this.isShuttingDown) {
      try {
        await this.createConnection(connection.warehouseRegion)
      } catch (error) {
        console.error('Failed to create replacement connection:', error)
      }
    }
  }

  /**
   * Start health check timer
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }

  /**
   * Perform health check on all connections
   */
  private async performHealthCheck(): Promise<void> {
    console.log('🏥 Performing pool health check...')
    
    const now = Date.now()
    const connectionsToRemove: string[] = []

    for (const [id, connection] of this.connections.entries()) {
      // Check for expired connections
      if (now - connection.createdAt.getTime() > this.config.maxLifetime) {
        console.log(`⏰ Connection ${id} expired (max lifetime reached)`)
        connectionsToRemove.push(id)
        continue
      }

      // Check for idle timeout
      if (!connection.isActive && 
          now - connection.lastUsed.getTime() > this.config.idleTimeout &&
          this.connections.size > this.config.minConnections) {
        console.log(`💤 Connection ${id} idle timeout`)
        connectionsToRemove.push(id)
        continue
      }

      // Perform basic health check on idle connections
      if (!connection.isActive) {
        try {
          await connection.client.$queryRaw`SELECT 1 as health_check`
        } catch (error) {
          console.log(`🚫 Connection ${id} failed health check`)
          connectionsToRemove.push(id)
        }
      }
    }

    // Remove unhealthy/expired connections
    for (const id of connectionsToRemove) {
      await this.removeConnection(id)
    }

    this.updateMetrics()
    
    console.log(`✅ Health check complete. Active: ${this.metrics.activeConnections}, Idle: ${this.metrics.idleConnections}`)
  }

  /**
   * Update pool metrics
   */
  private updateMetrics(): void {
    let active = 0
    let idle = 0

    for (const connection of this.connections.values()) {
      if (connection.isActive) {
        active++
      } else {
        idle++
      }
    }

    this.metrics.totalConnections = this.connections.size
    this.metrics.activeConnections = active
    this.metrics.idleConnections = idle
    this.metrics.lastUpdate = new Date()
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    return { ...this.metrics }
  }

  /**
   * Get pool configuration
   */
  getConfiguration(): PoolConfiguration {
    return { ...this.config }
  }

  /**
   * Gracefully shutdown the pool
   */
  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down connection pool...')
    
    this.isShuttingDown = true

    // Clear health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    // Reject all waiting requests
    while (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!
      clearTimeout(waiter.timeout)
      waiter.reject(new Error('Connection pool is shutting down'))
    }

    // Disconnect all connections
    const disconnectPromises: Promise<void>[] = []
    for (const connection of this.connections.values()) {
      disconnectPromises.push(
        connection.client.$disconnect().catch(error => 
          console.error(`Error disconnecting ${connection.id}:`, error)
        )
      )
    }

    await Promise.allSettled(disconnectPromises)
    this.connections.clear()
    this.updateMetrics()

    console.log('✅ Connection pool shutdown complete')
  }

  /**
   * Reset the pool (for testing)
   */
  static async reset(): Promise<void> {
    if (this.instance) {
      await this.instance.shutdown()
      this.instance = null
    }
  }
}

// Global pool instance
let globalPool: DatabaseConnectionPool | null = null

/**
 * Get the global database connection pool
 */
export function getConnectionPool(config?: Partial<PoolConfiguration>): DatabaseConnectionPool {
  if (!globalPool) {
    globalPool = DatabaseConnectionPool.getInstance(config)
  }
  return globalPool
}

/**
 * Execute database operation using connection pool
 */
export async function withPooledDatabase<T>(
  operation: (client: PrismaClient) => Promise<T>,
  warehouseRegion?: string
): Promise<T> {
  const pool = getConnectionPool()
  return await pool.executeQuery(operation, warehouseRegion)
}

/**
 * Get pool metrics for monitoring
 */
export function getPoolMetrics(): PoolMetrics {
  const pool = getConnectionPool()
  return pool.getMetrics()
}

/**
 * Shutdown all database connections
 */
export async function shutdownPool(): Promise<void> {
  await DatabaseConnectionPool.reset()
  globalPool = null
}

export default DatabaseConnectionPool