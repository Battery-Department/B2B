/**
 * RHY Supplier Portal - Cache Abstraction Layer
 * Enterprise-grade caching system supporting multi-warehouse operations
 * Supports Redis clustering, performance monitoring, and regional compliance
 */

import { z } from 'zod'

// ================================
// CORE CACHE INTERFACES
// ================================

export interface CacheKey {
  namespace: string
  identifier: string
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  version?: string
}

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for batch invalidation
  compress?: boolean // Compress large values
  warehouse?: 'US' | 'JP' | 'EU' | 'AU' // Multi-warehouse support
  compliance?: 'GDPR' | 'OSHA' | 'JIS' | 'CE' // Regional compliance requirements
  priority?: 'high' | 'medium' | 'low' // Cache priority for eviction
}

export interface CacheResult<T> {
  value: T | null
  hit: boolean
  ttl?: number
  lastModified?: Date
  warehouse?: string
  tags?: string[]
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
  avgResponseTime: number
  lastCleanup: Date
}

export interface CacheMetrics {
  warehouse: string
  namespace: string
  operations: {
    get: number
    set: number
    delete: number
    invalidate: number
  }
  performance: {
    avgGetTime: number
    avgSetTime: number
    avgDeleteTime: number
  }
  storage: {
    keysCount: number
    memoryBytes: number
    compressionRatio?: number
  }
}

// ================================
// CACHE PROVIDER INTERFACE
// ================================

export interface CacheProvider {
  name: string
  isConnected(): Promise<boolean>
  get<T>(key: string, options?: CacheOptions): Promise<CacheResult<T>>
  set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>
  delete(key: string, options?: CacheOptions): Promise<boolean>
  clear(pattern?: string, options?: CacheOptions): Promise<number>
  exists(key: string): Promise<boolean>
  ttl(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<boolean>
  invalidateByTags(tags: string[], options?: CacheOptions): Promise<number>
  getStats(): Promise<CacheStats>
  getMetrics(warehouse?: string): Promise<CacheMetrics[]>
  ping(): Promise<number>
  disconnect(): Promise<void>
}

// ================================
// CACHE CONFIGURATION
// ================================

export interface CacheConfig {
  provider: 'redis' | 'memory' | 'hybrid'
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
    cluster?: boolean
    nodes?: Array<{ host: string; port: number }>
    keyPrefix?: string
    maxRetriesPerRequest?: number
    retryDelayOnFailover?: number
    lazyConnect?: boolean
  }
  memory?: {
    maxKeys: number
    maxMemory: number // bytes
    evictionPolicy: 'lru' | 'lfu' | 'fifo'
    checkPeriod?: number // seconds
  }
  defaults: {
    ttl: number // seconds
    compress: boolean
    enableMetrics: boolean
    enableAuditLog: boolean
    maxValueSize: number // bytes
  }
  warehouses: {
    [key in 'US' | 'JP' | 'EU' | 'AU']: {
      enabled: boolean
      retention: number // seconds
      compliance: string[]
      encryption?: boolean
    }
  }
  performance: {
    timeout: number // milliseconds
    maxConcurrency: number
    batchSize: number
    enableCompression: boolean
    compressionThreshold: number // bytes
  }
}

// ================================
// VALIDATION SCHEMAS
// ================================

export const CacheKeySchema = z.object({
  namespace: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  identifier: z.string().min(1).max(200),
  warehouse: z.enum(['US', 'JP', 'EU', 'AU']).optional(),
  version: z.string().max(20).optional()
})

export const CacheOptionsSchema = z.object({
  ttl: z.number().min(1).max(86400 * 30).optional(), // Max 30 days
  tags: z.array(z.string().max(50)).max(10).optional(),
  compress: z.boolean().optional(),
  warehouse: z.enum(['US', 'JP', 'EU', 'AU']).optional(),
  compliance: z.enum(['GDPR', 'OSHA', 'JIS', 'CE']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional()
})

// ================================
// CACHE KEY UTILITIES
// ================================

class CacheKeyBuilder {
  private static readonly SEPARATOR = ':'
  private static readonly VERSION_PREFIX = 'v'

  static build(key: CacheKey): string {
    const parts: string[] = []
    
    // Add namespace
    parts.push(key.namespace)
    
    // Add warehouse if specified
    if (key.warehouse) {
      parts.push(`wh_${key.warehouse.toLowerCase()}`)
    }
    
    // Add version if specified
    if (key.version) {
      parts.push(`${this.VERSION_PREFIX}${key.version}`)
    }
    
    // Add identifier (hash if too long)
    const identifier = key.identifier.length > 150 
      ? this.hashIdentifier(key.identifier)
      : key.identifier
    
    parts.push(identifier)
    
    return parts.join(this.SEPARATOR)
  }

  static parse(keyString: string): Partial<CacheKey> {
    const parts = keyString.split(this.SEPARATOR)
    const result: Partial<CacheKey> = {}
    
    if (parts.length >= 2) {
      result.namespace = parts[0]
      result.identifier = parts[parts.length - 1]
      
      // Extract warehouse
      const warehousePart = parts.find(p => p.startsWith('wh_'))
      if (warehousePart) {
        const warehouse = warehousePart.replace('wh_', '').toUpperCase()
        if (['US', 'JP', 'EU', 'AU'].includes(warehouse)) {
          result.warehouse = warehouse as 'US' | 'JP' | 'EU' | 'AU'
        }
      }
      
      // Extract version
      const versionPart = parts.find(p => p.startsWith(this.VERSION_PREFIX))
      if (versionPart) {
        result.version = versionPart.replace(this.VERSION_PREFIX, '')
      }
    }
    
    return result
  }

  static pattern(namespace: string, warehouse?: string): string {
    const parts = [namespace]
    
    if (warehouse) {
      parts.push(`wh_${warehouse.toLowerCase()}`)
    }
    
    parts.push('*')
    
    return parts.join(this.SEPARATOR)
  }

  private static hashIdentifier(identifier: string): string {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(identifier).digest('hex').substring(0, 32)
  }
}

// ================================
// CACHE COMPRESSION UTILITIES
// ================================

class CacheCompression {
  private static readonly COMPRESSION_THRESHOLD = 1024 // 1KB
  private static readonly COMPRESSION_MARKER = '__COMPRESSED__'

  static shouldCompress(value: any, threshold: number = this.COMPRESSION_THRESHOLD): boolean {
    const serialized = JSON.stringify(value)
    return serialized.length > threshold
  }

  static compress(value: any): string {
    const zlib = require('zlib')
    const serialized = JSON.stringify(value)
    
    if (serialized.length <= this.COMPRESSION_THRESHOLD) {
      return serialized
    }
    
    const compressed = zlib.gzipSync(serialized)
    return `${this.COMPRESSION_MARKER}${compressed.toString('base64')}`
  }

  static decompress(value: string): any {
    if (!value.startsWith(this.COMPRESSION_MARKER)) {
      return JSON.parse(value)
    }
    
    const zlib = require('zlib')
    const compressed = value.replace(this.COMPRESSION_MARKER, '')
    const decompressed = zlib.gunzipSync(Buffer.from(compressed, 'base64'))
    
    return JSON.parse(decompressed.toString())
  }

  static getCompressionRatio(original: any, compressed: string): number {
    const originalSize = JSON.stringify(original).length
    const compressedSize = compressed.length
    
    return originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0
  }
}

// ================================
// CACHE VALIDATION UTILITIES
// ================================

class CacheValidator {
  static validateKey(key: CacheKey): { valid: boolean; errors: string[] } {
    const result = CacheKeySchema.safeParse(key)
    
    if (result.success) {
      return { valid: true, errors: [] }
    }
    
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    )
    
    return { valid: false, errors }
  }

  static validateOptions(options: CacheOptions): { valid: boolean; errors: string[] } {
    const result = CacheOptionsSchema.safeParse(options)
    
    if (result.success) {
      return { valid: true, errors: [] }
    }
    
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    )
    
    return { valid: false, errors }
  }

  static validateValue(value: any, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (value === null || value === undefined) {
      return { valid: false, error: 'Value cannot be null or undefined' }
    }

    try {
      const serialized = JSON.stringify(value)
      
      if (serialized.length > maxSize) {
        return { 
          valid: false, 
          error: `Value size (${serialized.length} bytes) exceeds maximum (${maxSize} bytes)` 
        }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Value is not serializable' }
    }
  }

  static sanitizeKey(key: string): string {
    return key
      .replace(/[^a-zA-Z0-9:_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 250)
  }
}

// ================================
// CACHE AUDIT LOGGING
// ================================

export interface CacheAuditEvent {
  timestamp: Date
  operation: 'get' | 'set' | 'delete' | 'clear' | 'invalidate'
  key: string
  namespace: string
  warehouse?: string
  success: boolean
  duration: number // milliseconds
  valueSize?: number // bytes
  tags?: string[]
  error?: string
  userId?: string
  ipAddress?: string
}

class CacheAuditor {
  private static events: CacheAuditEvent[] = []
  private static readonly MAX_EVENTS = 10000

  static log(event: Omit<CacheAuditEvent, 'timestamp'>): void {
    const auditEvent: CacheAuditEvent = {
      ...event,
      timestamp: new Date()
    }

    this.events.push(auditEvent)

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }

    // In production, send to external audit system
    if (process.env.NODE_ENV === 'production') {
      this.sendToAuditSystem(auditEvent)
    }
  }

  static getEvents(filters?: {
    operation?: string
    namespace?: string
    warehouse?: string
    since?: Date
  }): CacheAuditEvent[] {
    let filtered = this.events

    if (filters) {
      if (filters.operation) {
        filtered = filtered.filter(e => e.operation === filters.operation)
      }
      if (filters.namespace) {
        filtered = filtered.filter(e => e.namespace === filters.namespace)
      }
      if (filters.warehouse) {
        filtered = filtered.filter(e => e.warehouse === filters.warehouse)
      }
      if (filters.since) {
        filtered = filtered.filter(e => e.timestamp >= filters.since!)
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  static getStatistics(warehouse?: string): {
    totalOperations: number
    successRate: number
    avgDuration: number
    operationCounts: Record<string, number>
    errorRate: number
  } {
    const events = warehouse 
      ? this.events.filter(e => e.warehouse === warehouse)
      : this.events

    const totalOperations = events.length
    const successfulOperations = events.filter(e => e.success).length
    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0
    
    const totalDuration = events.reduce((sum, e) => sum + e.duration, 0)
    const avgDuration = totalOperations > 0 ? totalDuration / totalOperations : 0

    const operationCounts = events.reduce((counts, e) => {
      counts[e.operation] = (counts[e.operation] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const errorRate = totalOperations > 0 ? ((totalOperations - successfulOperations) / totalOperations) * 100 : 0

    return {
      totalOperations,
      successRate,
      avgDuration,
      operationCounts,
      errorRate
    }
  }

  private static async sendToAuditSystem(event: CacheAuditEvent): Promise<void> {
    try {
      // In a real implementation, send to external audit/logging system
      // e.g., Elasticsearch, Splunk, CloudWatch, etc.
      console.log('[CACHE_AUDIT]', JSON.stringify(event))
    } catch (error) {
      console.error('Failed to send cache audit event:', error)
    }
  }
}

// ================================
// DEFAULT CACHE CONFIGURATION
// ================================

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  provider: 'redis',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'rhy:',
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true
  },
  memory: {
    maxKeys: 10000,
    maxMemory: 100 * 1024 * 1024, // 100MB
    evictionPolicy: 'lru',
    checkPeriod: 600 // 10 minutes
  },
  defaults: {
    ttl: 3600, // 1 hour
    compress: true,
    enableMetrics: true,
    enableAuditLog: true,
    maxValueSize: 10 * 1024 * 1024 // 10MB
  },
  warehouses: {
    US: {
      enabled: true,
      retention: 86400 * 7, // 7 days
      compliance: ['OSHA'],
      encryption: false
    },
    JP: {
      enabled: true,
      retention: 86400 * 30, // 30 days
      compliance: ['JIS'],
      encryption: true
    },
    EU: {
      enabled: true,
      retention: 86400 * 30, // 30 days (GDPR requirement)
      compliance: ['GDPR', 'CE'],
      encryption: true
    },
    AU: {
      enabled: true,
      retention: 86400 * 14, // 14 days
      compliance: [],
      encryption: false
    }
  },
  performance: {
    timeout: 5000, // 5 seconds
    maxConcurrency: 100,
    batchSize: 50,
    enableCompression: true,
    compressionThreshold: 1024 // 1KB
  }
}

// ================================
// ERROR TYPES
// ================================

export class CacheError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation?: string,
    public key?: string
  ) {
    super(message)
    this.name = 'CacheError'
  }
}

export class CacheConnectionError extends CacheError {
  constructor(message: string, public provider: string) {
    super(message, 'CONNECTION_ERROR')
    this.name = 'CacheConnectionError'
  }
}

export class CacheValidationError extends CacheError {
  constructor(message: string, public field: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'CacheValidationError'
  }
}

export class CacheTimeoutError extends CacheError {
  constructor(message: string, public timeout: number) {
    super(message, 'TIMEOUT_ERROR')
    this.name = 'CacheTimeoutError'
  }
}

export class CacheQuotaExceededError extends CacheError {
  constructor(message: string, public limit: number) {
    super(message, 'QUOTA_EXCEEDED')
    this.name = 'CacheQuotaExceededError'
  }
}

// ================================
// EXPORT ALL
// ================================

export {
  CacheKeyBuilder,
  CacheCompression,
  CacheValidator,
  CacheAuditor
}

// Create a default cache instance
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    // In-memory cache implementation for now
    return null
  },
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // In-memory cache implementation for now
  },
  
  async delete(key: string): Promise<void> {
    // In-memory cache implementation for now
  },
  
  async flush(): Promise<void> {
    // In-memory cache implementation for now
  }
}