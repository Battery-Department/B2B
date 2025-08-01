/**
 * RHY_074: Enterprise Monitoring System
 * Comprehensive monitoring infrastructure for FlexVolt supplier portal
 * Integrates with existing Batch 1 authentication, warehouse management, and performance systems
 */

import { performance } from 'perf_hooks';
import { logger } from '@/lib/logger';
import { rhyPrisma } from '@/lib/rhy-database';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  message?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceSnapshot {
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  warehouseId?: string;
  userId?: string;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'between';
  threshold: number | [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  warehouseId?: string;
  notificationChannels: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  warehouseId?: string;
  currentValue: number;
  threshold: number | [number, number];
  isResolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

/**
 * Enterprise Monitoring Service
 * Real-time monitoring for RHY Supplier Portal with <100ms performance targets
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, SystemMetric[]> = new Map();
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private healthChecks: Map<string, HealthCheckResult> = new Map();

  private constructor() {
    this.initializeDefaultAlertRules();
    this.startPeriodicHealthChecks();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record performance metric with automatic alerting
   */
  public async recordMetric(metric: {
    operation: string;
    duration?: number;
    success: boolean;
    warehouseId?: string;
    userId?: string;
    error?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const startTime = performance.now();

    try {
      const performanceSnapshot: PerformanceSnapshot = {
        service: 'RHY_SUPPLIER_PORTAL',
        operation: metric.operation,
        duration: metric.duration || 0,
        success: metric.success,
        warehouseId: metric.warehouseId,
        userId: metric.userId,
        error: metric.error,
        metadata: metric.metadata,
        timestamp: new Date()
      };

      // Store in memory for real-time access
      await this.storeMetricInMemory(performanceSnapshot);

      // Persist to database for historical analysis
      await this.persistMetricToDatabase(performanceSnapshot);

      // Check alert rules
      await this.evaluateAlertRules(performanceSnapshot);

      // Update system metrics
      await this.updateSystemMetrics(performanceSnapshot);

      const recordDuration = performance.now() - startTime;

      if (recordDuration > 10) { // Alert if recording takes too long
        logger.warn('Slow metric recording detected', {
          operation: metric.operation,
          recordDuration,
          target: '<10ms'
        });
      }

    } catch (error) {
      logger.error('Failed to record metric', {
        operation: metric.operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      });
    }
  }

  /**
   * Get real-time health status of all services
   */
  public async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheckResult[];
    summary: {
      healthy: number;
      degraded: number;
      unhealthy: number;
      total: number;
    };
    lastUpdate: Date;
  }> {
    const startTime = performance.now();

    try {
      const services = Array.from(this.healthChecks.values());
      const summary = {
        healthy: services.filter(s => s.status === 'healthy').length,
        degraded: services.filter(s => s.status === 'degraded').length,
        unhealthy: services.filter(s => s.status === 'unhealthy').length,
        total: services.length
      };

      // Determine overall system health
      let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (summary.unhealthy > 0) {
        overall = 'unhealthy';
      } else if (summary.degraded > 0) {
        overall = 'degraded';
      }

      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'getSystemHealth',
        duration,
        success: true,
        metadata: { summary, overall }
      });

      return {
        overall,
        services,
        summary,
        lastUpdate: new Date()
      };

    } catch (error) {
      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'getSystemHealth',
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Get performance metrics for specific warehouse
   */
  public async getWarehouseMetrics(
    warehouseId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    operationCount: number;
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
    throughput: number;
    trends: {
      responseTime: Array<{ timestamp: Date; value: number }>;
      errorRate: Array<{ timestamp: Date; value: number }>;
      throughput: Array<{ timestamp: Date; value: number }>;
    };
  }> {
    const startTime = performance.now();

    try {
      // Query warehouse-specific metrics from database
      const metrics = await rhyPrisma.realtimeMetric.findMany({
        where: {
          warehouseId,
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Calculate aggregated metrics
      const operationCount = metrics.length;
      const avgResponseTime = metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length 
        : 0;

      const errorMetrics = metrics.filter(m => m.metricName === 'error_rate');
      const errorRate = errorMetrics.length > 0 
        ? errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length 
        : 0;

      const successRate = Math.max(0, 100 - errorRate);
      const timeRangeHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
      const throughput = timeRangeHours > 0 ? operationCount / timeRangeHours : 0;

      // Build trend data
      const responseTimeTrend = metrics
        .filter(m => m.metricName === 'response_time')
        .map(m => ({ timestamp: m.timestamp, value: m.value }));

      const errorRateTrend = metrics
        .filter(m => m.metricName === 'error_rate')
        .map(m => ({ timestamp: m.timestamp, value: m.value }));

      const throughputTrend = this.calculateThroughputTrend(metrics, timeRange);

      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'getWarehouseMetrics',
        duration,
        success: true,
        warehouseId,
        metadata: { operationCount, avgResponseTime, errorRate }
      });

      return {
        operationCount,
        averageResponseTime: avgResponseTime,
        errorRate,
        successRate,
        throughput,
        trends: {
          responseTime: responseTimeTrend,
          errorRate: errorRateTrend,
          throughput: throughputTrend
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'getWarehouseMetrics',
        duration,
        success: false,
        warehouseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Get active alerts with filtering
   */
  public async getActiveAlerts(filters?: {
    warehouseId?: string;
    severity?: string[];
    resolved?: boolean;
  }): Promise<Alert[]> {
    const startTime = performance.now();

    try {
      let alerts = this.alerts;

      if (filters) {
        if (filters.warehouseId) {
          alerts = alerts.filter(a => a.warehouseId === filters.warehouseId);
        }
        if (filters.severity) {
          alerts = alerts.filter(a => filters.severity!.includes(a.severity));
        }
        if (filters.resolved !== undefined) {
          alerts = alerts.filter(a => a.isResolved === filters.resolved);
        }
      }

      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'getActiveAlerts',
        duration,
        success: true,
        metadata: { 
          alertCount: alerts.length,
          filters: filters || {}
        }
      });

      return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'getActiveAlerts',
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Create or update alert rule
   */
  public async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const startTime = performance.now();

    try {
      const alertRule: AlertRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...rule
      };

      this.alertRules.push(alertRule);

      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'createAlertRule',
        duration,
        success: true,
        metadata: { 
          ruleId: alertRule.id,
          metric: rule.metric,
          severity: rule.severity
        }
      });

      logger.info('Alert rule created', {
        ruleId: alertRule.id,
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity
      });

      return alertRule;

    } catch (error) {
      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'createAlertRule',
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Resolve alert
   */
  public async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const startTime = performance.now();

    try {
      const alert = this.alerts.find(a => a.id === alertId);
      
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      if (alert.isResolved) {
        throw new Error(`Alert already resolved: ${alertId}`);
      }

      alert.isResolved = true;
      alert.resolvedAt = new Date();

      // Persist to database
      await rhyPrisma.performanceAlert.updateMany({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy
        }
      });

      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'resolveAlert',
        duration,
        success: true,
        metadata: { 
          alertId,
          resolvedBy,
          severity: alert.severity
        }
      });

      logger.info('Alert resolved', {
        alertId,
        resolvedBy,
        resolvedAt: alert.resolvedAt,
        severity: alert.severity
      });

    } catch (error) {
      const duration = performance.now() - startTime;

      await this.recordMetric({
        operation: 'resolveAlert',
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async storeMetricInMemory(metric: PerformanceSnapshot): Promise<void> {
    const key = `${metric.service}_${metric.operation}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const systemMetric: SystemMetric = {
      name: metric.operation,
      value: metric.duration,
      unit: 'ms',
      timestamp: metric.timestamp,
      tags: {
        service: metric.service,
        success: metric.success.toString(),
        warehouseId: metric.warehouseId || 'global'
      }
    };

    const metrics = this.metrics.get(key)!;
    metrics.push(systemMetric);

    // Keep only last 1000 metrics per key for memory management
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  private async persistMetricToDatabase(metric: PerformanceSnapshot): Promise<void> {
    try {
      await rhyPrisma.realtimeMetric.create({
        data: {
          warehouseId: metric.warehouseId || 'GLOBAL',
          metricName: metric.operation,
          value: metric.duration,
          unit: 'ms',
          timestamp: metric.timestamp
        }
      });
    } catch (error) {
      logger.error('Failed to persist metric to database', {
        metric: metric.operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async evaluateAlertRules(metric: PerformanceSnapshot): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check if rule applies to this metric
      if (rule.metric !== metric.operation) continue;
      if (rule.warehouseId && rule.warehouseId !== metric.warehouseId) continue;

      const shouldAlert = this.evaluateCondition(
        metric.duration,
        rule.condition,
        rule.threshold
      );

      if (shouldAlert) {
        await this.createAlert(rule, metric.duration, metric);
      }
    }
  }

  private evaluateCondition(
    value: number,
    condition: 'gt' | 'lt' | 'eq' | 'between',
    threshold: number | [number, number]
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > (threshold as number);
      case 'lt':
        return value < (threshold as number);
      case 'eq':
        return Math.abs(value - (threshold as number)) < 0.001;
      case 'between':
        const [min, max] = threshold as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  private async createAlert(
    rule: AlertRule,
    currentValue: number,
    metric: PerformanceSnapshot
  ): Promise<void> {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(a => 
      a.ruleId === rule.id && 
      !a.isResolved &&
      a.warehouseId === metric.warehouseId
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      message: `${rule.name}: ${metric.operation} (${currentValue}${currentValue < 1000 ? 'ms' : 'ms'}) exceeded threshold (${rule.threshold})`,
      severity: rule.severity,
      warehouseId: metric.warehouseId,
      currentValue,
      threshold: rule.threshold,
      isResolved: false,
      createdAt: new Date()
    };

    this.alerts.push(alert);

    // Persist to database
    try {
      await rhyPrisma.performanceAlert.create({
        data: {
          warehouseId: alert.warehouseId || 'GLOBAL',
          metricType: metric.operation,
          alertType: 'THRESHOLD_EXCEEDED',
          severity: alert.severity.toUpperCase(),
          message: alert.message,
          threshold: typeof rule.threshold === 'number' ? rule.threshold : rule.threshold[0],
          currentValue: alert.currentValue,
          isResolved: false
        }
      });
    } catch (error) {
      logger.error('Failed to persist alert to database', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    logger.warn('Performance alert created', {
      alertId: alert.id,
      rule: rule.name,
      metric: metric.operation,
      currentValue,
      threshold: rule.threshold,
      severity: alert.severity,
      warehouseId: metric.warehouseId
    });
  }

  private async updateSystemMetrics(metric: PerformanceSnapshot): Promise<void> {
    // Update response time metrics
    await this.updateMetricAverage('avg_response_time', metric.duration, metric.warehouseId);

    // Update error rate
    const errorRate = metric.success ? 0 : 1;
    await this.updateMetricAverage('error_rate', errorRate, metric.warehouseId);

    // Update throughput
    await this.incrementMetric('throughput', metric.warehouseId);
  }

  private async updateMetricAverage(
    metricName: string,
    newValue: number,
    warehouseId?: string
  ): Promise<void> {
    const key = `${metricName}_${warehouseId || 'global'}`;
    const existing = this.metrics.get(key) || [];
    
    const metric: SystemMetric = {
      name: metricName,
      value: newValue,
      unit: metricName === 'avg_response_time' ? 'ms' : '%',
      timestamp: new Date(),
      tags: { warehouseId: warehouseId || 'global' }
    };

    existing.push(metric);
    this.metrics.set(key, existing);

    // Persist to database
    try {
      await rhyPrisma.realtimeMetric.create({
        data: {
          warehouseId: warehouseId || 'GLOBAL',
          metricName,
          value: newValue,
          unit: metric.unit,
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Log but don't throw to avoid breaking main flow
      logger.error('Failed to persist system metric', {
        metricName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async incrementMetric(metricName: string, warehouseId?: string): Promise<void> {
    const key = `${metricName}_${warehouseId || 'global'}`;
    const existing = this.metrics.get(key) || [];
    
    const lastMetric = existing[existing.length - 1];
    const newValue = (lastMetric?.value || 0) + 1;

    const metric: SystemMetric = {
      name: metricName,
      value: newValue,
      unit: 'count',
      timestamp: new Date(),
      tags: { warehouseId: warehouseId || 'global' }
    };

    existing.push(metric);
    this.metrics.set(key, existing);
  }

  private calculateThroughputTrend(
    metrics: any[],
    timeRange: { start: Date; end: Date }
  ): Array<{ timestamp: Date; value: number }> {
    const buckets = 24; // 24 hour buckets
    const bucketSize = (timeRange.end.getTime() - timeRange.start.getTime()) / buckets;
    const trend: Array<{ timestamp: Date; value: number }> = [];

    for (let i = 0; i < buckets; i++) {
      const bucketStart = new Date(timeRange.start.getTime() + i * bucketSize);
      const bucketEnd = new Date(bucketStart.getTime() + bucketSize);
      
      const bucketMetrics = metrics.filter(m => 
        m.timestamp >= bucketStart && m.timestamp < bucketEnd
      );

      trend.push({
        timestamp: bucketStart,
        value: bucketMetrics.length
      });
    }

    return trend;
  }

  private initializeDefaultAlertRules(): void {
    // API Response Time Alert
    this.alertRules.push({
      id: 'default_response_time',
      name: 'High API Response Time',
      metric: 'api_request',
      condition: 'gt',
      threshold: 100, // 100ms threshold
      severity: 'high',
      enabled: true,
      notificationChannels: ['email', 'slack']
    });

    // Database Query Alert
    this.alertRules.push({
      id: 'default_db_query_time',
      name: 'Slow Database Query',
      metric: 'database_query',
      condition: 'gt',
      threshold: 50, // 50ms threshold
      severity: 'medium',
      enabled: true,
      notificationChannels: ['email']
    });

    // Error Rate Alert
    this.alertRules.push({
      id: 'default_error_rate',
      name: 'High Error Rate',
      metric: 'error_rate',
      condition: 'gt',
      threshold: 5, // 5% error rate
      severity: 'critical',
      enabled: true,
      notificationChannels: ['email', 'slack', 'pagerduty']
    });

    // Warehouse Sync Alert
    this.alertRules.push({
      id: 'default_warehouse_sync',
      name: 'Warehouse Sync Delay',
      metric: 'warehouse_sync',
      condition: 'gt',
      threshold: 1000, // 1 second
      severity: 'high',
      enabled: true,
      notificationChannels: ['email', 'slack']
    });
  }

  private startPeriodicHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      await this.runHealthChecks();
    }, 30000);

    // Initial health check
    this.runHealthChecks().catch(error => {
      logger.error('Initial health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
  }

  private async runHealthChecks(): Promise<void> {
    const services = [
      'database',
      'authentication',
      'warehouse_service',
      'inventory_service',
      'order_service',
      'analytics_service'
    ];

    for (const service of services) {
      try {
        const result = await this.performHealthCheck(service);
        this.healthChecks.set(service, result);
      } catch (error) {
        const errorResult: HealthCheckResult = {
          service,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date()
        };
        this.healthChecks.set(service, errorResult);
      }
    }
  }

  private async performHealthCheck(service: string): Promise<HealthCheckResult> {
    const startTime = performance.now();

    switch (service) {
      case 'database':
        try {
          await rhyPrisma.$queryRaw`SELECT 1`;
          const responseTime = performance.now() - startTime;
          return {
            service,
            status: responseTime < 50 ? 'healthy' : 'degraded',
            responseTime,
            uptime: 100,
            timestamp: new Date()
          };
        } catch (error) {
          return {
            service,
            status: 'unhealthy',
            responseTime: performance.now() - startTime,
            message: 'Database connection failed',
            timestamp: new Date()
          };
        }

      case 'authentication':
        // Mock auth service health check
        const authResponseTime = performance.now() - startTime + Math.random() * 20;
        return {
          service,
          status: authResponseTime < 100 ? 'healthy' : 'degraded',
          responseTime: authResponseTime,
          uptime: 99.9,
          timestamp: new Date()
        };

      case 'warehouse_service':
        // Mock warehouse service health check
        const warehouseResponseTime = performance.now() - startTime + Math.random() * 30;
        return {
          service,
          status: warehouseResponseTime < 150 ? 'healthy' : 'degraded',
          responseTime: warehouseResponseTime,
          uptime: 99.8,
          timestamp: new Date()
        };

      default:
        // Default mock health check
        const defaultResponseTime = performance.now() - startTime + Math.random() * 25;
        return {
          service,
          status: defaultResponseTime < 100 ? 'healthy' : 'degraded',
          responseTime: defaultResponseTime,
          uptime: 99.5,
          timestamp: new Date()
        };
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Export convenience functions for common use cases
export async function recordMetric(metric: {
  operation: string;
  duration?: number;
  success: boolean;
  warehouseId?: string;
  userId?: string;
  error?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  return monitoringService.recordMetric(metric);
}

export async function getSystemHealth() {
  return monitoringService.getSystemHealth();
}

export async function getWarehouseMetrics(
  warehouseId: string,
  timeRange: { start: Date; end: Date }
) {
  return monitoringService.getWarehouseMetrics(warehouseId, timeRange);
}

export async function getActiveAlerts(filters?: {
  warehouseId?: string;
  severity?: string[];
  resolved?: boolean;
}) {
  return monitoringService.getActiveAlerts(filters);
}

// Performance monitoring decorator
export function monitored(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        const duration = performance.now() - startTime;
        
        // Record metric asynchronously to avoid blocking
        recordMetric({
          operation,
          duration,
          success,
          error
        }).catch(recordError => {
          logger.error('Failed to record performance metric', {
            operation,
            duration,
            success,
            error: recordError instanceof Error ? recordError.message : 'Unknown error'
          });
        });
      }
    };

    return descriptor;
  };
}