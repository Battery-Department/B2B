/**
 * Health Monitor Service
 * Monitors the health of all Lithi ecosystem services
 */

import { lithiGateway } from '@/services/api-gateway'
import { eventBus, EventTypes } from '@/services/events/event-bus'
import { prisma } from '@/lib/prisma'

interface ServiceHealth {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastCheck: Date
  errorRate: number
  uptime: number
  message?: string
}

interface HealthMetrics {
  totalRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
}

export class HealthMonitor {
  private services = ['dashboard', 'chatbot', 'copilot']
  private checkInterval = 60000 // 1 minute
  private degradedThreshold = 500 // 500ms response time
  private errorThreshold = 0.05 // 5% error rate
  private isMonitoring = false
  private metrics: Map<string, HealthMetrics> = new Map()

  constructor() {
    this.initializeMetrics()
  }

  private initializeMetrics(): void {
    this.services.forEach(service => {
      this.metrics.set(service, {
        totalRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      })
    })
  }

  // Start monitoring
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    console.log('Health monitoring started')
    
    // Initial check
    await this.checkAllServices()
    
    // Schedule periodic checks
    setInterval(async () => {
      if (this.isMonitoring) {
        await this.checkAllServices()
      }
    }, this.checkInterval)
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false
    console.log('Health monitoring stopped')
  }

  // Check all services
  private async checkAllServices(): Promise<void> {
    const healthChecks = await Promise.allSettled(
      this.services.map(service => this.checkService(service))
    )

    const results = healthChecks.map((result, index) => {
      const service = this.services[index]
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          service,
          status: 'down' as const,
          responseTime: -1,
          lastCheck: new Date(),
          errorRate: 1,
          uptime: 0,
          message: result.reason.message
        }
      }
    })

    // Store results in database
    await this.storeHealthResults(results)
    
    // Emit health status event
    eventBus.publish(EventTypes.SYSTEM_UPDATE, {
      type: 'health_check',
      services: results
    })

    // Check for alerts
    await this.checkAlerts(results)
  }

  // Check individual service
  private async checkService(service: string): Promise<ServiceHealth> {
    const startTime = Date.now()
    const metrics = this.metrics.get(service)!
    
    try {
      let response: any
      
      switch (service) {
        case 'dashboard':
          response = await fetch('/api/health')
          break
        case 'chatbot':
          response = await lithiGateway.getChatHistory('health-check')
          break
        case 'copilot':
          response = await lithiGateway.getCopilotSuggestions({ test: true })
          break
      }

      const responseTime = Date.now() - startTime
      
      // Update metrics
      metrics.totalRequests++
      metrics.averageResponseTime = 
        (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / 
        metrics.totalRequests

      const errorRate = metrics.failedRequests / metrics.totalRequests
      const uptime = 1 - errorRate

      // Determine status
      let status: 'healthy' | 'degraded' | 'down' = 'healthy'
      if (errorRate > this.errorThreshold) {
        status = 'down'
      } else if (responseTime > this.degradedThreshold) {
        status = 'degraded'
      }

      return {
        service,
        status,
        responseTime,
        lastCheck: new Date(),
        errorRate,
        uptime,
        message: 'Service is operational'
      }
    } catch (error: any) {
      // Update failure metrics
      metrics.totalRequests++
      metrics.failedRequests++
      
      return {
        service,
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorRate: metrics.failedRequests / metrics.totalRequests,
        uptime: 1 - (metrics.failedRequests / metrics.totalRequests),
        message: error.message
      }
    }
  }

  // Store health results in database
  private async storeHealthResults(results: ServiceHealth[]): Promise<void> {
    try {
      await Promise.all(
        results.map(result => 
          prisma.systemHealth.upsert({
            where: { service: result.service },
            update: {
              status: result.status,
              responseTime: result.responseTime,
              errorRate: result.errorRate,
              uptime: result.uptime,
              lastCheck: result.lastCheck,
              message: result.message,
              metadata: this.metrics.get(result.service) ? {
                metrics: JSON.parse(JSON.stringify(this.metrics.get(result.service)))
              } : undefined
            },
            create: {
              service: result.service,
              status: result.status,
              responseTime: result.responseTime,
              errorRate: result.errorRate,
              uptime: result.uptime,
              lastCheck: result.lastCheck,
              nextCheck: new Date(Date.now() + this.checkInterval),
              message: result.message,
              metadata: this.metrics.get(result.service) ? {
                metrics: JSON.parse(JSON.stringify(this.metrics.get(result.service)))
              } : undefined
            }
          })
        )
      )
    } catch (error) {
      console.error('Failed to store health results:', error)
    }
  }

  // Check for alerts
  private async checkAlerts(results: ServiceHealth[]): Promise<void> {
    for (const result of results) {
      if (result.status === 'down') {
        await this.sendAlert({
          service: result.service,
          status: result.status,
          message: `Service ${result.service} is down: ${result.message}`,
          severity: 'critical'
        })
      } else if (result.status === 'degraded') {
        await this.sendAlert({
          service: result.service,
          status: result.status,
          message: `Service ${result.service} is degraded: Response time ${result.responseTime}ms`,
          severity: 'warning'
        })
      }
    }
  }

  // Send alert
  private async sendAlert(alert: {
    service: string
    status: string
    message: string
    severity: 'warning' | 'critical'
  }): Promise<void> {
    // Emit alert event
    eventBus.publish(EventTypes.SYSTEM_ERROR, alert)
    
    // Send notifications
    try {
      await prisma.notification.create({
        data: {
          userId: 'system', // System notifications
          type: 'system',
          title: `${alert.severity.toUpperCase()}: ${alert.service} ${alert.status}`,
          message: alert.message,
          priority: alert.severity === 'critical' ? 'critical' : 'high',
          channel: 'email',
          metadata: alert
        }
      })
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  // Get current health status
  async getHealthStatus(): Promise<ServiceHealth[]> {
    try {
      const healthData = await prisma.systemHealth.findMany({
        where: {
          service: { in: this.services }
        }
      })

      return healthData.map(data => ({
        service: data.service,
        status: data.status as 'healthy' | 'degraded' | 'down',
        responseTime: data.responseTime || 0,
        lastCheck: data.lastCheck,
        errorRate: data.errorRate || 0,
        uptime: data.uptime || 0,
        message: data.message || undefined
      }))
    } catch (error) {
      console.error('Failed to get health status:', error)
      return []
    }
  }

  // Get health metrics
  getMetrics(service: string): HealthMetrics | undefined {
    return this.metrics.get(service)
  }

  // Get overall system health
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    services: ServiceHealth[]
    metrics: {
      totalUptime: number
      averageResponseTime: number
      errorRate: number
    }
  }> {
    const services = await this.getHealthStatus()
    
    // Calculate overall metrics
    const totalUptime = services.reduce((sum, s) => sum + s.uptime, 0) / services.length
    const averageResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length
    const errorRate = services.reduce((sum, s) => sum + s.errorRate, 0) / services.length
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (services.some(s => s.status === 'down')) {
      overallStatus = 'down'
    } else if (services.some(s => s.status === 'degraded')) {
      overallStatus = 'degraded'
    }
    
    return {
      status: overallStatus,
      services,
      metrics: {
        totalUptime,
        averageResponseTime,
        errorRate
      }
    }
  }

  // Test service endpoint
  async testEndpoint(url: string, method: string = 'GET'): Promise<{
    success: boolean
    responseTime: number
    statusCode?: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const responseTime = Date.now() - startTime
      
      return {
        success: response.ok,
        responseTime,
        statusCode: response.status
      }
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      }
    }
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor()

// Start monitoring on import (if in browser)
if (typeof window !== 'undefined') {
  healthMonitor.startMonitoring().catch(console.error)
}