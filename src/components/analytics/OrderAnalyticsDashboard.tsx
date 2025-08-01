// Terminal 3 Phase 2: Advanced Order Analytics Dashboard
// Comprehensive analytics with insights, trends, and business intelligence

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  Users,
  Clock,
  Target,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  ShoppingCart,
  Truck,
  CreditCard,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  PauseCircle
} from 'lucide-react'

export interface OrderAnalyticsDashboardProps {
  customerId?: string
  dateRange?: {
    start: string
    end: string
  }
  className?: string
}

export interface OrderMetrics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate: number
  returnCustomers: number
  topProducts: ProductMetric[]
  revenueByPeriod: RevenueData[]
  ordersByStatus: StatusData[]
  customerSegments: SegmentData[]
  trends: TrendData[]
}

export interface ProductMetric {
  id: string
  name: string
  orders: number
  revenue: number
  quantity: number
  averagePrice: number
  growthRate: number
}

export interface RevenueData {
  period: string
  revenue: number
  orders: number
  averageOrderValue: number
}

export interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

export interface SegmentData {
  segment: string
  customers: number
  revenue: number
  averageOrderValue: number
  growthRate: number
}

export interface TrendData {
  metric: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  period: string
}

const OrderAnalyticsDashboard: React.FC<OrderAnalyticsDashboardProps> = ({
  customerId,
  dateRange,
  className = ''
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedView, setSelectedView] = useState<'overview' | 'products' | 'customers' | 'trends'>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod, customerId, dateRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Load orders from localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const filteredOrders = filterOrdersByPeriod(orders, selectedPeriod, dateRange)
      
      // Calculate metrics
      const calculatedMetrics = calculateMetrics(filteredOrders)
      setMetrics(calculatedMetrics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrdersByPeriod = (orders: any[], period: string, customRange?: { start: string; end: string }) => {
    const now = new Date()
    let startDate: Date

    if (customRange) {
      startDate = new Date(customRange.start)
    } else {
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    }

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate && orderDate <= now
    })
  }

  const calculateMetrics = (orders: any[]): OrderMetrics => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Product metrics
    const productMap = new Map<string, ProductMetric>()
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const existing = productMap.get(item.productId) || {
            id: item.productId,
            name: item.name,
            orders: 0,
            revenue: 0,
            quantity: 0,
            averagePrice: 0,
            growthRate: 0
          }
          
          existing.orders += 1
          existing.revenue += item.totalPrice || 0
          existing.quantity += item.quantity || 0
          existing.averagePrice = existing.revenue / existing.quantity
          
          productMap.set(item.productId, existing)
        })
      }
    })

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by period
    const revenueByPeriod = generateRevenueData(orders, selectedPeriod)

    // Orders by status
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const ordersByStatus: StatusData[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalOrders) * 100,
      color: getStatusColor(status)
    }))

    // Customer segments (demo data)
    const customerSegments: SegmentData[] = [
      {
        segment: 'New Customers',
        customers: Math.round(totalOrders * 0.3),
        revenue: totalRevenue * 0.2,
        averageOrderValue: averageOrderValue * 0.8,
        growthRate: 15
      },
      {
        segment: 'Returning Customers',
        customers: Math.round(totalOrders * 0.5),
        revenue: totalRevenue * 0.6,
        averageOrderValue: averageOrderValue * 1.2,
        growthRate: 8
      },
      {
        segment: 'VIP Customers',
        customers: Math.round(totalOrders * 0.2),
        revenue: totalRevenue * 0.2,
        averageOrderValue: averageOrderValue * 2.5,
        growthRate: 25
      }
    ]

    // Trends
    const trends: TrendData[] = [
      {
        metric: 'Order Volume',
        value: totalOrders,
        change: 12.5,
        trend: 'up',
        period: 'vs last period'
      },
      {
        metric: 'Revenue',
        value: totalRevenue,
        change: 8.3,
        trend: 'up',
        period: 'vs last period'
      },
      {
        metric: 'Avg Order Value',
        value: averageOrderValue,
        change: -2.1,
        trend: 'down',
        period: 'vs last period'
      },
      {
        metric: 'Conversion Rate',
        value: 3.2,
        change: 0.5,
        trend: 'up',
        period: 'vs last period'
      }
    ]

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      conversionRate: 3.2, // Demo value
      returnCustomers: Math.round(totalOrders * 0.7),
      topProducts,
      revenueByPeriod,
      ordersByStatus,
      customerSegments,
      trends
    }
  }

  const generateRevenueData = (orders: any[], period: string): RevenueData[] => {
    const data: RevenueData[] = []
    const now = new Date()
    const periods = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 12 : 12

    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(now)
      const periodEnd = new Date(now)

      if (period === '7d') {
        periodStart.setDate(now.getDate() - i - 1)
        periodEnd.setDate(now.getDate() - i)
      } else if (period === '30d') {
        periodStart.setDate(now.getDate() - i - 1)
        periodEnd.setDate(now.getDate() - i)
      } else {
        periodStart.setMonth(now.getMonth() - i - 1)
        periodEnd.setMonth(now.getMonth() - i)
      }

      const periodOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= periodStart && orderDate < periodEnd
      })

      const revenue = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const orderCount = periodOrders.length
      const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0

      data.push({
        period: periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: orderCount,
        averageOrderValue: avgOrderValue
      })
    }

    return data
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'confirmed': '#10B981',
      'processing': '#F59E0B',
      'shipped': '#3B82F6',
      'delivered': '#059669',
      'cancelled': '#EF4444',
      'pending': '#6B7280'
    }
    return colors[status] || '#6B7280'
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders.toLocaleString() || '0'}
          icon={<Package size={24} />}
          trend={metrics?.trends.find(t => t.metric === 'Order Volume')}
          color="blue"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          icon={<DollarSign size={24} />}
          trend={metrics?.trends.find(t => t.metric === 'Revenue')}
          color="green"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics?.averageOrderValue || 0)}
          icon={<TrendingUp size={24} />}
          trend={metrics?.trends.find(t => t.metric === 'Avg Order Value')}
          color="indigo"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics?.conversionRate || 0}%`}
          icon={<Target size={24} />}
          trend={metrics?.trends.find(t => t.metric === 'Conversion Rate')}
          color="purple"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as any)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <RevenueChart data={metrics?.revenueByPeriod || []} />
      </div>

      {/* Status Distribution & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="space-y-3">
            {metrics?.ordersByStatus.map(status => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <span className="font-medium text-gray-900 capitalize">{status.status}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{status.count}</div>
                  <div className="text-sm text-gray-500">{status.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {metrics?.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{product.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(product.revenue)}</div>
                  <div className="text-sm text-gray-500">{product.quantity} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderProductsView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Product Performance</h3>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Product Analytics</h4>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics?.topProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.quantity} units sold</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.averagePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center gap-1 ${
                      product.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.growthRate > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      {formatPercentage(product.growthRate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderCustomersView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Customer Segments</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics?.customerSegments.map(segment => (
          <div key={segment.segment} className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="font-bold text-gray-900 mb-4">{segment.segment}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Customers:</span>
                <span className="font-medium">{segment.customers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-medium">{formatCurrency(segment.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AOV:</span>
                <span className="font-medium">{formatCurrency(segment.averageOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Growth:</span>
                <span className={`font-medium flex items-center gap-1 ${
                  segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {segment.growthRate > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {formatPercentage(segment.growthRate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Analytics</h1>
              <p className="text-gray-600">Comprehensive business insights and trends</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mt-6 -mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
            { id: 'products', label: 'Products', icon: <Package size={16} /> },
            { id: 'customers', label: 'Customers', icon: <Users size={16} /> },
            { id: 'trends', label: 'Trends', icon: <TrendingUp size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                selectedView === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'products' && renderProductsView()}
        {selectedView === 'customers' && renderCustomersView()}
        {selectedView === 'trends' && renderOverview()} {/* Use overview for trends */}
      </div>
    </div>
  )
}

// Helper Components
const MetricCard: React.FC<{
  title: string
  value: string
  icon: React.ReactNode
  trend?: TrendData
  color: string
}> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}>
      <div className={`text-${color}-600`}>{icon}</div>
    </div>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    {trend && (
      <div className={`flex items-center gap-1 text-sm ${
        trend.trend === 'up' ? 'text-green-600' : 
        trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
      }`}>
        {trend.trend === 'up' ? <ArrowUp size={16} /> : 
         trend.trend === 'down' ? <ArrowDown size={16} /> : <Minus size={16} />}
        {Math.abs(trend.change).toFixed(1)}% {trend.period}
      </div>
    )}
  </div>
)

const RevenueChart: React.FC<{ data: RevenueData[] }> = ({ data }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue))

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 h-48">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="bg-blue-600 rounded-t min-h-[4px] w-full relative group"
              style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${item.revenue.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">{item.period}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderAnalyticsDashboard