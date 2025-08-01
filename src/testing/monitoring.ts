export interface TestMetrics {
  testSuite: string
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  retries: number
  error?: string
  timestamp: Date
  environment: string
  browser?: string
  viewport?: string
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskSpace: number
  networkLatency: number
  activeConnections: number
}

export interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
}

export interface Alert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: 'test_failure' | 'performance' | 'system' | 'security'
  message: string
  details: any
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

export class TestMonitoring {
  private metrics: TestMetrics[] = []
  private alerts: Alert[] = []
  private webhookUrl?: string
  private slackWebhook?: string
  private emailRecipients: string[] = []

  constructor(config?: {
    webhookUrl?: string
    slackWebhook?: string
    emailRecipients?: string[]
  }) {
    this.webhookUrl = config?.webhookUrl
    this.slackWebhook = config?.slackWebhook
    this.emailRecipients = config?.emailRecipients || []
  }

  async recordTestMetric(metric: TestMetrics) {
    this.metrics.push(metric)
    
    // Check for critical failures
    if (metric.status === 'failed' && metric.retries >= 3) {
      await this.createAlert({
        severity: 'critical',
        type: 'test_failure',
        message: `Critical test failure: ${metric.testSuite} - ${metric.testName}`,
        details: {
          testSuite: metric.testSuite,
          testName: metric.testName,
          error: metric.error,
          retries: metric.retries,
          environment: metric.environment
        }
      })
    }
    
    // Check for performance degradation
    if (metric.duration > 30000) { // 30 seconds
      await this.createAlert({
        severity: 'high',
        type: 'performance',
        message: `Slow test execution: ${metric.testSuite} - ${metric.testName}`,
        details: {
          duration: metric.duration,
          testName: metric.testName,
          threshold: 30000
        }
      })
    }
  }

  async recordSystemMetrics(metrics: SystemMetrics) {
    // Check system health thresholds
    if (metrics.cpuUsage > 90) {
      await this.createAlert({
        severity: 'high',
        type: 'system',
        message: 'High CPU usage detected during testing',
        details: { cpuUsage: metrics.cpuUsage, threshold: 90 }
      })
    }
    
    if (metrics.memoryUsage > 85) {
      await this.createAlert({
        severity: 'medium',
        type: 'system',
        message: 'High memory usage detected during testing',
        details: { memoryUsage: metrics.memoryUsage, threshold: 85 }
      })
    }
    
    if (metrics.diskSpace < 10) {
      await this.createAlert({
        severity: 'critical',
        type: 'system',
        message: 'Low disk space detected',
        details: { diskSpace: metrics.diskSpace, threshold: 10 }
      })
    }
  }

  async recordPerformanceMetrics(metrics: PerformanceMetrics, page: string) {
    const thresholds = {
      pageLoadTime: 3000,
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
      timeToInteractive: 3800
    }
    
    Object.entries(thresholds).forEach(async ([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics]
      
      if (metric === 'cumulativeLayoutShift') {
        if (value > threshold) {
          await this.createAlert({
            severity: 'medium',
            type: 'performance',
            message: `High ${metric} on ${page}`,
            details: { metric, value, threshold, page }
          })
        }
      } else if (value > threshold) {
        await this.createAlert({
          severity: 'medium',
          type: 'performance',
          message: `Poor ${metric} performance on ${page}`,
          details: { metric, value, threshold, page }
        })
      }
    })
  }

  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      ...alertData
    }
    
    this.alerts.push(alert)
    
    // Send notifications
    await this.sendNotifications(alert)
    
    return alert
  }

  private async sendNotifications(alert: Alert) {
    const promises = []
    
    // Webhook notification
    if (this.webhookUrl) {
      promises.push(this.sendWebhook(alert))
    }
    
    // Slack notification
    if (this.slackWebhook && alert.severity in ['critical', 'high']) {
      promises.push(this.sendSlackNotification(alert))
    }
    
    // Email notification for critical alerts
    if (this.emailRecipients.length > 0 && alert.severity === 'critical') {
      promises.push(this.sendEmailNotification(alert))
    }
    
    await Promise.allSettled(promises)
  }

  private async sendWebhook(alert: Alert) {
    try {
      await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test_alert',
          alert,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send webhook:', error)
    }
  }

  private async sendSlackNotification(alert: Alert) {
    const color = {
      critical: '#ff0000',
      high: '#ff6600',
      medium: '#ffaa00',
      low: '#00aa00'
    }[alert.severity]
    
    const payload = {
      attachments: [{
        color,
        title: `🚨 ${alert.severity.toUpperCase()} Alert`,
        text: alert.message,
        fields: [
          { title: 'Type', value: alert.type, short: true },
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true }
        ],
        footer: 'Battery Dashboard Test Monitoring'
      }]
    }
    
    try {
      await fetch(this.slackWebhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
    }
  }

  private async sendEmailNotification(alert: Alert) {
    // This would integrate with an email service
    console.log(`📧 Critical alert email would be sent to: ${this.emailRecipients.join(', ')}`)
    console.log(`Subject: [CRITICAL] ${alert.message}`)
    console.log(`Details:`, alert.details)
  }

  getTestSummary(timeframe?: { start: Date; end: Date }) {
    let filteredMetrics = this.metrics
    
    if (timeframe) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= timeframe.start && m.timestamp <= timeframe.end
      )
    }
    
    const total = filteredMetrics.length
    const passed = filteredMetrics.filter(m => m.status === 'passed').length
    const failed = filteredMetrics.filter(m => m.status === 'failed').length
    const skipped = filteredMetrics.filter(m => m.status === 'skipped').length
    
    const successRate = total > 0 ? (passed / total) * 100 : 0
    const avgDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / total || 0
    
    return {
      total,
      passed,
      failed,
      skipped,
      successRate,
      avgDuration,
      totalDuration: filteredMetrics.reduce((sum, m) => sum + m.duration, 0)
    }
  }

  getFailureAnalysis() {
    const failures = this.metrics.filter(m => m.status === 'failed')
    
    // Group by test suite
    const failuresBySuite = failures.reduce((acc, failure) => {
      if (!acc[failure.testSuite]) acc[failure.testSuite] = []
      acc[failure.testSuite].push(failure)
      return acc
    }, {} as Record<string, TestMetrics[]>)
    
    // Group by error type
    const failuresByError = failures.reduce((acc, failure) => {
      const errorType = failure.error?.split(':')[0] || 'Unknown'
      if (!acc[errorType]) acc[errorType] = []
      acc[errorType].push(failure)
      return acc
    }, {} as Record<string, TestMetrics[]>)
    
    // Find flaky tests (tests that sometimes pass, sometimes fail)
    const testResults = this.metrics.reduce((acc, metric) => {
      const key = `${metric.testSuite}:${metric.testName}`
      if (!acc[key]) acc[key] = []
      acc[key].push(metric.status)
      return acc
    }, {} as Record<string, string[]>)
    
    const flakyTests = Object.entries(testResults)
      .filter(([_, results]) => 
        results.includes('passed') && results.includes('failed')
      )
      .map(([testKey, results]) => ({
        test: testKey,
        passRate: (results.filter(r => r === 'passed').length / results.length) * 100,
        totalRuns: results.length
      }))
    
    return {
      failuresBySuite,
      failuresByError,
      flakyTests,
      topFailures: Object.entries(failuresBySuite)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 10)
    }
  }

  getAlerts(severity?: Alert['severity']) {
    return severity 
      ? this.alerts.filter(a => a.severity === severity)
      : this.alerts
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.resolvedAt = new Date()
    }
  }

  generateReport() {
    const summary = this.getTestSummary()
    const analysis = this.getFailureAnalysis()
    const activeAlerts = this.alerts.filter(a => !a.resolvedAt)
    
    return {
      timestamp: new Date(),
      summary,
      analysis,
      alerts: {
        total: this.alerts.length,
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length
      },
      recommendations: this.generateRecommendations(summary, analysis)
    }
  }

  private generateRecommendations(summary: any, analysis: any) {
    const recommendations = []
    
    if (summary.successRate < 95) {
      recommendations.push({
        type: 'quality',
        message: `Test success rate is ${summary.successRate.toFixed(1)}%. Target is 95%+`,
        action: 'Review and fix failing tests'
      })
    }
    
    if (analysis.flakyTests.length > 0) {
      recommendations.push({
        type: 'reliability',
        message: `Found ${analysis.flakyTests.length} flaky tests`,
        action: 'Investigate and stabilize flaky tests',
        details: analysis.flakyTests.slice(0, 5)
      })
    }
    
    if (summary.avgDuration > 15000) {
      recommendations.push({
        type: 'performance',
        message: `Average test duration is ${(summary.avgDuration / 1000).toFixed(1)}s`,
        action: 'Optimize slow tests or increase parallelization'
      })
    }
    
    const topFailure = analysis.topFailures[0]
    if (topFailure && topFailure[1].length > 5) {
      recommendations.push({
        type: 'focus',
        message: `${topFailure[0]} has ${topFailure[1].length} failures`,
        action: 'Prioritize fixing this test suite'
      })
    }
    
    return recommendations
  }
}

// Export singleton instance
export const testMonitoring = new TestMonitoring({
  webhookUrl: process.env.TEST_WEBHOOK_URL,
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  emailRecipients: process.env.ALERT_EMAILS?.split(',') || []
})

// Cypress plugin integration
export function setupCypressMonitoring() {
  // Hook into Cypress events
  Cypress.on('test:after:run', (test, runnable) => {
    testMonitoring.recordTestMetric({
      testSuite: runnable.parent?.title || 'Unknown',
      testName: runnable.title,
      status: test.state === 'passed' ? 'passed' : 'failed',
      duration: test.duration || 0,
      retries: test.retries || 0,
      error: test.err?.message,
      timestamp: new Date(),
      environment: Cypress.env('environment') || 'test',
      browser: Cypress.browser.name,
      viewport: `${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`
    })
  })
  
  // Record performance metrics
  Cypress.on('window:before:load', (win) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const nav = entry as PerformanceNavigationTiming
          testMonitoring.recordPerformanceMetrics({
            pageLoadTime: nav.loadEventEnd - nav.loadEventStart,
            firstContentfulPaint: 0, // Would need additional measurement
            largestContentfulPaint: 0, // Would need additional measurement
            cumulativeLayoutShift: 0, // Would need additional measurement
            firstInputDelay: 0, // Would need additional measurement
            timeToInteractive: nav.domInteractive - nav.navigationStart
          }, win.location.pathname)
        }
      })
    })
    
    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
  })
}