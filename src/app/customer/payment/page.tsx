'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCard, 
  Lock, 
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Building2,
  DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: ''
  })

  useEffect(() => {
    const details = sessionStorage.getItem('b2bOrderDetails')
    if (details) {
      setOrderDetails(JSON.parse(details))
    } else {
      router.push('/customer/checkout')
    }
  }, [router])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Store payment confirmation
      const paymentConfirmation = {
        ...orderDetails,
        paymentStatus: 'deposit_paid',
        paymentMethod: 'card',
        paymentDate: new Date().toISOString(),
        confirmationNumber: `BD-${Date.now()}`
      }
      
      sessionStorage.setItem('paymentConfirmation', JSON.stringify(paymentConfirmation))
      
      toast.success('10% deposit payment successful!')
      router.push('/customer/checkout/success')
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const depositAmount = orderDetails.depositAmount || 125.00

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to checkout
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Secure 10% Deposit Payment</h1>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm">SSL Encrypted • PCI Compliant</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Company:</span>
                <span className="font-medium">{orderDetails.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact:</span>
                <span className="font-medium">{orderDetails.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="font-medium">${orderDetails.total?.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-blue-600 font-bold">
                  <span>10% Deposit Due Now:</span>
                  <span>${depositAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full p-3 border rounded-lg"
                value={cardDetails.cardholderName}
                onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-3 border rounded-lg pl-10"
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                  maxLength={19}
                  required
                />
                <CreditCard className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full p-3 border rounded-lg"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full p-3 border rounded-lg"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Security Messages */}
            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Payment Security
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Your card will be charged ${depositAmount.toFixed(2)} today</li>
                <li>• Remaining balance due NET 30 after approval</li>
                <li>• All transactions are SSL encrypted</li>
                <li>• PCI DSS Level 1 compliant processing</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pay ${depositAmount.toFixed(2)} Deposit
                </span>
              )}
            </button>
          </form>

          {/* Additional Information */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>By completing this payment, you agree to our terms of service.</p>
            <p>Questions? Call 1-800-BATTERY or email orders@batterydepartment.com</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex justify-center gap-6">
          <div className="text-center">
            <Shield className="w-8 h-8 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">SSL Secure</p>
          </div>
          <div className="text-center">
            <Building2 className="w-8 h-8 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">B2B Trusted</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">PCI Compliant</p>
          </div>
        </div>
      </div>
    </div>
  )
}