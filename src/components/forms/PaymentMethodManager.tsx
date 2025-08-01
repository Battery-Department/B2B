'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Plus, Check, Trash2, Shield, Star, ChevronRight, Lock } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../../hooks/useToast'
import { Modal } from '../ui/Modal'
import { StripePaymentForm, MockPaymentForm } from './StripePaymentForm'
import type { PaymentMethod } from './PaymentMethodSelector'

interface PaymentMethodManagerProps {
  savedMethods?: PaymentMethod[]
  selectedMethodId?: string
  onMethodSelect: (method: PaymentMethod) => void
  onMethodAdd?: (method: PaymentMethod) => void
  onMethodDelete?: (methodId: string) => void
  onSetDefault?: (methodId: string) => void
  stripePublishableKey?: string
  showSecurityBadges?: boolean
  allowManagement?: boolean
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  savedMethods = [],
  selectedMethodId,
  onMethodSelect,
  onMethodAdd,
  onMethodDelete,
  onSetDefault,
  stripePublishableKey,
  showSecurityBadges = true,
  allowManagement = true,
}) => {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const [methods, setMethods] = useState<PaymentMethod[]>(savedMethods)
  const [selectedId, setSelectedId] = useState(selectedMethodId || methods[0]?.id)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setMethods(savedMethods)
  }, [savedMethods])

  const getCardBrandStyles = (brand: string) => {
    const brandStyles = {
      visa: {
        color: '#1A1F71',
        bg: 'bg-blue-50',
        icon: '💳',
      },
      mastercard: {
        color: '#EB001B',
        bg: 'bg-red-50',
        icon: '🔴',
      },
      amex: {
        color: '#006FCF',
        bg: 'bg-blue-50',
        icon: '💙',
      },
      discover: {
        color: '#FF6000',
        bg: 'bg-orange-50',
        icon: '🟠',
      },
      other: {
        color: theme.colors.textSecondary,
        bg: 'bg-gray-50',
        icon: '💳',
      },
    }

    return brandStyles[brand as keyof typeof brandStyles] || brandStyles.other
  }

  const isExpiringSoon = (month: number, year: number) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (year < currentYear) return true
    if (year === currentYear && month <= currentMonth + 3) return true
    return false
  }

  const handleSelect = (method: PaymentMethod) => {
    setSelectedId(method.id)
    onMethodSelect(method)
    showToast({
      variant: 'success',
      title: 'Payment method selected',
      description: `${method.brand.toUpperCase()} ending in ${method.last4}`,
    })
  }

  const handleDelete = async (methodId: string) => {
    const method = methods.find(m => m.id === methodId)
    if (!method) return

    if (method.isDefault && methods.length > 1) {
      showToast({
        variant: 'error',
        title: 'Cannot delete default method',
        description: 'Please set another payment method as default first.',
      })
      return
    }

    setIsDeletingId(methodId)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMethods(prev => prev.filter(m => m.id !== methodId))
      onMethodDelete?.(methodId)
      
      showToast({
        variant: 'success',
        title: 'Payment method removed',
        description: `${method.brand.toUpperCase()} ending in ${method.last4} has been deleted.`,
      })

      // Select another method if the deleted one was selected
      if (selectedId === methodId && methods.length > 1) {
        const nextMethod = methods.find(m => m.id !== methodId)
        if (nextMethod) handleSelect(nextMethod)
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to delete',
        description: 'Unable to remove payment method. Please try again.',
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    const method = methods.find(m => m.id === methodId)
    if (!method || method.isDefault) return

    try {
      // Update all methods
      setMethods(prev => prev.map(m => ({
        ...m,
        isDefault: m.id === methodId,
      })))

      onSetDefault?.(methodId)
      
      showToast({
        variant: 'success',
        title: 'Default payment method updated',
        description: `${method.brand.toUpperCase()} ending in ${method.last4} is now your default.`,
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to update',
        description: 'Unable to set default payment method.',
      })
    }
  }

  const handlePaymentMethodCreated = (paymentMethodId: string) => {
    // Create a new payment method object
    const newMethod: PaymentMethod = {
      id: paymentMethodId,
      type: 'card',
      brand: 'visa', // This would come from Stripe
      last4: '4242', // This would come from Stripe
      expiryMonth: 12,
      expiryYear: 2025,
      holderName: 'New Card',
      isDefault: methods.length === 0,
      stripePaymentMethodId: paymentMethodId,
    }

    setMethods(prev => [...prev, newMethod])
    onMethodAdd?.(newMethod)
    setIsAddingNew(false)
    handleSelect(newMethod)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
            Payment Methods
          </h3>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Manage your saved payment methods
          </p>
        </div>

        {allowManagement && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New
          </Button>
        )}
      </div>

      {/* Payment Methods Grid */}
      <div className="grid gap-3">
        {methods.map(method => {
          const brandStyles = getCardBrandStyles(method.brand)
          const isSelected = selectedId === method.id
          const isExpiring = isExpiringSoon(method.expiryMonth, method.expiryYear)
          const isDeleting = isDeletingId === method.id

          return (
            <Card
              key={method.id}
              variant={isSelected ? 'primary' : 'default'}
              className={`
                cursor-pointer transition-all
                ${isSelected ? 'ring-2 ring-offset-2' : ''}
                ${isDeleting ? 'opacity-50' : ''}
              `}
              style={{
                borderColor: isSelected ? theme.colors.primary : undefined,
                '--tw-ring-color': theme.colors.primary,
              }}
              onClick={() => !isDeleting && handleSelect(method)}
            >
              <div className="flex items-center justify-between p-4">
                {/* Left side - Card info */}
                <div className="flex items-center gap-4">
                  {/* Card icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${brandStyles.bg}`}
                    style={{ backgroundColor: `${brandStyles.color}15` }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: brandStyles.color }} />
                  </div>

                  {/* Card details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        {method.brand.toUpperCase()} •••• {method.last4}
                      </span>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Default
                        </span>
                      )}
                      {isExpiring && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Expiring Soon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {method.holderName}
                      </span>
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {allowManagement && (
                    <div className="flex items-center gap-1">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefault(method.id)
                          }}
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(method.id)
                        }}
                        disabled={isDeleting}
                        title="Delete payment method"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security badges */}
              {showSecurityBadges && isSelected && (
                <div
                  className="px-4 pb-4 flex items-center gap-4 text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>PCI Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                  {method.brand === 'amex' && (
                    <div className="flex items-center gap-1">
                      <span>SafeKey Protected</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}

        {/* Empty state */}
        {methods.length === 0 && (
          <Card className="p-8 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.textMuted }} />
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              No payment methods saved
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setIsAddingNew(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Payment Method
            </Button>
          </Card>
        )}
      </div>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        title="Add Payment Method"
        size="md"
      >
        {stripePublishableKey ? (
          <StripePaymentForm
            stripePublishableKey={stripePublishableKey}
            onSuccess={handlePaymentMethodCreated}
            onCancel={() => setIsAddingNew(false)}
          />
        ) : (
          <MockPaymentForm
            onSuccess={handlePaymentMethodCreated}
            onCancel={() => setIsAddingNew(false)}
          />
        )}
      </Modal>
    </div>
  )
}