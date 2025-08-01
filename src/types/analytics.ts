// RHY Enterprise Analytics Type Definitions
// Advanced analytics types for FlexVolt warehouse operations

export interface AnalyticsQuery {
  id: string;
  name: string;
  description?: string;
  type: 'REALTIME' | 'BATCH' | 'STREAMING';
  dataSource: string;
  query: {
    select: string[];
    from: string;
    where?: QueryCondition[];
    groupBy?: string[];
    orderBy?: OrderByClause[];
    limit?: number;
    offset?: number;
  };
  parameters: QueryParameter[];
  scheduling?: {
    enabled: boolean;
    frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    startTime: string;
    timezone: string;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    invalidationRules: string[];
  };
}

export interface QueryCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN' | 'NOT_IN' | 'LIKE' | 'IS_NULL' | 'IS_NOT_NULL';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface OrderByClause {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryParameter {
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'ARRAY';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
}

export interface AnalyticsResult {
  queryId: string;
  executionId: string;
  data: any[];
  metadata: {
    totalRows: number;
    executionTime: number;
    dataSource: string;
    cacheHit: boolean;
    generatedAt: Date;
  };
  statistics: {
    min: { [key: string]: number };
    max: { [key: string]: number };
    avg: { [key: string]: number };
    sum: { [key: string]: number };
    count: { [key: string]: number };
  };
  insights: AnalyticsInsight[];
}

export interface AnalyticsInsight {
  type: 'TREND' | 'ANOMALY' | 'CORRELATION' | 'FORECAST' | 'THRESHOLD';
  title: string;
  description: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation?: string;
  data: {
    [key: string]: any;
  };
}

export interface MLModel {
  id: string;
  name: string;
  type: 'REGRESSION' | 'CLASSIFICATION' | 'CLUSTERING' | 'FORECASTING' | 'ANOMALY_DETECTION';
  algorithm: string;
  version: string;
  status: 'TRAINING' | 'TRAINED' | 'DEPLOYED' | 'DEPRECATED';
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rmse?: number;
    mae?: number;
  };
  features: ModelFeature[];
  hyperparameters: { [key: string]: any };
  trainingData: {
    source: string;
    size: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  lastTrained: Date;
  nextTraining?: Date;
}

export interface ModelFeature {
  name: string;
  type: 'NUMERICAL' | 'CATEGORICAL' | 'BOOLEAN' | 'TEXT' | 'DATE';
  importance: number;
  transformation?: 'STANDARDIZE' | 'NORMALIZE' | 'ONE_HOT' | 'LABEL_ENCODE' | 'LOG_TRANSFORM';
  nullable: boolean;
}

export interface PredictionRequest {
  modelId: string;
  features: { [key: string]: any };
  options?: {
    includeConfidence: boolean;
    includeExplanation: boolean;
    includeProbabilities: boolean;
  };
}

export interface PredictionResult {
  modelId: string;
  prediction: any;
  confidence: number;
  probabilities?: { [key: string]: number };
  explanation?: {
    topFeatures: {
      feature: string;
      importance: number;
      value: any;
    }[];
    reasoning: string;
  };
  metadata: {
    predictionTime: number;
    modelVersion: string;
    generatedAt: Date;
  };
}

export interface StatisticalAnalysis {
  dataset: string;
  variable: string;
  descriptiveStats: {
    count: number;
    mean: number;
    median: number;
    mode: number[];
    standardDeviation: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    min: number;
    max: number;
    range: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  distribution: {
    type: 'NORMAL' | 'UNIFORM' | 'EXPONENTIAL' | 'POISSON' | 'BINOMIAL' | 'UNKNOWN';
    parameters: { [key: string]: number };
    goodnessOfFit: number;
  };
  outliers: {
    method: 'IQR' | 'Z_SCORE' | 'MODIFIED_Z_SCORE' | 'ISOLATION_FOREST';
    count: number;
    indices: number[];
    values: number[];
  };
  confidenceIntervals: {
    level: number;
    lower: number;
    upper: number;
  }[];
}

export interface CorrelationAnalysis {
  variables: string[];
  method: 'PEARSON' | 'SPEARMAN' | 'KENDALL';
  matrix: number[][];
  significantCorrelations: {
    variable1: string;
    variable2: string;
    correlation: number;
    pValue: number;
    significant: boolean;
  }[];
  interpretation: string;
}

export interface TimeSeriesAnalysis {
  series: string;
  data: {
    timestamp: Date;
    value: number;
  }[];
  components: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
  seasonality: {
    detected: boolean;
    period: number;
    strength: number;
  };
  stationarity: {
    isStationary: boolean;
    testStatistic: number;
    pValue: number;
    criticalValues: { [key: string]: number };
  };
  forecast: {
    method: 'ARIMA' | 'EXPONENTIAL_SMOOTHING' | 'PROPHET' | 'LSTM';
    predictions: {
      timestamp: Date;
      predicted: number;
      lowerBound: number;
      upperBound: number;
      confidence: number;
    }[];
    accuracy: {
      mae: number;
      mse: number;
      rmse: number;
      mape: number;
    };
  };
}

export interface ClusterAnalysis {
  dataset: string;
  algorithm: 'K_MEANS' | 'HIERARCHICAL' | 'DBSCAN' | 'GAUSSIAN_MIXTURE';
  parameters: { [key: string]: any };
  clusters: {
    id: number;
    centroid: number[];
    size: number;
    variance: number;
    characteristics: { [key: string]: any };
  }[];
  metrics: {
    silhouetteScore: number;
    inertia: number;
    calinskiHarabasz: number;
    daviesBouldin: number;
  };
  optimalClusters: {
    method: 'ELBOW' | 'SILHOUETTE' | 'GAP_STATISTIC';
    recommendedK: number;
    scores: { k: number; score: number }[];
  };
}

export interface AnomalyDetection {
  dataset: string;
  method: 'ISOLATION_FOREST' | 'ONE_CLASS_SVM' | 'LOCAL_OUTLIER_FACTOR' | 'AUTOENCODER';
  parameters: { [key: string]: any };
  anomalies: {
    index: number;
    score: number;
    features: { [key: string]: any };
    explanation: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  threshold: number;
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
  };
}

export interface DataQualityMetrics {
  dataset: string;
  assessmentDate: Date;
  completeness: {
    overall: number;
    byColumn: { [key: string]: number };
    missingValues: { [key: string]: number };
  };
  validity: {
    overall: number;
    byColumn: { [key: string]: number };
    invalidValues: { [key: string]: number };
  };
  consistency: {
    overall: number;
    duplicateRows: number;
    inconsistentFormats: { [key: string]: number };
  };
  accuracy: {
    overall: number;
    byColumn: { [key: string]: number };
  };
  timeliness: {
    overall: number;
    lastUpdated: Date;
    updateFrequency: string;
  };
  uniqueness: {
    overall: number;
    byColumn: { [key: string]: number };
  };
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  type: 'MISSING_VALUES' | 'INVALID_FORMAT' | 'DUPLICATES' | 'OUTLIERS' | 'INCONSISTENT_DATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  column: string;
  description: string;
  count: number;
  percentage: number;
  examples: any[];
  recommendedAction: string;
}

export interface PerformanceBenchmark {
  metric: string;
  currentValue: number;
  historicalValues: {
    period: string;
    value: number;
  }[];
  benchmark: {
    industry: number;
    competitor: number;
    internal: number;
  };
  percentile: number;
  trend: {
    direction: 'IMPROVING' | 'DECLINING' | 'STABLE';
    changeRate: number;
    confidence: number;
  };
  targets: {
    shortTerm: number;
    longTerm: number;
    stretch: number;
  };
}

export interface DataLineage {
  datasetId: string;
  name: string;
  sources: {
    id: string;
    name: string;
    type: 'DATABASE' | 'API' | 'FILE' | 'STREAM';
    lastUpdated: Date;
  }[];
  transformations: {
    id: string;
    name: string;
    type: 'FILTER' | 'AGGREGATE' | 'JOIN' | 'CALCULATE' | 'CLEAN';
    description: string;
    appliedAt: Date;
  }[];
  destinations: {
    id: string;
    name: string;
    type: 'WAREHOUSE' | 'DASHBOARD' | 'REPORT' | 'API';
    lastDelivered: Date;
  }[];
  impact: {
    downstreamSystems: number;
    criticalPath: boolean;
    businessProcesses: string[];
  };
}

export interface AnalyticsConfiguration {
  performanceTargets: {
    queryResponseTime: number;
    dataThroughput: number;
    concurrentUsers: number;
    uptimePercentage: number;
  };
  retentionPolicies: {
    rawData: number;
    aggregatedData: number;
    reportData: number;
    logData: number;
  };
  securitySettings: {
    encryptionEnabled: boolean;
    accessLogging: boolean;
    dataAnonymization: boolean;
    retentionCompliance: string[];
  };
  alerting: {
    performanceThresholds: { [key: string]: number };
    qualityThresholds: { [key: string]: number };
    notificationChannels: string[];
    escalationRules: string[];
  };
}

// RHY Revenue Analytics Type Definitions - Batch 2 Enhancement
export interface RevenueAnalyticsRequest {
  sessionToken: string
  timeRange: {
    start: Date
    end: Date
  }
  warehouseIds?: string[]
  granularity?: 'hour' | 'day' | 'week' | 'month'
  includeForecasting?: boolean
  includeBenchmarks?: boolean
}

export interface RevenueAnalyticsResponse {
  success: boolean
  error?: string
  data?: RevenueAnalyticsData
}

export interface RevenueAnalyticsData {
  revenueMetrics: RevenueMetrics
  productPerformance: ProductPerformance[]
  customerSegments: CustomerSegmentAnalysis[]
  regionalPerformance: RegionalPerformance[]
  salesForecasting: SalesForecasting
  volumeDiscountAnalysis: VolumeDiscountAnalysis[]
  revenueKPIs: RevenueKPIs
  generatedAt: Date
  timeRange: { start: Date; end: Date }
  warehouseIds: string[]
}

export interface RevenueMetrics {
  totalRevenue: number
  averageDailyRevenue: number
  growthRate: number
  revenueByProduct: FlexVoltProductRevenue[]
  trends: RevenueTrend[]
  periodStart: Date
  periodEnd: Date
  currency: string
  lastUpdated: Date
}

export interface FlexVoltProductRevenue {
  productId: string
  productName: string
  unitPrice: number
  quantitySold: number
  revenue: number
  warehouseId: string
  region: string
  currency: string
  conversionRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
  growthRate: number
}

export interface RevenueTrend {
  date: Date
  revenue: number
  trend: number
}

export interface ProductPerformance {
  productId: string
  productName: string
  totalViews: number
  totalSales: number
  revenue: number
  conversionRate: number
  returnRate: number
  margin: number
  inventory: number
  trends: {
    sales: number
    conversions: number
    revenue: number
  }
}

export interface CustomerSegmentAnalysis {
  segmentType: string
  segmentName: string
  customerCount: number
  totalRevenue: number
  averageOrderValue: number
  revenueShare: number
  growthRate: number
  discountUtilization: number
}

export interface RegionalPerformance {
  region: string
  regionName: string
  totalRevenue: number
  orderCount: number
  customerCount: number
  averageOrderValue: number
  currency: string
  growthRate: number
  marketShare: number
  performance: 'excellent' | 'good' | 'improving' | 'needs_attention'
}

export interface SalesForecasting {
  forecastPeriod: number
  predictions: ForecastPrediction[]
  methodology: string
  accuracy: number
  confidence: number
  assumptions: string[]
  generatedAt: Date
}

export interface ForecastPrediction {
  date: Date
  predictedRevenue: number
  confidence: number
  upperBound: number
  lowerBound: number
}

export interface VolumeDiscountAnalysis {
  tier: 'contractor' | 'professional' | 'commercial' | 'enterprise'
  threshold: number
  discountPercentage: number
  ordersCount: number
  revenueImpact: number
  customerCount: number
  averageOrderValue: number
}

export interface RevenueKPIs {
  totalRevenue: number
  revenueGrowth: number
  grossMargin: number
  netMargin: number
  averageOrderValue: number
  customerLifetimeValue: number
  customerAcquisitionCost: number
  churnRate: number
  repeatCustomerRate: number
}