/**
 * System Integration Types - RHY_071
 * Enterprise-grade type definitions for API Gateway and Integration Hub
 * Supports ERP, 3PL, payment processors, and external system integrations
 */

import { z } from 'zod'

// Core Integration Types
export type IntegrationType = 'ERP' | '3PL' | 'PAYMENT' | 'INVENTORY' | 'WAREHOUSE' | 'ANALYTICS' | 'CRM' | 'SHIPPING'
export type AuthMethod = 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'HMAC' | 'JWT'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
export type TransformationType = 'DIRECT' | 'LOOKUP' | 'CALCULATE' | 'FORMAT' | 'AGGREGATE' | 'SPLIT' | 'MERGE'
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

// Legacy compatibility types for RHY_071 integration
export interface SystemIntegrationConfig {
  maxRetries: number
  timeoutMs: number
  healthCheckInterval: number
  syncInterval: number
  regions: string[]
  cacheEnabled: boolean
  monitoringEnabled: boolean
  version?: string
}

export class SystemIntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'SystemIntegrationError'
  }
}

// Integration Configuration
export interface IntegrationConfig {
  id: string
  name: string
  description?: string
  type: IntegrationType
  baseUrl: string
  authMethod: AuthMethod
  credentials: IntegrationCredentials
  timeout: number
  retryAttempts: number
  isActive: boolean
  priority: number
  rateLimit: RateLimitConfig
  healthCheck: HealthCheckConfig
  transformationRules?: TransformationRule[]
  webhookConfig?: WebhookSettings
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface IntegrationCredentials {
  apiKey?: string
  username?: string
  password?: string
  token?: string
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  privateKey?: string
  certificate?: string
  [key: string]: string | undefined
}

export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  burstAllowance: number
  concurrentRequests: number
  quotaResetPeriod: 'MINUTE' | 'HOUR' | 'DAY'
}

export interface HealthCheckConfig {
  enabled: boolean
  endpoint: string
  interval: number
  timeout: number
  retryAttempts: number
  expectedStatusCode: number
  expectedResponse?: any
  failureThreshold: number
}

export interface WebhookSettings {
  enabled: boolean
  endpoints: WebhookEndpoint[]
  security: WebhookSecurity
  retryPolicy: RetryPolicy
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  isActive: boolean
  headers?: Record<string, string>
}

export interface WebhookSecurity {
  secretKey: string
  signatureHeader: string
  signatureMethod: 'HMAC_SHA256' | 'HMAC_SHA512' | 'JWT'
  verifyTLS: boolean
}

export interface RetryPolicy {
  maxAttempts: number
  initialDelay: number
  backoffMultiplier: number
  maxDelay: number
  retryableStatusCodes: number[]
}

// Transformation Rules
export interface TransformationRule {
  id: string
  name: string
  sourceField: string
  targetField: string
  transformation: TransformationType
  parameters?: TransformationParameters
  condition?: TransformationCondition
  priority: number
  isActive: boolean
}

export interface TransformationParameters {
  format?: string
  mapping?: Record<string, any>
  calculation?: string
  defaultValue?: any
  validationRules?: ValidationRule[]
  [key: string]: any
}

export interface TransformationCondition {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'EXISTS' | 'NOT_EXISTS'
  value: any
}

export interface ValidationRule {
  type: 'REQUIRED' | 'TYPE' | 'RANGE' | 'PATTERN' | 'CUSTOM'
  parameters: Record<string, any>
  errorMessage: string
}

// Request/Response Types
export interface IntegrationRequest {
  id?: string
  integrationId: string
  operation: string
  method: HttpMethod
  endpoint: string
  data?: any
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  pathParams?: Record<string, string>
  supplierId: string
  warehouse?: string
  priority?: number
  timeout?: number
  retryAttempts?: number
  idempotencyKey?: string
  correlationId?: string
  metadata?: Record<string, any>
}

export interface IntegrationResponse {
  success: boolean
  requestId: string
  integrationId: string
  operation: string
  statusCode: number
  data?: any
  error?: IntegrationError
  warnings?: string[]
  metadata: ResponseMetadata
}

export interface IntegrationError {
  code: string
  message: string
  details?: any
  type: 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'NETWORK' | 'TIMEOUT' | 'RATE_LIMIT' | 'SERVER_ERROR' | 'UNKNOWN'
  retryable: boolean
  retryAfter?: number
}

export interface ResponseMetadata {
  duration: number
  retryCount: number
  timestamp: string
  supplier: string
  warehouse?: string
  circuitBreakerState: CircuitBreakerState
  cacheHit: boolean
  rateLimit?: {
    remaining: number
    resetTime: string
    limit: number
  }
}

// Circuit Breaker Types
export interface CircuitBreakerConfig {
  failureThreshold: number
  successThreshold: number
  timeout: number
  resetTimeout: number
  monitoringPeriod: number
  halfOpenMaxCalls: number
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState
  failures: number
  successes: number
  totalRequests: number
  lastFailureTime?: string
  lastSuccessTime?: string
  nextAttemptTime?: string
}

// Webhook Types
export interface WebhookEvent {
  id: string
  type: string
  source: string
  data: any
  timestamp: string
  version: string
  correlationId?: string
  metadata?: Record<string, any>
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  eventId: string
  url: string
  attempt: number
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
  statusCode?: number
  response?: any
  error?: string
  deliveredAt?: string
  nextRetryAt?: string
  createdAt: string
}

export interface WebhookSubscription {
  id: string
  integrationId: string
  url: string
  events: string[]
  isActive: boolean
  secret: string
  lastDelivery?: string
  successCount: number
  failureCount: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Monitoring and Analytics Types
export interface IntegrationMetrics {
  integrationId: string
  period: {
    start: string
    end: string
  }
  requests: {
    total: number
    successful: number
    failed: number
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
  }
  errors: {
    total: number
    byType: Record<string, number>
    byStatusCode: Record<number, number>
  }
  availability: {
    uptime: number
    downtime: number
    uptimePercentage: number
  }
  performance: {
    throughput: number
    concurrency: number
    queueSize: number
  }
}

export interface IntegrationHealthStatus {
  integrationId: string
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'
  lastCheck: string
  responseTime?: number
  error?: string
  uptime: number
  checks: HealthCheck[]
}

export interface HealthCheck {
  type: 'CONNECTIVITY' | 'AUTHENTICATION' | 'FUNCTIONALITY' | 'PERFORMANCE'
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  timestamp: string
  duration?: number
  details?: any
}

// Queue and Processing Types
export interface ProcessingQueue {
  id: string
  name: string
  type: 'FIFO' | 'LIFO' | 'PRIORITY'
  maxSize: number
  currentSize: number
  processingCount: number
  deadLetterQueue?: string
  retryPolicy: RetryPolicy
  isActive: boolean
}

export interface QueuedRequest {
  id: string
  queueId: string
  request: IntegrationRequest
  priority: number
  attempts: number
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  error?: string
  queuedAt: string
  processedAt?: string
  completedAt?: string
}

// Data Synchronization Types
export interface SyncConfiguration {
  id: string
  name: string
  sourceIntegrationId: string
  targetIntegrationId: string
  syncType: 'FULL' | 'INCREMENTAL' | 'DELTA' | 'EVENT_DRIVEN'
  schedule: SyncSchedule
  mappings: FieldMapping[]
  filters?: SyncFilter[]
  isActive: boolean
  lastSync?: string
  nextSync?: string
}

export interface SyncSchedule {
  type: 'CRON' | 'INTERVAL' | 'EVENT' | 'MANUAL'
  expression?: string
  interval?: number
  timezone?: string
}

export interface FieldMapping {
  sourceField: string
  targetField: string
  transformation?: TransformationRule
  isRequired: boolean
  defaultValue?: any
}

export interface SyncFilter {
  field: string
  operator: string
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface SyncResult {
  id: string
  configurationId: string
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE'
  recordsProcessed: number
  recordsSuccessful: number
  recordsFailed: number
  duration: number
  errors?: SyncError[]
  startedAt: string
  completedAt: string
}

export interface SyncError {
  recordId?: string
  field?: string
  error: string
  type: 'VALIDATION' | 'TRANSFORMATION' | 'TARGET_ERROR'
}

// Authentication and Security Types
export interface SecurityContext {
  supplierId: string
  permissions: string[]
  warehouse?: string
  ipAddress: string
  userAgent: string
  sessionId?: string
  correlationId?: string
}

export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  userId: string
  ipAddress: string
  userAgent: string
  success: boolean
  error?: string
  details?: any
  timestamp: string
}

// Cache Types
export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'LRU' | 'FIFO' | 'TTL'
  keyPattern?: string
  excludeEndpoints?: string[]
}

export interface CacheEntry {
  key: string
  data: any
  createdAt: string
  expiresAt: string
  hits: number
  size: number
}

export interface CacheMetrics {
  hitRate: number
  missRate: number
  totalRequests: number
  totalHits: number
  totalMisses: number
  avgResponseTime: number
  memoryUsage: number
  evictions: number
}

// Validation Schemas
export const integrationConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['ERP', '3PL', 'PAYMENT', 'INVENTORY', 'WAREHOUSE', 'ANALYTICS', 'CRM', 'SHIPPING']),
  baseUrl: z.string().url(),
  authMethod: z.enum(['API_KEY', 'OAUTH2', 'BASIC', 'BEARER', 'HMAC', 'JWT']),
  credentials: z.record(z.string()),
  timeout: z.number().min(1000).max(300000),
  retryAttempts: z.number().min(0).max(10),
  isActive: z.boolean(),
  priority: z.number().min(1).max(10),
  rateLimit: z.object({
    requestsPerMinute: z.number().positive(),
    requestsPerHour: z.number().positive(),
    burstAllowance: z.number().min(0),
    concurrentRequests: z.number().positive(),
    quotaResetPeriod: z.enum(['MINUTE', 'HOUR', 'DAY'])
  }),
  healthCheck: z.object({
    enabled: z.boolean(),
    endpoint: z.string(),
    interval: z.number().positive(),
    timeout: z.number().positive(),
    retryAttempts: z.number().min(0),
    expectedStatusCode: z.number(),
    failureThreshold: z.number().positive()
  })
})

export const integrationRequestSchema = z.object({
  integrationId: z.string().uuid(),
  operation: z.string().min(1).max(100),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  endpoint: z.string().min(1).max(500),
  data: z.any().optional(),
  headers: z.record(z.string()).optional(),
  queryParams: z.record(z.string()).optional(),
  pathParams: z.record(z.string()).optional(),
  supplierId: z.string().uuid(),
  warehouse: z.string().optional(),
  priority: z.number().min(1).max(10).optional(),
  timeout: z.number().min(1000).max(300000).optional(),
  retryAttempts: z.number().min(0).max(10).optional(),
  idempotencyKey: z.string().optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const webhookSubscriptionSchema = z.object({
  integrationId: z.string().uuid(),
  url: z.string().url(),
  events: z.array(z.string()),
  isActive: z.boolean().default(true),
  secret: z.string().min(32).max(256),
  metadata: z.record(z.any()).optional()
})

export const transformationRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  transformation: z.enum(['DIRECT', 'LOOKUP', 'CALCULATE', 'FORMAT', 'AGGREGATE', 'SPLIT', 'MERGE']),
  parameters: z.record(z.any()).optional(),
  condition: z.object({
    field: z.string(),
    operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'EXISTS', 'NOT_EXISTS']),
    value: z.any()
  }).optional(),
  priority: z.number().min(1).max(100),
  isActive: z.boolean()
})

export const syncConfigurationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  sourceIntegrationId: z.string().uuid(),
  targetIntegrationId: z.string().uuid(),
  syncType: z.enum(['FULL', 'INCREMENTAL', 'DELTA', 'EVENT_DRIVEN']),
  schedule: z.object({
    type: z.enum(['CRON', 'INTERVAL', 'EVENT', 'MANUAL']),
    expression: z.string().optional(),
    interval: z.number().positive().optional(),
    timezone: z.string().optional()
  }),
  mappings: z.array(z.object({
    sourceField: z.string(),
    targetField: z.string(),
    isRequired: z.boolean(),
    defaultValue: z.any().optional()
  })),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
    logicalOperator: z.enum(['AND', 'OR']).optional()
  })).optional(),
  isActive: z.boolean()
})

// Type validation functions
export const validateIntegrationConfig = (data: unknown): IntegrationConfig => {
  return integrationConfigSchema.parse(data)
}

export const validateIntegrationRequest = (data: unknown): IntegrationRequest => {
  return integrationRequestSchema.parse(data)
}

export const validateWebhookSubscription = (data: unknown): WebhookSubscription => {
  return webhookSubscriptionSchema.parse(data)
}

export const validateTransformationRule = (data: unknown): TransformationRule => {
  return transformationRuleSchema.parse(data)
}

export const validateSyncConfiguration = (data: unknown): SyncConfiguration => {
  return syncConfigurationSchema.parse(data)
}

// Type guards
export const isIntegrationError = (value: unknown): value is IntegrationError => {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value
}

export const isWebhookEvent = (value: unknown): value is WebhookEvent => {
  return typeof value === 'object' && value !== null && 'id' in value && 'type' in value && 'data' in value
}

export const isSyncResult = (value: unknown): value is SyncResult => {
  return typeof value === 'object' && value !== null && 'status' in value && 'recordsProcessed' in value
}

// Utility types for FlexVolt-specific integrations
export interface FlexVoltIntegrationData {
  batterySpecs: {
    voltage: '20V' | '60V' | 'MAX'
    capacity: '6Ah' | '9Ah' | '15Ah'
    chemistry: 'Li-Ion'
    compatibility: string[]
  }
  warehouseData: {
    location: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA'
    inventory: number
    reserved: number
    available: number
  }
  supplierData: {
    tier: 'DIRECT' | 'DISTRIBUTOR' | 'RETAILER' | 'FLEET_MANAGER' | 'SERVICE_PARTNER'
    discountLevel: number
    creditLimit: number
    paymentTerms: string
  }
}

export interface FlexVoltOrderData {
  products: Array<{
    sku: string
    name: string
    quantity: number
    unitPrice: number
    batteryType: '6Ah' | '9Ah' | '15Ah'
    voltage: '20V' | '60V'
  }>
  pricing: {
    subtotal: number
    discount: number
    discountPercentage: number
    tax: number
    shipping: number
    total: number
    currency: 'USD' | 'EUR' | 'JPY' | 'AUD'
  }
  shipping: {
    warehouse: string
    method: string
    estimatedDelivery: string
    trackingNumber?: string
  }
}

// Constants for integration management
export const INTEGRATION_TYPES = [
  'ERP', '3PL', 'PAYMENT', 'INVENTORY', 'WAREHOUSE', 'ANALYTICS', 'CRM', 'SHIPPING'
] as const

export const AUTH_METHODS = [
  'API_KEY', 'OAUTH2', 'BASIC', 'BEARER', 'HMAC', 'JWT'
] as const

export const HTTP_METHODS = [
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'
] as const

export const CIRCUIT_BREAKER_STATES = [
  'CLOSED', 'OPEN', 'HALF_OPEN'
] as const

export const DEFAULT_TIMEOUTS = {
  AUTHENTICATION: 5000,
  STANDARD_REQUEST: 30000,
  LONG_RUNNING: 300000,
  HEALTH_CHECK: 10000
} as const

export const DEFAULT_RETRY_ATTEMPTS = {
  AUTHENTICATION: 2,
  STANDARD_REQUEST: 3,
  CRITICAL_REQUEST: 5,
  HEALTH_CHECK: 1
} as const

// ============================================================================
// RHY_075: Deployment Preparation Types
// Multi-region deployment types for FlexVolt battery supply chain
// ============================================================================

// Core deployment preparation configuration
export interface DeploymentPrepConfig {
  maxRetries: number
  timeoutMs: number
  healthCheckInterval: number
  syncInterval: number
  regions: string[]
  cacheEnabled: boolean
  monitoringEnabled: boolean
  version?: string
}

// Deployment status tracking
export interface DeploymentPrepStatus {
  id: string
  status: 'INITIALIZING' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'ROLLBACK'
  regions: string[]
  startedAt: Date
  completedAt?: Date
  progress: DeploymentPrepProgress
  health: HealthCheckPrepResult['overall']
  metadata: {
    configVersion: string
    initiatedBy: string
    deploymentType: 'SINGLE_REGION' | 'MULTI_REGION'
    rollbackVersion?: string
  }
  errors?: DeploymentPrepError[]
}

// Deployment progress tracking
export interface DeploymentPrepProgress {
  current: number
  total: number
  stage: string
  details: string
  percentage?: number
  estimatedTimeRemaining?: number
}

// Regional deployment configuration
export interface RegionalDeploymentPrep {
  region: string
  status: 'INITIALIZING' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'MAINTENANCE'
  services: ServiceEndpointPrep[]
  health: HealthCheckPrepResult['regions'][0]['health']
  compliance: ComplianceStatusPrep
  deployedAt: Date
  lastHealthCheck: Date
  metadata: {
    deployedBy?: string
    serviceCount?: number
    lastSync?: Date
    performanceMetrics?: RegionalMetricsPrep
  }
}

// Service endpoint configuration for deployment
export interface ServiceEndpointPrep {
  name: string
  type: 'API' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'MONITORING'
  url: string
  port: number
  healthPath?: string
  version: string
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'
  metadata: {
    region: string
    clusterId?: string
    containerId?: string
    replicas?: number
  }
}

// Health check results for deployment
export interface HealthCheckPrepResult {
  overall: {
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
    healthPercentage: number
    healthyRegions: number
    totalRegions: number
    issues: string[]
  }
  regions: Array<{
    region: string
    success: boolean
    health: RegionalHealthPrep | null
    error: string | null
  }>
  timestamp: Date
  duration: number
  metrics: SystemMetricsPrep
}

// Regional health status for deployment
export interface RegionalHealthPrep {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'
  checks: HealthCheckPrep[]
  timestamp: Date
  services: ServiceHealthPrep[]
  infrastructure: InfrastructureHealthPrep
}

// Individual health check for deployment
export interface HealthCheckPrep {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
}

// Service health details for deployment
export interface ServiceHealthPrep {
  serviceName: string
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  responseTime: number
  uptime: number
  errors: number
  lastError?: string
  metadata: {
    version: string
    memoryUsage: number
    cpuUsage: number
  }
}

// Infrastructure health monitoring for deployment
export interface InfrastructureHealthPrep {
  cpu: ResourceMetricPrep
  memory: ResourceMetricPrep
  disk: ResourceMetricPrep
  network: NetworkMetricPrep
  containers: ContainerHealthPrep[]
}

// Resource utilization metrics for deployment
export interface ResourceMetricPrep {
  usage: number
  available: number
  percentage: number
  threshold: {
    warning: number
    critical: number
  }
}

// Network performance metrics for deployment
export interface NetworkMetricPrep {
  latency: number
  throughput: number
  errorRate: number
  connections: number
}

// Container health status for deployment
export interface ContainerHealthPrep {
  id: string
  name: string
  status: 'RUNNING' | 'STOPPED' | 'FAILED' | 'RESTARTING'
  uptime: number
  restarts: number
  memoryUsage: number
  cpuUsage: number
}

// System performance metrics for deployment
export interface SystemMetricsPrep {
  timestamp: Date
  overall: AggregatedMetricsPrep
  regional: Array<{
    region: string
    metrics: RegionalMetricsPrep
  }>
  alerts: SystemAlertPrep[]
}

// Aggregated system metrics for deployment
export interface AggregatedMetricsPrep {
  avgCpu: number
  avgMemory: number
  avgResponseTime: number
  totalThroughput: number
  avgErrorRate: number
  totalRequests: number
  uptime: number
}

// Regional performance metrics for deployment
export interface RegionalMetricsPrep {
  cpu: number
  memory: number
  responseTime: number
  throughput: number
  errorRate: number
  activeConnections: number
  queueDepth: number
  syncLatency: number
}

// System alerts for deployment
export interface SystemAlertPrep {
  id: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  title: string
  message: string
  region?: string
  service?: string
  timestamp: Date
  resolved: boolean
  metadata: {
    severity: number
    category: string
    autoResolve: boolean
  }
}

// Failover configuration for deployment
export interface FailoverConfigurationPrep {
  trigger: 'MANUAL' | 'AUTOMATIC' | 'HEALTH_CHECK' | 'PERFORMANCE'
  backupRegions: string[]
  failoverTimeout: number
  dataSync: {
    enabled: boolean
    syncTimeout: number
    criticalDataOnly: boolean
  }
  rollback: {
    enabled: boolean
    conditions: string[]
    timeout: number
  }
  notifications: {
    enabled: boolean
    channels: string[]
    escalation: boolean
  }
}

// Compliance status tracking for deployment
export interface ComplianceStatusPrep {
  isCompliant: boolean
  region: string
  standards: ComplianceStandardPrep[]
  lastCheck: Date
  violations: ComplianceViolationPrep[]
  certifications: CertificationPrep[]
}

// Compliance standards for deployment
export interface ComplianceStandardPrep {
  name: string
  version: string
  required: boolean
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXEMPT'
  checks: ComplianceCheckPrep[]
}

// Individual compliance check for deployment
export interface ComplianceCheckPrep {
  id: string
  name: string
  description: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  remediation?: string
}

// Compliance violations for deployment
export interface ComplianceViolationPrep {
  id: string
  standard: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  discovered: Date
  resolved?: Date
  remediation: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED'
}

// Compliance certifications for deployment
export interface CertificationPrep {
  name: string
  authority: string
  validFrom: Date
  validTo: Date
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'SUSPENDED'
  certificateId: string
}

// Deployment preparation errors
export class DeploymentPrepError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'DeploymentPrepError'
  }
}

// Deployment event logging for preparation
export interface DeploymentPrepEvent {
  action: string
  deploymentId?: string
  userId?: string
  regions?: string[]
  duration?: number
  success: boolean
  timestamp?: Date
  metadata?: Record<string, any>
}

// Synchronization event logging for deployment
export interface SyncPrepEvent {
  action: string
  dataType: string
  sourceRegion: string
  targetRegions: string[]
  successCount: number
  totalCount: number
  timestamp: Date
  metadata?: Record<string, any>
}

// Failover event logging for deployment
export interface FailoverPrepEvent {
  action: string
  failedRegion: string
  newPrimaryRegion: string
  duration: number
  trigger: string
  success: boolean
  timestamp?: Date
  metadata?: Record<string, any>
}

// Error logging interface for deployment
export interface ErrorLogPrep {
  service: string
  context: string
  error: string
  stack?: string
  metadata?: Record<string, any>
  timestamp: Date
}

// Warehouse configuration for regional deployments
export interface WarehouseConfigPrep {
  region: string
  name: string
  timezone: string
  currency: string
  language: string
  compliance: {
    standards: string[]
    dataResidency: boolean
    encryption: boolean
  }
  capacity: {
    maxOrders: number
    maxInventory: number
    processingThreads: number
  }
  integrations: {
    erp: boolean
    wms: boolean
    tms: boolean
    customs: boolean
  }
}

// Performance anomaly detection for deployment
export interface PerformanceAnomalyPrep {
  region: string
  metric: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  threshold: number
  currentValue: number
  trend: 'INCREASING' | 'DECREASING' | 'STABLE'
  duration: number
  impact: string
  remediation: string[]
}

// Data synchronization configuration for deployment
export interface SyncConfigurationPrep {
  enabled: boolean
  interval: number
  batchSize: number
  retries: number
  timeout: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  validation: {
    enabled: boolean
    checksums: boolean
    dataIntegrity: boolean
  }
  conflict: {
    resolution: 'SOURCE_WINS' | 'TARGET_WINS' | 'MERGE' | 'MANUAL'
    notification: boolean
  }
}

// Deployment validation schema
export interface DeploymentValidationPrep {
  preDeployment: ValidationCheckPrep[]
  postDeployment: ValidationCheckPrep[]
  rollback: ValidationCheckPrep[]
}

// Individual validation check for deployment
export interface ValidationCheckPrep {
  name: string
  type: 'HEALTH' | 'PERFORMANCE' | 'COMPLIANCE' | 'SECURITY' | 'FUNCTIONAL'
  required: boolean
  timeout: number
  retries: number
  criteria: {
    metric: string
    operator: 'GT' | 'LT' | 'EQ' | 'NE' | 'GTE' | 'LTE'
    value: number | string
  }
}

// Type guards for deployment runtime validation
export const isDeploymentPrepConfig = (obj: any): obj is DeploymentPrepConfig => {
  return obj &&
    typeof obj.maxRetries === 'number' &&
    typeof obj.timeoutMs === 'number' &&
    Array.isArray(obj.regions)
}

export const isDeploymentPrepStatus = (obj: any): obj is DeploymentPrepStatus => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.status === 'string' &&
    Array.isArray(obj.regions)
}

export const isHealthCheckPrepResult = (obj: any): obj is HealthCheckPrepResult => {
  return obj &&
    obj.overall &&
    Array.isArray(obj.regions) &&
    obj.timestamp instanceof Date
}

// Utility types for deployment preparation
export type DeploymentModePrep = 'DOCKER' | 'KUBERNETES' | 'STANDALONE'
export type EnvironmentPrep = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT'
export type RegionPrep = 'US' | 'JAPAN' | 'EU' | 'AUSTRALIA'
export type ServiceTypePrep = 'API' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'MONITORING'
export type HealthStatusPrep = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'
export type DeploymentStatusTypePrep = 'INITIALIZING' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'ROLLBACK'

// Constants for deployment preparation validation
export const DEPLOYMENT_PREP_CONSTANTS = {
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 30000,
  HEALTH_CHECK_INTERVAL: 30000,
  SYNC_INTERVAL: 1000,
  SUPPORTED_REGIONS: ['US', 'JAPAN', 'EU', 'AUSTRALIA'] as const,
  PERFORMANCE_THRESHOLDS: {
    CPU_WARNING: 70,
    CPU_CRITICAL: 90,
    MEMORY_WARNING: 80,
    MEMORY_CRITICAL: 95,
    RESPONSE_TIME_WARNING: 1000,
    RESPONSE_TIME_CRITICAL: 5000,
    ERROR_RATE_WARNING: 1,
    ERROR_RATE_CRITICAL: 5
  }
} as const