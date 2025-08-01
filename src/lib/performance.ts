// RHY_030: Performance Monitoring - Enterprise Performance Tracking
// High-performance monitoring system for real-time operations
// Target: <100ms overhead, comprehensive metrics collection

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  category?: 'api' | 'database' | 'realtime' | 'websocket' | 'notification';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
}

/**
 * Enterprise-grade performance monitoring service
 * Tracks metrics with minimal overhead for production use
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory
  private isEnabled = true;

  constructor() {
    // Initialize with environment-based configuration
    this.isEnabled = process.env.NODE_ENV !== 'test';
    
    // Periodic cleanup to prevent memory leaks
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  }

  /**
   * Track a performance metric
   */
  track(name: string, data: {
    duration?: number;
    metadata?: Record<string, any>;
    category?: 'api' | 'database' | 'realtime' | 'websocket' | 'notification';
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    if (!this.isEnabled) return;

    try {
      const metric: PerformanceMetric = {
        name,
        duration: data.duration || 0,
        timestamp: new Date(),
        metadata: data.metadata,
        category: data.category || 'api',
        severity: data.severity || 'low'
      };

      this.metrics.push(metric);

      // Log critical performance issues
      if (data.severity === 'critical' || (data.duration && data.duration > 5000)) {
        console.warn(`Performance warning: ${name} took ${data.duration}ms`, data.metadata);
      }

      // Prevent memory overflow
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }

    } catch (error) {
      // Silent fail to prevent monitoring from breaking application
      console.debug('Performance tracking error:', error);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(category?: string, timeRange?: number): PerformanceStats {
    try {
      let relevantMetrics = this.metrics;

      // Filter by category if specified
      if (category) {
        relevantMetrics = relevantMetrics.filter(m => m.category === category);
      }

      // Filter by time range if specified (in milliseconds)
      if (timeRange) {
        const cutoff = new Date(Date.now() - timeRange);
        relevantMetrics = relevantMetrics.filter(m => m.timestamp >= cutoff);
      }

      if (relevantMetrics.length === 0) {
        return {
          totalRequests: 0,
          averageResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          errorRate: 0,
          throughput: 0
        };
      }

      const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
      const errors = relevantMetrics.filter(m => m.severity === 'critical').length;
      
      // Calculate percentiles
      const p95Index = Math.floor(durations.length * 0.95);
      const p99Index = Math.floor(durations.length * 0.99);

      // Calculate throughput (requests per second)
      const timeSpan = timeRange ? timeRange / 1000 : 60; // Default to 1 minute
      const throughput = relevantMetrics.length / timeSpan;

      return {
        totalRequests: relevantMetrics.length,
        averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95ResponseTime: durations[p95Index] || 0,
        p99ResponseTime: durations[p99Index] || 0,
        errorRate: (errors / relevantMetrics.length) * 100,
        throughput
      };

    } catch (error) {
      console.debug('Error calculating performance stats:', error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }
  }

  /**
   * Get recent metrics for debugging
   */
  getRecentMetrics(count: number = 10, category?: string): PerformanceMetric[] {
    try {
      let metrics = this.metrics.slice(-count);
      
      if (category) {
        metrics = metrics.filter(m => m.category === category);
      }

      return metrics;
    } catch (error) {
      console.debug('Error getting recent metrics:', error);
      return [];
    }
  }

  /**
   * Clear all stored metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get health check information
   */
  getHealthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      totalMetrics: number;
      memoryUsage: number;
      recentErrors: number;
      averageResponseTime: number;
    };
  } {
    try {
      const recentStats = this.getStats(undefined, 300000); // Last 5 minutes
      const recentErrors = this.metrics
        .filter(m => m.timestamp >= new Date(Date.now() - 300000))
        .filter(m => m.severity === 'critical').length;

      const memoryUsage = this.metrics.length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (recentStats.averageResponseTime > 1000 || recentStats.errorRate > 5) {
        status = 'degraded';
      }
      
      if (recentStats.averageResponseTime > 2000 || recentStats.errorRate > 10) {
        status = 'unhealthy';
      }

      return {
        status,
        metrics: {
          totalMetrics: this.metrics.length,
          memoryUsage,
          recentErrors,
          averageResponseTime: recentStats.averageResponseTime
        }
      };

    } catch (error) {
      console.debug('Error getting health check:', error);
      return {
        status: 'unhealthy',
        metrics: {
          totalMetrics: 0,
          memoryUsage: 0,
          recentErrors: 0,
          averageResponseTime: 0
        }
      };
    }
  }

  /**
   * Create a performance timer for measuring execution time
   */
  createTimer(name: string, metadata?: Record<string, any>): {
    stop: (additionalMetadata?: Record<string, any>) => void;
  } {
    const startTime = Date.now();
    
    return {
      stop: (additionalMetadata?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        this.track(name, {
          duration,
          metadata: { ...metadata, ...additionalMetadata },
          severity: duration > 1000 ? 'high' : duration > 500 ? 'medium' : 'low'
        });
      }
    };
  }

  /**
   * Wrap an async function with performance monitoring
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    name: string,
    fn: T,
    metadata?: Record<string, any>
  ): T {
    return ((...args: any[]) => {
      const timer = this.createTimer(name, metadata);
      
      return fn(...args)
        .then((result: any) => {
          timer.stop({ success: true });
          return result;
        })
        .catch((error: any) => {
          timer.stop({ success: false, error: error.message });
          throw error;
        });
    }) as T;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    try {
      if (format === 'prometheus') {
        return this.toPrometheusFormat();
      }
      
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        metrics: this.metrics.slice(-100), // Last 100 metrics
        stats: this.getStats(),
        health: this.getHealthCheck()
      }, null, 2);

    } catch (error) {
      console.debug('Error exporting metrics:', error);
      return '{}';
    }
  }

  private cleanup(): void {
    // Remove metrics older than 1 hour
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  private toPrometheusFormat(): string {
    const stats = this.getStats();
    
    return `
# HELP rhy_warehouse_requests_total Total number of requests
# TYPE rhy_warehouse_requests_total counter
rhy_warehouse_requests_total ${stats.totalRequests}

# HELP rhy_warehouse_response_time_avg Average response time in milliseconds
# TYPE rhy_warehouse_response_time_avg gauge
rhy_warehouse_response_time_avg ${stats.averageResponseTime}

# HELP rhy_warehouse_response_time_p95 95th percentile response time
# TYPE rhy_warehouse_response_time_p95 gauge
rhy_warehouse_response_time_p95 ${stats.p95ResponseTime}

# HELP rhy_warehouse_error_rate Error rate percentage
# TYPE rhy_warehouse_error_rate gauge
rhy_warehouse_error_rate ${stats.errorRate}

# HELP rhy_warehouse_throughput Requests per second
# TYPE rhy_warehouse_throughput gauge
rhy_warehouse_throughput ${stats.throughput}
`.trim();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for testing and advanced usage
export { PerformanceMonitor, type PerformanceMetric, type PerformanceStats };