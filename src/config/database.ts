/**
 * RHY Supplier Portal Database Configuration
 * Enterprise-grade PostgreSQL configuration for multi-warehouse operations
 * Supporting US West, Japan, EU, and Australia regions
 */

import { z } from 'zod'

// =============================================================================
// ENVIRONMENT VALIDATION SCHEMAS
// =============================================================================

const DatabaseEnvironmentSchema = z.object({
  // Primary database configuration
  RHY_DATABASE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  
  // Multi-warehouse database URLs
  RHY_DATABASE_URL_US_WEST: z.string().url().optional(),
  RHY_DATABASE_URL_JAPAN: z.string().url().optional(),
  RHY_DATABASE_URL_EU: z.string().url().optional(),
  RHY_DATABASE_URL_AUSTRALIA: z.string().url().optional(),
  
  // Connection pool configuration
  DB_POOL_SIZE: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  DB_MIN_CONNECTIONS: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  DB_MAX_CONNECTIONS: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  
  // Timeout configuration (milliseconds)
  DB_CONNECTION_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000).max(120000)).optional(),
  DB_QUERY_TIMEOUT: z.string().transform(Number).pipe(z.number().min(100).max(60000)).optional(),
  DB_IDLE_TIMEOUT: z.string().transform(Number).pipe(z.number().min(30000).max(1800000)).optional(),
  
  // Retry configuration
  DB_MAX_RETRIES: z.string().transform(Number).pipe(z.number().min(1).max(10)).optional(),
  DB_RETRY_DELAY: z.string().transform(Number).pipe(z.number().min(100).max(10000)).optional(),
  
  // Monitoring and logging
  DB_ENABLE_LOGGING: z.string().transform(val => val === 'true').optional(),
  DB_ENABLE_METRICS: z.string().transform(val => val !== 'false').optional(),
  DB_SLOW_QUERY_THRESHOLD: z.string().transform(Number).pipe(z.number().min(10).max(5000)).optional(),
  
  // Security configuration
  DB_SSL_MODE: z.enum(['require', 'prefer', 'allow', 'disable']).optional(),
  DB_SSL_CERT: z.string().optional(),
  DB_SSL_KEY: z.string().optional(),
  DB_SSL_CA: z.string().optional(),
  
  // Application environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
})

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type WarehouseRegion = 'us-west' | 'japan' | 'eu' | 'australia'

export interface DatabaseConfig {
  // Connection settings
  url: string
  poolSize: number
  minConnections: number
  maxConnections: number
  
  // Timeout settings (milliseconds)
  connectionTimeout: number
  queryTimeout: number
  idleTimeout: number
  maxLifetime: number
  
  // Retry settings
  maxRetries: number
  retryDelay: number
  
  // Monitoring settings
  enableLogging: boolean
  enableMetrics: boolean
  slowQueryThreshold: number
  
  // SSL settings
  ssl: {
    mode: 'require' | 'prefer' | 'allow' | 'disable'
    cert?: string
    key?: string
    ca?: string
  }
  
  // Multi-warehouse settings
  warehouses: Record<WarehouseRegion, {
    url: string
    timezone: string
    currency: string
    region: string
  }>
}

export interface PerformanceMetrics {
  connectionPoolUtilization: number
  averageQueryTime: number
  slowQueriesCount: number
  errorRate: number
  throughputPerSecond: number
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  activeConnections: number
  errors: string[]
  lastCheck: Date
  warehouses: Record<WarehouseRegion, {
    status: 'healthy' | 'degraded' | 'unhealthy'
    latency: number
  }>
}

// =============================================================================
// CONFIGURATION FACTORY
// =============================================================================

/**
 * Create database configuration with environment validation and defaults
 */
function createDatabaseConfig(): DatabaseConfig {
  // Parse and validate environment variables
  const env = DatabaseEnvironmentSchema.parse(process.env)
  
  // Determine environment
  const isDevelopment = env.NODE_ENV === 'development' || 
                       env.VERCEL_ENV === 'development' ||
                       (!env.NODE_ENV && !env.VERCEL_ENV)
  const isProduction = env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production'
  const isTest = env.NODE_ENV === 'test'
  
  // Base database URL with fallbacks
  const baseUrl = env.RHY_DATABASE_URL || 
                  env.DATABASE_URL || 
                  (isDevelopment 
                    ? "file:./prisma/dev.db"
                    : isTest 
                      ? "file:./prisma/test.db"
                      : "postgresql://rhy_user:rhy_password@localhost:5432/rhy_supplier_portal")
  
  // Connection pool settings based on environment
  const poolDefaults = {
    development: { min: 2, max: 10, pool: 5 },
    test: { min: 1, max: 5, pool: 2 },
    production: { min: 5, max: 50, pool: 20 }
  }
  
  const poolConfig = isProduction 
    ? poolDefaults.production 
    : isTest 
      ? poolDefaults.test 
      : poolDefaults.development
  
  // Timeout settings based on environment
  const timeoutDefaults = {
    development: { connection: 10000, query: 30000, idle: 300000 },
    test: { connection: 5000, query: 10000, idle: 60000 },
    production: { connection: 30000, query: 50000, idle: 600000 }
  }
  
  const timeoutConfig = isProduction 
    ? timeoutDefaults.production 
    : isTest 
      ? timeoutDefaults.test 
      : timeoutDefaults.development
  
  return {
    // Connection settings
    url: baseUrl,
    poolSize: env.DB_POOL_SIZE || poolConfig.pool,
    minConnections: env.DB_MIN_CONNECTIONS || poolConfig.min,
    maxConnections: env.DB_MAX_CONNECTIONS || poolConfig.max,
    
    // Timeout settings
    connectionTimeout: env.DB_CONNECTION_TIMEOUT || timeoutConfig.connection,
    queryTimeout: env.DB_QUERY_TIMEOUT || timeoutConfig.query,
    idleTimeout: env.DB_IDLE_TIMEOUT || timeoutConfig.idle,
    maxLifetime: 3600000, // 1 hour
    
    // Retry settings
    maxRetries: env.DB_MAX_RETRIES || (isProduction ? 5 : 3),
    retryDelay: env.DB_RETRY_DELAY || 1000,
    
    // Monitoring settings
    enableLogging: env.DB_ENABLE_LOGGING ?? isDevelopment,
    enableMetrics: env.DB_ENABLE_METRICS ?? true,
    slowQueryThreshold: env.DB_SLOW_QUERY_THRESHOLD || (isProduction ? 100 : 500),
    
    // SSL settings
    ssl: {
      mode: env.DB_SSL_MODE || (isProduction ? 'require' : 'prefer'),
      cert: env.DB_SSL_CERT,
      key: env.DB_SSL_KEY,
      ca: env.DB_SSL_CA
    },
    
    // Multi-warehouse configuration
    warehouses: {
      'us-west': {
        url: env.RHY_DATABASE_URL_US_WEST || baseUrl,
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        region: 'US West Coast'
      },
      'japan': {
        url: env.RHY_DATABASE_URL_JAPAN || baseUrl,
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        region: 'Japan'
      },
      'eu': {
        url: env.RHY_DATABASE_URL_EU || baseUrl,
        timezone: 'Europe/Berlin',
        currency: 'EUR',
        region: 'European Union'
      },
      'australia': {
        url: env.RHY_DATABASE_URL_AUSTRALIA || baseUrl,
        timezone: 'Australia/Sydney',
        currency: 'AUD',
        region: 'Australia'
      }
    }
  }
}

// =============================================================================
// WAREHOUSE UTILITIES
// =============================================================================

/**
 * Get database URL for specific warehouse region
 */
export function getWarehouseUrl(region: WarehouseRegion): string {
  const config = getDatabaseConfig()
  return config.warehouses[region].url
}

/**
 * Get warehouse configuration
 */
export function getWarehouseConfig(region: WarehouseRegion) {
  const config = getDatabaseConfig()
  return config.warehouses[region]
}

/**
 * Get all supported warehouse regions
 */
export function getSupportedWarehouses(): WarehouseRegion[] {
  return ['us-west', 'japan', 'eu', 'australia']
}

/**
 * Validate warehouse region
 */
export function isValidWarehouse(region: string): region is WarehouseRegion {
  return getSupportedWarehouses().includes(region as WarehouseRegion)
}

/**
 * Get warehouse region from timezone
 */
export function getWarehouseByTimezone(timezone: string): WarehouseRegion | null {
  const config = getDatabaseConfig()
  
  for (const [region, warehouse] of Object.entries(config.warehouses)) {
    if (warehouse.timezone === timezone) {
      return region as WarehouseRegion
    }
  }
  
  return null
}

/**
 * Get warehouse region from currency
 */
export function getWarehouseByCurrency(currency: string): WarehouseRegion | null {
  const config = getDatabaseConfig()
  
  for (const [region, warehouse] of Object.entries(config.warehouses)) {
    if (warehouse.currency === currency) {
      return region as WarehouseRegion
    }
  }
  
  return null
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Generate connection string with optimal parameters
 */
function generateOptimizedConnectionString(baseUrl: string, options: {
  poolSize?: number
  connectionTimeout?: number
  queryTimeout?: number
  sslMode?: string
} = {}): string {
  try {
    const url = new URL(baseUrl)
    
    // Add connection parameters
    url.searchParams.set('connection_limit', (options.poolSize || 20).toString())
    url.searchParams.set('connect_timeout', ((options.connectionTimeout || 30000) / 1000).toString())
    url.searchParams.set('statement_timeout', (options.queryTimeout || 50000).toString())
    
    // SSL configuration
    if (options.sslMode) {
      url.searchParams.set('sslmode', options.sslMode)
    }
    
    // PostgreSQL-specific optimizations
    url.searchParams.set('application_name', 'rhy-supplier-portal')
    url.searchParams.set('tcp_keepalives_idle', '120')
    url.searchParams.set('tcp_keepalives_interval', '30')
    url.searchParams.set('tcp_keepalives_count', '3')
    
    return url.toString()
  } catch (error) {
    console.warn('Failed to parse database URL for optimization:', error)
    return baseUrl
  }
}

/**
 * Calculate optimal pool size based on system resources
 */
function calculateOptimalPoolSize(): number {
  try {
    // Basic heuristic: 2x CPU cores, bounded by environment limits
    const cpuCount = typeof navigator !== 'undefined' 
      ? navigator.hardwareConcurrency || 4 
      : 4
    
    const basePoolSize = Math.max(2, cpuCount * 2)
    
    // Environment-specific limits
    const isProduction = process.env.NODE_ENV === 'production'
    const isTest = process.env.NODE_ENV === 'test'
    
    if (isTest) {
      return Math.min(basePoolSize, 5)
    } else if (isProduction) {
      return Math.min(basePoolSize, 50)
    } else {
      return Math.min(basePoolSize, 10)
    }
  } catch (error) {
    console.warn('Failed to calculate optimal pool size:', error)
    return 5 // Safe fallback
  }
}

// =============================================================================
// MONITORING UTILITIES
// =============================================================================

/**
 * Create performance monitoring configuration
 */
function createMonitoringConfig() {
  const config = getDatabaseConfig()
  
  return {
    enabled: config.enableMetrics,
    slowQueryThreshold: config.slowQueryThreshold,
    healthCheckInterval: 60000, // 1 minute
    metricsRetentionPeriod: 86400000, // 24 hours
    alertThresholds: {
      connectionUtilization: 0.8, // 80%
      queryLatency: config.slowQueryThreshold * 2,
      errorRate: 0.05, // 5%
      warehouseSyncDelay: 30000 // 30 seconds
    }
  }
}

/**
 * Get database feature flags
 */
function getDatabaseFeatures() {
  const config = getDatabaseConfig()
  
  return {
    connectionPooling: true,
    queryOptimization: true,
    healthMonitoring: config.enableMetrics,
    performanceLogging: config.enableLogging,
    multiWarehouse: true,
    automaticFailover: process.env.NODE_ENV === 'production',
    readReplicas: false, // Future feature
    sharding: false, // Future feature
    encryption: config.ssl.mode === 'require'
  }
}

// =============================================================================
// SINGLETON CONFIGURATION
// =============================================================================

let configInstance: DatabaseConfig | null = null

/**
 * Get database configuration (singleton)
 */
export function getDatabaseConfig(): DatabaseConfig {
  if (!configInstance) {
    configInstance = createDatabaseConfig()
  }
  return configInstance
}

/**
 * Reset configuration (for testing)
 */
export function resetDatabaseConfig(): void {
  configInstance = null
}

/**
 * Validate current configuration
 */
export function validateDatabaseConfig(): { isValid: boolean; errors: string[] } {
  try {
    const config = getDatabaseConfig()
    const errors: string[] = []
    
    // Validate URLs
    try {
      new URL(config.url)
    } catch {
      errors.push('Invalid primary database URL')
    }
    
    // Validate warehouse URLs
    for (const [region, warehouse] of Object.entries(config.warehouses)) {
      try {
        new URL(warehouse.url)
      } catch {
        errors.push(`Invalid database URL for warehouse: ${region}`)
      }
    }
    
    // Validate numeric ranges
    if (config.poolSize < 1 || config.poolSize > 100) {
      errors.push('Pool size must be between 1 and 100')
    }
    
    if (config.connectionTimeout < 1000 || config.connectionTimeout > 120000) {
      errors.push('Connection timeout must be between 1s and 2m')
    }
    
    if (config.queryTimeout < 100 || config.queryTimeout > 60000) {
      errors.push('Query timeout must be between 100ms and 1m')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Configuration validation failed: ${error}`]
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createDatabaseConfig,
  createMonitoringConfig,
  getDatabaseFeatures,
  generateOptimizedConnectionString,
  calculateOptimalPoolSize
}

export default getDatabaseConfig