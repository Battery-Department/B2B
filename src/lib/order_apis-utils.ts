/**
 * RHY Supplier Portal - Order API Utilities
 * Enterprise-grade utility functions for order processing and management
 * Supports multi-warehouse operations and FlexVolt business logic
 */

import { 
  Order, 
  OrderStatus, 
  PaymentStatus, 
  WarehouseRegion, 
  ShippingMethod,
  OrderPriority,
  FlexVoltProduct,
  VolumeDiscount,
  OrderAnalytics,
  OrderEvent,
  WarehouseTransfer
} from '@/types/order_apis'
import { SupplierAuthData } from '@/types/auth'

/**
 * Order Number Generation
 */
export class OrderNumberGenerator {
  private static sequence = 1

  static generate(warehouseRegion?: WarehouseRegion): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    // Warehouse prefix
    const warehousePrefix = warehouseRegion ? {
      'US_WEST': 'USW',
      'JAPAN': 'JPN',
      'EU': 'EUR',
      'AUSTRALIA': 'AUS'
    }[warehouseRegion] : 'RHY'
    
    const sequence = this.sequence.toString().padStart(4, '0')
    this.sequence = (this.sequence % 9999) + 1
    
    return `${warehousePrefix}${year}${month}${day}${sequence}`
  }

  static parseOrderNumber(orderNumber: string): {
    warehouse?: WarehouseRegion
    date: Date
    sequence: number
    isValid: boolean
  } {
    const match = orderNumber.match(/^(USW|JPN|EUR|AUS|RHY)(\d{2})(\d{2})(\d{2})(\d{4})$/)
    
    if (!match) {
      return { date: new Date(), sequence: 0, isValid: false }
    }

    const [, warehouseCode, year, month, day, sequence] = match
    
    const warehouse = {
      'USW': 'US_WEST' as WarehouseRegion,
      'JPN': 'JAPAN' as WarehouseRegion,
      'EUR': 'EU' as WarehouseRegion,
      'AUS': 'AUSTRALIA' as WarehouseRegion
    }[warehouseCode]
    
    const fullYear = 2000 + parseInt(year)
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day))
    
    return {
      warehouse,
      date,
      sequence: parseInt(sequence),
      isValid: true
    }
  }
}

/**
 * FlexVolt Product Utilities
 */
export class FlexVoltProductUtils {
  // Standard FlexVolt pricing (exact values)
  static readonly PRODUCT_PRICING = {
    '6Ah': { basePrice: 149.00, runtime: 2, targetMarket: 'Professional contractors' },
    '9Ah': { basePrice: 239.00, runtime: 3, targetMarket: 'Heavy-duty contractors' },
    '15Ah': { basePrice: 359.00, runtime: 5, targetMarket: 'Industrial operations' }
  }

  // Volume discount tiers (exact business rules)
  static readonly VOLUME_TIERS = [
    { threshold: 1000, discount: 10, tier: 'Contractor', eligible: ['DIRECT', 'CONTRACTOR'] },
    { threshold: 2500, discount: 15, tier: 'Professional', eligible: ['DIRECT', 'CONTRACTOR', 'DISTRIBUTOR'] },
    { threshold: 5000, discount: 20, tier: 'Commercial', eligible: ['DISTRIBUTOR', 'FLEET', 'SERVICE'] },
    { threshold: 7500, discount: 25, tier: 'Enterprise', eligible: ['FLEET', 'SERVICE', 'DISTRIBUTOR'] }
  ]

  static calculateVolumeDiscount(
    orderTotal: number, 
    supplierTier: string
  ): { discountPercentage: number; discountAmount: number; tierName: string } {
    const applicableTiers = this.VOLUME_TIERS.filter(tier => 
      orderTotal >= tier.threshold && tier.eligible.includes(supplierTier)
    )

    if (applicableTiers.length === 0) {
      return { discountPercentage: 0, discountAmount: 0, tierName: 'Standard' }
    }

    const bestTier = applicableTiers[applicableTiers.length - 1]
    return {
      discountPercentage: bestTier.discount,
      discountAmount: orderTotal * (bestTier.discount / 100),
      tierName: bestTier.tier
    }
  }

  static getProductByType(type: '6Ah' | '9Ah' | '15Ah'): FlexVoltProduct {
    const baseProduct = this.PRODUCT_PRICING[type]
    return {
      id: `flexvolt-${type.toLowerCase()}`,
      sku: `FV-${type.toUpperCase()}-20V60V`,
      name: `FlexVolt ${type} Battery`,
      type,
      basePrice: baseProduct.basePrice,
      currency: 'USD',
      specifications: {
        voltage: '20V/60V MAX',
        capacity: type,
        runtime: `${baseProduct.runtime} hours continuous`,
        weight: type === '6Ah' ? '1.4 lbs' : type === '9Ah' ? '1.8 lbs' : '2.6 lbs',
        compatibility: ['20V MAX tools', '60V MAX tools', 'FlexVolt advantage tools']
      },
      warehouse: 'US_WEST',
      stockLevel: type === '6Ah' ? 250 : type === '9Ah' ? 180 : 95,
      reservedQuantity: Math.floor(Math.random() * 20),
      availableQuantity: (type === '6Ah' ? 250 : type === '9Ah' ? 180 : 95) - Math.floor(Math.random() * 20)
    }
  }

  static validateCompatibility(
    products: FlexVoltProduct[],
    toolSystem: string
  ): { compatible: boolean; warnings: string[] } {
    const warnings: string[] = []
    
    // All FlexVolt batteries are compatible with 20V/60V MAX systems
    if (!['20V MAX', '60V MAX', 'FlexVolt'].includes(toolSystem)) {
      warnings.push(`Tool system ${toolSystem} may not be fully compatible with FlexVolt batteries`)
    }

    // Check for optimal battery selection
    const capacities = products.map(p => parseInt(p.type))
    const maxCapacity = Math.max(...capacities)
    
    if (maxCapacity >= 15 && toolSystem === '20V MAX') {
      warnings.push('15Ah batteries provide optimal performance in 60V MAX tools')
    }

    return {
      compatible: true, // FlexVolt is universally compatible
      warnings
    }
  }
}

/**
 * Order Status Management
 */
export class OrderStatusManager {
  // Define valid status transitions
  private static readonly STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': ['refunded'],
    'cancelled': [],
    'refunded': []
  }

  static canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return this.STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false
  }

  static getNextValidStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return this.STATUS_TRANSITIONS[currentStatus] || []
  }

  static getStatusPriority(status: OrderStatus): number {
    const priorities: Record<OrderStatus, number> = {
      'pending': 1,
      'confirmed': 2,
      'processing': 3,
      'shipped': 4,
      'delivered': 5,
      'cancelled': 0,
      'refunded': 0
    }
    return priorities[status]
  }

  static isActiveStatus(status: OrderStatus): boolean {
    return ['pending', 'confirmed', 'processing', 'shipped'].includes(status)
  }

  static isFinalStatus(status: OrderStatus): boolean {
    return ['delivered', 'cancelled', 'refunded'].includes(status)
  }
}

/**
 * Shipping Cost Calculator
 */
export class ShippingCalculator {
  private static readonly SHIPPING_RATES = {
    standard: { baseRate: 15, perPound: 2, days: 5 },
    expedited: { baseRate: 25, perPound: 3, days: 3 },
    overnight: { baseRate: 45, perPound: 5, days: 1 },
    international: { baseRate: 75, perPound: 8, days: 10 },
    freight: { baseRate: 150, perPound: 1, days: 7 }
  }

  private static readonly FREE_SHIPPING_THRESHOLD = 500

  static calculateShippingCost(
    method: ShippingMethod,
    weight: number,
    subtotal: number,
    destination: { country: string; isCommercial: boolean }
  ): { cost: number; estimatedDays: number; freeShippingApplied: boolean } {
    // Free shipping for orders over threshold (domestic only)
    if (subtotal >= this.FREE_SHIPPING_THRESHOLD && destination.country === 'US') {
      return { cost: 0, estimatedDays: this.SHIPPING_RATES.standard.days, freeShippingApplied: true }
    }

    const rates = this.SHIPPING_RATES[method]
    let cost = rates.baseRate + (weight * rates.perPound)

    // International surcharge
    if (destination.country !== 'US') {
      cost *= 1.5
    }

    // Commercial address discount
    if (destination.isCommercial) {
      cost *= 0.9
    }

    return {
      cost: Math.round(cost * 100) / 100,
      estimatedDays: rates.days,
      freeShippingApplied: false
    }
  }

  static getRecommendedShippingMethod(
    priority: OrderPriority,
    destination: { country: string }
  ): ShippingMethod {
    if (destination.country !== 'US') {
      return 'international'
    }

    switch (priority) {
      case 'urgent': return 'overnight'
      case 'high': return 'expedited'
      case 'normal': return 'standard'
      case 'low': return 'standard'
      default: return 'standard'
    }
  }
}

/**
 * Multi-Warehouse Coordination
 */
export class WarehouseCoordinator {
  private static readonly WAREHOUSE_CAPABILITIES = {
    US_WEST: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en-US',
      operatingHours: { start: 6, end: 18 }, // 6 AM - 6 PM PST
      specializations: ['high_volume', 'same_day_processing'],
      capacity: 10000
    },
    JAPAN: {
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      language: 'ja-JP',
      operatingHours: { start: 9, end: 18 }, // 9 AM - 6 PM JST
      specializations: ['precision_logistics', 'industrial_fleet'],
      capacity: 5000
    },
    EU: {
      timezone: 'Europe/Amsterdam',
      currency: 'EUR',
      language: 'en-GB',
      operatingHours: { start: 8, end: 17 }, // 8 AM - 5 PM CET
      specializations: ['cross_border', 'distributor_fulfillment'],
      capacity: 7500
    },
    AUSTRALIA: {
      timezone: 'Australia/Sydney',
      currency: 'AUD',
      language: 'en-AU',
      operatingHours: { start: 8, end: 17 }, // 8 AM - 5 PM AEDT
      specializations: ['service_provider', 'remote_delivery'],
      capacity: 3000
    }
  }

  static getOptimalWarehouse(
    supplierLocation: string,
    priority: OrderPriority,
    productTypes: string[]
  ): WarehouseRegion {
    // Simple optimization based on location and priority
    if (priority === 'urgent' && supplierLocation.includes('US')) {
      return 'US_WEST'
    }

    if (supplierLocation.includes('JP') || supplierLocation.includes('Japan')) {
      return 'JAPAN'
    }

    if (supplierLocation.includes('EU') || supplierLocation.includes('Europe')) {
      return 'EU'
    }

    if (supplierLocation.includes('AU') || supplierLocation.includes('Australia')) {
      return 'AUSTRALIA'
    }

    return 'US_WEST' // Default to US West
  }

  static calculateConsolidationTime(warehouses: WarehouseRegion[]): number {
    if (warehouses.length <= 1) return 0

    // Base consolidation time + distance factor
    const baseTime = 24 // 24 hours base
    const distanceFactor = warehouses.length * 12 // 12 hours per additional warehouse

    return baseTime + distanceFactor
  }

  static isWarehouseOperational(warehouse: WarehouseRegion): boolean {
    const config = this.WAREHOUSE_CAPABILITIES[warehouse]
    const now = new Date()
    const warehouseTime = new Intl.DateTimeFormat('en-US', {
      timeZone: config.timezone,
      hour: 'numeric',
      hour12: false
    }).format(now)

    const currentHour = parseInt(warehouseTime)
    return currentHour >= config.operatingHours.start && currentHour < config.operatingHours.end
  }
}

/**
 * Order Analytics Utilities
 */
export class OrderAnalyticsUtils {
  static calculateOrderMetrics(orders: Order[]): OrderAnalytics['orderMetrics'] {
    const totalOrders = orders.length
    const totalValue = orders.reduce((sum, order) => sum + order.pricing.total, 0)
    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0)

    return {
      totalOrders,
      totalValue,
      averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
      averageItemsPerOrder: totalOrders > 0 ? totalItems / totalOrders : 0
    }
  }

  static generateStatusBreakdown(orders: Order[]): Record<OrderStatus, number> {
    return orders.reduce((breakdown, order) => {
      breakdown[order.status] = (breakdown[order.status] || 0) + 1
      return breakdown
    }, {} as Record<OrderStatus, number>)
  }

  static analyzeWarehousePerformance(orders: Order[]) {
    const warehouseMetrics = {} as Record<WarehouseRegion, {
      orders: number
      value: number
      averageProcessingTime: number
    }>

    orders.forEach(order => {
      const warehouse = order.warehouseCoordination.primaryWarehouse
      if (!warehouseMetrics[warehouse]) {
        warehouseMetrics[warehouse] = { orders: 0, value: 0, averageProcessingTime: 0 }
      }

      warehouseMetrics[warehouse].orders++
      warehouseMetrics[warehouse].value += order.pricing.total

      // Calculate processing time if order is confirmed
      if (order.confirmedAt && order.createdAt) {
        const processingTime = order.confirmedAt.getTime() - order.createdAt.getTime()
        warehouseMetrics[warehouse].averageProcessingTime += processingTime
      }
    })

    // Calculate averages
    Object.values(warehouseMetrics).forEach(metrics => {
      if (metrics.orders > 0) {
        metrics.averageProcessingTime = metrics.averageProcessingTime / metrics.orders
      }
    })

    return warehouseMetrics
  }

  static getProductPopularity(orders: Order[]) {
    const productMetrics = new Map<string, {
      productId: string
      productName: string
      ordersCount: number
      totalQuantity: number
      revenue: number
    }>()

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMetrics.get(item.productId) || {
          productId: item.productId,
          productName: item.product.name,
          ordersCount: 0,
          totalQuantity: 0,
          revenue: 0
        }

        existing.ordersCount++
        existing.totalQuantity += item.quantity
        existing.revenue += item.totalPrice

        productMetrics.set(item.productId, existing)
      })
    })

    return Array.from(productMetrics.values())
      .sort((a, b) => b.revenue - a.revenue)
  }
}

/**
 * Order Validation Utilities
 */
export class OrderValidator {
  static validateOrderItems(items: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Order must contain at least one item')
      return { isValid: false, errors }
    }

    if (items.length > 50) {
      errors.push('Order cannot contain more than 50 items')
    }

    items.forEach((item, index) => {
      if (!item.productId || typeof item.productId !== 'string') {
        errors.push(`Item ${index + 1}: Product ID is required`)
      }

      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be a positive integer`)
      }

      if (item.quantity > 1000) {
        errors.push(`Item ${index + 1}: Quantity cannot exceed 1000`)
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  static validateShippingAddress(address: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const required = ['companyName', 'contactName', 'addressLine1', 'city', 'state', 'postalCode', 'country']

    required.forEach(field => {
      if (!address[field] || typeof address[field] !== 'string' || address[field].trim() === '') {
        errors.push(`${field} is required`)
      }
    })

    // Validate postal code format for US
    if (address.country === 'US' && address.postalCode) {
      const usZipRegex = /^\d{5}(-\d{4})?$/
      if (!usZipRegex.test(address.postalCode)) {
        errors.push('Invalid US postal code format')
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  static validateSupplierAccess(
    supplier: SupplierAuthData,
    requiredWarehouse?: WarehouseRegion
  ): { hasAccess: boolean; message?: string } {
    if (supplier.status !== 'ACTIVE') {
      return { hasAccess: false, message: 'Supplier account is not active' }
    }

    if (requiredWarehouse) {
      const hasWarehouseAccess = supplier.warehouseAccess.some(access =>
        access.warehouse === requiredWarehouse &&
        (!access.expiresAt || access.expiresAt > new Date())
      )

      if (!hasWarehouseAccess) {
        return { hasAccess: false, message: `No access to ${requiredWarehouse} warehouse` }
      }
    }

    return { hasAccess: true }
  }
}

/**
 * Order Event Logger
 */
export class OrderEventLogger {
  static createEvent(
    orderId: string,
    type: OrderEvent['type'],
    description: string,
    performedBy: OrderEvent['performedBy'],
    metadata?: Record<string, any>
  ): OrderEvent {
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      type,
      description,
      metadata,
      performedBy,
      timestamp: new Date()
    }
  }

  static formatEventForDisplay(event: OrderEvent): string {
    const time = event.timestamp.toLocaleString()
    const performer = event.performedBy.name || event.performedBy.type
    return `${time} - ${event.description} (by ${performer})`
  }
}

/**
 * Utility Functions
 */
export const OrderUtils = {
  // Currency formatting
  formatCurrency: (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  },

  // Date formatting
  formatOrderDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  },

  // Calculate order age in days
  getOrderAge: (createdAt: Date): number => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  // Generate tracking URL
  generateTrackingUrl: (trackingNumber: string, carrier = 'UPS'): string => {
    const carriers = {
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`
    }
    return carriers[carrier as keyof typeof carriers] || carriers.UPS
  },

  // Calculate weight from FlexVolt batteries
  calculateOrderWeight: (items: { product: FlexVoltProduct; quantity: number }[]): number => {
    const weights = {
      '6Ah': 1.4,
      '9Ah': 1.8,
      '15Ah': 2.6
    }

    return items.reduce((total, item) => {
      const weight = weights[item.product.type as keyof typeof weights] || 2.0
      return total + (weight * item.quantity)
    }, 0)
  }
}

// Export all utilities
export {
  OrderNumberGenerator,
  FlexVoltProductUtils,
  OrderStatusManager,
  ShippingCalculator,
  WarehouseCoordinator,
  OrderAnalyticsUtils,
  OrderValidator,
  OrderEventLogger
}