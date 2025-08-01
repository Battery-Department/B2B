'use client'

import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { ShoppingCart, TrendingUp } from 'lucide-react'

export function CartSummary() {
  const { cart, loading } = useCart()
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-[#E6F4FF] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (!cart?.items.length) {
    return (
      <div className="bg-white rounded-xl border-2 border-[#E6F4FF] p-8 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-[#111827]">Your cart is empty</h3>
        <p className="text-[#6B7280] mb-4">Add some FlexVolt batteries to get started</p>
        <Button 
          className="bg-[#006FEE] hover:bg-[#0050B3] text-white"
          onClick={() => window.location.href = '/customer/products'}
        >
          Browse Products
        </Button>
      </div>
    )
  }
  
  const { totals } = cart
  const nextTier = totals.nextDiscountTier
  
  return (
    <div 
      className="bg-white rounded-xl border-2 border-[#E6F4FF] p-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:border-[#006FEE]"
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <h3 className="text-xl font-bold mb-4 text-[#111827]">Order Summary</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-[#374151]">
          <span>Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        
        {totals.volumeDiscount && (
          <div className="flex justify-between text-[#10B981] font-medium">
            <span>{totals.volumeDiscount.label}</span>
            <span>-${totals.discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-[#374151]">
          <span>Tax</span>
          <span>${totals.tax.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-[#374151]">
          <span>Shipping</span>
          <span>{totals.shipping === 0 ? (
            <span className="text-[#10B981] font-medium">FREE</span>
          ) : (
            `$${totals.shipping.toFixed(2)}`
          )}</span>
        </div>
        
        <div className="border-t-2 border-[#E5E7EB] pt-3 flex justify-between font-bold text-lg">
          <span className="text-[#111827]">Total</span>
          <span className="text-[#006FEE]">${totals.total.toFixed(2)}</span>
        </div>
      </div>
      
      {nextTier && (
        <div 
          className="bg-[#E6F4FF] rounded-lg p-4 mb-6"
          style={{
            border: '1px solid rgba(0, 111, 238, 0.2)'
          }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-[#006FEE] mt-0.5" />
            <div>
              <p className="font-medium text-sm text-[#0050B3]">
                Add ${nextTier.amountNeeded.toFixed(2)} more to get {nextTier.tier.label}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                You'll save an additional ${nextTier.additionalSavings.toFixed(2)}!
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Button 
        size="lg" 
        className="w-full bg-[#006FEE] hover:bg-[#0050B3] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        onClick={() => window.location.href = '/customer/checkout'}
        disabled={loading}
        style={{
          boxShadow: '0 2px 8px rgba(0, 111, 238, 0.25)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 111, 238, 0.35)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 111, 238, 0.25)'
        }}
      >
        Proceed to Checkout
      </Button>
      
      {totals.savings > 0 && (
        <p className="text-center text-sm text-[#10B981] mt-3 font-medium">
          You're saving ${totals.savings.toFixed(2)} on this order!
        </p>
      )}
    </div>
  )
}