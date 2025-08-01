// Terminal 3 Phase 2: Order Tracking Hook
// React hook for real-time order tracking and management

import { useState, useEffect, useCallback } from 'react'
import { orderOrchestrator, Order, OrderModification, TrackingEvent } from '@/services/order-management/order-orchestrator'

export interface UseOrderTrackingReturn {
  orders: Order[]
  currentOrder: Order | null
  trackingData: TrackingData | null
  isLoading: boolean
  error: string | null
  loadOrders: () => Promise<void>
  trackOrder: (orderId: string) => Promise<void>
  modifyOrder: (orderId: string, modification: OrderModification) => Promise<void>
  cancelOrder: (orderId: string, reason?: string) => Promise<void>
  reorderItems: (orderId: string) => Promise<void>
  refreshTracking: () => Promise<void>
}

export interface TrackingData {
  order: Order
  trackingEvents: TrackingEvent[]
  estimatedDelivery: string
  currentLocation?: string
  deliveryProgress: number
  nextUpdate: string
}

export interface OrderSummary {
  totalOrders: number
  pendingOrders: number
  shippedOrders: number
  deliveredOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: string
}

export function useOrderTracking(customerId?: string): UseOrderTrackingReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load customer orders
  const loadOrders = useCallback(async () => {
    if (!customerId) return

    setIsLoading(true)
    setError(null)

    try {
      // Load orders from localStorage for demo
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]') as Order[]
      const customerOrders = allOrders.filter(order => order.customerId === customerId)
      
      // Sort by creation date (newest first)
      customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setOrders(customerOrders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  // Track specific order
  const trackOrder = useCallback(async (orderId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const trackingResult = await orderOrchestrator.trackOrder(orderId)
      
      // Calculate delivery progress
      const progress = calculateDeliveryProgress(trackingResult.trackingEvents, trackingResult.order.status)
      
      // Estimate next update
      const nextUpdate = estimateNextUpdate(trackingResult.trackingEvents, trackingResult.order.status)

      const trackingData: TrackingData = {
        ...trackingResult,
        deliveryProgress: progress,
        nextUpdate
      }

      setTrackingData(trackingData)
      setCurrentOrder(trackingResult.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track order')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Modify order
  const modifyOrder = useCallback(async (orderId: string, modification: OrderModification) => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedOrder = await orderOrchestrator.modifyOrder(orderId, modification)
      
      // Update orders list
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ))

      // Update current order if it's the one being tracked
      if (currentOrder?.id === orderId) {
        setCurrentOrder(updatedOrder)
      }

      // Refresh tracking data
      if (trackingData?.order.id === orderId) {
        await trackOrder(orderId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to modify order')
    } finally {
      setIsLoading(false)
    }
  }, [currentOrder, trackingData, trackOrder])

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const modification: OrderModification = {
        type: 'apply_discount',
        data: { status: 'cancelled', reason },
        reason: reason || 'Customer request',
        requestedBy: customerId || 'customer',
        requestedAt: new Date().toISOString(),
        status: 'approved'
      }

      // Update order status
      const order = orders.find(o => o.id === orderId)
      if (order) {
        order.status = 'cancelled'
        order.updatedAt = new Date().toISOString()
        order.metadata = { ...order.metadata, cancellationReason: reason }

        // Save to localStorage
        localStorage.setItem(`order_${orderId}`, JSON.stringify(order))
        
        // Update orders list
        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        const orderIndex = allOrders.findIndex((o: Order) => o.id === orderId)
        if (orderIndex >= 0) {
          allOrders[orderIndex] = order
          localStorage.setItem('orders', JSON.stringify(allOrders))
        }

        // Update local state
        setOrders(prev => prev.map(o => o.id === orderId ? order : o))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setIsLoading(false)
    }
  }, [orders, customerId])

  // Reorder items from previous order
  const reorderItems = useCallback(async (orderId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      // Add items to cart
      const cartItems = order.items.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        msrp: Math.round(item.unitPrice * 1.5) // Estimate MSRP
      }))

      // Get existing cart and add new items
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const updatedCart = [...existingCart]

      // Merge quantities for existing items
      cartItems.forEach(newItem => {
        const existingIndex = updatedCart.findIndex(item => item.id === newItem.id)
        if (existingIndex >= 0) {
          updatedCart[existingIndex].quantity += newItem.quantity
        } else {
          updatedCart.push(newItem)
        }
      })

      localStorage.setItem('cart', JSON.stringify(updatedCart))

      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder items')
    } finally {
      setIsLoading(false)
    }
  }, [orders])

  // Refresh tracking data
  const refreshTracking = useCallback(async () => {
    if (currentOrder) {
      await trackOrder(currentOrder.id)
    }
  }, [currentOrder, trackOrder])

  // Load orders on mount and when customerId changes
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Auto-refresh tracking data for active orders
  useEffect(() => {
    if (!trackingData || !['processing', 'fulfillment', 'shipped'].includes(trackingData.order.status)) {
      return
    }

    const interval = setInterval(() => {
      refreshTracking()
    }, 30000) // Refresh every 30 seconds for active orders

    return () => clearInterval(interval)
  }, [trackingData, refreshTracking])

  return {
    orders,
    currentOrder,
    trackingData,
    isLoading,
    error,
    loadOrders,
    trackOrder,
    modifyOrder,
    cancelOrder,
    reorderItems,
    refreshTracking
  }
}

// Helper function to calculate delivery progress percentage
function calculateDeliveryProgress(events: TrackingEvent[], status: string): number {
  const statusProgress: Record<string, number> = {
    'pending': 0,
    'confirmed': 10,
    'processing': 25,
    'fulfillment': 40,
    'shipped': 60,
    'in_transit': 80,
    'out_for_delivery': 95,
    'delivered': 100,
    'cancelled': 0,
    'returned': 0
  }

  // Check for specific tracking events
  let progress = statusProgress[status] || 0

  if (events.some(e => e.status === 'in_transit')) {
    progress = Math.max(progress, 70)
  }
  if (events.some(e => e.status === 'out_for_delivery')) {
    progress = Math.max(progress, 90)
  }

  return progress
}

// Helper function to estimate next tracking update
function estimateNextUpdate(events: TrackingEvent[], status: string): string {
  const now = new Date()
  let nextUpdate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default: 24 hours

  switch (status) {
    case 'processing':
    case 'fulfillment':
      nextUpdate = new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
      break
    case 'shipped':
    case 'in_transit':
      nextUpdate = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 8 hours
      break
    case 'out_for_delivery':
      nextUpdate = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours
      break
    case 'delivered':
    case 'cancelled':
      return 'No further updates expected'
  }

  return nextUpdate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

// Hook for order summary statistics
export function useOrderSummary(customerId?: string): OrderSummary {
  const [summary, setSummary] = useState<OrderSummary>({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: ''
  })

  useEffect(() => {
    if (!customerId) return

    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]') as Order[]
    const customerOrders = allOrders.filter(order => order.customerId === customerId)

    const totalOrders = customerOrders.length
    const pendingOrders = customerOrders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length
    const shippedOrders = customerOrders.filter(o => o.status === 'shipped').length
    const deliveredOrders = customerOrders.filter(o => o.status === 'delivered').length
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    const lastOrderDate = customerOrders.length > 0 ? customerOrders[0].createdAt : ''

    setSummary({
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate
    })
  }, [customerId])

  return summary
}