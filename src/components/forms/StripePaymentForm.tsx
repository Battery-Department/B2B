'use client'

import React, { useState } from 'react'
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js'
import { loadStripe, StripeCardElementOptions } from '@stripe/stripe-js'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../../hooks/useToast'
import { CreditCard, Lock, AlertCircle } from 'lucide-react'

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void
  onCancel: () => void
  clientSecret?: string
  saveCard?: boolean
}

const PaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onCancel,
  clientSecret,
  saveCard = true,
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const { theme } = useTheme()
  const { showToast } = useToast()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [billingZip, setBillingZip] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  const cardElementOptions: StripeCardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: theme.colors.textPrimary,
        '::placeholder': {
          color: theme.colors.textMuted,
        },
        iconColor: theme.colors.primary,
      },
      invalid: {
        color: theme.colors.error,
        iconColor: theme.colors.error,
      },
    },
    hidePostalCode: false,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      if (clientSecret) {
        // Process payment with payment intent
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: cardholderName,
                address: {
                  postal_code: billingZip,
                },
              },
            },
          }
        )

        if (confirmError) {
          throw confirmError
        }

        if (paymentIntent?.payment_method) {
          onSuccess(paymentIntent.payment_method.toString())
          showToast({
            variant: 'success',
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
          })
        }
      } else {
        // Just create payment method for saving
        const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: cardholderName,
            address: {
              postal_code: billingZip,
            },
          },
        })

        if (methodError) {
          throw methodError
        }

        if (paymentMethod) {
          onSuccess(paymentMethod.id)
          showToast({
            variant: 'success',
            title: 'Card Added',
            description: 'Your payment method has been saved successfully.',
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred processing your payment')
      showToast({
        variant: 'error',
        title: 'Payment Error',
        description: err.message || 'Failed to process payment',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete)
    if (event.error) {
      setError(event.error.message)
    } else {
      setError(null)
    }
  }

  const isFormValid = cardholderName.trim() && cardComplete && !error

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder Name
        </label>
        <Input
          id="cardholder-name"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          required
          disabled={isProcessing}
          icon={<CreditCard className="w-4 h-4" />}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-lg focus-within:border-blue-500 transition-colors">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isFormValid || isProcessing}
          loading={isProcessing}
          className="flex-1"
        >
          {clientSecret ? 'Pay Now' : 'Save Card'}
        </Button>
      </div>
    </form>
  )
}

interface StripePaymentFormWrapperProps extends StripePaymentFormProps {
  stripePublishableKey: string
}

export const StripePaymentForm: React.FC<StripePaymentFormWrapperProps> = ({
  stripePublishableKey,
  ...props
}) => {
  const stripePromise = loadStripe(stripePublishableKey)

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}

// Export a mock version for when Stripe is not available
export const MockPaymentForm: React.FC<Omit<StripePaymentFormProps, 'stripePublishableKey'>> = ({
  onSuccess,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate API call
    setTimeout(() => {
      onSuccess('mock_payment_method_' + Date.now())
      showToast({
        variant: 'success',
        title: 'Mock Payment Added',
        description: 'This is a simulated payment method for testing.',
      })
      setIsProcessing(false)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Test Mode
        </h3>
        <p className="text-sm text-yellow-700">
          Stripe integration requires API keys. This is a mock payment form for testing.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
          loading={isProcessing}
          className="flex-1"
        >
          Add Mock Card
        </Button>
      </div>
    </form>
  )
}