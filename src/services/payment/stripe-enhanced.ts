// Terminal 3 Phase 2: Enhanced Stripe Payment Service
// Advanced payment processing with multiple providers and saved methods

export interface PaymentMethod {
  id: string
  type: 'card' | 'apple_pay' | 'google_pay' | 'ach' | 'wire'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  nickname?: string
  createdAt: string
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'
  clientSecret: string
  metadata: Record<string, any>
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'quarterly' | 'yearly'
  features: string[]
  batteryAllowance: number
  isPopular?: boolean
}

export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  companyName?: string
  taxId?: string
  billingAddress: Address
  isFleetCustomer: boolean
  paymentMethods: PaymentMethod[]
  subscriptions: Subscription[]
}

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: 'active' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  metadata: Record<string, any>
}

export class EnhancedStripeService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_...'
    this.baseUrl = 'https://api.stripe.com/v1'
  }

  // Multiple payment methods support
  async setupPaymentIntent(
    amount: number, 
    currency: string = 'usd',
    metadata: Record<string, any> = {},
    customerId?: string
  ): Promise<PaymentIntent> {
    try {
      // Apply volume discounts automatically
      const discountedAmount = this.calculateVolumeDiscount(amount, metadata.itemCount || 1)
      
      // Create payment intent with enhanced features
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}`,
        amount: discountedAmount,
        currency,
        status: 'requires_payment_method',
        clientSecret: `pi_${Date.now()}_secret`,
        metadata: {
          ...metadata,
          originalAmount: amount,
          discountApplied: amount - discountedAmount,
          customerId,
          paymentMethods: ['card', 'apple_pay', 'google_pay'],
          requires3DS: this.requires3DSecure(discountedAmount),
        }
      }

      // Save to localStorage for demo (in production, this would go to Stripe)
      this.savePaymentIntent(paymentIntent)
      
      return paymentIntent
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      throw new Error('Payment setup failed')
    }
  }

  // Volume discount calculation
  private calculateVolumeDiscount(amount: number, itemCount: number): number {
    let discountPercentage = 0
    
    if (amount >= 5000) {
      discountPercentage = 0.20 // 20% for $5000+
    } else if (amount >= 2500) {
      discountPercentage = 0.15 // 15% for $2500+
    } else if (amount >= 1000) {
      discountPercentage = 0.10 // 10% for $1000+
    }

    // Additional bulk item discount
    if (itemCount >= 20) {
      discountPercentage += 0.05 // Extra 5% for 20+ items
    }

    return Math.round(amount * (1 - discountPercentage))
  }

  // 3D Secure requirements
  private requires3DSecure(amount: number): boolean {
    // Require 3DS for amounts over $500 or for high-risk transactions
    return amount > 50000 // $500 in cents
  }

  // Subscription billing for fleet customers
  async createSubscription(
    customerId: string, 
    planId: string,
    metadata: Record<string, any> = {}
  ): Promise<Subscription> {
    try {
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        customerId,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        cancelAtPeriodEnd: false,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          autoRenew: true,
          batteryAllowance: this.getSubscriptionAllowance(planId)
        }
      }

      // Save subscription
      this.saveSubscription(subscription)

      return subscription
    } catch (error) {
      console.error('Failed to create subscription:', error)
      throw new Error('Subscription creation failed')
    }
  }

  // Get subscription battery allowance
  private getSubscriptionAllowance(planId: string): number {
    const allowances: Record<string, number> = {
      'basic_monthly': 5,
      'pro_monthly': 15,
      'enterprise_monthly': 50,
      'basic_quarterly': 15,
      'pro_quarterly': 45,
      'enterprise_quarterly': 150
    }
    return allowances[planId] || 0
  }

  // Payment method management
  async savePaymentMethod(
    customerId: string, 
    paymentMethodData: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    try {
      const paymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: paymentMethodData.type || 'card',
        last4: paymentMethodData.last4,
        brand: paymentMethodData.brand,
        expiryMonth: paymentMethodData.expiryMonth,
        expiryYear: paymentMethodData.expiryYear,
        isDefault: paymentMethodData.isDefault || false,
        nickname: paymentMethodData.nickname,
        createdAt: new Date().toISOString()
      }

      // Save payment method
      this.saveCustomerPaymentMethod(customerId, paymentMethod)

      return paymentMethod
    } catch (error) {
      console.error('Failed to save payment method:', error)
      throw new Error('Payment method save failed')
    }
  }

  // Get customer with payment methods
  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customerData = localStorage.getItem(`customer_${customerId}`)
      return customerData ? JSON.parse(customerData) : null
    } catch (error) {
      console.error('Failed to get customer:', error)
      return null
    }
  }

  // Get available subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return [
      {
        id: 'basic_monthly',
        name: 'Basic Plan',
        description: 'Perfect for small contractors',
        price: 2999, // $29.99
        interval: 'monthly',
        features: [
          '5 batteries per month',
          'Standard shipping',
          'Email support',
          'Basic warranty'
        ],
        batteryAllowance: 5
      },
      {
        id: 'pro_monthly',
        name: 'Pro Plan',
        description: 'Ideal for growing businesses',
        price: 7999, // $79.99
        interval: 'monthly',
        features: [
          '15 batteries per month',
          'Priority shipping',
          'Phone & email support',
          'Extended warranty',
          'Bulk discounts'
        ],
        batteryAllowance: 15,
        isPopular: true
      },
      {
        id: 'enterprise_monthly',
        name: 'Enterprise Plan',
        description: 'For large fleets and contractors',
        price: 19999, // $199.99
        interval: 'monthly',
        features: [
          '50+ batteries per month',
          'Express shipping',
          '24/7 priority support',
          'Premium warranty',
          'Custom bulk pricing',
          'Dedicated account manager'
        ],
        batteryAllowance: 50
      }
    ]
  }

  // Process payment with enhanced security
  async processPayment(
    paymentIntentId: string,
    paymentMethodId: string,
    billingDetails?: any
  ): Promise<{ success: boolean; error?: string; requires3DS?: boolean }> {
    try {
      const paymentIntent = this.getPaymentIntent(paymentIntentId)
      if (!paymentIntent) {
        throw new Error('Payment intent not found')
      }

      // Simulate 3D Secure if required
      if (paymentIntent.metadata.requires3DS) {
        return {
          success: false,
          requires3DS: true
        }
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update payment intent status
      paymentIntent.status = 'succeeded'
      this.savePaymentIntent(paymentIntent)

      return { success: true }
    } catch (error) {
      console.error('Payment processing failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }

  // Private helper methods for localStorage operations
  private savePaymentIntent(paymentIntent: PaymentIntent): void {
    localStorage.setItem(`payment_intent_${paymentIntent.id}`, JSON.stringify(paymentIntent))
  }

  private getPaymentIntent(id: string): PaymentIntent | null {
    const data = localStorage.getItem(`payment_intent_${id}`)
    return data ? JSON.parse(data) : null
  }

  private saveSubscription(subscription: Subscription): void {
    localStorage.setItem(`subscription_${subscription.id}`, JSON.stringify(subscription))
    
    // Also save to customer's subscription list
    const existingSubscriptions = JSON.parse(localStorage.getItem('customer_subscriptions') || '[]')
    existingSubscriptions.push(subscription)
    localStorage.setItem('customer_subscriptions', JSON.stringify(existingSubscriptions))
  }

  private saveCustomerPaymentMethod(customerId: string, paymentMethod: PaymentMethod): void {
    const existingMethods = JSON.parse(localStorage.getItem(`customer_${customerId}_payment_methods`) || '[]')
    
    // If this is set as default, make others non-default
    if (paymentMethod.isDefault) {
      existingMethods.forEach((pm: PaymentMethod) => pm.isDefault = false)
    }
    
    existingMethods.push(paymentMethod)
    localStorage.setItem(`customer_${customerId}_payment_methods`, JSON.stringify(existingMethods))
  }

  // Webhook handling for real-time updates
  async handleWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object)
          break
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object)
          break
        default:
          console.log('Unhandled webhook event:', event.type)
      }
    } catch (error) {
      console.error('Webhook handling failed:', error)
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    // Update order status, send confirmation email, etc.
    console.log('Payment succeeded:', paymentIntent.id)
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    // Handle failed payment, retry logic, notifications
    console.log('Payment failed:', paymentIntent.id)
  }

  private async handleSubscriptionPayment(invoice: any): Promise<void> {
    // Process subscription renewal, update allowances
    console.log('Subscription payment succeeded:', invoice.id)
  }

  private async handleSubscriptionCancellation(subscription: any): Promise<void> {
    // Handle subscription cancellation, final billing
    console.log('Subscription cancelled:', subscription.id)
  }
}

// Export singleton instance
export const stripeService = new EnhancedStripeService()