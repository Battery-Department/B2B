/**
 * RHY_048: Enhanced Inventory Services Types
 * Advanced type definitions for inventory services layer
 * Extends Batch 1 foundation with enhanced business intelligence
 */

import { z } from 'zod'
import type { InventoryItem, InventoryAlert, InventoryMovement } from './inventory'

// ================================
// ENHANCED SERVICE TYPES
// ================================

export interface InventoryServiceRequest {
  warehouseId: string
  userId: string
  requestId?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  metadata?: {
    source: 'WEB' | 'API' | 'MOBILE' | 'SYSTEM'
    userAgent?: string
    ipAddress?: string
    sessionId?: string
  }
}

export interface SmartRecommendation {
  id: string
  type: 'REORDER' | 'TRANSFER' | 'LIQUIDATE' | 'OPTIMIZE' | 'ALERT'
  productId: string
  warehouseId: string
  recommendation: {
    action: string
    quantity?: number
    targetWarehouse?: string
    urgency: 'LOW' | 'MEDIUM' | 'HIGH'
    reasoning: string
    expectedBenefit: {
      costSavings?: number
      efficiencyGain?: number
      riskReduction?: number
      revenueImpact?: number
    }
  }
  confidence: number
  validUntil: Date
  automationEligible: boolean
  estimatedImplementationTime: number // minutes
  dependencies: string[]
  createdAt: Date
  acknowledgedAt?: Date
  implementedAt?: Date
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IMPLEMENTED' | 'EXPIRED' | 'REJECTED'
}

export interface InventoryOptimizationResult {
  warehouseId: string
  optimizationType: 'SPACE' | 'COST' | 'TURNOVER' | 'RISK' | 'COMPREHENSIVE'
  currentState: {
    utilizationRate: number
    carryingCost: number
    turnoverRate: number
    stockoutRisk: number
    overstockRisk: number
  }
  optimizedState: {
    utilizationRate: number
    carryingCost: number
    turnoverRate: number
    stockoutRisk: number
    overstockRisk: number
  }
  improvements: {
    costReduction: number
    spaceEfficiency: number
    riskReduction: number
    serviceLevel: number
  }
  recommendations: SmartRecommendation[]
  implementationPlan: {
    phases: Array<{
      phase: number
      actions: string[]
      estimatedDuration: number
      expectedImpact: number
    }>
    totalDuration: number
    totalInvestment: number
    paybackPeriod: number
  }
  confidence: number
  generatedAt: Date
  validUntil: Date
}

export interface PredictiveAnalysis {
  productId: string
  warehouseId: string
  analysisType: 'DEMAND_FORECAST' | 'STOCKOUT_PREDICTION' | 'SEASONAL_ANALYSIS' | 'TREND_ANALYSIS'
  timeframe: {
    startDate: Date
    endDate: Date
    granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  }
  predictions: Array<{
    date: Date
    predictedValue: number
    confidence: number
    factors: Array<{
      name: string
      impact: number
      type: 'SEASONAL' | 'TREND' | 'EVENT' | 'EXTERNAL'
    }>
    alertLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }>
  accuracy: {
    historicalAccuracy: number
    lastPredictionAccuracy: number
    confidenceInterval: {
      lower: number
      upper: number
    }
  }
  recommendations: SmartRecommendation[]
  generatedAt: Date
  modelVersion: string
}

export interface InventoryServiceMetrics {
  serviceId: string
  warehouseId?: string
  period: {
    startDate: Date
    endDate: Date
  }
  performance: {
    responseTime: {
      average: number
      p50: number
      p95: number
      p99: number
    }
    throughput: {
      requestsPerSecond: number
      operationsPerMinute: number
    }
    errorRate: number
    availability: number
  }
  businessMetrics: {
    accuracyRate: number
    recommendationAcceptanceRate: number
    automationRate: number
    costSavings: number
    efficiencyGains: number
  }
  resourceUtilization: {
    cpuUsage: number
    memoryUsage: number
    cacheHitRate: number
    databaseConnections: number
  }
  alertsSummary: {
    generated: number
    resolved: number
    avgResolutionTime: number
    criticalAlerts: number
  }
}

export interface CrossWarehouseInsight {
  id: string
  type: 'IMBALANCE' | 'EFFICIENCY_GAP' | 'TRANSFER_OPPORTUNITY' | 'RISK_CONCENTRATION'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  description: string
  affectedWarehouses: string[]
  metrics: {
    impactMagnitude: number
    confidenceLevel: number
    potentialSavings?: number
    riskLevel?: number
  }
  recommendations: Array<{
    action: string
    warehouseId: string
    expectedImpact: string
    implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
  trendData: Array<{
    date: Date
    value: number
    benchmark?: number
  }>
  generatedAt: Date
  expiresAt: Date
}

export interface InventoryAlertEnhanced extends InventoryAlert {
  predictive: boolean
  mlGenerated: boolean
  contextualInfo: {
    relatedAlerts: string[]
    historicalPattern: {
      frequency: number
      lastOccurrence: Date
      typicalResolution: string
    }
    businessImpact: {
      revenueAtRisk: number
      customerImpact: 'LOW' | 'MEDIUM' | 'HIGH'
      operationalImpact: 'LOW' | 'MEDIUM' | 'HIGH'
    }
  }
  autoResolution: {
    possible: boolean
    suggestedActions: string[]
    estimatedResolutionTime: number
    confidence: number
  }
}

// ================================
// REQUEST/RESPONSE INTERFACES
// ================================

export interface GetEnhancedMetricsRequest extends InventoryServiceRequest {
  includeForecasts?: boolean
  includeBenchmarks?: boolean
  metricsGranularity?: 'SUMMARY' | 'DETAILED' | 'COMPREHENSIVE'
  timeframe?: 'REALTIME' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'
}

export interface SmartOperationRequest extends InventoryServiceRequest {
  operationType: 'AUTO_REORDER' | 'SMART_TRANSFER' | 'STOCK_OPTIMIZATION' | 'PREDICTIVE_ALERT'
  productIds: string[]
  parameters?: {
    targetQuantity?: number
    targetWarehouse?: string
    maxBudget?: number
    timeframe?: number // days
    automationLevel?: 'MANUAL' | 'SEMI_AUTO' | 'FULL_AUTO'
  }
  approvalRequired?: boolean
  scheduledExecution?: Date
}

export interface CrossWarehouseAnalyticsRequest extends InventoryServiceRequest {
  warehouseIds?: string[]
  regions?: ('US' | 'JP' | 'EU' | 'AU')[]
  productCategories?: string[]
  analysisType: 'PERFORMANCE' | 'OPTIMIZATION' | 'RISK_ANALYSIS' | 'COMPREHENSIVE'
  timeframe: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  includeForecasts?: boolean
  includeBenchmarks?: boolean
  compareWithIndustry?: boolean
}

export interface InventorySyncRequest extends InventoryServiceRequest {
  syncType: 'INCREMENTAL' | 'FULL' | 'SELECTIVE'
  targetSystems?: string[]
  conflictResolution: 'MANUAL' | 'AUTO_RESOLVE' | 'SOURCE_WINS' | 'LATEST_WINS'
  validationLevel: 'BASIC' | 'STANDARD' | 'STRICT'
  rollbackOnError?: boolean
}

export interface SmartRecommendationsRequest extends InventoryServiceRequest {
  recommendationTypes?: ('REORDER' | 'TRANSFER' | 'LIQUIDATE' | 'OPTIMIZE')[]
  productIds?: string[]
  urgencyLevels?: ('LOW' | 'MEDIUM' | 'HIGH')[]
  automationEligibleOnly?: boolean
  maxRecommendations?: number
  sortBy?: 'CONFIDENCE' | 'IMPACT' | 'URGENCY' | 'FEASIBILITY'
}

// ================================
// RESPONSE INTERFACES
// ================================

export interface EnhancedMetricsResponse {
  success: boolean
  data?: {
    metrics: InventoryServiceMetrics
    realTimeData: {
      currentStatus: Record<string, number>
      activeAlerts: InventoryAlertEnhanced[]
      recentActivity: InventoryMovement[]
    }
    predictions?: PredictiveAnalysis[]
    benchmarks?: {
      industryAverages: Record<string, number>
      peerComparison: Record<string, number>
      historicalBaseline: Record<string, number>
    }
  }
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta: {
    requestId: string
    timestamp: string
    processingTime: number
    cacheHit: boolean
    dataFreshness: string
  }
}

export interface SmartOperationResponse {
  success: boolean
  data?: {
    operationId: string
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    results?: {
      itemsProcessed: number
      itemsSuccessful: number
      itemsFailed: number
      totalCostImpact: number
      estimatedSavings: number
    }
    timeline?: {
      queuedAt: Date
      startedAt?: Date
      completedAt?: Date
      estimatedCompletion?: Date
    }
    logs?: Array<{
      timestamp: Date
      level: 'INFO' | 'WARNING' | 'ERROR'
      message: string
      details?: Record<string, any>
    }>
  }
  error?: {
    code: string
    message: string
    retryable: boolean
    retryAfter?: number
  }
  meta: {
    requestId: string
    timestamp: string
    processingTime: number
  }
}

export interface CrossWarehouseAnalyticsResponse {
  success: boolean
  data?: {
    globalMetrics: Record<string, number>
    warehouseComparison: Array<{
      warehouseId: string
      warehouseName: string
      region: string
      metrics: Record<string, number>
      ranking: number
      trends: Record<string, number>
      alerts: InventoryAlertEnhanced[]
    }>
    insights: CrossWarehouseInsight[]
    recommendations: SmartRecommendation[]
    optimization: InventoryOptimizationResult[]
    forecasts?: PredictiveAnalysis[]
    benchmarks?: {
      industryStandards: Record<string, number>
      topPerformers: Record<string, number>
    }
  }
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta: {
    requestId: string
    timestamp: string
    processingTime: number
    dataPoints: number
    analysisDepth: 'BASIC' | 'STANDARD' | 'COMPREHENSIVE'
  }
}

export interface SmartRecommendationsResponse {
  success: boolean
  data?: {
    recommendations: SmartRecommendation[]
    summary: {
      totalRecommendations: number
      byType: Record<string, number>
      byUrgency: Record<string, number>
      totalPotentialSavings: number
      automationEligible: number
    }
    prioritized: {
      immediate: SmartRecommendation[]
      shortTerm: SmartRecommendation[]
      longTerm: SmartRecommendation[]
    }
  }
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta: {
    requestId: string
    timestamp: string
    processingTime: number
    modelVersion: string
    confidence: number
  }
}

export interface InventorySyncResponse {
  success: boolean
  data?: {
    syncId: string
    status: 'COMPLETED' | 'PARTIAL' | 'FAILED'
    summary: {
      itemsProcessed: number
      itemsSuccessful: number
      itemsFailed: number
      conflictsDetected: number
      conflictsResolved: number
    }
    details: {
      syncDuration: number
      throughput: number
      errorRate: number
      dataConsistency: number
    }
    conflicts?: Array<{
      itemId: string
      conflictType: string
      localValue: any
      remoteValue: any
      resolution: string
      resolvedAt?: Date
    }>
    nextSync?: {
      scheduledAt: Date
      type: string
      estimatedDuration: number
    }
  }
  error?: {
    code: string
    message: string
    recoverable: boolean
    retryStrategy?: string
  }
  meta: {
    requestId: string
    timestamp: string
    syncStrategy: string
    dataVersion: string
  }
}

// ================================
// VALIDATION SCHEMAS
// ================================

export const InventoryServiceRequestSchema = z.object({
  warehouseId: z.string().uuid(),
  userId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  metadata: z.object({
    source: z.enum(['WEB', 'API', 'MOBILE', 'SYSTEM']).default('API'),
    userAgent: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    sessionId: z.string().optional()
  }).optional()
})

export const SmartOperationRequestSchema = InventoryServiceRequestSchema.extend({
  operationType: z.enum(['AUTO_REORDER', 'SMART_TRANSFER', 'STOCK_OPTIMIZATION', 'PREDICTIVE_ALERT']),
  productIds: z.array(z.string().uuid()).min(1).max(100),
  parameters: z.object({
    targetQuantity: z.number().min(1).optional(),
    targetWarehouse: z.string().uuid().optional(),
    maxBudget: z.number().min(0).optional(),
    timeframe: z.number().min(1).max(365).optional(),
    automationLevel: z.enum(['MANUAL', 'SEMI_AUTO', 'FULL_AUTO']).default('SEMI_AUTO')
  }).optional(),
  approvalRequired: z.boolean().default(true),
  scheduledExecution: z.date().optional()
})

export const CrossWarehouseAnalyticsRequestSchema = InventoryServiceRequestSchema.extend({
  warehouseIds: z.array(z.string().uuid()).optional(),
  regions: z.array(z.enum(['US', 'JP', 'EU', 'AU'])).optional(),
  productCategories: z.array(z.string()).optional(),
  analysisType: z.enum(['PERFORMANCE', 'OPTIMIZATION', 'RISK_ANALYSIS', 'COMPREHENSIVE']),
  timeframe: z.enum(['WEEK', 'MONTH', 'QUARTER', 'YEAR']),
  includeForecasts: z.boolean().default(false),
  includeBenchmarks: z.boolean().default(false),
  compareWithIndustry: z.boolean().default(false)
})

export const GetEnhancedMetricsRequestSchema = InventoryServiceRequestSchema.extend({
  includeForecasts: z.boolean().default(false),
  includeBenchmarks: z.boolean().default(false),
  metricsGranularity: z.enum(['SUMMARY', 'DETAILED', 'COMPREHENSIVE']).default('DETAILED'),
  timeframe: z.enum(['REALTIME', 'HOUR', 'DAY', 'WEEK', 'MONTH']).default('REALTIME')
})

export const InventorySyncRequestSchema = InventoryServiceRequestSchema.extend({
  syncType: z.enum(['INCREMENTAL', 'FULL', 'SELECTIVE']),
  targetSystems: z.array(z.string()).optional(),
  conflictResolution: z.enum(['MANUAL', 'AUTO_RESOLVE', 'SOURCE_WINS', 'LATEST_WINS']).default('AUTO_RESOLVE'),
  validationLevel: z.enum(['BASIC', 'STANDARD', 'STRICT']).default('STANDARD'),
  rollbackOnError: z.boolean().default(true)
})

export const SmartRecommendationsRequestSchema = InventoryServiceRequestSchema.extend({
  recommendationTypes: z.array(z.enum(['REORDER', 'TRANSFER', 'LIQUIDATE', 'OPTIMIZE'])).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  urgencyLevels: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH'])).optional(),
  automationEligibleOnly: z.boolean().default(false),
  maxRecommendations: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['CONFIDENCE', 'IMPACT', 'URGENCY', 'FEASIBILITY']).default('CONFIDENCE')
})

// ================================
// UTILITY TYPES
// ================================

export type InventoryServiceEventType =
  | 'METRICS_UPDATED'
  | 'ALERT_GENERATED'
  | 'ALERT_RESOLVED'
  | 'OPERATION_COMPLETED'
  | 'SYNC_COMPLETED'
  | 'RECOMMENDATION_GENERATED'
  | 'OPTIMIZATION_COMPLETED'
  | 'FORECAST_UPDATED'

export type InventoryServiceStatus = 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'MAINTENANCE'

export type AutomationLevel = 'MANUAL' | 'SEMI_AUTO' | 'FULL_AUTO'

export type AnalysisDepth = 'BASIC' | 'STANDARD' | 'COMPREHENSIVE'

export interface InventoryServiceConfig {
  warehouseId: string
  enablePredictiveAnalysis: boolean
  enableSmartRecommendations: boolean
  enableAutomation: boolean
  automationLevel: AutomationLevel
  alertThresholds: {
    stockoutRisk: number
    overstockRisk: number
    accuracyThreshold: number
    performanceThreshold: number
  }
  syncConfiguration: {
    frequency: number // minutes
    strategy: 'REAL_TIME' | 'BATCH' | 'SCHEDULED'
    conflictResolution: 'MANUAL' | 'AUTO_RESOLVE' | 'SOURCE_WINS' | 'LATEST_WINS'
  }
  cacheConfiguration: {
    enabled: boolean
    ttl: number // seconds
    maxSize: number
  }
  performanceTargets: {
    responseTime: number // ms
    throughput: number // requests/second
    availability: number // percentage
    accuracy: number // percentage
  }
}

// ================================
// ERROR TYPES
// ================================

export class InventoryServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public warehouseId?: string,
    public productId?: string,
    public retryable: boolean = false,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'InventoryServiceError'
  }
}

export interface InventoryServiceErrorContext {
  requestId: string
  userId: string
  warehouseId?: string
  operation: string
  timestamp: Date
  userAgent?: string
  ipAddress?: string
  additionalContext?: Record<string, any>
}

// ================================
// WEBHOOK TYPES
// ================================

export interface InventoryWebhookPayload {
  eventType: InventoryServiceEventType
  eventId: string
  timestamp: Date
  warehouseId: string
  data: Record<string, any>
  metadata: {
    version: string
    source: string
    environment: string
  }
}

export interface WebhookSubscription {
  id: string
  url: string
  events: InventoryServiceEventType[]
  warehouseIds?: string[]
  secret: string
  enabled: boolean
  createdAt: Date
  lastTriggered?: Date
  failureCount: number
  retryConfiguration: {
    maxRetries: number
    backoffStrategy: 'LINEAR' | 'EXPONENTIAL'
    retryDelay: number
  }
}