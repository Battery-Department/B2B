import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { cartService } from './cart-service'
import { emailService } from './email-service'
import { productService } from './product-service'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia'
    })
  : null

export interface CheckoutData {
  sessionId: string
  userId?: string
  customerEmail: string
  customerName?: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country?: string
  }
  billingAddress?: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country?: string
  }
}

export class CheckoutService {
  async createCheckoutSession(data: CheckoutData) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured - STRIPE_SECRET_KEY environment variable missing')
      }
      // 1. Get cart with totals
      const cart = await cartService.getCart(data.sessionId, data.userId)
      
      if (!cart.items.length) {
        throw new Error('Cart is empty')
      }
      
      // 2. Validate inventory for all items
      for (const item of cart.items) {
        const available = await productService.checkStock(item.productId, item.quantity)
        if (!available) {
          throw new Error(`${item.product.name} is out of stock`)
        }
      }
      
      // 3. Create order in database
      const order = await prisma.order.create({
        data: {
          userId: data.userId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          status: 'pending',
          subtotal: cart.totals.subtotal,
          discount: cart.totals.discountAmount,
          tax: cart.totals.tax,
          shipping: cart.totals.shipping,
          total: cart.totals.total,
          shippingAddress: JSON.stringify(data.shippingAddress),
          billingAddress: JSON.stringify(data.billingAddress || data.shippingAddress),
          orderItems: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      })
      
      // 4. Create Stripe line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: `SKU: ${item.product.sku}`,
            images: item.product.imageUrl ? [item.product.imageUrl] : undefined
          },
          unit_amount: Math.round(Number(item.price) * 100) // Convert to cents
        },
        quantity: item.quantity
      }))
      
      // 5. Add tax as line item
      if (cart.totals.tax > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sales Tax',
              description: '8% sales tax'
            },
            unit_amount: Math.round(cart.totals.tax * 100)
          },
          quantity: 1
        })
      }
      
      // 6. Add shipping as line item
      if (cart.totals.shipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Standard Shipping',
              description: '3-5 business days'
            },
            unit_amount: Math.round(cart.totals.shipping * 100)
          },
          quantity: 1
        })
      }
      
      // 7. Create discount if applicable
      let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = []
      if (cart.totals.volumeDiscount) {
        const coupon = await this.getOrCreateVolumeCoupon(cart.totals.volumeDiscount.percentage)
        discounts = [{ coupon: coupon.id }]
      }
      
      // 8. Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL}/customer/orders/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/customer/checkout?canceled=true`,
        customer_email: data.customerEmail,
        metadata: {
          orderId: order.id,
          sessionId: data.sessionId,
          userId: data.userId || ''
        },
        discounts: discounts,
        shipping_address_collection: {
          allowed_countries: ['US', 'CA']
        },
        billing_address_collection: 'required',
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
      })
      
      // 9. Update order with Stripe session ID
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          stripeSessionId: session.id,
          metadata: JSON.stringify({
            stripeSessionUrl: session.url,
            createdAt: new Date().toISOString()
          })
        }
      })
      
      return {
        sessionUrl: session.url,
        sessionId: session.id,
        orderId: order.id
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      throw new Error(error.message || 'Failed to create checkout session')
    }
  }

  async handlePaymentSuccess(stripeSessionId: string) {
    try {
      // 1. Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ['payment_intent', 'customer']
      })
      
      if (!session.metadata?.orderId) {
        throw new Error('Order ID not found in session metadata')
      }
      
      // 2. Get order from database
      const order = await prisma.order.findUnique({
        where: { id: session.metadata.orderId },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      })
      
      if (!order) {
        throw new Error('Order not found')
      }
      
      // 3. Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'confirmed',
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(order.metadata as string || '{}'),
            paymentCompletedAt: new Date().toISOString(),
            stripeCustomerId: session.customer
          })
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      })
      
      // 4. Update inventory
      for (const item of order.orderItems) {
        await productService.updateStock(item.productId, item.quantity, 'decrement')
      }
      
      // 5. Clear the cart
      await cartService.clearCart(session.metadata.sessionId, session.metadata.userId || undefined)
      
      // 6. Send confirmation email
      await emailService.sendOrderConfirmation({
        ...updatedOrder,
        customer: {
          email: order.customerEmail,
          name: order.customerName
        },
        shippingAddress: JSON.parse(order.shippingAddress as string)
      })
      
      return updatedOrder
    } catch (error: any) {
      console.error('Payment success handler error:', error)
      throw new Error(error.message || 'Failed to process payment confirmation')
    }
  }

  async handlePaymentCanceled(orderId: string) {
    try {
      // Update order status to canceled
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'canceled',
          metadata: JSON.stringify({
            canceledAt: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error('Payment canceled handler error:', error)
    }
  }

  async getOrderStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    })
    
    if (!order) {
      throw new Error('Order not found')
    }
    
    return order
  }

  private async getOrCreateVolumeCoupon(percentage: number) {
    const percentOff = Math.round(percentage * 100)
    const couponId = `VOLUME_${percentOff}`
    
    try {
      // Try to retrieve existing coupon
      return await stripe.coupons.retrieve(couponId)
    } catch (error) {
      // Create new coupon if it doesn't exist
      return await stripe.coupons.create({
        id: couponId,
        percent_off: percentOff,
        duration: 'once',
        name: `Volume Discount - ${percentOff}% off`
      })
    }
  }

  // Webhook handler for Stripe events
  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await this.handlePaymentSuccess(session.id)
        break
        
      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session
        if (expiredSession.metadata?.orderId) {
          await this.handlePaymentCanceled(expiredSession.metadata.orderId)
        }
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  // Calculate estimated delivery date
  getEstimatedDeliveryDate(shippingMethod: 'standard' | 'express' = 'standard'): Date {
    const businessDays = shippingMethod === 'express' ? 2 : 5
    const deliveryDate = new Date()
    let daysAdded = 0
    
    while (daysAdded < businessDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1)
      // Skip weekends
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        daysAdded++
      }
    }
    
    return deliveryDate
  }
}

// Export singleton instance
export const checkoutService = new CheckoutService()