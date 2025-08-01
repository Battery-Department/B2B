// Terminal 3 Phase 2: Payment Methods Management Hook
// React hook for managing customer payment methods with caching and validation

import { useState, useEffect, useCallback } from 'react'
import { stripeService, PaymentMethod, PaymentIntent } from '@/services/payment/stripe-enhanced'

export interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[]
  defaultPaymentMethod: PaymentMethod | null
  isLoading: boolean
  error: string | null
  addPaymentMethod: (data: Partial<PaymentMethod>) => Promise<PaymentMethod>
  removePaymentMethod: (id: string) => Promise<void>
  setDefaultPaymentMethod: (id: string) => Promise<void>
  createPaymentIntent: (amount: number, metadata?: any) => Promise<PaymentIntent>
  processPayment: (paymentIntentId: string, paymentMethodId: string) => Promise<{ success: boolean; error?: string }>
  refreshPaymentMethods: () => Promise<void>
}

export interface PaymentMethodFormData {
  type: 'card' | 'apple_pay' | 'google_pay' | 'ach'
  cardNumber?: string
  expiryMonth?: number
  expiryYear?: number
  cvv?: string
  nickname?: string
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

export function usePaymentMethods(customerId?: string): UsePaymentMethodsReturn {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get default payment method
  const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault) || null

  // Load payment methods for customer
  const loadPaymentMethods = useCallback(async () => {
    if (!customerId) return

    setIsLoading(true)
    setError(null)

    try {
      const customer = await stripeService.getCustomer(customerId)
      if (customer) {
        setPaymentMethods(customer.paymentMethods || [])
      } else {
        // Load from localStorage for demo
        const savedMethods = localStorage.getItem(`customer_${customerId}_payment_methods`)
        if (savedMethods) {
          setPaymentMethods(JSON.parse(savedMethods))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods')
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  // Load on mount and when customerId changes
  useEffect(() => {
    loadPaymentMethods()
  }, [loadPaymentMethods])

  // Add new payment method
  const addPaymentMethod = useCallback(async (data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    if (!customerId) throw new Error('Customer ID required')

    setIsLoading(true)
    setError(null)

    try {
      const newPaymentMethod = await stripeService.savePaymentMethod(customerId, data)
      
      // Update local state
      setPaymentMethods(prev => {
        // If this is the first payment method or set as default, make it default
        const updatedMethods = newPaymentMethod.isDefault || prev.length === 0
          ? prev.map(pm => ({ ...pm, isDefault: false }))
          : prev

        return [...updatedMethods, { ...newPaymentMethod, isDefault: newPaymentMethod.isDefault || prev.length === 0 }]
      })

      return newPaymentMethod
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment method'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  // Remove payment method
  const removePaymentMethod = useCallback(async (paymentMethodId: string): Promise<void> => {
    if (!customerId) throw new Error('Customer ID required')

    setIsLoading(true)
    setError(null)

    try {
      // Remove from localStorage for demo
      const updatedMethods = paymentMethods.filter(pm => pm.id !== paymentMethodId)
      
      // If we removed the default method, set another as default
      if (paymentMethods.find(pm => pm.id === paymentMethodId)?.isDefault && updatedMethods.length > 0) {
        updatedMethods[0].isDefault = true
      }

      setPaymentMethods(updatedMethods)
      localStorage.setItem(`customer_${customerId}_payment_methods`, JSON.stringify(updatedMethods))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove payment method'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [customerId, paymentMethods])

  // Set default payment method
  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string): Promise<void> => {
    if (!customerId) throw new Error('Customer ID required')

    setIsLoading(true)
    setError(null)

    try {
      const updatedMethods = paymentMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === paymentMethodId
      }))

      setPaymentMethods(updatedMethods)
      localStorage.setItem(`customer_${customerId}_payment_methods`, JSON.stringify(updatedMethods))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default payment method'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [customerId, paymentMethods])

  // Create payment intent
  const createPaymentIntent = useCallback(async (
    amount: number, 
    metadata: any = {}
  ): Promise<PaymentIntent> => {
    setIsLoading(true)
    setError(null)

    try {
      const paymentIntent = await stripeService.setupPaymentIntent(
        amount,
        'usd',
        metadata,
        customerId
      )
      return paymentIntent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment intent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  // Process payment
  const processPayment = useCallback(async (
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await stripeService.processPayment(paymentIntentId, paymentMethodId)
      
      if (!result.success && result.error) {
        setError(result.error)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh payment methods
  const refreshPaymentMethods = useCallback(async (): Promise<void> => {
    await loadPaymentMethods()
  }, [loadPaymentMethods])

  return {
    paymentMethods,
    defaultPaymentMethod,
    isLoading,
    error,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    createPaymentIntent,
    processPayment,
    refreshPaymentMethods
  }
}

// Validation helpers for payment method data
export const validatePaymentMethodData = (data: PaymentMethodFormData): string[] => {
  const errors: string[] = []

  if (data.type === 'card') {
    if (!data.cardNumber || data.cardNumber.length < 13) {
      errors.push('Valid card number is required')
    }

    if (!data.expiryMonth || data.expiryMonth < 1 || data.expiryMonth > 12) {
      errors.push('Valid expiry month is required')
    }

    if (!data.expiryYear || data.expiryYear < new Date().getFullYear()) {
      errors.push('Valid expiry year is required')
    }

    if (!data.cvv || data.cvv.length < 3) {
      errors.push('Valid CVV is required')
    }
  }

  if (data.billingAddress) {
    if (!data.billingAddress.line1) {
      errors.push('Billing address is required')
    }
    if (!data.billingAddress.city) {
      errors.push('Billing city is required')
    }
    if (!data.billingAddress.state) {
      errors.push('Billing state is required')
    }
    if (!data.billingAddress.postalCode) {
      errors.push('Billing postal code is required')
    }
  }

  return errors
}

// Helper to format card number for display
export const formatCardNumber = (cardNumber: string): string => {
  return cardNumber.replace(/\d{4}(?=\d)/g, '$& ')
}

// Helper to get card brand from number
export const getCardBrand = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, '')
  
  if (/^4/.test(number)) return 'visa'
  if (/^5[1-5]/.test(number)) return 'mastercard'
  if (/^3[47]/.test(number)) return 'amex'
  if (/^6(?:011|5)/.test(number)) return 'discover'
  
  return 'unknown'
}

// Helper to mask card number
export const maskCardNumber = (cardNumber: string): string => {
  const last4 = cardNumber.slice(-4)
  return `•••• •••• •••• ${last4}`
}