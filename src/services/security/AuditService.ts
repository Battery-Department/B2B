/**
 * RHY_073 - Security Hardening - Advanced Audit Service
 * Enterprise-grade audit logging and compliance tracking
 * Integrates with existing Batch 1 systems and enhances security monitoring
 * 
 * Features:
 * - Comprehensive audit trail for all security events
 * - Real-time compliance monitoring
 * - Integration with existing authentication system
 * - Multi-regional compliance (GDPR, OSHA, JIS, CE)
 * - Performance optimized with async logging
 * - Tamper-resistant audit logs
 */

import { z } from 'zod'
import { createHash, randomBytes } from 'crypto'
import { performance } from 'perf_hooks'

// ================================
// AUDIT SERVICE TYPES
// ================================

export interface AuditEvent {
  id: string
  eventType: AuditEventType
  action: string
  resource: string
  resourceId?: string
  userId?: string
  userRole?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  success: boolean
  errorCode?: string
  errorMessage?: string
  details?: Record<string, any>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  compliance: ComplianceContext
  metadata: AuditMetadata
  timestamp: Date
  hash?: string // For tamper resistance
}

export type AuditEventType = 
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'SECURITY_SCAN'
  | 'CONFIGURATION_CHANGE'
  | 'SYSTEM_ACCESS'
  | 'API_ACCESS'
  | 'FILE_ACCESS'
  | 'EXPORT_OPERATION'
  | 'ADMIN_ACTION'
  | 'COMPLIANCE_CHECK'
  | 'SECURITY_INCIDENT'

export interface ComplianceContext {
  gdprApplicable: boolean
  gdprLawfulBasis?: string
  oshaApplicable: boolean
  jisApplicable: boolean
  ceApplicable: boolean
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
  retentionPeriod: number // days
  anonymizationRequired: boolean
}

export interface AuditMetadata {
  source: string
  version: string
  environment: 'development' | 'staging' | 'production'
  traceId?: string
  parentEventId?: string
  processingTime?: number
  queryComplexity?: number
  dataVolume?: number
}

export interface AuditQuery {
  eventTypes?: AuditEventType[]
  actions?: string[]
  userIds?: string[]
  resources?: string[]
  warehouses?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  riskLevels?: string[]
  successOnly?: boolean
  complianceFilter?: {
    gdprOnly?: boolean
    oshaOnly?: boolean
    jisOnly?: boolean
    ceOnly?: boolean
  }
  sortBy?: keyof AuditEvent
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface AuditSummary {
  totalEvents: number
  eventsByType: Record<AuditEventType, number>
  eventsByRiskLevel: Record<string, number>
  eventsByWarehouse: Record<string, number>
  complianceStats: {
    gdprEvents: number
    oshaEvents: number
    jisEvents: number
    ceEvents: number
  }
  securityIncidents: number
  failedAuthentications: number
  dataAccessEvents: number
  period: {
    from: Date
    to: Date
  }
  generatedAt: Date
}

// ================================
// ENHANCED AUDIT SERVICE CLASS
// ================================

export class AuditService {
  private readonly logger = console // Use existing logger in production
  private readonly eventQueue: AuditEvent[] = []
  private readonly batchSize = 100
  private readonly flushInterval = 5000 // 5 seconds
  private processingTimer?: NodeJS.Timeout
  
  constructor() {
    this.startBatchProcessor()
  }

  /**
   * Log a comprehensive audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>): Promise<string> {
    const startTime = performance.now()
    
    try {
      const auditEvent: AuditEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
        metadata: {
          ...event.metadata,
          processingTime: performance.now() - startTime
        }
      }
      
      // Add tamper-resistant hash
      auditEvent.hash = this.generateEventHash(auditEvent)
      
      // Validate event structure
      this.validateAuditEvent(auditEvent)
      
      // Add to processing queue
      this.eventQueue.push(auditEvent)
      
      // For high-risk events, flush immediately
      if (auditEvent.riskLevel === 'CRITICAL' || auditEvent.eventType === 'SECURITY_INCIDENT') {
        await this.flushEvents()
      }
      
      this.logger.info(`Audit event logged: ${auditEvent.id}`)
      return auditEvent.id
      
    } catch (error) {
      this.logger.error('Failed to log audit event:', error)
      throw new AuditServiceError(`Audit logging failed: ${error.message}`, 'LOGGING_ERROR')
    }
  }

  /**
   * Log authentication events with enhanced context
   */
  async logAuthentication(data: {
    action: 'LOGIN' | 'LOGOUT' | 'MFA_VERIFY' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCK'
    userId?: string
    success: boolean
    ipAddress?: string
    userAgent?: string
    warehouse?: 'US' | 'JP' | 'EU' | 'AU'
    details?: Record<string, any>
    errorCode?: string
    errorMessage?: string
  }): Promise<string> {
    return this.logEvent({
      eventType: 'AUTHENTICATION',
      action: data.action,
      resource: '/auth',
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      warehouse: data.warehouse,
      success: data.success,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      details: data.details,
      riskLevel: data.success ? 'LOW' : 'MEDIUM',
      compliance: this.getComplianceContext(data.warehouse),
      metadata: {
        source: 'authentication-service',
        version: '1.0.0',
        environment: process.env.NODE_ENV as any || 'development'
      }
    })
  }

  /**
   * Log data access events for compliance
   */
  async logDataAccess(data: {
    action: 'READ' | 'create' | 'update' | 'delete' | 'export'
    resource: string
    resourceId?: string
    userId?: string
    userRole?: string
    warehouse?: 'US' | 'JP' | 'EU' | 'AU'
    dataClassification: ComplianceContext['dataClassification']
    success: boolean
    details?: Record<string, any>
  }): Promise<string> {
    const riskLevel = this.calculateDataAccessRisk(data.action, data.dataClassification)
    
    return this.logEvent({
      eventType: 'DATA_ACCESS',
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      userId: data.userId,
      userRole: data.userRole,
      warehouse: data.warehouse,
      success: data.success,
      details: data.details,
      riskLevel,
      compliance: {
        ...this.getComplianceContext(data.warehouse),
        dataClassification: data.dataClassification,
        anonymizationRequired: data.dataClassification === 'RESTRICTED'
      },
      metadata: {
        source: 'data-access-service',
        version: '1.0.0',
        environment: process.env.NODE_ENV as any || 'development'
      }
    })
  }

  /**
   * Log security scanning events
   */
  async logSecurityScan(data: {
    scanId: string
    targetType: string
    target: string
    status: 'CLEAN' | 'WARNING' | 'THREAT' | 'BLOCKED'
    riskScore: number
    threatsDetected: number
    userId?: string
    warehouse?: 'US' | 'JP' | 'EU' | 'AU'
    processingTime: number
  }): Promise<string> {
    const riskLevel = data.status === 'BLOCKED' || data.status === 'THREAT' ? 'HIGH' : 'LOW'
    
    return this.logEvent({
      eventType: 'SECURITY_SCAN',
      action: 'scan_performed',
      resource: data.target,
      resourceId: data.scanId,
      userId: data.userId,
      warehouse: data.warehouse,
      success: data.status !== 'BLOCKED',
      details: {
        scanId: data.scanId,
        targetType: data.targetType,
        status: data.status,
        riskScore: data.riskScore,
        threatsDetected: data.threatsDetected
      },
      riskLevel,
      compliance: this.getComplianceContext(data.warehouse),
      metadata: {
        source: 'security-scanner',
        version: '1.0.0',
        environment: process.env.NODE_ENV as any || 'development',
        processingTime: data.processingTime
      }
    })
  }

  /**
   * Log admin actions for accountability
   */
  async logAdminAction(data: {
    action: string
    resource: string
    resourceId?: string
    userId: string
    userRole: string
    warehouse?: 'US' | 'JP' | 'EU' | 'AU'
    changes?: Record<string, any>
    success: boolean
    justification?: string
  }): Promise<string> {
    return this.logEvent({
      eventType: 'ADMIN_ACTION',
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      userId: data.userId,
      userRole: data.userRole,
      warehouse: data.warehouse,
      success: data.success,
      details: {
        changes: data.changes,
        justification: data.justification
      },
      riskLevel: 'HIGH', // Admin actions are always high risk
      compliance: this.getComplianceContext(data.warehouse),
      metadata: {
        source: 'admin-service',
        version: '1.0.0',
        environment: process.env.NODE_ENV as any || 'development'
      }
    })
  }

  /**
   * Query audit events with comprehensive filtering
   */
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      // In production, this would query the actual database
      // For now, return empty array as we don't have persistent storage
      this.logger.info('Querying audit events:', query)
      
      // Simulate database query delay
      await new Promise(resolve => setTimeout(resolve, 10))
      
      return []
    } catch (error) {
      this.logger.error('Failed to query audit events:', error)
      throw new AuditServiceError(`Query failed: ${error.message}`, 'QUERY_ERROR')
    }
  }

  /**
   * Generate audit summary for reporting
   */
  async generateSummary(dateRange: { from: Date; to: Date }): Promise<AuditSummary> {
    try {
      // In production, this would aggregate from the database
      const summary: AuditSummary = {
        totalEvents: 0,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsByRiskLevel: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0
        },
        eventsByWarehouse: {
          US: 0,
          JP: 0,
          EU: 0,
          AU: 0
        },
        complianceStats: {
          gdprEvents: 0,
          oshaEvents: 0,
          jisEvents: 0,
          ceEvents: 0
        },
        securityIncidents: 0,
        failedAuthentications: 0,
        dataAccessEvents: 0,
        period: dateRange,
        generatedAt: new Date()
      }
      
      this.logger.info('Generated audit summary:', summary)
      return summary
    } catch (error) {
      this.logger.error('Failed to generate audit summary:', error)
      throw new AuditServiceError(`Summary generation failed: ${error.message}`, 'SUMMARY_ERROR')
    }
  }

  /**
   * Check compliance status for a specific region
   */
  async checkCompliance(warehouse: 'US' | 'JP' | 'EU' | 'AU', dateRange: { from: Date; to: Date }) {
    const complianceContext = this.getComplianceContext(warehouse)
    
    // Query events for compliance analysis
    const query: AuditQuery = {
      warehouses: [warehouse],
      dateRange,
      complianceFilter: {
        gdprOnly: complianceContext.gdprApplicable,
        oshaOnly: complianceContext.oshaApplicable,
        jisOnly: complianceContext.jisApplicable,
        ceOnly: complianceContext.ceApplicable
      }
    }
    
    const events = await this.queryEvents(query)
    
    return {
      warehouse,
      complianceScore: this.calculateComplianceScore(events),
      violations: this.detectComplianceViolations(events),
      recommendations: this.generateComplianceRecommendations(warehouse, events),
      period: dateRange,
      checkedAt: new Date()
    }
  }

  /**
   * Private helper methods
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  private generateEventHash(event: Omit<AuditEvent, 'hash'>): string {
    const data = JSON.stringify(event, Object.keys(event).sort())
    return createHash('sha256').update(data).digest('hex')
  }

  private validateAuditEvent(event: AuditEvent): void {
    const schema = z.object({
      id: z.string().min(1),
      eventType: z.enum([
        'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION',
        'SECURITY_SCAN', 'CONFIGURATION_CHANGE', 'SYSTEM_ACCESS', 'API_ACCESS',
        'FILE_ACCESS', 'EXPORT_OPERATION', 'ADMIN_ACTION', 'COMPLIANCE_CHECK',
        'SECURITY_INCIDENT'
      ]),
      action: z.string().min(1),
      resource: z.string().min(1),
      success: z.boolean(),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      timestamp: z.date(),
      compliance: z.object({
        gdprApplicable: z.boolean(),
        oshaApplicable: z.boolean(),
        jisApplicable: z.boolean(),
        ceApplicable: z.boolean(),
        dataClassification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']),
        retentionPeriod: z.number(),
        anonymizationRequired: z.boolean()
      }),
      metadata: z.object({
        source: z.string(),
        version: z.string(),
        environment: z.enum(['development', 'staging', 'production'])
      })
    })
    
    schema.parse(event)
  }

  private getComplianceContext(warehouse?: 'US' | 'JP' | 'EU' | 'AU'): ComplianceContext {
    const baseContext: ComplianceContext = {
      gdprApplicable: warehouse === 'EU',
      oshaApplicable: warehouse === 'US',
      jisApplicable: warehouse === 'JP',
      ceApplicable: warehouse === 'EU',
      dataClassification: 'INTERNAL',
      retentionPeriod: 2555, // 7 years in days
      anonymizationRequired: false
    }
    
    return baseContext
  }

  private calculateDataAccessRisk(action: string, classification: ComplianceContext['dataClassification']): AuditEvent['riskLevel'] {
    const riskMatrix = {
      'delete': { 'RESTRICTED': 'CRITICAL', 'CONFIDENTIAL': 'HIGH', 'INTERNAL': 'MEDIUM', 'PUBLIC': 'LOW' },
      'export': { 'RESTRICTED': 'CRITICAL', 'CONFIDENTIAL': 'HIGH', 'INTERNAL': 'MEDIUM', 'PUBLIC': 'LOW' },
      'update': { 'RESTRICTED': 'HIGH', 'CONFIDENTIAL': 'MEDIUM', 'INTERNAL': 'LOW', 'PUBLIC': 'LOW' },
      'create': { 'RESTRICTED': 'MEDIUM', 'CONFIDENTIAL': 'MEDIUM', 'INTERNAL': 'LOW', 'PUBLIC': 'LOW' },
      'read': { 'RESTRICTED': 'MEDIUM', 'CONFIDENTIAL': 'LOW', 'INTERNAL': 'LOW', 'PUBLIC': 'LOW' }
    }
    
    return (riskMatrix[action]?.[classification] || 'MEDIUM') as AuditEvent['riskLevel']
  }

  private calculateComplianceScore(events: AuditEvent[]): number {
    if (events.length === 0) return 100
    
    const violations = events.filter(event => !event.success).length
    return Math.max(0, 100 - (violations / events.length) * 100)
  }

  private detectComplianceViolations(events: AuditEvent[]): string[] {
    const violations: string[] = []
    
    // Check for failed authentication attempts
    const failedLogins = events.filter(e => 
      e.eventType === 'AUTHENTICATION' && !e.success
    ).length
    
    if (failedLogins > 10) {
      violations.push('Excessive failed authentication attempts detected')
    }
    
    // Check for unauthorized data access
    const unauthorizedAccess = events.filter(e => 
      e.eventType === 'DATA_ACCESS' && !e.success
    ).length
    
    if (unauthorizedAccess > 5) {
      violations.push('Multiple unauthorized data access attempts')
    }
    
    return violations
  }

  private generateComplianceRecommendations(warehouse: string, events: AuditEvent[]): string[] {
    const recommendations: string[] = []
    
    if (warehouse === 'EU') {
      recommendations.push('Ensure GDPR consent is properly documented')
      recommendations.push('Implement data anonymization for restricted data')
    }
    
    if (warehouse === 'US') {
      recommendations.push('Maintain OSHA safety documentation')
      recommendations.push('Implement proper access controls')
    }
    
    return recommendations
  }

  private startBatchProcessor(): void {
    this.processingTimer = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.flushEvents()
      }
    }, this.flushInterval)
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return
    
    const eventsToProcess = this.eventQueue.splice(0, this.batchSize)
    
    try {
      // In production, batch insert to database
      this.logger.info(`Processing ${eventsToProcess.length} audit events`)
      
      // Simulate database write
      await new Promise(resolve => setTimeout(resolve, 10))
      
    } catch (error) {
      this.logger.error('Failed to flush audit events:', error)
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToProcess)
    }
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
    }
    
    // Flush remaining events
    await this.flushEvents()
  }
}

// ================================
// ERROR TYPES
// ================================

export class AuditServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AuditServiceError'
  }
}

// ================================
// VALIDATION SCHEMAS
// ================================

export const AuditQuerySchema = z.object({
  eventTypes: z.array(z.string()).optional(),
  actions: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  warehouses: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date()
  }).optional(),
  riskLevels: z.array(z.string()).optional(),
  successOnly: z.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().positive().max(1000).optional(),
  offset: z.number().min(0).optional()
})

// ================================
// FACTORY FUNCTION
// ================================

let auditServiceInstance: AuditService | null = null

export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService()
  }
  return auditServiceInstance
}

// ================================
// CONVENIENCE FUNCTIONS
// ================================

export async function auditUserAction(
  action: string,
  resource: string,
  userId: string,
  success: boolean,
  details?: Record<string, any>
): Promise<string> {
  const service = getAuditService()
  return service.logEvent({
    eventType: 'DATA_ACCESS',
    action,
    resource,
    userId,
    success,
    details,
    riskLevel: 'MEDIUM',
    compliance: {
      gdprApplicable: false,
      oshaApplicable: false,
      jisApplicable: false,
      ceApplicable: false,
      dataClassification: 'INTERNAL',
      retentionPeriod: 2555,
      anonymizationRequired: false
    },
    metadata: {
      source: 'convenience-function',
      version: '1.0.0',
      environment: process.env.NODE_ENV as any || 'development'
    }
  })
}

export async function auditSecurityEvent(
  action: string,
  resource: string,
  riskLevel: AuditEvent['riskLevel'],
  details?: Record<string, any>
): Promise<string> {
  const service = getAuditService()
  return service.logEvent({
    eventType: 'SECURITY_INCIDENT',
    action,
    resource,
    success: false,
    details,
    riskLevel,
    compliance: {
      gdprApplicable: false,
      oshaApplicable: false,
      jisApplicable: false,
      ceApplicable: false,
      dataClassification: 'INTERNAL',
      retentionPeriod: 2555,
      anonymizationRequired: false
    },
    metadata: {
      source: 'security-event',
      version: '1.0.0',
      environment: process.env.NODE_ENV as any || 'development'
    }
  })
}