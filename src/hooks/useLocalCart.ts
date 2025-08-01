'use client'

import { useState, useEffect, useCallback } from 'react'
import { pushToDataLayer } from '@/components/GoogleTagManager'

interface CartState {
  [productId: string]: number
}

const CART_STORAGE_KEY = 'batteryDashboardCart'
const CART_DATA_KEY = 'cartData'

export function useLocalCart() {
  const [cart, setCart] = useState<CartState>({
    '6Ah': 0,
    '9Ah': 0,
    '15Ah': 0
  })
  const [loading, setLoading] = useState(false)

  // Product information
  const products = {
    '6Ah': { name: '6Ah Battery', price: 95, sku: 'FV-6AH-001' },
    '9Ah': { name: '9Ah Battery', price: 125, sku: 'FV-9AH-001' },
    '15Ah': { name: '15Ah Battery', price: 245, sku: 'FV-15AH-001' }
  }

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      } catch (e) {
        console.error('Failed to parse saved cart:', e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    
    // Also save in the format expected by the cart page
    const cartItems = Object.entries(cart)
      .filter(([_, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({
        id,
        type: id,
        name: products[id as keyof typeof products]?.name || `${id} Battery`,
        quantity,
        unitPrice: products[id as keyof typeof products]?.price || 0,
        total: quantity * (products[id as keyof typeof products]?.price || 0)
      }))
    
    const cartData = {
      items: cartItems,
      quantities: cart
    }
    
    localStorage.setItem(CART_DATA_KEY, JSON.stringify(cartData))
  }, [cart])

  // Update quantity for a product
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity)
    const oldQuantity = cart[productId] || 0
    
    setCart(prev => ({
      ...prev,
      [productId]: newQuantity
    }))

    // Track with Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      const product = products[productId as keyof typeof products]
      if (product) {
        if (newQuantity > oldQuantity) {
          window.gtag('event', 'add_to_cart', {
            currency: 'USD',
            value: product.price * (newQuantity - oldQuantity),
            items: [{
              item_id: productId,
              item_name: product.name,
              price: product.price,
              quantity: newQuantity - oldQuantity
            }]
          })
        } else if (newQuantity < oldQuantity) {
          window.gtag('event', 'remove_from_cart', {
            currency: 'USD',
            value: product.price * (oldQuantity - newQuantity),
            items: [{
              item_id: productId,
              item_name: product.name,
              price: product.price,
              quantity: oldQuantity - newQuantity
            }]
          })
        }
      }
    }

    // Push to GTM data layer
    const product = products[productId as keyof typeof products]
    if (product) {
      pushToDataLayer({
        event: newQuantity > oldQuantity ? 'add_to_cart' : 'remove_from_cart',
        ecommerce: {
          currency: 'USD',
          value: product.price * Math.abs(newQuantity - oldQuantity),
          items: [{
            item_id: productId,
            item_name: product.name,
            price: product.price,
            quantity: Math.abs(newQuantity - oldQuantity)
          }]
        }
      })
    }
  }, [cart])

  // Add to cart (increment by 1)
  const addToCart = useCallback((productId: string) => {
    updateQuantity(productId, (cart[productId] || 0) + 1)
  }, [cart, updateQuantity])

  // Remove from cart (decrement by 1)
  const removeFromCart = useCallback((productId: string) => {
    updateQuantity(productId, (cart[productId] || 0) - 1)
  }, [cart, updateQuantity])

  // Clear cart
  const clearCart = useCallback(() => {
    setCart({
      '6Ah': 0,
      '9Ah': 0,
      '15Ah': 0
    })
    localStorage.removeItem(CART_STORAGE_KEY)
    localStorage.removeItem(CART_DATA_KEY)
  }, [])

  // Get product quantity
  const getProductQuantity = useCallback((productId: string) => {
    return cart[productId] || 0
  }, [cart])

  // Get cart total
  const getCartTotal = useCallback(() => {
    return Object.entries(cart).reduce((total, [id, quantity]) => {
      const product = products[id as keyof typeof products]
      return total + (quantity * (product?.price || 0))
    }, 0)
  }, [cart])

  // Get item count
  const getItemCount = useCallback(() => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  }, [cart])

  // Get cart value (same as total for consistency with API hook)
  const getCartValue = useCallback(() => {
    return getCartTotal()
  }, [getCartTotal])

  // Check if product is in cart
  const isInCart = useCallback((productId: string) => {
    return (cart[productId] || 0) > 0
  }, [cart])

  // Dummy functions for API compatibility
  const fetchCart = useCallback(async () => {
    // No-op for local cart
  }, [])

  return {
    cart: null, // Return null to match API hook interface
    loading,
    error: null,
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