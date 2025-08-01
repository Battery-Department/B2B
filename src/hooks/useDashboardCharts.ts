'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Types for chart data
export interface OrderTrendData {
  month: string
  orders: number
  revenue: number
  growth: number
}

export interface SavingsData {
  category: string
  amount: number
  percentage: number
  color: string
  icon: React.ReactNode
  description: string
}

export interface UsageData {
  day: string
  hour: number
  intensity: number
  batteryCount: number
  avgRuntime: number
}

export interface DashboardChartsData {
  orderTrends: OrderTrendData[]
  savingsBreakdown: SavingsData[]
  usageHeatmap: UsageData[]
  totalSavings: number
  totalMSRP: number
  lastUpdated: Date
}

export interface DashboardChartsState {
  data: DashboardChartsData | null
  loading: boolean
  error: string | null
  refreshing: boolean
}

export interface UseDashboardChartsOptions {
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
  timeRange?: '6m' | '12m' | '24m'
  enableRealTime?: boolean
}

export function useDashboardCharts(options: UseDashboardChartsOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    timeRange = '12m',
    enableRealTime = true
  } = options

  const [state, setState] = useState<DashboardChartsState>({
    data: null,
    loading: true,
    error: null,
    refreshing: false
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Generate sample order trend data
  const generateOrderTrendData = useCallback((range: '6m' | '12m' | '24m'): OrderTrendData[] => {
    const months = range === '6m' ? 6 : range === '12m' ? 12 : 24
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    const data: OrderTrendData[] = []
    const currentDate = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthIndex = date.getMonth()
      const baseOrders = 15 + Math.floor(Math.random() * 20)
      const baseRevenue = 3000 + Math.floor(Math.random() * 4000)
      
      // Add some seasonal variation
      const seasonalMultiplier = Math.sin((monthIndex / 12) * 2 * Math.PI) * 0.3 + 1
      const orders = Math.floor(baseOrders * seasonalMultiplier)
      const revenue = Math.floor(baseRevenue * seasonalMultiplier)
      
      // Calculate growth compared to previous month
      const growth = i === months - 1 ? 0 : 
        data.length > 0 ? 
        ((orders - data[data.length - 1].orders) / data[data.length - 1].orders) * 100 :
        Math.random() * 20 - 5 // Random growth between -5% and 15%
      
      data.push({
        month: range === '24m' ? 
          `${monthNames[monthIndex]} '${date.getFullYear().toString().slice(-2)}` :
          monthNames[monthIndex],
        orders,
        revenue,
        growth: Number(growth.toFixed(1))
      })
    }
    
    return data
  }, [])

  // Generate sample savings data
  const generateSavingsData = useCallback((): { savings: SavingsData[], totalSavings: number, totalMSRP: number } => {
    const baseAmounts = [2450, 1680, 890, 430]
    const variations = baseAmounts.map(() => 0.8 + Math.random() * 0.4) // 80-120% variation
    
    const amounts = baseAmounts.map((base, index) => Math.floor(base * variations[index]))
    const totalSavings = amounts.reduce((sum, amount) => sum + amount, 0)
    const totalMSRP = totalSavings * 2.2 // Implies ~45% savings rate
    
    const savings: SavingsData[] = [
      {
        category: 'Volume Discounts',
        amount: amounts[0],
        percentage: Math.round((amounts[0] / totalSavings) * 100),
        color: '#006FEE',
        icon: null, // Will be set by component
        description: 'Bulk order savings'
      },
      {
        category: 'Quiz Recommendations',
        amount: amounts[1],
        percentage: Math.round((amounts[1] / totalSavings) * 100),
        color: '#10B981',
        icon: null,
        description: 'AI-optimized selections'
      },
      {
        category: 'Seasonal Promotions',
        amount: amounts[2],
        percentage: Math.round((amounts[2] / totalSavings) * 100),
        color: '#F59E0B',
        icon: null,
        description: 'Limited-time offers'
      },
      {
        category: 'Loyalty Benefits',
        amount: amounts[3],
        percentage: Math.round((amounts[3] / totalSavings) * 100),
        color: '#8B5CF6',
        icon: null,
        description: 'Gold tier rewards'
      }
    ]
    
    return { savings, totalSavings, totalMSRP }
  }, [])

  // Generate sample usage data
  const generateUsageData = useCallback((): UsageData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const data: UsageData[] = []
    
    days.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        let intensity = 0
        const isWeekday = dayIndex < 5
        const isWorkHours = hour >= 6 && hour <= 18
        
        if (isWeekday && isWorkHours) {
          if ((hour >= 8 && hour <= 12) || (hour >= 13 && hour <= 17)) {
            intensity = 0.6 + Math.random() * 0.4
          } else if ((hour >= 6 && hour <= 8) || (hour >= 17 && hour <= 18)) {
            intensity = 0.2 + Math.random() * 0.4
          }
        } else if (!isWeekday && isWorkHours) {
          intensity = Math.random() * 0.3
        }
        
        // Add some random variation for realism
        intensity = Math.max(0, intensity + (Math.random() - 0.5) * 0.2)
        
        data.push({
          day,
          hour,
          intensity,
          batteryCount: Math.floor(intensity * 50) + Math.floor(Math.random() * 10),
          avgRuntime: 2 + intensity * 6 + Math.random() * 2
        })
      })
    })
    
    return data
  }, [])

  // Fetch dashboard data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    try {
      setState(prev => ({ 
        ...prev, 
        loading: !isRefresh,
        refreshing: isRefresh,
        error: null 
      }))

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, isRefresh ? 500 : 1500))
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      // Generate fresh data
      const orderTrends = generateOrderTrendData(timeRange)
      const { savings, totalSavings, totalMSRP } = generateSavingsData()
      const usageHeatmap = generateUsageData()

      const newData: DashboardChartsData = {
        orderTrends,
        savingsBreakdown: savings,
        usageHeatmap,
        totalSavings,
        totalMSRP,
        lastUpdated: new Date()
      }

      setState(prev => ({
        ...prev,
        data: newData,
        loading: false,
        refreshing: false,
        error: null
      }))

    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }))
    }
  }, [timeRange, generateOrderTrendData, generateSavingsData, generateUsageData])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Set up auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (autoRefresh && enableRealTime && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (!state.loading) {
          refresh()
        }
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, enableRealTime, refreshInterval, refresh, state.loading])

  // Initial data fetch
  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // Refetch when time range changes
  useEffect(() => {
    if (state.data) {
      fetchData(true)
    }
  }, [timeRange]) // Only depend on timeRange, not fetchData

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    refresh,
    lastUpdated: state.data?.lastUpdated || null,
    isStale: state.data ? 
      (Date.now() - state.data.lastUpdated.getTime()) > refreshInterval * 2 : 
      false
  }
}

// Additional hook for individual chart data
export function useOrderTrendData(timeRange: '6m' | '12m' | '24m' = '12m') {
  const { data, loading, error, refresh } = useDashboardCharts({ 
    timeRange,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute for individual charts
  })
  
  return {
    data: data?.orderTrends || [],
    loading,
    error,
    refresh
  }
}

export function useSavingsData() {
  const { data, loading, error, refresh } = useDashboardCharts({
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes for savings data
  })
  
  return {
    savingsBreakdown: data?.savingsBreakdown || [],
    totalSavings: data?.totalSavings || 0,
    totalMSRP: data?.totalMSRP || 0,
    loading,
    error,
    refresh
  }
}

export function useUsageHeatmapData(timeRange: 'week' | 'month' = 'week') {
  const { data, loading, error, refresh } = useDashboardCharts({
    autoRefresh: true,
    refreshInterval: 120000 // 2 minutes for usage data
  })
  
  return {
    data: data?.usageHeatmap || [],
    loading,
    error,
    refresh
  }
}