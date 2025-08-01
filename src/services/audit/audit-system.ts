import { createHash } from 'crypto'

export interface AuditEvent {
  id: string
  timestamp: Date
  eventType: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system_change' | 'financial_transaction' | 'admin_action' | 'security_event'
  category: 'system' | 'user' | 'application' | 'database' | 'network' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  actor: {
    type: 'user' | 'system' | 'service' | 'api'
    id: string
    name?: string
    role?: string
    ipAddress?: string
    userAgent?: string
    sessionId?: string
  }
  target: {
    type: 'user' | 'resource' | 'system' | 'data' | 'configuration'
    id: string
    name?: string
    classification?: string
  }
  action: string
  outcome: 'success' | 'failure' | 'warning' | 'error'
  details: Record<string, any>
  metadata: {
    source: string
    environment: string
    version?: string
    correlationId?: string
    traceId?: string
  }
  integrity: {
    hash: string
    signature?: string
    verified: boolean
  }
}

export interface AuditTrail {
  id: string
  name: string
  description: string
  events: AuditEvent[]
  startTime: Date
  endTime?: Date
  status: 'active' | 'completed' | 'archived'
  retention: {
    period: number // days
    archiveAfter: number // days
    deleteAfter: number // days
  }
  compliance: {
    frameworks: string[]
    requirements: string[]
  }
}

export interface AuditQuery {
  eventTypes?: string[]
  categories?: string[]
  severities?: string[]
  actors?: string[]
  targets?: string[]
  actions?: string[]
  outcomes?: string[]
  startTime?: Date
  endTime?: Date
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AuditReport {
  id: string
  title: string
  description: string
  reportType: 'compliance' | 'security' | 'operational' | 'financial' | 'custom'
  period: {
    startTime: Date
    endTime: Date
  }
  generatedAt: Date
  generatedBy: string
  events: AuditEvent[]
  statistics: AuditStatistics
  findings: AuditFinding[]
  recommendations: string[]
  format: 'json' | 'pdf' | 'csv' | 'xml'
  filePath?: string
}

export interface AuditStatistics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsByCategory: Record<string, number>
  eventsBySeverity: Record<string, number>
  eventsByOutcome: Record<string, number>
  uniqueActors: number
  uniqueTargets: number
  failureRate: number
  peakActivity: {
    hour: number
    count: number
  }
  trends: {
    period: string
    increase: boolean
    percentage: number
  }[]
}

export interface AuditFinding {
  id: string
  type: 'anomaly' | 'violation' | 'pattern' | 'trend' | 'outlier'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence: string[]
  affectedEvents: string[]
  riskLevel: number
  recommendation: string
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
}

export interface AuditConfig {
  retention: {
    defaultPeriod: number
    compliancePeriod: number
    archivePeriod: number
  }
  integrity: {
    enableHashing: boolean
    enableSigning: boolean
    hashAlgorithm: string
  }
  monitoring: {
    realTimeAlerts: boolean
    anomalyDetection: boolean
    integrityChecking: boolean
  }
  compliance: {
    enabledFrameworks: string[]
    autoCompliance: boolean
  }
  storage: {
    primaryStore: string
    archiveStore: string
    compressionEnabled: boolean
    encryptionEnabled: boolean
  }
}

export class AuditSystem {
  private config: AuditConfig
  private events: AuditEvent[] = []
  private trails: AuditTrail[] = []
  private reports: AuditReport[] = []
  private integrityKeys: Map<string, string> = new Map()
  private anomalyBaselines: Map<string, any> = new Map()

  constructor(config: AuditConfig) {
    this.config = config
    this.initializeAuditSystem()
  }

  // Event Logging
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'integrity'>): Promise<string> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      integrity: {
        hash: '',
        verified: false
      },
      ...event
    }

    // Calculate integrity hash
    if (this.config.integrity.enableHashing) {
      auditEvent.integrity.hash = this.calculateEventHash(auditEvent)
      auditEvent.integrity.verified = true
    }

    // Digital signature (if enabled)
    if (this.config.integrity.enableSigning) {
      auditEvent.integrity.signature = await this.signEvent(auditEvent)
    }

    this.events.push(auditEvent)

    // Real-time monitoring
    if (this.config.monitoring.realTimeAlerts) {
      await this.checkRealTimeAlerts(auditEvent)
    }

    // Anomaly detection
    if (this.config.monitoring.anomalyDetection) {
      await this.detectAnomalies(auditEvent)
    }

    console.log(`[AUDIT] Event logged: ${event.eventType} - ${event.action} - ${event.outcome}`)
    return auditEvent.id
  }

  // Specialized logging methods
  async logAuthentication(
    actorId: string,
    action: string,
    outcome: 'success' | 'failure',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: 'authentication',
      category: 'security',
      severity: outcome === 'failure' ? 'medium' : 'low',
      actor: {
        type: 'user',
        id: actorId,
        ipAddress,
        userAgent
      },
      target: {
        type: 'system',
        id: 'authentication_system'
      },
      action,
      outcome,
      details,
      metadata: {
        source: 'auth_service',
        environment: process.env.NODE_ENV || 'development'
      }
    })
  }

  async logDataAccess(
    actorId: string,
    resourceId: string,
    action: string,
    outcome: 'success' | 'failure',
    classification?: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent({
      eventType: 'data_access',
      category: 'application',
      severity: classification === 'sensitive' ? 'high' : 'medium',
      actor: {
        type: 'user',
        id: actorId
      },
      target: {
        type: 'data',
        id: resourceId,
        classification
      },
      action,
      outcome,
      details,
      metadata: {
        source: 'application',
        environment: process.env.NODE_ENV || 'development'
      }
    })
  }

  async logFinancialTransaction(
    actorId: string,
    transactionId: string,
    action: string,
    amount: number,
    currency: string,
    outcome: 'success' | 'failure' | 'warning',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent({
      eventType: 'financial_transaction',
      category: 'application',
      severity: 'high',
      actor: {
        type: 'user',
        id: actorId
      },
      target: {
        type: 'resource',
        id: transactionId
      },
      action,
      outcome,
      details: {
        ...details,
        amount,
        currency,
        transaction_id: transactionId
      },
      metadata: {
        source: 'payment_service',
        environment: process.env.NODE_ENV || 'development'
      }
    })
  }

  async logSystemChange(
    actorId: string,
    systemId: string,
    action: string,
    changes: Record<string, any>,
    outcome: 'success' | 'failure',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent({
      eventType: 'system_change',
      category: 'system',
      severity: 'high',
      actor: {
        type: 'user',
        id: actorId
      },
      target: {
        type: 'system',
        id: systemId
      },
      action,
      outcome,
      details: {
        ...details,
        changes
      },
      metadata: {
        source: 'admin_panel',
        environment: process.env.NODE_ENV || 'development'
      }
    })
  }

  // Querying and Retrieval
  queryEvents(query: AuditQuery): AuditEvent[] {
    let filteredEvents = this.events

    // Apply filters
    if (query.eventTypes) {
      filteredEvents = filteredEvents.filter(e => query.eventTypes!.includes(e.eventType))
    }

    if (query.categories) {
      filteredEvents = filteredEvents.filter(e => query.categories!.includes(e.category))
    }

    if (query.severities) {
      filteredEvents = filteredEvents.filter(e => query.severities!.includes(e.severity))
    }

    if (query.actors) {
      filteredEvents = filteredEvents.filter(e => query.actors!.includes(e.actor.id))
    }

    if (query.targets) {
      filteredEvents = filteredEvents.filter(e => query.targets!.includes(e.target.id))
    }

    if (query.actions) {
      filteredEvents = filteredEvents.filter(e => query.actions!.includes(e.action))
    }

    if (query.outcomes) {
      filteredEvents = filteredEvents.filter(e => query.outcomes!.includes(e.outcome))
    }

    if (query.startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startTime!)
    }

    if (query.endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endTime!)
    }

    // Sort events
    const sortBy = query.sortBy || 'timestamp'
    const sortOrder = query.sortOrder || 'desc'
    
    filteredEvents.sort((a, b) => {
      const aValue = this.getEventProperty(a, sortBy)
      const bValue = this.getEventProperty(b, sortBy)
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 1000
    
    return filteredEvents.slice(offset, offset + limit)
  }

  // Audit Trail Management
  createAuditTrail(
    name: string,
    description: string,
    complianceFrameworks: string[] = []
  ): AuditTrail {
    const trail: AuditTrail = {
      id: this.generateTrailId(),
      name,
      description,
      events: [],
      startTime: new Date(),
      status: 'active',
      retention: {
        period: this.config.retention.compliancePeriod,
        archiveAfter: this.config.retention.archivePeriod,
        deleteAfter: this.config.retention.compliancePeriod + this.config.retention.archivePeriod
      },
      compliance: {
        frameworks: complianceFrameworks,
        requirements: this.getComplianceRequirements(complianceFrameworks)
      }
    }

    this.trails.push(trail)
    console.log(`[AUDIT] Created audit trail: ${name}`)
    return trail
  }

  // Reporting
  async generateReport(
    title: string,
    reportType: AuditReport['reportType'],
    period: { startTime: Date; endTime: Date },
    generatedBy: string,
    query?: AuditQuery
  ): Promise<AuditReport> {
    const events = this.queryEvents({
      ...query,
      startTime: period.startTime,
      endTime: period.endTime
    })

    const statistics = this.calculateStatistics(events)
    const findings = await this.analyzeEvents(events)

    const report: AuditReport = {
      id: this.generateReportId(),
      title,
      description: `${reportType} audit report for period ${period.startTime.toISOString()} to ${period.endTime.toISOString()}`,
      reportType,
      period,
      generatedAt: new Date(),
      generatedBy,
      events,
      statistics,
      findings,
      recommendations: this.generateRecommendations(findings),
      format: 'json'
    }

    this.reports.push(report)
    console.log(`[AUDIT] Generated report: ${title}`)
    return report
  }

  async generateComplianceReport(
    framework: string,
    period: { startTime: Date; endTime: Date }
  ): Promise<AuditReport> {
    const complianceEvents = this.queryEvents({
      startTime: period.startTime,
      endTime: period.endTime
    }).filter(event => this.isComplianceRelevant(event, framework))

    const report = await this.generateReport(
      `${framework} Compliance Report`,
      'compliance',
      period,
      'audit_system',
      { startTime: period.startTime, endTime: period.endTime }
    )

    // Add compliance-specific analysis
    report.findings.push(...await this.analyzeComplianceGaps(complianceEvents, framework))

    return report
  }

  // Integrity Verification
  async verifyEventIntegrity(eventId: string): Promise<{
    valid: boolean
    issues: string[]
  }> {
    const event = this.events.find(e => e.id === eventId)
    if (!event) {
      return { valid: false, issues: ['Event not found'] }
    }

    const issues: string[] = []

    // Verify hash
    if (event.integrity.hash) {
      const calculatedHash = this.calculateEventHash(event)
      if (calculatedHash !== event.integrity.hash) {
        issues.push('Hash mismatch - event may have been tampered with')
      }
    } else {
      issues.push('No integrity hash found')
    }

    // Verify signature
    if (event.integrity.signature) {
      const signatureValid = await this.verifyEventSignature(event)
      if (!signatureValid) {
        issues.push('Digital signature verification failed')
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  async verifyAuditTrailIntegrity(trailId: string): Promise<{
    valid: boolean
    corruptedEvents: string[]
    issues: string[]
  }> {
    const trail = this.trails.find(t => t.id === trailId)
    if (!trail) {
      return { valid: false, corruptedEvents: [], issues: ['Audit trail not found'] }
    }

    const corruptedEvents: string[] = []
    const issues: string[] = []

    for (const event of trail.events) {
      const verification = await this.verifyEventIntegrity(event.id)
      if (!verification.valid) {
        corruptedEvents.push(event.id)
        issues.push(...verification.issues)
      }
    }

    return {
      valid: corruptedEvents.length === 0,
      corruptedEvents,
      issues
    }
  }

  // Anomaly Detection
  private async detectAnomalies(event: AuditEvent): Promise<void> {
    const anomalies = []

    // Unusual activity patterns
    if (await this.isUnusualActivityPattern(event)) {
      anomalies.push('Unusual activity pattern detected')
    }

    // Failed authentication patterns
    if (event.eventType === 'authentication' && event.outcome === 'failure') {
      if (await this.isRepeatedFailure(event)) {
        anomalies.push('Repeated authentication failures')
      }
    }

    // Privilege escalation attempts
    if (await this.isPrivilegeEscalation(event)) {
      anomalies.push('Potential privilege escalation attempt')
    }

    // Data access anomalies
    if (event.eventType === 'data_access' && await this.isUnusualDataAccess(event)) {
      anomalies.push('Unusual data access pattern')
    }

    if (anomalies.length > 0) {
      await this.createAnomalyAlert(event, anomalies)
    }
  }

  private async createAnomalyAlert(event: AuditEvent, anomalies: string[]): Promise<void> {
    console.log(`[AUDIT ANOMALY] ${anomalies.join(', ')} for event ${event.id}`)
    
    // In production, this would create alerts in the security monitoring system
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      severity: 'medium',
      eventId: event.id,
      anomalies,
      actor: event.actor,
      target: event.target
    }

    // Would send to security monitoring system
  }

  // Retention and Archival
  async applyRetentionPolicies(): Promise<{
    archived: number
    deleted: number
  }> {
    const now = new Date()
    let archived = 0
    let deleted = 0

    // Archive old events
    const archiveCutoff = new Date(now.getTime() - this.config.retention.archivePeriod * 24 * 60 * 60 * 1000)
    const eventsToArchive = this.events.filter(e => 
      e.timestamp < archiveCutoff && 
      !this.isArchived(e)
    )

    for (const event of eventsToArchive) {
      await this.archiveEvent(event)
      archived++
    }

    // Delete very old events
    const deleteCutoff = new Date(now.getTime() - this.config.retention.compliancePeriod * 24 * 60 * 60 * 1000)
    const eventsToDelete = this.events.filter(e => 
      e.timestamp < deleteCutoff && 
      this.canBeDeleted(e)
    )

    for (const event of eventsToDelete) {
      await this.deleteEvent(event.id)
      deleted++
    }

    console.log(`[AUDIT] Retention policy applied: ${archived} archived, ${deleted} deleted`)
    return { archived, deleted }
  }

  // Private Methods
  private calculateEventHash(event: AuditEvent): string {
    const eventData = {
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      actor: event.actor,
      target: event.target,
      action: event.action,
      outcome: event.outcome,
      details: event.details
    }

    return createHash(this.config.integrity.hashAlgorithm)
      .update(JSON.stringify(eventData))
      .digest('hex')
  }

  private async signEvent(event: AuditEvent): Promise<string> {
    // Simplified signature implementation
    // In production, would use proper digital signatures
    return createHash('sha256')
      .update(event.integrity.hash + 'audit_system_key')
      .digest('hex')
  }

  private async verifyEventSignature(event: AuditEvent): Promise<boolean> {
    if (!event.integrity.signature) return false
    
    const expectedSignature = await this.signEvent(event)
    return event.integrity.signature === expectedSignature
  }

  private calculateStatistics(events: AuditEvent[]): AuditStatistics {
    const stats: AuditStatistics = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByCategory: {},
      eventsBySeverity: {},
      eventsByOutcome: {},
      uniqueActors: new Set(events.map(e => e.actor.id)).size,
      uniqueTargets: new Set(events.map(e => e.target.id)).size,
      failureRate: 0,
      peakActivity: { hour: 0, count: 0 },
      trends: []
    }

    // Calculate distributions
    events.forEach(event => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1
      stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1
      stats.eventsByOutcome[event.outcome] = (stats.eventsByOutcome[event.outcome] || 0) + 1
    })

    // Calculate failure rate
    const failures = events.filter(e => e.outcome === 'failure').length
    stats.failureRate = events.length > 0 ? (failures / events.length) * 100 : 0

    // Find peak activity hour
    const hourlyActivity: Record<number, number> = {}
    events.forEach(event => {
      const hour = event.timestamp.getHours()
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
    })

    let maxHour = 0
    let maxCount = 0
    Object.entries(hourlyActivity).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxHour = parseInt(hour)
        maxCount = count
      }
    })

    stats.peakActivity = { hour: maxHour, count: maxCount }

    return stats
  }

  private async analyzeEvents(events: AuditEvent[]): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = []

    // Analyze for patterns and anomalies
    findings.push(...this.findFailurePatterns(events))
    findings.push(...this.findSuspiciousActivity(events))
    findings.push(...this.findComplianceViolations(events))

    return findings
  }

  private findFailurePatterns(events: AuditEvent[]): AuditFinding[] {
    const findings: AuditFinding[] = []
    const failures = events.filter(e => e.outcome === 'failure')
    
    if (failures.length > events.length * 0.1) { // More than 10% failures
      findings.push({
        id: this.generateFindingId(),
        type: 'pattern',
        severity: 'medium',
        title: 'High Failure Rate Detected',
        description: `${failures.length} failures out of ${events.length} total events (${((failures.length / events.length) * 100).toFixed(1)}%)`,
        evidence: failures.slice(0, 5).map(f => f.id),
        affectedEvents: failures.map(f => f.id),
        riskLevel: 5,
        recommendation: 'Investigate causes of high failure rates and implement corrective measures',
        status: 'open'
      })
    }

    return findings
  }

  private findSuspiciousActivity(events: AuditEvent[]): AuditFinding[] {
    const findings: AuditFinding[] = []
    
    // Look for unusual patterns
    const actorActivity: Record<string, AuditEvent[]> = {}
    events.forEach(event => {
      if (!actorActivity[event.actor.id]) {
        actorActivity[event.actor.id] = []
      }
      actorActivity[event.actor.id].push(event)
    })

    // Find actors with unusual activity
    Object.entries(actorActivity).forEach(([actorId, actorEvents]) => {
      if (actorEvents.length > 100) { // More than 100 events from single actor
        findings.push({
          id: this.generateFindingId(),
          type: 'anomaly',
          severity: 'medium',
          title: 'Unusually High Activity from Single Actor',
          description: `Actor ${actorId} generated ${actorEvents.length} events`,
          evidence: actorEvents.slice(0, 10).map(e => e.id),
          affectedEvents: actorEvents.map(e => e.id),
          riskLevel: 4,
          recommendation: 'Review actor behavior and verify legitimacy of high activity levels',
          status: 'open'
        })
      }
    })

    return findings
  }

  private findComplianceViolations(events: AuditEvent[]): AuditFinding[] {
    const findings: AuditFinding[] = []
    
    // Look for compliance violations
    const dataAccessEvents = events.filter(e => e.eventType === 'data_access')
    const unauthorizedAccess = dataAccessEvents.filter(e => 
      e.outcome === 'failure' && 
      e.details.reason?.includes('unauthorized')
    )

    if (unauthorizedAccess.length > 0) {
      findings.push({
        id: this.generateFindingId(),
        type: 'violation',
        severity: 'high',
        title: 'Unauthorized Data Access Attempts',
        description: `${unauthorizedAccess.length} unauthorized data access attempts detected`,
        evidence: unauthorizedAccess.map(e => e.id),
        affectedEvents: unauthorizedAccess.map(e => e.id),
        riskLevel: 7,
        recommendation: 'Review access controls and investigate unauthorized access attempts',
        status: 'open'
      })
    }

    return findings
  }

  private generateRecommendations(findings: AuditFinding[]): string[] {
    const recommendations = new Set<string>()
    
    findings.forEach(finding => {
      recommendations.add(finding.recommendation)
      
      // Add general recommendations based on finding type
      switch (finding.type) {
        case 'anomaly':
          recommendations.add('Implement enhanced monitoring for anomalous behavior')
          break
        case 'violation':
          recommendations.add('Review and update security policies')
          break
        case 'pattern':
          recommendations.add('Analyze patterns for potential security improvements')
          break
      }
    })

    return Array.from(recommendations)
  }

  private getEventProperty(event: AuditEvent, property: string): any {
    const properties = property.split('.')
    let value: any = event
    
    for (const prop of properties) {
      value = value?.[prop]
    }
    
    return value || ''
  }

  private getComplianceRequirements(frameworks: string[]): string[] {
    const requirements: string[] = []
    
    frameworks.forEach(framework => {
      switch (framework) {
        case 'gdpr':
          requirements.push('data_access_logging', 'breach_notification', 'consent_tracking')
          break
        case 'pci_dss':
          requirements.push('access_logging', 'system_monitoring', 'change_tracking')
          break
        case 'sox':
          requirements.push('financial_controls', 'change_management', 'access_reviews')
          break
      }
    })

    return requirements
  }

  private isComplianceRelevant(event: AuditEvent, framework: string): boolean {
    switch (framework) {
      case 'gdpr':
        return ['data_access', 'data_modification', 'authentication'].includes(event.eventType)
      case 'pci_dss':
        return ['financial_transaction', 'data_access', 'system_change'].includes(event.eventType)
      case 'sox':
        return ['financial_transaction', 'system_change', 'admin_action'].includes(event.eventType)
      default:
        return false
    }
  }

  private async analyzeComplianceGaps(events: AuditEvent[], framework: string): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = []
    
    // Framework-specific gap analysis
    switch (framework) {
      case 'gdpr':
        findings.push(...this.analyzeGDPRGaps(events))
        break
      case 'pci_dss':
        findings.push(...this.analyzePCIGaps(events))
        break
    }

    return findings
  }

  private analyzeGDPRGaps(events: AuditEvent[]): AuditFinding[] {
    const findings: AuditFinding[] = []
    
    // Check for data access without proper logging
    const dataEvents = events.filter(e => e.eventType === 'data_access')
    if (dataEvents.length === 0) {
      findings.push({
        id: this.generateFindingId(),
        type: 'gap',
        severity: 'high',
        title: 'Insufficient Data Access Logging',
        description: 'No data access events found - may indicate logging gaps',
        evidence: [],
        affectedEvents: [],
        riskLevel: 6,
        recommendation: 'Ensure all data access is properly logged for GDPR compliance',
        status: 'open'
      })
    }

    return findings
  }

  private analyzePCIGaps(events: AuditEvent[]): AuditFinding[] {
    const findings: AuditFinding[] = []
    
    // Check for proper transaction logging
    const txEvents = events.filter(e => e.eventType === 'financial_transaction')
    if (txEvents.length === 0) {
      findings.push({
        id: this.generateFindingId(),
        type: 'gap',
        severity: 'critical',
        title: 'No Financial Transaction Logging',
        description: 'No financial transaction events found - required for PCI DSS compliance',
        evidence: [],
        affectedEvents: [],
        riskLevel: 8,
        recommendation: 'Implement comprehensive transaction logging for PCI DSS compliance',
        status: 'open'
      })
    }

    return findings
  }

  // Anomaly detection helpers
  private async isUnusualActivityPattern(event: AuditEvent): Promise<boolean> {
    // Simplified implementation - would use ML in production
    const actorEvents = this.events.filter(e => e.actor.id === event.actor.id)
    const baseline = this.anomalyBaselines.get(event.actor.id)
    
    if (!baseline || actorEvents.length < 10) return false
    
    // Check if activity is outside normal patterns
    const currentHour = event.timestamp.getHours()
    const typicalHours = baseline.typicalHours || []
    
    return !typicalHours.includes(currentHour)
  }

  private async isRepeatedFailure(event: AuditEvent): Promise<boolean> {
    const recentFailures = this.events.filter(e => 
      e.actor.id === event.actor.id &&
      e.eventType === 'authentication' &&
      e.outcome === 'failure' &&
      e.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    )
    
    return recentFailures.length >= 5
  }

  private async isPrivilegeEscalation(event: AuditEvent): Promise<boolean> {
    return event.action.toLowerCase().includes('privilege') ||
           event.action.toLowerCase().includes('escalate') ||
           event.action.toLowerCase().includes('admin')
  }

  private async isUnusualDataAccess(event: AuditEvent): Promise<boolean> {
    if (event.eventType !== 'data_access') return false
    
    // Check if accessing sensitive data outside normal hours
    const hour = event.timestamp.getHours()
    const isSensitive = event.target.classification === 'sensitive'
    const isOutsideHours = hour < 6 || hour > 22
    
    return isSensitive && isOutsideHours
  }

  // Utility methods
  private async checkRealTimeAlerts(event: AuditEvent): Promise<void> {
    if (event.severity === 'critical' || event.outcome === 'failure') {
      console.log(`[AUDIT ALERT] ${event.severity.toUpperCase()}: ${event.eventType} - ${event.action}`)
    }
  }

  private async archiveEvent(event: AuditEvent): Promise<void> {
    // In production, would move to archive storage
    console.log(`[AUDIT] Archived event: ${event.id}`)
  }

  private async deleteEvent(eventId: string): Promise<void> {
    this.events = this.events.filter(e => e.id !== eventId)
    console.log(`[AUDIT] Deleted event: ${eventId}`)
  }

  private isArchived(event: AuditEvent): boolean {
    // Check if event is already archived
    return false // Simplified
  }

  private canBeDeleted(event: AuditEvent): boolean {
    // Check if event can be safely deleted (not subject to legal hold, etc.)
    return true // Simplified
  }

  // ID Generators
  private generateEventId(): string {
    return `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
  }

  private generateTrailId(): string {
    return `TRL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  private generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  private generateFindingId(): string {
    return `FND-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  private generateAlertId(): string {
    return `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  private initializeAuditSystem(): void {
    // Initialize baseline patterns for anomaly detection
    console.log('[AUDIT SYSTEM] Initialized audit system')
    
    // Start background processes
    if (this.config.monitoring.integrityChecking) {
      setInterval(() => {
        this.performIntegrityCheck()
      }, 60 * 60 * 1000) // Hourly integrity checks
    }

    // Start retention policy enforcement
    setInterval(() => {
      this.applyRetentionPolicies()
    }, 24 * 60 * 60 * 1000) // Daily retention cleanup
  }

  private async performIntegrityCheck(): Promise<void> {
    console.log('[AUDIT] Performing integrity check...')
    
    // Check recent events for integrity
    const recentEvents = this.events.filter(e => 
      e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )

    for (const event of recentEvents) {
      const verification = await this.verifyEventIntegrity(event.id)
      if (!verification.valid) {
        console.error(`[AUDIT] Integrity violation detected for event ${event.id}:`, verification.issues)
      }
    }
  }

  // Public API
  getEventById(id: string): AuditEvent | undefined {
    return this.events.find(e => e.id === id)
  }

  getAuditTrails(): AuditTrail[] {
    return [...this.trails]
  }

  getReports(): AuditReport[] {
    return [...this.reports].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
  }

  getAuditMetrics(): {
    totalEvents: number
    eventsLast24h: number
    totalTrails: number
    totalReports: number
    integrityViolations: number
    anomaliesDetected: number
    complianceScore: number
  } {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const eventsLast24h = this.events.filter(e => e.timestamp > last24h).length
    
    // Calculate compliance score based on findings
    const allFindings = this.reports.flatMap(r => r.findings)
    const criticalFindings = allFindings.filter(f => f.severity === 'critical').length
    const complianceScore = Math.max(0, 100 - (criticalFindings * 10))

    return {
      totalEvents: this.events.length,
      eventsLast24h,
      totalTrails: this.trails.length,
      totalReports: this.reports.length,
      integrityViolations: 0, // Would be calculated from integrity checks
      anomaliesDetected: allFindings.filter(f => f.type === 'anomaly').length,
      complianceScore
    }
  }
}

// Create and export a singleton instance
export const auditSystem = new AuditSystem({
  enableRetention: true,
  retentionDays: 90,
  enableEncryption: false,
  enableArchiving: true,
  archiveAfterDays: 30,
  enableAnomalyDetection: true,
  enableCompliance: true,
  complianceStandards: ['PCI-DSS', 'HIPAA', 'SOX', 'GDPR'],
  maxEventsPerTrail: 10000,
  maxStorageSize: 1024 * 1024 * 1024, // 1GB
  alertThresholds: {
    failedLogins: 5,
    sensitiveAccess: 10,
    dataExports: 50,
    privilegedActions: 20
  }
})