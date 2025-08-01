/**
 * Order Management Utilities - RHY_053
 * Utility functions for order tracking and management operations
 * Integrates with Batch 1 design system and business logic
 */

import type { 
  Order, 
  OrderStatus, 
  TrackingStatus, 
  OrderPriority,
  TrackingEvent,
  OrderAnalytics,
  OrderMetrics,
  FulfillmentMetrics,
  CUSTOMER_TYPES,
  WAREHOUSE_REGIONS,
  FLEXVOLT_CATEGORIES 
} from '@/types/order_management'

/**
 * Order Status Utilities
 */
export const orderStatusUtils = {
  /**
   * Get human-readable status label
   */
  getStatusLabel: (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      'draft': 'Draft',
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'fulfillment': 'Fulfillment',
      'picking': 'Picking',
      'packing': 'Packing',
      'ready_to_ship': 'Ready to Ship',
      'shipped': 'Shipped',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'returned': 'Returned',
      'refunded': 'Refunded',
      'failed': 'Failed'
    }
    return labels[status] || status
  },

  /**
   * Get status color class for UI components
   */
  getStatusColor: (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-blue-100 text-blue-800',
      'fulfillment': 'bg-indigo-100 text-indigo-800',
      'picking': 'bg-indigo-100 text-indigo-800',
      'packing': 'bg-indigo-100 text-indigo-800',
      'ready_to_ship': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-green-100 text-green-800',
      'in_transit': 'bg-green-100 text-green-800',
      'out_for_delivery': 'bg-green-100 text-green-800',
      'delivered': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'returned': 'bg-orange-100 text-orange-800',
      'refunded': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  },

  /**
   * Check if status is active (requires tracking updates)
   */
  isActiveStatus: (status: OrderStatus): boolean => {
    return ['processing', 'fulfillment', 'picking', 'packing', 'ready_to_ship', 'shipped', 'in_transit', 'out_for_delivery'].includes(status)
  },

  /**
   * Check if status is completed
   */
  isCompletedStatus: (status: OrderStatus): boolean => {
    return ['delivered', 'completed', 'cancelled', 'returned', 'refunded'].includes(status)
  },

  /**
   * Get next possible statuses
   */
  getNextStatuses: (currentStatus: OrderStatus): OrderStatus[] => {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      'draft': ['pending', 'cancelled'],
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['fulfillment', 'cancelled'],
      'fulfillment': ['picking', 'cancelled'],
      'picking': ['packing', 'cancelled'],
      'packing': ['ready_to_ship', 'cancelled'],
      'ready_to_ship': ['shipped', 'cancelled'],
      'shipped': ['in_transit', 'cancelled'],
      'in_transit': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'cancelled'],
      'delivered': ['completed', 'returned'],
      'completed': ['returned'],
      'cancelled': [],
      'returned': ['refunded'],
      'refunded': [],
      'failed': ['cancelled']
    }
    return transitions[currentStatus] || []
  }
}

/**
 * Priority Utilities
 */
export const priorityUtils = {
  /**
   * Get priority color class
   */
  getPriorityColor: (priority: OrderPriority): string => {
    const colors: Record<OrderPriority, string> = {
      'LOW': 'bg-gray-100 text-gray-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
      'EXPEDITED': 'bg-purple-100 text-purple-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  },

  /**
   * Get priority sort order (higher number = higher priority)
   */
  getPrioritySort: (priority: OrderPriority): number => {
    const order: Record<OrderPriority, number> = {
      'LOW': 1,
      'NORMAL': 2,
      'HIGH': 3,
      'URGENT': 4,
      'EXPEDITED': 5
    }
    return order[priority] || 2
  }
}

/**
 * Tracking Utilities
 */
export const trackingUtils = {
  /**
   * Calculate delivery progress percentage
   */
  calculateDeliveryProgress: (events: TrackingEvent[], status: OrderStatus): number => {
    const statusProgress: Record<OrderStatus, number> = {
      'draft': 0,
      'pending': 5,
      'confirmed': 10,
      'processing': 20,
      'fulfillment': 30,
      'picking': 40,
      'packing': 50,
      'ready_to_ship': 60,
      'shipped': 70,
      'in_transit': 80,
      'out_for_delivery': 90,
      'delivered': 100,
      'completed': 100,
      'cancelled': 0,
      'returned': 0,
      'refunded': 0,
      'failed': 0
    }

    let progress = statusProgress[status] || 0

    // Enhance progress based on specific tracking events
    if (events.some(e => e.status === 'IN_TRANSIT')) {
      progress = Math.max(progress, 75)
    }
    if (events.some(e => e.status === 'OUT_FOR_DELIVERY')) {
      progress = Math.max(progress, 90)
    }
    if (events.some(e => e.status === 'DELIVERED')) {
      progress = 100
    }

    return Math.min(100, Math.max(0, progress))
  },

  /**
   * Estimate next update time
   */
  estimateNextUpdate: (events: TrackingEvent[], status: OrderStatus): string => {
    const now = new Date()
    let nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default: 24 hours

    switch (status) {
      case 'processing':
      case 'fulfillment':
      case 'picking':
      case 'packing':
        nextUpdate = new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
        break
      case 'shipped':
      case 'in_transit':
        nextUpdate = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 8 hours
        break
      case 'out_for_delivery':
        nextUpdate = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours
        break
      case 'delivered':
      case 'completed':
      case 'cancelled':
        return 'No further updates expected'
    }

    return nextUpdate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  },

  /**
   * Get tracking status icon
   */
  getTrackingIcon: (status: TrackingStatus): string => {
    const icons: Record<TrackingStatus, string> = {
      'LABEL_CREATED': 'Circle',
      'PICKED_UP': 'Package',
      'IN_TRANSIT': 'Truck',
      'ARRIVED_AT_FACILITY': 'MapPin',
      'OUT_FOR_DELIVERY': 'Truck',
      'DELIVERY_ATTEMPTED': 'AlertTriangle',
      'DELIVERED': 'CheckCircle',
      'EXCEPTION': 'AlertCircle',
      'RETURNED': 'RotateCcw'
    }
    return icons[status] || 'Circle'
  }
}

/**
 * Currency and Formatting Utilities
 */
export const formatUtils = {
  /**
   * Format currency amount
   */
  formatCurrency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  },

  /**
   * Format percentage
   */
  formatPercentage: (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`
  },

  /**
   * Format date for display
   */
  formatDate: (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleString('en-US', { ...defaultOptions, ...options })
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime: (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return date.toLocaleDateString()
  },

  /**
   * Format address for display
   */
  formatAddress: (address: any): string => {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode
    ].filter(Boolean)
    
    return parts.join(', ')
  },

  /**
   * Format phone number
   */
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }
}

/**
 * Business Logic Utilities
 */
export const businessUtils = {
  /**
   * Calculate volume discount tier and amount
   */
  calculateVolumeDiscount: (subtotal: number): {
    tier: string
    percentage: number
    amount: number
    nextTierThreshold?: number
    nextTierSavings?: number
  } => {
    let tier = 'CONTRACTOR'
    let percentage = 0

    if (subtotal >= 7500) {
      tier = 'ENTERPRISE'
      percentage = 25
    } else if (subtotal >= 5000) {
      tier = 'COMMERCIAL'
      percentage = 20
    } else if (subtotal >= 2500) {
      tier = 'PROFESSIONAL'
      percentage = 15
    } else if (subtotal >= 1000) {
      tier = 'CONTRACTOR'
      percentage = 10
    }

    const amount = subtotal * (percentage / 100)
    
    // Calculate next tier information
    let nextTierThreshold: number | undefined
    let nextTierSavings: number | undefined
    
    if (subtotal < 1000) {
      nextTierThreshold = 1000
      nextTierSavings = (1000 * 0.1) - amount
    } else if (subtotal < 2500) {
      nextTierThreshold = 2500
      nextTierSavings = (subtotal * 0.15) - amount
    } else if (subtotal < 5000) {
      nextTierThreshold = 5000
      nextTierSavings = (subtotal * 0.20) - amount
    } else if (subtotal < 7500) {
      nextTierThreshold = 7500
      nextTierSavings = (subtotal * 0.25) - amount
    }

    return {
      tier,
      percentage,
      amount,
      nextTierThreshold,
      nextTierSavings
    }
  },

  /**
   * Get FlexVolt product information
   */
  getFlexVoltInfo: (category: string): {
    name: string
    capacity: string
    voltage: string
    price: number
    runtime: string
    compatibility: string[]
  } => {
    const products = {
      'FLEXVOLT_6AH': {
        name: '6Ah FlexVolt Battery',
        capacity: '6Ah',
        voltage: '20V/60V MAX',
        price: 95,
        runtime: '2 hours',
        compatibility: ['Cordless Drills', 'Circular Saws', 'Impact Drivers', 'Grinders']
      },
      'FLEXVOLT_9AH': {
        name: '9Ah FlexVolt Battery',
        capacity: '9Ah',
        voltage: '20V/60V MAX',
        price: 125,
        runtime: '3 hours',
        compatibility: ['Miter Saws', 'Table Saws', 'Reciprocating Saws', 'Blowers']
      },
      'FLEXVOLT_15AH': {
        name: '15Ah FlexVolt Battery',
        capacity: '15Ah',
        voltage: '20V/60V MAX',
        price: 245,
        runtime: '5 hours',
        compatibility: ['Chain Saws', 'Concrete Mixers', 'Large Tools', 'Industrial Equipment']
      }
    }
    
    return products[category as keyof typeof products] || {
      name: 'Unknown Product',
      capacity: 'N/A',
      voltage: 'N/A',
      price: 0,
      runtime: 'N/A',
      compatibility: []
    }
  },

  /**
   * Calculate estimated delivery date
   */
  calculateEstimatedDelivery: (
    shippingMethod: string, 
    warehouseRegion: string, 
    destinationState: string
  ): Date => {
    const now = new Date()
    let businessDays = 5 // Default

    // Adjust based on shipping method
    switch (shippingMethod) {
      case 'OVERNIGHT':
        businessDays = 1
        break
      case 'EXPEDITED':
        businessDays = 2
        break
      case 'STANDARD':
        businessDays = 5
        break
      case 'FREIGHT':
        businessDays = 7
        break
    }

    // Adjust based on warehouse region and destination
    const isInternational = warehouseRegion !== 'US' && !['US', 'USA'].includes(destinationState)
    if (isInternational) {
      businessDays += 3
    }

    // Calculate delivery date (skip weekends)
    let deliveryDate = new Date(now)
    let addedDays = 0
    
    while (addedDays < businessDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1)
      const dayOfWeek = deliveryDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
        addedDays++
      }
    }

    return deliveryDate
  },

  /**
   * Validate warehouse access for customer type
   */
  validateWarehouseAccess: (customerType: string, warehouseRegion: string): boolean => {
    // Enterprise customers have access to all warehouses
    if (customerType === 'FLEET' || customerType === 'SERVICE') {
      return true
    }

    // Distributors have access to specific regions
    if (customerType === 'DISTRIBUTOR') {
      return ['US', 'EU'].includes(warehouseRegion)
    }

    // Direct customers have access to their local regions
    return true
  }
}

/**
 * Analytics Utilities
 */
export const analyticsUtils = {
  /**
   * Calculate order metrics from order list
   */
  calculateOrderMetrics: (orders: Order[]): OrderMetrics => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate growth rates (simplified - in production would use historical data)
    const orderGrowthRate = 0.15 // 15% growth
    const revenueGrowthRate = 0.20 // 20% growth
    const customerRetentionRate = 0.85 // 85% retention

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orderGrowthRate,
      revenueGrowthRate,
      customerRetentionRate
    }
  },

  /**
   * Calculate fulfillment metrics
   */
  calculateFulfillmentMetrics: (orders: Order[]): FulfillmentMetrics => {
    const completedOrders = orders.filter(order => 
      orderStatusUtils.isCompletedStatus(order.status)
    )

    // Simplified calculations - in production would use more sophisticated logic
    return {
      averageProcessingTime: 24, // hours
      averageFulfillmentTime: 48, // hours
      onTimeDeliveryRate: 0.95, // 95%
      qualityScore: 0.98, // 98%
      customerSatisfactionScore: 0.92 // 92%
    }
  },

  /**
   * Group orders by status
   */
  groupOrdersByStatus: (orders: Order[]): Record<OrderStatus, number> => {
    const statusCounts: Record<OrderStatus, number> = {
      'draft': 0,
      'pending': 0,
      'confirmed': 0,
      'processing': 0,
      'fulfillment': 0,
      'picking': 0,
      'packing': 0,
      'ready_to_ship': 0,
      'shipped': 0,
      'in_transit': 0,
      'out_for_delivery': 0,
      'delivered': 0,
      'completed': 0,
      'cancelled': 0,
      'returned': 0,
      'refunded': 0,
      'failed': 0
    }

    orders.forEach(order => {
      statusCounts[order.status]++
    })

    return statusCounts
  },

  /**
   * Group orders by warehouse region
   */
  groupOrdersByRegion: (orders: Order[]): Record<string, number> => {
    const regionCounts: Record<string, number> = {}

    orders.forEach(order => {
      const region = order.warehouseRegion
      regionCounts[region] = (regionCounts[region] || 0) + 1
    })

    return regionCounts
  }
}

/**
 * Validation Utilities
 */
export const validationUtils = {
  /**
   * Validate order data
   */
  validateOrderData: (orderData: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!orderData.customerId) {
      errors.push('Customer ID is required')
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Order must contain at least one item')
    }

    if (!orderData.shipping || !orderData.shipping.address) {
      errors.push('Shipping address is required')
    }

    if (!orderData.payment) {
      errors.push('Payment information is required')
    }

    // Validate items
    if (orderData.items) {
      orderData.items.forEach((item: any, index: number) => {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          errors.push(`Invalid item at index ${index}`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate address data
   */
  validateAddress: (address: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const requiredFields = ['firstName', 'lastName', 'line1', 'city', 'state', 'postalCode', 'country']

    requiredFields.forEach(field => {
      if (!address[field]) {
        errors.push(`${field} is required`)
      }
    })

    // Validate postal code format (simplified)
    if (address.postalCode && address.country === 'US') {
      const zipRegex = /^\d{5}(-\d{4})?$/
      if (!zipRegex.test(address.postalCode)) {
        errors.push('Invalid US postal code format')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Export all utilities
 */
export const orderUtils = {
  status: orderStatusUtils,
  priority: priorityUtils,
  tracking: trackingUtils,
  format: formatUtils,
  business: businessUtils,
  analytics: analyticsUtils,
  validation: validationUtils
}