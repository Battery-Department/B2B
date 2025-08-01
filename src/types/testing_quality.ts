/**
 * RHY Supplier Portal - Testing Quality Type Definitions
 * Comprehensive type definitions for testing quality and assurance systems
 */

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
export type TestCategory = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'accessibility'
export type TestPriority = 'critical' | 'high' | 'medium' | 'low'
export type ComplianceLevel = 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement'
export type WCAGLevel = 'WCAG 2.1 AAA' | 'WCAG 2.1 AA' | 'WCAG 2.1 A'

export interface TestConfiguration {
  maxRetries: number
  timeoutMs: number
  parallelSuites: number
  coverageThreshold: number
  performanceThreshold: number
  securityThreshold: number
}

export interface TestEnvironment {
  database: string
  warehouse: string
  userContext?: any
  mockServices?: boolean
  debugMode?: boolean
}

export interface TestSuiteConfiguration {
  id: string
  name: string
  description: string
  category: TestCategory
  priority: TestPriority
  dependencies: string[]
  timeout: number
  retries: number
  parallel: boolean
  tags: string[]
  metadata: Record<string, any>
}

export interface TestExecution {
  suiteId: string
  executionId: string
  startTime: Date
  endTime?: Date
  status: TestStatus
  environment: TestEnvironment
  triggeredBy: string
  results?: TestSuite
}

export interface TestMetrics {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  executionTime: number
  coverage: number
  passRate: number
  reliability: number
}

export interface QualityMetrics {
  codeQuality: number
  testCoverage: number
  performance: number
  security: number
  accessibility: number
  reliability: number
  maintainability: number
  overallScore: number
}

export interface TestNotification {
  id: string
  type: 'success' | 'failure' | 'warning' | 'info'
  message: string
  suiteId: string
  testId?: string
  timestamp: Date
  recipients: string[]
  channels: ('email' | 'slack' | 'webhook')[]
}

export interface TestArtifact {
  id: string
  type: 'screenshot' | 'video' | 'log' | 'report' | 'coverage'
  path: string
  size: number
  mimeType: string
  testId: string
  createdAt: Date
}

export interface TestTrend {
  period: 'day' | 'week' | 'month' | 'quarter'
  passRate: number[]
  coverage: number[]
  performance: number[]
  reliability: number[]
  timestamps: Date[]
}

export interface PerformanceBenchmark {
  name: string
  metric: string
  target: number
  warning: number
  critical: number
  unit: string
  category: 'api' | 'database' | 'ui' | 'network'
}

export interface SecurityTestResult {
  vulnerability: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  remediation: string
  cve?: string
  cvss?: number
}

export interface AccessibilityTestResult {
  rule: string
  level: 'A' | 'AA' | 'AAA'
  element: string
  issue: string
  remediation: string
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
}

export interface TestReportOptions {
  format: 'json' | 'html' | 'pdf' | 'xml'
  includeArtifacts: boolean
  includeDetails: boolean
  includeTrends: boolean
  includeRecommendations: boolean
  filterByCategory?: TestCategory[]
  filterByPriority?: TestPriority[]
  filterByStatus?: TestStatus[]
}

export interface QualityGate {
  name: string
  enabled: boolean
  conditions: QualityCondition[]
  actions: QualityAction[]
}

export interface QualityCondition {
  metric: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  threshold: number
  required: boolean
}

export interface QualityAction {
  type: 'block_deployment' | 'send_notification' | 'create_issue' | 'run_tests'
  configuration: Record<string, any>
}

export interface TestSchedule {
  id: string
  name: string
  suiteIds: string[]
  cron: string
  timezone: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  notifications: TestNotification[]
}

export interface TestIntegration {
  name: string
  type: 'ci_cd' | 'monitoring' | 'reporting' | 'notification'
  configuration: Record<string, any>
  enabled: boolean
  lastSync?: Date
}

// API Response Types
export interface TestSuiteResponse {
  success: boolean
  data?: TestSuite
  error?: string
  metadata?: {
    executionTime: number
    resourceUsage: any
  }
}

export interface QualityReportResponse {
  success: boolean
  data?: QualityReport
  error?: string
  metadata?: {
    generationTime: number
    reportSize: number
  }
}

export interface TestExecutionResponse {
  success: boolean
  data?: {
    executionId: string
    status: TestStatus
    estimatedDuration: number
  }
  error?: string
}

// Database Schema Types
export interface TestResultsTable {
  id: string
  suiteId: string
  executionId: string
  results: string // JSON
  artifacts: string // JSON
  createdAt: Date
  updatedAt: Date
}

export interface QualityReportsTable {
  id: string
  reportId: string
  report: string // JSON
  trends: string // JSON
  createdAt: Date
}

export interface TestSchedulesTable {
  id: string
  name: string
  configuration: string // JSON
  lastRun?: Date
  nextRun?: Date
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// Utility Types
export type TestCallback = (result: TestResult) => void | Promise<void>
export type TestHook = 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll'
export type TestFilter = (test: TestResult) => boolean

export interface TestContext {
  suite: TestSuite
  environment: TestEnvironment
  configuration: TestConfiguration
  hooks: Record<TestHook, Function[]>
  artifacts: TestArtifact[]
}

// Re-export base interfaces from service
export {
  TestSuite,
  TestResult,
  PerformanceMetrics,
  CoverageMetrics,
  QualityReport
} from '@/services/testing_quality/EnhancedTestingQualityService'