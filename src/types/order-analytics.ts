/**
 * Order Analytics Types - RHY_055
 * Comprehensive type definitions for FlexVolt order analytics system
 * Supports enterprise-grade analytics across global warehouse operations
 */

import { z } from 'zod';

// ================================
// CORE ANALYTICS INTERFACES
// ================================

export interface AnalyticsQuery {
  dateRange: {
    start: Date;
    end: Date;
  };
  warehouseFilter?: string[];
  userId?: string;
  customerSegment?: 'ALL' | 'DIRECT' | 'DISTRIBUTOR' | 'RETAILER' | 'FLEET';
  productFilter?: string[];
  aggregationLevel?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface OrderAnalyticsData {
  summaryMetrics: {
    current: PeriodMetrics;
    previous: PeriodMetrics;
  };
  timeSeries: PerformanceTrend[];
  productPerformance: ProductMixAnalysis[];
  warehousePerformance: WarehousePerformance[];
  customerSegments: CustomerSegmentData[];
  metadata: AnalyticsMetadata;
}

export interface SalesMetricsData {
  performanceTrend: PerformanceTrend[];
  productMix: ProductMixAnalysis[];
  volumeDiscounts: VolumeDiscountAnalysis[];
  regionalPerformance: RegionalPerformance[];
  customerAnalysis: CustomerSegmentData[];
  insights: BusinessInsight[];
  metadata: {
    generatedAt: Date;
    processingTime: number;
    dataAccuracy: number;
    lastSyncTime: Date;
  };
}

// ================================
// PERFORMANCE METRICS
// ================================

export interface PeriodMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  conversionRate?: number;
  returnRate?: number;
}

export interface PerformanceTrend {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  customers: number;
  conversionRate?: number;
}

export interface KPIMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  target?: number;
  unit: 'CURRENCY' | 'COUNT' | 'PERCENTAGE';
  severity: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
}

// ================================
// PRODUCT ANALYTICS
// ================================

export interface ProductMixAnalysis {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  units: number;
  revenue: number;
  orders: number;
  marketShare?: number;
  growthRate?: number;
  profitMargin?: number;
}

export interface FlexVoltProductData {
  sku: string;
  name: string;
  capacity: '6AH' | '9AH' | '15AH';
  msrp: number;
  tier: 'Professional' | 'Extended Runtime' | 'Maximum Power';
  compatibility: '20V/60V MAX';
  targetMarket: string[];
  units: number;
  revenue: number;
  averageSellingPrice: number;
  discountRate: number;
  performanceScore: number;
}

export interface ProductPerformanceMetrics {
  topSellingProducts: ProductMixAnalysis[];
  fastestGrowing: ProductMixAnalysis[];
  mostProfitable: ProductMixAnalysis[];
  underperforming: ProductMixAnalysis[];
  seasonalTrends: {
    product: string;
    quarters: { q1: number; q2: number; q3: number; q4: number; };
  }[];
}

// ================================
// VOLUME DISCOUNT ANALYTICS
// ================================

export interface VolumeDiscountAnalysis {
  discountTier: string;
  discountPercentage: number;
  threshold: number;
  orders: number;
  revenue: number;
  customers: number;
  avgDiscount: number;
  penetrationRate?: number;
  customerRetention?: number;
}

export interface DiscountTierPerformance {
  tier: 'Contractor' | 'Professional' | 'Commercial' | 'Enterprise';
  threshold: number;
  discountRate: number;
  eligibleCustomers: string[];
  activations: number;
  revenue: number;
  profitImpact: number;
  customerUpgrade: {
    from: string;
    to: string;
    count: number;
  }[];
}

export interface PricingAnalytics {
  volumeDiscountTiers: VolumeDiscountAnalysis[];
  priceElasticity: {
    product: string;
    elasticity: number;
    optimalPrice: number;
  }[];
  competitivePosition: {
    product: string;
    ourPrice: number;
    marketAverage: number;
    position: 'PREMIUM' | 'COMPETITIVE' | 'VALUE';
  }[];
}

// ================================
// REGIONAL & WAREHOUSE ANALYTICS
// ================================

export interface RegionalPerformance {
  region: string;
  regionName: string;
  warehouseId: string;
  orders: number;
  revenue: number;
  averageOrderValue: number;
  customers: number;
  marketPenetration?: number;
  growthRate?: number;
}

export interface WarehousePerformance {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  region: 'US' | 'EU' | 'JP' | 'AU';
  orders: number;
  revenue: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  averageProcessingTime: number;
  capacity: {
    current: number;
    maximum: number;
    utilization: number;
  };
  performance: {
    efficiency: number;
    accuracy: number;
    customerSatisfaction: number;
  };
}

export interface GlobalWarehouseMetrics {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  averageUtilization: number;
  crossRegionTransfers: number;
  syncLatency: number;
  performanceByRegion: WarehousePerformance[];
  complianceStatus: {
    region: string;
    status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
    requirements: string[];
  }[];
}

// ================================
// CUSTOMER ANALYTICS
// ================================

export interface CustomerSegmentData {
  name: string;
  value: number;
  revenue: number;
  percentage: number;
  averageOrderValue?: number;
  customerLifetimeValue?: number;
  acquisitionCost?: number;
  retentionRate?: number;
}

export interface CustomerTypeAnalysis {
  segment: 'DIRECT' | 'DISTRIBUTOR' | 'RETAILER' | 'FLEET' | 'SERVICE';
  customerCount: number;
  revenue: number;
  averageOrderSize: number;
  orderFrequency: number;
  seasonality: number[];
  geographicDistribution: {
    region: string;
    customers: number;
    revenue: number;
  }[];
  productPreferences: {
    product: string;
    preference: number;
  }[];
}

export interface CustomerJourneyAnalytics {
  acquisitionChannels: {
    channel: string;
    customers: number;
    cost: number;
    conversionRate: number;
  }[];
  retentionMetrics: {
    period: string;
    retentionRate: number;
    churnRate: number;
    reactivationRate: number;
  }[];
  lifetimeValue: {
    segment: string;
    averageLTV: number;
    medianLTV: number;
    topPercentileLTV: number;
  }[];
}

// ================================
// BUSINESS INTELLIGENCE
// ================================

export interface BusinessInsight {
  type: 'PRODUCT_PERFORMANCE' | 'DISCOUNT_PERFORMANCE' | 'REGIONAL_PERFORMANCE' | 
        'CUSTOMER_BEHAVIOR' | 'INVENTORY_OPTIMIZATION' | 'PRICING_OPPORTUNITY';
  title: string;
  description: string;
  severity: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  actionable: boolean;
  recommendation?: string;
  impact?: {
    revenue: number;
    efficiency: number;
    customerSatisfaction: number;
  };
  confidence: number;
  dataPoints: number;
}

export interface PredictiveAnalytics {
  salesForecast: {
    period: string;
    predictedRevenue: number;
    confidence: number;
    factors: string[];
  }[];
  customerChurnPrediction: {
    customerId: string;
    churnProbability: number;
    factors: string[];
    retentionActions: string[];
  }[];
  inventoryOptimization: {
    product: string;
    currentStock: number;
    recommendedStock: number;
    reasoning: string;
  }[];
  priceOptimization: {
    product: string;
    currentPrice: number;
    recommendedPrice: number;
    expectedImpact: number;
  }[];
}

export interface MarketAnalytics {
  marketSize: {
    total: number;
    addressable: number;
    penetration: number;
  };
  competitorAnalysis: {
    competitor: string;
    marketShare: number;
    pricePosition: 'HIGHER' | 'SIMILAR' | 'LOWER';
    strengthsWeaknesses: string[];
  }[];
  trendAnalysis: {
    trend: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    timeframe: string;
    confidence: number;
  }[];
}

// ================================
// REAL-TIME ANALYTICS
// ================================

export interface RealtimeMetrics {
  timestamp: Date;
  activeOrders: number;
  recentRevenue: number;
  currentUsers: number;
  systemHealth: {
    apiResponseTime: number;
    databaseLatency: number;
    errorRate: number;
    uptime: number;
  };
  warehouseStatus: {
    warehouseId: string;
    status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
    orderQueue: number;
    processingRate: number;
  }[];
  alerts: {
    type: 'PERFORMANCE' | 'INVENTORY' | 'SYSTEM' | 'BUSINESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: Date;
  }[];
}

export interface LiveDashboardData {
  metrics: RealtimeMetrics;
  kpis: KPIMetric[];
  charts: {
    type: 'LINE' | 'BAR' | 'PIE' | 'AREA';
    title: string;
    data: any[];
    config: any;
  }[];
  notifications: {
    id: string;
    type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
    message: string;
    timestamp: Date;
    read: boolean;
  }[];
}

// ================================
// REPORT ANALYTICS
// ================================

export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'EXECUTIVE_SUMMARY' | 'OPERATIONAL_REPORT' | 'FINANCIAL_ANALYSIS' | 
        'CUSTOMER_INSIGHTS' | 'PRODUCT_PERFORMANCE' | 'WAREHOUSE_EFFICIENCY';
  dateRange: {
    start: Date;
    end: Date;
  };
  sections: ReportSection[];
  summary: {
    keyFindings: string[];
    recommendations: string[];
    nextActions: string[];
  };
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
    dataAccuracy: number;
  };
}

export interface ReportSection {
  title: string;
  type: 'METRICS' | 'CHART' | 'TABLE' | 'TEXT' | 'INSIGHTS';
  content: any;
  insights?: BusinessInsight[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  schedule: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    time: string;
    timezone: string;
  };
  recipients: string[];
  filters: AnalyticsQuery;
  active: boolean;
  lastGenerated?: Date;
  nextScheduled: Date;
}

// ================================
// METADATA & SYSTEM
// ================================

export interface AnalyticsMetadata {
  generatedAt: Date;
  dataPoints: number;
  warehouses: number;
  processingTime: number;
  userId?: string;
  cacheStatus?: 'HIT' | 'MISS' | 'PARTIAL';
  dataFreshness?: number; // seconds since last update
}

export interface DataQuality {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  issues: {
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    affectedRecords: number;
  }[];
}

export interface AnalyticsConfiguration {
  refreshInterval: number;
  cacheTimeout: number;
  defaultDateRange: number; // days
  performanceThresholds: {
    apiResponseTime: number;
    queryTimeout: number;
    maxDataPoints: number;
  };
  features: {
    realTimeUpdates: boolean;
    predictiveAnalytics: boolean;
    exportFormats: string[];
    scheduledReports: boolean;
  };
}

// ================================
// VALIDATION SCHEMAS
// ================================

export const AnalyticsQuerySchema = z.object({
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }),
  warehouseFilter: z.array(z.string()).optional(),
  userId: z.string().optional(),
  customerSegment: z.enum(['ALL', 'DIRECT', 'DISTRIBUTOR', 'RETAILER', 'FLEET']).optional(),
  productFilter: z.array(z.string()).optional(),
  aggregationLevel: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional()
});

export const ReportConfigSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['EXECUTIVE_SUMMARY', 'OPERATIONAL_REPORT', 'FINANCIAL_ANALYSIS', 
                'CUSTOMER_INSIGHTS', 'PRODUCT_PERFORMANCE', 'WAREHOUSE_EFFICIENCY']),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }),
  filters: AnalyticsQuerySchema.optional(),
  sections: z.array(z.string()),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).optional()
});

// ================================
// UTILITY TYPES
// ================================

export type AnalyticsMetricType = 'CURRENCY' | 'COUNT' | 'PERCENTAGE' | 'RATE' | 'TIME';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';
export type PerformanceRating = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL';
export type DataAggregation = 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX' | 'MEDIAN';

export interface ChartDataPoint {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface AnalyticsApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
    dataFreshness: number;
  };
}