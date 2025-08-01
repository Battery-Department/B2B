/**
 * RHY_064: Regional Analysis Types
 * Enhanced analytics reporting for multi-warehouse regional operations
 * Integrates with Batch 1 foundation: WarehouseService, AnalyticsEngine, MetricsService
 */

import { z } from 'zod'
import { WarehouseRegion } from './transfers'

// Regional Performance Metrics
export interface RegionalMetrics {
  region: WarehouseRegion
  warehouseId: string
  currency: 'USD' | 'JPY' | 'EUR' | 'AUD'
  timezone: string
  
  // Core Performance Indicators
  performance: {
    revenue: number
    ordersProcessed: number
    averageOrderValue: number
    fulfillmentRate: number
    accuracyRate: number
    utilizationRate: number
    customerSatisfaction: number
    onTimeDeliveryRate: number
  }
  
  // Regional Specifics
  regional: {
    complianceScore: number
    localMarketShare: number
    competitorAnalysis: {
      marketPosition: number
      priceCompetitiveness: number
      serviceDifferentiation: number
    }
    seasonalTrends: {
      q1Factor: number
      q2Factor: number
      q3Factor: number
      q4Factor: number
    }
  }
  
  // FlexVolt Product Performance by Region
  flexVoltPerformance: {
    battery6Ah: {
      unitsSold: number
      revenue: number
      marketPenetration: number
      customerSatisfaction: number
    }
    battery9Ah: {
      unitsSold: number
      revenue: number
      marketPenetration: number
      customerSatisfaction: number
    }
    battery15Ah: {
      unitsSold: number
      revenue: number
      marketPenetration: number
      customerSatisfaction: number
    }
  }
  
  // Regional Insights
  insights: RegionalInsight[]
  recommendations: RegionalRecommendation[]
}

export interface RegionalInsight {
  type: 'GROWTH_OPPORTUNITY' | 'RISK_ALERT' | 'MARKET_TREND' | 'PERFORMANCE_GAP' | 'SEASONAL_PATTERN'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  impact: string
  confidence: number
  timeframe: string
  affectedMetrics: string[]
  dataPoints: number
  actionItems: string[]
  estimatedValue?: number
}

export interface RegionalRecommendation {
  category: 'INVENTORY' | 'PRICING' | 'MARKETING' | 'OPERATIONS' | 'EXPANSION'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  title: string
  description: string
  expectedImpact: string
  implementationCost: number
  expectedROI: number
  timeToImplement: string
  requirements: string[]
  risks: string[]
  kpiTargets: {
    metric: string
    currentValue: number
    targetValue: number
    timeframe: string
  }[]
}

// Comparative Regional Analysis
export interface RegionalComparison {
  comparisonId: string
  generatedAt: Date
  timeRange: {
    start: Date
    end: Date
  }
  
  // Regional Performance Rankings
  rankings: {
    byRevenue: RegionalRanking[]
    byGrowth: RegionalRanking[]
    byEfficiency: RegionalRanking[]
    byCustomerSatisfaction: RegionalRanking[]
    byMarketShare: RegionalRanking[]
  }
  
  // Cross-Regional Insights
  crossRegionalInsights: {
    bestPractices: {
      region: WarehouseRegion
      practice: string
      impact: string
      applicability: WarehouseRegion[]
    }[]
    
    opportunityTransfers: {
      fromRegion: WarehouseRegion
      toRegion: WarehouseRegion
      opportunity: string
      potentialValue: number
      complexity: 'LOW' | 'MEDIUM' | 'HIGH'
    }[]
    
    riskMitigation: {
      region: WarehouseRegion
      risk: string
      mitigation: string
      successProbability: number
    }[]
  }
  
  // Regional Synergies
  synergies: RegionalSynergy[]
}

export interface RegionalRanking {
  rank: number
  region: WarehouseRegion
  value: number
  percentileScore: number
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  changeFromPrevious: number
}

export interface RegionalSynergy {
  type: 'INVENTORY_SHARING' | 'KNOWLEDGE_TRANSFER' | 'DEMAND_BALANCING' | 'COST_OPTIMIZATION'
  involvedRegions: WarehouseRegion[]
  description: string
  potentialValue: number
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH'
  timeline: string
  requirements: string[]
  expectedBenefits: string[]
}

// Market Analysis by Region
export interface RegionalMarketAnalysis {
  region: WarehouseRegion
  marketSize: {
    totalAddressableMarket: number
    serviceableAddressableMarket: number
    serviceableObtainableMarket: number
    currentMarketShare: number
    marketGrowthRate: number
  }
  
  competitiveLandscape: {
    competitor: string
    marketShare: number
    strengths: string[]
    weaknesses: string[]
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    competitiveAdvantages: string[]
  }[]
  
  customerSegmentation: {
    segment: 'CONTRACTORS' | 'DIY_ENTHUSIASTS' | 'INDUSTRIAL' | 'FLEET_MANAGERS'
    size: number
    growthRate: number
    averageOrderValue: number
    acquisitionCost: number
    lifetimeValue: number
    preferences: string[]
    painPoints: string[]
  }[]
  
  marketTrends: {
    trend: string
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    timeframe: string
    certainty: number
    implications: string[]
  }[]
  
  opportunities: {
    opportunity: string
    size: number
    difficulty: 'LOW' | 'MEDIUM' | 'HIGH'
    timeToCapture: string
    requirements: string[]
    potentialROI: number
  }[]
}

// Forecasting and Predictions
export interface RegionalForecast {
  region: WarehouseRegion
  forecastPeriod: {
    start: Date
    end: Date
  }
  confidence: number
  
  predictions: {
    revenue: {
      prediction: number
      confidenceInterval: [number, number]
      growthRate: number
      seasonalFactors: number[]
    }
    
    demandByProduct: {
      battery6Ah: {
        prediction: number
        trend: 'INCREASING' | 'STABLE' | 'DECREASING'
        driverFactors: string[]
      }
      battery9Ah: {
        prediction: number
        trend: 'INCREASING' | 'STABLE' | 'DECREASING'
        driverFactors: string[]
      }
      battery15Ah: {
        prediction: number
        trend: 'INCREASING' | 'STABLE' | 'DECREASING'
        driverFactors: string[]
      }
    }
    
    marketDynamics: {
      priceElasticity: number
      demandSensitivity: number
      competitiveResponse: string
      regulatoryChanges: string[]
    }
  }
  
  scenarios: {
    optimistic: {
      revenue: number
      probability: number
      keyDrivers: string[]
    }
    realistic: {
      revenue: number
      probability: number
      keyDrivers: string[]
    }
    pessimistic: {
      revenue: number
      probability: number
      keyDrivers: string[]
    }
  }
}

// API Request/Response Types
export interface RegionalAnalyticsRequest {
  regions?: WarehouseRegion[]
  timeRange: {
    start: Date
    end: Date
  }
  includeComparison?: boolean
  includeMarketAnalysis?: boolean
  includeForecasting?: boolean
  aggregationLevel: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  benchmarkAgainst?: 'INDUSTRY' | 'PREVIOUS_PERIOD' | 'BEST_PERFORMER'
}

export interface RegionalAnalyticsResponse {
  success: boolean
  data?: {
    regionalMetrics: RegionalMetrics[]
    comparison?: RegionalComparison
    marketAnalysis?: RegionalMarketAnalysis[]
    forecasts?: RegionalForecast[]
    executiveSummary: {
      topPerformer: WarehouseRegion
      biggestOpportunity: string
      highestRisk: string
      recommendedActions: string[]
      keyMetrics: {
        totalRevenue: number
        growthRate: number
        marketShare: number
        customerSatisfaction: number
      }
    }
  }
  metadata?: {
    generatedAt: Date
    analysisDepth: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE'
    dataQuality: number
    coverage: {
      region: WarehouseRegion
      completeness: number
    }[]
  }
  error?: string
}

// Validation Schemas
export const RegionalAnalyticsRequestSchema = z.object({
  regions: z.array(z.enum(['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA'])).optional(),
  timeRange: z.object({
    start: z.date(),
    end: z.date()
  }),
  includeComparison: z.boolean().default(false),
  includeMarketAnalysis: z.boolean().default(false),
  includeForecasting: z.boolean().default(false),
  aggregationLevel: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  benchmarkAgainst: z.enum(['INDUSTRY', 'PREVIOUS_PERIOD', 'BEST_PERFORMER']).optional()
}).refine(
  (data) => data.timeRange.start < data.timeRange.end,
  {
    message: 'Start date must be before end date',
    path: ['timeRange']
  }
)

export const RegionalInsightSchema = z.object({
  type: z.enum(['GROWTH_OPPORTUNITY', 'RISK_ALERT', 'MARKET_TREND', 'PERFORMANCE_GAP', 'SEASONAL_PATTERN']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  impact: z.string().min(10).max(300),
  confidence: z.number().min(0).max(1),
  timeframe: z.string().min(5).max(50),
  affectedMetrics: z.array(z.string()).min(1),
  dataPoints: z.number().min(0),
  actionItems: z.array(z.string()).min(1).max(10),
  estimatedValue: z.number().positive().optional()
})

export const RegionalRecommendationSchema = z.object({
  category: z.enum(['INVENTORY', 'PRICING', 'MARKETING', 'OPERATIONS', 'EXPANSION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  expectedImpact: z.string().min(10).max(300),
  implementationCost: z.number().min(0),
  expectedROI: z.number(),
  timeToImplement: z.string().min(5).max(50),
  requirements: z.array(z.string()).min(1).max(10),
  risks: z.array(z.string()).max(10),
  kpiTargets: z.array(z.object({
    metric: z.string(),
    currentValue: z.number(),
    targetValue: z.number(),
    timeframe: z.string()
  }))
})

// Type Guards
export const isRegionalMetrics = (value: unknown): value is RegionalMetrics => {
  return typeof value === 'object' && value !== null && 'region' in value && 'performance' in value
}

export const isRegionalInsight = (value: unknown): value is RegionalInsight => {
  try {
    RegionalInsightSchema.parse(value)
    return true
  } catch {
    return false
  }
}

export const isRegionalRecommendation = (value: unknown): value is RegionalRecommendation => {
  try {
    RegionalRecommendationSchema.parse(value)
    return true
  } catch {
    return false
  }
}

// Utility Functions
export const validateRegionalAnalyticsRequest = (data: unknown): RegionalAnalyticsRequest => {
  return RegionalAnalyticsRequestSchema.parse(data)
}

export const validateRegionalInsight = (data: unknown): RegionalInsight => {
  return RegionalInsightSchema.parse(data)
}

export const validateRegionalRecommendation = (data: unknown): RegionalRecommendation => {
  return RegionalRecommendationSchema.parse(data)
}

// Constants
export const REGION_METADATA = {
  US_WEST: {
    name: 'US West Coast',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    marketMaturity: 'MATURE',
    regulatoryComplexity: 'MEDIUM',
    competitiveIntensity: 'HIGH'
  },
  JAPAN: {
    name: 'Japan',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    marketMaturity: 'MATURE',
    regulatoryComplexity: 'HIGH',
    competitiveIntensity: 'VERY_HIGH'
  },
  EU: {
    name: 'European Union',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    marketMaturity: 'MATURE',
    regulatoryComplexity: 'VERY_HIGH',
    competitiveIntensity: 'HIGH'
  },
  AUSTRALIA: {
    name: 'Australia',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    marketMaturity: 'GROWING',
    regulatoryComplexity: 'MEDIUM',
    competitiveIntensity: 'MEDIUM'
  }
} as const

export const INSIGHT_PRIORITIES = {
  GROWTH_OPPORTUNITY: { baseScore: 85, multiplier: 1.2 },
  RISK_ALERT: { baseScore: 90, multiplier: 1.5 },
  MARKET_TREND: { baseScore: 70, multiplier: 1.0 },
  PERFORMANCE_GAP: { baseScore: 80, multiplier: 1.1 },
  SEASONAL_PATTERN: { baseScore: 60, multiplier: 0.9 }
} as const

export const RECOMMENDATION_ROI_THRESHOLDS = {
  LOW: 1.5,    // 150% ROI minimum for low priority
  MEDIUM: 2.0,  // 200% ROI minimum for medium priority
  HIGH: 3.0,    // 300% ROI minimum for high priority
  URGENT: 1.0   // 100% ROI minimum for urgent (risk mitigation)
} as const