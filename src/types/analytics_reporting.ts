/**
 * Analytics Reporting Types - RHY_061
 * Comprehensive type definitions for executive business intelligence
 */

export interface ExecutiveDashboard {
  id: string;
  generatedAt: Date;
  timeRange: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: ExecutiveSummary;
  insights: ExecutiveInsight[];
  predictions: PredictiveAnalytics;
  warehouseComparison: WarehouseComparison;
  alerts: Anomaly[];
  recommendations: RecommendationEngine[];
  kpiTrends: KPITrends;
  performanceIndicators: PerformanceIndicators;
  metadata: DashboardMetadata;
}

export interface ExecutiveSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  globalInventoryValue: number;
  inventoryTurnover: number;
  customerSatisfaction: number;
  operationalEfficiency: number;
  profitMargin: number;
  marketShare: number;
}

export interface ExecutiveInsight {
  id: string;
  category: 'performance' | 'inventory' | 'orders' | 'revenue' | 'efficiency' | 'customer';
  severity: 'info' | 'warning' | 'critical' | 'opportunity';
  title: string;
  description: string;
  metrics: MetricSummary[];
  recommendations: string[];
  impact: 'low' | 'medium' | 'high';
  priority: number;
  confidence: number;
  generatedAt: Date;
}

export interface MetricSummary {
  name: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export interface BusinessMetrics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  inventory: InventoryMetrics;
  customer: CustomerMetrics;
  operations: OperationalMetrics;
  financial: FinancialMetrics;
  market: MarketMetrics;
  lastUpdated: Date;
}

export interface RevenueMetrics {
  total: number;
  previousPeriod: number;
  growthRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  target: number;
  byRegion?: RegionalRevenue[];
  byProduct?: ProductRevenue[];
}

export interface RegionalRevenue {
  region: 'US' | 'EU' | 'JP' | 'AU';
  revenue: number;
  growth: number;
  contribution: number;
}

export interface ProductRevenue {
  productId: string;
  productName: string;
  revenue: number;
  units: number;
  averagePrice: number;
}

export interface OrderMetrics {
  total: number;
  previousPeriod: number;
  averageOrderValue: number;
  conversionRate: number;
  fulfillmentRate: number;
  customerRetention: number;
}

export interface InventoryMetrics {
  totalValue: number;
  turnoverRate: number;
  stockLevels: number;
  lowStockItems: number;
  outOfStockItems: number;
  excessValue?: number;
  byWarehouse?: WarehouseInventory[];
}

export interface WarehouseInventory {
  warehouseId: string;
  region: string;
  value: number;
  utilization: number;
  turnover: number;
}

export interface CustomerMetrics {
  activeCustomers: number;
  newCustomers: number;
  satisfactionScore: number;
  retentionRate: number;
  averageLifetimeValue: number;
  netPromoterScore?: number;
  churnRate?: number;
}

export interface OperationalMetrics {
  efficiencyScore: number;
  warehouseUtilization: number;
  averageFulfillmentTime: number;
  errorRate: number;
  costPerOrder: number;
  staffProductivity?: number;
}

export interface FinancialMetrics {
  profitMargin: number;
  cashFlow: number;
  operatingRatio: number;
  returnOnAssets?: number;
  debtToEquity?: number;
}

export interface MarketMetrics {
  sharePercentage: number;
  competitorAnalysis?: CompetitorMetric[];
  brandRecognition?: number;
}

export interface CompetitorMetric {
  competitor: string;
  marketShare: number;
  growth: number;
}

export interface PredictiveAnalytics {
  category: 'revenue' | 'inventory' | 'demand' | 'market';
  horizon: '7d' | '30d' | '90d' | '365d';
  predictions: Prediction[];
  accuracy: ModelAccuracy;
  factors: PredictiveFactor[];
  recommendations: string[];
  modelMetadata: ModelMetadata;
  generatedAt: Date;
}

export interface Prediction {
  date: Date;
  value: number;
  confidenceLow: number;
  confidenceHigh: number;
  probability: number;
}

export interface ModelAccuracy {
  modelAccuracy: number;
  confidenceScore: number;
  historicalPerformance: number;
  dataQualityScore: number;
}

export interface PredictiveFactor {
  name: string;
  impact: number;
  trend: 'positive' | 'negative' | 'neutral';
  confidence: number;
  description: string;
}

export interface ModelMetadata {
  algorithm: string;
  trainingDataPoints: number;
  lastTrained: Date;
  version: string;
}

export interface WarehouseComparison {
  warehouses: WarehousePerformance[];
  summary: WarehouseSummary;
  lastUpdated: Date;
}

export interface WarehousePerformance {
  warehouseId: string;
  region: string;
  name: string;
  performance: {
    efficiency: number;
    capacity: number;
    orders: number;
    inventory: number;
  };
  trends: {
    operationsTrend: string;
    inventoryTrend: string;
    performanceTrend: string;
    capacityTrend: string;
  };
  ranking: number;
}

export interface WarehouseSummary {
  totalWarehouses: number;
  averageEfficiency: number;
  bestPerformer: {
    warehouseId: string;
    region: string;
    name: string;
  };
  improvementOpportunities: number;
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  confidence: number;
  affectedMetrics?: string[];
  suggestedActions?: string[];
}

export interface RecommendationEngine {
  id: string;
  category: string;
  priority: number;
  title: string;
  description: string;
  expectedImpact: {
    revenue: number;
    efficiency: number;
    timeline: string;
  };
  resources: {
    estimatedCost: number;
    timeToImplement: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  confidence: number;
  generatedAt: Date;
}

export interface KPISummary {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
    target: number;
    targetProgress: number;
  };
  orders: {
    current: number;
    previous: number;
    growth: number;
    averageValue: number;
    conversionRate: number;
  };
  inventory: {
    totalValue: number;
    turnoverRate: number;
    stockLevels: number;
    lowStockAlerts: number;
    outOfStockItems: number;
  };
  customers: {
    totalActive: number;
    newCustomers: number;
    satisfactionScore: number;
    retentionRate: number;
    lifetimeValue: number;
  };
  operations: {
    efficiency: number;
    warehouseUtilization: number;
    fulfillmentTime: number;
    errorRate: number;
    costPerOrder: number;
  };
  lastUpdated: Date;
  refreshRate: number;
}

export interface KPITrends {
  revenue: {
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  orders: {
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  efficiency: {
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
}

export interface PerformanceIndicators {
  overall: 'excellent' | 'good' | 'average' | 'poor';
  score: number;
  areas: string[];
  improvements: string[];
}

export interface DashboardMetadata {
  generationTime: number;
  dataSourceCount: number;
  confidenceScore: number;
  lastDataUpdate: Date;
  userId?: string;
}

// Query and filter types
export interface AnalyticsQuery {
  timeRange: string;
  categories?: string[];
  regions?: string[];
  metrics?: string[];
  filters?: AnalyticsFilter[];
}

export interface AnalyticsFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
  value: any;
}

// Response types for API
export interface AnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    generationTime: number;
    cacheHit: boolean;
    dataFreshness: number;
  };
  timestamp: string;
}

// Real-time streaming types
export interface AnalyticsStream {
  id: string;
  type: 'kpi_update' | 'alert' | 'prediction' | 'anomaly';
  data: any;
  timestamp: Date;
}

// Export data types
export interface ExportRequest {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  data: string[];
  timeRange: string;
  includeCharts: boolean;
}

export interface ExportResponse {
  fileUrl: string;
  expiresAt: Date;
  format: string;
  size: number;
}