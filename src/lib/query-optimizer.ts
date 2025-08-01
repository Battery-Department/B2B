/**
 * RHY SUPPLIER PORTAL - ADVANCED QUERY OPTIMIZER
 * Enterprise-grade database query optimization and performance monitoring
 * Target: <50ms query response times with intelligent caching
 */

import { PrismaClient } from '@prisma/client'
import { rhyPrisma } from './rhy-database'

// =====================================================
// PERFORMANCE MONITORING TYPES
// =====================================================

interface QueryMetrics {
  queryId: string
  executionTime: number
  rowsAffected: number
  cacheHit: boolean
  optimizationApplied: string[]
  timestamp: Date
}

interface QueryOptimizationResult {
  originalQuery: string
  optimizedQuery: string
  estimatedImprovement: number
  cacheStrategy: CacheStrategy
  indexRecommendations: string[]
}

interface CacheStrategy {
  enabled: boolean
  ttl: number
  invalidationTriggers: string[]
  cacheKey: string
}

interface QueryAnalysis {
  complexity: 'low' | 'medium' | 'high'
  estimatedCost: number
  indexUsage: string[]
  optimizationOpportunities: string[]
  recommendedCaching: boolean
}

// =====================================================
// ADVANCED QUERY OPTIMIZER CLASS
// Enterprise-grade performance optimization
// =====================================================

export class RHYQueryOptimizer {
  private static instance: RHYQueryOptimizer
  private metricsCache = new Map<string, QueryMetrics>()
  private queryCache = new Map<string, { data: any; expires: Date }>()
  private optimizationRules = new Map<string, Function>()
  
  // Performance targets for RHY operations
  private readonly PERFORMANCE_TARGETS = {
    authentication: 50, // ms
    inventory: 75,      // ms  
    orders: 100,        // ms
    analytics: 200,     // ms
    reporting: 500      // ms
  }

  private constructor() {
    this.initializeOptimizationRules()
  }

  public static getInstance(): RHYQueryOptimizer {
    if (!RHYQueryOptimizer.instance) {
      RHYQueryOptimizer.instance = new RHYQueryOptimizer()
    }
    return RHYQueryOptimizer.instance
  }

  // =====================================================
  // CORE OPTIMIZATION ENGINE
  // =====================================================

  /**
   * Optimize and execute query with performance monitoring
   */
  async optimizedQuery<T>(
    operation: () => Promise<T>,
    options: {
      queryId: string
      category: keyof typeof this.PERFORMANCE_TARGETS
      cacheStrategy?: Partial<CacheStrategy>
      forceRefresh?: boolean
    }
  ): Promise<T> {
    const startTime = Date.now()
    const { queryId, category, cacheStrategy, forceRefresh = false } = options

    try {
      // Check cache first
      if (!forceRefresh && cacheStrategy?.enabled) {
        const cached = this.getCachedResult(queryId)
        if (cached) {
          this.recordMetrics(queryId, Date.now() - startTime, 0, true, ['cache-hit'])
          return cached
        }
      }

      // Execute optimized query
      const result = await this.executeWithOptimization(operation, queryId, category)
      const executionTime = Date.now() - startTime

      // Cache result if strategy provided
      if (cacheStrategy?.enabled && cacheStrategy.ttl) {
        this.setCachedResult(queryId, result, cacheStrategy.ttl)
      }

      // Record performance metrics
      this.recordMetrics(queryId, executionTime, 1, false, ['optimization-applied'])

      // Check performance target compliance
      this.validatePerformanceTarget(queryId, category, executionTime)

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.recordMetrics(queryId, executionTime, 0, false, ['error'], error as Error)
      throw error
    }
  }

  /**
   * Execute query with intelligent optimization
   */
  private async executeWithOptimization<T>(
    operation: () => Promise<T>,
    queryId: string,
    category: string
  ): Promise<T> {
    // Apply category-specific optimizations
    switch (category) {
      case 'authentication':
        return this.executeAuthOptimized(operation, queryId)
      case 'inventory':
        return this.executeInventoryOptimized(operation, queryId)
      case 'orders':
        return this.executeOrdersOptimized(operation, queryId)
      case 'analytics':
        return this.executeAnalyticsOptimized(operation, queryId)
      default:
        return operation()
    }
  }

  // =====================================================
  // CATEGORY-SPECIFIC OPTIMIZATIONS
  // =====================================================

  /**
   * Authentication-specific optimizations (<50ms target)
   */
  private async executeAuthOptimized<T>(
    operation: () => Promise<T>,
    queryId: string
  ): Promise<T> {
    // Set connection pool specifically for auth operations
    await rhyPrisma.$executeRaw`SET statement_timeout = '50ms'`
    
    try {
      return await operation()
    } finally {
      // Reset timeout for other operations
      await rhyPrisma.$executeRaw`SET statement_timeout = '30s'`
    }
  }

  /**
   * Inventory-specific optimizations (75ms target)
   */
  private async executeInventoryOptimized<T>(
    operation: () => Promise<T>,
    queryId: string
  ): Promise<T> {
    // Enable parallel queries for multi-warehouse inventory
    await rhyPrisma.$executeRaw`SET max_parallel_workers_per_gather = 4`
    
    try {
      return await operation()
    } finally {
      await rhyPrisma.$executeRaw`SET max_parallel_workers_per_gather = 2`
    }
  }

  /**
   * Order processing optimizations (100ms target)
   */
  private async executeOrdersOptimized<T>(
    operation: () => Promise<T>,
    queryId: string
  ): Promise<T> {
    // Optimize for order processing pipeline
    await rhyPrisma.$executeRaw`SET enable_hashjoin = on`
    await rhyPrisma.$executeRaw`SET work_mem = '16MB'`
    
    return operation()
  }

  /**
   * Analytics optimizations (200ms target)
   */
  private async executeAnalyticsOptimized<T>(
    operation: () => Promise<T>,
    queryId: string
  ): Promise<T> {
    // Enable analytics-specific optimizations
    await rhyPrisma.$executeRaw`SET enable_nestloop = off`
    await rhyPrisma.$executeRaw`SET enable_mergejoin = on`
    await rhyPrisma.$executeRaw`SET work_mem = '64MB'`
    
    try {
      return await operation()
    } finally {
      // Reset for standard operations
      await rhyPrisma.$executeRaw`SET enable_nestloop = on`
      await rhyPrisma.$executeRaw`SET work_mem = '4MB'`
    }
  }

  // =====================================================
  // INTELLIGENT CACHING SYSTEM
  // =====================================================

  /**
   * Smart cache key generation based on query pattern
   */
  generateCacheKey(queryId: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|')
    
    return `rhy:${queryId}:${Buffer.from(sortedParams).toString('base64')}`
  }

  /**
   * Retrieve cached result with expiration check
   */
  private getCachedResult(cacheKey: string): any | null {
    const cached = this.queryCache.get(cacheKey)
    
    if (!cached) return null
    
    if (cached.expires < new Date()) {
      this.queryCache.delete(cacheKey)
      return null
    }
    
    return cached.data
  }

  /**
   * Cache result with intelligent TTL
   */
  private setCachedResult(cacheKey: string, data: any, ttlSeconds: number): void {
    const expires = new Date(Date.now() + ttlSeconds * 1000)
    this.queryCache.set(cacheKey, { data, expires })
    
    // Prevent cache from growing too large
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value
      this.queryCache.delete(firstKey)
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCache(pattern: string): void {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key)
      }
    }
  }

  // =====================================================
  // QUERY ANALYSIS & OPTIMIZATION RECOMMENDATIONS
  // =====================================================

  /**
   * Analyze query complexity and provide optimization recommendations
   */
  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    try {
      // Use EXPLAIN to analyze query
      const explainResult = await rhyPrisma.$queryRawUnsafe(`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}
      `) as any[]

      const plan = explainResult[0]['QUERY PLAN'][0]
      
      return {
        complexity: this.determineComplexity(plan),
        estimatedCost: plan['Total Cost'] || 0,
        indexUsage: this.extractIndexUsage(plan),
        optimizationOpportunities: this.identifyOptimizations(plan),
        recommendedCaching: plan['Total Cost'] > 1000
      }
    } catch (error) {
      console.error('Query analysis failed:', error)
      return {
        complexity: 'high',
        estimatedCost: 9999,
        indexUsage: [],
        optimizationOpportunities: ['Manual review required'],
        recommendedCaching: true
      }
    }
  }

  /**
   * Generate query optimization recommendations
   */
  async optimizeQuery(originalQuery: string): Promise<QueryOptimizationResult> {
    const analysis = await this.analyzeQuery(originalQuery)
    
    const optimizations: string[] = []
    let optimizedQuery = originalQuery

    // Apply optimization rules
    for (const [pattern, optimizer] of this.optimizationRules) {
      if (originalQuery.includes(pattern)) {
        optimizedQuery = optimizer(optimizedQuery)
        optimizations.push(`Applied ${pattern} optimization`)
      }
    }

    return {
      originalQuery,
      optimizedQuery,
      estimatedImprovement: this.calculateImprovement(analysis, optimizations),
      cacheStrategy: this.recommendCacheStrategy(analysis),
      indexRecommendations: this.generateIndexRecommendations(analysis)
    }
  }

  // =====================================================
  // PERFORMANCE MONITORING & ALERTING
  // =====================================================

  /**
   * Record detailed query metrics
   */
  private recordMetrics(
    queryId: string,
    executionTime: number,
    rowsAffected: number,
    cacheHit: boolean,
    optimizations: string[],
    error?: Error
  ): void {
    const metrics: QueryMetrics = {
      queryId,
      executionTime,
      rowsAffected,
      cacheHit,
      optimizationApplied: optimizations,
      timestamp: new Date()
    }

    this.metricsCache.set(`${queryId}-${Date.now()}`, metrics)

    // Log performance warnings
    if (executionTime > 200 && !cacheHit) {
      console.warn(`🐌 Slow query detected: ${queryId} took ${executionTime}ms`)
    }

    if (error) {
      console.error(`❌ Query failed: ${queryId}`, error)
    }
  }

  /**
   * Validate against performance targets
   */
  private validatePerformanceTarget(
    queryId: string,
    category: keyof typeof this.PERFORMANCE_TARGETS,
    executionTime: number
  ): void {
    const target = this.PERFORMANCE_TARGETS[category]
    
    if (executionTime > target) {
      console.warn(
        `⚠️ Performance target exceeded: ${queryId} (${category}) ` +
        `took ${executionTime}ms, target: ${target}ms`
      )
      
      // Trigger optimization analysis for consistently slow queries
      this.scheduleOptimizationAnalysis(queryId, category)
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number
    averageExecutionTime: number
    cacheHitRate: number
    slowQueries: QueryMetrics[]
  } {
    const metrics = Array.from(this.metricsCache.values())
    
    if (metrics.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: []
      }
    }

    const totalExecution = metrics.reduce((sum, m) => sum + m.executionTime, 0)
    const cacheHits = metrics.filter(m => m.cacheHit).length
    const slowQueries = metrics.filter(m => m.executionTime > 100)

    return {
      totalQueries: metrics.length,
      averageExecutionTime: Math.round(totalExecution / metrics.length),
      cacheHitRate: Math.round((cacheHits / metrics.length) * 100),
      slowQueries: slowQueries.sort((a, b) => b.executionTime - a.executionTime)
    }
  }

  // =====================================================
  // OPTIMIZATION RULE ENGINE
  // =====================================================

  /**
   * Initialize optimization rules for common query patterns
   */
  private initializeOptimizationRules(): void {
    // Supplier authentication optimization
    this.optimizationRules.set('supplier_auth', (query: string) => {
      return query.replace(
        /SELECT \* FROM users/g,
        'SELECT id, email, password_hash, role FROM users'
      )
    })

    // Inventory lookup optimization
    this.optimizationRules.set('inventory_lookup', (query: string) => {
      return query.replace(
        /ORDER BY created_at DESC/g,
        'ORDER BY created_at DESC LIMIT 1000'
      )
    })

    // Multi-warehouse optimization
    this.optimizationRules.set('warehouse_query', (query: string) => {
      if (query.includes('warehouse_id')) {
        return `${query} AND warehouse_id IS NOT NULL`
      }
      return query
    })

    // Volume discount optimization
    this.optimizationRules.set('volume_discount', (query: string) => {
      return query.replace(
        /total_amount >= 1000/g,
        'total_amount >= 1000 AND status = \'completed\''
      )
    })
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private determineComplexity(plan: any): 'low' | 'medium' | 'high' {
    const cost = plan['Total Cost'] || 0
    if (cost < 100) return 'low'
    if (cost < 1000) return 'medium'
    return 'high'
  }

  private extractIndexUsage(plan: any): string[] {
    const indexes: string[] = []
    
    function traverse(node: any) {
      if (node['Index Name']) {
        indexes.push(node['Index Name'])
      }
      if (node.Plans) {
        node.Plans.forEach(traverse)
      }
    }
    
    traverse(plan)
    return indexes
  }

  private identifyOptimizations(plan: any): string[] {
    const opportunities: string[] = []
    
    if (plan['Node Type'] === 'Seq Scan') {
      opportunities.push('Consider adding index for sequential scan')
    }
    
    if (plan['Total Cost'] > 1000) {
      opportunities.push('High cost query - consider optimization')
    }
    
    return opportunities
  }

  private calculateImprovement(analysis: QueryAnalysis, optimizations: string[]): number {
    let improvement = 0
    
    if (optimizations.length > 0) {
      improvement += optimizations.length * 10
    }
    
    if (analysis.complexity === 'high') {
      improvement += 30
    }
    
    return Math.min(improvement, 80) // Cap at 80% improvement
  }

  private recommendCacheStrategy(analysis: QueryAnalysis): CacheStrategy {
    return {
      enabled: analysis.recommendedCaching || analysis.complexity === 'high',
      ttl: analysis.complexity === 'high' ? 300 : 60, // 5 min for complex, 1 min for others
      invalidationTriggers: ['user_update', 'order_create', 'inventory_change'],
      cacheKey: 'auto-generated'
    }
  }

  private generateIndexRecommendations(analysis: QueryAnalysis): string[] {
    const recommendations: string[] = []
    
    if (analysis.indexUsage.length === 0) {
      recommendations.push('CREATE INDEX for frequently queried columns')
    }
    
    if (analysis.estimatedCost > 1000) {
      recommendations.push('Consider composite index for multi-column queries')
    }
    
    return recommendations
  }

  private scheduleOptimizationAnalysis(queryId: string, category: string): void {
    // In a production environment, this would schedule a background job
    console.log(`📊 Scheduling optimization analysis for ${queryId} (${category})`)
  }

  // =====================================================
  // PUBLIC API METHODS
  // =====================================================

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.queryCache.clear()
    this.metricsCache.clear()
  }

  /**
   * Get cached query count
   */
  getCacheSize(): { queries: number; metrics: number } {
    return {
      queries: this.queryCache.size,
      metrics: this.metricsCache.size
    }
  }

  /**
   * Health check for the optimizer
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    try {
      const stats = this.getPerformanceStats()
      const cacheSize = this.getCacheSize()
      
      const status = stats.averageExecutionTime > 200 ? 'degraded' : 'healthy'
      
      return {
        status,
        details: {
          averageExecutionTime: stats.averageExecutionTime,
          cacheHitRate: stats.cacheHitRate,
          totalQueries: stats.totalQueries,
          cacheSize,
          slowQueriesCount: stats.slowQueries.length
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

// =====================================================
// CONVENIENCE FUNCTIONS FOR COMMON OPERATIONS
// =====================================================

const optimizer = RHYQueryOptimizer.getInstance()

/**
 * Optimized supplier authentication query
 */
export async function optimizedSupplierAuth(
  email: string,
  includePermissions = false
) {
  const cacheKey = optimizer.generateCacheKey('supplier_auth', { email, includePermissions })
  
  return optimizer.optimizedQuery(
    async () => {
      return rhyPrisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          suppliers: {
            select: {
              id: true,
              supplierCode: true,
              warehouseRegion: true,
              tierLevel: true,
              status: true,
              ...(includePermissions && {
                permissions: {
                  select: {
                    permission: true,
                    granted: true
                  }
                }
              })
            }
          }
        }
      })
    },
    {
      queryId: cacheKey,
      category: 'authentication',
      cacheStrategy: {
        enabled: true,
        ttl: 300, // 5 minutes for auth data
        invalidationTriggers: ['user_update', 'supplier_update'],
        cacheKey
      }
    }
  )
}

/**
 * Optimized multi-warehouse inventory lookup
 */
export async function optimizedInventoryLookup(
  warehouseIds: string[],
  productFilters: Record<string, any> = {}
) {
  const cacheKey = optimizer.generateCacheKey('inventory_lookup', { warehouseIds, productFilters })
  
  return optimizer.optimizedQuery(
    async () => {
      return rhyPrisma.warehouseInventory.findMany({
        where: {
          warehouseId: { in: warehouseIds },
          status: 'active',
          quantity: { gt: 0 },
          product: productFilters
        },
        select: {
          id: true,
          warehouseId: true,
          productId: true,
          quantity: true,
          reservedQuantity: true,
          lastSyncAt: true,
          product: {
            select: {
              sku: true,
              name: true,
              category: true,
              price: true
            }
          },
          warehouse: {
            select: {
              region: true,
              name: true
            }
          }
        },
        orderBy: [
          { quantity: 'desc' },
          { lastSyncAt: 'desc' }
        ],
        take: 500 // Reasonable limit for inventory queries
      })
    },
    {
      queryId: cacheKey,
      category: 'inventory',
      cacheStrategy: {
        enabled: true,
        ttl: 60, // 1 minute for inventory data
        invalidationTriggers: ['inventory_update', 'sync_complete'],
        cacheKey
      }
    }
  )
}

/**
 * Optimized order analytics for volume discounts
 */
export async function optimizedVolumeDiscountAnalytics(
  supplierId: string,
  timeRange: { from: Date; to: Date }
) {
  const cacheKey = optimizer.generateCacheKey('volume_analytics', { supplierId, timeRange })
  
  return optimizer.optimizedQuery(
    async () => {
      return rhyPrisma.order.aggregate({
        where: {
          supplierId,
          status: 'completed',
          createdAt: {
            gte: timeRange.from,
            lte: timeRange.to
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        },
        _avg: {
          totalAmount: true
        }
      })
    },
    {
      queryId: cacheKey,
      category: 'analytics',
      cacheStrategy: {
        enabled: true,
        ttl: 900, // 15 minutes for analytics
        invalidationTriggers: ['order_complete'],
        cacheKey
      }
    }
  )
}

// Export singleton instance
export const queryOptimizer = optimizer
export default optimizer