'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { analyticsDataFetcher } from '@/services/analytics/data-fetcher'
import { metaEventsService } from '@/services/analytics/meta-events'
import { costTracker } from '@/services/analytics/cost-tracker'

export interface RealTimeOptions {
  interval?: number // Update interval in milliseconds
  enabled?: boolean // Enable/disable real-time updates
  onError?: (error: Error) => void
}

// Hook for real-time metric updates
export function useRealTimeMetric(
  metric: string, 
  options: RealTimeOptions = {}
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onError
  } = options

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await analyticsDataFetcher.getMetric(metric)
      setData(result)
      setError(null)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [metric, onError])

  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchData()

    // Set up interval
    intervalRef.current = setInterval(fetchData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, interval, enabled])

  return { data, loading, error, refetch: fetchData }
}

// Hook for real-time dashboard data
export function useRealTimeDashboard(options: RealTimeOptions = {}) {
  const {
    interval = 60000, // 1 minute default
    enabled = true,
    onError
  } = options

  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await analyticsDataFetcher.getDashboardSummary()
      setDashboard(data)
      setError(null)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onError])

  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchDashboard()

    // Set up WebSocket for real-time updates
    if (process.env.NEXT_PUBLIC_WS_URL) {
      try {
        wsRef.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL)
        
        wsRef.current.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data)
            if (update.type === 'dashboard_update') {
              setDashboard(update.data)
            }
          } catch (err) {
            console.error('WebSocket message error:', err)
          }
        }

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
      } catch (err) {
        console.error('WebSocket connection failed:', err)
      }
    }

    // Fallback to polling
    const intervalId = setInterval(fetchDashboard, interval)

    return () => {
      clearInterval(intervalId)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [fetchDashboard, interval, enabled])

  return { dashboard, loading, error, refetch: fetchDashboard }
}

// Hook for real-time Meta events
export function useRealTimeMetaEvents(options: RealTimeOptions = {}) {
  const {
    interval = 5000, // 5 seconds for events
    enabled = true,
    onError
  } = options

  const [events, setEvents] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const streamEvents = async () => {
      try {
        // Get initial metrics
        const initialMetrics = await metaEventsService.getContentMetrics(30)
        if (!cancelled) {
          setMetrics(initialMetrics)
          setLoading(false)
        }

        // Stream events
        for await (const latestEvents of metaEventsService.getEventStream()) {
          if (cancelled) break
          setEvents(latestEvents)
        }
      } catch (err) {
        if (!cancelled) {
          onError?.(err as Error)
        }
      }
    }

    streamEvents()

    return () => {
      cancelled = true
    }
  }, [enabled, onError])

  return { events, metrics, loading }
}

// Hook for real-time cost tracking
export function useRealTimeCosts(days: number = 30, options: RealTimeOptions = {}) {
  const {
    interval = 300000, // 5 minutes for costs
    enabled = true,
    onError
  } = options

  const [costs, setCosts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCosts = useCallback(async () => {
    try {
      const data = await costTracker.getCostBreakdown(days)
      setCosts(data)
      setError(null)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [days, onError])

  useEffect(() => {
    if (!enabled) return

    fetchCosts()
    const intervalId = setInterval(fetchCosts, interval)

    return () => clearInterval(intervalId)
  }, [fetchCosts, interval, enabled])

  return { costs, loading, error, refetch: fetchCosts }
}

// Hook for subscribing to specific metric updates
export function useMetricSubscription(
  metrics: string[],
  callback: (metric: string, value: any) => void,
  options: RealTimeOptions = {}
) {
  const { enabled = true } = options
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled || !process.env.NEXT_PUBLIC_WS_URL) return

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL)
    
    ws.onopen = () => {
      // Subscribe to specific metrics
      ws.send(JSON.stringify({
        type: 'subscribe',
        metrics
      }))
    }

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        if (update.type === 'metric_update' && metrics.includes(update.metric)) {
          callbackRef.current(update.metric, update.value)
        }
      } catch (err) {
        console.error('Metric subscription error:', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [metrics, enabled])
}

// Batch hook for multiple real-time metrics
export function useRealTimeMetrics(
  metricNames: string[],
  options: RealTimeOptions = {}
) {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, Error>>({})

  const fetchAllMetrics = useCallback(async () => {
    setLoading(true)
    const results: Record<string, any> = {}
    const errorMap: Record<string, Error> = {}

    await Promise.all(
      metricNames.map(async (metric) => {
        try {
          results[metric] = await analyticsDataFetcher.getMetric(metric)
        } catch (err) {
          errorMap[metric] = err as Error
        }
      })
    )

    setMetrics(results)
    setErrors(errorMap)
    setLoading(false)
  }, [metricNames])

  useEffect(() => {
    if (!options.enabled) return

    fetchAllMetrics()
    const intervalId = setInterval(fetchAllMetrics, options.interval || 30000)

    return () => clearInterval(intervalId)
  }, [fetchAllMetrics, options.enabled, options.interval])

  return { metrics, loading, errors, refetch: fetchAllMetrics }
}