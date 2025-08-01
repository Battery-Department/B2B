/**
 * RHY Supplier Portal - Enhanced Order Integration Service
 * Enterprise-grade order integration system for FlexVolt battery operations
 * Integrates with existing Batch 1 authentication, warehouse, and payment systems
 */

import { 
  SupplierAuthData, 
  SecurityContext,
  AuthError 
} from '@/types/auth'
import { AuthService } from '@/services/auth/AuthService'
import { rhyPrisma } from '@/lib/rhy-database'
import { logAuthEvent } from '@/lib/security'
import { PaymentService } from './PaymentService'
import { ShippingService } from './ShippingService'
import { OrderIntegrationUtils, WAREHOUSE_CONFIG } from '@/lib/order_integration-utils'
import { externalIntegrationsManager } from '@/lib/external-integrations'
import { 
  OrderStatus, 
  ShippingMethod,
  PaymentMethod,
  PaymentStatus 
} from '@/types/order_integration'
import { z } from 'zod'

// Type definitions for order integration
export interface OrderIntegrationRequest {
  supplierId: string
  warehouseId: string
  items: OrderItem[]
  shippingMethod: string
  paymentMethod: string
  metadata?: Record<string, any>
}

export interface OrderItem {
  productId: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  warehouseLocation: string
}

export interface OrderIntegrationResponse {
  success: boolean
  orderId?: string
  integrationId?: string
  status: OrderStatus
  estimatedDelivery?: Date
  tracking?: TrackingInfo
  error?: string
  metadata?: Record<string, any>
}

export interface TrackingInfo {
  carrier: string
  trackingNumber: string
  estimatedDelivery: Date
  currentStatus: string
  statusHistory: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: Date
  location: string
  status: string
  description: string
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Validation schemas
const OrderIntegrationSchema = z.object({
  supplierId: z.string().uuid(),
  warehouseId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    warehouseLocation: z.string().min(1)
  })),
  shippingMethod: z.string().min(1),
  paymentMethod: z.string().min(1),
  metadata: z.record(z.any()).optional()
})

/**
 * Enhanced Order Integration Service
 * Provides comprehensive order processing with real-time updates and multi-warehouse coordination
 */
export class EnhancedOrderIntegrationService {
  private readonly authService: AuthService
  private readonly paymentService: PaymentService
  private readonly shippingService: ShippingService
  
  constructor() {
    this.authService = new AuthService()
    this.paymentService = new PaymentService()
    this.shippingService = new ShippingService()
  }

  /**
   * Process order integration with comprehensive validation and coordination
   */
  async processOrderIntegration(
    request: OrderIntegrationRequest,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<OrderIntegrationResponse> {
    const startTime = Date.now()
    
    try {
      // Validate request
      const validatedRequest = OrderIntegrationSchema.parse(request)
      
      // Verify supplier permissions for warehouse
      await this.validateWarehouseAccess(supplier, validatedRequest.warehouseId)
      
      // Check inventory availability across warehouses
      const inventoryCheck = await this.validateInventoryAvailability(validatedRequest.items, validatedRequest.warehouseId)
      if (!inventoryCheck.available) {
        return {
          success: false,
          status: OrderStatus.CANCELLED,
          error: `Insufficient inventory: ${inventoryCheck.missingItems.join(', ')}`,
          metadata: { inventoryCheck }
        }
      }

      // Calculate pricing with FlexVolt volume discounts
      const pricingResult = await this.calculateOrderPricing(validatedRequest.items, supplier)
      
      // Create integration record
      const integration = await rhyPrisma.orderIntegration.create({
        data: {
          supplierId: supplier.id,
          warehouseId: validatedRequest.warehouseId,
          status: OrderStatus.PENDING,
          items: JSON.stringify(validatedRequest.items),
          originalTotal: pricingResult.subtotal,
          discountedTotal: pricingResult.total,
          discountTier: pricingResult.tier,
          shippingMethod: validatedRequest.shippingMethod,
          paymentMethod: validatedRequest.paymentMethod,
          metadata: JSON.stringify(validatedRequest.metadata || {}),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Process payment authorization
      const paymentResult = await this.paymentService.authorizePayment({
        amount: pricingResult.total,
        currency: this.getWarehouseCurrency(validatedRequest.warehouseId),
        paymentMethod: validatedRequest.paymentMethod,
        orderId: integration.id,
        supplierId: supplier.id
      })

      if (!paymentResult.success) {
        await this.updateIntegrationStatus(integration.id, OrderStatus.CANCELLED, 'Payment authorization failed')
        return {
          success: false,
          status: OrderStatus.CANCELLED,
          error: `Payment failed: ${paymentResult.error}`,
          metadata: { paymentResult }
        }
      }

      // Reserve inventory
      await this.reserveInventory(validatedRequest.items, validatedRequest.warehouseId, integration.id)
      
      // Calculate shipping and delivery estimates
      const shippingResult = await this.shippingService.calculateShipping({
        items: validatedRequest.items,
        warehouseId: validatedRequest.warehouseId,
        method: validatedRequest.shippingMethod,
        destination: supplier.address
      })

      // Update integration with shipping info
      await rhyPrisma.orderIntegration.update({
        where: { id: integration.id },
        data: {
          status: OrderStatus.CONFIRMED,
          shippingCost: shippingResult.cost,
          estimatedDelivery: shippingResult.estimatedDelivery,
          carrierInfo: JSON.stringify(shippingResult.carrier),
          updatedAt: new Date()
        }
      })

      // Log successful integration
      await logAuthEvent('ORDER_INTEGRATION_SUCCESS', true, securityContext, supplier.id, {
        integrationId: integration.id,
        warehouseId: validatedRequest.warehouseId,
        orderValue: pricingResult.total,
        processingTime: Date.now() - startTime
      })

      // Trigger real-time notifications
      await this.notifyWarehouse(validatedRequest.warehouseId, integration.id)
      await this.notifySupplier(supplier.id, integration.id)

      return {
        success: true,
        orderId: integration.id,
        integrationId: integration.id,
        status: OrderStatus.CONFIRMED,
        estimatedDelivery: shippingResult.estimatedDelivery,
        tracking: {
          carrier: shippingResult.carrier.name,
          trackingNumber: shippingResult.trackingNumber,
          estimatedDelivery: shippingResult.estimatedDelivery,
          currentStatus: 'Order Confirmed',
          statusHistory: []
        },
        metadata: {
          pricing: pricingResult,
          shipping: shippingResult,
          processingTime: Date.now() - startTime
        }
      }

    } catch (error) {
      // Log error for monitoring
      await logAuthEvent('ORDER_INTEGRATION_ERROR', false, securityContext, supplier?.id, {
        error: error.message,
        request: validatedRequest,
        processingTime: Date.now() - startTime
      })

      return {
        success: false,
        status: OrderStatus.CANCELLED,
        error: `Order integration failed: ${error.message}`,
        metadata: { 
          errorDetails: error,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Validate supplier access to specified warehouse
   */
  private async validateWarehouseAccess(supplier: SupplierAuthData, warehouseId: string): Promise<void> {
    const hasAccess = supplier.permissions.warehouses.includes(warehouseId) ||
                     supplier.permissions.warehouses.includes('ALL')
    
    if (!hasAccess) {
      throw new AuthError(`Supplier ${supplier.id} does not have access to warehouse ${warehouseId}`)
    }
  }

  /**
   * Validate inventory availability across warehouses
   */
  private async validateInventoryAvailability(
    items: OrderItem[], 
    warehouseId: string
  ): Promise<{ available: boolean; missingItems: string[] }> {
    const missingItems: string[] = []
    
    for (const item of items) {
      const inventory = await rhyPrisma.warehouseInventory.findFirst({
        where: {
          warehouseId,
          sku: item.sku
        }
      })
      
      if (!inventory || inventory.availableQuantity < item.quantity) {
        missingItems.push(`${item.sku} (requested: ${item.quantity}, available: ${inventory?.availableQuantity || 0})`)
      }
    }
    
    return {
      available: missingItems.length === 0,
      missingItems
    }
  }

  /**
   * Calculate order pricing with FlexVolt volume discounts
   */
  private async calculatePricing(items: OrderItem[], supplier: SupplierAuthData, warehouseId: string) {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    
    // FlexVolt volume discount tiers
    let discountPercentage = 0
    let tier = 'Standard'
    
    if (subtotal >= 7500) {
      discountPercentage = 25
      tier = 'Enterprise'
    } else if (subtotal >= 5000) {
      discountPercentage = 20
      tier = 'Commercial'
    } else if (subtotal >= 2500) {
      discountPercentage = 15
      tier = 'Professional'
    } else if (subtotal >= 1000) {
      discountPercentage = 10
      tier = 'Contractor'
    }
    
    // Supplier-specific adjustments
    let supplierAdjustment = 0
    if (supplier.permissions.supplierType === 'DISTRIBUTOR') {
      supplierAdjustment = 2
    } else if (supplier.permissions.supplierType === 'FLEET') {
      supplierAdjustment = 1.5
    } else if (supplier.permissions.supplierType === 'SERVICE') {
      supplierAdjustment = 1
    }
    
    const finalDiscountPercentage = Math.min(discountPercentage + supplierAdjustment, 30)
    const discountAmount = subtotal * (finalDiscountPercentage / 100)
    const total = subtotal - discountAmount
    
    // Get warehouse currency
    const warehouseConfig = WAREHOUSE_CONFIG[warehouseId as keyof typeof WAREHOUSE_CONFIG]
    const currency = warehouseConfig?.currency || 'USD'
    
    return {
      subtotal,
      discountPercentage: finalDiscountPercentage,
      discountAmount,
      discountTier: tier,
      total,
      currency,
      itemCount,
      volumeDiscountApplied: discountPercentage > 0,
      supplierTierBenefits: {
        additionalDiscount: supplierAdjustment,
        priorityProcessing: subtotal >= 2500,
        dedicatedSupport: subtotal >= 5000
      }
    }
  }

  /**
   * Process shipping and tracking information
   */
  private async processShippingAndTracking(
    items: OrderItem[], 
    warehouseId: string, 
    shippingMethod: ShippingMethod,
    urgency: string = 'STANDARD'
  ) {
    // Get recommended carrier for warehouse and urgency
    const warehouseConfig = WAREHOUSE_CONFIG[warehouseId as keyof typeof WAREHOUSE_CONFIG]
    const preferredCarrier = warehouseConfig?.carriers[0] || 'FEDEX'
    
    // Calculate estimated delivery
    const estimatedDelivery = OrderIntegrationUtils.calculateEstimatedDelivery(
      warehouseId, 
      shippingMethod, 
      urgency
    )
    
    // Generate tracking information
    const trackingInfo = OrderIntegrationUtils.generateTrackingInfo(
      preferredCarrier,
      shippingMethod,
      warehouseId,
      estimatedDelivery
    )
    
    // Calculate shipping cost (simplified)
    let shippingCost = 0
    const totalWeight = items.reduce((sum, item) => {
      const weight = item.specifications?.weight || 2.0
      return sum + (weight * item.quantity)
    }, 0)
    
    switch (shippingMethod) {
      case ShippingMethod.SAME_DAY:
        shippingCost = Math.max(50, totalWeight * 8)
        break
      case ShippingMethod.OVERNIGHT:
        shippingCost = Math.max(25, totalWeight * 4)
        break
      case ShippingMethod.EXPRESS:
        shippingCost = Math.max(15, totalWeight * 2)
        break
      case ShippingMethod.STANDARD:
        shippingCost = Math.max(10, totalWeight * 1)
        break
      default:
        shippingCost = Math.max(10, totalWeight * 1)
    }
    
    return {
      carrier: {
        name: preferredCarrier,
        service: shippingMethod
      },
      estimatedDelivery,
      trackingNumber: trackingInfo.trackingNumber,
      trackingUrl: trackingInfo.trackingUrl,
      shippingCost,
      transitTime: Math.ceil((estimatedDelivery.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }
  }

  /**
   * Calculate order pricing with FlexVolt volume discounts (legacy method name for compatibility)
   */
  private async calculateOrderPricing(items: OrderItem[], supplier: SupplierAuthData) {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    
    // FlexVolt volume discount tiers
    let discountPercentage = 0
    let tier = 'Standard'
    
    if (subtotal >= 7500) {
      discountPercentage = 25
      tier = 'Enterprise'
    } else if (subtotal >= 5000) {
      discountPercentage = 20
      tier = 'Commercial'
    } else if (subtotal >= 2500) {
      discountPercentage = 15
      tier = 'Professional'
    } else if (subtotal >= 1000) {
      discountPercentage = 10
      tier = 'Contractor'
    }

    // Apply supplier-specific multipliers
    if (supplier.accountType === 'DISTRIBUTOR') {
      discountPercentage += 5 // Additional 5% for distributors
    }

    const discountAmount = subtotal * (discountPercentage / 100)
    const total = subtotal - discountAmount

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      total,
      tier,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  /**
   * Reserve inventory for confirmed order
   */
  private async reserveInventory(items: OrderItem[], warehouseId: string, orderId: string): Promise<void> {
    for (const item of items) {
      await rhyPrisma.inventoryReservation.create({
        data: {
          warehouseId,
          sku: item.sku,
          quantity: item.quantity,
          orderId,
          status: 'RESERVED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiration
          createdAt: new Date()
        }
      })

      // Update available inventory
      await rhyPrisma.warehouseInventory.update({
        where: {
          warehouseId_sku: {
            warehouseId,
            sku: item.sku
          }
        },
        data: {
          availableQuantity: {
            decrement: item.quantity
          },
          reservedQuantity: {
            increment: item.quantity
          }
        }
      })
    }
  }

  /**
   * Get warehouse currency based on region
   */
  private getWarehouseCurrency(warehouseId: string): string {
    const currencyMap: Record<string, string> = {
      'US': 'USD',
      'JP': 'JPY', 
      'EU': 'EUR',
      'AU': 'AUD'
    }
    return currencyMap[warehouseId] || 'USD'
  }

  /**
   * Update integration status with audit trail
   */
  private async updateIntegrationStatus(integrationId: string, status: OrderStatus, note?: string): Promise<void> {
    await rhyPrisma.orderIntegration.update({
      where: { id: integrationId },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    await rhyPrisma.orderStatusHistory.create({
      data: {
        orderId: integrationId,
        status,
        note: note || '',
        timestamp: new Date()
      }
    })
  }

  /**
   * Notify warehouse of new order
   */
  private async notifyWarehouse(warehouseId: string, orderId: string): Promise<void> {
    // Implementation would integrate with warehouse notification system
    console.log(`Notifying warehouse ${warehouseId} of new order ${orderId}`)
  }

  /**
   * Notify supplier of order status
   */
  private async notifySupplier(supplierId: string, orderId: string): Promise<void> {
    // Implementation would integrate with supplier notification system
    console.log(`Notifying supplier ${supplierId} of order ${orderId}`)
  }

  /**
   * Get order integration status
   */
  async getOrderStatus(integrationId: string, supplier: SupplierAuthData): Promise<OrderIntegrationResponse> {
    try {
      const integration = await rhyPrisma.orderIntegration.findUnique({
        where: { id: integrationId },
        include: {
          statusHistory: {
            orderBy: { timestamp: 'desc' }
          }
        }
      })

      if (!integration) {
        return {
          success: false,
          status: OrderStatus.CANCELLED,
          error: 'Order integration not found'
        }
      }

      // Verify supplier access
      if (integration.supplierId !== supplier.id && !supplier.permissions.admin) {
        return {
          success: false,
          status: OrderStatus.CANCELLED,
          error: 'Access denied'
        }
      }

      return {
        success: true,
        orderId: integration.id,
        integrationId: integration.id,
        status: integration.status as OrderStatus,
        estimatedDelivery: integration.estimatedDelivery,
        metadata: {
          items: JSON.parse(integration.items),
          pricing: {
            subtotal: integration.originalTotal,
            total: integration.discountedTotal,
            tier: integration.discountTier
          },
          warehouse: integration.warehouseId,
          statusHistory: integration.statusHistory
        }
      }

    } catch (error) {
      return {
        success: false,
        status: OrderStatus.CANCELLED,
        error: `Failed to retrieve order status: ${error.message}`
      }
    }
  }

  /**
   * Performance monitoring wrapper
   */
  private async trackPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      console.log(`EnhancedOrderIntegrationService.${operation} completed in ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`EnhancedOrderIntegrationService.${operation} failed after ${duration}ms:`, error)
      throw error
    }
  }
}

export const enhancedOrderIntegrationService = new EnhancedOrderIntegrationService()