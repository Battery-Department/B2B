/**
 * Enterprise Metrics Collection System for RHY Supplier Portal
 * 
 * @fileoverview Comprehensive metrics collection, aggregation, and reporting system
 * supporting business metrics, performance monitoring, and operational insights.
 * Designed for multi-warehouse FlexVolt battery supply chain operations.
 * 
 * @author RHY Development Team
 * @version 1.0.0
 * @since 2025-06-24
 */

import { logger, getLogger } from './logger'
import { z } from 'zod'

const metricsLogger = getLogger('metrics')

/**
 * Metric types supported by the system
 * 
 * - COUNTER: Monotonically increasing values (e.g., request count, error count)
 * - GAUGE: Current value that can go up or down (e.g., memory usage, active connections)
 * - HISTOGRAM: Distribution of values with configurable buckets (e.g., response times)
 * - SUMMARY: Statistical summary with quantiles (e.g., latency percentiles)
 * - TIMER: Specialized histogram for timing operations
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  TIMER = 'timer'
}

/**
 * Warehouse regions for multi-region metrics tracking
 * 
 * Supports RHY's global FlexVolt battery distribution operations
 * across four major geographic regions with different compliance requirements.
 */
export enum WarehouseRegion {
  /** United States West Coast operations */
  US_WEST = 'US_WEST',
  /** Japan operations with JIS compliance */
  JAPAN = 'JAPAN',
  /** European Union operations with GDPR compliance */
  EU = 'EU',
  /** Australia operations with local regulatory compliance */
  AUSTRALIA = 'AUSTRALIA'
}

/**
 * Supplier tiers for business metrics segmentation
 * 
 * Categorizes suppliers based on their relationship type and
 * business model for targeted analytics and reporting.
 */
export enum SupplierTier {
  /** Direct manufacturer relationships */
  DIRECT = 'DIRECT',
  /** Regional distribution partners */
  DISTRIBUTOR = 'DISTRIBUTOR',
  /** Retail channel partners */
  RETAILER = 'RETAILER',
  /** Fleet management customers */
  FLEET_MANAGER = 'FLEET_MANAGER',
  /** Service and maintenance partners */
  SERVICE_PARTNER = 'SERVICE_PARTNER'
}

/**
 * FlexVolt battery products for inventory and sales metrics
 * 
 * Represents RHY's core FlexVolt battery product line with
 * 20V/60V MAX compatibility for professional contractors.
 */
export enum BatteryProduct {
  /** 6Ah FlexVolt Battery - $149 retail */
  FLEXVOLT_6AH = 'FLEXVOLT_6AH',
  /** 9Ah FlexVolt Battery - $239 retail */
  FLEXVOLT_9AH = 'FLEXVOLT_9AH',
  /** 15Ah FlexVolt Battery - $359 retail */
  FLEXVOLT_15AH = 'FLEXVOLT_15AH'
}

/**
 * Labels for metric categorization and filtering
 * 
 * Provides dimensional metadata for metrics to enable
 * sophisticated querying, filtering, and aggregation.
 */
export interface MetricLabels {
  /** Warehouse region identifier */
  warehouse?: WarehouseRegion
  /** Supplier tier classification */
  supplier_tier?: SupplierTier
  /** Battery product type */
  product?: BatteryProduct
  /** Operation or request status */
  status?: string
  /** HTTP method for API metrics */
  method?: string
  /** API endpoint for request metrics */
  endpoint?: string
  /** User identifier for user-specific metrics */
  user_id?: string
  /** Session identifier for session tracking */
  session_id?: string
  /** Error code for error tracking */
  error_code?: string
  /** Additional custom labels */
  [key: string]: string | undefined
}

/**
 * Base metric configuration
 * 
 * Defines the structure and behavior of a metric including
 * its type, labels, thresholds, and retention policy.
 */
export interface MetricConfig {
  /** Unique metric name */
  name: string
  /** Type of metric (counter, gauge, histogram, etc.) */
  type: MetricType
  /** Human-readable description of the metric */
  description: string
  /** Available label dimensions */
  labels?: string[]
  /** Histogram bucket boundaries */
  buckets?: number[]
  /** Summary quantile values (0.5, 0.95, 0.99, etc.) */
  quantiles?: number[]
  /** Alert thresholds for monitoring */
  thresholds?: {
    /** Warning threshold value */
    warning?: number
    /** Critical threshold value */
    critical?: number
  }
  /** Data retention period in days */
  retention?: number
}

/**
 * Individual metric data point
 * 
 * Represents a single measurement with timestamp,
 * value, and associated dimensional labels.
 */
export interface MetricDataPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number
  /** Metric value */
  value: number
  /** Dimensional labels for the data point */
  labels: MetricLabels
}

/**
 * Aggregated metric statistics
 */
export interface MetricStats {
  count: number
  sum: number
  min: number
  max: number
  avg: number
  p50?: number
  p95?: number
  p99?: number
  p999?: number
}

/**
 * Time series data for metric visualization
 */
export interface TimeSeries {
  metric: string
  labels: MetricLabels
  values: Array<{
    timestamp: number
    value: number
  }>
}

/**
 * Alert configuration for metric thresholds
 */
export interface MetricAlert {
  id: string
  metric: string
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  duration: number // Seconds
  severity: 'warning' | 'critical'
  description: string
  enabled: boolean
  lastTriggered?: number
  labels?: MetricLabels
}

/**
 * Business metric categories for RHY operations
 */
export interface BusinessMetrics {
  // Order Management
  ordersTotal: Counter
  ordersByStatus: Counter
  ordersByWarehouse: Counter
  ordersBySupplierTier: Counter
  orderValue: Histogram
  orderProcessingTime: Histogram
  orderFulfillmentTime: Histogram
  
  // Inventory Management
  inventoryLevels: Gauge
  inventoryTurnover: Gauge
  stockoutEvents: Counter
  lowStockAlerts: Counter
  inventorySyncLatency: Histogram
  
  // FlexVolt Product Metrics
  productSales: Counter
  productRevenue: Counter
  productMargin: Gauge
  productDemandForecast: Gauge
  
  // Supplier Engagement
  supplierLogins: Counter
  supplierSessions: Gauge
  supplierRetention: Gauge
  supplierSatisfaction: Gauge
  
  // Financial Metrics
  revenueByWarehouse: Counter
  profitMargin: Gauge
  discountUtilization: Counter
  paymentProcessingTime: Histogram
  
  // Operational Excellence
  warehouseEfficiency: Gauge
  crossDockTime: Histogram
  shippingCost: Histogram
  deliveryTime: Histogram
  qualityScore: Gauge
}

/**
 * Performance metrics for system monitoring
 */
export interface PerformanceMetrics {
  // API Performance
  httpRequestsTotal: Counter
  httpRequestDuration: Histogram
  httpRequestSize: Histogram
  httpResponseSize: Histogram
  httpErrorsTotal: Counter
  
  // Database Performance
  dbConnectionsActive: Gauge
  dbConnectionsIdle: Gauge
  dbQueryDuration: Histogram
  dbTransactionDuration: Histogram
  dbDeadlocks: Counter
  
  // System Resources
  memoryUsage: Gauge
  cpuUsage: Gauge
  diskUsage: Gauge
  networkBytesIn: Counter
  networkBytesOut: Counter
  
  // Application Performance
  pageLoadTime: Histogram
  renderTime: Histogram
  componentMountTime: Histogram
  bundleSize: Gauge
  errorRate: Gauge
  
  // Cache Performance
  cacheHits: Counter
  cacheMisses: Counter
  cacheEvictions: Counter
  cacheSize: Gauge
}

/**
 * Security metrics for compliance and monitoring
 */
export interface SecurityMetrics {
  authAttempts: Counter
  authFailures: Counter
  authLockouts: Counter
  mfaUsage: Counter
  sessionCreated: Counter
  sessionExpired: Counter
  
  permissionDenied: Counter
  dataAccessAttempts: Counter
  sensitiveDataAccess: Counter
  
  securityEvents: Counter
  threatLevel: Gauge
  vulnerabilityScore: Gauge
  
  complianceScore: Gauge
  auditEvents: Counter
  gdprRequests: Counter
}

/**
 * Base metric implementation
 */
abstract class BaseMetric {
  protected config: MetricConfig
  protected dataPoints: MetricDataPoint[] = []
  protected alerts: MetricAlert[] = []

  constructor(config: MetricConfig) {
    this.config = config
  }

  getName(): string {
    return this.config.name
  }

  getType(): MetricType {
    return this.config.type
  }

  getDescription(): string {
    return this.config.description
  }

  addAlert(alert: MetricAlert): void {
    this.alerts.push(alert)
  }

  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId)
  }

  protected checkAlerts(value: number, labels: MetricLabels): void {
    for (const alert of this.alerts) {
      if (!alert.enabled) continue

      // Check label matching
      if (alert.labels) {
        const matches = Object.entries(alert.labels).every(([key, alertValue]) => 
          labels[key] === alertValue
        )
        if (!matches) continue
      }

      // Check threshold condition
      let triggered = false
      switch (alert.condition) {
        case 'gt':
          triggered = value > alert.threshold
          break
        case 'gte':
          triggered = value >= alert.threshold
          break
        case 'lt':
          triggered = value < alert.threshold
          break
        case 'lte':
          triggered = value <= alert.threshold
          break
        case 'eq':
          triggered = value === alert.threshold
          break
      }

      if (triggered) {
        const now = Date.now()
        const shouldTrigger = !alert.lastTriggered || 
          (now - alert.lastTriggered) >= (alert.duration * 1000)

        if (shouldTrigger) {
          alert.lastTriggered = now
          this.triggerAlert(alert, value, labels)
        }
      }
    }
  }

  protected triggerAlert(alert: MetricAlert, value: number, labels: MetricLabels): void {
    metricsLogger.warn(`Metric alert triggered: ${alert.description}`, {
      metadata: {
        alertId: alert.id,
        metric: this.config.name,
        value,
        threshold: alert.threshold,
        severity: alert.severity,
        labels
      },
      tags: ['ALERT', 'METRICS', alert.severity.toUpperCase()]
    })

    // Emit alert event for external handling
    if (typeof window !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics/alerts', JSON.stringify({
        alertId: alert.id,
        metric: this.config.name,
        value,
        threshold: alert.threshold,
        severity: alert.severity,
        timestamp: Date.now(),
        labels
      }))
    }
  }

  getStats(timeRange?: { start: number; end: number }): MetricStats {
    let data = this.dataPoints
    
    if (timeRange) {
      data = data.filter(dp => 
        dp.timestamp >= timeRange.start && dp.timestamp <= timeRange.end
      )
    }

    if (data.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        avg: 0
      }
    }

    const values = data.map(dp => dp.value).sort((a, b) => a - b)
    const sum = values.reduce((acc, val) => acc + val, 0)

    const stats: MetricStats = {
      count: values.length,
      sum,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length
    }

    // Calculate percentiles for larger datasets
    if (values.length >= 100) {
      stats.p50 = values[Math.floor(values.length * 0.5)]
      stats.p95 = values[Math.floor(values.length * 0.95)]
      stats.p99 = values[Math.floor(values.length * 0.99)]
      stats.p999 = values[Math.floor(values.length * 0.999)]
    }

    return stats
  }

  getTimeSeries(timeRange?: { start: number; end: number }): TimeSeries[] {
    let data = this.dataPoints
    
    if (timeRange) {
      data = data.filter(dp => 
        dp.timestamp >= timeRange.start && dp.timestamp <= timeRange.end
      )
    }

    // Group by labels
    const grouped = new Map<string, MetricDataPoint[]>()
    
    for (const dp of data) {
      const key = JSON.stringify(dp.labels)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(dp)
    }

    // Convert to time series
    const series: TimeSeries[] = []
    
    for (const [labelKey, points] of grouped) {
      const labels = JSON.parse(labelKey)
      const values = points.map(dp => ({
        timestamp: dp.timestamp,
        value: dp.value
      })).sort((a, b) => a.timestamp - b.timestamp)

      series.push({
        metric: this.config.name,
        labels,
        values
      })
    }

    return series
  }

  cleanup(retentionDays?: number): void {
    const retention = retentionDays || this.config.retention || 30
    const cutoff = Date.now() - (retention * 24 * 60 * 60 * 1000)
    
    this.dataPoints = this.dataPoints.filter(dp => dp.timestamp > cutoff)
  }

  abstract record(value: number, labels?: MetricLabels): void
}

/**
 * Counter metric - monotonically increasing value
 */
export class Counter extends BaseMetric {
  private value = 0

  constructor(name: string, description: string, labels?: string[]) {
    super({
      name,
      type: MetricType.COUNTER,
      description,
      labels
    })
  }

  record(value: number = 1, labels: MetricLabels = {}): void {
    this.value += value
    const dataPoint: MetricDataPoint = {
      timestamp: Date.now(),
      value: this.value,
      labels
    }
    
    this.dataPoints.push(dataPoint)
    this.checkAlerts(this.value, labels)
  }

  inc(labels?: MetricLabels): void {
    this.record(1, labels)
  }

  add(value: number, labels?: MetricLabels): void {
    this.record(value, labels)
  }

  getValue(): number {
    return this.value
  }

  reset(): void {
    this.value = 0
    this.dataPoints = []
  }
}

/**
 * Gauge metric - current value that can go up or down
 */
export class Gauge extends BaseMetric {
  private value = 0

  constructor(name: string, description: string, labels?: string[]) {
    super({
      name,
      type: MetricType.GAUGE,
      description,
      labels
    })
  }

  record(value: number, labels: MetricLabels = {}): void {
    this.value = value
    const dataPoint: MetricDataPoint = {
      timestamp: Date.now(),
      value: this.value,
      labels
    }
    
    this.dataPoints.push(dataPoint)
    this.checkAlerts(this.value, labels)
  }

  set(value: number, labels?: MetricLabels): void {
    this.record(value, labels)
  }

  inc(labels?: MetricLabels): void {
    this.record(this.value + 1, labels)
  }

  dec(labels?: MetricLabels): void {
    this.record(this.value - 1, labels)
  }

  add(value: number, labels?: MetricLabels): void {
    this.record(this.value + value, labels)
  }

  sub(value: number, labels?: MetricLabels): void {
    this.record(this.value - value, labels)
  }

  getValue(): number {
    return this.value
  }
}

/**
 * Histogram metric - distribution of values
 */
export class Histogram extends BaseMetric {
  private buckets: Map<number, number> = new Map()
  private sum = 0
  private count = 0

  constructor(
    name: string, 
    description: string, 
    buckets: number[] = [0.1, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    labels?: string[]
  ) {
    super({
      name,
      type: MetricType.HISTOGRAM,
      description,
      labels,
      buckets
    })

    // Initialize buckets
    for (const bucket of buckets) {
      this.buckets.set(bucket, 0)
    }
    this.buckets.set(Infinity, 0) // +Inf bucket
  }

  record(value: number, labels: MetricLabels = {}): void {
    this.sum += value
    this.count++

    // Update buckets
    for (const [bucket, currentCount] of this.buckets) {
      if (value <= bucket) {
        this.buckets.set(bucket, currentCount + 1)
      }
    }

    const dataPoint: MetricDataPoint = {
      timestamp: Date.now(),
      value,
      labels
    }
    
    this.dataPoints.push(dataPoint)
    this.checkAlerts(value, labels)
  }

  observe(value: number, labels?: MetricLabels): void {
    this.record(value, labels)
  }

  getQuantile(quantile: number): number {
    if (this.count === 0) return 0

    const sortedValues = this.dataPoints
      .map(dp => dp.value)
      .sort((a, b) => a - b)

    const index = Math.floor(quantile * (sortedValues.length - 1))
    return sortedValues[index] || 0
  }

  getBuckets(): Map<number, number> {
    return new Map(this.buckets)
  }

  getSum(): number {
    return this.sum
  }

  getCount(): number {
    return this.count
  }
}

/**
 * Timer metric - convenience wrapper around histogram for timing
 */
export class Timer extends Histogram {
  constructor(name: string, description: string, labels?: string[]) {
    super(
      name,
      description,
      [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // Millisecond buckets
      labels
    )
  }

  /**
   * Time a function execution
   */
  time<T>(fn: () => T, labels?: MetricLabels): T {
    const start = Date.now()
    try {
      const result = fn()
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = Date.now() - start
          this.observe(duration, labels)
        }) as T
      } else {
        const duration = Date.now() - start
        this.observe(duration, labels)
        return result
      }
    } catch (error) {
      const duration = Date.now() - start
      this.observe(duration, { ...labels, status: 'error' })
      throw error
    }
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(fn: () => Promise<T>, labels?: MetricLabels): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.observe(duration, labels)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.observe(duration, { ...labels, status: 'error' })
      throw error
    }
  }

  /**
   * Create a timer instance that can be stopped
   */
  startTimer(labels?: MetricLabels): { stop: () => number } {
    const start = Date.now()
    return {
      stop: (): number => {
        const duration = Date.now() - start
        this.observe(duration, labels)
        return duration
      }
    }
  }
}

/**
 * Comprehensive metrics registry
 */
export class MetricsRegistry {
  private metrics: Map<string, BaseMetric> = new Map()
  private collectors: Map<string, () => void> = new Map()
  private alerts: Map<string, MetricAlert> = new Map()
  private isCollecting = false
  private collectionInterval?: NodeJS.Timeout

  constructor() {
    this.setupDefaultMetrics()
  }

  private setupDefaultMetrics(): void {
    // Business Metrics
    this.registerCounter('rhy_orders_total', 'Total number of orders processed')
    this.registerCounter('rhy_orders_by_status', 'Orders grouped by status', ['status', 'warehouse'])
    this.registerHistogram('rhy_order_value', 'Order value distribution', [50, 100, 250, 500, 1000, 2500, 5000, 10000])
    this.registerTimer('rhy_order_processing_time', 'Time to process orders')
    
    this.registerGauge('rhy_inventory_levels', 'Current inventory levels', ['product', 'warehouse'])
    this.registerCounter('rhy_stockout_events', 'Number of stockout events', ['product', 'warehouse'])
    
    this.registerCounter('rhy_product_sales', 'FlexVolt product sales', ['product', 'warehouse'])
    this.registerCounter('rhy_product_revenue', 'Revenue by product', ['product'])
    
    this.registerCounter('rhy_supplier_logins', 'Supplier login events', ['supplier_tier'])
    this.registerGauge('rhy_supplier_sessions', 'Active supplier sessions', ['warehouse'])
    
    // Performance Metrics
    this.registerCounter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
    this.registerTimer('http_request_duration', 'HTTP request duration')
    this.registerCounter('http_errors_total', 'HTTP errors', ['endpoint', 'error_code'])
    
    this.registerGauge('db_connections_active', 'Active database connections')
    this.registerTimer('db_query_duration', 'Database query duration')
    
    this.registerGauge('memory_usage_bytes', 'Memory usage in bytes')
    this.registerGauge('cpu_usage_percent', 'CPU usage percentage')
    
    // Security Metrics
    this.registerCounter('auth_attempts_total', 'Authentication attempts', ['status'])
    this.registerCounter('auth_failures_total', 'Authentication failures', ['reason'])
    this.registerCounter('security_events_total', 'Security events', ['type', 'severity'])
    
    this.setupAlerts()
  }

  private setupAlerts(): void {
    // Critical business alerts
    this.addAlert({
      id: 'high_order_processing_time',
      metric: 'rhy_order_processing_time',
      condition: 'gt',
      threshold: 30000, // 30 seconds
      duration: 300, // 5 minutes
      severity: 'warning',
      description: 'Order processing time is high'
    })

    this.addAlert({
      id: 'low_inventory_warning',
      metric: 'rhy_inventory_levels',
      condition: 'lt',
      threshold: 10,
      duration: 60,
      severity: 'warning',
      description: 'Inventory level is low'
    })

    this.addAlert({
      id: 'stockout_critical',
      metric: 'rhy_inventory_levels',
      condition: 'eq',
      threshold: 0,
      duration: 0,
      severity: 'critical',
      description: 'Stock out occurred'
    })

    // Performance alerts
    this.addAlert({
      id: 'high_response_time',
      metric: 'http_request_duration',
      condition: 'gt',
      threshold: 1000, // 1 second
      duration: 300,
      severity: 'warning',
      description: 'API response time is high'
    })

    this.addAlert({
      id: 'high_error_rate',
      metric: 'http_errors_total',
      condition: 'gt',
      threshold: 100,
      duration: 300,
      severity: 'critical',
      description: 'High error rate detected'
    })

    // Security alerts
    this.addAlert({
      id: 'auth_failure_spike',
      metric: 'auth_failures_total',
      condition: 'gt',
      threshold: 50,
      duration: 300,
      severity: 'critical',
      description: 'High number of authentication failures'
    })
  }

  // Metric registration methods
  registerCounter(name: string, description: string, labels?: string[]): Counter {
    const counter = new Counter(name, description, labels)
    this.metrics.set(name, counter)
    return counter
  }

  registerGauge(name: string, description: string, labels?: string[]): Gauge {
    const gauge = new Gauge(name, description, labels)
    this.metrics.set(name, gauge)
    return gauge
  }

  registerHistogram(
    name: string, 
    description: string, 
    buckets?: number[], 
    labels?: string[]
  ): Histogram {
    const histogram = new Histogram(name, description, buckets, labels)
    this.metrics.set(name, histogram)
    return histogram
  }

  registerTimer(name: string, description: string, labels?: string[]): Timer {
    const timer = new Timer(name, description, labels)
    this.metrics.set(name, timer)
    return timer
  }

  // Metric access methods
  getMetric(name: string): BaseMetric | undefined {
    return this.metrics.get(name)
  }

  getCounter(name: string): Counter | undefined {
    const metric = this.metrics.get(name)
    return metric instanceof Counter ? metric : undefined
  }

  getGauge(name: string): Gauge | undefined {
    const metric = this.metrics.get(name)
    return metric instanceof Gauge ? metric : undefined
  }

  getHistogram(name: string): Histogram | undefined {
    const metric = this.metrics.get(name)
    return metric instanceof Histogram ? metric : undefined
  }

  getTimer(name: string): Timer | undefined {
    const metric = this.metrics.get(name)
    return metric instanceof Timer ? metric : undefined
  }

  // Alert management
  addAlert(alert: MetricAlert): void {
    this.alerts.set(alert.id, alert)
    const metric = this.metrics.get(alert.metric)
    if (metric) {
      metric.addAlert(alert)
    }
  }

  removeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId)
    if (alert) {
      const metric = this.metrics.get(alert.metric)
      if (metric) {
        metric.removeAlert(alertId)
      }
      this.alerts.delete(alertId)
    }
  }

  getAlerts(): MetricAlert[] {
    return Array.from(this.alerts.values())
  }

  // Data collection
  startCollection(intervalMs: number = 60000): void {
    if (this.isCollecting) return

    this.isCollecting = true
    this.collectionInterval = setInterval(() => {
      this.collect()
    }, intervalMs)

    metricsLogger.info('Metrics collection started', {
      metadata: { intervalMs }
    })
  }

  stopCollection(): void {
    if (!this.isCollecting) return

    this.isCollecting = false
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = undefined
    }

    metricsLogger.info('Metrics collection stopped')
  }

  private collect(): void {
    // Run all registered collectors
    for (const [name, collector] of this.collectors) {
      try {
        collector()
      } catch (error) {
        metricsLogger.error(`Collector ${name} failed`, error)
      }
    }

    // Cleanup old data
    for (const metric of this.metrics.values()) {
      metric.cleanup()
    }
  }

  addCollector(name: string, collector: () => void): void {
    this.collectors.set(name, collector)
  }

  removeCollector(name: string): void {
    this.collectors.delete(name)
  }

  // Data export
  exportPrometheusFormat(): string {
    const lines: string[] = []

    for (const metric of this.metrics.values()) {
      const name = metric.getName()
      const description = metric.getDescription()
      const type = metric.getType()

      // Add metric metadata
      lines.push(`# HELP ${name} ${description}`)
      lines.push(`# TYPE ${name} ${type}`)

      // Add metric data
      const timeSeries = metric.getTimeSeries()
      for (const series of timeSeries) {
        const labelStr = Object.entries(series.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')

        const metricName = labelStr ? `${name}{${labelStr}}` : name
        
        for (const point of series.values) {
          lines.push(`${metricName} ${point.value} ${point.timestamp}`)
        }
      }

      lines.push('') // Empty line between metrics
    }

    return lines.join('\n')
  }

  exportJSON(): any {
    const data: any = {}

    for (const [name, metric] of this.metrics) {
      data[name] = {
        type: metric.getType(),
        description: metric.getDescription(),
        stats: metric.getStats(),
        timeSeries: metric.getTimeSeries()
      }
    }

    return {
      timestamp: Date.now(),
      metrics: data,
      alerts: Array.from(this.alerts.values())
    }
  }

  // Reporting
  generateReport(timeRange?: { start: number; end: number }): string {
    let report = '# RHY Supplier Portal Metrics Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`

    if (timeRange) {
      report += `Time Range: ${new Date(timeRange.start).toISOString()} - ${new Date(timeRange.end).toISOString()}\n\n`
    }

    // Business metrics summary
    report += '## Business Metrics\n\n'
    
    const ordersTotal = this.getCounter('rhy_orders_total')
    if (ordersTotal) {
      report += `- **Total Orders**: ${ordersTotal.getValue()}\n`
    }

    const productSales = this.getCounter('rhy_product_sales')
    if (productSales) {
      const stats = productSales.getStats(timeRange)
      report += `- **Product Sales**: ${stats.sum} units\n`
    }

    const supplierLogins = this.getCounter('rhy_supplier_logins')
    if (supplierLogins) {
      const stats = supplierLogins.getStats(timeRange)
      report += `- **Supplier Logins**: ${stats.sum}\n`
    }

    // Performance metrics
    report += '\n## Performance Metrics\n\n'

    const httpRequests = this.getCounter('http_requests_total')
    if (httpRequests) {
      const stats = httpRequests.getStats(timeRange)
      report += `- **HTTP Requests**: ${stats.sum} (avg: ${stats.avg.toFixed(2)}/min)\n`
    }

    const responseTime = this.getTimer('http_request_duration')
    if (responseTime) {
      const stats = responseTime.getStats(timeRange)
      report += `- **Response Time**: avg ${stats.avg.toFixed(2)}ms, p95 ${stats.p95?.toFixed(2) || 'N/A'}ms\n`
    }

    // Active alerts
    const activeAlerts = this.getAlerts().filter(alert => alert.enabled)
    if (activeAlerts.length > 0) {
      report += '\n## Active Alerts\n\n'
      for (const alert of activeAlerts) {
        report += `- **${alert.description}** (${alert.severity})\n`
      }
    }

    return report
  }

  // Cleanup
  cleanup(): void {
    this.stopCollection()
    for (const metric of this.metrics.values()) {
      metric.cleanup()
    }
  }

  reset(): void {
    this.stopCollection()
    this.metrics.clear()
    this.collectors.clear()
    this.alerts.clear()
    this.setupDefaultMetrics()
  }
}

// Global metrics registry
export const metrics = new MetricsRegistry()

// Convenience functions for easy metric access
export function counter(name: string, description?: string, labels?: string[]): Counter {
  let metric = metrics.getCounter(name)
  if (!metric && description) {
    metric = metrics.registerCounter(name, description, labels)
  }
  return metric!
}

export function gauge(name: string, description?: string, labels?: string[]): Gauge {
  let metric = metrics.getGauge(name)
  if (!metric && description) {
    metric = metrics.registerGauge(name, description, labels)
  }
  return metric!
}

export function histogram(name: string, description?: string, buckets?: number[], labels?: string[]): Histogram {
  let metric = metrics.getHistogram(name)
  if (!metric && description) {
    metric = metrics.registerHistogram(name, description, buckets, labels)
  }
  return metric!
}

export function timer(name: string, description?: string, labels?: string[]): Timer {
  let metric = metrics.getTimer(name)
  if (!metric && description) {
    metric = metrics.registerTimer(name, description, labels)
  }
  return metric!
}

// Convenience functions for tracking common operations
export function trackOrder(orderId: string, value: number, warehouse: WarehouseRegion, status: string): void {
  counter('rhy_orders_total').inc({ warehouse, status })
  histogram('rhy_order_value').observe(value, { warehouse })
  
  metricsLogger.info('Order tracked', {
    business: {
      action: 'order_tracked',
      entity: 'order',
      entityId: orderId,
      impact: 'MEDIUM'
    },
    metadata: { value, warehouse, status }
  })
}

export function trackInventory(product: BatteryProduct, warehouse: WarehouseRegion, level: number): void {
  gauge('rhy_inventory_levels').set(level, { product, warehouse })
  
  if (level === 0) {
    counter('rhy_stockout_events').inc({ product, warehouse })
  }
}

export function trackSupplierActivity(supplierId: string, tier: SupplierTier, action: string): void {
  if (action === 'login') {
    counter('rhy_supplier_logins').inc({ supplier_tier: tier })
  }
  
  gauge('rhy_supplier_sessions').inc({ supplier_id: supplierId })
}

export function trackAPICall(method: string, endpoint: string, duration: number, statusCode: number): void {
  const status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error'
  
  counter('http_requests_total').inc({ method, endpoint, status: statusCode.toString() })
  timer('http_request_duration').observe(duration, { method, endpoint })
  
  if (statusCode >= 400) {
    counter('http_errors_total').inc({ endpoint, error_code: statusCode.toString() })
  }
}

// Auto-start metrics collection in browser environment
if (typeof window !== 'undefined') {
  metrics.startCollection(30000) // Collect every 30 seconds

  // Track page performance
  metrics.addCollector('page_performance', () => {
    if ('performance' in window && window.performance.timing) {
      const timing = window.performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart
      histogram('rhy_page_load_time').observe(loadTime)
    }
  })

  // Track memory usage
  metrics.addCollector('memory_usage', () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      gauge('memory_usage_bytes').set(memory.usedJSHeapSize)
    }
  })
}

// Export types
export type {
  MetricConfig,
  MetricLabels,
  MetricDataPoint,
  MetricStats,
  TimeSeries,
  MetricAlert,
  BusinessMetrics,
  PerformanceMetrics,
  SecurityMetrics
}