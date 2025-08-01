// Terminal 3 Integration: Database-Connected Order Service
// Real order management with database persistence

import { PrismaClient } from '@prisma/client'
import { stripeService } from './payment/stripe-service'
import { inventoryService } from './inventory-service'
import { analyticsService } from './analytics/commerce-analytics'

const prisma = new PrismaClient()

export interface CreateOrderInput {
  customerId: string
  items: OrderItemInput[]
  shippingAddress: ShippingAddress
  paymentMethodId: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  metadata?: Record<string, any>
}

export interface OrderItemInput {
  productId: string
  sku: string
  name: string
  quantity: number
  price: number
  total: number
}

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  items: OrderItem[]
  shippingAddress: ShippingAddress
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentIntentId?: string
  trackingNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  sku: string
  name: string
  quantity: number
  price: number
  total: number
}

export type OrderStatus = 
  | 'pending'
  | 'processing' 
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'failed'

export class OrderService {
  // Create order with real database
  async createOrder(orderData: CreateOrderInput): Promise<Order> {
    try {
      // Start transaction
      const order = await prisma.$transaction(async (tx) => {
        // Check inventory availability for all items
        for (const item of orderData.items) {
          const availability = await inventoryService.checkAvailability(
            item.productId,
            item.quantity
          )
          
          if (!availability.available) {
            throw new Error(`Product ${item.name} is out of stock`)
          }
        }

        // Create payment intent
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: Math.round(orderData.total * 100), // Convert to cents
          customerId: orderData.customerId,
          orderId: '', // Will update after order creation
          metadata: {
            customerEmail: await this.getCustomerEmail(orderData.customerId)
          }
        })

        // Create order in database
        const order = await tx.order.create({
          data: {
            customerId: orderData.customerId,
            status: 'pending',
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            tax: orderData.tax,
            total: orderData.total,
            paymentIntentId: paymentIntent.id,
            shippingAddressLine1: orderData.shippingAddress.line1,
            shippingAddressLine2: orderData.shippingAddress.line2,
            shippingCity: orderData.shippingAddress.city,
            shippingState: orderData.shippingAddress.state,
            shippingPostalCode: orderData.shippingAddress.postalCode,
            shippingCountry: orderData.shippingAddress.country,
            items: {
              create: orderData.items.map(item => ({
                productId: item.productId,
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
              }))
            }
          },
          include: {
            items: true
          }
        })

        // Update payment intent with order ID
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            orderId: order.id,
            customerEmail: await this.getCustomerEmail(orderData.customerId)
          }
        })

        // Reserve inventory
        for (const item of orderData.items) {
          await inventoryService.reserveInventory(
            item.productId,
            item.quantity,
            order.id
          )
        }

        return order
      })

      // Track order creation
      await analyticsService.trackOrderCreated(order)

      // Send order confirmation email
      await this.sendOrderConfirmation(order)

      return this.formatOrder(order)
    } catch (error) {
      console.error('Failed to create order:', error)
      throw new Error('Order creation failed')
    }
  }

  // Process payment and update order
  async processPayment(orderId: string, paymentMethodId: string): Promise<Order> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // Confirm payment with Stripe
      const result = await stripeService.confirmPayment({
        paymentIntentId: order.paymentIntentId!,
        paymentMethodId
      })

      if (result.status === 'succeeded') {
        // Update order status
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'paid',
            paidAt: new Date()
          },
          include: { items: true }
        })

        // Send to fulfillment
        await this.sendToFulfillment(updatedOrder)

        // Track conversion
        await analyticsService.trackConversion(updatedOrder)

        return this.formatOrder(updatedOrder)
      } else {
        throw new Error('Payment failed')
      }
    } catch (error) {
      console.error('Failed to process payment:', error)
      
      // Update order status to failed
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'failed' }
      })
      
      throw error
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    return order ? this.formatOrder(order) : null
  }

  // Get customer orders
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })

    return orders.map(order => this.formatOrder(order))
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'shipped' && { shippedAt: new Date() }),
        ...(status === 'delivered' && { deliveredAt: new Date() })
      },
      include: { items: true }
    })

    // Send status update notification
    await this.sendStatusUpdate(order)

    // Track status change
    await analyticsService.trackOrderStatusChange(order.id, status)

    return this.formatOrder(order)
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (!['pending', 'processing', 'paid'].includes(order.status)) {
      throw new Error('Order cannot be cancelled')
    }

    // Process refund if paid
    if (order.status === 'paid' && order.paymentIntentId) {
      await stripeService.processRefund({
        paymentIntentId: order.paymentIntentId,
        reason: reason || 'Customer requested cancellation'
      })
    }

    // Release inventory
    for (const item of order.items) {
      await inventoryService.releaseInventory(
        item.productId,
        item.quantity,
        orderId
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        notes: reason
      },
      include: { items: true }
    })

    // Send cancellation notification
    await this.sendCancellationNotification(updatedOrder)

    return this.formatOrder(updatedOrder)
  }

  // Send to fulfillment
  private async sendToFulfillment(order: any): Promise<void> {
    // In production, would integrate with fulfillment service
    console.log(`Sending order ${order.id} to fulfillment`)
    
    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'preparing' }
    })
  }

  // Get customer email
  private async getCustomerEmail(customerId: string): Promise<string> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { email: true }
    })
    
    return customer?.email || ''
  }

  // Send order confirmation
  private async sendOrderConfirmation(order: any): Promise<void> {
    // In production, would integrate with email service
    console.log(`Sending order confirmation for order ${order.id}`)
  }

  // Send status update
  private async sendStatusUpdate(order: any): Promise<void> {
    // In production, would integrate with email service
    console.log(`Sending status update for order ${order.id}`)
  }

  // Send cancellation notification
  private async sendCancellationNotification(order: any): Promise<void> {
    // In production, would integrate with email service
    console.log(`Sending cancellation notification for order ${order.id}`)
  }

  // Format order from database
  private formatOrder(dbOrder: any): Order {
    return {
      id: dbOrder.id,
      customerId: dbOrder.customerId,
      status: dbOrder.status,
      items: dbOrder.items.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      shippingAddress: {
        line1: dbOrder.shippingAddressLine1,
        line2: dbOrder.shippingAddressLine2,
        city: dbOrder.shippingCity,
        state: dbOrder.shippingState,
        postalCode: dbOrder.shippingPostalCode,
        country: dbOrder.shippingCountry
      },
      subtotal: dbOrder.subtotal,
      shipping: dbOrder.shipping,
      tax: dbOrder.tax,
      total: dbOrder.total,
      paymentIntentId: dbOrder.paymentIntentId,
      trackingNumber: dbOrder.trackingNumber,
      notes: dbOrder.notes,
      createdAt: dbOrder.createdAt,
      updatedAt: dbOrder.updatedAt,
      paidAt: dbOrder.paidAt,
      shippedAt: dbOrder.shippedAt,
      deliveredAt: dbOrder.deliveredAt
    }
  }
}

// Singleton instance
export const orderService = new OrderService()

// Helper function for order creation
export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  return orderService.createOrder(orderData)
}

// Helper function for processing payment
export async function processOrderPayment(orderId: string, paymentMethodId: string): Promise<Order> {
  return orderService.processPayment(orderId, paymentMethodId)
}

export default orderService