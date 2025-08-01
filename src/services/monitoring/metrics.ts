export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels?: string[];
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export class MetricsCollector {
  private metrics: Map<string, any> = new Map();
  private alerts: Map<string, Alert> = new Map();

  // Event tracking metrics
  readonly eventMetrics = {
    totalEvents: this.createCounter('crm_events_total', 'Total events tracked'),
    eventsByType: this.createCounter('crm_events_by_type', 'Events by type', ['event_type']),
    failedEvents: this.createCounter('crm_events_failed', 'Failed event tracking'),
    eventProcessingTime: this.createHistogram('crm_event_processing_ms', 'Event processing time')
  };

  // API metrics
  readonly apiMetrics = {
    requestsTotal: this.createCounter('api_requests_total', 'Total API requests', ['endpoint', 'method']),
    requestDuration: this.createHistogram('api_request_duration_ms', 'API request duration', ['endpoint']),
    requestErrors: this.createCounter('api_request_errors', 'API request errors', ['endpoint', 'error_code']),
    activeConnections: this.createGauge('api_active_connections', 'Active API connections')
  };

  // Queue metrics
  readonly queueMetrics = {
    queueSize: this.createGauge('queue_size', 'Current queue size', ['queue_name']),
    queueProcessed: this.createCounter('queue_processed_total', 'Total items processed', ['queue_name']),
    queueFailed: this.createCounter('queue_failed_total', 'Failed queue items', ['queue_name']),
    queueLatency: this.createHistogram('queue_processing_latency_ms', 'Queue processing latency')
  };

  // Performance metrics
  readonly performanceMetrics = {
    pageLoadTime: this.createHistogram('page_load_time_ms', 'Page load time', ['page']),
    renderTime: this.createHistogram('render_time_ms', 'Component render time', ['component']),
    memoryUsage: this.createGauge('memory_usage_mb', 'Memory usage in MB'),
    cpuUsage: this.createGauge('cpu_usage_percent', 'CPU usage percentage')
  };

  private createCounter(name: string, help: string, labels?: string[]) {
    const metric = {
      name,
      help,
      labels: labels || [],
      value: 0,
      inc: (val: number = 1, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues);
        const current = this.metrics.get(key) || 0;
        this.metrics.set(key, current + val);
        this.checkThresholds(name, current + val);
      }
    };
    return metric;
  }

  private createGauge(name: string, help: string, labels?: string[]) {
    const metric = {
      name,
      help,
      labels: labels || [],
      value: 0,
      set: (val: number, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues);
        this.metrics.set(key, val);
        this.checkThresholds(name, val);
      },
      inc: (val: number = 1, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues);
        const current = this.metrics.get(key) || 0;
        this.metrics.set(key, current + val);
        this.checkThresholds(name, current + val);
      },
      dec: (val: number = 1, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues);
        const current = this.metrics.get(key) || 0;
        this.metrics.set(key, Math.max(0, current - val));
      }
    };
    return metric;
  }

  private createHistogram(name: string, help: string, labels?: string[]) {
    const metric = {
      name,
      help,
      labels: labels || [],
      observe: (val: number, labelValues?: Record<string, string>) => {
        const key = this.getMetricKey(name, labelValues);
        const current = this.metrics.get(key) || [];
        current.push(val);
        this.metrics.set(key, current);
        
        // Calculate percentiles
        if (current.length > 100) {
          const sorted = current.sort((a: number, b: number) => a - b);
          const p50 = sorted[Math.floor(sorted.length * 0.5)];
          const p95 = sorted[Math.floor(sorted.length * 0.95)];
          const p99 = sorted[Math.floor(sorted.length * 0.99)];
          
          this.metrics.set(`${key}_p50`, p50);
          this.metrics.set(`${key}_p95`, p95);
          this.metrics.set(`${key}_p99`, p99);
          
          // Keep only recent values
          this.metrics.set(key, current.slice(-1000));
        }
      }
    };
    return metric;
  }

  private getMetricKey(name: string, labelValues?: Record<string, string>): string {
    if (!labelValues) return name;
    const labels = Object.entries(labelValues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labels}}`;
  }

  private checkThresholds(metricName: string, value: number) {
    const alert = this.alerts.get(metricName);
    if (!alert) return;

    if (alert.threshold.critical && value >= alert.threshold.critical) {
      this.triggerAlert(metricName, 'critical', value);
    } else if (alert.threshold.warning && value >= alert.threshold.warning) {
      this.triggerAlert(metricName, 'warning', value);
    }
  }

  private triggerAlert(metricName: string, severity: 'warning' | 'critical', value: number) {
    const alert = this.alerts.get(metricName);
    if (!alert) return;

    console.error(`[ALERT] ${severity.toUpperCase()}: ${alert.description} - ${metricName} = ${value}`);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/monitoring/alert', JSON.stringify({
        metric: metricName,
        severity,
        value,
        timestamp: new Date().toISOString()
      }));
    }
  }

  defineAlert(alert: Alert) {
    this.alerts.set(alert.metric, alert);
  }

  // Get all metrics for export
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Reset all metrics
  reset() {
    this.metrics.clear();
  }
}

interface Alert {
  metric: string;
  description: string;
  threshold: {
    warning?: number;
    critical?: number;
  };
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Define alerts
metrics.defineAlert({
  metric: 'crm_events_failed',
  description: 'High number of failed events',
  threshold: { warning: 100, critical: 500 }
});

metrics.defineAlert({
  metric: 'api_request_errors',
  description: 'High API error rate',
  threshold: { warning: 50, critical: 200 }
});

metrics.defineAlert({
  metric: 'queue_size',
  description: 'Queue size too large',
  threshold: { warning: 1000, critical: 5000 }
});

metrics.defineAlert({
  metric: 'memory_usage_mb',
  description: 'High memory usage',
  threshold: { warning: 512, critical: 1024 }
});

// Helper functions for easy metric tracking
export function trackEvent(eventName: string, success: boolean = true) {
  metrics.eventMetrics.totalEvents.inc();
  metrics.eventMetrics.eventsByType.inc(1, { event_type: eventName });
  if (!success) {
    metrics.eventMetrics.failedEvents.inc();
  }
}

export function trackApiCall(endpoint: string, method: string, duration: number, error?: string) {
  metrics.apiMetrics.requestsTotal.inc(1, { endpoint, method });
  metrics.apiMetrics.requestDuration.observe(duration, { endpoint });
  if (error) {
    metrics.apiMetrics.requestErrors.inc(1, { endpoint, error_code: error });
  }
}

export function trackQueueMetrics(queueName: string, action: 'enqueue' | 'process' | 'fail', latency?: number) {
  switch (action) {
    case 'enqueue':
      metrics.queueMetrics.queueSize.inc(1, { queue_name: queueName });
      break;
    case 'process':
      metrics.queueMetrics.queueSize.dec(1, { queue_name: queueName });
      metrics.queueMetrics.queueProcessed.inc(1, { queue_name: queueName });
      if (latency) {
        metrics.queueMetrics.queueLatency.observe(latency);
      }
      break;
    case 'fail':
      metrics.queueMetrics.queueSize.dec(1, { queue_name: queueName });
      metrics.queueMetrics.queueFailed.inc(1, { queue_name: queueName });
      break;
  }
}

export function trackPerformance(metric: 'pageLoad' | 'render', value: number, label?: string) {
  if (metric === 'pageLoad') {
    metrics.performanceMetrics.pageLoadTime.observe(value, { page: label || 'unknown' });
  } else if (metric === 'render') {
    metrics.performanceMetrics.renderTime.observe(value, { component: label || 'unknown' });
  }
}

// Auto-collect browser metrics
if (typeof window !== 'undefined') {
  // Track page load time
  window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      trackPerformance('pageLoad', loadTime, window.location.pathname);
    }
  });

  // Track memory usage
  setInterval(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.performanceMetrics.memoryUsage.set(
        Math.round(memory.usedJSHeapSize / 1048576)
      );
    }
  }, 30000); // Every 30 seconds
}

// Export metrics endpoint data
export function getMetricsForExport(): string {
  const allMetrics = metrics.getAllMetrics();
  const lines: string[] = [];

  Object.entries(allMetrics).forEach(([key, value]) => {
    if (typeof value === 'number') {
      lines.push(`${key} ${value}`);
    }
  });

  return lines.join('\n');
}