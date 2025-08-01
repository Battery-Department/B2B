// RHY Enterprise Warehouse Metrics Type Definitions
// Comprehensive TypeScript interfaces for FlexVolt warehouse operations

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  region: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    timezone: string;
  };
  compliance: {
    standards: string[];
    certifications: string[];
    lastAudit: Date;
    nextAudit: Date;
  };
  capacity: {
    maxUnits: number;
    currentUnits: number;
    utilizationRate: number;
  };
  contact: {
    manager: string;
    email: string;
    phone: string;
  };
}

export interface FlexVoltBattery {
  id: string;
  model: '6Ah' | '9Ah' | '15Ah';
  voltage: '20V' | '60V';
  capacity: number;
  price: number;
  specifications: {
    runtime: number;
    chargeTime: number;
    cycleLife: number;
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  compatibility: string[];
  warranty: {
    years: number;
    terms: string;
  };
}

export interface WarehouseMetrics {
  warehouseId: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
    type: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  };
  inventory: {
    totalUnits: number;
    unitsByModel: {
      '6Ah': number;
      '9Ah': number;
      '15Ah': number;
    };
    turnoverRate: number;
    stockouts: number;
    excessInventory: number;
  };
  sales: {
    totalRevenue: number;
    totalUnits: number;
    averageOrderValue: number;
    conversionRate: number;
    ordersByModel: {
      '6Ah': number;
      '9Ah': number;
      '15Ah': number;
    };
  };
  operations: {
    fulfillmentTime: number;
    shippingAccuracy: number;
    returnRate: number;
    customerSatisfaction: number;
    staffEfficiency: number;
    operationalCosts: number;
  };
  compliance: {
    safetyIncidents: number;
    auditScore: number;
    certificationStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
    lastInspection: Date;
  };
}

export interface AggregatedMetrics {
  period: {
    start: Date;
    end: Date;
    type: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  };
  warehouseCount: number;
  globalSummary: {
    totalRevenue: number;
    totalUnits: number;
    averageOrderValue: number;
    globalTurnoverRate: number;
    globalCustomerSatisfaction: number;
  };
  warehouseMetrics: WarehouseMetrics[];
  comparativeAnalysis: {
    bestPerforming: {
      warehouseId: string;
      metric: string;
      value: number;
    };
    worstPerforming: {
      warehouseId: string;
      metric: string;
      value: number;
    };
    averagePerformance: {
      [key: string]: number;
    };
  };
  alerts: MetricsAlert[];
  predictions: {
    nextPeriodRevenue: number;
    demandForecast: {
      '6Ah': number;
      '9Ah': number;
      '15Ah': number;
    };
    riskFactors: string[];
  };
}

export interface MetricsAlert {
  id: string;
  warehouseId: string;
  type: 'INVENTORY' | 'SALES' | 'COMPLIANCE' | 'OPERATIONAL' | 'QUALITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  assignedTo?: string;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'EMAIL' | 'SMS' | 'SLACK' | 'WEBHOOK' | 'DASHBOARD';
  recipient: string;
  message: string;
  executedAt?: Date;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface MetricsQuery {
  warehouses?: string[];
  period: {
    start: Date;
    end: Date;
  };
  metrics?: string[];
  aggregation?: 'SUM' | 'AVERAGE' | 'MIN' | 'MAX' | 'COUNT';
  groupBy?: 'WAREHOUSE' | 'REGION' | 'DATE' | 'PRODUCT';
  filters?: QueryFilter[];
  sorting?: {
    field: string;
    order: 'ASC' | 'DESC';
  };
  limit?: number;
  offset?: number;
}

export interface QueryFilter {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'BETWEEN';
  value: any;
}

export interface AnalyticsResult {
  query: MetricsQuery;
  results: any[];
  totalRecords: number;
  executionTime: number;
  cacheable: boolean;
  insights: {
    trends: TrendInsight[];
    anomalies: AnomalyInsight[];
    recommendations: RecommendationInsight[];
  };
}

export interface TrendInsight {
  metric: string;
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  magnitude: number;
  confidence: number;
  period: string;
  description: string;
}

export interface AnomalyInsight {
  metric: string;
  type: 'SPIKE' | 'DROP' | 'OUTLIER' | 'PATTERN_BREAK';
  severity: number;
  timestamp: Date;
  description: string;
  possibleCauses: string[];
}

export interface RecommendationInsight {
  category: 'INVENTORY' | 'OPERATIONS' | 'SALES' | 'COMPLIANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  expectedImpact: {
    metric: string;
    improvement: number;
    confidence: number;
  };
  actionItems: string[];
}

export interface PerformanceMetrics {
  apiResponseTime: number;
  dataProcessingTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    database: number;
  };
}

export interface RegionalCompliance {
  region: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA';
  standards: {
    [key: string]: {
      name: string;
      version: string;
      status: 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT';
      lastCheck: Date;
      nextCheck: Date;
    };
  };
  requirements: {
    dataRetention: number;
    reportingFrequency: string;
    auditRequirements: string[];
    privacyRules: string[];
  };
}

export interface FlexVoltAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  batteryPerformance: {
    model: '6Ah' | '9Ah' | '15Ah';
    metrics: {
      unitsSold: number;
      revenue: number;
      averageRuntime: number;
      customerRating: number;
      returnRate: number;
      profitMargin: number;
    };
    trends: {
      salesGrowth: number;
      marketShare: number;
      competitivePosition: number;
    };
  }[];
  runtimeAnalysis: {
    averageRuntime: number;
    runtimeDistribution: {
      range: string;
      percentage: number;
    }[];
    factorsAffectingRuntime: {
      factor: string;
      impact: number;
    }[];
  };
  compatibilityMetrics: {
    toolCompatibility: {
      category: string;
      compatibleModels: number;
      utilizationRate: number;
    }[];
    crossCompatibilityIndex: number;
  };
  marketInsights: {
    totalMarketSize: number;
    marketGrowthRate: number;
    competitorAnalysis: {
      competitor: string;
      marketShare: number;
      priceComparison: number;
    }[];
    customerSegments: {
      segment: string;
      percentage: number;
      preferences: string[];
    }[];
  };
}

export interface ReportFormat {
  type: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'HTML' | 'CSV' | 'JSON';
  template?: string;
  options?: {
    includeCover?: boolean;
    includeCharts?: boolean;
    includeRawData?: boolean;
    colorTheme?: string;
    logoUrl?: string;
  };
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  title: string;
  format: ReportFormat;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
  generatedAt: Date;
  parameters: { [key: string]: any };
  fileUrl?: string;
  fileSize?: number;
  pageCount?: number;
  error?: string;
  deliveryStatus: {
    email?: 'PENDING' | 'SENT' | 'FAILED';
    portal?: 'AVAILABLE' | 'EXPIRED';
    api?: 'ACCESSIBLE' | 'CONSUMED';
  };
}

export interface MetricsError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  source: 'DATABASE' | 'API' | 'CALCULATION' | 'EXTERNAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  resolvedAt?: Date;
}

export interface CacheConfiguration {
  ttl: number;
  maxSize: number;
  strategy: 'LRU' | 'FIFO' | 'TTL';
  compression: boolean;
  encryptionEnabled: boolean;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  pool: {
    min: number;
    max: number;
    idle: number;
    acquire: number;
  };
  ssl: boolean;
  timeout: number;
}