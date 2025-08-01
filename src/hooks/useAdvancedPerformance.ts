'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface AdvancedPerformanceMetrics {
  // FPS and rendering metrics
  fps: number
  averageFrameTime: number
  frameDrops: number
  
  // Memory metrics
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  memoryPressure: 'low' | 'medium' | 'high'
  
  // Network metrics
  connectionType: string
  effectiveConnectionType: string
  downlink: number
  rtt: number
  
  // Device metrics
  devicePixelRatio: number
  screenResolution: string
  viewportSize: string
  
  // Performance flags
  isSlowDevice: boolean
  isLowMemoryDevice: boolean
  isSlowNetwork: boolean
  batteryLevel?: number
  isCharging?: boolean
}

export interface UseAdvancedPerformanceOptions {
  enableMemoryMonitoring?: boolean
  enableNetworkMonitoring?: boolean
  enableBatteryMonitoring?: boolean
  fpsThreshold?: number
  memoryThreshold?: number
  reportingInterval?: number
}

export const useAdvancedPerformance = (options: UseAdvancedPerformanceOptions = {}) => {
  const {
    enableMemoryMonitoring = true,
    enableNetworkMonitoring = true,
    enableBatteryMonitoring = true,
    fpsThreshold = 30,
    memoryThreshold = 100, // MB
    reportingInterval = 1000, // ms
  } = options

  const [metrics, setMetrics] = useState<AdvancedPerformanceMetrics>({
    fps: 60,
    averageFrameTime: 16.67,
    frameDrops: 0,
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryPressure: 'low',
    connectionType: 'unknown',
    effectiveConnectionType: '4g',
    downlink: 10,
    rtt: 100,
    devicePixelRatio: 1,
    screenResolution: '1920x1080',
    viewportSize: '1920x1080',
    isSlowDevice: false,
    isLowMemoryDevice: false,
    isSlowNetwork: false,
  })

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const frameTimesRef = useRef<number[]>([])
  const rafIdRef = useRef<number>()

  // FPS and frame time monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return

    const measureFrame = (timestamp: number) => {
      const frameTime = timestamp - lastTimeRef.current
      frameTimesRef.current.push(frameTime)
      
      // Keep only last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift()
      }
      
      frameCountRef.current++
      lastTimeRef.current = timestamp
      
      rafIdRef.current = requestAnimationFrame(measureFrame)
    }

    rafIdRef.current = requestAnimationFrame(measureFrame)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  // Calculate performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now()
      const timeElapsed = now - (lastTimeRef.current - frameTimesRef.current.length * 16.67)
      
      if (timeElapsed > 0 && frameCountRef.current > 0) {
        const fps = Math.round((frameCountRef.current * 1000) / timeElapsed)
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
        const frameDrops = frameTimesRef.current.filter(time => time > 33.33).length
        
        setMetrics(prev => ({
          ...prev,
          fps,
          averageFrameTime: avgFrameTime,
          frameDrops,
          isSlowDevice: fps < fpsThreshold || avgFrameTime > 33.33,
        }))
        
        frameCountRef.current = 0
      }
    }, reportingInterval)

    return () => clearInterval(interval)
  }, [fpsThreshold, reportingInterval])

  // Memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring || typeof window === 'undefined') return

    const updateMemoryMetrics = () => {
      // @ts-ignore - performance.memory is experimental
      if (performance.memory) {
        // @ts-ignore
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory
        
        const usedMB = usedJSHeapSize / 1048576
        const totalMB = totalJSHeapSize / 1048576
        const limitMB = jsHeapSizeLimit / 1048576
        
        const memoryUsagePercent = (usedMB / limitMB) * 100
        
        let memoryPressure: 'low' | 'medium' | 'high' = 'low'
        if (memoryUsagePercent > 80) memoryPressure = 'high'
        else if (memoryUsagePercent > 60) memoryPressure = 'medium'
        
        setMetrics(prev => ({
          ...prev,
          usedJSHeapSize: usedMB,
          totalJSHeapSize: totalMB,
          jsHeapSizeLimit: limitMB,
          memoryPressure,
          isLowMemoryDevice: usedMB > memoryThreshold,
        }))
      }
    }

    updateMemoryMetrics()
    const interval = setInterval(updateMemoryMetrics, reportingInterval * 5)

    return () => clearInterval(interval)
  }, [enableMemoryMonitoring, memoryThreshold, reportingInterval])

  // Network monitoring
  useEffect(() => {
    if (!enableNetworkMonitoring || typeof window === 'undefined') return

    const updateNetworkMetrics = () => {
      // @ts-ignore - navigator.connection is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      if (connection) {
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.type || 'unknown',
          effectiveConnectionType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          isSlowNetwork: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
        }))
      }
    }

    updateNetworkMetrics()

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', updateNetworkMetrics)
      
      return () => {
        connection.removeEventListener('change', updateNetworkMetrics)
      }
    }
  }, [enableNetworkMonitoring])

  // Battery monitoring
  useEffect(() => {
    if (!enableBatteryMonitoring || typeof window === 'undefined') return

    const updateBatteryMetrics = async () => {
      try {
        // @ts-ignore - navigator.getBattery is experimental
        const battery = await navigator.getBattery?.()
        if (battery) {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level * 100,
            isCharging: battery.charging,
          }))
        }
      } catch (error) {
        console.debug('Battery API not supported')
      }
    }

    updateBatteryMetrics()
  }, [enableBatteryMonitoring])

  // Device information
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDeviceMetrics = () => {
      setMetrics(prev => ({
        ...prev,
        devicePixelRatio: window.devicePixelRatio || 1,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      }))
    }

    updateDeviceMetrics()
    window.addEventListener('resize', updateDeviceMetrics)

    return () => {
      window.removeEventListener('resize', updateDeviceMetrics)
    }
  }, [])

  // Performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = []

    if (metrics.isSlowDevice) {
      recommendations.push('Consider reducing animation complexity')
      recommendations.push('Enable reduced motion mode')
    }

    if (metrics.memoryPressure === 'high') {
      recommendations.push('High memory usage detected - consider optimizing components')
    }

    if (metrics.isSlowNetwork) {
      recommendations.push('Slow network detected - prioritize critical resources')
    }

    if (metrics.batteryLevel && metrics.batteryLevel < 20) {
      recommendations.push('Low battery detected - reduce power-intensive features')
    }

    return recommendations
  }, [metrics])

  // Performance score (0-100)
  const getPerformanceScore = useCallback(() => {
    let score = 100

    // FPS score (40% weight)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100)
    score = score * 0.4 + fpsScore * 0.4

    // Memory score (30% weight)
    const memoryScore = metrics.memoryPressure === 'low' ? 100 : 
                       metrics.memoryPressure === 'medium' ? 70 : 40
    score = score * 0.7 + memoryScore * 0.3

    // Network score (20% weight)
    const networkScore = metrics.isSlowNetwork ? 40 : 100
    score = score * 0.8 + networkScore * 0.2

    // Frame drops penalty (10% weight)
    const frameDropsScore = Math.max(0, 100 - (metrics.frameDrops * 2))
    score = score * 0.9 + frameDropsScore * 0.1

    return Math.round(score)
  }, [metrics])

  // Adaptive settings based on performance
  const getAdaptiveSettings = useCallback(() => {
    const score = getPerformanceScore()
    
    return {
      animationQuality: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      enableParallax: score > 60,
      enableAutoplay: score > 50 && !metrics.isSlowNetwork,
      imageQuality: metrics.isSlowNetwork ? 'low' : 'high',
      enablePrefetch: score > 60 && !metrics.isSlowNetwork,
      maxConcurrentRequests: metrics.isSlowNetwork ? 2 : 6,
      enableServiceWorker: score > 40,
    }
  }, [getPerformanceScore, metrics.isSlowNetwork])

  return {
    metrics,
    getRecommendations,
    getPerformanceScore,
    getAdaptiveSettings,
  }
}

// Hook for monitoring component render performance
export const useRenderPerformance = (componentName: string) => {
  const renderCountRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const [stats, setStats] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  })

  useEffect(() => {
    const startTime = performance.now()
    renderCountRef.current++

    return () => {
      const renderTime = performance.now() - startTime
      renderTimesRef.current.push(renderTime)
      
      // Keep only last 10 renders
      if (renderTimesRef.current.length > 10) {
        renderTimesRef.current.shift()
      }

      const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length

      setStats({
        renderCount: renderCountRef.current,
        averageRenderTime,
        lastRenderTime: renderTime,
      })

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return stats
}

// Hook for optimizing images based on device capabilities
export const useImageOptimization = () => {
  const { metrics } = useAdvancedPerformance()
  
  const getOptimalImageProps = useCallback((originalSrc: string, options: {
    width?: number
    height?: number
    quality?: number
  } = {}) => {
    const { width, height, quality = 80 } = options
    
    // Adjust quality based on network speed
    let adaptiveQuality = quality
    if (metrics.isSlowNetwork) {
      adaptiveQuality = Math.min(quality, 50)
    } else if (metrics.effectiveConnectionType === '4g') {
      adaptiveQuality = Math.min(quality, 90)
    }
    
    // Adjust dimensions based on device pixel ratio and viewport
    const dpr = metrics.devicePixelRatio
    const adaptiveWidth = width ? Math.round(width * dpr) : undefined
    const adaptiveHeight = height ? Math.round(height * dpr) : undefined
    
    return {
      src: originalSrc,
      width: adaptiveWidth,
      height: adaptiveHeight,
      quality: adaptiveQuality,
      loading: metrics.isSlowNetwork ? 'lazy' as const : 'eager' as const,
      decoding: 'async' as const,
    }
  }, [metrics])
  
  return { getOptimalImageProps }
}