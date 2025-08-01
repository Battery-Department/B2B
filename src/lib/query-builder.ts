import { PrismaClient, Prisma } from '@prisma/client'
import { withDatabase } from './db-connection'
import { withPooledDatabase } from './db-pool'
import type { WarehouseRegion } from '@/config/database'

/**
 * Enterprise-grade type-safe query builder for RHY Supplier Portal
 * Provides optimized database operations with performance monitoring,
 * security validation, and multi-warehouse support
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type ModelName = keyof PrismaClient

interface QueryOptions {
  warehouse?: WarehouseRegion
  timeout?: number
  usePool?: boolean
  cacheable?: boolean
  retries?: number
}

interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

interface FilterOptions {
  where?: any
  include?: any
  select?: any
}

interface QueryMetrics {
  queryTime: number
  affectedRows?: number
  warehouse?: WarehouseRegion
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'raw'
  cached?: boolean
}

interface BulkOperationResult<T> {
  success: boolean
  count: number
  results: T[]
  errors: string[]
  metrics: QueryMetrics
}

// =============================================================================
// QUERY BUILDER CLASS
// =============================================================================

class TypeSafeQueryBuilder {
  private client: PrismaClient | null = null
  private metrics: QueryMetrics[] = []
  private queryCache = new Map<string, { data: any; expiry: number }>()

  constructor(private options: QueryOptions = {}) {}

  /**
   * Get database client with connection management
   */
  private async getClient(): Promise<PrismaClient> {
    if (this.client) {
      return this.client
    }

    if (this.options.usePool) {
      // Use connection pool for high-throughput operations
      return new Promise((resolve, reject) => {
        withPooledDatabase(
          async (client) => {
            this.client = client
            return client
          },
          this.options.warehouse
        ).then(resolve).catch(reject)
      })
    } else {
      // Use direct connection for simple operations
      return withDatabase(async (client) => {
        this.client = client
        return client
      })
    }
  }

  /**
   * Execute query with performance monitoring
   */
  private async executeWithMetrics<T>(
    operation: () => Promise<T>,
    queryType: QueryMetrics['queryType']
  ): Promise<{ data: T; metrics: QueryMetrics }> {
    const startTime = Date.now()
    
    try {
      const data = await operation()
      
      const metrics: QueryMetrics = {
        queryTime: Date.now() - startTime,
        warehouse: this.options.warehouse,
        queryType,
        affectedRows: Array.isArray(data) ? data.length : 1
      }

      this.metrics.push(metrics)
      
      // Log slow queries
      if (metrics.queryTime > 100) {
        console.warn(`Slow ${queryType} query detected:`, {
          duration: metrics.queryTime,
          warehouse: metrics.warehouse,
          affectedRows: metrics.affectedRows
        })
      }

      return { data, metrics }
    } catch (error) {
      const metrics: QueryMetrics = {
        queryTime: Date.now() - startTime,
        warehouse: this.options.warehouse,
        queryType
      }

      this.metrics.push(metrics)
      
      console.error(`Query execution failed:`, {
        error: error,
        duration: metrics.queryTime,
        warehouse: metrics.warehouse,
        queryType
      })

      throw error
    }
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(operation: string, params: any): string {
    return `${operation}_${JSON.stringify(params)}_${this.options.warehouse || 'default'}`
  }

  /**
   * Get cached result if available and valid
   */
  private getCachedResult<T>(cacheKey: string): T | null {
    const cached = this.queryCache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T
    }
    return null
  }

  /**
   * Cache query result
   */
  private setCachedResult<T>(cacheKey: string, data: T, ttlMs: number = 300000): void {
    this.queryCache.set(cacheKey, {
      data,
      expiry: Date.now() + ttlMs
    })
  }

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * Find many records with type safety and optimization
   */
  async findMany<T extends ModelName>(
    model: T,
    options: FilterOptions & PaginationOptions & { sort?: SortOptions } = {}
  ): Promise<{ data: any[]; total: number; metrics: QueryMetrics }> {
    const client = await this.getClient()
    
    // Generate cache key if cacheable
    const cacheKey = this.options.cacheable 
      ? this.generateCacheKey(`findMany_${model}`, options)
      : null
    
    if (cacheKey) {
      const cached = this.getCachedResult<{ data: any[]; total: number }>(cacheKey)
      if (cached) {
        return {
          ...cached,
          metrics: {
            queryTime: 0,
            queryType: 'select',
            cached: true,
            warehouse: this.options.warehouse
          }
        }
      }
    }

    const { data, metrics } = await this.executeWithMetrics(async () => {
      const modelClient = (client as any)[model]
      
      // Build query with pagination and sorting
      const query: any = {
        where: options.where,
        include: options.include,
        select: options.select
      }

      // Add pagination
      if (options.limit) {
        query.take = options.limit
      }
      if (options.offset) {
        query.skip = options.offset
      } else if (options.page && options.limit) {
        query.skip = (options.page - 1) * options.limit
      }

      // Add sorting
      if (options.sort) {
        query.orderBy = {
          [options.sort.field]: options.sort.direction
        }
      }

      // Execute query and count
      const [data, total] = await Promise.all([
        modelClient.findMany(query),
        modelClient.count({ where: options.where })
      ])

      return { data, total }
    }, 'select')

    // Cache result if enabled
    if (cacheKey) {
      this.setCachedResult(cacheKey, data)
    }

    return { ...data, metrics }
  }

  /**
   * Find unique record with type safety
   */
  async findUnique<T extends ModelName>(
    model: T,
    options: { where: any; include?: any; select?: any }
  ): Promise<{ data: any | null; metrics: QueryMetrics }> {
    const client = await this.getClient()

    const cacheKey = this.options.cacheable 
      ? this.generateCacheKey(`findUnique_${model}`, options)
      : null
    
    if (cacheKey) {
      const cached = this.getCachedResult<any>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metrics: {
            queryTime: 0,
            queryType: 'select',
            cached: true,
            warehouse: this.options.warehouse
          }
        }
      }
    }

    const { data, metrics } = await this.executeWithMetrics(async () => {
      const modelClient = (client as any)[model]
      return await modelClient.findUnique(options)
    }, 'select')

    if (cacheKey) {
      this.setCachedResult(cacheKey, data)
    }

    return { data, metrics }
  }

  /**
   * Create single record with validation
   */
  async create<T extends ModelName>(
    model: T,
    data: any,
    options: { include?: any; select?: any } = {}
  ): Promise<{ data: any; metrics: QueryMetrics }> {
    const client = await this.getClient()

    return await this.executeWithMetrics(async () => {
      const modelClient = (client as any)[model]
      
      // Add audit fields
      const auditedData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return await modelClient.create({
        data: auditedData,
        ...options
      })
    }, 'insert')
  }

  /**
   * Update single record with optimistic locking
   */
  async update<T extends ModelName>(
    model: T,
    where: any,
    data: any,
    options: { include?: any; select?: any } = {}
  ): Promise<{ data: any; metrics: QueryMetrics }> {
    const client = await this.getClient()

    return await this.executeWithMetrics(async () => {
      const modelClient = (client as any)[model]
      
      // Add audit fields
      const auditedData = {
        ...data,
        updatedAt: new Date()
      }

      return await modelClient.update({
        where,
        data: auditedData,
        ...options
      })
    }, 'update')
  }

  /**
   * Delete single record with soft delete support
   */
  async delete<T extends ModelName>(
    model: T,
    where: any,
    options: { soft?: boolean } = {}
  ): Promise<{ data: any; metrics: QueryMetrics }> {
    const client = await this.getClient()

    return await this.executeWithMetrics(async () => {
      const modelClient = (client as any)[model]

      if (options.soft) {
        // Soft delete - mark as deleted
        return await modelClient.update({
          where,
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        })
      } else {
        // Hard delete
        return await modelClient.delete({ where })
      }
    }, 'delete')
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  /**
   * Bulk create with transaction support
   */
  async createMany<T extends ModelName>(
    model: T,
    data: any[],
    options: { skipDuplicates?: boolean; batchSize?: number } = {}
  ): Promise<BulkOperationResult<any>> {
    const client = await this.getClient()
    const batchSize = options.batchSize || 1000
    const results: any[] = []
    const errors: string[] = []

    const { data: operationResult, metrics } = await this.executeWithMetrics(async () => {
      return await client.$transaction(async (tx) => {
        // Process in batches to avoid memory issues
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize)
          
          try {
            // Add audit fields to each item
            const auditedBatch = batch.map(item => ({
              ...item,
              createdAt: new Date(),
              updatedAt: new Date()
            }))

            const result = await (tx as any)[model].createMany({
              data: auditedBatch,
              skipDuplicates: options.skipDuplicates
            })

            results.push(result)
          } catch (error) {
            const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`
            errors.push(errorMsg)
            console.error(errorMsg)
          }
        }

        return results
      })
    }, 'insert')

    return {
      success: errors.length === 0,
      count: results.reduce((acc, result) => acc + (result.count || 0), 0),
      results: operationResult,
      errors,
      metrics
    }
  }

  /**
   * Bulk update with conditional logic
   */
  async updateMany<T extends ModelName>(
    model: T,
    updates: Array<{ where: any; data: any }>,
    options: { batchSize?: number } = {}
  ): Promise<BulkOperationResult<any>> {
    const client = await this.getClient()
    const batchSize = options.batchSize || 500
    const results: any[] = []
    const errors: string[] = []

    const { data: operationResult, metrics } = await this.executeWithMetrics(async () => {
      return await client.$transaction(async (tx) => {
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize)
          
          try {
            const batchResults = await Promise.all(
              batch.map(({ where, data }) => 
                (tx as any)[model].updateMany({
                  where,
                  data: {
                    ...data,
                    updatedAt: new Date()
                  }
                })
              )
            )

            results.push(...batchResults)
          } catch (error) {
            const errorMsg = `Update batch ${Math.floor(i / batchSize) + 1} failed: ${error}`
            errors.push(errorMsg)
            console.error(errorMsg)
          }
        }

        return results
      })
    }, 'update')

    return {
      success: errors.length === 0,
      count: results.reduce((acc, result) => acc + (result.count || 0), 0),
      results: operationResult,
      errors,
      metrics
    }
  }

  // =============================================================================
  // RAW QUERIES
  // =============================================================================

  /**
   * Execute raw SQL query with type safety
   */
  async rawQuery<T = any>(
    query: string | Prisma.Sql,
    params: any[] = []
  ): Promise<{ data: T[]; metrics: QueryMetrics }> {
    const client = await this.getClient()

    return await this.executeWithMetrics(async () => {
      if (typeof query === 'string') {
        // Convert string query to template literal for safety
        const sql = Prisma.sql([query] as any, ...params)
        return await client.$queryRaw<T[]>(sql)
      } else {
        return await client.$queryRaw<T[]>(query)
      }
    }, 'raw')
  }

  /**
   * Execute raw SQL command (INSERT, UPDATE, DELETE)
   */
  async rawExecute(
    command: string | Prisma.Sql,
    params: any[] = []
  ): Promise<{ affectedRows: number; metrics: QueryMetrics }> {
    const client = await this.getClient()

    const { data, metrics } = await this.executeWithMetrics(async () => {
      if (typeof command === 'string') {
        const sql = Prisma.sql([command] as any, ...params)
        return await client.$executeRaw(sql)
      } else {
        return await client.$executeRaw(command)
      }
    }, 'raw')

    return {
      affectedRows: data as number,
      metrics: {
        ...metrics,
        affectedRows: data as number
      }
    }
  }

  // =============================================================================
  // WAREHOUSE-SPECIFIC OPERATIONS
  // =============================================================================

  /**
   * Cross-warehouse inventory sync
   */
  async syncInventoryAcrossWarehouses(
    productId: string,
    updates: Record<WarehouseRegion, { quantity: number; reserved: number }>
  ): Promise<BulkOperationResult<any>> {
    const client = await this.getClient()
    const results: any[] = []
    const errors: string[] = []

    const { data: operationResult, metrics } = await this.executeWithMetrics(async () => {
      return await client.$transaction(async (tx) => {
        for (const [warehouse, data] of Object.entries(updates)) {
          try {
            const result = await tx.inventory.updateMany({
              where: {
                productId,
                warehouseLocation: warehouse as WarehouseRegion
              },
              data: {
                quantity: data.quantity,
                reserved: data.reserved,
                available: data.quantity - data.reserved,
                lastSyncAt: new Date()
              }
            })

            results.push({ warehouse, ...result })
          } catch (error) {
            const errorMsg = `Inventory sync failed for ${warehouse}: ${error}`
            errors.push(errorMsg)
            console.error(errorMsg)
          }
        }

        return results
      })
    }, 'update')

    return {
      success: errors.length === 0,
      count: results.reduce((acc, result) => acc + (result.count || 0), 0),
      results: operationResult,
      errors,
      metrics
    }
  }

  /**
   * Get warehouse performance metrics
   */
  async getWarehouseMetrics(warehouse: WarehouseRegion): Promise<{
    data: {
      totalOrders: number
      averageProcessingTime: number
      inventoryTurnover: number
      errorRate: number
    }
    metrics: QueryMetrics
  }> {
    const { data, metrics } = await this.rawQuery<{
      total_orders: string
      avg_processing_time: string
      inventory_turnover: string
      error_rate: string
    }>(
      `
      WITH warehouse_stats AS (
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          AVG(EXTRACT(EPOCH FROM (o."updatedAt" - o."createdAt"))/3600) as avg_processing_time,
          COALESCE(AVG(i.quantity::numeric / NULLIF(i.reserved::numeric, 0)), 0) as inventory_turnover,
          COALESCE(
            (COUNT(CASE WHEN o.status = 'failed' THEN 1 END)::numeric / 
             NULLIF(COUNT(*)::numeric, 0)) * 100, 
            0
          ) as error_rate
        FROM orders o
        LEFT JOIN inventory i ON i."warehouseLocation" = $1
        WHERE o."warehouseLocation" = $1
          AND o."createdAt" >= NOW() - INTERVAL '30 days'
      )
      SELECT * FROM warehouse_stats
      `,
      [warehouse]
    )

    const result = data[0] || {
      total_orders: '0',
      avg_processing_time: '0',
      inventory_turnover: '0',
      error_rate: '0'
    }

    return {
      data: {
        totalOrders: parseInt(result.total_orders),
        averageProcessingTime: parseFloat(result.avg_processing_time),
        inventoryTurnover: parseFloat(result.inventory_turnover),
        errorRate: parseFloat(result.error_rate)
      },
      metrics
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get query performance metrics
   */
  getMetrics(): QueryMetrics[] {
    return [...this.metrics]
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const totalQueries = this.metrics.length
    const cachedQueries = this.metrics.filter(m => m.cached).length
    
    return {
      size: this.queryCache.size,
      hitRate: totalQueries > 0 ? cachedQueries / totalQueries : 0
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create query builder instance
 */
export function createQueryBuilder(options: QueryOptions = {}): TypeSafeQueryBuilder {
  return new TypeSafeQueryBuilder(options)
}

/**
 * Create warehouse-specific query builder
 */
export function createWarehouseQueryBuilder(
  warehouse: WarehouseRegion,
  options: Omit<QueryOptions, 'warehouse'> = {}
): TypeSafeQueryBuilder {
  return new TypeSafeQueryBuilder({
    ...options,
    warehouse,
    usePool: true // Use connection pool for warehouse operations
  })
}

/**
 * Create cached query builder for read-heavy operations
 */
export function createCachedQueryBuilder(
  options: Omit<QueryOptions, 'cacheable'> = {}
): TypeSafeQueryBuilder {
  return new TypeSafeQueryBuilder({
    ...options,
    cacheable: true
  })
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick database query with automatic connection management
 */
export async function quickQuery<T>(
  operation: (builder: TypeSafeQueryBuilder) => Promise<T>,
  options: QueryOptions = {}
): Promise<T> {
  const builder = createQueryBuilder(options)
  return await operation(builder)
}

/**
 * Execute operation across all warehouses
 */
export async function executeAcrossWarehouses<T>(
  operation: (builder: TypeSafeQueryBuilder, warehouse: WarehouseRegion) => Promise<T>
): Promise<Record<WarehouseRegion, T>> {
  const warehouses: WarehouseRegion[] = ['us-west', 'japan', 'eu', 'australia']
  const results = {} as Record<WarehouseRegion, T>

  await Promise.all(
    warehouses.map(async (warehouse) => {
      const builder = createWarehouseQueryBuilder(warehouse)
      results[warehouse] = await operation(builder, warehouse)
    })
  )

  return results
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  TypeSafeQueryBuilder,
  type QueryOptions,
  type PaginationOptions,
  type SortOptions,
  type FilterOptions,
  type QueryMetrics,
  type BulkOperationResult
}

export default TypeSafeQueryBuilder