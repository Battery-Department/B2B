import { useEffect, useCallback, useRef } from 'react'

interface PerformanceMetrics {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  domLoad: number | null // DOM Load Time
  pageLoad: number | null // Full Page Load Time
}

interface PerformanceConfig {
  enableTracking?: boolean
  sampleRate?: number
  endpoint?: string
  debug?: boolean
}

const defaultConfig: PerformanceConfig = {
  enableTracking: true,
  sampleRate: 1.0,
  endpoint: '/api/analytics/performance',
  debug: process.env.NODE_ENV === 'development'
}

export function usePerformance(config: PerformanceConfig = {}) {
  const configRef = useRef({ ...defaultConfig, ...config })
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    domLoad: null,
    pageLoad: null
  })

  // Measure Core Web Vitals
  const measureWebVitals = useCallback(() => {
    if (!configRef.current.enableTracking) return

    // First Contentful Paint
    const measureFCP = () => {
      const entries = performance.getEntriesByName('first-contentful-paint')
      if (entries.length > 0) {
        metricsRef.current.fcp = entries[0].startTime
        if (configRef.current.debug) {
          console.log('FCP:', entries[0].startTime)
        }
      }
    }

    // Largest Contentful Paint
    const measureLCP = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            metricsRef.current.lcp = lastEntry.startTime
            if (configRef.current.debug) {
              console.log('LCP:', lastEntry.startTime)
            }
          })
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (error) {
          console.warn('LCP measurement not supported')
        }
      }
    }

    // First Input Delay
    const measureFID = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              metricsRef.current.fid = entry.processingStart - entry.startTime
              if (configRef.current.debug) {
                console.log('FID:', entry.processingStart - entry.startTime)
              }
            })
          })
          observer.observe({ entryTypes: ['first-input'] })
        } catch (error) {
          console.warn('FID measurement not supported')
        }
      }
    }

    // Cumulative Layout Shift
    const measureCLS = () => {
      if ('PerformanceObserver' in window) {
        try {
          let clsValue = 0
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            })
            metricsRef.current.cls = clsValue
            if (configRef.current.debug) {
              console.log('CLS:', clsValue)
            }
          })
          observer.observe({ entryTypes: ['layout-shift'] })
        } catch (error) {
          console.warn('CLS measurement not supported')
        }
      }
    }

    // Navigation Timing
    const measureNavigationTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metricsRef.current.ttfb = navigation.responseStart - navigation.requestStart
        metricsRef.current.domLoad = navigation.domContentLoadedEventEnd - navigation.navigationStart
        metricsRef.current.pageLoad = navigation.loadEventEnd - navigation.navigationStart

        if (configRef.current.debug) {
          console.log('TTFB:', metricsRef.current.ttfb)
          console.log('DOM Load:', metricsRef.current.domLoad)
          console.log('Page Load:', metricsRef.current.pageLoad)
        }
      }
    }

    // Wait for page to load before measuring
    if (document.readyState === 'complete') {
      measureFCP()
      measureNavigationTiming()
    } else {
      window.addEventListener('load', () => {
        measureFCP()
        measureNavigationTiming()
      })
    }

    measureLCP()
    measureFID()
    measureCLS()
  }, [])

  // Send metrics to analytics endpoint
  const sendMetrics = useCallback(async () => {
    if (!configRef.current.enableTracking || Math.random() > configRef.current.sampleRate) {
      return
    }

    const metrics = { ...metricsRef.current }
    
    // Only send if we have some metrics
    const hasMetrics = Object.values(metrics).some(value => value !== null)
    if (!hasMetrics) return

    try {
      // Add page context
      const payload = {
        ...metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : null
      }

      if (configRef.current.debug) {
        console.log('Sending performance metrics:', payload)
      }

      await fetch(configRef.current.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.warn('Failed to send performance metrics:', error)
    }
  }, [])

  // Measure resource timing
  const measureResourceTiming = useCallback(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const resourceMetrics = {
      totalResources: resources.length,
      totalSize: 0,
      totalDuration: 0,
      slowestResource: null as PerformanceResourceTiming | null,
      largestResource: null as PerformanceResourceTiming | null
    }

    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime
      const size = resource.transferSize || 0

      resourceMetrics.totalSize += size
      resourceMetrics.totalDuration += duration

      if (!resourceMetrics.slowestResource || duration > (resourceMetrics.slowestResource.responseEnd - resourceMetrics.slowestResource.startTime)) {
        resourceMetrics.slowestResource = resource
      }

      if (!resourceMetrics.largestResource || size > (resourceMetrics.largestResource.transferSize || 0)) {
        resourceMetrics.largestResource = resource
      }
    })

    if (configRef.current.debug) {
      console.log('Resource metrics:', resourceMetrics)
    }

    return resourceMetrics
  }, [])

  // Monitor long tasks
  const monitorLongTasks = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (configRef.current.debug) {
              console.warn('Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              })
            }
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Long task monitoring not supported')
      }
    }
  }, [])

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  // Performance grade calculation
  const getPerformanceGrade = useCallback(() => {
    const metrics = metricsRef.current
    let score = 100
    
    // FCP scoring (good: <1.8s, poor: >3s)
    if (metrics.fcp !== null) {
      if (metrics.fcp > 3000) score -= 20
      else if (metrics.fcp > 1800) score -= 10
    }

    // LCP scoring (good: <2.5s, poor: >4s)
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) score -= 25
      else if (metrics.lcp > 2500) score -= 15
    }

    // FID scoring (good: <100ms, poor: >300ms)
    if (metrics.fid !== null) {
      if (metrics.fid > 300) score -= 20
      else if (metrics.fid > 100) score -= 10
    }

    // CLS scoring (good: <0.1, poor: >0.25)
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) score -= 25
      else if (metrics.cls > 0.1) score -= 15
    }

    // TTFB scoring (good: <800ms, poor: >1800ms)
    if (metrics.ttfb !== null) {
      if (metrics.ttfb > 1800) score -= 10
      else if (metrics.ttfb > 800) score -= 5
    }

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
    
    return { score: Math.max(0, score), grade }
  }, [])

  useEffect(() => {
    measureWebVitals()
    monitorLongTasks()

    // Send metrics when user is about to leave
    const handleBeforeUnload = () => {
      sendMetrics()
    }

    // Send metrics after 10 seconds
    const timer = setTimeout(() => {
      sendMetrics()
    }, 10000)

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimeout(timer)
    }
  }, [measureWebVitals, sendMetrics, monitorLongTasks])

  return {
    getMetrics,
    measureResourceTiming,
    getPerformanceGrade,
    sendMetrics
  }
}

// Hook for measuring component-specific performance
export function useComponentPerformance(componentName: string) {
  const startTimeRef = useRef<number>(Date.now())
  const renderCountRef = useRef<number>(0)

  useEffect(() => {
    renderCountRef.current += 1
    const renderTime = Date.now() - startTimeRef.current

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCountRef.current}: ${renderTime}ms`)
    }

    // Track slow renders
    if (renderTime > 16) { // Slower than 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`)
    }
  })

  const markRenderStart = useCallback(() => {
    startTimeRef.current = Date.now()
  }, [])

  const measureRenderTime = useCallback(() => {
    return Date.now() - startTimeRef.current
  }, [])

  return {
    renderCount: renderCountRef.current,
    markRenderStart,
    measureRenderTime
  }
}

// Hook for lazy loading images
export function useLazyImage(src: string, threshold = 0.1) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const currentImg = imgRef.current
    if (!currentImg) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(currentImg)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image()
      img.onload = () => setIsLoaded(true)
      img.src = src
    }
  }, [isInView, isLoaded, src])

  return {
    imgRef,
    isLoaded,
    isInView,
    src: isLoaded ? src : undefined
  }
}

export default usePerformance