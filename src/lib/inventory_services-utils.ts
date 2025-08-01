/**
 * RHY_048: Inventory Services Utilities
 * Helper functions and utilities for enhanced inventory services
 */

import { z } from 'zod'
import type { 
  SmartRecommendation, 
  InventoryServiceMetrics,
  PredictiveAnalysis,
  CrossWarehouseInsight
} from '@/types/inventory_services'

// ================================
// PERFORMANCE OPTIMIZATION UTILS
// ================================

/**
 * Debounce utility for frequent operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle utility for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Batch processor for bulk operations
 */
export class BatchProcessor<T> {
  private batch: T[] = []
  private batchSize: number
  private flushInterval: number
  private processor: (items: T[]) => Promise<void>
  private timer: NodeJS.Timeout | null = null

  constructor(
    batchSize: number,
    flushInterval: number,
    processor: (items: T[]) => Promise<void>
  ) {
    this.batchSize = batchSize
    this.flushInterval = flushInterval
    this.processor = processor
  }

  add(item: T): void {
    this.batch.push(item)
    
    if (this.batch.length >= this.batchSize) {
      this.flush()
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval)
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    if (this.batch.length > 0) {
      const items = [...this.batch]
      this.batch = []
      await this.processor(items)
    }
  }
}

// ================================
// DATA VALIDATION UTILS
// ================================

/**
 * Validate warehouse ID format
 */
export function validateWarehouseId(warehouseId: string): boolean {
  return /^WH\d{3}$/.test(warehouseId)
}

/**
 * Validate product ID format (FlexVolt products)
 */
export function validateProductId(productId: string): boolean {
  const validProducts = ['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH']
  return validProducts.includes(productId)
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[^\w\s-]/g, '').substring(0, 100)
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  const now = new Date()
  const maxRange = 365 * 24 * 60 * 60 * 1000 // 1 year
  
  return startDate < endDate && 
         endDate <= now && 
         (endDate.getTime() - startDate.getTime()) <= maxRange
}

// ================================
// CALCULATION UTILITIES
// ================================

/**
 * Calculate inventory turnover rate
 */
export function calculateTurnoverRate(
  costOfGoodsSold: number,
  averageInventoryValue: number
): number {
  if (averageInventoryValue === 0) return 0
  return costOfGoodsSold / averageInventoryValue
}

/**
 * Calculate inventory carrying cost
 */
export function calculateCarryingCost(
  inventoryValue: number,
  carryingCostRate: number = 0.25
): number {
  return inventoryValue * carryingCostRate
}

/**
 * Calculate safety stock level
 */
export function calculateSafetyStock(
  averageDemand: number,
  maxDemand: number,
  averageLeadTime: number,
  maxLeadTime: number
): number {
  const demandVariability = maxDemand - averageDemand
  const leadTimeVariability = maxLeadTime - averageLeadTime
  
  return (demandVariability * averageLeadTime) + (averageDemand * leadTimeVariability)
}

/**
 * Calculate reorder point
 */
export function calculateReorderPoint(
  averageDemand: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return (averageDemand * leadTimeDays) + safetyStock
}

/**
 * Calculate Economic Order Quantity (EOQ)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit)
}

// ================================
// PERFORMANCE METRICS
// ================================

/**
 * Calculate inventory accuracy
 */
export function calculateInventoryAccuracy(
  systemCount: number,
  physicalCount: number
): number {
  if (systemCount === 0 && physicalCount === 0) return 1
  if (systemCount === 0 || physicalCount === 0) return 0
  
  const variance = Math.abs(systemCount - physicalCount)
  return Math.max(0, 1 - (variance / Math.max(systemCount, physicalCount)))
}

/**
 * Calculate fill rate
 */
export function calculateFillRate(
  ordersShippedComplete: number,
  totalOrders: number
): number {
  if (totalOrders === 0) return 1
  return ordersShippedComplete / totalOrders
}

/**
 * Calculate space utilization
 */
export function calculateSpaceUtilization(
  usedSpace: number,
  totalSpace: number
): number {
  if (totalSpace === 0) return 0
  return Math.min(1, usedSpace / totalSpace)
}

// ================================
// FORECASTING UTILITIES
// ================================

/**
 * Simple moving average
 */
export function calculateMovingAverage(
  values: number[],
  period: number
): number[] {
  const result: number[] = []
  
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / period)
  }
  
  return result
}

/**
 * Exponential smoothing
 */
export function exponentialSmoothing(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return []
  
  const result: number[] = [values[0]]
  
  for (let i = 1; i < values.length; i++) {
    const forecast = alpha * values[i] + (1 - alpha) * result[i - 1]
    result.push(forecast)
  }
  
  return result
}

/**
 * Calculate seasonal index
 */
export function calculateSeasonalIndex(
  values: number[],
  seasonLength: number = 12
): number[] {
  const seasonalTotals = new Array(seasonLength).fill(0)
  const seasonalCounts = new Array(seasonLength).fill(0)
  
  values.forEach((value, index) => {
    const seasonIndex = index % seasonLength
    seasonalTotals[seasonIndex] += value
    seasonalCounts[seasonIndex]++
  })
  
  const seasonalAverages = seasonalTotals.map((total, index) => 
    seasonalCounts[index] > 0 ? total / seasonalCounts[index] : 0
  )
  
  const overallAverage = seasonalAverages.reduce((a, b) => a + b, 0) / seasonLength
  
  return seasonalAverages.map(avg => overallAverage > 0 ? avg / overallAverage : 1)
}

// ================================
// RECOMMENDATION SCORING
// ================================

/**
 * Score recommendation impact
 */
export function scoreRecommendationImpact(
  recommendation: SmartRecommendation
): number {
  const { expectedBenefit } = recommendation.recommendation
  
  let score = 0
  
  // Cost savings weight: 40%
  if (expectedBenefit.costSavings) {
    score += (expectedBenefit.costSavings / 10000) * 0.4
  }
  
  // Efficiency gain weight: 30%
  if (expectedBenefit.efficiencyGain) {
    score += expectedBenefit.efficiencyGain * 0.3
  }
  
  // Risk reduction weight: 20%
  if (expectedBenefit.riskReduction) {
    score += expectedBenefit.riskReduction * 0.2
  }
  
  // Revenue impact weight: 10%
  if (expectedBenefit.revenueImpact) {
    score += (expectedBenefit.revenueImpact / 50000) * 0.1
  }
  
  return Math.min(1, score)
}

/**
 * Calculate recommendation urgency score
 */
export function calculateUrgencyScore(
  urgency: 'LOW' | 'MEDIUM' | 'HIGH',
  validUntil: Date
): number {
  const urgencyWeights = { LOW: 0.3, MEDIUM: 0.6, HIGH: 1.0 }
  const baseScore = urgencyWeights[urgency]
  
  // Time decay factor
  const hoursUntilExpiry = (validUntil.getTime() - Date.now()) / (1000 * 60 * 60)
  const timeDecay = Math.max(0, Math.min(1, hoursUntilExpiry / 168)) // Normalize to 1 week
  
  return baseScore * (0.5 + 0.5 * timeDecay)
}

// ================================
// ALERT UTILITIES
// ================================

/**
 * Generate alert severity based on metrics
 */
export function calculateAlertSeverity(
  currentValue: number,
  threshold: number,
  criticalThreshold?: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (criticalThreshold && currentValue <= criticalThreshold) {
    return 'CRITICAL'
  }
  
  const ratio = currentValue / threshold
  
  if (ratio <= 0.5) return 'CRITICAL'
  if (ratio <= 0.75) return 'HIGH'
  if (ratio <= 0.9) return 'MEDIUM'
  return 'LOW'
}

/**
 * Estimate time to stockout
 */
export function estimateTimeToStockout(
  currentStock: number,
  averageDailyUsage: number,
  reservedStock: number = 0
): number {
  const availableStock = currentStock - reservedStock
  if (availableStock <= 0 || averageDailyUsage <= 0) return 0
  
  return Math.floor(availableStock / averageDailyUsage)
}

// ================================
// FORMATTING UTILITIES
// ================================

/**
 * Format currency value
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

/**
 * Format large numbers
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

// ================================
// DATE UTILITIES
// ================================

/**
 * Get date range for time frame
 */
export function getDateRange(
  timeframe: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (timeframe) {
    case 'HOUR':
      startDate.setHours(startDate.getHours() - 1)
      break
    case 'DAY':
      startDate.setDate(startDate.getDate() - 1)
      break
    case 'WEEK':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'MONTH':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'QUARTER':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'YEAR':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
  }
  
  return { startDate, endDate }
}

/**
 * Check if date is business day
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6 // Not Sunday (0) or Saturday (6)
}

/**
 * Add business days to date
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let addedDays = 0
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1)
    if (isBusinessDay(result)) {
      addedDays++
    }
  }
  
  return result
}

// ================================
// ERROR HANDLING UTILITIES
// ================================

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Create error context for debugging
 */
export function createErrorContext(
  operation: string,
  data: Record<string, any>
): Record<string, any> {
  return {
    operation,
    timestamp: new Date().toISOString(),
    ...data,
    stackTrace: new Error().stack
  }
}

// ================================
// CACHE UTILITIES
// ================================

/**
 * Simple LRU cache implementation
 */
export class LRUCache<K, V> {
  private maxSize: number
  private cache: Map<K, { value: V; timestamp: number }>
  private accessOrder: K[]

  constructor(maxSize: number) {
    this.maxSize = maxSize
    this.cache = new Map()
    this.accessOrder = []
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined
    
    // Move to end (most recently used)
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
    
    return item.value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.set(key, { value, timestamp: Date.now() })
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
      this.accessOrder.push(key)
    } else {
      // Add new
      if (this.cache.size >= this.maxSize) {
        // Remove least recently used
        const lruKey = this.accessOrder.shift()
        if (lruKey !== undefined) {
          this.cache.delete(lruKey)
        }
      }
      
      this.cache.set(key, { value, timestamp: Date.now() })
      this.accessOrder.push(key)
    }
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  size(): number {
    return this.cache.size
  }
}

// ================================
// CONSTANTS
// ================================

export const INVENTORY_CONSTANTS = {
  // FlexVolt product specifications
  PRODUCTS: {
    FLEXVOLT_6AH: {
      capacity: 6.0,
      voltage: 20,
      weight: 1.2,
      price: 95
    },
    FLEXVOLT_9AH: {
      capacity: 9.0,
      voltage: 20,
      weight: 1.8,
      price: 125
    },
    FLEXVOLT_15AH: {
      capacity: 15.0,
      voltage: 20,
      weight: 2.5,
      price: 245
    }
  },
  
  // Performance thresholds
  THRESHOLDS: {
    LOW_STOCK_PERCENTAGE: 0.2,
    CRITICAL_STOCK_PERCENTAGE: 0.1,
    OVERSTOCK_PERCENTAGE: 1.5,
    TARGET_FILL_RATE: 0.96,
    TARGET_ACCURACY: 0.985,
    MAX_LEAD_TIME_DAYS: 14
  },
  
  // Cache TTL values (in milliseconds)
  CACHE_TTL: {
    METRICS: 5 * 60 * 1000,      // 5 minutes
    RECOMMENDATIONS: 15 * 60 * 1000, // 15 minutes
    FORECASTS: 60 * 60 * 1000,   // 1 hour
    ANALYTICS: 30 * 60 * 1000    // 30 minutes
  }
} as const