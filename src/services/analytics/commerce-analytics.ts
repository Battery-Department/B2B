// Terminal 3 Integration: Commerce Analytics Service
// Real-time metrics tracking and dashboard integration

import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'

const prisma = new PrismaClient()
const eventBus = new EventEmitter()

export interface CommerceMetrics {
  revenue: number
  orderCount: number
  averageOrderValue: number
  conversionRate: number
  cartAbandonment: number
  topProducts: ProductMetric[]
  revenueByHour: HourlyRevenue[]
  customerMetrics: CustomerMetrics
}

export interface ProductMetric {
  productId: string
  name: string
  revenue: number
  unitsSold: number
  orderCount: number
}

export interface HourlyRevenue {
  hour: number
  revenue: number
  orders: number
}

export interface CustomerMetrics {
  newCustomers: number
  returningCustomers: number
  customerLifetimeValue: number
  repeatPurchaseRate: number
}

export class CommerceAnalytics {
  // Get real-time metrics
  async getRealtimeMetrics(): Promise<CommerceMetrics> {
    try {
      const now = new Date()
      const dayStart = new Date(now.setHours(0, 0, 0, 0))
      const weekStart = new Date(now.setDate(now.getDate() - 7))

      // Get today's orders
      const todayOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: dayStart },
          status: { in: ['paid', 'shipped', 'delivered'] }
        },
        include: { items: true }
      })

      // Calculate metrics
      const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0)
      const orderCount = todayOrders.length
      const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0

      // Calculate conversion rate
      const conversionRate = await this.calculateConversionRate()
      
      // Calculate cart abandonment
      const cartAbandonment = await this.calculateCartAbandonment()

      // Get top products
      const topProducts = await this.getTopProducts(5)

      // Get hourly revenue
      const revenueByHour = await this.getHourlyRevenue()

      // Get customer metrics
      const customerMetrics = await this.getCustomerMetrics()

      const metrics = {
        revenue,
        orderCount,
        averageOrderValue,
        conversionRate,
        cartAbandonment,
        topProducts,
        revenueByHour,
        customerMetrics
      }

      // Send to Terminal 5's dashboard
      await eventBus.emit('commerce.metrics.update', metrics)

      return metrics
    } catch (error) {
      console.error('Failed to get realtime metrics:', error)
      throw error
    }
  }

  // Calculate conversion rate
  async calculateConversionRate(): Promise<number> {
    const now = new Date()
    const dayStart = new Date(now.setHours(0, 0, 0, 0))

    // Get sessions with cart activity
    const sessionsWithCart = await prisma.session.count({
      where: {
        createdAt: { gte: dayStart },
        events: {
          some: {
            type: 'add_to_cart'
          }
        }
      }
    })

    // Get sessions with completed orders
    const sessionsWithOrder = await prisma.session.count({
      where: {
        createdAt: { gte: dayStart },
        events: {
          some: {
            type: 'order_completed'
          }
        }
      }
    })

    return sessionsWithCart > 0 ? (sessionsWithOrder / sessionsWithCart) * 100 : 0
  }

  // Calculate cart abandonment rate
  async calculateCartAbandonment(): Promise<number> {
    const now = new Date()
    const dayStart = new Date(now.setHours(0, 0, 0, 0))

    // Get abandoned carts (carts not updated in last 2 hours)
    const abandonedCarts = await prisma.cart.count({
      where: {
        updatedAt: {
          gte: dayStart,
          lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        items: {
          some: {}
        },
        order: null
      }
    })

    // Get total carts created
    const totalCarts = await prisma.cart.count({
      where: {
        createdAt: { gte: dayStart },
        items: {
          some: {}
        }
      }
    })

    return totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0
  }

  // Get top products
  async getTopProducts(limit: number): Promise<ProductMetric[]> {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - 7))

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: weekStart },
          status: { in: ['paid', 'shipped', 'delivered'] }
        }
      },
      _sum: {
        total: true,
        quantity: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      },
      take: limit
    })

    // Get product names
    const productIds = topProducts.map(p => p.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })

    const productMap = new Map(products.map(p => [p.id, p.name]))

    return topProducts.map(item => ({
      productId: item.productId,
      name: productMap.get(item.productId) || 'Unknown',
      revenue: item._sum.total || 0,
      unitsSold: item._sum.quantity || 0,
      orderCount: item._count._all
    }))
  }

  // Get hourly revenue
  async getHourlyRevenue(): Promise<HourlyRevenue[]> {
    const now = new Date()
    const dayStart = new Date(now.setHours(0, 0, 0, 0))

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: dayStart },
        status: { in: ['paid', 'shipped', 'delivered'] }
      },
      select: {
        createdAt: true,
        total: true
      }
    })

    // Group by hour
    const hourlyData = new Map<number, { revenue: number; orders: number }>()
    
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.set(hour, { revenue: 0, orders: 0 })
    }

    orders.forEach(order => {
      const hour = order.createdAt.getHours()
      const current = hourlyData.get(hour)!
      hourlyData.set(hour, {
        revenue: current.revenue + order.total,
        orders: current.orders + 1
      })
    })

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      revenue: data.revenue,
      orders: data.orders
    }))
  }

  // Get customer metrics
  async getCustomerMetrics(): Promise<CustomerMetrics> {
    const now = new Date()
    const dayStart = new Date(now.setHours(0, 0, 0, 0))
    const monthStart = new Date(now.setMonth(now.getMonth() - 1))

    // New customers today
    const newCustomers = await prisma.user.count({
      where: {
        createdAt: { gte: dayStart },
        role: 'CUSTOMER'
      }
    })

    // Returning customers (made more than one order)
    const returningCustomers = await prisma.user.count({
      where: {
        orders: {
          some: {
            status: { in: ['paid', 'shipped', 'delivered'] }
          }
        },
        _count: {
          orders: { gt: 1 }
        }
      }
    })

    // Calculate average CLV
    const customerLifetimeValue = await this.calculateAverageCLV()

    // Calculate repeat purchase rate
    const repeatPurchaseRate = await this.calculateRepeatPurchaseRate()

    return {
      newCustomers,
      returningCustomers,
      customerLifetimeValue,
      repeatPurchaseRate
    }
  }

  // Calculate average customer lifetime value
  private async calculateAverageCLV(): Promise<number> {
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {
            status: { in: ['paid', 'shipped', 'delivered'] }
          }
        }
      },
      select: {
        id: true,
        orders: {
          where: {
            status: { in: ['paid', 'shipped', 'delivered'] }
          },
          select: {
            total: true
          }
        }
      }
    })

    if (customers.length === 0) return 0

    const totalRevenue = customers.reduce((sum, customer) => 
      sum + customer.orders.reduce((orderSum, order) => orderSum + order.total, 0), 0
    )

    return totalRevenue / customers.length
  }

  // Calculate repeat purchase rate
  private async calculateRepeatPurchaseRate(): Promise<number> {
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {
            status: { in: ['paid', 'shipped', 'delivered'] }
          }
        }
      }
    })

    const repeatCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {
            status: { in: ['paid', 'shipped', 'delivered'] }
          }
        },
        _count: {
          orders: { gt: 1 }
        }
      }
    })

    return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0
  }

  // Track order creation
  async trackOrderCreated(order: any): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        type: 'order_created',
        orderId: order.id,
        userId: order.customerId,
        revenue: order.total,
        metadata: {
          items: order.items.length,
          shipping: order.shipping
        }
      }
    })

    // Send event to dashboards
    eventBus.emit('analytics.order.created', order)
  }

  // Track conversion
  async trackConversion(order: any): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        type: 'conversion',
        orderId: order.id,
        userId: order.customerId,
        revenue: order.total,
        metadata: {
          source: order.source || 'direct',
          device: order.device || 'desktop'
        }
      }
    })

    // Update session
    await prisma.session.updateMany({
      where: {
        userId: order.customerId,
        endedAt: null
      },
      data: {
        converted: true,
        conversionValue: order.total
      }
    })

    // Send event
    eventBus.emit('analytics.conversion', order)
  }

  // Track order status change
  async trackOrderStatusChange(orderId: string, status: string): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        type: 'order_status_changed',
        orderId,
        metadata: {
          status,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Send event
    eventBus.emit('analytics.order.status', { orderId, status })
  }

  // Track pricing decision
  async trackPricingDecision(
    productId: string, 
    customerId: string | null, 
    price: number
  ): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        type: 'pricing_decision',
        productId,
        userId: customerId,
        metadata: {
          price,
          timestamp: new Date().toISOString()
        }
      }
    })
  }

  // Get analytics event bus
  getEventBus(): EventEmitter {
    return eventBus
  }
}

// Singleton instance
export const analyticsService = new CommerceAnalytics()

// Export event bus for other services
export { eventBus }

// Start metrics collection interval
setInterval(() => {
  analyticsService.getRealtimeMetrics().catch(console.error)
}, 60 * 1000) // Every minute

export default analyticsService