/**
 * RHY Supplier Portal - Order Integration Utilities
 * Comprehensive utility functions for order integration operations
 * Includes validation, formatting, calculations, and helper functions
 */

import { z } from 'zod'
import {
  OrderIntegrationRequest,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShippingMethod,
  PaymentMethod,
  VolumeDiscountTier,
  PricingDetails,
  TrackingInfo,
  OrderIntegrationError,
  ValidationError,
  BusinessRuleError
} from '@/types/order_integration'

// Validation schemas
export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
  specifications: z.object({
    voltage: z.string().optional(),
    capacity: z.string().optional(),
    chemistry: z.string().optional(),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['cm', 'in'])
    }).optional()
  }).optional(),
  isHazardous: z.boolean().optional()
})

export const OrderIntegrationRequestSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID format'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  shippingMethod: z.nativeEnum(ShippingMethod),
  paymentMethod: z.nativeEnum(PaymentMethod),
  urgency: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).optional(),
  customerNotes: z.string().max(1000, 'Customer notes too long').optional(),
  metadata: z.record(z.any()).optional()
})

// FlexVolt product configuration
export const FLEXVOLT_PRODUCTS = {
  'FLEXVOLT_6AH': {
    sku: 'FV-6AH-20V60V',
    name: 'FlexVolt 6Ah Battery',
    basePrice: 149.00,
    specifications: {
      voltage: '20V/60V MAX',
      capacity: '6.0Ah',
      chemistry: 'Li-Ion',
      weight: 1.42,
      dimensions: { length: 5.5, width: 3.5, height: 2.8, unit: 'in' as const }
    },
    isHazardous: false,
    targetMarket: ['Professional contractors', 'Small-medium projects']
  },
  'FLEXVOLT_9AH': {
    sku: 'FV-9AH-20V60V',
    name: 'FlexVolt 9Ah Battery',
    basePrice: 239.00,
    specifications: {
      voltage: '20V/60V MAX',
      capacity: '9.0Ah',
      chemistry: 'Li-Ion',
      weight: 2.1,
      dimensions: { length: 6.2, width: 3.5, height: 3.1, unit: 'in' as const }
    },
    isHazardous: false,
    targetMarket: ['Heavy-duty contractors', 'All-day projects']
  },
  'FLEXVOLT_15AH': {
    sku: 'FV-15AH-20V60V',
    name: 'FlexVolt 15Ah Battery',
    basePrice: 359.00,
    specifications: {
      voltage: '20V/60V MAX',
      capacity: '15.0Ah',
      chemistry: 'Li-Ion',
      weight: 3.2,
      dimensions: { length: 7.1, width: 4.2, height: 3.5, unit: 'in' as const }
    },
    isHazardous: false,
    targetMarket: ['Fleet managers', 'Industrial operations', 'Service providers']
  }
} as const

// Volume discount configuration
export const VOLUME_DISCOUNT_TIERS: VolumeDiscountTier[] = [
  {
    threshold: 1000,
    discountPercentage: 10,
    tierName: 'Contractor',
    eligibleCustomerTypes: ['DIRECT', 'CONTRACTOR'],
    additionalBenefits: {
      expeditedProcessing: false,
      waiveFees: [],
      prioritySupport: false
    }
  },
  {
    threshold: 2500,
    discountPercentage: 15,
    tierName: 'Professional',
    eligibleCustomerTypes: ['DIRECT', 'CONTRACTOR', 'DISTRIBUTOR'],
    additionalBenefits: {
      expeditedProcessing: true,
      waiveFees: ['processing'],
      prioritySupport: false
    }
  },
  {
    threshold: 5000,
    discountPercentage: 20,
    tierName: 'Commercial',
    eligibleCustomerTypes: ['DISTRIBUTOR', 'FLEET', 'SERVICE'],
    additionalBenefits: {
      expeditedProcessing: true,
      waiveFees: ['processing', 'expedite'],
      prioritySupport: true
    }
  },
  {
    threshold: 7500,
    discountPercentage: 25,
    tierName: 'Enterprise',
    eligibleCustomerTypes: ['FLEET', 'SERVICE', 'DISTRIBUTOR'],
    additionalBenefits: {
      expeditedProcessing: true,
      waiveFees: ['processing', 'expedite', 'warehouse'],
      prioritySupport: true
    }
  }
]

// Warehouse configuration
export const WAREHOUSE_CONFIG = {
  'US': {
    name: 'US West Coast',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    cutoffTime: '15:00',
    processingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    capabilities: ['sameDay', 'overnight', 'hazmat', 'bulk'],
    carriers: ['FEDEX', 'UPS', 'USPS']
  },
  'JP': {
    name: 'Japan Distribution Center',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    cutoffTime: '14:00',
    processingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    capabilities: ['express', 'standard', 'bulk'],
    carriers: ['YAMATO', 'JAPAN_POST', 'DHL']
  },
  'EU': {
    name: 'EU Distribution Center',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    cutoffTime: '14:30',
    processingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    capabilities: ['express', 'overnight', 'hazmat', 'customs'],
    carriers: ['DHL', 'UPS', 'TNT']
  },
  'AU': {
    name: 'Australia Distribution Center',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    cutoffTime: '13:00',
    processingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    capabilities: ['express', 'standard', 'remote'],
    carriers: ['AUSTRALIA_POST', 'TNT', 'DHL']
  }
} as const

/**
 * Utility class for order integration operations
 */
export class OrderIntegrationUtils {

  /**
   * Validate order integration request
   */
  static validateOrderRequest(request: any): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = []

    try {
      OrderIntegrationRequestSchema.parse(request)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: err.message,
            field: err.path.join('.'),
            value: err.code,
            details: { zodError: err }
          })
        })
      }
    }

    // Additional business rule validations
    if (request.items) {
      // Check for duplicate SKUs
      const skus = request.items.map((item: OrderItem) => item.sku)
      const duplicates = skus.filter((sku: string, index: number) => skus.indexOf(sku) !== index)
      
      if (duplicates.length > 0) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `Duplicate SKUs found: ${duplicates.join(', ')}`,
          field: 'items',
          details: { duplicateSKUs: duplicates }
        })
      }

      // Validate minimum order quantities
      request.items.forEach((item: OrderItem, index: number) => {
        if (item.quantity < 1) {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: 'Minimum quantity is 1',
            field: `items[${index}].quantity`,
            value: item.quantity
          })
        }

        // FlexVolt specific validations
        if (item.sku.startsWith('FV-') && item.quantity > 1000) {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: 'Maximum quantity per FlexVolt product is 1000',
            field: `items[${index}].quantity`,
            value: item.quantity,
            suggestion: 'Contact sales for bulk orders over 1000 units'
          })
        }
      })
    }

    // Validate warehouse and shipping method compatibility
    if (request.warehouseId && request.shippingMethod) {
      const warehouse = WAREHOUSE_CONFIG[request.warehouseId as keyof typeof WAREHOUSE_CONFIG]
      if (warehouse) {
        const capabilityMap: Record<string, string> = {
          'SAME_DAY': 'sameDay',
          'OVERNIGHT': 'overnight',
          'EXPRESS': 'express',
          'STANDARD': 'standard'
        }
        
        const requiredCapability = capabilityMap[request.shippingMethod]
        if (requiredCapability && !warehouse.capabilities.includes(requiredCapability)) {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: `Shipping method ${request.shippingMethod} not available for warehouse ${request.warehouseId}`,
            field: 'shippingMethod',
            suggestion: `Available methods: ${warehouse.capabilities.join(', ')}`
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate pricing with volume discounts
   */
  static calculatePricing(
    items: OrderItem[],
    supplierType: string = 'DIRECT',
    warehouseId: string = 'US'
  ): PricingDetails {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    // Find applicable volume discount tier
    const applicableTiers = VOLUME_DISCOUNT_TIERS.filter(tier => 
      subtotal >= tier.threshold && 
      tier.eligibleCustomerTypes.includes(supplierType)
    )

    const bestTier = applicableTiers[applicableTiers.length - 1]
    const discountPercentage = bestTier?.discountPercentage || 0
    const discountTier = bestTier?.tierName || 'Standard'

    // Calculate supplier-specific adjustments
    let supplierAdjustment = 0
    switch (supplierType) {
      case 'DISTRIBUTOR':
        supplierAdjustment = 0.02 // Additional 2% discount
        break
      case 'FLEET':
        supplierAdjustment = 0.015 // Additional 1.5% discount
        break
      case 'SERVICE':
        supplierAdjustment = 0.01 // Additional 1% discount
        break
    }

    const finalDiscountPercentage = Math.min(discountPercentage + (supplierAdjustment * 100), 30)
    const discountAmount = subtotal * (finalDiscountPercentage / 100)
    const total = subtotal - discountAmount

    // Get warehouse currency
    const warehouse = WAREHOUSE_CONFIG[warehouseId as keyof typeof WAREHOUSE_CONFIG]
    const currency = warehouse?.currency || 'USD'

    return {
      subtotal,
      discountPercentage: finalDiscountPercentage,
      discountAmount,
      discountTier,
      total,
      currency,
      itemCount,
      volumeDiscountApplied: discountPercentage > 0,
      supplierTierBenefits: bestTier ? {
        additionalDiscount: supplierAdjustment * 100,
        priorityProcessing: bestTier.additionalBenefits?.expeditedProcessing || false,
        dedicatedSupport: bestTier.additionalBenefits?.prioritySupport || false
      } : undefined
    }
  }

  /**
   * Generate order tracking information
   */
  static generateTrackingInfo(
    carrier: string,
    service: string,
    warehouseId: string,
    estimatedDelivery: Date
  ): TrackingInfo {
    const trackingNumber = this.generateTrackingNumber(carrier, warehouseId)
    const trackingUrl = this.getTrackingUrl(carrier, trackingNumber)

    return {
      carrier,
      service,
      trackingNumber,
      trackingUrl,
      estimatedDelivery,
      currentStatus: 'Order Confirmed',
      lastUpdate: new Date(),
      statusHistory: [
        {
          timestamp: new Date(),
          location: this.getWarehouseLocation(warehouseId),
          status: 'Order Confirmed',
          description: 'Order has been confirmed and is being prepared for shipment'
        }
      ]
    }
  }

  /**
   * Generate unique tracking number
   */
  static generateTrackingNumber(carrier: string, warehouseId: string): string {
    const prefix = carrier.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const checksum = this.calculateChecksum(`${prefix}${warehouseId}${timestamp}${random}`)
    
    return `${prefix}${warehouseId}${timestamp}${random}${checksum}`
  }

  /**
   * Get tracking URL for carrier
   */
  static getTrackingUrl(carrier: string, trackingNumber: string): string {
    const trackingUrls: Record<string, string> = {
      'FEDEX': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      'YAMATO': `http://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${trackingNumber}`,
      'JAPAN_POST': `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${trackingNumber}`,
      'AUSTRALIA_POST': `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`,
      'TNT': `https://www.tnt.com/express/en_au/site/tracking.html?searchType=CON&cons=${trackingNumber}`
    }

    return trackingUrls[carrier.toUpperCase()] || `https://track.rhy-supplier.com/${trackingNumber}`
  }

  /**
   * Get warehouse location for tracking
   */
  static getWarehouseLocation(warehouseId: string): string {
    const locations: Record<string, string> = {
      'US': 'Los Angeles, CA, US',
      'JP': 'Tokyo, Japan',
      'EU': 'Amsterdam, Netherlands', 
      'AU': 'Sydney, NSW, Australia'
    }

    return locations[warehouseId] || 'Unknown Location'
  }

  /**
   * Calculate estimated delivery date
   */
  static calculateEstimatedDelivery(
    warehouseId: string,
    shippingMethod: ShippingMethod,
    urgency: string = 'STANDARD'
  ): Date {
    const now = new Date()
    const warehouse = WAREHOUSE_CONFIG[warehouseId as keyof typeof WAREHOUSE_CONFIG]
    
    // Add processing time
    let processingDays = urgency === 'OVERNIGHT' ? 0 : 1
    
    // Add transit time based on shipping method
    let transitDays = 5 // Standard shipping
    switch (shippingMethod) {
      case ShippingMethod.SAME_DAY:
        transitDays = 0
        break
      case ShippingMethod.OVERNIGHT:
        transitDays = 1
        break
      case ShippingMethod.EXPRESS:
        transitDays = 2
        break
      case ShippingMethod.STANDARD:
        transitDays = 5
        break
    }

    // Adjust for warehouse-specific factors
    if (warehouseId === 'AU') {
      transitDays += 1 // Remote locations take longer
    }
    if (warehouseId === 'JP') {
      transitDays += 0.5 // Customs processing
    }

    const deliveryDate = new Date(now)
    deliveryDate.setDate(deliveryDate.getDate() + processingDays + transitDays)

    // Skip weekends for standard shipping
    if (shippingMethod === ShippingMethod.STANDARD) {
      while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
        deliveryDate.setDate(deliveryDate.getDate() + 1)
      }
    }

    return deliveryDate
  }

  /**
   * Validate inventory availability
   */
  static validateInventoryAvailability(
    items: OrderItem[],
    warehouseInventory: Record<string, { available: number; reserved: number }>
  ): { valid: boolean; errors: BusinessRuleError[] } {
    const errors: BusinessRuleError[] = []

    items.forEach(item => {
      const inventory = warehouseInventory[item.sku]
      
      if (!inventory) {
        errors.push({
          code: 'BUSINESS_RULE_VIOLATION',
          message: `Product ${item.sku} not found in warehouse inventory`,
          rule: 'INVENTORY_AVAILABILITY',
          details: { sku: item.sku, requested: item.quantity }
        })
        return
      }

      if (inventory.available < item.quantity) {
        errors.push({
          code: 'BUSINESS_RULE_VIOLATION',
          message: `Insufficient inventory for ${item.sku}. Requested: ${item.quantity}, Available: ${inventory.available}`,
          rule: 'INVENTORY_AVAILABILITY',
          threshold: inventory.available,
          current: item.quantity,
          details: { 
            sku: item.sku, 
            requested: item.quantity, 
            available: inventory.available,
            reserved: inventory.reserved 
          }
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Format currency value
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Format order status for display
   */
  static formatOrderStatus(status: OrderStatus): string {
    const statusLabels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending Review',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.FULFILLING]: 'Being Fulfilled',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.IN_TRANSIT]: 'In Transit',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.REFUNDED]: 'Refunded',
      [OrderStatus.RETURNED]: 'Returned'
    }

    return statusLabels[status] || status
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: OrderStatus): string {
    const statusColors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#F59E0B', // Warning yellow
      [OrderStatus.PROCESSING]: '#3B82F6', // Info blue
      [OrderStatus.CONFIRMED]: '#10B981', // Success green
      [OrderStatus.FULFILLING]: '#3B82F6', // Info blue
      [OrderStatus.SHIPPED]: '#6366F1', // Indigo
      [OrderStatus.IN_TRANSIT]: '#6366F1', // Indigo
      [OrderStatus.DELIVERED]: '#10B981', // Success green
      [OrderStatus.CANCELLED]: '#EF4444', // Error red
      [OrderStatus.REFUNDED]: '#EF4444', // Error red
      [OrderStatus.RETURNED]: '#F59E0B' // Warning yellow
    }

    return statusColors[status] || '#6B7280' // Default gray
  }

  /**
   * Calculate simple checksum for tracking numbers
   */
  private static calculateChecksum(input: string): string {
    let sum = 0
    for (let i = 0; i < input.length; i++) {
      sum += input.charCodeAt(i)
    }
    return (sum % 10).toString()
  }

  /**
   * Check if order is eligible for expedited processing
   */
  static isEligibleForExpeditedProcessing(
    orderValue: number,
    supplierType: string,
    items: OrderItem[]
  ): boolean {
    // High-value orders
    if (orderValue >= 5000) return true
    
    // Distributor and fleet customers
    if (['DISTRIBUTOR', 'FLEET', 'SERVICE'].includes(supplierType)) return true
    
    // Orders with critical FlexVolt products
    const hasHighCapacityBatteries = items.some(item => 
      item.sku.includes('15AH') || item.quantity > 50
    )
    
    return hasHighCapacityBatteries
  }

  /**
   * Get recommended shipping method based on order characteristics
   */
  static getRecommendedShippingMethod(
    items: OrderItem[],
    warehouseId: string,
    urgency: string = 'STANDARD'
  ): ShippingMethod {
    const hasHazmat = items.some(item => item.isHazardous)
    const totalWeight = items.reduce((sum, item) => {
      const weight = item.specifications?.weight || 2.0 // Default weight estimate
      return sum + (weight * item.quantity)
    }, 0)

    // Heavy orders require ground shipping
    if (totalWeight > 50) {
      return ShippingMethod.STANDARD
    }

    // Hazmat restrictions
    if (hasHazmat && urgency === 'OVERNIGHT') {
      return ShippingMethod.EXPRESS // Hazmat can't go overnight
    }

    // Urgency-based recommendations
    switch (urgency) {
      case 'OVERNIGHT':
        return ShippingMethod.OVERNIGHT
      case 'EXPRESS':
        return ShippingMethod.EXPRESS
      default:
        return ShippingMethod.STANDARD
    }
  }
}

export default OrderIntegrationUtils