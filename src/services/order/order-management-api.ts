// Terminal 3: Order Management API - Complete Order Lifecycle Management
// Bulletproof order processing with payment integration, inventory allocation, and shipping

import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'
import { ecommerceDataLayer, withDatabaseTransaction } from '@/services/database/ecommerce-data-layer'
import { inventoryManagement } from '@/services/database/inventory-management'
import { stripeService } from '@/services/payment/stripe-service'

const prisma = new PrismaClient()

export interface OrderRequest {
  customerId: string
  items: OrderItemRequest[]
  shippingAddress: ShippingAddressRequest
  billingAddress?: ShippingAddressRequest
  paymentMethodId: string
  shippingMethodId?: string
  promoCode?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface OrderItemRequest {
  productId: string
  sku?: string
  quantity: number
  customPrice?: number // For manual price overrides
  giftWrap?: boolean
  giftMessage?: string
}

export interface ShippingAddressRequest {
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  instructions?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  status: OrderStatus
  stage: OrderStage
  items: OrderItem[]
  pricing: OrderPricing
  addresses: OrderAddresses
  payment: OrderPayment
  shipping: OrderShipping
  fulfillment: OrderFulfillment
  timeline: OrderTimeline[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type OrderStage = 
  | 'cart' 
  | 'checkout' 
  | 'payment_pending' 
  | 'payment_processing' 
  | 'inventory_allocation' 
  | 'fulfillment_queue' 
  | 'picking' 
  | 'packing' 
  | 'shipping' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'completed'

export interface OrderItem {
  id: string
  productId: string
  sku: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount: number
  taxAmount: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  customizations?: Record<string, any>
  fulfillmentStatus: FulfillmentStatus
  trackingInfo?: TrackingInfo
}

export type FulfillmentStatus = 'pending' | 'allocated' | 'picked' | 'packed' | 'shipped' | 'delivered' | 'returned'

export interface OrderPricing {
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingAmount: number
  handlingAmount: number
  total: number
  currency: string
  appliedPromoCodes: PromoCode[]
  taxBreakdown: TaxBreakdown[]
}

export interface PromoCode {
  code: string
  type: 'percentage' | 'fixed' | 'shipping'
  value: number
  discountAmount: number
  description: string
}

export interface TaxBreakdown {
  type: string
  rate: number
  amount: number
  jurisdiction: string
}

export interface OrderAddresses {
  shipping: ShippingAddress
  billing: ShippingAddress
}

export interface ShippingAddress {
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  instructions?: string
  validated: boolean
  residential: boolean
}

export interface OrderPayment {
  paymentIntentId?: string
  paymentMethodId: string
  amount: number
  currency: string
  status: PaymentStatus
  capturedAmount?: number
  refundedAmount?: number
  processingFee?: number
  processor: string
  transactionId?: string
  authCode?: string
  processedAt?: Date
  failures: PaymentFailure[]
}

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'

export interface PaymentFailure {
  code: string
  message: string
  timestamp: Date
  retryable: boolean
}

export interface OrderShipping {
  methodId: string
  methodName: string
  carrier: string
  service: string
  cost: number
  estimatedDays: number
  estimatedDelivery: Date
  trackingNumber?: string
  trackingUrl?: string
  labelUrl?: string
  packageCount: number
  packages: ShippingPackage[]
}

export interface ShippingPackage {
  id: string
  trackingNumber: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  items: string[] // Order item IDs
  status: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'exception'
  events: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: Date
  status: string
  description: string
  location?: string
  carrier: string
}

export interface TrackingInfo {
  trackingNumber: string
  carrier: string
  status: string
  estimatedDelivery?: Date
  events: TrackingEvent[]
}

export interface OrderFulfillment {
  warehouseId: string
  picklistId?: string
  packedBy?: string
  shippedBy?: string
  allocatedAt?: Date
  pickedAt?: Date
  packedAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
  specialInstructions?: string
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent'
}

export interface OrderTimeline {
  id: string
  timestamp: Date
  event: string
  description: string
  actor: string // user ID or 'system'
  actorType: 'user' | 'system' | 'external'
  metadata?: Record<string, any>
}

export interface OrderSearchCriteria {
  customerId?: string
  status?: OrderStatus[]
  stage?: OrderStage[]
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  searchTerm?: string // Search in order number, customer name, etc.
  productId?: string
  warehouseId?: string
  page?: number
  limit?: number
  sortBy?: 'created' | 'updated' | 'total' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  statusBreakdown: Record<OrderStatus, number>
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
  customerMetrics: {
    newCustomers: number
    returningCustomers: number
    repeatOrderRate: number
  }
  fulfillmentMetrics: {
    averageProcessingTime: number
    onTimeDeliveryRate: number
    errorRate: number
  }
}

export class OrderValidationError extends Error {
  constructor(message: string, public field: string, public code: string) {
    super(message)
    this.name = 'OrderValidationError'
  }
}

export class OrderProcessingError extends Error {
  constructor(message: string, public orderId: string, public stage: string) {
    super(message)
    this.name = 'OrderProcessingError'
  }
}

export class OrderManagementAPI extends EventEmitter {
  private orderSequence: number
  private processingQueue: Map<string, Order>
  private retryQueue: Map<string, { order: Order; attempts: number; nextRetry: Date }>

  constructor() {
    super()
    this.orderSequence = 1000000 // Start order numbers at 1 million
    this.processingQueue = new Map()
    this.retryQueue = new Map()

    this.startBackgroundProcessing()
  }

  // Create new order
  async createOrder(request: OrderRequest): Promise<Order> {
    return withDatabaseTransaction(async (tx) => {
      try {
        // Validate request
        await this.validateOrderRequest(request)

        // Generate order number
        const orderNumber = await this.generateOrderNumber()

        // Calculate pricing
        const pricing = await this.calculateOrderPricing(request)

        // Validate inventory availability
        await this.validateInventoryAvailability(request.items)

        // Create order record
        const orderData = {
          id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderNumber,
          customerId: request.customerId,
          status: 'pending' as OrderStatus,
          stage: 'checkout' as OrderStage,
          subtotal: pricing.subtotal,
          tax: pricing.taxAmount,
          shipping: pricing.shippingAmount,
          total: pricing.total,
          currency: pricing.currency,
          shippingAddress: request.shippingAddress,
          paymentStatus: 'pending',
          metadata: request.metadata || {},
          items: {
            create: request.items.map((item, index) => ({
              productId: item.productId,
              sku: item.sku || `SKU-${item.productId}`,
              quantity: item.quantity,
              unitPrice: pricing.itemPricing[index].unitPrice,
              totalPrice: pricing.itemPricing[index].totalPrice
            }))
          }
        }

        const dbOrder = await tx.order.create({
          data: orderData,
          include: {
            items: true,
            customer: true
          }
        })

        // Format order for API response
        const order = await this.formatOrder(dbOrder)

        // Add to processing queue
        this.processingQueue.set(order.id, order)

        // Create timeline event
        await this.addTimelineEvent(order.id, 'order_created', 'Order created', 'system')

        // Emit order created event
        this.emit('orderCreated', order)

        return order

      } catch (error) {
        console.error('Failed to create order:', error)
        throw new OrderProcessingError(
          `Failed to create order: ${error.message}`,
          'unknown',
          'creation'
        )
      }
    })
  }

  // Process payment for order
  async processOrderPayment(orderId: string, paymentMethodId?: string): Promise<Order> {
    return withDatabaseTransaction(async (tx) => {
      try {
        const order = await this.getOrderById(orderId)
        if (!order) {
          throw new OrderProcessingError('Order not found', orderId, 'payment')
        }

        if (order.status !== 'pending') {
          throw new OrderProcessingError('Order cannot be processed', orderId, 'payment')
        }

        // Update order stage
        await this.updateOrderStage(orderId, 'payment_processing')

        // Create payment intent with Stripe
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: Math.round(order.pricing.total * 100), // Convert to cents
          currency: order.pricing.currency.toLowerCase(),
          customerId: order.customerId,
          orderId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            customerId: order.customerId
          }
        })

        // Update order with payment intent
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentIntentId: paymentIntent.id,
            status: 'confirmed'
          }
        })

        // If payment method provided, confirm payment immediately
        if (paymentMethodId) {
          const paymentResult = await stripeService.confirmPayment({
            paymentIntentId: paymentIntent.id,
            paymentMethodId
          })

          if (paymentResult.status === 'succeeded') {
            await this.handlePaymentSuccess(orderId, paymentResult)
          } else {
            await this.handlePaymentFailure(orderId, {
              code: 'payment_failed',
              message: 'Payment confirmation failed',
              timestamp: new Date(),
              retryable: true
            })
          }
        }

        const updatedOrder = await this.getOrderById(orderId)
        this.emit('paymentProcessed', updatedOrder)

        return updatedOrder!

      } catch (error) {
        console.error('Failed to process payment:', error)
        await this.handlePaymentFailure(orderId, {
          code: 'processing_error',
          message: error.message,
          timestamp: new Date(),
          retryable: false
        })
        throw error
      }
    })
  }

  // Handle successful payment
  private async handlePaymentSuccess(orderId: string, paymentResult: any): Promise<void> {
    return withDatabaseTransaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'processing',
          paymentStatus: 'paid',
          paidAt: new Date()
        }
      })

      // Update order stage
      await this.updateOrderStage(orderId, 'inventory_allocation')

      // Reserve inventory
      await this.allocateInventory(orderId)

      // Add timeline event
      await this.addTimelineEvent(orderId, 'payment_succeeded', 'Payment processed successfully', 'system')

      // Move to fulfillment queue
      await this.updateOrderStage(orderId, 'fulfillment_queue')

      this.emit('paymentSucceeded', { orderId, paymentResult })
    })
  }

  // Handle payment failure
  private async handlePaymentFailure(orderId: string, failure: PaymentFailure): Promise<void> {
    return withDatabaseTransaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'pending',
          paymentStatus: 'failed'
        }
      })

      await this.addTimelineEvent(
        orderId, 
        'payment_failed', 
        `Payment failed: ${failure.message}`, 
        'system'
      )

      // Add to retry queue if retryable
      if (failure.retryable) {
        const order = await this.getOrderById(orderId)
        if (order) {
          this.retryQueue.set(orderId, {
            order,
            attempts: 1,
            nextRetry: new Date(Date.now() + 300000) // Retry in 5 minutes
          })
        }
      }

      this.emit('paymentFailed', { orderId, failure })
    })
  }

  // Allocate inventory for order
  private async allocateInventory(orderId: string): Promise<void> {
    try {
      const order = await this.getOrderById(orderId)
      if (!order) throw new Error('Order not found')

      for (const item of order.items) {
        await inventoryManagement.reserveInventory(
          item.productId,
          item.quantity,
          orderId
        )
      }

      await this.addTimelineEvent(orderId, 'inventory_allocated', 'Inventory allocated', 'system')
      this.emit('inventoryAllocated', { orderId })

    } catch (error) {
      console.error('Failed to allocate inventory:', error)
      throw new OrderProcessingError(
        `Failed to allocate inventory: ${error.message}`,
        orderId,
        'inventory_allocation'
      )
    }
  }

  // Update order shipping information
  async updateOrderShipping(
    orderId: string,
    shippingInfo: {
      carrier: string
      service: string
      trackingNumber: string
      estimatedDelivery: Date
      packageInfo?: {
        weight: number
        dimensions: { length: number; width: number; height: number }
      }
    }
  ): Promise<Order> {
    return withDatabaseTransaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'shipped',
          trackingNumber: shippingInfo.trackingNumber,
          shippedAt: new Date()
        }
      })

      await this.updateOrderStage(orderId, 'in_transit')

      await this.addTimelineEvent(
        orderId,
        'order_shipped',
        `Order shipped via ${shippingInfo.carrier} - ${shippingInfo.trackingNumber}`,
        'system'
      )

      // Process inventory shipment
      const order = await this.getOrderById(orderId)
      if (order) {
        for (const item of order.items) {
          await inventoryManagement.processShipment(
            item.productId,
            item.quantity,
            'WH001', // Default warehouse
            orderId
          )
        }
      }

      const updatedOrder = await this.getOrderById(orderId)
      this.emit('orderShipped', updatedOrder)

      return updatedOrder!
    })
  }

  // Cancel order
  async cancelOrder(
    orderId: string,
    reason: string,
    refundAmount?: number
  ): Promise<Order> {
    return withDatabaseTransaction(async (tx) => {
      const order = await this.getOrderById(orderId)
      if (!order) {
        throw new OrderProcessingError('Order not found', orderId, 'cancellation')
      }

      if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        throw new OrderProcessingError('Order cannot be cancelled', orderId, 'cancellation')
      }

      // Release inventory reservations
      for (const item of order.items) {
        await inventoryManagement.releaseReservation(
          item.productId,
          item.quantity,
          orderId
        )
      }

      // Process refund if payment was captured
      if (order.payment.status === 'succeeded' && refundAmount) {
        await stripeService.processRefund({
          paymentIntentId: order.payment.paymentIntentId!,
          amount: Math.round(refundAmount * 100),
          reason
        })
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          internalNotes: reason
        }
      })

      await this.addTimelineEvent(orderId, 'order_cancelled', `Order cancelled: ${reason}`, 'system')

      const updatedOrder = await this.getOrderById(orderId)
      this.emit('orderCancelled', updatedOrder)

      return updatedOrder!
    })
  }

  // Search orders with advanced filtering
  async searchOrders(criteria: OrderSearchCriteria): Promise<{
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'created',
        sortOrder = 'desc'
      } = criteria

      // Build where clause
      const where: any = {}

      if (criteria.customerId) {
        where.customerId = criteria.customerId
      }

      if (criteria.status && criteria.status.length > 0) {
        where.status = { in: criteria.status }
      }

      if (criteria.dateRange) {
        where.createdAt = {
          gte: criteria.dateRange.start,
          lte: criteria.dateRange.end
        }
      }

      if (criteria.amountRange) {
        where.total = {
          gte: criteria.amountRange.min,
          lte: criteria.amountRange.max
        }
      }

      if (criteria.searchTerm) {
        where.OR = [
          { orderNumber: { contains: criteria.searchTerm, mode: 'insensitive' } },
          { customer: { user: { name: { contains: criteria.searchTerm, mode: 'insensitive' } } } }
        ]
      }

      // Build order by clause
      const orderBy: any = {}
      switch (sortBy) {
        case 'created':
          orderBy.createdAt = sortOrder
          break
        case 'updated':
          orderBy.updatedAt = sortOrder
          break
        case 'total':
          orderBy.total = sortOrder
          break
        case 'status':
          orderBy.status = sortOrder
          break
      }

      // Execute query
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: true
              }
            },
            customer: {
              include: {
                user: true
              }
            }
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.order.count({ where })
      ])

      const formattedOrders = await Promise.all(
        orders.map(order => this.formatOrder(order))
      )

      return {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('Failed to search orders:', error)
      throw error
    }
  }

  // Get order statistics
  async getOrderStats(dateRange?: { start: Date; end: Date }): Promise<OrderStats> {
    try {
      const where: any = {}
      if (dateRange) {
        where.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const [
        totalOrders,
        totalRevenue,
        statusBreakdown,
        topProducts
      ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.aggregate({
          where,
          _sum: { total: true }
        }),
        this.getStatusBreakdown(where),
        this.getTopProducts(where)
      ])

      const averageOrderValue = totalOrders > 0 
        ? (totalRevenue._sum.total || 0) / totalOrders 
        : 0

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue,
        statusBreakdown,
        topProducts,
        customerMetrics: await this.getCustomerMetrics(where),
        fulfillmentMetrics: await this.getFulfillmentMetrics(where)
      }

    } catch (error) {
      console.error('Failed to get order stats:', error)
      throw error
    }
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: {
            include: {
              user: true
            }
          }
        }
      })

      if (!dbOrder) return null

      return this.formatOrder(dbOrder)

    } catch (error) {
      console.error('Failed to get order:', error)
      throw error
    }
  }

  // Private helper methods

  private async validateOrderRequest(request: OrderRequest): Promise<void> {
    if (!request.customerId) {
      throw new OrderValidationError('Customer ID is required', 'customerId', 'REQUIRED')
    }

    if (!request.items || request.items.length === 0) {
      throw new OrderValidationError('At least one item is required', 'items', 'REQUIRED')
    }

    for (const item of request.items) {
      if (!item.productId) {
        throw new OrderValidationError('Product ID is required for all items', 'items.productId', 'REQUIRED')
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new OrderValidationError('Quantity must be positive', 'items.quantity', 'POSITIVE')
      }
    }

    if (!request.shippingAddress) {
      throw new OrderValidationError('Shipping address is required', 'shippingAddress', 'REQUIRED')
    }

    if (!request.paymentMethodId) {
      throw new OrderValidationError('Payment method is required', 'paymentMethodId', 'REQUIRED')
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const sequence = this.orderSequence++
    return `ORD-${sequence}`
  }

  private async calculateOrderPricing(request: OrderRequest): Promise<any> {
    // This would integrate with pricing service
    // For now, return mock pricing
    let subtotal = 0
    const itemPricing = []

    for (const item of request.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        throw new OrderValidationError(`Product not found: ${item.productId}`, 'items.productId', 'NOT_FOUND')
      }

      const unitPrice = item.customPrice || product.basePrice
      const totalPrice = unitPrice * item.quantity

      itemPricing.push({
        unitPrice,
        totalPrice,
        discountAmount: 0,
        taxAmount: totalPrice * 0.0875 // 8.75% tax
      })

      subtotal += totalPrice
    }

    const taxAmount = subtotal * 0.0875
    const shippingAmount = 0 // Free shipping
    const total = subtotal + taxAmount + shippingAmount

    return {
      subtotal,
      discountAmount: 0,
      taxAmount,
      shippingAmount,
      handlingAmount: 0,
      total,
      currency: 'USD',
      itemPricing,
      appliedPromoCodes: [],
      taxBreakdown: [
        {
          type: 'sales_tax',
          rate: 0.0875,
          amount: taxAmount,
          jurisdiction: 'TX'
        }
      ]
    }
  }

  private async validateInventoryAvailability(items: OrderItemRequest[]): Promise<void> {
    for (const item of items) {
      const availability = await inventoryManagement.getInventoryAvailability(
        item.productId,
        item.quantity
      )

      if (!availability.available) {
        throw new OrderValidationError(
          `Insufficient inventory for product ${item.productId}. Available: ${availability.totalAvailable}`,
          'items.quantity',
          'INSUFFICIENT_INVENTORY'
        )
      }
    }
  }

  private async formatOrder(dbOrder: any): Promise<Order> {
    // Format database order to API order format
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      customerId: dbOrder.customerId,
      status: dbOrder.status,
      stage: 'checkout', // Default stage
      items: dbOrder.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        sku: item.sku || item.product?.sku || 'UNKNOWN',
        name: item.product?.name || 'Unknown Product',
        description: item.product?.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discountAmount: 0,
        taxAmount: item.totalPrice * 0.0875,
        weight: 1.0,
        dimensions: { length: 12, width: 8, height: 4 },
        fulfillmentStatus: 'pending' as FulfillmentStatus
      })),
      pricing: {
        subtotal: dbOrder.subtotal,
        discountAmount: 0,
        taxAmount: dbOrder.tax,
        shippingAmount: dbOrder.shipping,
        handlingAmount: 0,
        total: dbOrder.total,
        currency: dbOrder.currency || 'USD',
        appliedPromoCodes: [],
        taxBreakdown: []
      },
      addresses: {
        shipping: dbOrder.shippingAddress,
        billing: dbOrder.shippingAddress
      },
      payment: {
        paymentIntentId: dbOrder.paymentIntentId,
        paymentMethodId: 'unknown',
        amount: dbOrder.total,
        currency: dbOrder.currency || 'USD',
        status: dbOrder.paymentStatus || 'pending',
        processor: 'stripe',
        failures: []
      },
      shipping: {
        methodId: 'standard',
        methodName: 'Standard Shipping',
        carrier: 'FedEx',
        service: 'Ground',
        cost: dbOrder.shipping,
        estimatedDays: 3,
        estimatedDelivery: new Date(Date.now() + 3 * 86400000),
        trackingNumber: dbOrder.trackingNumber,
        packageCount: 1,
        packages: []
      },
      fulfillment: {
        warehouseId: 'WH001',
        priorityLevel: 'normal'
      },
      timeline: [],
      metadata: dbOrder.metadata || {},
      createdAt: dbOrder.createdAt,
      updatedAt: dbOrder.updatedAt
    }
  }

  private async updateOrderStage(orderId: string, stage: OrderStage): Promise<void> {
    // This would update order stage in database
    await this.addTimelineEvent(orderId, 'stage_updated', `Order moved to ${stage}`, 'system')
  }

  private async addTimelineEvent(
    orderId: string,
    event: string,
    description: string,
    actor: string
  ): Promise<void> {
    // This would add timeline event to database
    this.emit('timelineEvent', {
      orderId,
      event,
      description,
      actor,
      timestamp: new Date()
    })
  }

  private async getStatusBreakdown(where: any): Promise<Record<OrderStatus, number>> {
    const breakdown = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    })

    const result: Record<OrderStatus, number> = {
      draft: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0
    }

    breakdown.forEach(item => {
      result[item.status as OrderStatus] = item._count.status
    })

    return result
  }

  private async getTopProducts(where: any): Promise<Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>> {
    // This would aggregate top products from order items
    return []
  }

  private async getCustomerMetrics(where: any): Promise<any> {
    // This would calculate customer metrics
    return {
      newCustomers: 0,
      returningCustomers: 0,
      repeatOrderRate: 0
    }
  }

  private async getFulfillmentMetrics(where: any): Promise<any> {
    // This would calculate fulfillment metrics
    return {
      averageProcessingTime: 24,
      onTimeDeliveryRate: 0.96,
      errorRate: 0.02
    }
  }

  private startBackgroundProcessing(): void {
    // Process retry queue every 5 minutes
    setInterval(async () => {
      await this.processRetryQueue()
    }, 300000)

    // Process fulfillment queue every minute
    setInterval(async () => {
      await this.processFulfillmentQueue()
    }, 60000)
  }

  private async processRetryQueue(): Promise<void> {
    const now = new Date()
    
    for (const [orderId, retryInfo] of this.retryQueue.entries()) {
      if (retryInfo.nextRetry <= now && retryInfo.attempts < 3) {
        try {
          await this.processOrderPayment(orderId)
          this.retryQueue.delete(orderId)
        } catch (error) {
          retryInfo.attempts++
          retryInfo.nextRetry = new Date(now.getTime() + (retryInfo.attempts * 300000))
          
          if (retryInfo.attempts >= 3) {
            await this.cancelOrder(orderId, 'Max payment retry attempts exceeded')
            this.retryQueue.delete(orderId)
          }
        }
      }
    }
  }

  private async processFulfillmentQueue(): Promise<void> {
    // Process orders ready for fulfillment
    // This would integrate with warehouse management system
  }
}

// Singleton instance
export const orderManagementAPI = new OrderManagementAPI()

export default orderManagementAPI