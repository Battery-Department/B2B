/**
 * RHY_059: Order Integration Services
 * Enterprise-grade order integration system with multi-carrier support
 * Provides unified API for order management across multiple logistics providers
 * Performance target: <150ms for shipment creation, <100ms for tracking updates
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { authService } from '@/services/auth/AuthService'
import { eventBus } from '@/services/events/event-bus'
import { notificationService } from '@/services/notifications/NotificationService'
import { SecurityContext } from '@/types/auth'

// ================================
// CORE INTERFACES
// ================================

export interface OrderIntegrationRequest {
  orderId: string
  supplierId: string
  warehouseId: string
  items: OrderIntegrationItem[]
  shipping: ShippingDetails
  priority: 'STANDARD' | 'EXPEDITED' | 'OVERNIGHT' | 'SAME_DAY'
  specialInstructions?: string
  insuranceValue?: number
  signatureRequired?: boolean
  trackingNotifications?: boolean
}

export interface OrderIntegrationItem {
  productId: string
  sku: string
  name: string
  quantity: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  value: number
  hazmatCode?: string
  customsInfo?: {
    description: string
    countryOfOrigin: string
    harmonizedCode: string
  }
}

export interface ShippingDetails {
  recipient: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
    email?: string
  }
  sender: {
    name: string
    company: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }
}

export interface CarrierResponse {
  success: boolean
  trackingNumber?: string
  label?: string
  cost?: number
  estimatedDelivery?: Date
  error?: string
  carrierName: string
  serviceLevel: string
}

export interface TrackingUpdate {
  trackingNumber: string
  status: string
  location?: string
  timestamp: Date
  details?: string
  isDelivered: boolean
  signedBy?: string
  deliveryAttempts?: number
}

// ================================
// CARRIER CONFIGURATIONS
// ================================

export interface CarrierConfig {
  name: string
  apiKey: string
  endpoint: string
  supportedServices: string[]
  regions: string[]
  maxWeight: number
  maxDimensions: {
    length: number
    width: number
    height: number
  }
  rates: {
    [serviceLevel: string]: {
      baseRate: number
      perPound: number
      perMile?: number
    }
  }
}

// ================================
// MAIN INTEGRATION SERVICE
// ================================

export class OrderIntegrationService {
  private carriers: Map<string, CarrierConfig> = new Map()

  constructor() {
    this.initializeCarriers()
  }

  /**
   * Create shipment with automatic carrier selection
   */
  async createShipment(
    request: OrderIntegrationRequest,
    securityContext: SecurityContext
  ): Promise<{
    success: boolean
    shipment?: any
    trackingNumber?: string
    estimatedDelivery?: Date
    carrierUsed?: string
    cost?: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // Validate supplier access
      const supplierSession = await authService.validateSession(
        securityContext.authToken || '',
        securityContext
      )

      if (!supplierSession.valid || !supplierSession.supplier) {
        return {
          success: false,
          error: 'Invalid supplier session'
        }
      }

      // Validate order ownership
      const order = await rhyPrisma.rHYOrder.findFirst({
        where: {
          id: request.orderId,
          supplierId: request.supplierId
        },
        include: {
          warehouse: true,
          items: true
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found or access denied'
        }
      }

      // Calculate package specifications
      const packageSpecs = this.calculatePackageSpecs(request.items)

      // Select optimal carrier
      const selectedCarrier = await this.selectOptimalCarrier(
        request,
        packageSpecs
      )

      if (!selectedCarrier) {
        return {
          success: false,
          error: 'No suitable carrier found for this shipment'
        }
      }

      // Create shipment with selected carrier
      const carrierResponse = await this.createCarrierShipment(
        request,
        selectedCarrier,
        packageSpecs
      )

      if (!carrierResponse.success) {
        return {
          success: false,
          error: carrierResponse.error || 'Carrier shipment creation failed'
        }
      }

      // Store shipment record
      const shipment = await rhyPrisma.rHYShipment.create({
        data: {
          orderId: request.orderId,
          supplierId: request.supplierId,
          warehouseId: request.warehouseId,
          trackingNumber: carrierResponse.trackingNumber!,
          carrier: selectedCarrier.name,
          serviceLevel: carrierResponse.serviceLevel,
          status: 'LABEL_CREATED',
          cost: carrierResponse.cost || 0,
          estimatedDelivery: carrierResponse.estimatedDelivery,
          recipient: request.shipping.recipient,
          sender: request.shipping.sender,
          items: request.items,
          packageSpecs,
          specialInstructions: request.specialInstructions,
          insuranceValue: request.insuranceValue,
          signatureRequired: request.signatureRequired || false,
          trackingNotifications: request.trackingNotifications || true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Update order status
      await rhyPrisma.rHYOrder.update({
        where: { id: request.orderId },
        data: {
          status: 'SHIPPED',
          shippedAt: new Date(),
          trackingNumber: carrierResponse.trackingNumber,
          updatedAt: new Date()
        }
      })

      // Create shipment history entry
      await rhyPrisma.rHYShipmentHistory.create({
        data: {
          shipmentId: shipment.id,
          status: 'LABEL_CREATED',
          location: request.shipping.sender.city,
          details: `Shipment label created via ${selectedCarrier.name}`,
          timestamp: new Date()
        }
      })

      // Send notifications
      if (request.trackingNotifications) {
        await this.sendTrackingNotification(
          shipment,
          'SHIPMENT_CREATED',
          securityContext
        )
      }

      // Emit real-time event
      eventBus.emit('shipment:created', {
        shipmentId: shipment.id,
        orderId: request.orderId,
        trackingNumber: carrierResponse.trackingNumber,
        carrier: selectedCarrier.name
      })

      const processingTime = Date.now() - startTime

      console.log(`Shipment created successfully in ${processingTime}ms:`, {
        shipmentId: shipment.id,
        trackingNumber: carrierResponse.trackingNumber,
        carrier: selectedCarrier.name,
        cost: carrierResponse.cost
      })

      return {
        success: true,
        shipment,
        trackingNumber: carrierResponse.trackingNumber,
        estimatedDelivery: carrierResponse.estimatedDelivery,
        carrierUsed: selectedCarrier.name,
        cost: carrierResponse.cost
      }

    } catch (error) {
      console.error('Failed to create shipment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Track shipment across all carriers
   */
  async trackShipment(
    trackingNumber: string,
    supplierId?: string,
    securityContext?: SecurityContext
  ): Promise<{
    success: boolean
    tracking?: TrackingUpdate[]
    currentStatus?: string
    estimatedDelivery?: Date
    error?: string
  }> {
    try {
      // Find shipment record
      const shipment = await rhyPrisma.rHYShipment.findFirst({
        where: {
          trackingNumber,
          ...(supplierId && { supplierId })
        },
        include: {
          history: {
            orderBy: { timestamp: 'desc' }
          }
        }
      })

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found'
        }
      }

      // Get tracking updates from carrier
      const carrierTracking = await this.getCarrierTracking(
        trackingNumber,
        shipment.carrier
      )

      if (!carrierTracking.success) {
        // Return cached tracking data if carrier API fails
        return {
          success: true,
          tracking: shipment.history.map(h => ({
            trackingNumber,
            status: h.status,
            location: h.location || '',
            timestamp: h.timestamp,
            details: h.details,
            isDelivered: h.status === 'DELIVERED',
            signedBy: h.signedBy || undefined,
            deliveryAttempts: h.deliveryAttempts || undefined
          })),
          currentStatus: shipment.status,
          estimatedDelivery: shipment.estimatedDelivery || undefined
        }
      }

      // Update shipment with latest tracking data
      await this.updateShipmentTracking(shipment.id, carrierTracking.updates!)

      return {
        success: true,
        tracking: carrierTracking.updates!,
        currentStatus: carrierTracking.updates![0]?.status,
        estimatedDelivery: shipment.estimatedDelivery || undefined
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
   * Get shipments for supplier with filtering
   */
  async getSupplierShipments(
    supplierId: string,
    filters: {
      status?: string[]
      carrier?: string[]
      dateRange?: { start: Date; end: Date }
      page?: number
      limit?: number
    },
    securityContext: SecurityContext
  ): Promise<{
    shipments: any[]
    total: number
    pagination: any
  }> {
    try {
      const where: any = { supplierId }

      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status }
      }

      if (filters.carrier && filters.carrier.length > 0) {
        where.carrier = { in: filters.carrier }
      }

      if (filters.dateRange) {
        where.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const [shipments, total] = await Promise.all([
        rhyPrisma.rHYShipment.findMany({
          where,
          include: {
            order: {
              select: {
                orderNumber: true,
                totalValue: true
              }
            },
            warehouse: {
              select: {
                name: true,
                region: true
              }
            },
            history: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        rhyPrisma.rHYShipment.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        shipments: shipments.map(shipment => ({
          id: shipment.id,
          orderId: shipment.orderId,
          orderNumber: shipment.order?.orderNumber,
          trackingNumber: shipment.trackingNumber,
          carrier: shipment.carrier,
          serviceLevel: shipment.serviceLevel,
          status: shipment.status,
          cost: shipment.cost,
          estimatedDelivery: shipment.estimatedDelivery,
          recipient: shipment.recipient,
          warehouse: shipment.warehouse,
          latestUpdate: shipment.history[0] || null,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt
        })),
        total,
        pagination: {
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }

    } catch (error) {
      console.error('Failed to get supplier shipments:', error)
      throw error
    }
  }

  /**
   * Cancel shipment (if possible)
   */
  async cancelShipment(
    shipmentId: string,
    reason: string,
    supplierId: string,
    securityContext: SecurityContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const shipment = await rhyPrisma.rHYShipment.findFirst({
        where: {
          id: shipmentId,
          supplierId
        }
      })

      if (!shipment) {
        return { success: false, error: 'Shipment not found' }
      }

      if (['DELIVERED', 'CANCELLED'].includes(shipment.status)) {
        return { success: false, error: 'Cannot cancel completed or already cancelled shipment' }
      }

      // Attempt carrier cancellation
      const carrierCancel = await this.cancelCarrierShipment(
        shipment.trackingNumber,
        shipment.carrier
      )

      // Update shipment status regardless of carrier response
      await rhyPrisma.rHYShipment.update({
        where: { id: shipmentId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      })

      // Add history entry
      await rhyPrisma.rHYShipmentHistory.create({
        data: {
          shipmentId,
          status: 'CANCELLED',
          details: `Shipment cancelled: ${reason}`,
          timestamp: new Date()
        }
      })

      // Send notification
      await this.sendTrackingNotification(
        shipment as any,
        'SHIPMENT_CANCELLED',
        securityContext
      )

      return { success: true }

    } catch (error) {
      console.error('Failed to cancel shipment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private initializeCarriers(): void {
    // Initialize mock carrier configurations
    this.carriers.set('fedex', {
      name: 'FedEx',
      apiKey: 'fedex_api_key',
      endpoint: 'https://api.fedex.com/ship/v1',
      supportedServices: ['GROUND', 'EXPRESS', 'OVERNIGHT'],
      regions: ['US', 'CA', 'INTL'],
      maxWeight: 150,
      maxDimensions: { length: 108, width: 70, height: 70 },
      rates: {
        GROUND: { baseRate: 8.50, perPound: 0.75 },
        EXPRESS: { baseRate: 15.00, perPound: 1.25 },
        OVERNIGHT: { baseRate: 35.00, perPound: 2.50 }
      }
    })

    this.carriers.set('ups', {
      name: 'UPS',
      apiKey: 'ups_api_key',
      endpoint: 'https://api.ups.com/ship/v1',
      supportedServices: ['GROUND', 'AIR', 'NEXT_DAY'],
      regions: ['US', 'CA', 'INTL'],
      maxWeight: 150,
      maxDimensions: { length: 108, width: 70, height: 70 },
      rates: {
        GROUND: { baseRate: 8.25, perPound: 0.70 },
        AIR: { baseRate: 16.00, perPound: 1.30 },
        NEXT_DAY: { baseRate: 40.00, perPound: 2.75 }
      }
    })

    this.carriers.set('usps', {
      name: 'USPS',
      apiKey: 'usps_api_key',
      endpoint: 'https://api.usps.com/ship/v1',
      supportedServices: ['GROUND', 'PRIORITY', 'EXPRESS'],
      regions: ['US'],
      maxWeight: 70,
      maxDimensions: { length: 108, width: 70, height: 70 },
      rates: {
        GROUND: { baseRate: 6.50, perPound: 0.60 },
        PRIORITY: { baseRate: 12.00, perPound: 1.00 },
        EXPRESS: { baseRate: 28.00, perPound: 2.25 }
      }
    })
  }

  private calculatePackageSpecs(items: OrderIntegrationItem[]): {
    totalWeight: number
    dimensions: { length: number; width: number; height: number }
    totalValue: number
  } {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0)

    // Simple box optimization - in production, this would be more sophisticated
    const totalVolume = items.reduce((sum, item) => {
      const itemVolume = item.dimensions.length * item.dimensions.width * item.dimensions.height
      return sum + (itemVolume * item.quantity)
    }, 0)

    const cubeRoot = Math.cbrt(totalVolume)
    const dimensions = {
      length: Math.max(12, Math.ceil(cubeRoot * 1.2)),
      width: Math.max(12, Math.ceil(cubeRoot)),
      height: Math.max(6, Math.ceil(cubeRoot * 0.8))
    }

    return {
      totalWeight,
      dimensions,
      totalValue
    }
  }

  private async selectOptimalCarrier(
    request: OrderIntegrationRequest,
    packageSpecs: any
  ): Promise<CarrierConfig | null> {
    const availableCarriers = Array.from(this.carriers.values()).filter(carrier => {
      // Check weight limits
      if (packageSpecs.totalWeight > carrier.maxWeight) return false

      // Check dimension limits
      const { length, width, height } = packageSpecs.dimensions
      if (length > carrier.maxDimensions.length || 
          width > carrier.maxDimensions.width || 
          height > carrier.maxDimensions.height) return false

      // Check service availability
      const serviceMapping: Record<string, string> = {
        'STANDARD': 'GROUND',
        'EXPEDITED': carrier.name === 'USPS' ? 'PRIORITY' : 'EXPRESS',
        'OVERNIGHT': carrier.name === 'USPS' ? 'EXPRESS' : 'OVERNIGHT',
        'SAME_DAY': 'EXPRESS'
      }

      const requiredService = serviceMapping[request.priority]
      return carrier.supportedServices.includes(requiredService)
    })

    if (availableCarriers.length === 0) return null

    // Select carrier with best rate for the service level
    const carrierRates = availableCarriers.map(carrier => {
      const serviceMapping: Record<string, string> = {
        'STANDARD': 'GROUND',
        'EXPEDITED': carrier.name === 'USPS' ? 'PRIORITY' : 'EXPRESS',
        'OVERNIGHT': carrier.name === 'USPS' ? 'EXPRESS' : 'OVERNIGHT',
        'SAME_DAY': 'EXPRESS'
      }

      const service = serviceMapping[request.priority]
      const rate = carrier.rates[service]
      const totalCost = rate.baseRate + (packageSpecs.totalWeight * rate.perPound)

      return { carrier, totalCost, service }
    })

    // Sort by cost and return cheapest
    carrierRates.sort((a, b) => a.totalCost - b.totalCost)
    return carrierRates[0].carrier
  }

  private async createCarrierShipment(
    request: OrderIntegrationRequest,
    carrier: CarrierConfig,
    packageSpecs: any
  ): Promise<CarrierResponse> {
    try {
      // Mock carrier API call - in production, this would be actual API integration
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call

      const trackingNumber = `${carrier.name.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
      
      const serviceMapping: Record<string, string> = {
        'STANDARD': 'GROUND',
        'EXPEDITED': carrier.name === 'USPS' ? 'PRIORITY' : 'EXPRESS',
        'OVERNIGHT': carrier.name === 'USPS' ? 'EXPRESS' : 'OVERNIGHT',
        'SAME_DAY': 'EXPRESS'
      }

      const service = serviceMapping[request.priority]
      const rate = carrier.rates[service]
      const cost = rate.baseRate + (packageSpecs.totalWeight * rate.perPound)

      // Calculate estimated delivery
      const businessDays = service === 'GROUND' ? 3 : service.includes('EXPRESS') || service.includes('OVERNIGHT') ? 1 : 2
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + businessDays)

      return {
        success: true,
        trackingNumber,
        label: `mock_label_${trackingNumber}.pdf`,
        cost,
        estimatedDelivery,
        carrierName: carrier.name,
        serviceLevel: service
      }

    } catch (error) {
      return {
        success: false,
        error: `${carrier.name} API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        carrierName: carrier.name,
        serviceLevel: 'UNKNOWN'
      }
    }
  }

  private async getCarrierTracking(
    trackingNumber: string,
    carrierName: string
  ): Promise<{ success: boolean; updates?: TrackingUpdate[] }> {
    try {
      // Mock carrier tracking API - in production, this would be actual API integration
      await new Promise(resolve => setTimeout(resolve, 75))

      const mockUpdates: TrackingUpdate[] = [
        {
          trackingNumber,
          status: 'IN_TRANSIT',
          location: 'Distribution Center - Atlanta, GA',
          timestamp: new Date(),
          details: 'Package is in transit to destination',
          isDelivered: false
        },
        {
          trackingNumber,
          status: 'PICKED_UP',
          location: 'Origin Facility - Memphis, TN',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          details: 'Package picked up by carrier',
          isDelivered: false
        }
      ]

      return {
        success: true,
        updates: mockUpdates
      }

    } catch (error) {
      return { success: false }
    }
  }

  private async updateShipmentTracking(
    shipmentId: string,
    updates: TrackingUpdate[]
  ): Promise<void> {
    for (const update of updates) {
      // Check if this update already exists
      const existingHistory = await rhyPrisma.rHYShipmentHistory.findFirst({
        where: {
          shipmentId,
          status: update.status,
          timestamp: update.timestamp
        }
      })

      if (!existingHistory) {
        await rhyPrisma.rHYShipmentHistory.create({
          data: {
            shipmentId,
            status: update.status,
            location: update.location,
            details: update.details,
            timestamp: update.timestamp,
            signedBy: update.signedBy,
            deliveryAttempts: update.deliveryAttempts
          }
        })
      }
    }

    // Update shipment status to latest
    const latestUpdate = updates[0]
    if (latestUpdate) {
      await rhyPrisma.rHYShipment.update({
        where: { id: shipmentId },
        data: {
          status: latestUpdate.status,
          updatedAt: new Date(),
          ...(latestUpdate.isDelivered && { deliveredAt: latestUpdate.timestamp })
        }
      })
    }
  }

  private async cancelCarrierShipment(
    trackingNumber: string,
    carrierName: string
  ): Promise<boolean> {
    try {
      // Mock carrier cancellation API
      await new Promise(resolve => setTimeout(resolve, 100))
      return true
    } catch (error) {
      console.error(`Failed to cancel ${carrierName} shipment:`, error)
      return false
    }
  }

  private async sendTrackingNotification(
    shipment: any,
    type: string,
    securityContext: SecurityContext
  ): Promise<void> {
    try {
      const messages = {
        'SHIPMENT_CREATED': {
          title: 'Shipment Created',
          message: `Your order has been shipped via ${shipment.carrier}. Tracking: ${shipment.trackingNumber}`
        },
        'SHIPMENT_CANCELLED': {
          title: 'Shipment Cancelled',
          message: `Shipment ${shipment.trackingNumber} has been cancelled`
        }
      }

      const notification = messages[type as keyof typeof messages]
      if (notification) {
        await notificationService.sendNotification({
          supplierId: shipment.supplierId,
          type: 'ORDER',
          title: notification.title,
          message: notification.message,
          priority: 'MEDIUM',
          channels: ['EMAIL', 'IN_APP'],
          warehouseId: shipment.warehouseId,
          actionUrl: `/supplier/orders/${shipment.orderId}`,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            carrier: shipment.carrier
          }
        }, securityContext)
      }
    } catch (error) {
      console.error('Failed to send tracking notification:', error)
    }
  }
}

// Export singleton instance
export const orderIntegrationService = new OrderIntegrationService()