/**
 * RHY Database Connection Pool Manager
 * Enterprise-grade PostgreSQL connection pooling with monitoring and optimization
 * Supports multi-database connections with failover and load balancing
 */

import { Pool, PoolClient, PoolConfig } from 'pg'
import { EventEmitter } from 'events'

interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  poolSize?: number
  idleTimeoutMs?: number
  connectionTimeoutMs?: number
  statementTimeoutMs?: number
}

interface ConnectionPoolOptions {
  primary: DatabaseConfig
  replica?: DatabaseConfig
  analytics?: DatabaseConfig
  maxRetries?: number
  retryDelay?: number
  healthCheckInterval?: number
  enableMetrics?: boolean
}

interface PoolMetrics {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingConnections: number
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  averageQueryTime: number
  uptime: number
  lastHealthCheck: Date
}

interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
  command: string
  oid: number
  fields: any[]
}

interface QueryOptions {
  timeout?: number
  retries?: number
  useReplica?: boolean
  useAnalytics?: boolean
  skipMetrics?: boolean
}

export class DatabaseConnectionPool extends EventEmitter {
  private primaryPool: Pool
  private replicaPool?: Pool
  private analyticsPool?: Pool
  private options: ConnectionPoolOptions
  private metrics: PoolMetrics
  private healthCheckTimer?: NodeJS.Timeout
  private isHealthy: boolean = false
  private startTime: number

  constructor(options: ConnectionPoolOptions) {
    super()
    this.options = options
    this.startTime = Date.now()
    this.metrics = this.initializeMetrics()
    this.initializePools()
    this.startHealthChecks()
  }

  /**
   * Initialize connection pools
   */
  private initializePools(): void {
    // Primary pool configuration
    const primaryConfig: PoolConfig = {
      host: this.options.primary.host,
      port: this.options.primary.port,
      database: this.options.primary.database,
      user: this.options.primary.username,
      password: this.options.primary.password,
      max: this.options.primary.poolSize || 20,
      idleTimeoutMillis: this.options.primary.idleTimeoutMs || 30000,
      connectionTimeoutMillis: this.options.primary.connectionTimeoutMs || 5000,
      statement_timeout: this.options.primary.statementTimeoutMs || 30000,
      ssl: this.options.primary.ssl ? { rejectUnauthorized: false } : false,
      application_name: 'RHY_Supplier_Portal_Primary',
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    }

    this.primaryPool = new Pool(primaryConfig)
    this.setupPoolEvents(this.primaryPool, 'primary')

    // Replica pool if configured
    if (this.options.replica) {
      const replicaConfig: PoolConfig = {
        ...primaryConfig,
        host: this.options.replica.host,
        port: this.options.replica.port,
        database: this.options.replica.database,
        user: this.options.replica.username,
        password: this.options.replica.password,
        max: this.options.replica.poolSize || 15,
        application_name: 'RHY_Supplier_Portal_Replica'
      }

      this.replicaPool = new Pool(replicaConfig)
      this.setupPoolEvents(this.replicaPool, 'replica')
    }

    // Analytics pool if configured
    if (this.options.analytics) {
      const analyticsConfig: PoolConfig = {
        ...primaryConfig,
        host: this.options.analytics.host,
        port: this.options.analytics.port,
        database: this.options.analytics.database,
        user: this.options.analytics.username,
        password: this.options.analytics.password,
        max: this.options.analytics.poolSize || 10,
        application_name: 'RHY_Supplier_Portal_Analytics'
      }

      this.analyticsPool = new Pool(analyticsConfig)
      this.setupPoolEvents(this.analyticsPool, 'analytics')
    }
  }

  /**
   * Setup event listeners for pool monitoring
   */
  private setupPoolEvents(pool: Pool, poolName: string): void {
    pool.on('connect', (client: PoolClient) => {
      this.metrics.totalConnections++
      this.emit('poolEvent', { type: 'connect', pool: poolName, timestamp: new Date() })
    })

    pool.on('acquire', (client: PoolClient) => {
      this.metrics.activeConnections++
      this.emit('poolEvent', { type: 'acquire', pool: poolName, timestamp: new Date() })
    })

    pool.on('release', (err: Error | undefined, client: PoolClient) => {
      this.metrics.activeConnections--
      this.emit('poolEvent', { 
        type: 'release', 
        pool: poolName, 
        error: err, 
        timestamp: new Date() 
      })
    })

    pool.on('error', (err: Error, client: PoolClient) => {
      this.metrics.failedQueries++
      this.emit('poolError', { error: err, pool: poolName, timestamp: new Date() })
      console.error(`Database pool error in ${poolName}:`, err)
    })

    pool.on('remove', (client: PoolClient) => {
      this.metrics.totalConnections--
      this.emit('poolEvent', { type: 'remove', pool: poolName, timestamp: new Date() })
    })
  }

  /**
   * Execute query with automatic pool selection and retry logic
   */
  async query<T = any>(
    text: string, 
    params?: any[], 
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now()
    const maxRetries = options.retries || this.options.maxRetries || 3
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const pool = this.selectPool(options)
        const client = await this.acquireClient(pool, options.timeout)
        
        try {
          // Set statement timeout if specified
          if (options.timeout) {
            await client.query(`SET statement_timeout = ${options.timeout}`)
          }

          const result = await client.query(text, params)
          
          // Update metrics
          if (!options.skipMetrics) {
            this.updateQueryMetrics(startTime, true)
          }

          return result
        } finally {
          client.release()
        }

      } catch (error) {
        lastError = error as Error
        this.metrics.failedQueries++
        
        // Log retry attempts
        if (attempt < maxRetries) {
          console.warn(`Query attempt ${attempt + 1} failed, retrying:`, error.message)
          await this.delay(this.options.retryDelay || 1000)
        }
      }
    }

    // Update metrics for failed query
    if (!options.skipMetrics) {
      this.updateQueryMetrics(startTime, false)
    }

    throw new Error(`Query failed after ${maxRetries + 1} attempts: ${lastError.message}`)
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const pool = this.selectPool(options)
    const client = await this.acquireClient(pool, options.timeout)

    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Execute query with connection from specific pool
   */
  async queryWithPool<T = any>(
    poolType: 'primary' | 'replica' | 'analytics',
    text: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pool = this.getPoolByType(poolType)
    if (!pool) {
      throw new Error(`Pool type '${poolType}' is not configured`)
    }

    const client = await this.acquireClient(pool, options.timeout)
    
    try {
      const startTime = Date.now()
      const result = await client.query(text, params)
      
      if (!options.skipMetrics) {
        this.updateQueryMetrics(startTime, true)
      }

      return result
    } catch (error) {
      this.metrics.failedQueries++
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get dedicated client for long-running operations
   */
  async getClient(options: QueryOptions = {}): Promise<PoolClient> {
    const pool = this.selectPool(options)
    return this.acquireClient(pool, options.timeout)
  }

  /**
   * Select appropriate pool based on options and query type
   */
  private selectPool(options: QueryOptions): Pool {
    if (options.useAnalytics && this.analyticsPool) {
      return this.analyticsPool
    }
    
    if (options.useReplica && this.replicaPool) {
      return this.replicaPool
    }

    return this.primaryPool
  }

  /**
   * Get pool by type
   */
  private getPoolByType(type: 'primary' | 'replica' | 'analytics'): Pool | undefined {
    switch (type) {
      case 'primary':
        return this.primaryPool
      case 'replica':
        return this.replicaPool
      case 'analytics':
        return this.analyticsPool
      default:
        return undefined
    }
  }

  /**
   * Acquire client with timeout handling
   */
  private async acquireClient(pool: Pool, timeout?: number): Promise<PoolClient> {
    if (timeout) {
      return Promise.race([
        pool.connect(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Client acquisition timeout')), timeout)
        )
      ])
    }
    
    return pool.connect()
  }

  /**
   * Update query execution metrics
   */
  private updateQueryMetrics(startTime: number, success: boolean): void {
    const duration = Date.now() - startTime
    this.metrics.totalQueries++
    
    if (success) {
      this.metrics.successfulQueries++
    }

    // Update rolling average
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + duration) / 
      this.metrics.totalQueries
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    const interval = this.options.healthCheckInterval || 30000

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error('Health check failed:', error)
      }
    }, interval)

    // Initial health check
    this.performHealthCheck()
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      const healthChecks = []

      // Primary pool health check
      healthChecks.push(this.checkPoolHealth(this.primaryPool, 'primary'))

      // Replica pool health check if available
      if (this.replicaPool) {
        healthChecks.push(this.checkPoolHealth(this.replicaPool, 'replica'))
      }

      // Analytics pool health check if available
      if (this.analyticsPool) {
        healthChecks.push(this.checkPoolHealth(this.analyticsPool, 'analytics'))
      }

      const results = await Promise.allSettled(healthChecks)
      const allHealthy = results.every(result => result.status === 'fulfilled')

      this.isHealthy = allHealthy
      this.metrics.lastHealthCheck = new Date()
      this.metrics.uptime = Date.now() - this.startTime

      this.emit('healthCheck', {
        healthy: allHealthy,
        results: results.map((result, index) => ({
          pool: ['primary', 'replica', 'analytics'][index],
          status: result.status,
          reason: result.status === 'rejected' ? result.reason : null
        })),
        timestamp: new Date()
      })

      return allHealthy
    } catch (error) {
      this.isHealthy = false
      this.emit('healthCheckError', { error, timestamp: new Date() })
      return false
    }
  }

  /**
   * Check individual pool health
   */
  private async checkPoolHealth(pool: Pool, poolName: string): Promise<void> {
    const client = await pool.connect()
    
    try {
      // Test basic connectivity
      await client.query('SELECT 1 as health_check')
      
      // Check for recent activity
      await client.query('SELECT NOW() as current_time')
      
      // Update pool-specific metrics
      this.updatePoolMetrics(pool, poolName)
      
    } finally {
      client.release()
    }
  }

  /**
   * Update pool-specific metrics
   */
  private updatePoolMetrics(pool: Pool, poolName: string): void {
    this.metrics.totalConnections = pool.totalCount
    this.metrics.activeConnections = pool.totalCount - pool.idleCount
    this.metrics.idleConnections = pool.idleCount
    this.metrics.waitingConnections = pool.waitingCount
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    return { ...this.metrics }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): Record<string, any> {
    const stats: Record<string, any> = {
      primary: {
        totalCount: this.primaryPool.totalCount,
        idleCount: this.primaryPool.idleCount,
        waitingCount: this.primaryPool.waitingCount
      }
    }

    if (this.replicaPool) {
      stats.replica = {
        totalCount: this.replicaPool.totalCount,
        idleCount: this.replicaPool.idleCount,
        waitingCount: this.replicaPool.waitingCount
      }
    }

    if (this.analyticsPool) {
      stats.analytics = {
        totalCount: this.analyticsPool.totalCount,
        idleCount: this.analyticsPool.idleCount,
        waitingCount: this.analyticsPool.waitingCount
      }
    }

    return stats
  }

  /**
   * Check if pools are healthy
   */
  isHealthyStatus(): boolean {
    return this.isHealthy
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    const closeTasks = [this.primaryPool.end()]

    if (this.replicaPool) {
      closeTasks.push(this.replicaPool.end())
    }

    if (this.analyticsPool) {
      closeTasks.push(this.analyticsPool.end())
    }

    await Promise.all(closeTasks)
    this.emit('poolsClosed', { timestamp: new Date() })
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): PoolMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      uptime: 0,
      lastHealthCheck: new Date()
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Connection pool factory with environment-based configuration
 */
export class DatabaseConnectionFactory {
  private static instance: DatabaseConnectionPool

  static create(config?: Partial<ConnectionPoolOptions>): DatabaseConnectionPool {
    if (!this.instance) {
      const defaultConfig: ConnectionPoolOptions = {
        primary: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'rhy_supplier_portal',
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          ssl: process.env.DB_SSL === 'true',
          poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
          idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
          connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
          statementTimeoutMs: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000')
        },
        maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
        healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'),
        enableMetrics: process.env.DB_ENABLE_METRICS !== 'false'
      }

      // Add replica configuration if available
      if (process.env.DB_REPLICA_HOST) {
        defaultConfig.replica = {
          host: process.env.DB_REPLICA_HOST,
          port: parseInt(process.env.DB_REPLICA_PORT || '5432'),
          database: process.env.DB_REPLICA_NAME || process.env.DB_NAME || 'rhy_supplier_portal',
          username: process.env.DB_REPLICA_USER || process.env.DB_USER || 'postgres',
          password: process.env.DB_REPLICA_PASSWORD || process.env.DB_PASSWORD || 'password',
          ssl: process.env.DB_REPLICA_SSL === 'true',
          poolSize: parseInt(process.env.DB_REPLICA_POOL_SIZE || '15')
        }
      }

      // Add analytics configuration if available
      if (process.env.DB_ANALYTICS_HOST) {
        defaultConfig.analytics = {
          host: process.env.DB_ANALYTICS_HOST,
          port: parseInt(process.env.DB_ANALYTICS_PORT || '5432'),
          database: process.env.DB_ANALYTICS_NAME || 'rhy_analytics',
          username: process.env.DB_ANALYTICS_USER || process.env.DB_USER || 'postgres',
          password: process.env.DB_ANALYTICS_PASSWORD || process.env.DB_PASSWORD || 'password',
          ssl: process.env.DB_ANALYTICS_SSL === 'true',
          poolSize: parseInt(process.env.DB_ANALYTICS_POOL_SIZE || '10')
        }
      }

      const finalConfig = { ...defaultConfig, ...config }
      this.instance = new DatabaseConnectionPool(finalConfig)
    }

    return this.instance
  }

  static getInstance(): DatabaseConnectionPool {
    if (!this.instance) {
      throw new Error('Database connection pool not initialized. Call create() first.')
    }
    return this.instance
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close()
      this.instance = null as any
    }
  }
}

// Export singleton instance
export const dbPool = DatabaseConnectionFactory.create()

// Export types
export type { 
  DatabaseConfig, 
  ConnectionPoolOptions, 
  PoolMetrics, 
  QueryResult, 
  QueryOptions 
}