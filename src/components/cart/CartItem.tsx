'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface CartItemProps {
  item: {
    id: string
    productId: string
    quantity: number
    price: any
    product: {
      id: string
      name: string
      sku: string
      imageUrl?: string | null
      stock: number
    }
  }
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart, loading } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const price = typeof item.price === 'number' ? item.price : Number(item.price)
  const itemTotal = price * item.quantity
  const isOutOfStock = item.quantity > item.product.stock

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return
    
    try {
      setIsUpdating(true)
      setError(null)
      
      if (newQuantity === 0) {
        await removeFromCart(item.id)
      } else {
        await updateQuantity(item.id, newQuantity)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async () => {
    try {
      setIsUpdating(true)
      setError(null)
      await removeFromCart(item.id)
    } catch (err: any) {
      setError(err.message || 'Failed to remove item')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div 
      className="bg-white rounded-xl border-2 border-[#E6F4FF] p-4 transition-all duration-300"
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 111, 238, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          {item.product.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              width={80}
              height={80}
              className="rounded-lg border border-[#E5E7EB]"
            />
          ) : (
            <div className="w-20 h-20 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] flex items-center justify-center">
              <span className="text-[#9CA3AF] text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <h3 className="font-semibold text-[#111827] mb-1">{item.product.name}</h3>
          <p className="text-sm text-[#6B7280] mb-2">SKU: {item.product.sku}</p>
          
          {/* Stock Warning */}
          {isOutOfStock && (
            <div className="flex items-center gap-2 text-[#EF4444] text-sm mb-2">
              <AlertCircle className="h-4 w-4" />
              <span>Only {item.product.stock} in stock</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-[#EF4444] text-sm mb-2">{error}</div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center border border-[#E5E7EB] rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-[#F3F4F6]"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || loading}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <Input
                type="number"
                min="0"
                max={item.product.stock}
                value={item.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  if (value <= item.product.stock) {
                    handleQuantityChange(value)
                  }
                }}
                className="w-16 h-8 text-center border-0 text-sm"
                disabled={isUpdating || loading}
              />
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-[#F3F4F6]"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || loading || item.quantity >= item.product.stock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <span className="text-sm text-[#6B7280]">
              {item.product.stock} available
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-[#6B7280]">${price.toFixed(2)} each</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-[#111827]">${itemTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] h-8 w-8 p-0"
          onClick={handleRemove}
          disabled={isUpdating || loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading Overlay */}
      {(isUpdating || loading) && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#006FEE] border-t-transparent"></div>
            <span className="text-sm">Updating...</span>
          </div>
        </div>
      )}
    </div>
  )
}