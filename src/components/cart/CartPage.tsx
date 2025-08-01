'use client'

import { useCart } from '@/hooks/useCart'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react'

export function CartPage() {
  const { cart, loading, clearCart } = useCart()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border-2 border-[#E6F4FF] p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border-2 border-[#E6F4FF] p-6 h-fit animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart()
      } catch (error) {
        console.error('Failed to clear cart:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              className="text-[#6B7280] hover:text-[#006FEE] hover:bg-[#E6F4FF] p-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-[#006FEE]" />
              Shopping Cart
            </h1>
          </div>
          
          {cart?.items.length ? (
            <p className="text-[#6B7280]">
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)} items in your cart
            </p>
          ) : (
            <p className="text-[#6B7280]">Your cart is empty</p>
          )}
        </div>

        {!cart?.items.length ? (
          // Empty Cart State
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-[#111827] mb-4">Your cart is empty</h2>
            <p className="text-[#6B7280] mb-8 max-w-md mx-auto">
              Looks like you haven't added any FlexVolt batteries to your cart yet. 
              Browse our products to find the perfect power solution for your needs.
            </p>
            <div className="space-x-4">
              <Button
                className="bg-[#006FEE] hover:bg-[#0050B3] text-white px-8 py-3"
                onClick={() => window.location.href = '/customer/products'}
              >
                Browse Products
              </Button>
              <Button
                variant="outline"
                className="border-[#006FEE] text-[#006FEE] hover:bg-[#E6F4FF] px-8 py-3"
                onClick={() => window.location.href = '/customer'}
              >
                Go Home
              </Button>
            </div>
          </div>
        ) : (
          // Cart with Items
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#111827]">
                  Items in Cart ({cart.items.length})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#EF4444] border-[#EF4444] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </Button>
              </div>
              
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Continue Shopping */}
              <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                <Button
                  variant="outline"
                  className="border-[#006FEE] text-[#006FEE] hover:bg-[#E6F4FF]"
                  onClick={() => window.location.href = '/customer/products'}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <CartSummary />
                
                {/* Trust Indicators */}
                <div className="mt-6 bg-white rounded-xl border-2 border-[#E6F4FF] p-4">
                  <h4 className="font-semibold text-[#111827] mb-3">Why Choose FlexVolt?</h4>
                  <ul className="space-y-2 text-sm text-[#6B7280]">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                      3-year limited warranty
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                      20V/60V MAX compatibility
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                      Free shipping over $500
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                      Volume discounts available
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}