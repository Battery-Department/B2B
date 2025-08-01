'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package, X } from 'lucide-react'
import Image from 'next/image'

export function MiniCart() {
  const { cart, loading, getItemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const itemCount = getItemCount()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.mini-cart-container')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative mini-cart-container">
      {/* Cart Button */}
      <Button
        variant="ghost"
        className="relative p-2 text-[#6B7280] hover:text-[#006FEE] hover:bg-[#E6F4FF]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#006FEE] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border-2 border-[#E6F4FF] z-50"
          style={{
            boxShadow: '0 12px 32px rgba(0, 111, 238, 0.15)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
            <h3 className="font-semibold text-[#111827]">
              Shopping Cart ({itemCount})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#6B7280] hover:text-[#111827]"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !cart?.items.length ? (
              <div className="p-6 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[#6B7280] mb-4">Your cart is empty</p>
                <Button
                  size="sm"
                  className="bg-[#006FEE] hover:bg-[#0050B3] text-white"
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/customer/products'
                  }}
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="p-4 space-y-3">
                  {cart.items.map((item) => {
                    const price = typeof item.price === 'number' ? item.price : Number(item.price)
                    const itemTotal = price * item.quantity

                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={48}
                              height={48}
                              className="rounded-lg border border-[#E5E7EB]"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] flex items-center justify-center">
                              <span className="text-[#9CA3AF] text-xs">IMG</span>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-[#111827] truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-[#6B7280]">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-medium">${itemTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                <div className="border-t border-[#E5E7EB] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-[#111827]">Subtotal:</span>
                    <span className="font-semibold text-[#006FEE]">
                      ${cart.totals.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {cart.totals.volumeDiscount && (
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <span className="text-[#10B981]">{cart.totals.volumeDiscount.label}:</span>
                      <span className="text-[#10B981] font-medium">
                        -${cart.totals.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      className="w-full bg-[#006FEE] hover:bg-[#0050B3] text-white"
                      onClick={() => {
                        setIsOpen(false)
                        window.location.href = '/customer/checkout'
                      }}
                    >
                      Checkout (${cart.totals.total.toFixed(2)})
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[#006FEE] text-[#006FEE] hover:bg-[#E6F4FF]"
                      onClick={() => {
                        setIsOpen(false)
                        window.location.href = '/customer/cart'
                      }}
                    >
                      View Cart
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}