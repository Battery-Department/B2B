/**
 * RHY_047: Inventory Synchronization Utilities
 * Enterprise-grade utility functions for inventory synchronization operations
 * Supports multi-warehouse coordination and real-time data processing
 */

import { z } from 'zod'
import type {
  InventoryItem,
  SyncConfiguration,
  SyncValidationResult,
  ProductSyncData,
  WarehouseRegion,
  SyncPriority,
  ConflictResolution
} from '@/types/inventory_sync'

// Validation schemas for inventory sync operations
export const ProductSyncSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  location: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  metadata: z.record(z.any()).optional()
})

export const SyncConfigurationSchema = z.object({
  autoResolveConflicts: z.boolean().default(true),
  maxRetryAttempts: z.number().min(1).max(10).default(3),
  timeoutMs: z.number().min(1000).max(300000).default(30000),
  batchSize: z.number().min(1).max(100).default(10),
  conflictResolution: z.enum(['LAST_WRITE_WINS', 'MANUAL', 'PRIORITY_BASED']).default('LAST_WRITE_WINS'),
  enableCrossWarehouseSync: z.boolean().default(true),
  syncInterval: z.number().min(60000).default(300000), // 5 minutes default
  priorityOverrides: z.record(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional()
})

/**
 * Inventory Synchronization Utilities Class
 * Provides enterprise-grade utility functions for sync operations
 */
export class InventorySyncUtils {
  private static readonly WAREHOUSE_REGIONS: Record<string, WarehouseRegion> = {
    'US': { timezone: 'America/Los_Angeles', currency: 'USD', workingHours: { start: 6, end: 18 } },
    'Japan': { timezone: 'Asia/Tokyo', currency: 'JPY', workingHours: { start: 9, end: 18 } },
    'EU': { timezone: 'Europe/Berlin', currency: 'EUR', workingHours: { start: 8, end: 17 } },
    'Australia': { timezone: 'Australia/Sydney', currency: 'AUD', workingHours: { start: 8, end: 17 } }
  }

  private static readonly SYNC_PRIORITIES: Record<SyncPriority, { weight: number; timeout: number }> = {
    'CRITICAL': { weight: 100, timeout: 5000 },
    'HIGH': { weight: 75, timeout: 15000 },
    'MEDIUM': { weight: 50, timeout: 30000 },
    'LOW': { weight: 25, timeout: 60000 }
  }

  /**
   * Validate inventory sync data
   */
  public static validateSyncData(products: ProductSyncData[]): SyncValidationResult {
    const validProducts: ProductSyncData[] = []
    const invalidProducts: Array<{ product: ProductSyncData; errors: string[] }> = []
    const warnings: string[] = []

    for (const product of products) {
      try {
        const validatedProduct = ProductSyncSchema.parse(product)
        
        // Additional business logic validation
        const businessValidation = this.validateBusinessRules(validatedProduct)
        if (businessValidation.isValid) {
          validProducts.push(validatedProduct)
          if (businessValidation.warnings.length > 0) {
            warnings.push(...businessValidation.warnings)
          }
        } else {
          invalidProducts.push({
            product,
            errors: businessValidation.errors
          })
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          invalidProducts.push({
            product,
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          })
        } else {
          invalidProducts.push({
            product,
            errors: ['Unknown validation error']
          })
        }
      }
    }

    return {
      isValid: invalidProducts.length === 0,
      validProducts,
      invalidProducts,
      warnings,
      summary: {
        total: products.length,
        valid: validProducts.length,
        invalid: invalidProducts.length,
        warnings: warnings.length
      }
    }
  }

  /**
   * Validate business rules for inventory sync
   */
  private static validateBusinessRules(product: ProductSyncData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // FlexVolt battery specific validations
    if (product.metadata?.productType === 'FLEXVOLT_BATTERY') {
      // Validate battery capacity and pricing
      const capacity = product.metadata?.capacity
      if (capacity && !['6Ah', '9Ah', '15Ah'].includes(capacity)) {
        errors.push('Invalid FlexVolt battery capacity. Must be 6Ah, 9Ah, or 15Ah')
      }

      // Validate pricing consistency
      const expectedPrices = { '6Ah': 149, '9Ah': 239, '15Ah': 359 }
      if (capacity && product.cost && product.cost !== expectedPrices[capacity as keyof typeof expectedPrices]) {
        warnings.push(`Price mismatch for ${capacity} battery. Expected: $${expectedPrices[capacity as keyof typeof expectedPrices]}, got: $${product.cost}`)
      }
    }

    // Validate expiry dates for applicable products
    if (product.expiryDate) {
      const expiryDate = new Date(product.expiryDate)
      const now = new Date()
      
      if (expiryDate <= now) {
        errors.push('Product expiry date cannot be in the past')
      } else if (expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) { // 30 days
        warnings.push('Product expires within 30 days')
      }
    }

    // Validate quantity thresholds
    if (product.quantity > 10000) {
      warnings.push('Large quantity detected. Consider splitting into multiple batches.')
    }

    // Validate location format
    if (product.location && !/^[A-Z]{2}-\d{2}-[A-Z]{1,3}$/.test(product.location)) {
      warnings.push('Location format should be: XX-##-XXX (e.g., US-01-A1B)')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Calculate optimal sync priority based on product and warehouse context
   */
  public static calculateSyncPriority(
    product: ProductSyncData,
    warehouseRegion: string,
    currentInventory?: InventoryItem
  ): SyncPriority {
    let priority: SyncPriority = 'MEDIUM' // Default priority

    // Critical priority conditions
    if (currentInventory?.status === 'OUT_OF_STOCK') {
      priority = 'CRITICAL'
    } else if (currentInventory?.status === 'LOW_STOCK') {
      priority = 'HIGH'
    }

    // FlexVolt battery specific priority logic
    if (product.metadata?.productType === 'FLEXVOLT_BATTERY') {
      const capacity = product.metadata?.capacity
      if (capacity === '15Ah') { // High-value industrial batteries
        priority = this.escalatePriority(priority, 'HIGH')
      }
    }

    // Regional business hour considerations
    const regionConfig = this.WAREHOUSE_REGIONS[warehouseRegion]
    if (regionConfig && this.isWithinBusinessHours(regionConfig)) {
      priority = this.escalatePriority(priority, 'HIGH')
    }

    // Large quantity adjustments
    if (product.quantity > 1000) {
      priority = this.escalatePriority(priority, 'HIGH')
    }

    // Emergency/rush order handling
    if (product.metadata?.isRushOrder === true) {
      priority = 'CRITICAL'
    }

    return priority
  }

  /**
   * Generate optimized sync batches based on priority, region, and product type
   */
  public static createOptimizedBatches(
    products: ProductSyncData[],
    config: SyncConfiguration
  ): Array<{
    batchId: string;
    products: ProductSyncData[];
    priority: SyncPriority;
    estimatedDuration: number;
    region?: string;
  }> {
    // Sort products by priority and type
    const sortedProducts = [...products].sort((a, b) => {
      const priorityA = this.SYNC_PRIORITIES[a.metadata?.priority || 'MEDIUM'].weight
      const priorityB = this.SYNC_PRIORITIES[b.metadata?.priority || 'MEDIUM'].weight
      return priorityB - priorityA
    })

    const batches: Array<{
      batchId: string;
      products: ProductSyncData[];
      priority: SyncPriority;
      estimatedDuration: number;
      region?: string;
    }> = []

    let currentBatch: ProductSyncData[] = []
    let currentBatchPriority: SyncPriority = 'LOW'

    for (const product of sortedProducts) {
      const productPriority = product.metadata?.priority || 'MEDIUM'
      
      // Start new batch if current is full or priority changed significantly
      if (currentBatch.length >= config.batchSize || 
          (currentBatch.length > 0 && this.shouldStartNewBatch(currentBatchPriority, productPriority))) {
        
        batches.push({
          batchId: this.generateBatchId(),
          products: [...currentBatch],
          priority: currentBatchPriority,
          estimatedDuration: this.estimateBatchDuration(currentBatch, config),
          region: this.determineBatchRegion(currentBatch)
        })

        currentBatch = []
        currentBatchPriority = productPriority
      }

      currentBatch.push(product)
      currentBatchPriority = this.getHigherPriority(currentBatchPriority, productPriority)
    }

    // Add final batch if not empty
    if (currentBatch.length > 0) {
      batches.push({
        batchId: this.generateBatchId(),
        products: currentBatch,
        priority: currentBatchPriority,
        estimatedDuration: this.estimateBatchDuration(currentBatch, config),
        region: this.determineBatchRegion(currentBatch)
      })
    }

    return batches
  }

  /**
   * Handle sync conflicts using configured resolution strategy
   */
  public static resolveSyncConflict(
    localData: InventoryItem,
    remoteData: InventoryItem,
    strategy: ConflictResolution
  ): {
    resolved: InventoryItem;
    strategy: ConflictResolution;
    reason: string;
    requiresManualReview: boolean;
  } {
    switch (strategy) {
      case 'LAST_WRITE_WINS':
        const winner = localData.lastUpdated > remoteData.lastUpdated ? localData : remoteData
        return {
          resolved: winner,
          strategy,
          reason: `Selected data with latest timestamp: ${winner.lastUpdated}`,
          requiresManualReview: false
        }

      case 'PRIORITY_BASED':
        // Business logic priority: CRITICAL > HIGH > MEDIUM > LOW
        const localPriority = this.SYNC_PRIORITIES[localData.metadata?.priority || 'MEDIUM'].weight
        const remotePriority = this.SYNC_PRIORITIES[remoteData.metadata?.priority || 'MEDIUM'].weight
        
        const priorityWinner = localPriority >= remotePriority ? localData : remoteData
        return {
          resolved: priorityWinner,
          strategy,
          reason: `Selected data with higher priority: ${priorityWinner.metadata?.priority}`,
          requiresManualReview: localPriority === remotePriority
        }

      case 'MANUAL':
      default:
        return {
          resolved: localData, // Keep local as temporary
          strategy: 'MANUAL',
          reason: 'Conflict requires manual resolution',
          requiresManualReview: true
        }
    }
  }

  /**
   * Calculate cross-warehouse sync order based on regional priorities
   */
  public static calculateCrossWarehouseSyncOrder(
    sourceWarehouse: string,
    targetWarehouses: string[],
    timeContext: Date = new Date()
  ): Array<{
    warehouseId: string;
    region: string;
    priority: number;
    syncWindow: 'IMMEDIATE' | 'BUSINESS_HOURS' | 'OFF_HOURS';
    estimatedDelay: number;
  }> {
    return targetWarehouses
      .map(warehouseId => {
        const region = this.getWarehouseRegion(warehouseId)
        const regionConfig = this.WAREHOUSE_REGIONS[region]
        const isBusinessHours = regionConfig ? this.isWithinBusinessHours(regionConfig, timeContext) : false
        
        // Calculate priority based on business impact
        let priority = 50 // Base priority
        
        // Same region gets higher priority
        if (this.getWarehouseRegion(sourceWarehouse) === region) {
          priority += 30
        }
        
        // Business hours get higher priority
        if (isBusinessHours) {
          priority += 20
        }
        
        // FlexVolt demand patterns
        const flexVoltDemand = this.getRegionalFlexVoltDemand(region, timeContext)
        priority += flexVoltDemand * 10

        return {
          warehouseId,
          region,
          priority,
          syncWindow: isBusinessHours ? 'BUSINESS_HOURS' : 'OFF_HOURS',
          estimatedDelay: this.calculateSyncDelay(sourceWarehouse, warehouseId, timeContext)
        }
      })
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Generate comprehensive sync metrics and insights
   */
  public static generateSyncInsights(
    syncHistory: any[],
    warehouseMetrics: any
  ): {
    performance: {
      averageSyncTime: number;
      successRate: number;
      throughput: number; // products per hour
    };
    trends: {
      syncFrequency: 'INCREASING' | 'STABLE' | 'DECREASING';
      errorRate: 'IMPROVING' | 'STABLE' | 'DEGRADING';
      peakHours: number[];
    };
    recommendations: string[];
    alerts: Array<{ severity: 'INFO' | 'WARNING' | 'CRITICAL'; message: string }>;
  } {
    const performance = this.calculateSyncPerformance(syncHistory)
    const trends = this.analyzeSyncTrends(syncHistory)
    const recommendations = this.generateSyncRecommendations(performance, trends, warehouseMetrics)
    const alerts = this.generateSyncAlerts(performance, trends)

    return {
      performance,
      trends,
      recommendations,
      alerts
    }
  }

  // Private utility methods

  private static escalatePriority(current: SyncPriority, target: SyncPriority): SyncPriority {
    const currentWeight = this.SYNC_PRIORITIES[current].weight
    const targetWeight = this.SYNC_PRIORITIES[target].weight
    return targetWeight > currentWeight ? target : current
  }

  private static getHigherPriority(a: SyncPriority, b: SyncPriority): SyncPriority {
    return this.SYNC_PRIORITIES[a].weight >= this.SYNC_PRIORITIES[b].weight ? a : b
  }

  private static isWithinBusinessHours(
    regionConfig: WarehouseRegion,
    timeContext: Date = new Date()
  ): boolean {
    // Convert to region timezone and check business hours
    const hour = timeContext.getHours() // Simplified - would use proper timezone conversion
    return hour >= regionConfig.workingHours.start && hour < regionConfig.workingHours.end
  }

  private static shouldStartNewBatch(currentPriority: SyncPriority, newPriority: SyncPriority): boolean {
    const currentWeight = this.SYNC_PRIORITIES[currentPriority].weight
    const newWeight = this.SYNC_PRIORITIES[newPriority].weight
    return Math.abs(currentWeight - newWeight) > 25 // Significant priority difference
  }

  private static generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static estimateBatchDuration(products: ProductSyncData[], config: SyncConfiguration): number {
    // Base time per product + overhead
    const baseTimePerProduct = 100 // 100ms per product
    const overheadTime = 500 // 500ms batch overhead
    const complexityMultiplier = products.some(p => p.metadata?.isComplex) ? 1.5 : 1
    
    return (products.length * baseTimePerProduct * complexityMultiplier) + overheadTime
  }

  private static determineBatchRegion(products: ProductSyncData[]): string | undefined {
    const regions = products
      .map(p => p.metadata?.region)
      .filter(r => r)
    
    // Return most common region or undefined if mixed
    const regionCounts = regions.reduce((acc, region) => {
      acc[region!] = (acc[region!] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const dominantRegion = Object.entries(regionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    return dominantRegion
  }

  private static getWarehouseRegion(warehouseId: string): string {
    // Map warehouse IDs to regions - this would be looked up from database
    const regionMap: Record<string, string> = {
      'us-warehouse': 'US',
      'japan-warehouse': 'Japan',
      'eu-warehouse': 'EU',
      'australia-warehouse': 'Australia'
    }
    return regionMap[warehouseId] || 'US' // Default to US
  }

  private static getRegionalFlexVoltDemand(region: string, timeContext: Date): number {
    // Simplified demand calculation - would use real market data
    const baseDemand = {
      'US': 0.8,
      'Japan': 0.6,
      'EU': 0.7,
      'Australia': 0.5
    }
    
    const seasonalMultiplier = this.getSeasonalMultiplier(region, timeContext)
    return (baseDemand[region as keyof typeof baseDemand] || 0.5) * seasonalMultiplier
  }

  private static getSeasonalMultiplier(region: string, date: Date): number {
    const month = date.getMonth()
    
    // Construction season patterns
    if (region === 'US' || region === 'EU') {
      return month >= 3 && month <= 9 ? 1.2 : 0.8 // Spring/Summer higher demand
    } else if (region === 'Australia') {
      return month >= 9 || month <= 2 ? 1.2 : 0.8 // Opposite seasons
    }
    
    return 1.0 // Stable year-round for Japan
  }

  private static calculateSyncDelay(
    sourceWarehouse: string,
    targetWarehouse: string,
    timeContext: Date
  ): number {
    // Network latency estimation based on regions
    const baseLatency = {
      'US': { 'Japan': 150, 'EU': 100, 'Australia': 200 },
      'Japan': { 'US': 150, 'EU': 250, 'Australia': 100 },
      'EU': { 'US': 100, 'Japan': 250, 'Australia': 300 },
      'Australia': { 'US': 200, 'Japan': 100, 'EU': 300 }
    }

    const sourceRegion = this.getWarehouseRegion(sourceWarehouse)
    const targetRegion = this.getWarehouseRegion(targetWarehouse)
    
    const baseDelay = baseLatency[sourceRegion as keyof typeof baseLatency]?.[targetRegion as keyof typeof baseLatency[typeof sourceRegion]] || 100
    
    // Add processing time and business hours consideration
    const processingTime = 50
    const businessHoursMultiplier = this.isWithinBusinessHours(this.WAREHOUSE_REGIONS[targetRegion], timeContext) ? 1.0 : 1.5
    
    return Math.round(baseDelay * businessHoursMultiplier + processingTime)
  }

  private static calculateSyncPerformance(syncHistory: any[]) {
    const totalSyncs = syncHistory.length
    const successfulSyncs = syncHistory.filter(s => s.status === 'COMPLETED').length
    const totalDuration = syncHistory.reduce((sum, s) => sum + (s.duration || 0), 0)
    const totalProducts = syncHistory.reduce((sum, s) => sum + (s.syncedProducts || 0), 0)

    return {
      averageSyncTime: totalSyncs > 0 ? totalDuration / totalSyncs : 0,
      successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 100,
      throughput: totalDuration > 0 ? (totalProducts / totalDuration) * 3600000 : 0 // products per hour
    }
  }

  private static analyzeSyncTrends(syncHistory: any[]) {
    // Simplified trend analysis
    return {
      syncFrequency: 'STABLE' as const,
      errorRate: 'STABLE' as const,
      peakHours: [9, 10, 11, 14, 15, 16] // Business hours
    }
  }

  private static generateSyncRecommendations(performance: any, trends: any, warehouseMetrics: any): string[] {
    const recommendations: string[] = []

    if (performance.successRate < 95) {
      recommendations.push('Consider investigating and resolving frequent sync failures')
    }

    if (performance.averageSyncTime > 30000) {
      recommendations.push('Optimize sync batching to improve performance')
    }

    if (performance.throughput < 100) {
      recommendations.push('Increase parallel processing for better throughput')
    }

    return recommendations
  }

  private static generateSyncAlerts(performance: any, trends: any) {
    const alerts: Array<{ severity: 'INFO' | 'WARNING' | 'CRITICAL'; message: string }> = []

    if (performance.successRate < 90) {
      alerts.push({
        severity: 'CRITICAL',
        message: `Sync success rate critically low: ${performance.successRate.toFixed(1)}%`
      })
    } else if (performance.successRate < 95) {
      alerts.push({
        severity: 'WARNING',
        message: `Sync success rate below target: ${performance.successRate.toFixed(1)}%`
      })
    }

    if (performance.averageSyncTime > 60000) {
      alerts.push({
        severity: 'WARNING',
        message: `Average sync time elevated: ${(performance.averageSyncTime / 1000).toFixed(1)}s`
      })
    }

    return alerts
  }
}

// Export utility functions
export const inventorySyncUtils = InventorySyncUtils

// Export schemas for external use
export {
  ProductSyncSchema,
  SyncConfigurationSchema
}