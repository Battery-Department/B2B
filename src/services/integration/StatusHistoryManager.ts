/**
 * RHY_059: Status History Manager
 * Comprehensive status history management for shipment tracking
 * Maintains audit trail and provides status analytics with pattern recognition
 * Performance target: <50ms for status updates, <100ms for history queries
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { eventBus } from '@/services/events/event-bus'

// ================================
// HISTORY INTERFACES
// ================================

export interface StatusChange {
  shipmentId: string
  fromStatus: string
  toStatus: string
  timestamp: Date
  source: 'CARRIER' | 'SYSTEM' | 'MANUAL' | 'API'
  location?: {
    facility: string
    city: string
    state: string
    country: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  details: string
  metadata?: Record<string, any>
  userId?: string
  carrierEventId?: string
}

export interface StatusPattern {
  patternId: string
  name: string
  description: string
  statusSequence: string[]
  averageTransitTime: number
  reliability: number
  commonIssues: string[]
  recommendations: string[]
}

export interface HistoryQuery {
  shipmentId?: string
  supplierId?: string
  carrier?: string
  status?: string[]
  source?: string[]
  location?: string
  dateRange?: {
    start: Date
    end: Date
  }
  limit?: number
  offset?: number
  includeMetadata?: boolean
}

export interface StatusAnalytics {
  totalEvents: number
  statusDistribution: Record<string, number>
  averageStatusDuration: Record<string, number>
  commonTransitions: Array<{
    from: string
    to: string
    count: number
    averageDuration: number
  }>
  exceptionRate: number
  patterns: StatusPattern[]
  performanceMetrics: {
    onTimeDeliveryRate: number
    averageTransitTime: number
    firstMileSpeed: number
    lastMileSpeed: number
  }
}

// ================================
// MAIN STATUS HISTORY MANAGER
// ================================

export class StatusHistoryManager {
  private statusCache: Map<string, any> = new Map()
  private patternCache: Map<string, StatusPattern[]> = new Map()

  /**
   * Record a new status change
   */
  async recordStatusChange(change: StatusChange): Promise<{
    success: boolean
    historyId?: string
    error?: string
  }> {
    try {
      // Validate shipment exists
      const shipment = await rhyPrisma.rHYShipment.findUnique({
        where: { id: change.shipmentId },
        select: { id: true, status: true, supplierId: true }
      })

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found'
        }
      }

      // Get previous status for validation
      const previousStatus = shipment.status

      // Validate status transition
      const isValidTransition = this.validateStatusTransition(
        change.fromStatus || previousStatus,
        change.toStatus
      )

      if (!isValidTransition) {
        console.warn(`Invalid status transition: ${change.fromStatus} -> ${change.toStatus}`)
      }

      // Create history record
      const historyRecord = await rhyPrisma.rHYShipmentHistory.create({
        data: {
          shipmentId: change.shipmentId,
          status: change.toStatus,
          location: change.location?.facility || 
            (change.location ? `${change.location.city}, ${change.location.state}` : null),
          details: change.details,
          timestamp: change.timestamp,
          source: change.source,
          userId: change.userId,
          carrierEventId: change.carrierEventId,
          metadata: change.metadata || {},
          coordinates: change.location?.coordinates ? {
            latitude: change.location.coordinates.latitude,
            longitude: change.location.coordinates.longitude
          } : null
        }
      })

      // Update shipment current status
      await rhyPrisma.rHYShipment.update({
        where: { id: change.shipmentId },
        data: {
          status: change.toStatus,
          updatedAt: change.timestamp,
          ...(change.toStatus === 'DELIVERED' && { deliveredAt: change.timestamp })
        }
      })

      // Calculate status duration for analytics
      if (change.fromStatus && change.fromStatus !== change.toStatus) {
        await this.recordStatusDuration(
          change.shipmentId,
          change.fromStatus,
          change.toStatus,
          change.timestamp
        )
      }

      // Update cache
      this.statusCache.set(change.shipmentId, {
        status: change.toStatus,
        timestamp: change.timestamp,
        location: change.location
      })

      // Emit real-time event
      eventBus.emit('status:changed', {
        shipmentId: change.shipmentId,
        supplierId: shipment.supplierId,
        fromStatus: change.fromStatus,
        toStatus: change.toStatus,
        timestamp: change.timestamp,
        location: change.location
      })

      // Check for pattern recognition
      await this.analyzeStatusPattern(change.shipmentId, change.toStatus)

      return {
        success: true,
        historyId: historyRecord.id
      }

    } catch (error) {
      console.error('Failed to record status change:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get comprehensive status history
   */
  async getStatusHistory(query: HistoryQuery): Promise<{
    history: Array<{
      id: string
      shipmentId: string
      trackingNumber?: string
      status: string
      location?: string
      details: string
      timestamp: Date
      source: string
      duration?: number
      metadata?: Record<string, any>
    }>
    total: number
    analytics?: StatusAnalytics
  }> {
    try {
      const where: any = {}

      // Build query filters
      if (query.shipmentId) {
        where.shipmentId = query.shipmentId
      }

      if (query.supplierId) {
        where.shipment = {
          supplierId: query.supplierId
        }
      }

      if (query.status && query.status.length > 0) {
        where.status = { in: query.status }
      }

      if (query.source && query.source.length > 0) {
        where.source = { in: query.source }
      }

      if (query.location) {
        where.location = {
          contains: query.location,
          mode: 'insensitive'
        }
      }

      if (query.dateRange) {
        where.timestamp = {
          gte: query.dateRange.start,
          lte: query.dateRange.end
        }
      }

      // Execute query with pagination
      const [history, total] = await Promise.all([
        rhyPrisma.rHYShipmentHistory.findMany({
          where,
          include: {
            shipment: {
              select: {
                trackingNumber: true,
                carrier: true,
                supplierId: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: query.limit || 50,
          skip: query.offset || 0
        }),
        rhyPrisma.rHYShipmentHistory.count({ where })
      ])

      // Calculate status durations
      const historyWithDurations = await Promise.all(
        history.map(async (record, index) => {
          let duration: number | undefined

          if (index < history.length - 1) {
            const nextRecord = history[index + 1]
            duration = record.timestamp.getTime() - nextRecord.timestamp.getTime()
            duration = Math.round(duration / (1000 * 60 * 60)) // Convert to hours
          }

          return {
            id: record.id,
            shipmentId: record.shipmentId,
            trackingNumber: record.shipment?.trackingNumber,
            status: record.status,
            location: record.location || undefined,
            details: record.details,
            timestamp: record.timestamp,
            source: record.source,
            duration,
            ...(query.includeMetadata && { metadata: record.metadata })
          }
        })
      )

      // Generate analytics if requested
      let analytics: StatusAnalytics | undefined
      if (query.supplierId && !query.shipmentId) {
        analytics = await this.generateStatusAnalytics(query.supplierId, query.dateRange)
      }

      return {
        history: historyWithDurations,
        total,
        analytics
      }

    } catch (error) {
      console.error('Failed to get status history:', error)
      throw error
    }
  }

  /**
   * Get status patterns for predictive analytics
   */
  async getStatusPatterns(
    carrier?: string,
    serviceLevel?: string
  ): Promise<StatusPattern[]> {
    try {
      const cacheKey = `patterns_${carrier || 'all'}_${serviceLevel || 'all'}`
      const cached = this.patternCache.get(cacheKey)

      if (cached) {
        return cached
      }

      // Mock pattern data - in production, this would be ML-generated
      const patterns: StatusPattern[] = [
        {
          patternId: 'standard_ground',
          name: 'Standard Ground Delivery',
          description: 'Typical ground shipment pattern',
          statusSequence: ['LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
          averageTransitTime: 3.2,
          reliability: 0.92,
          commonIssues: ['Weather delays', 'Address corrections'],
          recommendations: ['Ship early for weather-prone areas', 'Verify addresses']
        },
        {
          patternId: 'express_overnight',
          name: 'Express Overnight',
          description: 'Next-day delivery pattern',
          statusSequence: ['LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
          averageTransitTime: 1.1,
          reliability: 0.96,
          commonIssues: ['Late pickup', 'Signature requirements'],
          recommendations: ['Ensure early pickup cutoff', 'Confirm signature options']
        },
        {
          patternId: 'international',
          name: 'International Shipping',
          description: 'Cross-border shipment pattern',
          statusSequence: ['LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
          averageTransitTime: 7.5,
          reliability: 0.87,
          commonIssues: ['Customs delays', 'Documentation issues', 'Duty payments'],
          recommendations: ['Complete customs forms accurately', 'Prepay duties when possible']
        }
      ]

      // Filter by carrier and service level
      const filteredPatterns = patterns.filter(pattern => {
        if (carrier && !pattern.name.toLowerCase().includes(carrier.toLowerCase())) {
          return false
        }
        if (serviceLevel && !pattern.name.toLowerCase().includes(serviceLevel.toLowerCase())) {
          return false
        }
        return true
      })

      // Cache for 1 hour
      this.patternCache.set(cacheKey, filteredPatterns)
      setTimeout(() => this.patternCache.delete(cacheKey), 60 * 60 * 1000)

      return filteredPatterns

    } catch (error) {
      console.error('Failed to get status patterns:', error)
      return []
    }
  }

  /**
   * Get real-time status for multiple shipments
   */
  async getBulkStatus(shipmentIds: string[]): Promise<Map<string, {
    status: string
    timestamp: Date
    location?: string
    nextExpected?: string
  }>> {
    try {
      const results = new Map()

      // Check cache first
      const uncachedIds = shipmentIds.filter(id => !this.statusCache.has(id))

      if (uncachedIds.length > 0) {
        // Query database for uncached shipments
        const shipments = await rhyPrisma.rHYShipment.findMany({
          where: {
            id: { in: uncachedIds }
          },
          include: {
            history: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        })

        // Update cache
        shipments.forEach(shipment => {
          const latestHistory = shipment.history[0]
          const statusInfo = {
            status: shipment.status,
            timestamp: shipment.updatedAt,
            location: latestHistory?.location || undefined
          }

          this.statusCache.set(shipment.id, statusInfo)
          results.set(shipment.id, statusInfo)
        })
      }

      // Add cached results
      shipmentIds.forEach(id => {
        if (this.statusCache.has(id)) {
          results.set(id, this.statusCache.get(id))
        }
      })

      return results

    } catch (error) {
      console.error('Failed to get bulk status:', error)
      return new Map()
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private validateStatusTransition(fromStatus: string, toStatus: string): boolean {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'LABEL_CREATED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['IN_TRANSIT', 'RETURNED_TO_SENDER'],
      'IN_TRANSIT': ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_EXCEPTION', 'CUSTOMS_CLEARANCE'],
      'CUSTOMS_CLEARANCE': ['IN_TRANSIT', 'DELIVERY_EXCEPTION'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'DELIVERY_EXCEPTION', 'ATTEMPTED_DELIVERY'],
      'ATTEMPTED_DELIVERY': ['OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_EXCEPTION'],
      'DELIVERY_EXCEPTION': ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED_TO_SENDER'],
      'DELIVERED': [], // Terminal state
      'RETURNED_TO_SENDER': [], // Terminal state
      'CANCELLED': [] // Terminal state
    }

    const allowedTransitions = validTransitions[fromStatus] || []
    return allowedTransitions.includes(toStatus) || fromStatus === toStatus
  }

  private async recordStatusDuration(
    shipmentId: string,
    fromStatus: string,
    toStatus: string,
    currentTimestamp: Date
  ): Promise<void> {
    try {
      // Find the previous status entry
      const previousEntry = await rhyPrisma.rHYShipmentHistory.findFirst({
        where: {
          shipmentId,
          status: fromStatus
        },
        orderBy: { timestamp: 'desc' }
      })

      if (previousEntry) {
        const duration = currentTimestamp.getTime() - previousEntry.timestamp.getTime()
        const durationHours = Math.round(duration / (1000 * 60 * 60))

        // Store duration analytics
        await rhyPrisma.rHYStatusDuration.upsert({
          where: {
            shipmentId_fromStatus_toStatus: {
              shipmentId,
              fromStatus,
              toStatus
            }
          },
          create: {
            shipmentId,
            fromStatus,
            toStatus,
            durationHours,
            recordedAt: currentTimestamp
          },
          update: {
            durationHours,
            recordedAt: currentTimestamp
          }
        })
      }

    } catch (error) {
      console.error('Failed to record status duration:', error)
    }
  }

  private async analyzeStatusPattern(shipmentId: string, currentStatus: string): Promise<void> {
    try {
      // Get full status history for pattern analysis
      const history = await rhyPrisma.rHYShipmentHistory.findMany({
        where: { shipmentId },
        orderBy: { timestamp: 'asc' },
        select: { status: true, timestamp: true }
      })

      if (history.length < 2) return

      // Extract status sequence
      const statusSequence = history.map(h => h.status)

      // Check against known patterns
      const patterns = await this.getStatusPatterns()
      
      for (const pattern of patterns) {
        const isMatch = this.isSequenceMatch(statusSequence, pattern.statusSequence)
        
        if (isMatch) {
          // Record pattern match for analytics
          await rhyPrisma.rHYPatternMatch.create({
            data: {
              shipmentId,
              patternId: pattern.patternId,
              confidence: this.calculatePatternConfidence(statusSequence, pattern.statusSequence),
              matchedAt: new Date()
            }
          })

          // Emit pattern recognition event
          eventBus.emit('pattern:recognized', {
            shipmentId,
            patternId: pattern.patternId,
            currentStatus,
            expectedNext: this.predictNextStatus(statusSequence, pattern.statusSequence)
          })

          break
        }
      }

    } catch (error) {
      console.error('Failed to analyze status pattern:', error)
    }
  }

  private async generateStatusAnalytics(
    supplierId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<StatusAnalytics> {
    try {
      const where: any = {
        shipment: { supplierId }
      }

      if (dateRange) {
        where.timestamp = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      // Get all history records
      const [history, statusCounts, durations] = await Promise.all([
        rhyPrisma.rHYShipmentHistory.findMany({
          where,
          include: {
            shipment: {
              select: {
                estimatedDelivery: true,
                deliveredAt: true,
                createdAt: true
              }
            }
          }
        }),
        rhyPrisma.rHYShipmentHistory.groupBy({
          by: ['status'],
          where,
          _count: true
        }),
        rhyPrisma.rHYStatusDuration.findMany({
          where: {
            shipment: { supplierId },
            ...(dateRange && {
              recordedAt: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            })
          }
        })
      ])

      // Calculate metrics
      const totalEvents = history.length
      const statusDistribution = Object.fromEntries(
        statusCounts.map(s => [s.status, s._count])
      )

      const averageStatusDuration = this.calculateAverageStatusDurations(durations)
      const commonTransitions = this.calculateCommonTransitions(history)
      const exceptionRate = this.calculateExceptionRate(history)
      const performanceMetrics = this.calculatePerformanceMetrics(history)

      return {
        totalEvents,
        statusDistribution,
        averageStatusDuration,
        commonTransitions,
        exceptionRate,
        patterns: await this.getStatusPatterns(),
        performanceMetrics
      }

    } catch (error) {
      console.error('Failed to generate status analytics:', error)
      throw error
    }
  }

  private isSequenceMatch(actual: string[], expected: string[]): boolean {
    // Check if actual sequence contains the expected pattern
    for (let i = 0; i <= actual.length - expected.length; i++) {
      let matches = 0
      for (let j = 0; j < expected.length; j++) {
        if (actual[i + j] === expected[j]) {
          matches++
        }
      }
      
      // Allow some flexibility (80% match)
      if (matches / expected.length >= 0.8) {
        return true
      }
    }
    
    return false
  }

  private calculatePatternConfidence(actual: string[], expected: string[]): number {
    const matches = actual.filter((status, index) => expected[index] === status).length
    return matches / Math.max(actual.length, expected.length)
  }

  private predictNextStatus(current: string[], pattern: string[]): string | undefined {
    const currentIndex = current.length - 1
    if (currentIndex >= 0 && currentIndex < pattern.length - 1) {
      return pattern[currentIndex + 1]
    }
    return undefined
  }

  private calculateAverageStatusDurations(durations: any[]): Record<string, number> {
    const statusDurations: Record<string, number[]> = {}

    durations.forEach(d => {
      const key = `${d.fromStatus}_to_${d.toStatus}`
      if (!statusDurations[key]) {
        statusDurations[key] = []
      }
      statusDurations[key].push(d.durationHours)
    })

    return Object.fromEntries(
      Object.entries(statusDurations).map(([key, values]) => [
        key,
        values.reduce((sum, val) => sum + val, 0) / values.length
      ])
    )
  }

  private calculateCommonTransitions(history: any[]): Array<{
    from: string
    to: string
    count: number
    averageDuration: number
  }> {
    const transitions: Record<string, { count: number; totalDuration: number }> = {}

    for (let i = 0; i < history.length - 1; i++) {
      const from = history[i + 1].status
      const to = history[i].status
      const duration = history[i].timestamp.getTime() - history[i + 1].timestamp.getTime()

      const key = `${from}_to_${to}`
      if (!transitions[key]) {
        transitions[key] = { count: 0, totalDuration: 0 }
      }

      transitions[key].count++
      transitions[key].totalDuration += duration
    }

    return Object.entries(transitions)
      .map(([key, data]) => {
        const [from, , to] = key.split('_')
        return {
          from,
          to,
          count: data.count,
          averageDuration: Math.round(data.totalDuration / data.count / (1000 * 60 * 60)) // Hours
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 transitions
  }

  private calculateExceptionRate(history: any[]): number {
    const totalShipments = new Set(history.map(h => h.shipmentId)).size
    const shipmentsWithExceptions = new Set(
      history
        .filter(h => h.status.includes('EXCEPTION') || h.status.includes('ATTEMPTED'))
        .map(h => h.shipmentId)
    ).size

    return totalShipments > 0 ? (shipmentsWithExceptions / totalShipments) * 100 : 0
  }

  private calculatePerformanceMetrics(history: any[]): {
    onTimeDeliveryRate: number
    averageTransitTime: number
    firstMileSpeed: number
    lastMileSpeed: number
  } {
    const shipments = new Map()

    // Group history by shipment
    history.forEach(h => {
      if (!shipments.has(h.shipmentId)) {
        shipments.set(h.shipmentId, [])
      }
      shipments.get(h.shipmentId).push(h)
    })

    let onTimeDeliveries = 0
    let totalDeliveries = 0
    let totalTransitTime = 0
    let firstMileTime = 0
    let lastMileTime = 0
    let validTransits = 0

    shipments.forEach(shipmentHistory => {
      const delivered = shipmentHistory.find((h: any) => h.status === 'DELIVERED')
      const created = shipmentHistory.find((h: any) => h.status === 'LABEL_CREATED')
      const pickedUp = shipmentHistory.find((h: any) => h.status === 'PICKED_UP')
      const outForDelivery = shipmentHistory.find((h: any) => h.status === 'OUT_FOR_DELIVERY')

      if (delivered && created) {
        totalDeliveries++
        const transitTime = delivered.timestamp.getTime() - created.timestamp.getTime()
        totalTransitTime += transitTime

        if (delivered.shipment?.estimatedDelivery && 
            delivered.timestamp <= delivered.shipment.estimatedDelivery) {
          onTimeDeliveries++
        }

        if (pickedUp && created) {
          firstMileTime += pickedUp.timestamp.getTime() - created.timestamp.getTime()
        }

        if (delivered && outForDelivery) {
          lastMileTime += delivered.timestamp.getTime() - outForDelivery.timestamp.getTime()
        }

        validTransits++
      }
    })

    return {
      onTimeDeliveryRate: totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0,
      averageTransitTime: validTransits > 0 ? totalTransitTime / validTransits / (1000 * 60 * 60 * 24) : 0, // Days
      firstMileSpeed: validTransits > 0 ? firstMileTime / validTransits / (1000 * 60 * 60) : 0, // Hours
      lastMileSpeed: validTransits > 0 ? lastMileTime / validTransits / (1000 * 60 * 60) : 0 // Hours
    }
  }
}

// Export singleton instance
export const statusHistoryManager = new StatusHistoryManager()