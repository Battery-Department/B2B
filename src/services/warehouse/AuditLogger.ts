/**
 * RHY Audit Logger - Enterprise-Grade Compliance Audit Trail System
 * Comprehensive audit logging for all warehouse compliance activities
 * Supports regulatory compliance across multiple jurisdictions
 * 
 * Performance Target: <5ms logging operations
 * Compliance: SOX, GDPR, PCI DSS, OSHA audit requirements
 * Retention: 7+ years with automated archival
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { performanceMonitor } from '@/lib/performance'

export interface AuditLogEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  category: 'COMPLIANCE' | 'SECURITY' | 'OPERATIONAL' | 'ADMINISTRATIVE'
  userId: string
  userType: 'SUPPLIER' | 'ADMIN' | 'SYSTEM' | 'EXTERNAL'
  warehouseLocation?: 'US_WEST' | 'JAPAN' | 'EU_GERMANY' | 'AUSTRALIA'
  resource: string
  resourceId?: string
  action: string
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'PENDING'
  details: Record<string, any>
  metadata: AuditMetadata
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  correlationId?: string
  complianceFlags: string[]
  retentionPeriod: number // days
  encryptedData?: string
}

export interface AuditMetadata {
  systemVersion: string
  apiVersion: string
  regulationVersion?: string
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
  jurisdiction: string[]
  complianceFrameworks: string[]
  processingTime?: number
  dataSize?: number
  relatedEntities?: Array<{
    type: string
    id: string
    relationship: string
  }>
  auditTrail: Array<{
    stage: string
    timestamp: Date
    status: string
    details?: Record<string, any>
  }>
}

export type AuditEventType = 
  | 'COMPLIANCE_CHECK'
  | 'REGULATION_VIOLATION'
  | 'VIOLATION_REMEDIATION'
  | 'CERTIFICATE_VALIDATION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'DATA_DELETION'
  | 'EXPORT_RESTRICTED'
  | 'SECURITY_INCIDENT'
  | 'SYSTEM_ACCESS'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'CONFIGURATION_CHANGE'
  | 'POLICY_UPDATE'
  | 'TRAINING_COMPLETION'
  | 'DOCUMENT_ACCESS'
  | 'REPORT_GENERATION'
  | 'BULK_OPERATION'
  | 'API_ACCESS'
  | 'INTEGRATION_EVENT'

export interface ComplianceCheckLog {
  requestId: string
  warehouseLocation: string
  operationType: string
  productType: string
  supplierId: string
  timestamp: Date
  status: 'STARTED' | 'COMPLETED' | 'ERROR'
  result?: {
    compliant: boolean
    riskLevel: string
    violationCount: number
    processingTime: number
  }
  error?: string
}

export interface ViolationRemediationLog {
  violationId: string
  method: 'AUTOMATIC' | 'MANUAL' | 'SYSTEM'
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
  supplierId: string
  timestamp: Date
  details: Record<string, any>
}

export interface SecurityAuditLog {
  eventType: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_ACTIVITY'
  userId: string
  resource: string
  action: string
  result: 'ALLOWED' | 'BLOCKED' | 'FLAGGED'
  riskScore: number
  timestamp: Date
  details: Record<string, any>
}

export interface DataAccessLog {
  dataType: 'PERSONAL' | 'COMMERCIAL' | 'TECHNICAL' | 'FINANCIAL'
  action: 'READ' | 'write' | 'delete' | 'export' | 'share'
  userId: string
  recordCount: number
  purpose: string
  legalBasis?: string
  consentId?: string
  dataSubjects?: string[]
  retention: {
    required: boolean
    period: number
    justification: string
  }
  location: string
  timestamp: Date
}

export class AuditLogger {
  private logQueue: AuditLogEntry[] = []
  private readonly BATCH_SIZE = 100
  private readonly FLUSH_INTERVAL = 5000 // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startBatchProcessor()
  }

  /**
   * Log compliance check activity
   */
  async logComplianceCheck(log: ComplianceCheckLog): Promise<void> {
    const startTime = Date.now()

    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: log.timestamp,
        eventType: 'COMPLIANCE_CHECK',
        severity: log.status === 'ERROR' ? 'ERROR' : 'INFO',
        category: 'COMPLIANCE',
        userId: log.supplierId,
        userType: 'SUPPLIER',
        warehouseLocation: log.warehouseLocation as any,
        resource: 'compliance_check',
        resourceId: log.requestId,
        action: `${log.operationType}_${log.productType}`,
        result: this.mapStatusToResult(log.status),
        details: {
          operationType: log.operationType,
          productType: log.productType,
          result: log.result,
          error: log.error
        },
        metadata: {
          systemVersion: '1.0.0',
          apiVersion: 'v1',
          dataClassification: 'INTERNAL',
          jurisdiction: this.getJurisdictionForWarehouse(log.warehouseLocation),
          complianceFrameworks: this.getApplicableFrameworks(log.warehouseLocation),
          processingTime: Date.now() - startTime,
          auditTrail: [{
            stage: 'compliance_check',
            timestamp: log.timestamp,
            status: log.status,
            details: log.result
          }]
        },
        complianceFlags: this.generateComplianceFlags(log),
        retentionPeriod: this.calculateRetentionPeriod('COMPLIANCE', log.warehouseLocation)
      }

      await this.enqueueAuditEntry(auditEntry)

      performanceMonitor.track('audit_compliance_check', {
        duration: Date.now() - startTime,
        warehouse: log.warehouseLocation,
        status: log.status
      })

    } catch (error) {
      console.error('Failed to log compliance check:', error)
      // Fallback logging to system logs
      await this.logToSystemLogs('AUDIT_LOG_FAILURE', {
        originalEvent: 'COMPLIANCE_CHECK',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }
  }

  /**
   * Log violation remediation activity
   */
  async logViolationRemediation(log: ViolationRemediationLog): Promise<void> {
    const startTime = Date.now()

    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: log.timestamp,
        eventType: 'VIOLATION_REMEDIATION',
        severity: log.result === 'FAILURE' ? 'WARNING' : 'INFO',
        category: 'COMPLIANCE',
        userId: log.supplierId,
        userType: 'SUPPLIER',
        resource: 'violation_remediation',
        resourceId: log.violationId,
        action: `remediate_${log.method.toLowerCase()}`,
        result: this.mapStatusToResult(log.result),
        details: {
          violationId: log.violationId,
          method: log.method,
          details: log.details
        },
        metadata: {
          systemVersion: '1.0.0',
          apiVersion: 'v1',
          dataClassification: 'INTERNAL',
          jurisdiction: ['GLOBAL'],
          complianceFrameworks: ['INTERNAL_COMPLIANCE'],
          processingTime: Date.now() - startTime,
          auditTrail: [{
            stage: 'remediation',
            timestamp: log.timestamp,
            status: log.result,
            details: log.details
          }]
        },
        complianceFlags: ['VIOLATION_REMEDIATION', `METHOD_${log.method}`],
        retentionPeriod: 2555 // 7 years for remediation records
      }

      await this.enqueueAuditEntry(auditEntry)

      performanceMonitor.track('audit_violation_remediation', {
        duration: Date.now() - startTime,
        method: log.method,
        result: log.result
      })

    } catch (error) {
      console.error('Failed to log violation remediation:', error)
      await this.logToSystemLogs('AUDIT_LOG_FAILURE', {
        originalEvent: 'VIOLATION_REMEDIATION',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Log security-related events
   */
  async logSecurityEvent(log: SecurityAuditLog): Promise<void> {
    const startTime = Date.now()

    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: log.timestamp,
        eventType: 'SECURITY_INCIDENT',
        severity: this.getSeverityForSecurityEvent(log.eventType, log.riskScore),
        category: 'SECURITY',
        userId: log.userId,
        userType: 'SUPPLIER', // Could be determined from context
        resource: log.resource,
        action: log.action,
        result: this.mapSecurityResultToAuditResult(log.result),
        details: {
          eventType: log.eventType,
          riskScore: log.riskScore,
          details: log.details
        },
        metadata: {
          systemVersion: '1.0.0',
          apiVersion: 'v1',
          dataClassification: 'RESTRICTED',
          jurisdiction: ['GLOBAL'],
          complianceFrameworks: ['SOX', 'PCI_DSS', 'GDPR'],
          processingTime: Date.now() - startTime,
          auditTrail: [{
            stage: 'security_check',
            timestamp: log.timestamp,
            status: log.result,
            details: { riskScore: log.riskScore }
          }]
        },
        complianceFlags: [
          'SECURITY_EVENT',
          `RISK_${log.riskScore >= 7 ? 'HIGH' : log.riskScore >= 4 ? 'MEDIUM' : 'LOW'}`,
          log.eventType
        ],
        retentionPeriod: 2555 // 7 years for security events
      }

      await this.enqueueAuditEntry(auditEntry)

      // Immediate notification for high-risk security events
      if (log.riskScore >= 7) {
        await this.sendSecurityAlert(auditEntry)
      }

      performanceMonitor.track('audit_security_event', {
        duration: Date.now() - startTime,
        eventType: log.eventType,
        riskScore: log.riskScore
      })

    } catch (error) {
      console.error('Failed to log security event:', error)
      await this.logToSystemLogs('AUDIT_LOG_FAILURE', {
        originalEvent: 'SECURITY_INCIDENT',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Log data access events for GDPR compliance
   */
  async logDataAccess(log: DataAccessLog): Promise<void> {
    const startTime = Date.now()

    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: log.timestamp,
        eventType: 'DATA_ACCESS',
        severity: this.getSeverityForDataAccess(log.dataType, log.action),
        category: 'COMPLIANCE',
        userId: log.userId,
        userType: 'SUPPLIER',
        resource: `data_${log.dataType.toLowerCase()}`,
        action: log.action,
        result: 'SUCCESS',
        details: {
          dataType: log.dataType,
          recordCount: log.recordCount,
          purpose: log.purpose,
          legalBasis: log.legalBasis,
          consentId: log.consentId,
          dataSubjects: log.dataSubjects,
          retention: log.retention,
          location: log.location
        },
        metadata: {
          systemVersion: '1.0.0',
          apiVersion: 'v1',
          dataClassification: this.getDataClassification(log.dataType),
          jurisdiction: this.getJurisdictionForLocation(log.location),
          complianceFrameworks: ['GDPR', 'CCPA', 'PIPEDA'],
          dataSize: log.recordCount,
          processingTime: Date.now() - startTime,
          auditTrail: [{
            stage: 'data_access',
            timestamp: log.timestamp,
            status: 'completed',
            details: {
              action: log.action,
              recordCount: log.recordCount
            }
          }]
        },
        complianceFlags: this.generateDataAccessFlags(log),
        retentionPeriod: log.retention.required ? log.retention.period : 2555 // 7 years default
      }

      await this.enqueueAuditEntry(auditEntry)

      performanceMonitor.track('audit_data_access', {
        duration: Date.now() - startTime,
        dataType: log.dataType,
        action: log.action,
        recordCount: log.recordCount
      })

    } catch (error) {
      console.error('Failed to log data access:', error)
      await this.logToSystemLogs('AUDIT_LOG_FAILURE', {
        originalEvent: 'DATA_ACCESS',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Log general system events
   */
  async logSystemEvent(
    eventType: AuditEventType,
    details: {
      userId: string
      userType: 'SUPPLIER' | 'ADMIN' | 'SYSTEM' | 'EXTERNAL'
      resource: string
      action: string
      result: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'PENDING'
      metadata?: Record<string, any>
      warehouseLocation?: string
      severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
      category?: 'COMPLIANCE' | 'SECURITY' | 'OPERATIONAL' | 'ADMINISTRATIVE'
    }
  ): Promise<void> {
    const startTime = Date.now()

    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: new Date(),
        eventType,
        severity: details.severity || 'INFO',
        category: details.category || 'OPERATIONAL',
        userId: details.userId,
        userType: details.userType,
        warehouseLocation: details.warehouseLocation as any,
        resource: details.resource,
        action: details.action,
        result: details.result,
        details: details.metadata || {},
        metadata: {
          systemVersion: '1.0.0',
          apiVersion: 'v1',
          dataClassification: 'INTERNAL',
          jurisdiction: details.warehouseLocation 
            ? this.getJurisdictionForWarehouse(details.warehouseLocation)
            : ['GLOBAL'],
          complianceFrameworks: ['INTERNAL_COMPLIANCE'],
          processingTime: Date.now() - startTime,
          auditTrail: [{
            stage: 'system_event',
            timestamp: new Date(),
            status: details.result.toLowerCase(),
            details: details.metadata
          }]
        },
        complianceFlags: [eventType, `RESULT_${details.result}`],
        retentionPeriod: this.calculateRetentionPeriod(
          details.category || 'OPERATIONAL',
          details.warehouseLocation
        )
      }

      await this.enqueueAuditEntry(auditEntry)

      performanceMonitor.track('audit_system_event', {
        duration: Date.now() - startTime,
        eventType,
        result: details.result
      })

    } catch (error) {
      console.error('Failed to log system event:', error)
      await this.logToSystemLogs('AUDIT_LOG_FAILURE', {
        originalEvent: eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Generate compliance report for audit trail
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      warehouseLocation?: string
      eventTypes?: AuditEventType[]
      severity?: string[]
      userId?: string
    }
  ): Promise<{
    summary: {
      totalEvents: number
      eventsByType: Record<string, number>
      eventsBySeverity: Record<string, number>
      complianceScore: number
    }
    events: AuditLogEntry[]
    recommendations: string[]
  }> {
    const startTime = Date.now()

    try {
      // Build query filters
      const whereClause: any = {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }

      if (filters?.warehouseLocation) {
        whereClause.warehouseLocation = filters.warehouseLocation
      }

      if (filters?.eventTypes && filters.eventTypes.length > 0) {
        whereClause.eventType = { in: filters.eventTypes }
      }

      if (filters?.severity && filters.severity.length > 0) {
        whereClause.severity = { in: filters.severity }
      }

      if (filters?.userId) {
        whereClause.userId = filters.userId
      }

      // Query audit logs
      const auditLogs = await rhyPrisma.rHYAuditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: 10000 // Limit for performance
      })

      // Calculate summary statistics
      const totalEvents = auditLogs.length
      const eventsByType = auditLogs.reduce((acc, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const eventsBySeverity = auditLogs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate compliance score (percentage of successful events)
      const successfulEvents = auditLogs.filter(log => log.result === 'SUCCESS').length
      const complianceScore = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 100

      // Generate recommendations based on patterns
      const recommendations = this.generateAuditRecommendations(auditLogs, eventsBySeverity)

      // Convert database records to AuditLogEntry format
      const events: AuditLogEntry[] = auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        eventType: log.eventType as AuditEventType,
        severity: log.severity as any,
        category: log.category as any,
        userId: log.userId,
        userType: log.userType as any,
        warehouseLocation: log.warehouseLocation as any,
        resource: log.resource,
        resourceId: log.resourceId || undefined,
        action: log.action,
        result: log.result as any,
        details: log.details as Record<string, any>,
        metadata: log.metadata as AuditMetadata,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        sessionId: log.sessionId || undefined,
        correlationId: log.correlationId || undefined,
        complianceFlags: log.complianceFlags,
        retentionPeriod: log.retentionPeriod,
        encryptedData: log.encryptedData || undefined
      }))

      performanceMonitor.track('audit_report_generation', {
        duration: Date.now() - startTime,
        eventCount: totalEvents,
        dateRange: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      })

      return {
        summary: {
          totalEvents,
          eventsByType,
          eventsBySeverity,
          complianceScore
        },
        events,
        recommendations
      }

    } catch (error) {
      console.error('Failed to generate audit report:', error)
      throw new Error(`Audit report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Private helper methods

  private async enqueueAuditEntry(entry: AuditLogEntry): Promise<void> {
    this.logQueue.push(entry)

    // Flush immediately for critical events
    if (entry.severity === 'CRITICAL' || entry.category === 'SECURITY') {
      await this.flushLogs()
    } else if (this.logQueue.length >= this.BATCH_SIZE) {
      await this.flushLogs()
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return

    const logsToFlush = [...this.logQueue]
    this.logQueue = []

    try {
      // Batch insert audit logs
      await rhyPrisma.rHYAuditLog.createMany({
        data: logsToFlush.map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          eventType: entry.eventType,
          severity: entry.severity,
          category: entry.category,
          userId: entry.userId,
          userType: entry.userType,
          warehouseLocation: entry.warehouseLocation,
          resource: entry.resource,
          resourceId: entry.resourceId,
          action: entry.action,
          result: entry.result,
          details: entry.details,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          sessionId: entry.sessionId,
          correlationId: entry.correlationId,
          complianceFlags: entry.complianceFlags,
          retentionPeriod: entry.retentionPeriod,
          encryptedData: entry.encryptedData
        }))
      })

    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      // Re-queue logs for retry
      this.logQueue.unshift(...logsToFlush)
    }
  }

  private startBatchProcessor(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushLogs()
    }, this.FLUSH_INTERVAL)
  }

  private generateAuditId(): string {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
  }

  private mapStatusToResult(status: string): 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'PENDING' {
    switch (status) {
      case 'COMPLETED': return 'SUCCESS'
      case 'ERROR': return 'FAILURE'
      case 'STARTED': return 'PENDING'
      default: return 'PARTIAL'
    }
  }

  private mapSecurityResultToAuditResult(result: string): 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'PENDING' {
    switch (result) {
      case 'ALLOWED': return 'SUCCESS'
      case 'BLOCKED': return 'FAILURE'
      case 'FLAGGED': return 'PARTIAL'
      default: return 'PENDING'
    }
  }

  private getSeverityForSecurityEvent(eventType: string, riskScore: number): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    if (riskScore >= 8) return 'CRITICAL'
    if (riskScore >= 6) return 'ERROR'
    if (riskScore >= 3) return 'WARNING'
    return 'INFO'
  }

  private getSeverityForDataAccess(dataType: string, action: string): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    if (dataType === 'PERSONAL' && action === 'export') return 'WARNING'
    if (dataType === 'FINANCIAL' && action === 'delete') return 'ERROR'
    return 'INFO'
  }

  private getDataClassification(dataType: string): 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' {
    switch (dataType) {
      case 'PERSONAL': return 'RESTRICTED'
      case 'FINANCIAL': return 'CONFIDENTIAL'
      case 'COMMERCIAL': return 'INTERNAL'
      default: return 'INTERNAL'
    }
  }

  private getJurisdictionForWarehouse(warehouse: string): string[] {
    switch (warehouse) {
      case 'US_WEST': return ['US', 'CALIFORNIA']
      case 'JAPAN': return ['JP']
      case 'EU_GERMANY': return ['EU', 'DE']
      case 'AUSTRALIA': return ['AU']
      default: return ['GLOBAL']
    }
  }

  private getJurisdictionForLocation(location: string): string[] {
    // Map location to jurisdictions
    return ['GLOBAL'] // Default implementation
  }

  private getApplicableFrameworks(warehouse: string): string[] {
    const frameworks = ['INTERNAL_COMPLIANCE']
    
    switch (warehouse) {
      case 'US_WEST':
        frameworks.push('OSHA', 'DOT', 'SOX')
        break
      case 'JAPAN':
        frameworks.push('JIS')
        break
      case 'EU_GERMANY':
        frameworks.push('GDPR', 'CE')
        break
      case 'AUSTRALIA':
        frameworks.push('ACL')
        break
    }
    
    return frameworks
  }

  private calculateRetentionPeriod(category: string, warehouse?: string): number {
    // Default retention periods by category (in days)
    const defaults = {
      'COMPLIANCE': 2555, // 7 years
      'SECURITY': 2555,   // 7 years
      'OPERATIONAL': 1095, // 3 years
      'ADMINISTRATIVE': 365 // 1 year
    }

    // Adjust for specific regulations
    let period = defaults[category as keyof typeof defaults] || 365

    if (warehouse === 'EU_GERMANY' && category === 'COMPLIANCE') {
      period = Math.max(period, 2190) // 6 years for GDPR
    }

    return period
  }

  private generateComplianceFlags(log: ComplianceCheckLog): string[] {
    const flags = ['COMPLIANCE_CHECK']
    
    if (log.status === 'ERROR') flags.push('PROCESSING_ERROR')
    if (log.result && !log.result.compliant) flags.push('NON_COMPLIANT')
    if (log.result && log.result.riskLevel === 'CRITICAL') flags.push('CRITICAL_RISK')
    
    flags.push(`WAREHOUSE_${log.warehouseLocation}`)
    flags.push(`OPERATION_${log.operationType}`)
    flags.push(`PRODUCT_${log.productType}`)
    
    return flags
  }

  private generateDataAccessFlags(log: DataAccessLog): string[] {
    const flags = ['DATA_ACCESS', `DATA_${log.dataType}`, `ACTION_${log.action.toUpperCase()}`]
    
    if (log.dataType === 'PERSONAL') flags.push('GDPR_RELEVANT')
    if (log.recordCount > 1000) flags.push('BULK_ACCESS')
    if (log.legalBasis) flags.push(`BASIS_${log.legalBasis.toUpperCase()}`)
    if (log.consentId) flags.push('CONSENT_BASED')
    
    return flags
  }

  private generateAuditRecommendations(logs: any[], eventsBySeverity: Record<string, number>): string[] {
    const recommendations: string[] = []
    
    // High error rate
    if (eventsBySeverity.ERROR > logs.length * 0.1) {
      recommendations.push('High error rate detected - review system configurations and error handling')
    }
    
    // Critical events
    if (eventsBySeverity.CRITICAL > 0) {
      recommendations.push('Critical events detected - immediate investigation required')
    }
    
    // Security events
    const securityEvents = logs.filter(log => log.category === 'SECURITY').length
    if (securityEvents > logs.length * 0.05) {
      recommendations.push('Elevated security event rate - review access controls and monitoring')
    }
    
    return recommendations
  }

  private async sendSecurityAlert(auditEntry: AuditLogEntry): Promise<void> {
    // Implementation would send alerts to security team
    console.warn('HIGH RISK SECURITY EVENT:', {
      id: auditEntry.id,
      timestamp: auditEntry.timestamp,
      eventType: auditEntry.eventType,
      severity: auditEntry.severity,
      details: auditEntry.details
    })
  }

  private async logToSystemLogs(event: string, details: Record<string, any>): Promise<void> {
    // Fallback logging mechanism
    console.error(`AUDIT_SYSTEM_LOG: ${event}`, details)
  }

  /**
   * Cleanup method to be called on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    // Flush any remaining logs
    await this.flushLogs()
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

// Cleanup on process exit
process.on('beforeExit', async () => {
  await auditLogger.shutdown()
})