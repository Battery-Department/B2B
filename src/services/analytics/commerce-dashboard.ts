'use client'

import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export interface CommerceMetrics {
  sales: SalesMetrics
  carts: CartMetrics
  payments: PaymentMetrics
  checkout: CheckoutMetrics
  products: ProductPerformance[]
  trends: CommerceTrends
}

export interface SalesMetrics {
  total: number
  count: number
  average: number
  growth: number
  byStatus: Record<string, number>
  topCustomers: CustomerSales[]
}

export interface CartMetrics {
  active: number
  abandoned: number
  value: number
  abandonmentRate: number
  avgItemsPerCart: number
  recoveryRate: number
}

export interface PaymentMetrics {
  successful: number
  failed: number
  pending: number
  successRate: number
  avgProcessingTime: number
  byMethod: Record<string, number>
}

export interface CheckoutMetrics {
  started: number
  completed: number
  conversionRate: number
  avgCompletionTime: number
  dropoffByStep: Record<string, number>
}

export interface ProductPerformance {
  productId: string
  name: string
  unitsSold: number
  revenue: number
  avgOrderValue: number
  returnRate: number
}

export interface CustomerSales {
  customerId: string
  name: string
  orders: number
  revenue: number
  avgOrderValue: number
}

export interface CommerceTrends {
  revenueGrowth: number
  orderGrowth: number
  customerGrowth: number
  conversionTrend: number[]
  seasonality: Record<string, number>
}

export class CommerceDashboard {
  // Get comprehensive commerce metrics from Terminal 3
  async getCommerceMetrics(days: number = 30): Promise<CommerceMetrics> {
    try {
      const startDate = subDays(new Date(), days)
      
      const [sales, carts, payments, checkout, products, trends] = await Promise.all([
        this.getSalesMetrics(startDate),
        this.getCartMetrics(startDate),
        this.getPaymentMetrics(startDate),
        this.getCheckoutMetrics(startDate),
        this.getTopProducts(startDate),
        this.getCommerceTrends(startDate)
      ])

      return {
        sales,
        carts,
        payments,
        checkout,
        products,
        trends
      }
    } catch (error) {
      console.error('Failed to get commerce metrics:', error)
      throw error
    }
  }

  // Get sales metrics
  private async getSalesMetrics(startDate: Date): Promise<SalesMetrics> {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        user: true
      }
    })

    const completedOrders = orders.filter(o => 
      ['completed', 'shipped', 'delivered'].includes(o.status)
    )

    const total = completedOrders.reduce((sum, o) => sum + o.total, 0)
    const count = completedOrders.length
    const average = count > 0 ? total / count : 0

    // Calculate growth
    const previousPeriodOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: subDays(startDate, 30),
          lt: startDate
        },
        status: { in: ['completed', 'shipped', 'delivered'] }
      }
    })

    const previousTotal = previousPeriodOrders.reduce((sum, o) => sum + o.total, 0)
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0

    // Group by status
    const byStatus: Record<string, number> = {}
    orders.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1
    })

    // Top customers
    const customerSales = new Map<string, CustomerSales>()
    completedOrders.forEach(order => {
      if (!order.userId) return
      
      const existing = customerSales.get(order.userId) || {
        customerId: order.userId,
        name: order.user?.name || 'Unknown',
        orders: 0,
        revenue: 0,
        avgOrderValue: 0
      }
      
      existing.orders++
      existing.revenue += order.total
      existing.avgOrderValue = existing.revenue / existing.orders
      
      customerSales.set(order.userId, existing)
    })

    const topCustomers = Array.from(customerSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return {
      total,
      count,
      average: Math.round(average),
      growth: Math.round(growth * 10) / 10,
      byStatus,
      topCustomers
    }
  }

  // Get cart metrics
  private async getCartMetrics(startDate: Date): Promise<CartMetrics> {
    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: { gte: startDate }
      },
      include: {
        items: true
      }
    })

    const activeCarts = carts.filter(c => !c.abandoned && c.items.length > 0)
    const abandonedCarts = carts.filter(c => c.abandoned)
    
    const activeValue = activeCarts.reduce((sum, cart) => {
      return sum + cart.items.reduce((cartSum, item) => cartSum + (item.quantity * item.price), 0)
    }, 0)

    const abandonmentRate = carts.length > 0 
      ? (abandonedCarts.length / carts.length) * 100 
      : 0

    const totalItems = activeCarts.reduce((sum, cart) => sum + cart.items.length, 0)
    const avgItemsPerCart = activeCarts.length > 0 ? totalItems / activeCarts.length : 0

    // Recovery rate (abandoned carts that were later converted)
    const recoveredCarts = await prisma.order.count({
      where: {
        userId: {
          in: abandonedCarts.map(c => c.userId).filter(Boolean)
        },
        createdAt: { gte: startDate }
      }
    })

    const recoveryRate = abandonedCarts.length > 0 
      ? (recoveredCarts / abandonedCarts.length) * 100 
      : 0

    return {
      active: activeCarts.length,
      abandoned: abandonedCarts.length,
      value: activeValue,
      abandonmentRate: Math.round(abandonmentRate * 10) / 10,
      avgItemsPerCart: Math.round(avgItemsPerCart * 10) / 10,
      recoveryRate: Math.round(recoveryRate * 10) / 10
    }
  }

  // Get payment metrics
  private async getPaymentMetrics(startDate: Date): Promise<PaymentMetrics> {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const successful = payments.filter(p => p.status === 'succeeded').length
    const failed = payments.filter(p => p.status === 'failed').length
    const pending = payments.filter(p => p.status === 'pending').length
    
    const successRate = payments.length > 0 
      ? (successful / payments.length) * 100 
      : 0

    // Calculate average processing time
    const completedPayments = payments.filter(p => p.status === 'succeeded' && p.processedAt)
    const processingTimes = completedPayments.map(p => {
      return p.processedAt!.getTime() - p.createdAt.getTime()
    })
    
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length / 1000 // Convert to seconds
      : 0

    // Group by payment method
    const byMethod: Record<string, number> = {}
    payments.forEach(payment => {
      const method = payment.method || 'unknown'
      byMethod[method] = (byMethod[method] || 0) + 1
    })

    return {
      successful,
      failed,
      pending,
      successRate: Math.round(successRate * 10) / 10,
      avgProcessingTime: Math.round(avgProcessingTime),
      byMethod
    }
  }

  // Get checkout metrics
  private async getCheckoutMetrics(startDate: Date): Promise<CheckoutMetrics> {
    // Get checkout sessions
    const checkoutSessions = await prisma.checkoutSession.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const started = checkoutSessions.length
    const completed = checkoutSessions.filter(s => s.completed).length
    const conversionRate = started > 0 ? (completed / started) * 100 : 0

    // Calculate average completion time
    const completedSessions = checkoutSessions.filter(s => s.completed && s.completedAt)
    const completionTimes = completedSessions.map(s => {
      return s.completedAt!.getTime() - s.createdAt.getTime()
    })
    
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length / 1000 / 60 // Convert to minutes
      : 0

    // Analyze dropoff by step
    const dropoffByStep: Record<string, number> = {
      'shipping': 0,
      'payment': 0,
      'review': 0
    }

    checkoutSessions.forEach(session => {
      if (!session.completed && session.currentStep) {
        dropoffByStep[session.currentStep] = (dropoffByStep[session.currentStep] || 0) + 1
      }
    })

    return {
      started,
      completed,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      dropoffByStep
    }
  }

  // Get top performing products
  private async getTopProducts(startDate: Date): Promise<ProductPerformance[]> {
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { in: ['completed', 'shipped', 'delivered'] }
        }
      },
      _sum: {
        quantity: true,
        total: true
      },
      _count: true
    })

    const productIds = orderItems.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    // Get return data
    const returns = await prisma.return.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    })

    const returnMap = new Map(returns.map(r => [r.productId, r._count]))

    return orderItems.map(item => {
      const product = products.find(p => p.id === item.productId)
      const returnCount = returnMap.get(item.productId) || 0
      const unitsSold = item._sum.quantity || 0
      const revenue = item._sum.total || 0
      
      return {
        productId: item.productId,
        name: product?.name || 'Unknown Product',
        unitsSold,
        revenue,
        avgOrderValue: item._count > 0 ? revenue / item._count : 0,
        returnRate: unitsSold > 0 ? (returnCount / unitsSold) * 100 : 0
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
  }

  // Get commerce trends
  private async getCommerceTrends(startDate: Date): Promise<CommerceTrends> {
    // Revenue growth
    const currentRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['completed', 'shipped', 'delivered'] }
      },
      _sum: { total: true }
    })

    const previousRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: subDays(startDate, 30),
          lt: startDate
        },
        status: { in: ['completed', 'shipped', 'delivered'] }
      },
      _sum: { total: true }
    })

    const revenueGrowth = previousRevenue._sum.total && previousRevenue._sum.total > 0
      ? ((currentRevenue._sum.total! - previousRevenue._sum.total) / previousRevenue._sum.total) * 100
      : 0

    // Order growth
    const currentOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['completed', 'shipped', 'delivered'] }
      }
    })

    const previousOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: subDays(startDate, 30),
          lt: startDate
        },
        status: { in: ['completed', 'shipped', 'delivered'] }
      }
    })

    const orderGrowth = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0

    // Customer growth
    const newCustomers = await prisma.user.count({
      where: {
        role: 'customer',
        createdAt: { gte: startDate },
        orders: { some: {} }
      }
    })

    const previousNewCustomers = await prisma.user.count({
      where: {
        role: 'customer',
        createdAt: {
          gte: subDays(startDate, 30),
          lt: startDate
        },
        orders: { some: {} }
      }
    })

    const customerGrowth = previousNewCustomers > 0
      ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100
      : 0

    // Conversion trend (last 7 days)
    const conversionTrend: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(subDays(new Date(), i))
      const dayEnd = endOfDay(subDays(new Date(), i))
      
      const sessions = await prisma.checkoutSession.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      })
      
      const completed = await prisma.checkoutSession.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          completed: true
        }
      })
      
      const rate = sessions > 0 ? (completed / sessions) * 100 : 0
      conversionTrend.push(Math.round(rate * 10) / 10)
    }

    // Seasonality (by day of week)
    const seasonality: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['completed', 'shipped', 'delivered'] }
      },
      select: {
        createdAt: true,
        total: true
      }
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    orders.forEach(order => {
      const dayName = dayNames[order.createdAt.getDay()]
      seasonality[dayName] += order.total
    })

    return {
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      orderGrowth: Math.round(orderGrowth * 10) / 10,
      customerGrowth: Math.round(customerGrowth * 10) / 10,
      conversionTrend,
      seasonality
    }
  }

  // Get real-time checkout funnel
  async getCheckoutFunnel(hours: number = 24): Promise<{
    steps: string[]
    values: number[]
    dropoff: number[]
  }> {
    const startDate = subDays(new Date(), hours / 24)
    
    const sessions = await prisma.checkoutSession.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const steps = ['cart', 'shipping', 'payment', 'review', 'completed']
    const stepCounts = new Map<string, number>()
    
    // Initialize counts
    steps.forEach(step => stepCounts.set(step, 0))
    
    // Count sessions at each step
    sessions.forEach(session => {
      stepCounts.set('cart', stepCounts.get('cart')! + 1)
      
      if (session.currentStep) {
        const stepIndex = steps.indexOf(session.currentStep)
        for (let i = 1; i <= stepIndex; i++) {
          stepCounts.set(steps[i], stepCounts.get(steps[i])! + 1)
        }
      }
      
      if (session.completed) {
        stepCounts.set('completed', stepCounts.get('completed')! + 1)
      }
    })

    const values = steps.map(step => stepCounts.get(step) || 0)
    const dropoff = values.map((value, index) => {
      if (index === 0) return 0
      const prevValue = values[index - 1]
      return prevValue > 0 ? ((prevValue - value) / prevValue) * 100 : 0
    })

    return {
      steps,
      values,
      dropoff: dropoff.map(d => Math.round(d * 10) / 10)
    }
  }
}

// Create singleton instance
export const commerceDashboard = new CommerceDashboard()