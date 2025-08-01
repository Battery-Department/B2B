// Terminal 3 Integration: Stripe Payment Service
// Real payment processing with Stripe integration

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia' as Stripe.LatestApiVersion,
})

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: string
  metadata: Record<string, string>
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'paypal'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

export interface CreatePaymentIntentInput {
  amount: number // in cents
  currency?: string
  customerId?: string
  orderId: string
  metadata?: Record<string, string>
}

export interface ConfirmPaymentInput {
  paymentIntentId: string
  paymentMethodId: string
  returnUrl?: string
}

export interface RefundInput {
  paymentIntentId: string
  amount?: number // partial refund if specified
  reason?: string
}

export class StripePaymentService {
  // Create payment intent
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: input.amount,
        currency: input.currency || 'usd',
        customer: input.customerId,
        metadata: {
          orderId: input.orderId,
          ...input.metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return {
        id: intent.id,
        clientSecret: intent.client_secret!,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        metadata: intent.metadata as Record<string, string>
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      throw new Error('Payment processing failed')
    }
  }

  // Confirm payment
  async confirmPayment(input: ConfirmPaymentInput): Promise<PaymentIntent> {
    try {
      const intent = await stripe.paymentIntents.confirm(input.paymentIntentId, {
        payment_method: input.paymentMethodId,
        return_url: input.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/customer/orders`
      })

      return {
        id: intent.id,
        clientSecret: intent.client_secret!,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        metadata: intent.metadata as Record<string, string>
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error)
      throw new Error('Payment confirmation failed')
    }
  }

  // Process refund
  async processRefund(input: RefundInput): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: input.paymentIntentId,
        amount: input.amount,
        reason: input.reason as Stripe.RefundCreateParams.Reason
      })

      return refund
    } catch (error) {
      console.error('Failed to process refund:', error)
      throw new Error('Refund processing failed')
    }
  }

  // Create customer
  async createCustomer(email: string, metadata?: Record<string, string>): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata
      })

      return customer.id
    } catch (error) {
      console.error('Failed to create customer:', error)
      throw new Error('Customer creation failed')
    }
  }

  // Attach payment method to customer
  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })
    } catch (error) {
      console.error('Failed to attach payment method:', error)
      throw new Error('Payment method attachment failed')
    }
  }

  // List customer payment methods
  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card' as const,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : undefined,
        isDefault: false // Would need to check customer default
      }))
    } catch (error) {
      console.error('Failed to list payment methods:', error)
      throw new Error('Payment method retrieval failed')
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    } catch (error) {
      console.error('Failed to set default payment method:', error)
      throw new Error('Default payment method update failed')
    }
  }

  // Handle webhook events
  async handleWebhook(body: string, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
          break
        case 'charge.refunded':
          await this.handleRefundComplete(event.data.object as Stripe.Charge)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Webhook processing failed:', error)
      throw new Error('Invalid webhook signature')
    }
  }

  // Handle successful payment
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId
    
    // Update order status in database
    // await db.order.update({
    //   where: { id: orderId },
    //   data: { 
    //     status: 'paid',
    //     paymentIntentId: paymentIntent.id,
    //     paidAt: new Date()
    //   }
    // })

    // Send confirmation email
    // await emailService.sendOrderConfirmation(orderId)

    // Trigger fulfillment
    // await fulfillmentService.initiateOrder(orderId)

    console.log(`Payment successful for order ${orderId}`)
  }

  // Handle failed payment
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId
    
    // Update order status
    // await db.order.update({
    //   where: { id: orderId },
    //   data: { 
    //     status: 'payment_failed',
    //     paymentError: paymentIntent.last_payment_error?.message
    //   }
    // })

    // Notify customer
    // await emailService.sendPaymentFailure(orderId)

    console.log(`Payment failed for order ${orderId}`)
  }

  // Handle refund completion
  private async handleRefundComplete(charge: Stripe.Charge): Promise<void> {
    const orderId = charge.metadata.orderId
    
    // Update order status
    // await db.order.update({
    //   where: { id: orderId },
    //   data: { 
    //     status: 'refunded',
    //     refundedAt: new Date(),
    //     refundAmount: charge.amount_refunded
    //   }
    // })

    // Notify customer
    // await emailService.sendRefundConfirmation(orderId)

    console.log(`Refund processed for order ${orderId}`)
  }
}

// Singleton instance
export const stripeService = new StripePaymentService()

// Helper functions
export async function createPaymentIntent(amount: number, orderId: string, customerId?: string): Promise<PaymentIntent> {
  return stripeService.createPaymentIntent({
    amount: Math.round(amount * 100), // Convert to cents
    orderId,
    customerId
  })
}

export async function confirmCardPayment(clientSecret: string, paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const paymentIntentId = clientSecret.split('_secret_')[0]
    await stripeService.confirmPayment({
      paymentIntentId,
      paymentMethodId
    })
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment failed' 
    }
  }
}

export default stripeService