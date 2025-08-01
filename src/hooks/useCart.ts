'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartWithTotals } from '@/services/cart-service'

export function useCart() {
  const [cart, setCart] = useState<CartWithTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart')
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }
      
      const data = await response.json()
      setCart(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching cart:', err)
      setError('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Add item to cart
  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add item')
      }
      
      const updatedCart = await response.json()
      setCart(updatedCart)
      setError(null)
      return updatedCart
    } catch (err: any) {
      console.error('Error adding to cart:', err)
      setError(err.message || 'Failed to add item to cart')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update quantity')
      }
      
      const updatedCart = await response.json()
      setCart(updatedCart)
      setError(null)
      return updatedCart
    } catch (err: any) {
      console.error('Error updating quantity:', err)
      setError(err.message || 'Failed to update quantity')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove item')
      }
      
      const updatedCart = await response.json()
      setCart(updatedCart)
      setError(null)
      return updatedCart
    } catch (err) {
      console.error('Error removing item:', err)
      setError('Failed to remove item from cart')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear cart')
      }
      
      const updatedCart = await response.json()
      setCart(updatedCart)
      setError(null)
      return updatedCart
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError('Failed to clear cart')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get cart item count
  const getItemCount = useCallback(() => {
    if (!cart) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Get cart value
  const getCartValue = useCallback(() => {
    if (!cart) return 0
    return cart.totals.total
  }, [cart])

  // Check if product is in cart
  const isInCart = useCallback((productId: string) => {
    if (!cart) return false
    return cart.items.some(item => item.productId === productId)
  }, [cart])

  // Get quantity of product in cart
  const getProductQuantity = useCallback((productId: string) => {
    if (!cart) return 0
    const item = cart.items.find(item => item.productId === productId)
    return item?.quantity || 0
  }, [cart])

  // Load cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    getItemCount,
    getCartValue,
    isInCart,
    getProductQuantity
  }
}