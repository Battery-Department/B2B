// Core types for AI-powered testing system

export interface CodeChange {
  id: string
  filePath: string
  changeType: 'add' | 'modify' | 'delete'
  linesChanged: number
  filesChanged?: number
  description?: string
  author: string
  timestamp: number
  diffContent?: string
  commitHash?: string
  branchName?: string
}

export interface TestFailure {
  id: string
  testName: string
  testSuite: string
  status: 'passed' | 'failed' | 'skipped' | 'flaky'
  errorMessage: string
  stackTrace?: string
  duration: number
  timestamp: number
  environment?: string
  browser?: string
  device?: string
  retryCount?: number
  screenshot?: string
  video?: string
  metadata?: Record<string, any>
}

export interface ReleaseData {
  version: string
  buildNumber: number
  commitHash: string
  branchName: string
  releaseDate: number
  codeChanges: CodeChange[]
  testResults: TestResult[]
  performanceMetrics: PerformanceMetrics
  deploymentEnvironment: string
  rollbackPlan?: string
  approvals: Array<{
    approver: string
    timestamp: number
    type: 'technical' | 'business' | 'security'
  }>
}

export interface TestResult {
  testSuite: string
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  coverage?: number
  assertions: number
  retries: number
  environment: string
  timestamp: number
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number
    p95: number
    p99: number
  }
  throughput: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  networkLatency: number
  coreWebVitals: {
    fcp: number
    lcp: number
    fid: number
    cls: number
    ttfb: number
  }
}

export interface TestSuggestion {
  id?: string
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'accessibility'
  component: string
  description: string
  priority: number
  estimatedEffort: 'low' | 'medium' | 'high'
  testCases: string[]
  automationLevel?: 'manual' | 'semi-automated' | 'fully-automated'
  dependencies?: string[]
  tags?: string[]
  expectedOutcome?: string
  riskReduction?: number
}

export interface QualityGate {
  id: string
  name: string
  stage: 'pre-commit' | 'build' | 'test' | 'security' | 'performance' | 'deployment'
  criteria: QualityGateCriteria
  isBlocking: boolean
  timeout: number
  retryCount: number
}

export interface QualityGateCriteria {
  testCoverage?: {
    unit: number
    integration: number
    e2e: number
    overall: number
  }
  performanceThresholds?: {
    responseTime: number
    throughput: number
    errorRate: number
  }
  securityChecks?: {
    vulnerabilities: {
      critical: number
      high: number
      medium: number
    }
    compliance: string[]
  }
  codeQuality?: {
    complexity: number
    duplication: number
    maintainabilityIndex: number
  }
  customRules?: Array<{
    rule: string
    threshold: number
    operator: '>' | '<' | '=' | '>=' | '<='
  }>
}

export interface TestEnvironment {
  id: string
  name: string
  type: 'development' | 'staging' | 'production' | 'test'
  status: 'active' | 'inactive' | 'maintenance'
  configuration: {
    browser: string[]
    os: string[]
    devices: string[]
    networkConditions: string[]
  }
  resources: {
    cpu: number
    memory: number
    storage: number
  }
  endpoints: {
    api: string
    web: string
    admin?: string
  }
}

export interface TestExecution {
  id: string
  planId: string
  environmentId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  endTime?: number
  duration?: number
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  coverage: number
  artifacts: {
    reports: string[]
    screenshots: string[]
    videos: string[]
    logs: string[]
  }
  metrics: {
    performance: PerformanceMetrics
    resource: ResourceMetrics
  }
}

export interface ResourceMetrics {
  cpu: {
    average: number
    peak: number
  }
  memory: {
    average: number
    peak: number
  }
  network: {
    bandwidth: number
    latency: number
  }
  storage: {
    read: number
    write: number
  }
}

export interface TestPlan {
  id: string
  name: string
  description: string
  version: string
  testSuites: string[]
  environments: string[]
  schedule?: {
    type: 'manual' | 'scheduled' | 'triggered'
    cron?: string
    triggers?: string[]
  }
  configuration: {
    parallel: boolean
    maxConcurrency: number
    timeout: number
    retryPolicy: {
      maxRetries: number
      retryDelay: number
    }
  }
  notifications: {
    onSuccess: string[]
    onFailure: string[]
    onComplete: string[]
  }
}

export interface DefectPrediction {
  probability: number
  confidence: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: number
  impact: number
  riskScore: number
  preventionStrategies: string[]
  monitoringRecommendations: string[]
}

export interface TestOptimization {
  testCase: string
  currentDuration: number
  optimizedDuration: number
  improvement: number
  strategy: string
  effort: 'low' | 'medium' | 'high'
  roi: number
  risks: string[]
}

export interface CoverageAnalysis {
  overall: number
  byType: {
    statement: number
    branch: number
    function: number
    line: number
  }
  byComponent: Array<{
    component: string
    coverage: number
    uncoveredLines: number[]
    criticalPaths: boolean
  }>
  trends: Array<{
    date: string
    coverage: number
  }>
  recommendations: Array<{
    component: string
    action: string
    priority: number
    effort: string
  }>
}

export interface SecurityTestResult {
  testType: 'sast' | 'dast' | 'iast' | 'dependency' | 'container' | 'infrastructure'
  status: 'passed' | 'failed' | 'warning'
  vulnerabilities: Array<{
    id: string
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    location: {
      file?: string
      line?: number
      endpoint?: string
    }
    remediation: string
    references: string[]
  }>
  compliance: Array<{
    standard: string
    status: 'compliant' | 'non-compliant' | 'partial'
    details: string
  }>
  timestamp: number
}

export interface AccessibilityTestResult {
  testType: 'axe' | 'lighthouse' | 'manual' | 'wcag'
  status: 'passed' | 'failed' | 'warning'
  violations: Array<{
    id: string
    impact: 'minor' | 'moderate' | 'serious' | 'critical'
    description: string
    help: string
    helpUrl: string
    nodes: Array<{
      selector: string
      element: string
      failureSummary: string
    }>
  }>
  score: number
  compliance: {
    wcag21: {
      level: 'A' | 'AA' | 'AAA'
      percentage: number
    }
  }
  timestamp: number
}

export interface PerformanceTestScenario {
  id: string
  name: string
  description: string
  type: 'load' | 'stress' | 'spike' | 'volume' | 'endurance'
  configuration: {
    users: number
    duration: number
    rampUp: number
    rampDown: number
    thinkTime: number
  }
  endpoints: Array<{
    url: string
    method: string
    weight: number
    parameters?: Record<string, any>
    headers?: Record<string, string>
  }>
  assertions: Array<{
    metric: string
    operator: string
    value: number
  }>
  environment: string
}

export interface TestDataManagement {
  datasets: Array<{
    id: string
    name: string
    type: 'synthetic' | 'production' | 'anonymized'
    size: number
    schema: Record<string, string>
    refreshPolicy: 'static' | 'daily' | 'weekly' | 'on-demand'
  }>
  generation: {
    rules: Array<{
      field: string
      type: 'random' | 'pattern' | 'lookup' | 'computed'
      configuration: Record<string, any>
    }>
    relationships: Array<{
      from: string
      to: string
      type: 'one-to-one' | 'one-to-many' | 'many-to-many'
    }>
  }
  privacy: {
    piiFields: string[]
    anonymizationRules: Array<{
      field: string
      method: 'mask' | 'hash' | 'encrypt' | 'tokenize' | 'remove'
    }>
  }
}

export interface TestReporting {
  summary: {
    totalTests: number
    passed: number
    failed: number
    skipped: number
    flaky: number
    duration: number
    coverage: number
  }
  trends: Array<{
    date: string
    metrics: {
      passRate: number
      duration: number
      coverage: number
      flakiness: number
    }
  }>
  failures: Array<{
    test: string
    frequency: number
    lastOccurrence: number
    pattern: string
    rootCause?: string
  }>
  performance: {
    slowestTests: Array<{
      test: string
      duration: number
      trend: 'improving' | 'stable' | 'degrading'
    }>
    resourceUsage: ResourceMetrics
  }
  recommendations: Array<{
    type: 'optimization' | 'maintenance' | 'infrastructure'
    description: string
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
  }>
}