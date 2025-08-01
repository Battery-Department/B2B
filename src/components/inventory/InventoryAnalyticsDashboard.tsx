/**
 * RHY Supplier Portal - Inventory Analytics Dashboard
 * Enterprise-grade business intelligence dashboard for inventory management
 * Provides real-time analytics, ML insights, and actionable recommendations
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Package, Truck, BarChart3, PieChart as PieChartIcon,
  Activity, Target, Zap, Globe, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface InventoryMetrics {
  totalValue: number
  totalItems: number
  turnoverRate: number
  stockoutRate: number
  excessInventory: number
  accuracy: number
  serviceLevel: number
  costOptimization: number
}

interface WarehousePerformance {
  warehouseId: string
  warehouseName: string
  metrics: {
    utilization: number
    efficiency: number
    accuracy: number
    cost: number
    turnover: number
    serviceLevel: number
  }
  trends: {
    utilization: number[]
    efficiency: number[]
    cost: number[]
  }
  status: 'excellent' | 'good' | 'needs_attention' | 'critical'
}

interface CategoryAnalysis {
  categoryId: string
  categoryName: string
  metrics: {
    revenue: number
    margin: number
    turnover: number
    growth: number
    stockout: number
    excess: number
  }
  trends: {
    sales: number[]
    margin: number[]
    inventory: number[]
  }
  performance: 'top' | 'good' | 'average' | 'poor'
}

interface MLInsights {
  demandForecast: {
    accuracy: number
    trend: 'increasing' | 'decreasing' | 'stable'
    confidence: number
    horizon: number
  }
  seasonalPatterns: {
    detected: boolean
    strength: number
    peakMonths: number[]
    lowMonths: number[]
  }
  anomalies: {
    count: number
    severity: 'low' | 'medium' | 'high'
    recent: Array<{
      type: string
      product: string
      warehouse: string
      impact: number
      timestamp: Date
    }>
  }
  optimization: {
    potential: number
    areas: string[]
    recommendations: number
    confidence: number
  }
}

interface ActionableInsight {
  id: string
  type: 'opportunity' | 'risk' | 'optimization' | 'alert'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: {
    financial: number
    service: number
    efficiency: number
  }
  action: {
    recommended: string
    timeframe: string
    effort: 'low' | 'medium' | 'high'
  }
  metrics: {
    confidence: number
    urgency: number
    complexity: number
  }
}

const COLORS = {
  primary: '#006FEE',
  secondary: '#0050B3',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  gray: '#6B7280'
}

const CHART_COLORS = ['#006FEE', '#0050B3', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function InventoryAnalyticsDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d')
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - in production, this would come from APIs
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalValue: 2450000,
    totalItems: 45680,
    turnoverRate: 12.4,
    stockoutRate: 2.1,
    excessInventory: 8.7,
    accuracy: 98.5,
    serviceLevel: 95.8,
    costOptimization: 15.2
  })

  const [warehouseData, setWarehouseData] = useState<WarehousePerformance[]>([
    {
      warehouseId: 'US',
      warehouseName: 'US West Coast',
      metrics: { utilization: 78, efficiency: 92, accuracy: 98, cost: 450000, turnover: 14.2, serviceLevel: 97 },
      trends: { utilization: [75, 76, 78, 79, 78], efficiency: [88, 90, 92, 91, 92], cost: [470000, 460000, 450000, 445000, 450000] },
      status: 'excellent'
    },
    {
      warehouseId: 'JP',
      warehouseName: 'Japan Central',
      metrics: { utilization: 85, efficiency: 88, accuracy: 96, cost: 380000, turnover: 11.8, serviceLevel: 94 },
      trends: { utilization: [82, 83, 85, 86, 85], efficiency: [85, 86, 88, 87, 88], cost: [390000, 385000, 380000, 375000, 380000] },
      status: 'good'
    },
    {
      warehouseId: 'EU',
      warehouseName: 'Europe Central',
      metrics: { utilization: 72, efficiency: 90, accuracy: 97, cost: 420000, turnover: 10.5, serviceLevel: 96 },
      trends: { utilization: [70, 71, 72, 73, 72], efficiency: [87, 88, 90, 89, 90], cost: [430000, 425000, 420000, 415000, 420000] },
      status: 'good'
    },
    {
      warehouseId: 'AU',
      warehouseName: 'Australia East',
      metrics: { utilization: 65, efficiency: 85, accuracy: 95, cost: 320000, turnover: 9.2, serviceLevel: 92 },
      trends: { utilization: [63, 64, 65, 66, 65], efficiency: [82, 83, 85, 84, 85], cost: [330000, 325000, 320000, 315000, 320000] },
      status: 'needs_attention'
    }
  ])

  const [categoryData, setCategoryData] = useState<CategoryAnalysis[]>([
    {
      categoryId: 'batteries',
      categoryName: 'FlexVolt Batteries',
      metrics: { revenue: 1850000, margin: 28.5, turnover: 15.2, growth: 12.8, stockout: 1.8, excess: 6.2 },
      trends: { sales: [1750000, 1800000, 1850000, 1900000, 1850000], margin: [26.5, 27.2, 28.5, 29.1, 28.5], inventory: [120000, 115000, 110000, 108000, 110000] },
      performance: 'top'
    },
    {
      categoryId: 'chargers',
      categoryName: 'Chargers & Accessories',
      metrics: { revenue: 425000, margin: 35.2, turnover: 8.9, growth: 8.4, stockout: 3.2, excess: 12.1 },
      trends: { sales: [400000, 410000, 425000, 435000, 425000], margin: [33.5, 34.2, 35.2, 36.1, 35.2], inventory: [85000, 80000, 75000, 72000, 75000] },
      performance: 'good'
    },
    {
      categoryId: 'tools',
      categoryName: 'Power Tools',
      metrics: { revenue: 175000, margin: 22.8, turnover: 6.5, growth: -2.1, stockout: 4.8, excess: 18.5 },
      trends: { sales: [185000, 180000, 175000, 170000, 175000], margin: [24.5, 23.2, 22.8, 21.9, 22.8], inventory: [65000, 68000, 70000, 72000, 70000] },
      performance: 'poor'
    }
  ])

  const [mlInsights, setMLInsights] = useState<MLInsights>({
    demandForecast: { accuracy: 87.5, trend: 'increasing', confidence: 0.85, horizon: 90 },
    seasonalPatterns: { detected: true, strength: 0.72, peakMonths: [11, 12, 3, 4], lowMonths: [1, 2, 7, 8] },
    anomalies: { 
      count: 3, 
      severity: 'medium',
      recent: [
        { type: 'Demand Spike', product: 'FlexVolt 9Ah', warehouse: 'US', impact: 15000, timestamp: new Date('2024-06-20') },
        { type: 'Supply Delay', product: 'Fast Charger', warehouse: 'EU', impact: 8500, timestamp: new Date('2024-06-19') },
        { type: 'Quality Issue', product: 'Power Tool Set', warehouse: 'JP', impact: 12000, timestamp: new Date('2024-06-18') }
      ]
    },
    optimization: { potential: 185000, areas: ['Reorder Points', 'Safety Stock', 'Transfer Routes'], recommendations: 12, confidence: 0.82 }
  })

  const [insights, setInsights] = useState<ActionableInsight[]>([
    {
      id: '1',
      type: 'opportunity',
      priority: 'high',
      title: 'Optimize FlexVolt 6Ah Safety Stock',
      description: 'Reduce safety stock levels for FlexVolt 6Ah batteries in US warehouse by 15% based on improved demand forecasting accuracy.',
      impact: { financial: 25000, service: 0, efficiency: 12 },
      action: { recommended: 'Adjust safety stock parameters', timeframe: '2 weeks', effort: 'low' },
      metrics: { confidence: 0.92, urgency: 0.6, complexity: 0.3 }
    },
    {
      id: '2',
      type: 'risk',
      priority: 'critical',
      title: 'Potential Stockout: Fast Chargers EU',
      description: 'Current inventory levels for Fast Chargers in EU warehouse will lead to stockout in 8 days based on current demand patterns.',
      impact: { financial: -45000, service: -25, efficiency: 0 },
      action: { recommended: 'Emergency transfer from US warehouse', timeframe: '3 days', effort: 'medium' },
      metrics: { confidence: 0.95, urgency: 0.9, complexity: 0.5 }
    },
    {
      id: '3',
      type: 'optimization',
      priority: 'medium',
      title: 'Consolidate Power Tool Inventory',
      description: 'Excess Power Tool inventory in AU and JP warehouses can be consolidated to reduce carrying costs.',
      impact: { financial: 18000, service: 5, efficiency: 8 },
      action: { recommended: 'Transfer 150 units from AU to JP', timeframe: '1 month', effort: 'medium' },
      metrics: { confidence: 0.78, urgency: 0.4, complexity: 0.6 }
    }
  ])

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const kpiCards = useMemo(() => [
    {
      title: 'Total Inventory Value',
      value: `$${(metrics.totalValue / 1000000).toFixed(1)}M`,
      change: '+8.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Inventory Turnover',
      value: `${metrics.turnoverRate}x`,
      change: '+12.4%',
      trend: 'up',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      title: 'Service Level',
      value: `${metrics.serviceLevel}%`,
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Stockout Rate',
      value: `${metrics.stockoutRate}%`,
      change: '-15.3%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      title: 'Excess Inventory',
      value: `${metrics.excessInventory}%`,
      change: '-8.7%',
      trend: 'down',
      icon: Package,
      color: 'text-red-600'
    },
    {
      title: 'Forecast Accuracy',
      value: `${metrics.accuracy}%`,
      change: '+3.2%',
      trend: 'up',
      icon: Zap,
      color: 'text-purple-600'
    }
  ], [metrics])

  const chartData = useMemo(() => ({
    warehouseUtilization: warehouseData.map(w => ({
      name: w.warehouseName,
      utilization: w.metrics.utilization,
      efficiency: w.metrics.efficiency,
      serviceLevel: w.metrics.serviceLevel
    })),
    categoryPerformance: categoryData.map(c => ({
      name: c.categoryName,
      revenue: c.metrics.revenue / 1000,
      margin: c.metrics.margin,
      turnover: c.metrics.turnover,
      growth: c.metrics.growth
    })),
    demandTrend: [
      { month: 'Jan', demand: 850, forecast: 860, accuracy: 98.8 },
      { month: 'Feb', demand: 920, forecast: 910, accuracy: 98.9 },
      { month: 'Mar', demand: 1050, forecast: 1040, accuracy: 99.0 },
      { month: 'Apr', demand: 1180, forecast: 1190, accuracy: 99.2 },
      { month: 'May', demand: 1250, forecast: 1240, accuracy: 99.2 },
      { month: 'Jun', demand: 1320, forecast: 1330, accuracy: 99.2 }
    ],
    inventoryTrends: [
      { month: 'Jan', value: 2200000, turnover: 11.2, excess: 12.5 },
      { month: 'Feb', value: 2250000, turnover: 11.8, excess: 11.2 },
      { month: 'Mar', value: 2300000, turnover: 12.1, excess: 10.8 },
      { month: 'Apr', value: 2380000, turnover: 12.3, excess: 9.5 },
      { month: 'May', value: 2420000, turnover: 12.4, excess: 9.1 },
      { month: 'Jun', value: 2450000, turnover: 12.4, excess: 8.7 }
    ]
  }), [warehouseData, categoryData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Inventory Analytics</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Warehouses</option>
                <option value="US">US West Coast</option>
                <option value="JP">Japan Central</option>
                <option value="EU">Europe Central</option>
                <option value="AU">Australia East</option>
              </select>
              
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'warehouses', name: 'Warehouses', icon: Globe },
              { id: 'categories', name: 'Categories', icon: Package },
              { id: 'ml-insights', name: 'ML Insights', icon: Zap },
              { id: 'recommendations', name: 'Recommendations', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {kpiCards.map((kpi) => (
                <div key={kpi.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        {kpi.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ml-1 ${
                          kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg bg-gray-100`}>
                      <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Inventory Value Trend */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Value Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.inventoryTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: any) => [`$${(value/1000000).toFixed(2)}M`, 'Value']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={COLORS.primary} 
                      fill={`${COLORS.primary}20`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Demand vs Forecast */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand vs Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.demandTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="demand" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      name="Actual Demand"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke={COLORS.warning} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Forecast"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Warehouse Performance */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.warehouseUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="utilization" fill={COLORS.primary} name="Utilization %" />
                    <Bar dataKey="efficiency" fill={COLORS.success} name="Efficiency %" />
                    <Bar dataKey="serviceLevel" fill={COLORS.info} name="Service Level %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Revenue */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Revenue ($K)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`$${value}K`, 'Revenue']} />
                    <Bar dataKey="revenue" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'warehouses' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {warehouseData.map((warehouse) => (
                <div key={warehouse.warehouseId} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{warehouse.warehouseName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      warehouse.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      warehouse.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      warehouse.status === 'needs_attention' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {warehouse.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className="text-sm font-medium">{warehouse.metrics.utilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Efficiency</span>
                      <span className="text-sm font-medium">{warehouse.metrics.efficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accuracy</span>
                      <span className="text-sm font-medium">{warehouse.metrics.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Cost</span>
                      <span className="text-sm font-medium">${(warehouse.metrics.cost/1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Turnover</span>
                      <span className="text-sm font-medium">{warehouse.metrics.turnover}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Service Level</span>
                      <span className="text-sm font-medium">{warehouse.metrics.serviceLevel}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Warehouse Trends */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Utilization Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" domain={['dataMin', 'dataMax']} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {warehouseData.map((warehouse, index) => (
                    <Line
                      key={warehouse.warehouseId}
                      type="monotone"
                      dataKey="utilization"
                      stroke={CHART_COLORS[index]}
                      strokeWidth={2}
                      name={warehouse.warehouseName}
                      data={warehouse.trends.utilization.map((util, idx) => ({
                        month: `Month ${idx + 1}`,
                        utilization: util
                      }))}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categoryData.map((category) => (
                <div key={category.categoryId} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{category.categoryName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.performance === 'top' ? 'bg-green-100 text-green-800' :
                      category.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                      category.performance === 'average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {category.performance}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenue</span>
                      <span className="text-sm font-medium">${(category.metrics.revenue/1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Margin</span>
                      <span className="text-sm font-medium">{category.metrics.margin}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Turnover</span>
                      <span className="text-sm font-medium">{category.metrics.turnover}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Growth</span>
                      <span className={`text-sm font-medium ${
                        category.metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {category.metrics.growth >= 0 ? '+' : ''}{category.metrics.growth}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stockout</span>
                      <span className="text-sm font-medium">{category.metrics.stockout}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Excess</span>
                      <span className="text-sm font-medium">{category.metrics.excess}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Performance Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance Matrix</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="margin" 
                    name="Margin %" 
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <YAxis 
                    dataKey="turnover" 
                    name="Turnover" 
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Categories" 
                    data={chartData.categoryPerformance} 
                    fill={COLORS.primary}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'ml-insights' && (
          <div className="space-y-8">
            {/* ML Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Forecast Accuracy</h3>
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{mlInsights.demandForecast.accuracy}%</p>
                <p className="text-sm text-gray-600 mt-1">
                  Confidence: {(mlInsights.demandForecast.confidence * 100).toFixed(1)}%
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Seasonal Strength</h3>
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{(mlInsights.seasonalPatterns.strength * 100).toFixed(0)}%</p>
                <p className="text-sm text-gray-600 mt-1">
                  Pattern {mlInsights.seasonalPatterns.detected ? 'detected' : 'not detected'}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Anomalies</h3>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{mlInsights.anomalies.count}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Severity: {mlInsights.anomalies.severity}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Optimization Potential</h3>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${(mlInsights.optimization.potential/1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-600 mt-1">
                  {mlInsights.optimization.recommendations} recommendations
                </p>
              </div>
            </div>

            {/* Recent Anomalies */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Anomalies</h3>
              <div className="space-y-4">
                {mlInsights.anomalies.recent.map((anomaly, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        mlInsights.anomalies.severity === 'high' ? 'bg-red-500' :
                        mlInsights.anomalies.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{anomaly.type}</p>
                        <p className="text-sm text-gray-600">{anomaly.product} - {anomaly.warehouse}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${anomaly.impact.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{anomaly.timestamp.toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Patterns */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Peak Months</h4>
                  <div className="flex flex-wrap gap-2">
                    {mlInsights.seasonalPatterns.peakMonths.map((month) => (
                      <span key={month} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Low Months</h4>
                  <div className="flex flex-wrap gap-2">
                    {mlInsights.seasonalPatterns.lowMonths.map((month) => (
                      <span key={month} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-8">
            {/* Priority Actions */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Actionable Insights</h3>
              <div className="space-y-6">
                {insights.map((insight) => (
                  <div key={insight.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          insight.priority === 'critical' ? 'bg-red-500' :
                          insight.priority === 'high' ? 'bg-orange-500' :
                          insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          <p className="text-gray-600 mt-1">{insight.description}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        insight.type === 'opportunity' ? 'bg-green-100 text-green-800' :
                        insight.type === 'risk' ? 'bg-red-100 text-red-800' :
                        insight.type === 'optimization' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {insight.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">Financial Impact</p>
                        <p className={`text-lg font-semibold ${
                          insight.impact.financial >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {insight.impact.financial >= 0 ? '+' : ''}${insight.impact.financial.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">Service Impact</p>
                        <p className={`text-lg font-semibold ${
                          insight.impact.service >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {insight.impact.service >= 0 ? '+' : ''}{insight.impact.service}%
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">Efficiency Impact</p>
                        <p className={`text-lg font-semibold ${
                          insight.impact.efficiency >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {insight.impact.efficiency >= 0 ? '+' : ''}{insight.impact.efficiency}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Recommended Action</p>
                          <p className="text-sm text-gray-600">{insight.action.recommended}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Timeframe</p>
                          <p className="text-sm text-gray-600">{insight.action.timeframe}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Effort</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.action.effort === 'low' ? 'bg-green-100 text-green-800' :
                            insight.action.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {insight.action.effort}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Take Action
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}