'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Plus, Check, Edit, Trash2, Shield, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAnimation, useStaggeredChildren } from '@/hooks/useAnimation'
import { useToast } from '@/hooks/useToast'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'digital'
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other'
  last4: string
  expiryMonth: number
  expiryYear: number
  holderName: string
  isDefault: boolean
  nickname?: string
  stripePaymentMethodId?: string
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

export interface PaymentMethodSelectorProps {
  selectedMethodId?: string
  onSelectMethod: (method: PaymentMethod) => void
  onAddNewMethod: () => void
  onEditMethod?: (method: PaymentMethod) => void
  onDeleteMethod?: (methodId: string) => void
  allowAddNew?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  showBillingAddress?: boolean
  className?: string
  stripePublishableKey?: string
  onStripePaymentMethodCreated?: (paymentMethodId: string) => void
}

// Mock saved payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2027,
    holderName: 'John Doe',
    isDefault: true,
    nickname: 'Business Card',
    billingAddress: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    }
  },
  {
    id: 'pm_2',
    type: 'card',
    brand: 'mastercard',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2026,
    holderName: 'John Doe',
    isDefault: false,
    nickname: 'Personal Card'
  },
  {
    id: 'pm_3',
    type: 'card',
    brand: 'amex',
    last4: '0005',
    expiryMonth: 3,
    expiryYear: 2025,
    holderName: 'John Doe',
    isDefault: false
  }
]

const getCardBrandIcon = (brand: string) => {
  const iconMap = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    other: '💳'
  }
  return iconMap[brand as keyof typeof iconMap] || '💳'
}

const getCardBrandColor = (brand: string) => {
  const colorMap = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    discover: '#FF6000',
    other: '#6B7280'
  }
  return colorMap[brand as keyof typeof colorMap] || '#6B7280'
}

const isCardExpiringSoon = (month: number, year: number) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  if (year < currentYear) return true
  if (year === currentYear && month <= currentMonth + 2) return true
  return false
}

// Stripe configuration
let stripePromise: Promise<Stripe | null> | null = null

const getStripe = (publishableKey?: string) => {
  if (!publishableKey) return null
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethodId,
  onSelectMethod,
  onAddNewMethod,
  onEditMethod,
  onDeleteMethod,
  allowAddNew = true,
  allowEdit = true,
  allowDelete = true,
  showBillingAddress = false,
  className = '',
  stripePublishableKey,
  onStripePaymentMethodCreated,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)
  const [selectedId, setSelectedId] = useState(selectedMethodId)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showStripeForm, setShowStripeForm] = useState(false)
  const [stripe, setStripe] = useState<Stripe | null>(null)
  
  const { showToast } = useToast()
  const { style: containerStyle } = useAnimation('fadeIn', { delay: 100 })
  const { getChildStyle } = useStaggeredChildren(paymentMethods.length + 1, 100)

  useEffect(() => {
    if (!selectedId && paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0]
      setSelectedId(defaultMethod.id)
      onSelectMethod(defaultMethod)
    }
  }, [paymentMethods, selectedId, onSelectMethod])

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedId(method.id)
    onSelectMethod(method)
    
    showToast({
      variant: 'success',
      title: 'Payment Method Selected',
      description: `${method.brand.toUpperCase()} ending in ${method.last4}`
    })
  }

  const handleDeleteMethod = (methodId: string) => {
    const method = paymentMethods.find(pm => pm.id === methodId)
    if (!method) return

    if (method.isDefault && paymentMethods.length > 1) {
      showToast({
        variant: 'warning',
        title: 'Cannot Delete Default Method',
        description: 'Please set another payment method as default first.'
      })
      return
    }

    setPaymentMethods(prev => prev.filter(pm => pm.id !== methodId))
    onDeleteMethod?.(methodId)
    
    showToast({
      variant: 'success',
      title: 'Payment Method Deleted',
      description: `${method.brand.toUpperCase()} ending in ${method.last4} has been removed.`
    })

    // Select new default if deleted method was selected
    if (selectedId === methodId) {
      const remaining = paymentMethods.filter(pm => pm.id !== methodId)
      if (remaining.length > 0) {
        handleSelectMethod(remaining[0])
      }
    }
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    onAddNewMethod()
  }

  return (
    <div className={`space-y-4 ${className}`} style={containerStyle}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#0A051E]">
            Payment Methods
          </h3>
          <p className="text-sm text-[#64748B]">
            Select a payment method for your order
          </p>
        </div>
        
        {allowAddNew && (
          <Button
            variant="outline"
            onClick={handleAddNew}
            className="flex items-center gap-2"
            disabled={isAddingNew}
          >
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        )}
      </div>

      {/* Payment methods grid */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {paymentMethods.map((method, index) => {
          const isSelected = selectedId === method.id
          const isExpiring = isCardExpiringSoon(method.expiryMonth, method.expiryYear)
          
          return (
            <Card
              key={method.id}
              className={`relative cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'border-[#006FEE] bg-[#E6F4FF] shadow-lg' 
                  : 'hover:border-[#93C5FD] hover:shadow-md'
              }`}
              style={getChildStyle(index)}
              onClick={() => handleSelectMethod(method)}
              hoverable={!isSelected}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#006FEE] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Default badge */}
              {method.isDefault && (
                <div className="absolute top-3 left-3 bg-[#10B981] text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Default
                </div>
              )}

              <div className="p-4 pt-8">
                {/* Card brand and type */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: getCardBrandColor(method.brand) }}
                  >
                    {getCardBrandIcon(method.brand)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0A051E] capitalize">
                      {method.brand} {method.type}
                    </div>
                    {method.nickname && (
                      <div className="text-sm text-[#64748B]">
                        {method.nickname}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card details */}
                <div className="space-y-2 mb-4">
                  <div className="text-lg font-mono">
                    •••• •••• •••• {method.last4}
                  </div>
                  <div className="text-sm text-[#64748B]">
                    {method.holderName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#64748B]">
                      Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                    </span>
                    {isExpiring && (
                      <span className="text-xs bg-[#FEF3C7] text-[#92400E] px-2 py-1 rounded-full">
                        Expiring Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Billing address */}
                {showBillingAddress && method.billingAddress && (
                  <div className="text-xs text-[#64748B] mb-4 p-2 bg-[#F8FAFC] rounded-lg">
                    <div className="font-medium mb-1">Billing Address:</div>
                    <div>{method.billingAddress.street}</div>
                    <div>
                      {method.billingAddress.city}, {method.billingAddress.state} {method.billingAddress.zipCode}
                    </div>
                  </div>
                )}

                {/* Security indicator */}
                <div className="flex items-center gap-2 text-xs text-[#10B981] mb-4">
                  <Shield className="w-3 h-3" />
                  Securely stored
                </div>

                {/* Actions */}
                {(allowEdit || allowDelete) && (
                  <div className="flex gap-2 pt-2 border-t border-[#F1F5F9]">
                    {allowEdit && onEditMethod && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditMethod(method)
                        }}
                        className="flex-1 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    {allowDelete && onDeleteMethod && !method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMethod(method.id)
                        }}
                        className="flex-1 text-xs text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        })}

        {/* Add new card placeholder */}
        {allowAddNew && (
          <Card
            className="border-2 border-dashed border-[#E5E7EB] hover:border-[#006FEE] cursor-pointer transition-all duration-300 flex items-center justify-center min-h-[200px]"
            style={getChildStyle(paymentMethods.length)}
            onClick={handleAddNew}
          >
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-[#E6F4FF] rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-[#006FEE]" />
              </div>
              <h4 className="font-semibold text-[#0A051E] mb-1">
                Add New Payment Method
              </h4>
              <p className="text-sm text-[#64748B]">
                Credit card, debit card, or bank account
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Security notice */}
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-[#059669] mb-1">
            Your payment information is secure
          </h4>
          <p className="text-sm text-[#059669]">
            All payment data is encrypted and stored securely. We never store your full card number 
            or security code on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}