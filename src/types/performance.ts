// RHY Enterprise Performance Monitoring Type Definitions
// Performance metrics and monitoring interfaces for warehouse operations

export interface PerformanceMetrics {
  timestamp: Date;
  service: string;
  environment: 'development' | 'staging' | 'production';
  region: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA';
  metrics: {
    responseTime: ResponseTimeMetrics;
    throughput: ThroughputMetrics;
    errorRate: ErrorRateMetrics;
    resource: ResourceMetrics;
    database: DatabaseMetrics;
    cache: CacheMetrics;
    external: ExternalServiceMetrics;
  };
}

export interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  distribution: {
    bucket: string;
    count: number;
  }[];
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  transactionsPerSecond: number;
  dataProcessedPerSecond: number;
  peakThroughput: number;
  averageThroughput: number;
}

export interface ErrorRateMetrics {
  total: number;
  percentage: number;
  errorsByType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  errorsByEndpoint: {
    endpoint: string;
    count: number;
    percentage: number;
  }[];
  criticalErrors: number;
}

export interface ResourceMetrics {
  cpu: {
    utilization: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    available: number;
    utilization: number;
    heapSize?: number;
    heapUsed?: number;
  };
  disk: {
    used: number;
    available: number;
    utilization: number;
    iops: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    bandwidth: number;
  };
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
    utilization: number;
  };
  queryPerformance: {
    averageTime: number;
    slowQueries: number;
    deadlocks: number;
    timeouts: number;
  };
  storage: {
    size: number;
    growth: number;
    indexSize: number;
    fragmentationLevel: number;
  };
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  size: number;
  utilization: number;
  averageRetrievalTime: number;
}

export interface ExternalServiceMetrics {
  service: string;
  availability: number;
  responseTime: number;
  errorRate: number;
  timeouts: number;
  circuitBreakerStatus: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface PerformanceAlert {
  id: string;
  type: 'THRESHOLD' | 'ANOMALY' | 'TREND' | 'SLA_BREACH';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  metric: string;
  currentValue: number;
  threshold: number;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'EMAIL' | 'SMS' | 'SLACK' | 'WEBHOOK' | 'PAGERDUTY';
  target: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
  error?: string;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
  duration: number; // seconds
  enabled: boolean;
}

export interface SLATarget {
  name: string;
  description: string;
  target: number;
  metric: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  status: 'MET' | 'AT_RISK' | 'BREACHED';
  currentValue: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
}

export interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    availability: number;
    slaCompliance: number;
  };
  trends: {
    metric: string;
    direction: 'IMPROVING' | 'DEGRADING' | 'STABLE';
    changePercentage: number;
  }[];
  incidents: {
    count: number;
    totalDowntime: number;
    majorIncidents: number;
    resolution: {
      average: number;
      p95: number;
    };
  };
  topIssues: {
    category: string;
    description: string;
    frequency: number;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  recommendations: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    category: 'PERFORMANCE' | 'SCALABILITY' | 'RELIABILITY';
    description: string;
    estimatedImpact: string;
  }[];
}

export interface LoadTestResult {
  testId: string;
  name: string;
  duration: number;
  virtualUsers: number;
  rampUpTime: number;
  results: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  breakdown: {
    responseTime: ResponseTimeMetrics;
    throughput: ThroughputMetrics;
    errors: ErrorRateMetrics;
  };
  bottlenecks: {
    component: string;
    metric: string;
    value: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}

export interface CapacityPlan {
  service: string;
  currentCapacity: {
    maxThroughput: number;
    averageUtilization: number;
    peakUtilization: number;
  };
  projectedDemand: {
    period: string;
    expectedGrowth: number;
    confidenceLevel: number;
  }[];
  recommendations: {
    action: 'SCALE_UP' | 'SCALE_OUT' | 'OPTIMIZE' | 'MONITOR';
    timeline: string;
    cost: number;
    impact: string;
  }[];
  constraints: {
    budget: number;
    technical: string[];
    business: string[];
  };
}

export interface PerformanceBaseline {
  service: string;
  baselineDate: Date;
  metrics: {
    [key: string]: {
      baseline: number;
      tolerance: number;
      unit: string;
    };
  };
  conditions: {
    load: string;
    environment: string;
    configuration: string;
  };
  validUntil: Date;
}

export interface AnomalyDetectionConfig {
  metric: string;
  algorithm: 'STATISTICAL' | 'MACHINE_LEARNING' | 'THRESHOLD';
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  trainingPeriod: number;
  detectionWindow: number;
  enabled: boolean;
}

export interface PerformanceAnomalry {
  id: string;
  metric: string;
  detectedAt: Date;
  type: 'SPIKE' | 'DROP' | 'TREND_CHANGE' | 'OUTLIER';
  severity: number;
  description: string;
  expectedValue: number;
  actualValue: number;
  confidence: number;
  possibleCauses: string[];
  impactAssessment: {
    userImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    businessImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    technicalImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface PerformanceOptimization {
  id: string;
  category: 'DATABASE' | 'CACHE' | 'ALGORITHM' | 'INFRASTRUCTURE' | 'NETWORK';
  description: string;
  currentMetric: {
    value: number;
    unit: string;
  };
  targetMetric: {
    value: number;
    unit: string;
  };
  implementation: {
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: string;
    resources: string[];
  };
  expectedBenefits: {
    performance: string;
    cost: string;
    maintenance: string;
  };
}

export interface PerformanceTest {
  id: string;
  name: string;
  type: 'LOAD' | 'STRESS' | 'SPIKE' | 'VOLUME' | 'ENDURANCE';
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  configuration: {
    virtualUsers: number;
    duration: number;
    rampUpTime: number;
    testData: string;
    scenarios: TestScenario[];
  };
  results?: LoadTestResult;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TestScenario {
  name: string;
  weight: number;
  steps: TestStep[];
}

export interface TestStep {
  name: string;
  action: 'REQUEST' | 'WAIT' | 'VALIDATE';
  parameters: { [key: string]: any };
  expectedResponse?: {
    statusCode: number;
    responseTime: number;
    bodyContains?: string;
  };
}

export interface PerformanceMonitoringConfig {
  metricsCollection: {
    interval: number;
    retention: {
      raw: number;
      aggregated: number;
    };
    metrics: string[];
  };
  alerting: {
    enabled: boolean;
    channels: string[];
    escalation: {
      levels: number;
      timeout: number;
    };
  };
  thresholds: PerformanceThreshold[];
  slaTargets: SLATarget[];
  anomalyDetection: AnomalyDetectionConfig[];
}