// Terminal 3 Phase 2: Express Checkout Component
// One-click checkout for returning customers with saved methods

'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, MapPin, Truck, Lock, Zap, Clock, Shield, Check, ArrowRight } from 'lucide-react'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useOrderTracking } from '@/hooks/useOrderTracking'

export interface ExpressCheckoutProps {
  cartItems: any[]
  total: number
  customerId: string
  onOrderComplete: (orderId: string) => void
  onFallbackToStandard: () => void
  className?: string
}

export interface SavedAddress {
  id: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
  nickname?: string
  lastUsed: string
  deliveryEstimate?: string
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({
  cartItems,
  total,
  customerId,
  onOrderComplete,
  onFallbackToStandard,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('')
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [showPaymentSelector, setShowPaymentSelector] = useState(false)

  const { 
    paymentMethods, 
    defaultPaymentMethod, 
    createPaymentIntent, 
    processPayment,
    isLoading: paymentLoading 
  } = usePaymentMethods(customerId)

  const { modifyOrder } = useOrderTracking(customerId)

  // Load saved addresses on mount
  useEffect(() => {
    loadSavedAddresses()
  }, [customerId])

  // Set default selections
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddress) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0]
      setSelectedAddress(defaultAddress)
    }
  }, [savedAddresses, selectedAddress])

  useEffect(() => {
    if (defaultPaymentMethod && !selectedPaymentMethod) {
      setSelectedPaymentMethod(defaultPaymentMethod.id)
    }
  }, [defaultPaymentMethod, selectedPaymentMethod])

  // Calculate estimated delivery
  useEffect(() => {
    if (selectedAddress) {
      calculateDeliveryEstimate(selectedAddress)
    }
  }, [selectedAddress])

  const loadSavedAddresses = () => {
    // Load from localStorage for demo
    const saved = localStorage.getItem(`customer_${customerId}_addresses`)
    if (saved) {
      setSavedAddresses(JSON.parse(saved))
    } else {
      // Create demo addresses
      const demoAddresses: SavedAddress[] = [
        {
          id: 'addr_home',
          type: 'shipping',
          firstName: 'John',
          lastName: 'Contractor',
          line1: '123 Main Street',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          phone: '(555) 123-4567',
          isDefault: true,
          nickname: 'Home',
          lastUsed: new Date().toISOString(),
          deliveryEstimate: '2-3 business days'
        },
        {
          id: 'addr_work',
          type: 'shipping',
          firstName: 'John',
          lastName: 'Contractor',
          company: 'ABC Construction',
          line1: '456 Business Blvd',
          line2: 'Suite 200',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90028',
          country: 'US',
          phone: '(555) 987-6543',
          isDefault: false,
          nickname: 'Work Site',
          lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryEstimate: '1-2 business days'
        }
      ]
      setSavedAddresses(demoAddresses)
      localStorage.setItem(`customer_${customerId}_addresses`, JSON.stringify(demoAddresses))
    }
  }

  const calculateDeliveryEstimate = (address: SavedAddress) => {
    // Calculate delivery based on address and current time
    const deliveryDate = new Date()
    const currentHour = deliveryDate.getHours()
    
    // If ordered before 2 PM, next day delivery possible
    let daysToAdd = currentHour < 14 ? 1 : 2
    
    // Add extra day for certain states
    if (!['CA', 'NV', 'AZ'].includes(address.state)) {
      daysToAdd += 1
    }
    
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd)
    
    // Skip weekends
    while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
      deliveryDate.setDate(deliveryDate.getDate() + 1)
    }
    
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    }))
  }

  const handleExpressCheckout = async () => {
    if (!selectedAddress || !selectedPaymentMethod) {
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent(total * 100, {
        customerId,
        expressCheckout: true,
        cartItems: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      })

      // Process payment
      const paymentResult = await processPayment(paymentIntent.id, selectedPaymentMethod)

      if (paymentResult.success) {
        // Create order data
        const orderData = {
          customerId,
          items: cartItems.map(item => ({
            id: `item_${Date.now()}_${item.id}`,
            productId: item.id,
            name: item.name,
            description: `FlexVolt ${item.id} Battery`,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            weight: 2.0,
            dimensions: { length: 6.2, width: 3.4, height: 4.1 },
            batterySpecs: {
              voltage: '20V/60V MAX',
              capacity: item.id,
              runtime: getProductRuntime(item.id),
              compatibility: ['DeWalt 20V MAX', 'DeWalt FLEXVOLT 60V MAX']
            }
          })),
          subtotal: total * 100,
          total: total * 100,
          currency: 'usd',
          shippingAddress: selectedAddress,
          billingAddress: selectedAddress,
          paymentMethod: {
            type: 'card',
            id: selectedPaymentMethod
          },
          metadata: {
            expressCheckout: true,
            paymentIntentId: paymentIntent.id,
            estimatedDelivery
          }
        }

        // Save order
        const orderId = `ORD-${Date.now()}`
        const order = {
          id: orderId,
          ...orderData,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          trackingNumber: `1Z${Date.now()}`
        }

        // Save to localStorage
        const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        existingOrders.unshift(order)
        localStorage.setItem('orders', JSON.stringify(existingOrders))
        localStorage.setItem(`order_${orderId}`, JSON.stringify(order))

        // Clear cart
        localStorage.removeItem('cart')

        onOrderComplete(orderId)
      } else {
        // Fall back to standard checkout on payment failure
        onFallbackToStandard()
      }
    } catch (error) {
      console.error('Express checkout failed:', error)
      onFallbackToStandard()
    } finally {
      setIsProcessing(false)
    }
  }

  const getProductRuntime = (productId: string): string => {
    const runtimes: Record<string, string> = {
      '6Ah': 'Up to 4 hours',
      '9Ah': 'Up to 6.5 hours',
      '15Ah': 'Up to 10 hours'
    }
    return runtimes[productId] || 'Variable runtime'
  }

  // Check if express checkout is available
  const isExpressAvailable = savedAddresses.length > 0 && paymentMethods.length > 0

  if (!isExpressAvailable) {
    return null
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Express Checkout</h3>
              <p className="text-sm text-gray-600">Complete your order in seconds</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <Clock size={14} />
            Save 2-3 minutes
          </div>
        </div>

        {/* Express Options */}
        <div className="space-y-4">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-600" />
                <span className="font-medium text-gray-900">Delivery Address</span>
              </div>
              <button
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Change
              </button>
            </div>
            
            {selectedAddress && (
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">
                  {selectedAddress.firstName} {selectedAddress.lastName}
                  {selectedAddress.company && ` • ${selectedAddress.company}`}
                </div>
                <div>{selectedAddress.line1}</div>
                {selectedAddress.line2 && <div>{selectedAddress.line2}</div>}
                <div>
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                </div>
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <Truck size={14} />
                  <span>Estimated delivery: {estimatedDelivery}</span>
                </div>
              </div>
            )}

            {/* Address Selector */}
            {showAddressSelector && (
              <div className="mt-4 border-t pt-4">
                <div className="space-y-2">
                  {savedAddresses.map(address => (
                    <button
                      key={address.id}
                      onClick={() => {
                        setSelectedAddress(address)
                        setShowAddressSelector(false)
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAddress?.id === address.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="font-medium">
                            {address.nickname || `${address.firstName} ${address.lastName}`}
                          </div>
                          <div className="text-gray-600">
                            {address.line1}, {address.city}, {address.state}
                          </div>
                          <div className="text-green-600 text-xs">
                            {address.deliveryEstimate}
                          </div>
                        </div>
                        {selectedAddress?.id === address.id && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-600" />
                <span className="font-medium text-gray-900">Payment Method</span>
              </div>
              <button
                onClick={() => setShowPaymentSelector(!showPaymentSelector)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Change
              </button>
            </div>
            
            {defaultPaymentMethod && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs font-bold flex items-center justify-center">
                  {defaultPaymentMethod.brand?.toUpperCase() || 'CARD'}
                </div>
                <div className="text-sm">
                  <div className="font-medium">•••• •••• •••• {defaultPaymentMethod.last4}</div>
                  <div className="text-gray-600">
                    Expires {defaultPaymentMethod.expiryMonth}/{defaultPaymentMethod.expiryYear}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-green-600 text-sm">
                  <Shield size={14} />
                  <span>Secured</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {showPaymentSelector && (
              <div className="mt-4 border-t pt-4">
                <div className="space-y-2">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedPaymentMethod(method.id)
                        setShowPaymentSelector(false)
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded text-white text-xs font-bold flex items-center justify-center">
                            {method.brand?.toUpperCase() || 'CARD'}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">
                              {method.nickname || `${method.brand} •••• ${method.last4}`}
                            </div>
                            <div className="text-gray-600">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </div>
                          </div>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Express Checkout Button */}
        <div className="mt-6">
          <button
            onClick={handleExpressCheckout}
            disabled={isProcessing || !selectedAddress || !selectedPaymentMethod}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isProcessing || !selectedAddress || !selectedPaymentMethod
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Order...
              </>
            ) : (
              <>
                <Lock size={20} />
                Complete Order - ${total.toLocaleString()}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Shield size={14} />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck size={14} />
              <span>Free shipping</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>2-minute delivery</span>
            </div>
          </div>

          {/* Fallback to Standard */}
          <div className="text-center mt-4">
            <button
              onClick={onFallbackToStandard}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Use standard checkout instead
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpressCheckout