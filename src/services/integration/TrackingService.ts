/**
 * RHY_059: Shipment Tracking Service
 * Real-time tracking system with multi-carrier support and predictive analytics
 * Provides unified tracking interface with status history and delivery predictions
 * Performance target: <100ms for status updates, <200ms for comprehensive tracking
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { eventBus } from '@/services/events/event-bus'
import { notificationService } from '@/services/notifications/NotificationService'
import { carrierManager } from './CarrierManager'
import { SecurityContext } from '@/types/auth'

// ================================
// TRACKING INTERFACES
// ================================

export interface TrackingRequest {
  trackingNumber: string
  supplierId?: string
  includeHistory?: boolean
  includePredictions?: boolean
}

export interface TrackingStatus {
  code: string
  description: string
  category: 'PICKUP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'CANCELLED'
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
}

export interface TrackingEvent {
  id: string
  timestamp: Date
  status: TrackingStatus
  location?: {
    city: string
    state?: string
    country: string
    facility?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  details: string
  nextExpectedEvent?: string
  estimatedTimeToNext?: number
}

export interface DeliveryPrediction {
  estimatedDelivery: Date
  confidence: number
  factors: {
    weather: boolean
    traffic: boolean
    volume: boolean
    holiday: boolean
  }
  alternativeTimeWindows: Array<{
    start: Date
    end: Date
    probability: number
  }>
}

export interface TrackingResult {
  trackingNumber: string
  carrier: {
    id: string
    name: string
    serviceLevel: string
  }
  currentStatus: TrackingStatus
  shipmentInfo: {
    origin: string
    destination: string
    weight?: number
    dimensions?: string
    value?: number
  }
  timeline: TrackingEvent[]
  prediction?: DeliveryPrediction
  deliveryOptions?: {
    reschedule: boolean
    redirect: boolean
    holdAtLocation: boolean
    signatureRelease: boolean
  }
  lastUpdated: Date
}

// ================================
// MAIN TRACKING SERVICE
// ================================

export class TrackingService {
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Track shipment with comprehensive information
   */
  async trackShipment(
    request: TrackingRequest,
    securityContext?: SecurityContext
  ): Promise<{
    success: boolean
    tracking?: TrackingResult
    error?: string
  }> {
    try {
      // Find shipment in database
      const shipment = await rhyPrisma.rHYShipment.findFirst({
        where: {
          trackingNumber: request.trackingNumber,
          ...(request.supplierId && { supplierId: request.supplierId })
        },
        include: {
          history: {
            orderBy: { timestamp: 'desc' }
          },
          order: {
            select: {
              orderNumber: true,
              totalValue: true
            }
          },
          warehouse: {
            select: {
              name: true,
              address: true
            }
          }
        }
      })

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found'
        }
      }

      // Get latest tracking information from carrier
      const carrierTracking = await carrierManager.trackPackage(request.trackingNumber)

      // Convert carrier data to our format
      const trackingEvents = this.convertTrackingHistory(
        shipment.history,
        carrierTracking.trackingInfo?.history || []
      )

      // Determine current status
      const currentStatus = this.determineCurrentStatus(trackingEvents)

      // Generate delivery prediction if requested
      let prediction: DeliveryPrediction | undefined
      if (request.includePredictions) {
        prediction = await this.generateDeliveryPrediction(
          shipment,
          trackingEvents
        )
      }

      // Build comprehensive tracking result
      const trackingResult: TrackingResult = {
        trackingNumber: request.trackingNumber,
        carrier: {
          id: shipment.carrier.toLowerCase(),
          name: shipment.carrier,
          serviceLevel: shipment.serviceLevel
        },
        currentStatus,
        shipmentInfo: {
          origin: `${shipment.sender.city}, ${shipment.sender.state}`,
          destination: `${shipment.recipient.city}, ${shipment.recipient.state}`,
          weight: shipment.packageSpecs?.totalWeight,
          dimensions: shipment.packageSpecs?.dimensions ? 
            `${shipment.packageSpecs.dimensions.length}x${shipment.packageSpecs.dimensions.width}x${shipment.packageSpecs.dimensions.height}` : 
            undefined,
          value: shipment.order?.totalValue
        },
        timeline: trackingEvents,
        prediction,
        deliveryOptions: {
          reschedule: ['FedEx', 'UPS'].includes(shipment.carrier),
          redirect: ['FedEx', 'UPS'].includes(shipment.carrier),
          holdAtLocation: true,
          signatureRelease: shipment.signatureRequired
        },
        lastUpdated: new Date()
      }

      // Update database with latest information
      await this.updateShipmentFromTracking(shipment.id, carrierTracking.trackingInfo)

      return {
        success: true,
        tracking: trackingResult
      }

    } catch (error) {
      console.error('Failed to track shipment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Start real-time tracking updates for a shipment
   */
  async startRealTimeTracking(
    trackingNumber: string,
    supplierId: string,
    securityContext: SecurityContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already tracking
      if (this.updateIntervals.has(trackingNumber)) {
        return { success: true }
      }

      // Verify shipment access
      const shipment = await rhyPrisma.rHYShipment.findFirst({
        where: {
          trackingNumber,
          supplierId
        }
      })

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found or access denied'
        }
      }

      // Start periodic updates every 30 minutes
      const interval = setInterval(async () => {
        try {
          const result = await this.trackShipment({
            trackingNumber,
            supplierId,
            includeHistory: true,
            includePredictions: true
          }, securityContext)

          if (result.success && result.tracking) {
            // Emit real-time update
            eventBus.emit('tracking:update', {
              trackingNumber,
              supplierId,
              status: result.tracking.currentStatus,
              timestamp: new Date()
            })

            // Check for status changes and send notifications
            await this.checkForStatusChanges(shipment.id, result.tracking, securityContext)

            // Stop tracking if delivered or cancelled
            if (['DELIVERED', 'CANCELLED'].includes(result.tracking.currentStatus.category)) {
              this.stopRealTimeTracking(trackingNumber)
            }
          }

        } catch (error) {
          console.error(`Failed to update tracking for ${trackingNumber}:`, error)
        }
      }, 30 * 60 * 1000) // 30 minutes

      this.updateIntervals.set(trackingNumber, interval)

      return { success: true }

    } catch (error) {
      console.error('Failed to start real-time tracking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Stop real-time tracking for a shipment
   */
  stopRealTimeTracking(trackingNumber: string): void {
    const interval = this.updateIntervals.get(trackingNumber)
    if (interval) {
      clearInterval(interval)
      this.updateIntervals.delete(trackingNumber)
    }
  }

  /**
   * Get tracking statistics for a supplier
   */
  async getTrackingStats(
    supplierId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    totalShipments: number
    deliveredOnTime: number
    inTransit: number
    exceptions: number
    averageTransitTime: number
    carrierPerformance: Array<{
      carrier: string
      totalShipments: number
      onTimeRate: number
      exceptionRate: number
    }>
  }> {
    try {
      const where = {
        supplierId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }

      const [shipments, totalCount] = await Promise.all([
        rhyPrisma.rHYShipment.findMany({
          where,
          include: {
            history: true
          }
        }),
        rhyPrisma.rHYShipment.count({ where })
      ])

      // Calculate statistics
      const deliveredOnTime = shipments.filter(s => 
        s.status === 'DELIVERED' && 
        s.deliveredAt && 
        s.estimatedDelivery &&
        s.deliveredAt <= s.estimatedDelivery
      ).length

      const inTransit = shipments.filter(s => 
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)
      ).length

      const exceptions = shipments.filter(s => 
        s.history.some(h => h.status.includes('EXCEPTION'))
      ).length

      // Calculate average transit time
      const deliveredShipments = shipments.filter(s => s.deliveredAt)
      const averageTransitTime = deliveredShipments.length > 0 ? 
        deliveredShipments.reduce((sum, s) => {
          const transitTime = s.deliveredAt!.getTime() - s.createdAt.getTime()
          return sum + (transitTime / (24 * 60 * 60 * 1000)) // Convert to days
        }, 0) / deliveredShipments.length : 0

      // Calculate carrier performance
      const carrierGroups = shipments.reduce((groups, shipment) => {
        if (!groups[shipment.carrier]) {
          groups[shipment.carrier] = []
        }
        groups[shipment.carrier].push(shipment)
        return groups
      }, {} as Record<string, typeof shipments>)

      const carrierPerformance = Object.entries(carrierGroups).map(([carrier, carrierShipments]) => {
        const delivered = carrierShipments.filter(s => s.status === 'DELIVERED')
        const onTime = delivered.filter(s => 
          s.deliveredAt && 
          s.estimatedDelivery &&
          s.deliveredAt <= s.estimatedDelivery
        )
        const withExceptions = carrierShipments.filter(s => 
          s.history.some(h => h.status.includes('EXCEPTION'))
        )

        return {
          carrier,
          totalShipments: carrierShipments.length,
          onTimeRate: delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 0,
          exceptionRate: carrierShipments.length > 0 ? (withExceptions.length / carrierShipments.length) * 100 : 0
        }
      })

      return {
        totalShipments: totalCount,
        deliveredOnTime,
        inTransit,
        exceptions,
        averageTransitTime,
        carrierPerformance
      }

    } catch (error) {
      console.error('Failed to get tracking stats:', error)
      throw error
    }
  }

  /**
   * Get delivery exceptions and issues
   */
  async getDeliveryExceptions(
    supplierId: string,
    filters: {
      status?: string[]
      carrier?: string[]
      dateRange?: { start: Date; end: Date }
      severity?: string[]
    }
  ): Promise<Array<{
    shipmentId: string
    trackingNumber: string
    carrier: string
    status: string
    exceptionType: string
    description: string
    location?: string
    timestamp: Date
    resolutionRequired: boolean
    estimatedResolution?: Date
  }>> {
    try {
      const where: any = { supplierId }

      if (filters.carrier && filters.carrier.length > 0) {
        where.carrier = { in: filters.carrier }
      }

      if (filters.dateRange) {
        where.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      const shipments = await rhyPrisma.rHYShipment.findMany({
        where,
        include: {
          history: {
            where: {
              status: {
                contains: 'EXCEPTION'
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      })

      const exceptions = shipments.flatMap(shipment => 
        shipment.history.map(event => ({
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          carrier: shipment.carrier,
          status: shipment.status,
          exceptionType: event.status,
          description: event.details || 'Delivery exception occurred',
          location: event.location,
          timestamp: event.timestamp,
          resolutionRequired: ['DELIVERY_EXCEPTION', 'ADDRESS_CORRECTION_NEEDED', 'SIGNATURE_REQUIRED'].includes(event.status),
          estimatedResolution: this.calculateEstimatedResolution(event.status)
        }))
      )

      return exceptions

    } catch (error) {
      console.error('Failed to get delivery exceptions:', error)
      throw error
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private convertTrackingHistory(
    dbHistory: any[],
    carrierHistory: any[]
  ): TrackingEvent[] {
    const events: TrackingEvent[] = []

    // Add database history
    dbHistory.forEach(event => {
      events.push({
        id: event.id,
        timestamp: event.timestamp,
        status: this.parseTrackingStatus(event.status),
        location: event.location ? {
          city: this.extractCity(event.location),
          state: this.extractState(event.location),
          country: 'US',
          facility: event.location
        } : undefined,
        details: event.details || ''
      })
    })

    // Merge with carrier history (avoiding duplicates)
    carrierHistory.forEach(event => {
      const exists = events.some(e => 
        Math.abs(e.timestamp.getTime() - event.timestamp.getTime()) < 60000 && // Within 1 minute
        e.status.code === event.status
      )

      if (!exists) {
        events.push({
          id: `carrier_${Date.now()}_${Math.random()}`,
          timestamp: event.timestamp,
          status: this.parseTrackingStatus(event.status),
          location: event.location ? {
            city: this.extractCity(event.location),
            state: this.extractState(event.location),
            country: 'US',
            facility: event.location
          } : undefined,
          details: event.details || ''
        })
      }
    })

    // Sort by timestamp (newest first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private parseTrackingStatus(statusCode: string): TrackingStatus {
    const statusMap: Record<string, TrackingStatus> = {
      'LABEL_CREATED': {
        code: 'LABEL_CREATED',
        description: 'Shipping label created',
        category: 'PICKUP',
        severity: 'INFO'
      },
      'PICKED_UP': {
        code: 'PICKED_UP',
        description: 'Package picked up by carrier',
        category: 'PICKUP',
        severity: 'INFO'
      },
      'IN_TRANSIT': {
        code: 'IN_TRANSIT',
        description: 'Package in transit',
        category: 'IN_TRANSIT',
        severity: 'INFO'
      },
      'OUT_FOR_DELIVERY': {
        code: 'OUT_FOR_DELIVERY',
        description: 'Out for delivery',
        category: 'OUT_FOR_DELIVERY',
        severity: 'INFO'
      },
      'DELIVERED': {
        code: 'DELIVERED',
        description: 'Package delivered',
        category: 'DELIVERED',
        severity: 'SUCCESS'
      },
      'DELIVERY_EXCEPTION': {
        code: 'DELIVERY_EXCEPTION',
        description: 'Delivery exception occurred',
        category: 'EXCEPTION',
        severity: 'WARNING'
      },
      'CANCELLED': {
        code: 'CANCELLED',
        description: 'Shipment cancelled',
        category: 'CANCELLED',
        severity: 'ERROR'
      }
    }

    return statusMap[statusCode] || {
      code: statusCode,
      description: statusCode.replace(/_/g, ' ').toLowerCase(),
      category: 'IN_TRANSIT',
      severity: 'INFO'
    }
  }

  private determineCurrentStatus(events: TrackingEvent[]): TrackingStatus {
    if (events.length === 0) {
      return {
        code: 'UNKNOWN',
        description: 'Status unknown',
        category: 'IN_TRANSIT',
        severity: 'WARNING'
      }
    }

    return events[0].status
  }

  private async generateDeliveryPrediction(
    shipment: any,
    events: TrackingEvent[]
  ): Promise<DeliveryPrediction> {
    // Mock prediction algorithm - in production, this would use ML models
    const baseEstimate = shipment.estimatedDelivery || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    
    // Adjust based on current progress
    const progressFactor = events.filter(e => e.status.category !== 'EXCEPTION').length / 5
    const adjustmentHours = (1 - progressFactor) * 24

    const predictedDelivery = new Date(baseEstimate.getTime() + adjustmentHours * 60 * 60 * 1000)

    return {
      estimatedDelivery: predictedDelivery,
      confidence: 0.85,
      factors: {
        weather: false,
        traffic: true,
        volume: false,
        holiday: false
      },
      alternativeTimeWindows: [
        {
          start: new Date(predictedDelivery.getTime() - 4 * 60 * 60 * 1000),
          end: new Date(predictedDelivery.getTime() + 4 * 60 * 60 * 1000),
          probability: 0.75
        },
        {
          start: new Date(predictedDelivery.getTime() + 24 * 60 * 60 * 1000),
          end: new Date(predictedDelivery.getTime() + 28 * 60 * 60 * 1000),
          probability: 0.20
        }
      ]
    }
  }

  private async updateShipmentFromTracking(
    shipmentId: string,
    trackingInfo: any
  ): Promise<void> {
    if (!trackingInfo) return

    // Update shipment status if changed
    await rhyPrisma.rHYShipment.update({
      where: { id: shipmentId },
      data: {
        status: trackingInfo.status,
        updatedAt: new Date(),
        ...(trackingInfo.status === 'DELIVERED' && { deliveredAt: new Date() })
      }
    })

    // Add new history entries
    if (trackingInfo.history) {
      for (const event of trackingInfo.history) {
        const exists = await rhyPrisma.rHYShipmentHistory.findFirst({
          where: {
            shipmentId,
            status: event.status,
            timestamp: event.timestamp
          }
        })

        if (!exists) {
          await rhyPrisma.rHYShipmentHistory.create({
            data: {
              shipmentId,
              status: event.status,
              location: event.location,
              details: event.details,
              timestamp: event.timestamp
            }
          })
        }
      }
    }
  }

  private async checkForStatusChanges(
    shipmentId: string,
    tracking: TrackingResult,
    securityContext: SecurityContext
  ): Promise<void> {
    const lastEvent = tracking.timeline[0]
    if (!lastEvent) return

    // Check if this is a new status update
    const recentHistory = await rhyPrisma.rHYShipmentHistory.findFirst({
      where: {
        shipmentId,
        status: lastEvent.status.code,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
        }
      }
    })

    if (recentHistory) return // Already processed this update

    // Get shipment details for notification
    const shipment = await rhyPrisma.rHYShipment.findUnique({
      where: { id: shipmentId }
    })

    if (!shipment) return

    // Send status update notification
    const notificationMessages = {
      'OUT_FOR_DELIVERY': {
        title: 'Package Out for Delivery',
        message: `Your package ${tracking.trackingNumber} is out for delivery and should arrive today.`
      },
      'DELIVERED': {
        title: 'Package Delivered',
        message: `Your package ${tracking.trackingNumber} has been delivered successfully.`
      },
      'DELIVERY_EXCEPTION': {
        title: 'Delivery Exception',
        message: `There was an issue with delivery of package ${tracking.trackingNumber}. Please check tracking for details.`
      }
    }

    const notification = notificationMessages[lastEvent.status.code as keyof typeof notificationMessages]
    if (notification) {
      await notificationService.sendNotification({
        supplierId: shipment.supplierId,
        type: 'ORDER',
        title: notification.title,
        message: notification.message,
        priority: lastEvent.status.severity === 'ERROR' ? 'HIGH' : 'MEDIUM',
        channels: ['EMAIL', 'IN_APP'],
        actionUrl: `/supplier/orders/${shipment.orderId}`,
        metadata: {
          trackingNumber: tracking.trackingNumber,
          status: lastEvent.status.code,
          carrier: tracking.carrier.name
        }
      }, securityContext)
    }
  }

  private extractCity(location: string): string {
    // Simple city extraction - in production, this would be more sophisticated
    const parts = location.split(',')
    return parts[0]?.trim() || location
  }

  private extractState(location: string): string {
    // Simple state extraction
    const parts = location.split(',')
    return parts[1]?.trim() || ''
  }

  private calculateEstimatedResolution(exceptionType: string): Date | undefined {
    const resolutionTimes: Record<string, number> = {
      'DELIVERY_EXCEPTION': 1,
      'ADDRESS_CORRECTION_NEEDED': 1,
      'SIGNATURE_REQUIRED': 0.5,
      'WEATHER_DELAY': 1,
      'MECHANICAL_DELAY': 0.5
    }

    const days = resolutionTimes[exceptionType]
    if (days) {
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }

    return undefined
  }
}

// Export singleton instance
export const trackingService = new TrackingService()